import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuthUser } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { fromId, toId, type } = body;

    if (!fromId || !toId || !type) {
      return NextResponse.json(
        { error: "fromId, toId, and type are required" },
        { status: 400 }
      );
    }

    if (!["PARENT", "SPOUSE", "SIBLING"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid relationship type. Must be PARENT, SPOUSE, or SIBLING" },
        { status: 400 }
      );
    }

    if (fromId === toId) {
      return NextResponse.json(
        { error: "Cannot create a relationship with the same person" },
        { status: 400 }
      );
    }

    // Verify both members exist
    const [fromMember, toMember] = await Promise.all([
      prisma.familyMember.findUnique({ where: { id: fromId } }),
      prisma.familyMember.findUnique({ where: { id: toId } }),
    ]);

    if (!fromMember || !toMember) {
      return NextResponse.json({ error: "One or both members not found" }, { status: 404 });
    }

    // Check for duplicate
    const existing = await prisma.relationship.findFirst({
      where: {
        OR: [
          { fromId, toId, type },
          // For SPOUSE and SIBLING, check reverse direction too
          ...(type !== "PARENT" ? [{ fromId: toId, toId: fromId, type }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This relationship already exists" },
        { status: 409 }
      );
    }

    const relationship = await prisma.relationship.create({
      data: { fromId, toId, type },
      include: { from: true, to: true },
    });

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error) {
    console.error("Create relationship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Relationship ID is required" }, { status: 400 });
    }

    const existing = await prisma.relationship.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    await prisma.relationship.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete relationship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
