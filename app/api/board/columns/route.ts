import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCard(c: any) {
  return {
    ...c,
    title: c.title || "Untitled",
    priority: c.priority || "MEDIUM",
    labels: c.labels ?? [],
    attachmentUrls: c.attachmentUrls ?? [],
    comments: c.comments ?? [],
    description: c.description ?? null,
    assignee: c.assignee ?? null,
    dueDate: c.dueDate ? (c.dueDate instanceof Date ? c.dueDate.toISOString() : c.dueDate) : null,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : (c.createdAt ?? new Date().toISOString()),
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : (c.updatedAt ?? new Date().toISOString()),
  };
}

const DEFAULT_COLUMNS = ["To Do", "In Progress", "In Review", "Done"];

async function getOrCreateBoard() {
  let board = await prisma.board.findFirst({ orderBy: { createdAt: "asc" } });
  if (!board) {
    board = await prisma.board.create({ data: { name: "Panoptics Board" } });
    await Promise.all(
      DEFAULT_COLUMNS.map((name, order) =>
        prisma.column.create({ data: { boardId: board.id, name, order } })
      )
    );
  }
  return board;
}

export async function GET() {
  try {
    const board = await getOrCreateBoard();
    const columns = await prisma.column.findMany({
      where: { boardId: board.id },
      orderBy: { order: "asc" },
      include: {
        cards: {
          orderBy: { order: "asc" },
          include: { comments: { orderBy: { createdAt: "asc" } } },
        },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = columns.map((col: any) => ({
      id: String(col.id ?? ""),
      boardId: String(col.boardId ?? ""),
      name: String(col.name ?? ""),
      order: Number(col.order ?? 0),
      cards: (col.cards ?? []).map(normalizeCard),
    }));
    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/board/columns error:", err);
    return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const board = await getOrCreateBoard();
    const last = await prisma.column.findFirst({
      where: { boardId: board.id },
      orderBy: { order: "desc" },
    });
    const column = await prisma.column.create({
      data: { boardId: board.id, name: name ?? "New Column", order: (last?.order ?? -1) + 1 },
      include: { cards: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = column as any;
    return NextResponse.json({
      id: String(c.id ?? ""),
      boardId: String(c.boardId ?? ""),
      name: String(c.name ?? "New Column"),
      order: Number(c.order ?? 0),
      cards: [],
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/board/columns error:", err);
    return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
  }
}
