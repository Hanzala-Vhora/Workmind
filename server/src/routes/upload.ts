import { Router } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import prisma from '../db.js';

const router = Router();

const MAX_FILE_SIZE = 25 * 1024 * 1024;
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
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function chunkText(text: string, chunkSize: number = 2200, overlap: number = 250): string[] {
    const normalized = normalizeWhitespace(text);
    if (!normalized) return [];

    const paragraphs = normalized.split(/\n{2,}/).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        const candidate = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;

        if (candidate.length <= chunkSize) {
            currentChunk = candidate;
            continue;
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        if (paragraph.length <= chunkSize) {
            currentChunk = paragraph;
            continue;
        }

        let start = 0;
        while (start < paragraph.length) {
            const end = Math.min(start + chunkSize, paragraph.length);
            const slice = paragraph.slice(start, end).trim();
            if (slice) {
                chunks.push(slice);
            }
            start += Math.max(chunkSize - overlap, 1);
        }
        currentChunk = '';
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks.slice(0, 200);
}

async function extractDocumentText(file: Express.Multer.File): Promise<string> {
    const extension = getExtension(file.originalname);

    if (file.mimetype === 'application/pdf' || extension === 'pdf') {
        const parser = new PDFParse({ data: file.buffer });
        const data = await parser.getText();
        return data.text || '';
    }

    if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        extension === 'docx'
    ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value || '';
    }

    if (
        file.mimetype.startsWith('text/') ||
        file.mimetype === 'application/json' ||
        file.mimetype === 'text/csv' ||
        ['txt', 'md', 'json', 'csv'].includes(extension)
    ) {
        return file.buffer.toString('utf-8');
    }

    return '';
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

        const { chatId, userId, department } = req.body;
        if (!chatId || !userId || !department) {
            return res.status(400).json({ error: 'Missing chatId, userId, or department' });
        }

        if (!isSupportedFile(file)) {
            return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, PNG, JPG, WEBP, TXT, MD, JSON, or CSV.' });
        }

        const existingSession = await prisma.chatSession.findUnique({
            where: { id: String(chatId) },
            select: { id: true, userId: true }
        });

        if (existingSession && existingSession.userId !== String(userId)) {
            return res.status(403).json({ error: 'Unauthorized access to this chat session' });
        }

        if (!existingSession) {
            await prisma.chatSession.create({
                data: {
                    id: String(chatId),
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
                    chatId: String(chatId),
                    source: file.originalname
                }
            }),
            prisma.chatDocument.deleteMany({
                where: {
                    chatId: String(chatId),
                    name: file.originalname
                }
            }),
            prisma.chatDocument.create({
                data: {
                    chatId: String(chatId),
                    name: file.originalname,
                    type: file.mimetype,
                    content: storedContent
                }
            }),
            ...(chunks.length > 0
                ? [
                    prisma.documentChunk.createMany({
                        data: chunks.map(chunk => ({
                            chatId: String(chatId),
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

router.delete('/', async (req, res) => {
    try {
        const { chatId, filename, userId } = req.query;

        if (!chatId || !filename || !userId) {
            return res.status(400).json({ error: 'Missing chatId, filename, or userId' });
        }

        const session = await prisma.chatSession.findUnique({
            where: { id: String(chatId) },
            select: { userId: true }
        });

        if (!session) {
            return res.status(404).json({ error: 'Chat session not found' });
        }

        if (session.userId !== String(userId)) {
            return res.status(403).json({ error: 'Unauthorized access to this chat session' });
        }

        const chunkDelete = prisma.documentChunk.deleteMany({
            where: {
                chatId: String(chatId),
                source: String(filename)
            }
        });

        const docDelete = prisma.chatDocument.deleteMany({
            where: {
                chatId: String(chatId),
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

export default router;
