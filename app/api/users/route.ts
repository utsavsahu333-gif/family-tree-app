import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuthUser } from "@/app/lib/auth";

// GET — List all users (admin only)
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — Approve or reject a user (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "userId and status are required" }, { status: 400 });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Status must be APPROVED or REJECTED" }, { status: 400 });
    }

    // Can't modify your own status
    if (userId === auth.userId) {
      return NextResponse.json({ error: "Cannot modify your own status" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
