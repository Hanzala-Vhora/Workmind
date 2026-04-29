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
                createdAt: true
            }
        });
        res.json(users);
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

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', isAdmin, async (req, res) => {
    try {
        const stats = await prisma.user.aggregate({
            _sum: { totalCostUSD: true, credits: true },
            _count: { id: true }
        });

        const recentLogs = await prisma.usageLog.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { email: true }
                }
            }
        });

        res.json({
            totalUsers: stats._count.id,
            totalPlatformCostUSD: stats._sum.totalCostUSD || 0,
            totalCreditsInCirculation: stats._sum.credits || 0,
            recentLogs
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
