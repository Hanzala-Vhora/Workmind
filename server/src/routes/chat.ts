
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../utils/prompts.js';
import { IntakeData, Department, Message, StoredDocument } from '../types.js';
import prisma from '../db.js';
import { deductCredits } from '../utils/billing.js';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

function getProviderApiKey(modelProvider: 'gemini' | 'openai' | 'claude'): string {
    if (modelProvider === 'openai') return process.env.OPENAI_API_KEY || '';
    if (modelProvider === 'claude') return process.env.ANTHROPIC_API_KEY || '';
    return process.env.API_KEY || '';
}

function toInlineImageContent(doc: StoredDocument) {
    const base64Data = doc.content.split(',')[1] || doc.content;
    return base64Data
        ? {
            type: 'image' as const,
            source: {
                type: 'base64' as const,
                media_type: doc.type,
                data: base64Data
            }
        }
        : null;
}

async function streamClaudeResponse(params: {
    model: string;
    systemInstruction: string;
    previousMessages: Array<{ role: string; content: string }>;
    contextDocs: StoredDocument[];
    userMessage: string;
    res: any;
}) {
    const { model, systemInstruction, previousMessages, contextDocs, userMessage, res } = params;

    const contentBlocks: any[] = [];

    contextDocs.forEach(doc => {
        if (doc.type.startsWith('image/')) {
            const imageBlock = toInlineImageContent(doc);
            if (imageBlock) {
                contentBlocks.push(imageBlock);
                contentBlocks.push({ type: 'text', text: `[Image reference: ${doc.name}]` });
            }
            return;
        }

        contentBlocks.push({
            type: 'text',
            text: `[Reference: ${doc.name} (${doc.type})]\n${doc.content.slice(0, 12000)}`
        });
    });

    contentBlocks.push({ type: 'text', text: userMessage });

    const anthropicMessages = [
        ...previousMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        })),
        { role: 'user', content: contentBlocks }
    ];

    const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model,
            system: systemInstruction,
            messages: anthropicMessages,
            stream: true
        })
    });

    if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`Claude request failed: ${response.status} ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponseText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
            const lines = event.split('\n');
            const dataLine = lines.find(line => line.startsWith('data: '));
            if (!dataLine) continue;

            const payload = dataLine.slice(6).trim();
            if (!payload || payload === '[DONE]') continue;

            const parsed = JSON.parse(payload);
            const chunkText = parsed?.delta?.text || '';

            if (parsed?.type === 'content_block_delta' && chunkText) {
                fullResponseText += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }
    }

    return fullResponseText;
}

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

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

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
        if (chat.userId !== String(userId)) {
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
            uploadedAt: new Date(d.createdAt).getTime(),
            chatId: d.chatId
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
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const session = await prisma.chatSession.findUnique({
            where: { id: chatId },
            select: { userId: true }
        });

        if (!session) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (session.userId !== String(userId)) {
            return res.status(403).json({ error: 'Unauthorized access to this chat session' });
        }

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
        let {
            clientData,
            department,
            userMessage,
            contextDocs = [],
            chatId,
            userId,
            modelProvider,
            model
        }: {
            clientData: IntakeData;
            department: Department;
            userMessage: string;
            contextDocs: StoredDocument[];
            chatId?: string;
            userId: string;
            modelProvider?: 'gemini' | 'openai' | 'claude';
            model?: string;
        } = req.body;

        if (!department || !userMessage || !userId) {
            return res.status(400).json({ error: 'Missing department, message, or userId' });
        }

        // Check Credits and Permissions
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        if (user && user.credits <= 0) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.write(`data: ${JSON.stringify({ error: 'Insufficient credits. Please top up your wallet.' })}\n\n`);
            return res.end();
        }

        // Check if provider is allowed
        if (user && modelProvider && !user.allowedModels.includes(modelProvider)) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.write(`data: ${JSON.stringify({ error: `Access Denied: You are not authorized to use ${modelProvider} models.` })}\n\n`);
            return res.end();
        }

        // If provider/model not in request, fetch from database or env
        if (!modelProvider || !model) {
            try {
                const dbSettings = await prisma.systemSetting.findMany({
                    where: { key: { in: ['DEFAULT_MODEL_PROVIDER', 'DEFAULT_MODEL'] } }
                });
                const settingsMap = dbSettings.reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {} as Record<string, string>);

                if (!modelProvider) {
                    modelProvider = (settingsMap['DEFAULT_MODEL_PROVIDER'] || process.env.DEFAULT_MODEL_PROVIDER || 'gemini') as any;
                }
                if (!model) {
                    model = settingsMap['DEFAULT_MODEL'] || process.env.DEFAULT_MODEL || '';
                }
            } catch (err) {
                console.warn('Failed to fetch DB settings in chat, using fallback:', err);
                if (!modelProvider) modelProvider = (process.env.DEFAULT_MODEL_PROVIDER as any) || 'gemini';
                if (!model) model = process.env.DEFAULT_MODEL || '';
            }
        }

        // Generate or retrieve chat session
        const currentChatId = chatId || crypto.randomUUID();

        const existingSession = await prisma.chatSession.findUnique({
            where: { id: currentChatId },
            select: { id: true, userId: true, title: true }
        });

        if (existingSession && existingSession.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to this chat session' });
        }

        const session = existingSession
            ? await prisma.chatSession.update({
                where: { id: currentChatId },
                data: existingSession.title ? {} : {
                    title: userMessage.substring(0, 40) + (userMessage.length > 40 ? '...' : '')
                }
            })
            : await prisma.chatSession.create({
                data: {
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

        const providerApiKey = getProviderApiKey((modelProvider || 'gemini') as 'gemini' | 'openai' | 'claude');

        if (!providerApiKey) {
            // Mock streaming response
            const mockText = `API key for ${modelProvider} is missing on server. Simulating response: ${userMessage}`;
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

        if (!clientData || Object.keys(clientData).length === 0) {
            console.log(`[DEBUG] clientData is missing for user ${userId}. Fetching from DB...`);
            try {
                const workspace = await prisma.workspace.findFirst({
                    where: { userId },
                    include: { intakeForms: { orderBy: { updatedAt: 'desc' }, take: 1 } }
                });

                if (workspace && workspace.intakeForms.length > 0) {
                    const form = workspace.intakeForms[0];
                    clientData = {
                        business_name: form.companyName,
                        industry: form.industry,
                        sub_sector: '',
                        business_model: 'B2B',
                        stage: form.currentState || 'Growth',
                        countries_served: [],
                        hq_location: '',
                        founders_roles: '',
                        primary_contact: form.contactEmail,

                        main_offer: '',
                        icp: '',
                        buyer_roles: '',
                        main_pain: '',
                        promise: '',
                        competitors: [],
                        key_objections: '',
                        usp: '',

                        revenue_streams: '',
                        pricing_model: 'One-time',
                        price_points: '',
                        sales_cycle: '1-3 months',
                        revenue_target_90d: '',
                        revenue_target_12m: '',

                        lead_sources: [],
                        working_channels: '',
                        failing_channels: '',
                        sales_mechanism: '',
                        crm_tool: '',
                        close_rate: '',

                        delivery_process: '',
                        tool_stack: [],
                        broken_workflows: '',
                        time_wasters: '',
                        has_sops: 'No',
                        team_structure: '',
                        decision_approver: '',

                        is_regulated: 'No',
                        regulatory_details: '',
                        sensitive_data: 'None',
                        restricted_policies: '',

                        brand_tone: 'Professional',
                        brand_keywords: '',
                        writing_samples: '',
                        interaction_style: 'Collaborative',

                        deliverables: [],
                        output_format: 'Markdown',
                        client_facing_needed: 'No',
                        deadline: '',

                        reference_brands: '',
                        hard_constraints: '',
                        must_avoid: '',

                        department_configs: {},
                        selected_departments: [form.department as Department || department],
                        shared_context: form.sharedContext || undefined
                    };
                    console.log(`[DEBUG] Fetched clientData from DB for company: ${clientData.business_name}`);
                } else {
                    console.warn(`[WARN] No intake form found. Using defaults.`);
                    clientData = { business_name: 'Unknown Company' } as any;
                }
            } catch (dbError) {
                console.error("Error fetching fallback clientData", dbError);
                clientData = { business_name: 'Unknown Company' } as any;
            }
        }

        // Prepare system prompt
        console.log(`[DEBUG] Building prompt for Department: "${department}"`);
        let systemInstruction = buildSystemPrompt(clientData, department);
        if (clientData.shared_context) {
            systemInstruction += `\n\n--- SHARED BUSINESS CONTEXT ---\nThe following context was scraped and analyzed from the company's website and social media. It serves as the single source of truth for the company's offerings, tone, and target audience across all departments:\n${clientData.shared_context}\n-------------------------------\n`;
        }
        console.log(`[DEBUG] Generated System Prompt Preamble: ${systemInstruction.substring(0, 300)}...`);

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

        // Context Retrieval for History
        const previousMessages = await prisma.chatMessage.findMany({
            where: { chatId: session.id, id: { not: userMsg.id } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        const prevMsgsAsc = previousMessages.reverse();

        // Fetch recent cross-department context for shared memory
        try {
            const recentCrossChats = await prisma.chatMessage.findMany({
                where: { 
                    chat: { userId: session.userId, id: { not: session.id } }
                },
                include: { chat: { select: { department: true } } },
                orderBy: { createdAt: 'desc' },
                take: 15
            });

            if (recentCrossChats.length > 0) {
                let crossContext = "\n\n--- RECENT ACTIVITY FROM OTHER DEPARTMENTS (SHARED MEMORY) ---\n(Use this context if the user refers to past conversations with other experts, e.g. 'read the GTM chat with marketing')\n";
                [...recentCrossChats].reverse().forEach(msg => {
                    const snippet = msg.content.length > 400 ? msg.content.substring(0, 400) + '...' : msg.content;
                    crossContext += `[${msg.chat.department} Expert - ${msg.role.toUpperCase()}]: ${snippet}\n`;
                });
                crossContext += "----------------------------------------------\n";
                systemInstruction += crossContext;
            }
        } catch (err) {
            console.error("Failed to load cross-department context", err);
        }

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

        } else if (modelProvider === 'claude') {
            const claudeModel = model || 'claude-sonnet-4-20250514';

            try {
                fullResponseText = await streamClaudeResponse({
                    model: claudeModel,
                    systemInstruction,
                    previousMessages: prevMsgsAsc.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    contextDocs,
                    userMessage,
                    res
                });
            } catch (err: any) {
                console.error("Claude Error:", err);
                res.write(`data: ${JSON.stringify({ text: "Error calling Claude: " + err.message })}\n\n`);
                fullResponseText += "Error calling Claude: " + err.message;
            }
        } else {
            // Gemini Logic
            const geminiModel = model || "gemini-2.0-flash";
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

        // Deduct Credits (Approximate tokens if not strictly available from stream yet)
        // For production, you'd use exact token counts from the provider's final chunk
        const inputTokens = Math.ceil(systemInstruction.length / 4) + Math.ceil(userMessage.length / 4);
        const outputTokens = Math.ceil(fullResponseText.length / 4);
        
        const { totalCreditsUsed } = await deductCredits({
            userId,
            inputTokens,
            outputTokens,
            model: model || 'default',
            provider: modelProvider || 'gemini'
        });

        // Send final event with metadata
        res.write(`data: ${JSON.stringify({
            done: true,
            escalation,
            messageId: assistantMsg.id,
            chatId: currentChatId,
            title: session.title,
            creditsUsed: totalCreditsUsed,
            text: fullResponseText 
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
