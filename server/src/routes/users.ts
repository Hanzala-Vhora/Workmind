
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/:userId/onboarding-status', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the most recent workspace for this user
        const workspace = await prisma.workspace.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!workspace) {
            return res.json({ completed: false });
        }

        // Check for any intake form in this workspace
        const intakeForm = await prisma.intakeForm.findFirst({
            where: { workspaceId: workspace.id },
        });

        res.json({
            completed: !!intakeForm,
            workspaceId: workspace.id,
            formId: intakeForm?.id
        });
    } catch (error: any) {
        console.error('Check onboarding status error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
