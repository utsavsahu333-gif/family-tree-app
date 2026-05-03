import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { sendBirthdayReminderEmail } from "@/app/lib/email";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 1-indexed
    const todayDay = today.getDate();

    // Get all family members with birth dates
    const members = await prisma.familyMember.findMany({
      where: { birthDate: { not: null } },
      select: { firstName: true, lastName: true, birthDate: true },
    });

    // Filter for today's birthdays and upcoming (next 7 days)
    const todayBirthdays: { firstName: string; lastName: string; birthDate: string }[] = [];
    const upcomingBirthdays: { firstName: string; lastName: string; birthDate: string }[] = [];

    for (const member of members) {
      if (!member.birthDate) continue;

      const birthDate = new Date(member.birthDate);
      const birthMonth = birthDate.getMonth() + 1;
      const birthDay = birthDate.getDate();

      if (birthMonth === todayMonth && birthDay === todayDay) {
        todayBirthdays.push({
          firstName: member.firstName,
          lastName: member.lastName,
          birthDate: member.birthDate,
        });
      } else {
        // Check if birthday is in the next 7 days
        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + i);
          if (birthMonth === futureDate.getMonth() + 1 && birthDay === futureDate.getDate()) {
            upcomingBirthdays.push({
              firstName: member.firstName,
              lastName: member.lastName,
              birthDate: member.birthDate,
            });
            break;
          }
        }
      }
    }

    // If no birthdays today or upcoming, skip sending emails
    if (todayBirthdays.length === 0 && upcomingBirthdays.length === 0) {
      return NextResponse.json({
        message: "No birthdays today or upcoming",
        todayCount: 0,
        upcomingCount: 0,
        emailsSent: 0,
      });
    }

    // Get all users with email to send reminders
    const users = await prisma.user.findMany({
      select: { email: true },
    });

    let emailsSent = 0;
    for (const user of users) {
      try {
        await sendBirthdayReminderEmail(user.email, todayBirthdays, upcomingBirthdays);
        emailsSent++;
      } catch (err) {
        console.error(`Failed to send birthday email to ${user.email}:`, err);
      }
    }

    return NextResponse.json({
      message: "Birthday reminders sent",
      todayBirthdays: todayBirthdays.map((m) => `${m.firstName} ${m.lastName}`),
      upcomingBirthdays: upcomingBirthdays.map((m) => `${m.firstName} ${m.lastName}`),
      todayCount: todayBirthdays.length,
      upcomingCount: upcomingBirthdays.length,
      emailsSent,
    });
  } catch (error) {
    console.error("Birthday cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
