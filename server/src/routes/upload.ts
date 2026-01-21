
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
        const parser = new PDFParse({ data: req.file.buffer });
        const data = await parser.getText();
        const text = data.text;

        // Clean text (optional: remove excessive newlines)
        const cleanText = text.replace(/\n\s*\n/g, '\n').trim();

        // Create chunks
        // 2-4KB. Let's aim for ~3000 chars.
        const chunks = chunkText(cleanText, 3000, 200);

        // Store in DB
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

export default router;
