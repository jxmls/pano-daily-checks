import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const column = await prisma.column.update({
      where: { id: params.id },
      data: { ...(body.name !== undefined && { name: body.name }) },
      include: { cards: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(column);
  } catch (err) {
    console.error("PATCH /api/board/columns/[id] error:", err);
    return NextResponse.json({ error: "Failed to update column" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.column.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/board/columns/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
  }
}
