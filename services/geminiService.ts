import { GoogleGenAI } from "@google/genai";
import { IntakeData, Department, Message, StoredDocument } from '../types';
import { buildSystemPrompt } from '../utils/prompts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateExpertResponse = async (
  data: IntakeData,
  department: Department,
  userMessage: string,
  history: Message[],
  contextDocs: StoredDocument[]
) => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Simulating response.");
    return {
      text: "Simulated response: The API Key is missing from the environment configuration. Please configure it to use the real Gemini API. For now, I acknowledge your message: " + userMessage,
      escalation: { required: false }
    };
  }

  let systemInstruction = buildSystemPrompt(data, department);
  
  // Inject document awareness into system instruction
  if (contextDocs.length > 0) {
    const docList = contextDocs.map(d => `- ${d.name} (${d.type})`).join('\n');
    systemInstruction += `\n\nAVAILABLE CONTEXT REPOSITORY DOCUMENTS:\n${docList}\n\nYou have access to the contents of these documents. You must prioritize information found in these documents over general knowledge. If the answer to the user's question is contained within these documents, cite the document name explicitly.`;
  }

  const model = "gemini-3-flash-preview"; 

  try {
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Lower temperature for more grounded responses
      },
    });

    // Build context prompt with history
    let contextPrompt = "";
    if (history.length > 0) {
      contextPrompt += "\n\nPREVIOUS CONVERSATION HISTORY:\n" + 
        history.slice(-6).map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n");
    }

    // Construct the parts array
    // 1. Add context documents content (text or image)
    const messageParts: any[] = [];

    // Add Documents to the context of this specific turn if they are relevant
    // For this implementation, we send ALL context docs as parts of the message
    // In production, we might use Retrieval (RAG), but for this specific "No Hallucination" requirement with uploaded files
    // passing them into the context window is the most robust way to ensure the model "sees" them.
    
    contextDocs.forEach(doc => {
      if (doc.type.startsWith('image/') || doc.type === 'application/pdf') {
         // Remove data:image/png;base64, prefix if present for clean API usage
         const base64Data = doc.content.split(',')[1] || doc.content;
         messageParts.push({
           inlineData: {
             mimeType: doc.type,
             data: base64Data
           }
         });
         messageParts.push({ text: `[Document Reference: ${doc.name}]` });
      } else {
        // Text based
        messageParts.push({ text: `\n\n--- BEGIN DOCUMENT: ${doc.name} ---\n${doc.content}\n--- END DOCUMENT ---\n\n` });
      }
    });

    // 2. Add History Context & User Query
    messageParts.push({ text: contextPrompt + "\n\nUSER QUERY: " + userMessage });

    // Send message
    const response = await chat.sendMessage({ 
      message: { parts: messageParts }
    });
    
    const responseText = response.text || "I apologize, I couldn't generate a response based on the available information.";

    // Check for escalation
    const escalationKeywords = ["escalate", "approval required", "outside my scope", "requires approval"];
    let escalation = { required: false, reason: '', approver: data.decision_approver };
    
    for (const keyword of escalationKeywords) {
      if (responseText.toLowerCase().includes(keyword)) {
        escalation.required = true;
        escalation.reason = keyword;
        break;
      }
    }

    return {
      text: responseText,
      escalation
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with the Expert Engine.");
  }
};

export const analyzeEmailThread = async (data: IntakeData, emailThread: string) => {
   if (!process.env.API_KEY) {
      return {
        summary: "Simulated Summary: API Key Missing.",
        core_issue: "Cannot analyze without API Key.",
        options: [{ title: "Option 1", description: "Configure API Key", pros: "Works", cons: "Effort" }],
        draft_response: "Please configure your API key."
      };
   }

   const prompt = `
    You are analyzing an email thread for ${data.business_name}.
    Brand Tone: ${data.brand_tone}.
    
    EMAIL THREAD:
    ${emailThread}
    
    Provide a JSON response with the following structure:
    {
      "summary": "Thread Summary (2-3 sentences)",
      "core_issue": "Core Issue (1 sentence)",
      "options": [
        { "title": "Option Name", "description": "Description", "pros": "Pros list", "cons": "Cons list" }
      ],
      "draft_response": "Recommended Draft Response (ready to send)"
    }
   `;

   try {
     const response = await ai.models.generateContent({
       model: 'gemini-3-flash-preview',
       contents: prompt,
       config: {
         responseMimeType: 'application/json'
       }
     });
     
     const jsonStr = response.text;
     if (!jsonStr) throw new Error("Empty response");
     return JSON.parse(jsonStr);

   } catch (error) {
     console.error("Analysis Error:", error);
     throw error;
   }
};