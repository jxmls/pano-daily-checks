import { NextRequest, NextResponse } from "next/server";

const PASSWORD = process.env.LOCAL_PASSWORD ?? "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!PASSWORD) {
      return NextResponse.json(
        { error: "Server auth is not configured. Set LOCAL_PASSWORD in your environment." },
        { status: 500 }
      );
    }
    if (typeof password !== "string" || password !== PASSWORD) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
