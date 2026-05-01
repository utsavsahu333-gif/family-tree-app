import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuthUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const events = await prisma.event.findMany({
      include: { member: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Get events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, title, description, date, memberId } = await request.json();

    if (!type || !title || !date || !memberId) {
      return NextResponse.json(
        { error: "Type, title, date, and member are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: { type, title, description, date, memberId },
      include: { member: true },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
