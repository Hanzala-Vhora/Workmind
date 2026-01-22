
import { Router } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import prisma from '../db.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to chunk text
function chunkText(text: string, chunkSize: number = 3000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { chatId } = req.body;
        if (!chatId) {
            return res.status(400).json({ error: 'Missing chatId' });
        }

        // Extract text
        let text = '';
        if (req.file.mimetype === 'application/pdf') {
            const parser = new PDFParse({ data: req.file.buffer });
            const data = await parser.getText();
            text = data.text;
        }

        // Clean text (optional: remove excessive newlines)
        const cleanText = text.replace(/\n\s*\n/g, '\n').trim();

        // Create chunks
        // 2-4KB. Let's aim for ~3000 chars.
        const chunks = text ? chunkText(cleanText, 3000, 200) : [];

        // Store in DB
        // 1. Create ChatDocument entry
        const isPdf = req.file.mimetype === 'application/pdf';
        await prisma.chatDocument.create({
            data: {
                chatId,
                name: req.file.originalname,
                type: req.file.mimetype,
                content: isPdf ? '[PDF Content Processed]' : text.substring(0, 200) // snippet or marker
            }
        });

        // 2. Create Chunks linked to Chat
        const chunkData = chunks.map(chunk => ({
            chatId,
            content: chunk,
            source: req.file!.originalname
        }));

        await prisma.documentChunk.createMany({
            data: chunkData
        });

        res.json({
            success: true,
            chunks: chunks.length,
            message: `Processed ${chunks.length} chunks from ${req.file.originalname}`
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error processing PDF' });
    }
});

router.delete('/', async (req, res) => {
    try {
        const { chatId, filename } = req.query;

        if (!chatId || !filename) {
            return res.status(400).json({ error: 'Missing chatId or filename' });
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

        const [chunkResult, docResult] = await prisma.$transaction([chunkDelete, docDelete]);

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
