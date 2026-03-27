import type { jsPDF } from "jspdf";

export function addHeader(doc: jsPDF, title: string, engineer: string, date: string): void {
  doc.setFontSize(14);
  doc.text("Panoptics Daily Report", 14, 18);
  if (title) {
    doc.setFontSize(12);
    doc.text(title, 14, 26);
  }
  if (engineer) {
    doc.setFontSize(10);
    doc.text(`Engineer: ${engineer}`, 14, 34);
  }
  if (date) {
    const formatted = new Date(date).toISOString().split("T")[0];
    doc.setFontSize(10);
    doc.text(`Date: ${formatted}`, 14, 41);
  }
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 45, 196, 45);
}

export function safeDate(date: string): string {
  const d = new Date(date);
  return isNaN(d.getTime()) ? "unknown-date" : d.toISOString().split("T")[0];
}

export function initials(name: string): string {
  return (name || "XX")
    .split(" ")
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "XX";
}
