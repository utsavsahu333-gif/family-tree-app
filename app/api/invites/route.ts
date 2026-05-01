import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/app/lib/prisma";
import { getAuthUser } from "@/app/lib/auth";
import { sendInviteEmail } from "@/app/lib/email";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invites = await prisma.invite.findMany({
      where: { invitedById: auth.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Get invites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already registered" }, { status: 409 });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: { email, accepted: false, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already sent to this email" },
        { status: 409 }
      );
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invite.create({
      data: { email, token, invitedById: auth.userId, expiresAt },
    });

    // Get inviter's name
    const inviter = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    });

    await sendInviteEmail(email, inviter?.name || "A family member", token);

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
