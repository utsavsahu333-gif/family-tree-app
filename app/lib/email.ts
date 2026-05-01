import nodemailer from "nodemailer";

const transporter =
  process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  token: string
) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const link = `${appUrl}/register?invite=${token}`;

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #065f46, #10b981); border-radius: 12px; line-height: 48px; font-size: 24px;">🌳</div>
      </div>
      <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; text-align: center; margin-bottom: 8px;">
        You're invited to the Family Tree
      </h1>
      <p style="font-size: 16px; color: #64748b; text-align: center; margin-bottom: 32px;">
        <strong>${inviterName}</strong> has invited you to join their family tree. 
        Create your account and start exploring your family history.
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${link}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #065f46, #047857); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px;">
          Join the Family Tree →
        </a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; text-align: center;">
        This invite expires in 7 days. If the button doesn't work, copy this link:<br/>
        <a href="${link}" style="color: #047857; word-break: break-all;">${link}</a>
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `${inviterName} invited you to the Family Tree`,
      html,
    });
  } else {
    console.log("📧 [DEV] Invite email to:", to);
    console.log("📧 [DEV] Join link:", link);
  }
}
