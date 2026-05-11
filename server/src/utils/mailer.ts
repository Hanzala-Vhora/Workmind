import nodemailer from 'nodemailer';

const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || '').trim();
const emailHost = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
const emailPort = Number.parseInt((process.env.EMAIL_PORT || '465').trim(), 10);
const emailSecure = (process.env.EMAIL_SECURE || 'true').trim() === 'true';

const transporter =
  emailUser && emailPass
    ? nodemailer.createTransport(
        emailHost.includes('gmail.com')
          ? {
              service: 'gmail',
              auth: {
                user: emailUser,
                pass: emailPass,
              },
              connectionTimeout: 15000,
              greetingTimeout: 15000,
              socketTimeout: 15000,
              family: 4,
            } as any
          : {
              host: emailHost,
              port: emailPort,
              secure: emailSecure,
              auth: {
                user: emailUser,
                pass: emailPass,
              },
              connectionTimeout: 15000,
              greetingTimeout: 15000,
              socketTimeout: 15000,
              family: 4,
            } as any,
      )
    : null;

async function sendMail(params: { to: string; subject: string; html: string }) {
  if (!transporter || !emailUser) {
    return;
  }

  await transporter.sendMail({
    from: `"TheWorkMind.ai" <${emailUser}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendWaitlistConfirmation(email: string) {
  await sendMail({
    to: email,
    subject: "You're on the list - TheWorkMind Agent Cohort",
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; color: #1e293b;">
        <h2 style="color: #3b82f6;">You're on the list.</h2>
        <p>We received your sign-up for early access to the TheWorkMind agent cohort.</p>
        <p>Here's what happens next: we're reviewing sign-ups and sending access links to the first cohort by Monday. If you're selected, you'll get your credentials directly to this email.</p>
        <p>Either way, you'll hear from us.</p>
        <p>In the meantime, feel free to reply with any questions.</p>
        <br />
        <p style="color: #64748b; font-size: 0.875rem;">Thanks,<br /><strong>The TheWorkMind Team</strong></p>
      </div>
    `,
  });
}

export async function sendApprovalCredentialsEmail(params: {
  email: string;
  fullName: string;
  password: string;
}) {
  const loginUrl = `${process.env.FRONTEND_URL || 'https://newsystem.d23z3kd7iudo6z.amplifyapp.com'}/sign-in`;

  await sendMail({
    to: params.email,
    subject: "You're in — here's your access link",
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; color: #1e293b;">
        <h2 style="color: #3b82f6;">You're in — here's your access link</h2>
        <p>You're one of the few we selected for the first WorkMind agent cohort. Here's your access link:</p>
        
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:24px 0;">
          <h3 style="margin-top:0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">User Credentials</h3>
          <p style="margin:0 0 12px; font-size: 15px;"><strong>Login URL:</strong> <a href="${loginUrl}" style="color: #3b82f6; text-decoration: none;">${loginUrl}</a></p>
          <p style="margin:0 0 12px; font-size: 15px;"><strong>Email:</strong> ${params.email}</p>
          <p style="margin:0; font-size: 15px;"><strong>Password:</strong> ${params.password}</p>
        </div>

        <div style="margin-top: 32px;">
          <h3 style="font-size: 16px; color: #1e293b; margin-bottom: 8px;">A few things before you get started:</h3>
          <p style="margin-bottom: 16px;">This is a live testing environment, not a polished product tour. You'll be interacting with agents that are built to actually run inside a business, so expect depth over flash.</p>
          
          <h3 style="font-size: 16px; color: #1e293b; margin-bottom: 8px;">What we need from you:</h3>
          <p style="margin-bottom: 16px;">Use it, break it if you can, and tell us what's missing. Your feedback over the next few weeks directly shapes what this becomes before we open it wider.</p>
          
          <p style="margin-bottom: 16px;">We'll check in with you in a few days to see how things are going. If anything comes up before then, reply here directly.</p>
        </div>

        <p style="font-weight: bold; margin-top: 32px;">Welcome to the cohort.</p>
        <p style="color: #64748b; font-size: 0.875rem; margin-top: 8px;">Thanks,<br /><strong>The TheWorkMind Team</strong></p>
      </div>
    `,
  });
}
