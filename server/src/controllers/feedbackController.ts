import type { Request, Response } from 'express';
import prisma from '../db.js';

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      email, 
      rating, 
      valuableFeatures, 
      improvements, 
      departments, 
      continueUsing, 
      startTime, 
      pricingRange, 
      mustHaveFeature 
    } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'User ID and email are required' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        email,
        rating: Number(rating),
        valuableFeatures: Array.isArray(valuableFeatures) ? valuableFeatures : [],
        improvements: improvements || '',
        departments: Array.isArray(departments) ? departments : [],
        continueUsing: continueUsing || '',
        startTime: startTime || '',
        pricingRange: pricingRange || '',
        mustHaveFeature: mustHaveFeature || '',
      },
    });

    res.status(201).json({ success: true, feedback });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit feedback' });
  }
};
