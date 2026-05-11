import type { Request, Response } from 'express';
import prisma from '../db.js';

export const requestCredits = async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }

    // Check if there's already a pending request for this user
    const existingRequest = await prisma.creditRequest.findFirst({
      where: {
        userId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending credit request.' });
    }

    const creditRequest = await prisma.creditRequest.create({
      data: {
        userId,
        amount: Number(amount),
        status: 'pending'
      }
    });

    res.status(201).json({ success: true, creditRequest });
  } catch (error: any) {
    console.error('Request credits error:', error);
    res.status(500).json({ error: error.message || 'Failed to request credits' });
  }
};

export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.creditRequest.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error: any) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveCreditRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.creditRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is already processed' });
    }

    // Update user credits and mark request as approved in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: request.userId },
        data: {
          credits: {
            increment: request.amount
          }
        }
      }),
      prisma.creditRequest.update({
        where: { id: requestId },
        data: { status: 'approved' }
      })
    ]);

    res.json({ success: true, message: 'Credits approved and added' });
  } catch (error: any) {
    console.error('Approve credit request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectCreditRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.creditRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await prisma.creditRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' }
    });

    res.json({ success: true, message: 'Request rejected' });
  } catch (error: any) {
    console.error('Reject credit request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
