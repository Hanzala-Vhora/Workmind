import { Router } from 'express';
import prisma from '../db.js';
import { requireAdmin, type AuthRequest } from '../middleware/auth.js';
import { createSupabaseUser } from '../utils/supabaseAuth.js';
import { sendApprovalCredentialsEmail } from '../utils/mailer.js';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';

const router = Router();
type AdminUserWithUsage = Prisma.UserGetPayload<{
    select: {
        id: true;
        email: true;
        credits: true;
        totalCostUSD: true;
        role: true;
        allowedModels: true;
        createdAt: true;
        usageLogs: {
            select: {
                inputTokens: true;
                outputTokens: true;
            };
        };
    };
}>;

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                credits: true,
                totalCostUSD: true,
                role: true,
                allowedModels: true,
                createdAt: true,
                usageLogs: {
                    select: {
                        inputTokens: true,
                        outputTokens: true
                    }
                }
            }
        });

        const enhancedUsers = users.map((user: AdminUserWithUsage) => {
            const totalInputTokens = user.usageLogs.reduce((sum: number, log: { inputTokens: number }) => sum + (log.inputTokens || 0), 0);
            const totalOutputTokens = user.usageLogs.reduce((sum: number, log: { outputTokens: number }) => sum + (log.outputTokens || 0), 0);
            const { usageLogs, ...userWithoutLogs } = user;
            return {
                ...userWithoutLogs,
                totalInputTokens,
                totalOutputTokens
            };
        });

        res.json(enhancedUsers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/assign-credits
router.post('/assign-credits', requireAdmin, async (req, res) => {
    try {
        const { userId, amount, email, mode } = req.body;
        
        const amountNum = parseFloat(amount);
        const updateObj: any = {};
        if (mode === 'set') {
            updateObj.credits = amountNum;
        } else if (mode === 'reduce') {
            updateObj.credits = { decrement: amountNum };
        } else {
            updateObj.credits = { increment: amountNum };
        }

        const user = await prisma.user.upsert({
            where: { id: userId },
            update: updateObj,
            create: {
                id: userId,
                email: email || 'unknown',
                credits: amountNum,
                role: 'user'
            }
        });
        
        res.json({ success: true, newBalance: user.credits });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/update-user-permissions
router.post('/update-user-permissions', requireAdmin, async (req, res) => {
    try {
        const { userId, allowedModels } = req.body;
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                allowedModels: allowedModels
            }
        });
        
        res.json({ success: true, user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
    try {
        const [stats, logStats] = await Promise.all([
            prisma.user.aggregate({
                _sum: { totalCostUSD: true, credits: true },
                _count: { id: true }
            }),
            prisma.usageLog.aggregate({
                _sum: { inputTokens: true, outputTokens: true }
            })
        ]);

        res.json({
            totalUsers: stats._count.id,
            totalPlatformCostUSD: stats._sum.totalCostUSD || 0,
            totalCreditsInCirculation: stats._sum.credits || 0,
            totalInputTokens: logStats._sum.inputTokens || 0,
            totalOutputTokens: logStats._sum.outputTokens || 0
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/usage-logs (Paginated)
router.get('/usage-logs', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.usageLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { email: true }
                    }
                }
            }),
            prisma.usageLog.count()
        ]);

        res.json({
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/waitlist', requireAdmin, async (_req, res) => {
    try {
        const entries = await prisma.waitlist.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json(entries);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/waitlist/:id/approve', requireAdmin, async (req: AuthRequest, res) => {
    try {
        const entry = await prisma.waitlist.findUnique({
            where: { id: req.params.id },
        });

        if (!entry) {
            return res.status(404).json({ error: 'Waitlist entry not found.' });
        }

        const password = `WM-${randomBytes(6).toString('base64url')}`;
        const supabaseUser = await createSupabaseUser({
            email: entry.email,
            password,
            fullName: entry.fullName,
        });

        const user = await prisma.user.upsert({
            where: { id: supabaseUser.id },
            update: {
                email: entry.email,
                name: entry.fullName,
            },
            create: {
                id: supabaseUser.id,
                email: entry.email,
                name: entry.fullName,
                role: 'user',
                credits: 100,
            },
        });

        await sendApprovalCredentialsEmail({
            email: entry.email,
            fullName: entry.fullName,
            password,
        });

        await prisma.waitlist.update({ where: { id: entry.id }, data: { status: 'approved' } });
        
        res.json({ success: true, userId: user.id, email: user.email });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to approve waitlist user.' });
    }
});

router.get('/feedback', requireAdmin, async (_req, res) => {
    try {
        const feedback = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(feedback);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

