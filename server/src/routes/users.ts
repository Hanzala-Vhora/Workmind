
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/:userId/onboarding-status', async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent 304 Not Modified - Always force fresh check
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        // Find ANY intake form for this user, across any workspace
        const intakeForm = await prisma.intakeForm.findFirst({
            where: {
                workspace: {
                    userId: userId
                }
            },
            include: {
                workspace: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        if (intakeForm) {
            return res.json({
                completed: true,
                workspaceId: intakeForm.workspaceId,
                formId: intakeForm.id
            });
        }

        // Fallback: If no form exists, just find the latest workspace to return its ID
        const workspace = await prisma.workspace.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            completed: false,
            workspaceId: workspace?.id,
            formId: null
        });
    } catch (error: any) {
        console.error('Check onboarding status error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
