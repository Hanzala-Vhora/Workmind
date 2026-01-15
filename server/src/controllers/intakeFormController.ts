// server/src/controllers/intakeFormController.ts
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createIntakeForm = async (req: Request, res: Response) => {
  try {
    const { userId, userEmail, userName, workspaceId, companyName, contactEmail, contactPhone, department, industry, companySize, currentState, mainGoals, challenges, resources, timeline, budget } = req.body;

    if (!workspaceId || !companyName || !userId) {
      return res.status(400).json({ error: 'Missing required fields: workspaceId, companyName, userId' });
    }

    // Ensure User exists
    if (userEmail) {
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          email: userEmail,
          name: userName
        },
        create: {
          id: userId,
          email: userEmail,
          name: userName,
        },
      });
    }

    // Create or get workspace
    const workspace = await prisma.workspace.upsert({
      where: { id: workspaceId },
      update: {},
      create: {
        id: workspaceId,
        userId,
        name: companyName,
      },
    });

    const intakeForm = await prisma.intakeForm.create({
      data: {
        workspaceId: workspace.id,
        companyName,
        contactEmail,
        contactPhone,
        department,
        industry,
        companySize,
        currentState,
        mainGoals: mainGoals || [],
        challenges: challenges || [],
        resources,
        timeline,
        budget,
        status: 'draft',
      },
    });

    res.status(201).json(intakeForm);
  } catch (error: any) {
    console.error('Create intake form error:', error);
    res.status(500).json({ error: error.message || 'Failed to create intake form' });
  }
};

export const getIntakeForms = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId required' });
    }

    const forms = await prisma.intakeForm.findMany({
      where: { workspaceId: String(workspaceId) },
      orderBy: { createdAt: 'desc' },
    });

    res.json(forms);
  } catch (error: any) {
    console.error('Get intake forms error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch intake forms' });
  }
};

export const getIntakeFormById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const form = await prisma.intakeForm.findUnique({
      where: { id },
    });

    if (!form) {
      return res.status(404).json({ error: 'Intake form not found' });
    }

    res.json(form);
  } catch (error: any) {
    console.error('Get intake form error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch intake form' });
  }
};

export const updateIntakeForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const form = await prisma.intakeForm.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    res.json(form);
  } catch (error: any) {
    console.error('Update intake form error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    res.status(500).json({ error: error.message || 'Failed to update intake form' });
  }
};

export const deleteIntakeForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.intakeForm.delete({
      where: { id },
    });

    res.json({ message: 'Intake form deleted successfully' });
  } catch (error: any) {
    console.error('Delete intake form error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    res.status(500).json({ error: error.message || 'Failed to delete intake form' });
  }
};

export const submitIntakeForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const form = await prisma.intakeForm.update({
      where: { id },
      data: {
        status: 'submitted',
        updatedAt: new Date(),
      },
    });

    res.json(form);
  } catch (error: any) {
    console.error('Submit intake form error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    res.status(500).json({ error: error.message || 'Failed to submit intake form' });
  }
};
