import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const issue = await prisma.knownIssue.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.systems !== undefined && { systems: body.systems }),
        ...(body.summary !== undefined && { summary: body.summary }),
        ...(body.workaroundUrl !== undefined && { workaroundUrl: body.workaroundUrl }),
        ...(body.owner !== undefined && { owner: body.owner }),
        ...(body.acceptedUntil !== undefined && { acceptedUntil: body.acceptedUntil }),
        ...(body.lastReviewed !== undefined && { lastReviewed: new Date(body.lastReviewed) }),
        ...(body.lastReviewedBy !== undefined && { lastReviewedBy: body.lastReviewedBy }),
        ...(body.reviewHistory !== undefined && { reviewHistory: body.reviewHistory }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.risk !== undefined && { risk: body.risk }),
      },
    });
    return NextResponse.json(issue);
  } catch (err) {
    console.error("PATCH /api/known-issues/[id] error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.knownIssue.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/known-issues/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
