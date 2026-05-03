import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuthUser } from "@/app/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const member = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { createdAt: "desc" } },
        events: { orderBy: { date: "asc" } },
        relFrom: { select: { id: true, type: true, to: { select: { id: true, firstName: true, lastName: true } } } },
        relTo: { select: { id: true, type: true, from: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Get member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, birthDate, deathDate, gender, bio, photoUrl } = body;

    const member = await prisma.familyMember.update({
      where: { id },
      data: { firstName, lastName, birthDate, deathDate, gender, bio, photoUrl },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    // Unlink any user associated with this member first
    await prisma.user.updateMany({
      where: { memberId: id },
      data: { memberId: null },
    });

    await prisma.familyMember.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
