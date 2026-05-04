import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendWaitlistConfirmation } from '../utils/mailer.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { fullName, designation, companyName, email, phone, budget } = req.body;

    if (!fullName || !companyName || !email || !phone) {
      return res.status(400).json({ error: 'These fields are required.' });
    }

    // Save to the database
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        fullName,
        designation,
        companyName,
        email,
        phone,
        budget,
      },
    });

    res.status(201).json({ success: true, data: waitlistEntry });

    void sendWaitlistConfirmation(email).catch((err: any) => {
      console.error('Failed to send email to waitlisted user:', err.message);
    });
  } catch (error: any) {
    console.error('Waitlist creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET route to list all waitlist entries (helpful for admin/debugging)
router.get('/', async (req, res) => {
  try {
    const entries = await prisma.waitlist.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(entries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
