import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/documents/department/:department
// Get all documents for a department across all chats of a user
router.get('/department/:department', async (req, res) => {
    try {
        const { department } = req.params;
        const { userId, chatId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const whereClause: any = {
            chat: {
                userId: String(userId)
            }
        };

        if (department.toLowerCase() === 'universal') {
            whereClause.chat.department = { equals: 'Universal', mode: 'insensitive' };
        } else {
            whereClause.chat.department = { equals: department, mode: 'insensitive' };
            if (chatId) {
                whereClause.chatId = String(chatId);
            }
        }

        const documents = await prisma.chatDocument.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        // Deduplicate by name
        const uniqueDocs = [];
        const seenNames = new Set();
        
        for (const d of documents) {
            if (!seenNames.has(d.name)) {
                seenNames.add(d.name);
                uniqueDocs.push({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    content: d.content,
                    uploadedAt: d.createdAt.getTime(),
                    chatId: d.chatId
                });
            }
        }

        res.json({ documents: uniqueDocs });
    } catch (error) {
        console.error('Error fetching department documents:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
