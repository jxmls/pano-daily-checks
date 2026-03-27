import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const issues = await prisma.knownIssue.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(issues);
  } catch (err) {
    console.error("GET /api/known-issues error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const issue = await prisma.knownIssue.create({
      data: {
        title: body.title ?? "",
        systems: body.systems ?? [],
        summary: body.summary ?? "",
        workaroundUrl: body.workaroundUrl ?? null,
        owner: body.owner ?? "Infra",
        acceptedUntil: body.acceptedUntil ?? null,
        lastReviewedBy: body.lastReviewedBy ?? null,
        reviewHistory: body.reviewHistory ?? [],
        status: body.status ?? "active",
        risk: body.risk ?? "low",
      },
    });
    return NextResponse.json(issue, { status: 201 });
  } catch (err) {
    console.error("POST /api/known-issues error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
