import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import prisma from "@/app/lib/prisma";
import { signToken, createAuthCookie } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, inviteToken } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === "REJECTED") {
        return NextResponse.json(
          { error: "This account has been rejected by the admin" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check invite token if provided
    let isInvited = false;
    if (inviteToken) {
      const invite = await prisma.invite.findUnique({
        where: { token: inviteToken },
      });
      if (!invite || invite.accepted || new Date(invite.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "Invalid or expired invite" },
          { status: 400 }
        );
      }
      await prisma.invite.update({
        where: { token: inviteToken },
        data: { accepted: true },
      });
      isInvited = true;
    }

    // First user becomes admin + approved; invited users are auto-approved
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "MEMBER";
    const status = userCount === 0 || isInvited ? "APPROVED" : "PENDING";

    const hashed = hashSync(password, 12);
    const user = await prisma.user.create({
      data: { email, name, password: hashed, role, status },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status } },
      { status: 201 }
    );
    response.cookies.set(createAuthCookie(token));
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
