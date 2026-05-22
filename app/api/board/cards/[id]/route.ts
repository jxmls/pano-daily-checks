import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    const fields = ["title", "description", "priority", "status", "assignee",
                    "labels", "estimatedHours", "columnId", "order"] as const;
    for (const f of fields) {
      if (f in body) updateData[f] = body[f];
    }
    if ("dueDate" in body) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    const card = await prisma.card.update({
      where: { id: params.id },
      data: updateData,
      include: { comments: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json(card);
  } catch (err) {
    console.error("PATCH /api/board/cards/[id] error:", err);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.card.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/board/cards/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
