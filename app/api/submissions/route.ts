import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json(submissions);
  } catch (err) {
    console.error("GET /api/submissions error:", err);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { module, engineer, checkDate, passed, payload, pdfName } = body;

    const submission = await prisma.submission.create({
      data: {
        module: module ?? "unknown",
        engineer: engineer ?? "Unknown",
        checkDate: checkDate ?? new Date().toISOString().split("T")[0],
        passed: passed ?? false,
        payload: payload ?? {},
        pdfName: pdfName ?? null,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    console.error("POST /api/submissions error:", err);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
