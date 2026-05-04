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
    from: `"Workmind.ai" <${emailUser}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendWaitlistConfirmation(email: string) {
  await sendMail({
    to: email,
    subject: "You're on the list - WorkMind Agent Cohort",
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; color: #1e293b;">
        <h2 style="color: #3b82f6;">You're on the list.</h2>
        <p>We received your sign-up for early access to the WorkMind agent cohort.</p>
        <p>Here's what happens next: we're reviewing sign-ups and sending access links to the first cohort by Friday. If you're selected, you'll get your credentials directly to this email.</p>
        <p>Either way, you'll hear from us.</p>
        <p>In the meantime, feel free to reply with any questions.</p>
        <br />
        <p style="color: #64748b; font-size: 0.875rem;">Thanks,<br /><strong>The WorkMind Team</strong></p>
      </div>
    `,
  });
}

export async function sendApprovalCredentialsEmail(params: {
  email: string;
  fullName: string;
  password: string;
}) {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/sign-in`;

  await sendMail({
    to: params.email,
    subject: 'Your WorkMind access is approved',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; color: #1e293b;">
        <h2 style="color: #3b82f6;">Your WorkMind access is ready</h2>
        <p>Hi ${params.fullName || 'there'},</p>
        <p>Your waitlist request has been approved. You can now log in to WorkMind using the credentials below.</p>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${params.email}</p>
          <p style="margin:0;"><strong>Password:</strong> ${params.password}</p>
        </div>
        <p>We recommend storing these credentials safely.</p>
        <p style="color: #64748b; font-size: 0.875rem;">Thanks,<br /><strong>The WorkMind Team</strong></p>
      </div>
    `,
  });
}
