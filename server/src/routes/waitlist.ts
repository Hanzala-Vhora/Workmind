import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

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

    // Send confirmation email via SMTP using nodemailer
    const user = (process.env.EMAIL_USER || 'theworkmindai@gmail.com').trim();
    const pass = (process.env.EMAIL_PASS || 'brjx bekm pify vxfp').trim();
    const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const port = parseInt((process.env.EMAIL_PORT || '465').trim());
    const secure = (process.env.EMAIL_SECURE || 'true').trim() === 'true';

    let transporter;
    if (host.includes('gmail.com')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
        connectionTimeout: 60000,
        greetingTimeout: 60000,
        socketTimeout: 60000,
        family: 4,
        tls: {
          rejectUnauthorized: false
        }
      } as any);
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 60000,
        greetingTimeout: 60000,
        socketTimeout: 60000,
        family: 4,
        tls: {
          rejectUnauthorized: false
        }
      } as any);
    }

    const emailHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; color: #1e293b;">
        <h2 style="color: #3b82f6;">You're on the list.</h2>
        <p>We received your sign-up for early access to the WorkMind agent cohort.</p>
        <p>Here's what happens next: we're reviewing sign-ups and sending access links to the first cohort by Friday. If you're selected, you'll get your link directly to this email.</p>
        <p>Either way, you'll hear from us.</p>
        <p>In the meantime, feel free to reply with any questions.</p>
        <br />
        <p style="color: #64748b; font-size: 0.875rem;">Thanks,<br /><strong>The WorkMind Team</strong></p>
      </div>
    `;

    const mailOptions = {
      from: `"Workmind.ai" <${user}>`,
      to: email,
      subject: "You're on the list - WorkMind Agent Cohort",
      html: emailHtml,
    };

    // Attempt to send email but do not throw error to client if it fails (just log it)
    try {
      await transporter.sendMail(mailOptions);
    } catch (err: any) {
      console.error('Failed to send email to waitlisted user:', err.message);
    }

    res.status(201).json({ success: true, data: waitlistEntry });
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
