import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuthUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const members = await prisma.familyMember.findMany({
      include: {
        relFrom: { include: { to: true } },
        relTo: { include: { from: true } },
        _count: { select: { photos: true, events: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { firstName, lastName, birthDate, deathDate, gender, bio, photoUrl, parentId, spouseId } = body;

    if (!firstName || !lastName || !gender) {
      return NextResponse.json(
        { error: "First name, last name, and gender are required" },
        { status: 400 }
      );
    }

    const member = await prisma.familyMember.create({
      data: { firstName, lastName, birthDate, deathDate, gender, bio, photoUrl },
    });

    // Create parent relationship
    if (parentId) {
      await prisma.relationship.create({
        data: { type: "PARENT", fromId: parentId, toId: member.id },
      });
    }

    // Create spouse relationship
    if (spouseId) {
      await prisma.relationship.create({
        data: { type: "SPOUSE", fromId: member.id, toId: spouseId },
      });
    }

    // Auto-create birth event
    if (birthDate) {
      await prisma.event.create({
        data: {
          type: "BIRTH",
          title: `${firstName} ${lastName} was born`,
          date: birthDate,
          memberId: member.id,
        },
      });
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
