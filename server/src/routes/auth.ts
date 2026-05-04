import { Router } from 'express';
import prisma from '../db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { signInWithPassword } from '../utils/supabaseAuth.js';

const router = Router();

router.post('/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const session = await signInWithPassword(email, password);
    const appUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
        totalCostUSD: true,
        allowedModels: true,
      },
    });

    if (!appUser) {
      return res.status(403).json({ error: 'Your account is not approved yet.' });
    }

    res.json({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      user: {
        id: appUser.id,
        email: appUser.email,
        fullName: appUser.name || '',
        role: appUser.role,
        credits: appUser.credits,
        totalCostUSD: appUser.totalCostUSD,
        allowedModels: appUser.allowedModels,
      },
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Invalid email or password.' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  if (!req.auth?.appUser) {
    return res.status(403).json({ error: 'Your account is not approved yet.' });
  }

  res.json({
    user: {
      id: req.auth.appUser.id,
      email: req.auth.appUser.email,
      fullName: req.auth.appUser.name || req.auth.fullName || '',
      role: req.auth.appUser.role,
      credits: req.auth.appUser.credits,
      totalCostUSD: req.auth.appUser.totalCostUSD,
      allowedModels: req.auth.appUser.allowedModels,
    },
  });
});

router.post('/sign-out', (_req, res) => {
  res.json({ success: true });
});

export default router;
