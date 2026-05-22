import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json(columns);
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
    return NextResponse.json(column, { status: 201 });
  } catch (err) {
    console.error("POST /api/board/columns error:", err);
    return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
  }
}
