// src/lib/pdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../assets/panopticspdflogo.png";

// cache the loaded HTMLImageElement + natural size
let cachedLogo = null;

function loadLogoImage() {
  if (cachedLogo) return Promise.resolve(cachedLogo);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      cachedLogo = { img, width: img.naturalWidth, height: img.naturalHeight };
      resolve(cachedLogo);
    };
    img.onerror = () => resolve(null); // skip logo if it fails
    img.src = logoUrl;
  });
}

/**
 * Download a table PDF with Panoptics logo (left), bold title, subtitle, optional subnote (e.g., date range),
 * and a divider line before the table.
 * opts: { subtitle?: string, subnote?: string }
 */
export async function downloadPdf(title, cols, rows, filename, opts = {}) {
  const { subtitle, subnote } = opts;
  const doc = new jsPDF();

  // layout (mm)
  const marginX = 14;
  const marginY = 14;
  const logoTargetW = 28; // width; height auto from aspect ratio
  const pageW = doc.internal.pageSize.getWidth();

  let textBlockBottomY = marginY;
  let logoBottomY = marginY;

  // draw logo (keeps aspect ratio)
  const logo = await loadLogoImage();
  let textX = marginX;
  let textY = marginY + 4;

  if (logo) {
    const ratio = logo.width / logo.height || 1;
    const logoW = logoTargetW;
    const logoH = logoW / ratio;

    doc.addImage(logo.img, "PNG", marginX, marginY, logoW, logoH);

    textX = marginX + logoW + 8;
    textY = marginY + 6; // baseline for text
    logoBottomY = marginY + logoH;
  }

  // Title (bold, larger)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(title, pageW - textX - marginX);
  doc.text(titleLines, textX, textY);
  textBlockBottomY = textY + (titleLines.length - 1) * 7;

  // Subtitle
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80);
    const subY = textBlockBottomY + 6;
    const subLines = doc.splitTextToSize(subtitle, pageW - textX - marginX);
    doc.text(subLines, textX, subY);
    textBlockBottomY = subY + (subLines.length - 1) * 5.5;
    doc.setTextColor(0);
  }

  // Subnote (e.g., date range) — ASCII only to avoid PDF font issues
  if (subnote) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    const noteY = textBlockBottomY + 5;
    const noteLines = doc.splitTextToSize(subnote, pageW - textX - marginX);
    doc.text(noteLines, textX, noteY);
    textBlockBottomY = noteY + (noteLines.length - 1) * 5;
    doc.setTextColor(0);
  }

  // Divider line above table
  const headerBottom = Math.max(logoBottomY, textBlockBottomY) + 8;
  doc.setDrawColor(220);
  doc.setLineWidth(0.3);
  doc.line(marginX, headerBottom, pageW - marginX, headerBottom);

  // Table
  const body = rows.map((r) => cols.map((c) => r[c] ?? ""));
  autoTable(doc, {
    head: [cols],
    body,
    startY: headerBottom + 6,
    styles: { fontSize: 9 },
  });

  doc.save(filename);
}
