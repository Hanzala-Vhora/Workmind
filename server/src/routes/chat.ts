
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt } from '../utils/prompts.js';
import { IntakeData, Department, Message, StoredDocument } from '../types.js';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// In-memory store for chat messages - in a real app this would be in a DB
// Key: departmentId (or just department name since we have one workspace active usually)
const chatHistory: Record<string, Message[]> = {};

// GET /api/chat/:department
router.get('/:department', (req, res) => {
    const { department } = req.params;
    const history = chatHistory[department] || [];
    res.json({ history });
});

// POST /api/chat
router.post('/', async (req, res) => {
    try {
        const {
            clientData,
            department,
            userMessage,
            contextDocs = []
        }: {
            clientData: IntakeData;
            department: Department;
            userMessage: string;
            contextDocs: StoredDocument[];
        } = req.body;

        if (!department || !userMessage) {
            return res.status(400).json({ error: 'Missing department or message' });
        }

        if (!process.env.API_KEY) {
            // Mock response if no API key
            const mockResponse = {
                text: "API Key is missing on server. Simulating response: " + userMessage,
                escalation: { required: false }
            };

            // Store user message
            const userMsg: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: userMessage,
                timestamp: Date.now()
            };

            if (!chatHistory[department]) chatHistory[department] = [];
            chatHistory[department].push(userMsg);

            // Store assistant message
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: mockResponse.text,
                timestamp: Date.now(),
                escalation: mockResponse.escalation
            };
            chatHistory[department].push(assistantMsg);

            return res.json(mockResponse);
        }

        // Initialize history if needed
        if (!chatHistory[department]) chatHistory[department] = [];

        // Store user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
        };
        chatHistory[department].push(userMsg);

        // Prepare system prompt
        let systemInstruction = buildSystemPrompt(clientData, department);

        // Context Docs
        if (contextDocs && contextDocs.length > 0) {
            const docList = contextDocs.map(d => `- ${d.name} (${d.type})`).join('\n');
            systemInstruction += `\n\nAVAILABLE CONTEXT REPOSITORY DOCUMENTS:\n${docList}\n\nYou have access to the contents of these documents. You must prioritize information found in these documents over general knowledge. If the answer to the user's question is contained within these documents, cite the document name explicitly.`;
        }

        // Call Gemini
        const model = "gemini-2.0-flash-exp";
        const chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
            },
        });

        const messageParts: any[] = [];

        // Add Docs to parts
        contextDocs.forEach(doc => {
            // Basic text handling or image handling
            if (doc.type.startsWith('image/') || doc.type === 'application/pdf') {
                const base64Data = doc.content.split(',')[1] || doc.content; // ensure base64
                if (base64Data) {
                    messageParts.push({
                        inlineData: {
                            mimeType: doc.type,
                            data: base64Data
                        }
                    });
                    messageParts.push({ text: `[Document Reference: ${doc.name}]` });
                }
            } else {
                messageParts.push({ text: `\n\n--- BEGIN DOCUMENT: ${doc.name} ---\n${doc.content}\n--- END DOCUMENT ---\n\n` });
            }
        });

        // Add History
        // We only send the last few messages to keep context window manageable if needed, 
        // or send all if model supports large context.
        const historyContext = chatHistory[department].slice(-10, -1).map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n");
        if (historyContext) {
            messageParts.push({ text: `\nPREVIOUS CONVERSATION:\n${historyContext}\n` });
        }

        // Add User Message
        messageParts.push({ text: `USER QUERY: ${userMessage}` });

        const response = await chat.sendMessage({ message: messageParts });

        const responseText = response.text || "I apologize, no response generated.";

        // Check Escalation
        const escalationKeywords = ["escalate", "approval required", "outside my scope", "requires approval"];
        let escalation = { required: false, reason: '', approver: clientData.decision_approver };

        for (const keyword of escalationKeywords) {
            if (responseText.toLowerCase().includes(keyword)) {
                escalation.required = true;
                escalation.reason = keyword;
                break;
            }
        }

        // Store assistant response
        const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText,
            timestamp: Date.now(),
            escalation
        };
        chatHistory[department].push(assistantMsg);

        res.json({
            text: responseText,
            escalation,
            messageId: assistantMsg.id
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
