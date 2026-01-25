
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../utils/prompts.js';
import { IntakeData, Department, Message, StoredDocument } from '../types.js';
import prisma from '../db.js';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Database now used instead of in-memory store


// GET /api/chat/department/:department
// Get all chats for a department
router.get('/department/:department', async (req, res) => {
    try {
        const { department } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const deptChats = await prisma.chatSession.findMany({
            where: {
                department,
                userId: String(userId)
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, createdAt: true }
        });

        res.json({
            chats: deptChats.map(c => ({
                id: c.id,
                title: c.title,
                createdAt: c.createdAt.getTime()
            }))
        });
    } catch (error) {
        console.error('Error fetching department chats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/chat/session/:chatId
// Get specific chat history
router.get('/session/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId } = req.query;

        const chat = await prisma.chatSession.findUnique({
            where: { id: chatId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                documents: true
            }
        });

        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        // Enforce ownership
        if (userId && chat.userId !== String(userId)) {
            return res.status(403).json({ error: 'Unauthorized access to this chat session' });
        }

        // Map DB messages to API format
        const history = chat.messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.createdAt.getTime(),
            escalation: m.escalation as any
        }));

        const documents = (chat as any).documents.map((d: any) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            content: d.content,
            uploadedAt: new Date(d.createdAt).getTime()
        }));

        res.json({ history, documents });
    } catch (error) {
        console.error('Error fetching chat session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/chat/session/:chatId
router.delete('/session/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        await prisma.chatSession.delete({
            where: { id: chatId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat:', error);
        // Prisma throws error if not found? code P2025
        res.status(500).json({ error: 'Failed to delete chat' });
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
            chatId,
            userId,
            modelProvider = 'gemini',
            model
        }: {
            clientData: IntakeData;
            department: Department;
            userMessage: string;
            contextDocs: StoredDocument[];
            chatId?: string;
            userId: string;
            modelProvider?: 'gemini' | 'openai';
            model?: string;
        } = req.body;

        if (!department || !userMessage || !userId) {
            return res.status(400).json({ error: 'Missing department, message, or userId' });
        }

        // Generate or retrieve chat session
        const currentChatId = chatId || crypto.randomUUID();

        // Ensure chat session exists in DB
        const session = await prisma.chatSession.upsert({
            where: { id: currentChatId },
            update: {},
            create: {
                id: currentChatId,
                department,
                userId,
                title: userMessage.substring(0, 40) + (userMessage.length > 40 ? '...' : ''),
            }
        });

        // Store user message
        const userMsg = await prisma.chatMessage.create({
            data: {
                chat: { connect: { id: session.id } },
                role: 'user',
                content: userMessage,
            }
        });

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        if (!process.env.API_KEY) {
            // Mock streaming response
            const mockText = "API Key is missing on server. Simulating response: " + userMessage;
            const words = mockText.split(' ');

            for (const word of words) {
                res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
                await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
            }

            const escalation = { required: false };
            const assistantMsg = await prisma.chatMessage.create({
                data: {
                    chat: { connect: { id: session.id } },
                    role: 'assistant',
                    content: mockText,
                    escalation: escalation
                }
            });

            res.write(`data: ${JSON.stringify({
                done: true,
                escalation,
                messageId: assistantMsg.id,
                chatId: currentChatId,
                title: session.title,
                text: mockText
            })}\n\n`);
            return res.end();
        }

        // Prepare system prompt
        let systemInstruction = buildSystemPrompt(clientData, department);

        // Context Docs
        if (contextDocs && contextDocs.length > 0) {
            const docList = contextDocs.map(d => `- ${d.name} (${d.type})`).join('\n');
            systemInstruction += `\n\nAVAILABLE CONTEXT REPOSITORY DOCUMENTS:\n${docList}\n\nYou have access to the contents of these documents. You must prioritize information found in these documents over general knowledge. If the answer to the user's question is contained within these documents, cite the document name explicitly.`;
        }

        // Fetch PDF chunks from DB
        const dbChunks = await prisma.documentChunk.findMany({
            where: { chatId: currentChatId }
        });

        if (dbChunks.length > 0) {
            // Simple relevance scoring: count overlap of words
            const queryTerms = userMessage.toLowerCase().split(/\s+/).filter(t => t.length > 2);

            const scoredChunks = dbChunks.map((chunk: any) => {
                const text = chunk.content.toLowerCase();
                let score = 0;
                queryTerms.forEach((term: string) => {
                    if (text.includes(term)) score++;
                });
                return { chunk, score };
            });

            // specific "Relevant chunks" logic: Sort by score DESC
            // Take top 15 (approx 45KB max)
            scoredChunks.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
            const selectedChunks = scoredChunks.slice(0, 15).map((s: { chunk: any }) => s.chunk);

            if (selectedChunks.length > 0) {
                let chunkContext = "\n\nRELEVANT PDF EXCERPTS (Use these to answer):\n";
                selectedChunks.forEach((c: any, i: number) => {
                    chunkContext += `\n--- Chunk ${i + 1} from ${c.source} ---\n${c.content}\n`;
                });
                systemInstruction += chunkContext;
            }
        }

        // Call Gemini
        // Context Retrieval for History
        const previousMessages = await prisma.chatMessage.findMany({
            where: { chatId: session.id, id: { not: userMsg.id } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        const prevMsgsAsc = previousMessages.reverse();

        let fullResponseText = "";

        if (modelProvider === 'openai') {
            const messages: any[] = [
                { role: 'system', content: systemInstruction }
            ];

            // Add History
            prevMsgsAsc.forEach(msg => {
                messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
            });

            // Add Context Docs as User message context
            let contextMsg = "";
            contextDocs.forEach(doc => {
                contextMsg += `\n[Reference: ${doc.name} (${doc.type})]\n${doc.content.substring(0, 2000)}...\n`;
            });
            if (contextMsg) {
                messages.push({ role: 'system', content: `Context Documents:\n${contextMsg}` });
            }

            messages.push({ role: 'user', content: userMessage });

            try {
                const stream = await openai.chat.completions.create({
                    model: model || 'gpt-4o',
                    messages: messages,
                    stream: true,
                });

                for await (const chunk of stream) {
                    const chunkText = chunk.choices[0]?.delta?.content || "";
                    if (chunkText) {
                        fullResponseText += chunkText;
                        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                    }
                }
            } catch (err: any) {
                console.error("OpenAI Error:", err);
                res.write(`data: ${JSON.stringify({ text: "Error calling OpenAI: " + err.message })}\n\n`);
                fullResponseText += "Error calling OpenAI: " + err.message;
            }

        } else {
            // Gemini Logic
            const geminiModel = model || "gemini-2.0-flash-exp";
            const chat = ai.chats.create({
                model: geminiModel,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                },
            });

            const messageParts: any[] = [];

            // Add Docs (Gemini style)
            contextDocs.forEach(doc => {
                if (doc.type === 'application/pdf') {
                    messageParts.push({ text: `\n[Reference PDF: ${doc.name} (Content processed as text chunks)]\n` });
                } else if (doc.type.startsWith('image/')) {
                    const base64Data = doc.content.split(',')[1] || doc.content;
                    if (base64Data) {
                        messageParts.push({
                            inlineData: { mimeType: doc.type, data: base64Data }
                        });
                        messageParts.push({ text: `[Image Reference: ${doc.name}]` });
                    }
                } else {
                    messageParts.push({ text: `\n\n--- BEGIN DOCUMENT: ${doc.name} ---\n${doc.content}\n--- END DOCUMENT ---\n\n` });
                }
            });

            // Add History
            const historyContext = prevMsgsAsc.map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n");
            if (historyContext) {
                messageParts.push({ text: `\nPREVIOUS CONVERSATION:\n${historyContext}\n` });
            }

            messageParts.push({ text: `USER QUERY: ${userMessage}` });

            const result = await chat.sendMessageStream({ message: messageParts });

            for await (const chunk of result) {
                const chunkText = chunk.text || "";
                fullResponseText += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // Check Escalation
        const escalationKeywords = ["escalate", "approval required", "outside my scope", "requires approval"];
        let escalation = { required: false, reason: '', approver: clientData.decision_approver };

        for (const keyword of escalationKeywords) {
            if (fullResponseText.toLowerCase().includes(keyword)) {
                escalation.required = true;
                escalation.reason = keyword;
                break;
            }
        }

        // Store assistant response
        const assistantMsg = await prisma.chatMessage.create({
            data: {
                chat: { connect: { id: session.id } },
                role: 'assistant',
                content: fullResponseText,
                escalation: escalation
            }
        });

        // Send final event with metadata
        res.write(`data: ${JSON.stringify({
            done: true,
            escalation,
            messageId: assistantMsg.id,
            chatId: currentChatId,
            title: session.title,
            text: fullResponseText // Send full text effectively as a confirmation/sync
        })}\n\n`);

        res.end();

    } catch (error) {
        console.error('Chat API Error:', error);
        // If headers haven't been sent, we can send a 500
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            // Otherwise, we have to end the stream with an error indicator if possible, or just close it.
            // A common pattern is sending an error event.
            res.write(`data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`);
            res.end();
        }
    }
});

export default router;
