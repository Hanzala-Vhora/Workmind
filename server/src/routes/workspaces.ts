// server/src/routes/workspaces.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: 'name and userId required' });
    }

    const workspace = await prisma.workspace.create({
      data: { name, userId },
    });

    res.status(201).json(workspace);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const workspaces = await prisma.workspace.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: 'desc' },
    });

    res.json(workspaces);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        intake: true,
        agents: true,
        repositoryItems: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
