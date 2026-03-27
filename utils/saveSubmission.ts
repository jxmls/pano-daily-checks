"use client";

interface SubmissionEntry {
  module: string;
  engineer: string;
  checkDate: string;
  passed: boolean;
  payload: unknown;
  pdfName?: string;
}

const LOCAL_KEY = "pano.submissions.v1";

export async function saveSubmission(entry: SubmissionEntry): Promise<void> {
  // 1. Local cache (Admin Portal reads this)
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const arr: unknown[] = raw ? JSON.parse(raw) : [];
    arr.unshift({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...entry,
    });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }

  // 2. Fire-and-forget API write to PostgreSQL
  try {
    await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      keepalive: true,
    });
  } catch {
    // local save is the fallback
  }
}
