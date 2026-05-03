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

interface BirthdayMember {
  firstName: string;
  lastName: string;
  birthDate: string;
}

export async function sendBirthdayReminderEmail(
  to: string,
  todayMembers: BirthdayMember[],
  upcomingMembers: BirthdayMember[]
) {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  const calcAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const todayList = todayMembers
    .map(
      (m) =>
        `<tr><td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;"><strong style="color: #1a1a2e;">${m.firstName} ${m.lastName}</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; color: #64748b;">Turns ${calcAge(m.birthDate) + 1} today! 🎉</td></tr>`
    )
    .join("");

  const upcomingList = upcomingMembers
    .map(
      (m) =>
        `<tr><td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;"><strong style="color: #1a1a2e;">${m.firstName} ${m.lastName}</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; color: #64748b;">${formatDate(m.birthDate)} (turns ${calcAge(m.birthDate) + 1})</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #f59e0b, #ef4444); border-radius: 50%; line-height: 56px; font-size: 28px;">🎂</div>
      </div>
      <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; text-align: center; margin-bottom: 8px;">
        Birthday Reminder 🎉
      </h1>
      <p style="font-size: 15px; color: #64748b; text-align: center; margin-bottom: 32px;">
        Don't forget to wish your family members!
      </p>
      ${
        todayMembers.length > 0
          ? `
        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #065f46; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #10b981;">🎂 Today's Birthdays</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${todayList}
          </table>
        </div>
      `
          : ""
      }
      ${
        upcomingMembers.length > 0
          ? `
        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #9333ea; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #a855f7;">📅 Upcoming This Week</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${upcomingList}
          </table>
        </div>
      `
          : ""
      }
      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #065f46, #047857); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px;">
          Open Family Tree →
        </a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px;">
        Sent by Family Tree App · Birthday Reminders
      </p>
    </div>
  `;

  const totalCount = todayMembers.length + upcomingMembers.length;
  const subject =
    todayMembers.length > 0
      ? `🎂 ${todayMembers.map((m) => m.firstName).join(", ")}'s birthday is today!`
      : `📅 ${totalCount} upcoming birthday${totalCount > 1 ? "s" : ""} this week`;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } else {
    console.log("📧 [DEV] Birthday reminder to:", to);
    console.log("📧 [DEV] Today:", todayMembers.map((m) => `${m.firstName} ${m.lastName}`));
    console.log("📧 [DEV] Upcoming:", upcomingMembers.map((m) => `${m.firstName} ${m.lastName}`));
  }
}
