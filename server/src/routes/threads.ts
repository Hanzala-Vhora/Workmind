// server/src/routes/threads.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { agentId, workspaceId, title } = req.body;

    if (!agentId || !workspaceId) {
      return res.status(400).json({ error: 'agentId and workspaceId required' });
    }

    const thread = await prisma.thread.create({
      data: {
        agentId,
        workspaceId,
        title,
      },
    });

    res.status(201).json(thread);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const thread = await prisma.thread.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json(thread);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'role and content required' });
    }

    const message = await prisma.message.create({
      data: {
        threadId: id,
        role,
        content,
      },
    });

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
