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
    const photos = await prisma.photo.findMany({
      where: { memberId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Get photos error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { url, caption } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Photo URL/data is required" }, { status: 400 });
    }

    const photo = await prisma.photo.create({
      data: { url, caption, memberId: id },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("Upload photo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
