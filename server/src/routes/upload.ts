import { Router } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import prisma from '../db.js';
import { scrapeWebsite, analyzeWebsiteContent } from '../utils/scraper.js';

const router = Router();

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const SUPPORTED_TEXT_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/json',
    'text/csv'
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE }
});

function getExtension(filename: string): string {
    const parts = filename.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
}

function isSupportedFile(file: Express.Multer.File): boolean {
    const extension = getExtension(file.originalname);

    if (SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
        return true;
    }

    if (SUPPORTED_TEXT_TYPES.has(file.mimetype)) {
        return true;
    }

    return ['pdf', 'docx', 'txt', 'md', 'json', 'csv', 'png', 'jpg', 'jpeg', 'webp'].includes(extension);
}

function normalizeWhitespace(text: string): string {
    if (!text) return '';
    // Single pass optimization for common whitespace issues
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function chunkText(text: string, chunkSize: number = 2200, overlap: number = 250): string[] {
    if (!text) return [];

    const chunks: string[] = [];
    let start = 0;
    const textLength = text.length;

    // Use a simpler sliding window for large texts to avoid expensive array splits
    while (start < textLength) {
        let end = start + chunkSize;
        
        // Try to find a natural break (newline or space) near the end of the chunk
        if (end < textLength) {
            const nextNewline = text.lastIndexOf('\n', end);
            if (nextNewline > start + (chunkSize * 0.8)) {
                end = nextNewline;
            } else {
                const nextSpace = text.lastIndexOf(' ', end);
                if (nextSpace > start + (chunkSize * 0.8)) {
                    end = nextSpace;
                }
            }
        }

        const chunk = text.slice(start, end).trim();
        if (chunk) {
            chunks.push(chunk);
        }

        // Move start forward, keeping the overlap
        start = end - overlap;
        if (start < 0) start = 0;
        
        // Safety break to prevent infinite loops and limit total chunks
        if (chunks.length >= 300) break; 
        if (start >= textLength - overlap) break;
    }

    return chunks;
}

// Simple queue to prevent concurrent heavy processing
let processingQueue = Promise.resolve();

async function extractDocumentText(file: Express.Multer.File): Promise<string> {
    // Wrap the heavy work in the queue
    return new Promise((resolve, reject) => {
        processingQueue = processingQueue.then(async () => {
            try {
                const extension = getExtension(file.originalname);

                if (file.mimetype === 'application/pdf' || extension === 'pdf') {
                    const parser = new PDFParse({ data: file.buffer });
                    const data = await parser.getText();
                    resolve(data.text || '');
                    return;
                }

                if (
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    extension === 'docx'
                ) {
                    const result = await mammoth.extractRawText({ buffer: file.buffer });
                    resolve(result.value || '');
                    return;
                }

                if (
                    file.mimetype.startsWith('text/') ||
                    file.mimetype === 'application/json' ||
                    file.mimetype === 'text/csv' ||
                    ['txt', 'md', 'json', 'csv'].includes(extension)
                ) {
                    resolve(file.buffer.toString('utf-8'));
                    return;
                }

                resolve('');
            } catch (err) {
                reject(err);
            }
        }).catch((err) => {
            console.error("Queue error:", err);
            // Don't block the next item if one fails
            return; 
        });
    });
}

function getStoredContent(file: Express.Multer.File, cleanText: string): string {
    if (SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    if (!cleanText) {
        return '';
    }

    return cleanText.slice(0, 5000);
}

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;

        const chatId = req.body.chatId || req.query.chatId;
        const userId = req.body.userId || req.query.userId;
        const department = req.body.department || req.query.department;
        const category = req.body.category || req.query.category || 'general';


        let effectiveChatId = String(chatId);
        if (effectiveChatId === 'global-knowledge-base') {
            effectiveChatId = `kb-universal-${userId}`;
        }

        if (!chatId || !userId || !department) {
            return res.status(400).json({ error: 'Missing chatId, userId, or department' });
        }

        if (!isSupportedFile(file)) {
            return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, PNG, JPG, WEBP, TXT, MD, JSON, or CSV.' });
        }

        const existingSession = await prisma.chatSession.findUnique({
            where: { id: effectiveChatId },
            select: { id: true }
        });

        if (!existingSession) {
            await prisma.chatSession.create({
                data: {
                    id: effectiveChatId,
                    userId: String(userId),
                    department: String(department),
                    title: `New ${department} chat`
                }
            });
        }

        const text = await extractDocumentText(file);
        const cleanText = normalizeWhitespace(text);
        const chunks = cleanText ? chunkText(cleanText) : [];
        const storedContent = getStoredContent(file, cleanText);

        await prisma.$transaction([
            prisma.documentChunk.deleteMany({
                where: {
                    chatId: effectiveChatId,
                    source: file.originalname
                }
            }),
            prisma.chatDocument.deleteMany({
                where: {
                    chatId: effectiveChatId,
                    name: file.originalname
                }
            }),
            prisma.chatDocument.create({
                data: {
                    chatId: effectiveChatId,
                    name: file.originalname,
                    type: file.mimetype,
                    category: String(category),
                    content: storedContent

                }
            }),
            ...(chunks.length > 0
                ? [
                    prisma.documentChunk.createMany({
                        data: chunks.map(chunk => ({
                            chatId: effectiveChatId,
                            content: chunk,
                            source: file.originalname
                        }))
                    })
                ]
                : [])
        ]);

        res.json({
            success: true,
            chunks: chunks.length,
            extractedCharacters: cleanText.length,
            message: `Processed ${file.originalname}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error processing upload' });
    }
});

router.post('/url', async (req, res) => {
    try {
        const chatId = req.body.chatId || req.query.chatId;
        const userId = req.body.userId || req.query.userId;
        const department = req.body.department || req.query.department;
        const { url, dryRun, category = 'general' } = req.body;


        let effectiveChatId = String(chatId);
        if (effectiveChatId === 'global-knowledge-base') {
            effectiveChatId = `kb-universal-${userId}`;
        }

        if (!url || !chatId || !userId || !department) {
            return res.status(400).json({ error: 'Missing url, chatId, userId, or department' });
        }

        const existingSession = await prisma.chatSession.findUnique({
            where: { id: effectiveChatId },
            select: { id: true }
        });

        if (!existingSession) {
            await prisma.chatSession.create({
                data: {
                    id: effectiveChatId,
                    userId: String(userId),
                    department: String(department),
                    title: `New ${department} chat`
                }
            });
        }

        const rawContent = await scrapeWebsite(url);
        const analysisText = await analyzeWebsiteContent(rawContent, '');

        const filename = url;
        const cleanText = normalizeWhitespace(analysisText);

        if (dryRun) {
            return res.json({
                success: true,
                dryRun: true,
                scrapedText: cleanText,
                url: url
            });
        }

        const chunks = cleanText ? chunkText(cleanText) : [];
        const storedContent = cleanText.slice(0, 5000);


        await prisma.$transaction([
            prisma.documentChunk.deleteMany({
                where: {
                    chatId: effectiveChatId,
                    source: filename
                }
            }),
            prisma.chatDocument.deleteMany({
                where: {
                    chatId: effectiveChatId,
                    name: filename
                }
            }),
            prisma.chatDocument.create({
                data: {
                    chatId: effectiveChatId,
                    name: filename,
                    type: 'text/html',
                    category: String(category),
                    content: storedContent

                }
            }),
            ...(chunks.length > 0
                ? [
                    prisma.documentChunk.createMany({
                        data: chunks.map(chunk => ({
                            chatId: effectiveChatId,
                            content: chunk,
                            source: filename
                        }))
                    })
                ]
                : [])
        ]);

        res.json({
            success: true,
            chunks: chunks.length,
            extractedCharacters: cleanText.length,
            message: `Processed URL ${filename}`,
            document: {
               id: Date.now().toString(),
               name: filename,
               type: 'text/html',
               content: storedContent,
               uploadedAt: Date.now(),
               chatId: effectiveChatId
            }
        });

    } catch (error: any) {
        console.error('Upload URL error:', error);
        res.status(500).json({ error: error.message || 'Internal server error processing URL' });
    }
});

router.delete('/', async (req, res) => {
    try {
        let { chatId, filename, userId } = req.query;

        let effectiveChatId = String(chatId);
        if (effectiveChatId === 'global-knowledge-base') {
            effectiveChatId = `kb-universal-${userId}`;
        }

        if (!chatId || !filename || !userId) {
            return res.status(400).json({ error: 'Missing chatId, filename, or userId' });
        }

        const session = await prisma.chatSession.findUnique({
            where: { id: effectiveChatId },
            select: { userId: true }
        });

        if (!session) {
            return res.status(404).json({ error: 'Chat session not found' });
        }

        const chunkDelete = prisma.documentChunk.deleteMany({
            where: {
                chatId: effectiveChatId,
                source: String(filename)
            }
        });

        const docDelete = prisma.chatDocument.deleteMany({
            where: {
                chatId: effectiveChatId,
                name: String(filename)
            }
        });

        const [chunkResult] = await prisma.$transaction([chunkDelete, docDelete]);

        res.json({
            success: true,
            deletedCount: chunkResult.count,
            message: `Deleted chunks and document record for ${filename}`
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Internal server error deleting document' });
    }
});

});

router.post('/save-text', async (req, res) => {
    try {
        const { chatId, userId, department, filename, content, category = 'general' } = req.body;

        if (!content || !chatId || !userId || !department || !filename) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let effectiveChatId = String(chatId);
        if (effectiveChatId === 'global-knowledge-base') {
            effectiveChatId = `kb-universal-${userId}`;
        }

        const existingSession = await prisma.chatSession.findUnique({
            where: { id: effectiveChatId },
            select: { id: true }
        });

        if (!existingSession) {
            await prisma.chatSession.create({
                data: {
                    id: effectiveChatId,
                    userId: String(userId),
                    department: String(department),
                    title: `New ${department} chat`
                }
            });
        }

        const cleanText = normalizeWhitespace(content);
        const chunks = chunkText(cleanText);
        const storedContent = cleanText.slice(0, 5000);

        await prisma.$transaction([
            prisma.documentChunk.deleteMany({
                where: {
                    chatId: effectiveChatId,
                    source: filename
                }
            }),
            prisma.chatDocument.deleteMany({
                where: {
                    chatId: effectiveChatId,
                    name: filename
                }
            }),
            prisma.chatDocument.create({
                data: {
                    chatId: effectiveChatId,
                    name: filename,
                    type: 'text/plain',
                    category: String(category),
                    content: storedContent
                }
            }),
            prisma.documentChunk.createMany({
                data: chunks.map(chunk => ({
                    chatId: effectiveChatId,
                    content: chunk,
                    source: filename
                }))
            })
        ]);

        res.json({
            success: true,
            message: `Saved text as ${filename}`
        });
    } catch (error: any) {
        console.error('Save text error:', error);
        res.status(500).json({ error: error.message || 'Internal server error saving text' });
    }
});

export default router;

