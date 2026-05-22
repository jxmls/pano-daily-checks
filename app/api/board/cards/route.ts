import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { createdAt: "desc" },
      include: { comments: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json(cards);
  } catch (err) {
    console.error("GET /api/board/cards error:", err);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { columnId, title, description, priority, assignee, labels, dueDate,
            estimatedHours, createdBy } = body;

    const last = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
    });

    const card = await prisma.card.create({
      data: {
        columnId,
        title: title ?? "Untitled",
        description: description ?? null,
        priority: priority ?? "MEDIUM",
        assignee: assignee ?? null,
        labels: labels ?? [],
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ?? null,
        attachmentUrls: [],
        createdBy: createdBy ?? "Unknown",
        order: (last?.order ?? -1) + 1,
      },
      include: { comments: true },
    });
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    console.error("POST /api/board/cards error:", err);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
