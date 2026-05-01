import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

/**
 * Admin Middleware
 * Checks if the user has an admin role.
 * Expects 'x-user-role' header for simplicity in this implementation,
 * but should be verified via Clerk JWT in production.
 */
const isAdmin = async (req: any, res: any, next: any) => {
    const role = req.headers['x-user-role'];
    if (role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
};

// GET /api/admin/users
router.get('/users', isAdmin, async (req, res) => {
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

        const enhancedUsers = users.map(user => {
            const totalInputTokens = user.usageLogs.reduce((sum, log) => sum + (log.inputTokens || 0), 0);
            const totalOutputTokens = user.usageLogs.reduce((sum, log) => sum + (log.outputTokens || 0), 0);
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
router.post('/assign-credits', isAdmin, async (req, res) => {
    try {
        const { userId, amount, email } = req.body;
        
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {
                credits: { increment: parseFloat(amount) }
            },
            create: {
                id: userId,
                email: email || 'unknown',
                credits: parseFloat(amount),
                role: 'user'
            }
        });
        
        res.json({ success: true, newBalance: user.credits });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/update-user-permissions
router.post('/update-user-permissions', isAdmin, async (req, res) => {
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
router.get('/dashboard-stats', isAdmin, async (req, res) => {
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
router.get('/usage-logs', isAdmin, async (req, res) => {
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

export default router;
