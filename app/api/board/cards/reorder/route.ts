import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { items } = await req.json() as {
      items: { id: string; columnId: string; order: number }[];
    };
    await Promise.all(
      items.map(({ id, columnId, order }) =>
        prisma.card.update({ where: { id }, data: { columnId, order } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/board/cards/reorder error:", err);
    return NextResponse.json({ error: "Failed to reorder cards" }, { status: 500 });
  }
}
