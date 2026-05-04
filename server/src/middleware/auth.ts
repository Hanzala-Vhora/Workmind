import type { NextFunction, Request, Response } from 'express';
import prisma from '../db.js';
import { getUserFromAccessToken } from '../utils/supabaseAuth.js';

export type AuthRequest = Request & {
  auth?: {
    accessToken: string;
    userId: string;
    email: string;
    fullName: string;
    appUser: {
      id: string;
      email: string;
      role: string;
      credits: number;
      totalCostUSD: number;
      allowedModels: string[];
      name: string | null;
    } | null;
  };
};

function getBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7);
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const authUser = await getUserFromAccessToken(accessToken);
    const appUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        credits: true,
        totalCostUSD: true,
        allowedModels: true,
        name: true,
      },
    });

    req.auth = {
      accessToken,
      userId: authUser.id,
      email: authUser.email || appUser?.email || '',
      fullName:
        String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || appUser?.name || '').trim(),
      appUser,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Invalid session.' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.auth?.appUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    next();
  });
}
