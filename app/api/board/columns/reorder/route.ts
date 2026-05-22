import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { items } = await req.json() as { items: { id: string; order: number }[] };
    await Promise.all(
      items.map(({ id, order }) => prisma.column.update({ where: { id }, data: { order } }))
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/board/columns/reorder error:", err);
    return NextResponse.json({ error: "Failed to reorder columns" }, { status: 500 });
  }
}
