// server/src/routes/agents.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { workspaceId, userId, name, role, department_name, description } = req.body;

    if (!workspaceId || !userId || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const agent = await prisma.agent.create({
      data: {
        workspaceId,
        userId,
        name,
        role,
        department_name,
        description,
      },
    });

    res.status(201).json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId required' });
    }

    const agents = await prisma.agent.findMany({
      where: { workspaceId: String(workspaceId) },
      include: { threads: { take: 5, orderBy: { createdAt: 'desc' } } },
    });

    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { threads: true },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
