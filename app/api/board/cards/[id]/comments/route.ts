import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { author, body: body_ } = await req.json();
    const comment = await prisma.comment.create({
      data: { cardId: params.id, author: author ?? "Unknown", body: body_ ?? "" },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error("POST /api/board/cards/[id]/comments error:", err);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
