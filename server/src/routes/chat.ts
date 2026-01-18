
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt } from '../utils/prompts.js';
import { IntakeData, Department, Message, StoredDocument } from '../types.js';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// In-memory store
// In real app: DB tables "Chat" and "Message"
interface ChatSession {
    id: string;
    department: Department;
    title: string;
    createdAt: number;
    messages: Message[];
}

const chats: Record<string, ChatSession> = {};

// GET /api/chat/department/:department
// Get all chats for a department
router.get('/department/:department', (req, res) => {
    const { department } = req.params;
    const deptChats = Object.values(chats)
        .filter(c => c.department === department)
        .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ chats: deptChats.map(c => ({ id: c.id, title: c.title, createdAt: c.createdAt })) });
});

// GET /api/chat/session/:chatId
// Get specific chat history
router.get('/session/:chatId', (req, res) => {
    const { chatId } = req.params;
    const chat = chats[chatId];
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json({ history: chat.messages });
});

// DELETE /api/chat/session/:chatId
router.delete('/session/:chatId', (req, res) => {
    const { chatId } = req.params;
    if (chats[chatId]) {
        delete chats[chatId];
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Chat not found' });
    }
});

// POST /api/chat
// Send message (creates new chat if chatId not provided)
router.post('/', async (req, res) => {
    try {
        const {
            clientData,
            department,
            userMessage,
            contextDocs = [],
            chatId
        }: {
            clientData: IntakeData;
            department: Department;
            userMessage: string;
            contextDocs: StoredDocument[];
            chatId?: string;
        } = req.body;

        if (!department || !userMessage) {
            return res.status(400).json({ error: 'Missing department or message' });
        }

        // Generate or retrieve chat session
        const currentChatId = chatId || crypto.randomUUID();
        if (!chats[currentChatId]) {
            chats[currentChatId] = {
                id: currentChatId,
                department,
                title: userMessage.substring(0, 40) + (userMessage.length > 40 ? '...' : ''),
                createdAt: Date.now(),
                messages: []
            };
        }
        const session = chats[currentChatId];

        // Store user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
        };
        session.messages.push(userMsg);

        if (!process.env.API_KEY) {
            // Mock response
            const mockResponse = {
                text: "API Key is missing on server. Simulating response: " + userMessage,
                escalation: { required: false }
            };

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: mockResponse.text,
                timestamp: Date.now(),
                escalation: mockResponse.escalation
            };
            session.messages.push(assistantMsg);

            return res.json({
                text: mockResponse.text,
                escalation: mockResponse.escalation,
                messageId: assistantMsg.id,
                chatId: currentChatId,
                title: session.title
            });
        }

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
            if (doc.type.startsWith('image/') || doc.type === 'application/pdf') {
                const base64Data = doc.content.split(',')[1] || doc.content;
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

        // Add History (last 10)
        const historyContext = session.messages.slice(-11, -1).map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n");
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
        session.messages.push(assistantMsg);

        res.json({
            text: responseText,
            escalation,
            messageId: assistantMsg.id,
            chatId: currentChatId,
            title: session.title
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
