import { jsPDF } from "jspdf";
import type { AnalysisResult } from "./types";

// ── Brand Colors ──
const BRAND = {
  purple: [109, 40, 217] as [number, number, number],
  purpleLight: [139, 92, 246] as [number, number, number],
  dark: [24, 24, 27] as [number, number, number],
  heading: [35, 35, 40] as [number, number, number],
  body: [60, 60, 65] as [number, number, number],
  muted: [130, 130, 135] as [number, number, number],
  light: [170, 170, 175] as [number, number, number],
  divider: [220, 220, 225] as [number, number, number],
  bgLight: [245, 243, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  red: [220, 50, 50] as [number, number, number],
  orange: [217, 150, 20] as [number, number, number],
  green: [30, 160, 70] as [number, number, number],
  greenLight: [235, 250, 240] as [number, number, number],
  orangeLight: [255, 248, 230] as [number, number, number],
  redLight: [255, 240, 240] as [number, number, number],
};

export function generatePDF(result: AnalysisResult, fileName: string) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 22; // margin left
  const mr = 22; // margin right
  const cw = pw - ml - mr; // content width
  let y = 0;
  let pageNum = 1;

  // ── Helpers ──
  const checkPage = (space: number) => {
    if (y + space > ph - 25) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = 25;
    }
  };

  const addFooter = () => {
    // Thin line
    doc.setDrawColor(...BRAND.divider);
    doc.setLineWidth(0.3);
    doc.line(ml, ph - 15, pw - mr, ph - 15);
    // Brand name left
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.light);
    doc.text("ContractEar", ml, ph - 10);
    // Page number right
    doc.text(`Page ${pageNum}`, pw - mr, ph - 10, { align: "right" });
  };

  const drawRoundedRect = (
    x: number,
    ry: number,
    w: number,
    h: number,
    radius: number,
    fill: [number, number, number],
    stroke?: [number, number, number]
  ) => {
    doc.setFillColor(...fill);
    if (stroke) {
      doc.setDrawColor(...stroke);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, ry, w, h, radius, radius, "FD");
    } else {
      doc.roundedRect(x, ry, w, h, radius, radius, "F");
    }
  };

  const wrapText = (
    text: string,
    x: number,
    width: number,
    size: number,
    style: "normal" | "bold" | "italic" = "normal",
    color: [number, number, number] = BRAND.body,
    lineHeight = 5
  ): number => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines: string[] = doc.splitTextToSize(text, width);
    for (const line of lines) {
      checkPage(lineHeight + 1);
      doc.text(line, x, y);
      y += lineHeight;
    }
    return lines.length;
  };

  const addSectionHeader = (title: string, icon?: string) => {
    checkPage(22);
    y += 8;
    // Purple accent bar
    doc.setFillColor(...BRAND.purple);
    doc.rect(ml, y - 4, 3, 14, "F");
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.heading);
    const label = icon ? `${icon}  ${title}` : title;
    doc.text(label, ml + 8, y + 5);
    y += 16;
  };

  const addCard = (
    drawContent: (cardX: number, cardW: number) => void,
    bg: [number, number, number] = BRAND.white,
    border?: [number, number, number]
  ) => {
    // Measure content height by drawing offscreen first — approximate with a generous estimate
    const cardX = ml;
    const cardW = cw;
    const startY = y;
    // Draw bg rectangle (will be sized after content)
    const savedY = y;
    y += 8; // top padding
    drawContent(cardX + 10, cardW - 20);
    y += 6; // bottom padding
    const cardH = y - savedY;
    // Draw the background behind content
    // We need to draw rect first, then re-draw content — since jsPDF draws sequentially,
    // we'll use a light fill approach
    // Actually, draw rect at saved position
    const pages = doc.getNumberOfPages();
    if (pages === pageNum) {
      // Content fits on same page — draw background
      drawRoundedRect(cardX, savedY, cardW, cardH, 3, bg, border || BRAND.divider);
      // Re-draw content on top
      y = savedY + 8;
      drawContent(cardX + 10, cardW - 20);
      y = savedY + cardH;
    }
    // If content spanned pages, skip the card bg (already drawn inline)
  };

  // ═══════════════════════════════════════════════════════════
  // ── PAGE 1: HEADER ──
  // ═══════════════════════════════════════════════════════════

  // Purple header band
  doc.setFillColor(...BRAND.purple);
  doc.rect(0, 0, pw, 52, "F");

  // Logo circle
  doc.setFillColor(255, 255, 255, 0.15 as unknown as number);
  doc.setFillColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.18 }));
  doc.circle(ml + 14, 26, 14, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // Logo audio bars inside circle
  doc.setFillColor(...BRAND.white);
  doc.rect(ml + 9, 21, 2.5, 10, "F");   // left bar
  doc.rect(ml + 13.5, 18, 2.5, 16, "F"); // center bar
  doc.rect(ml + 18, 23, 2.5, 6, "F");   // right bar

  // Brand name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.white);
  doc.text("ContractEar", ml + 34, 24);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.8 }));
  doc.text("Agreement Analysis Report", ml + 34, 33);
  doc.setGState(doc.GState({ opacity: 1 }));

  // Date on right
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.7 }));
  doc.text(
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    pw - mr,
    26,
    { align: "right" }
  );
  doc.setGState(doc.GState({ opacity: 1 }));

  y = 60;

  // File name
  if (fileName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    const display =
      fileName.length > 80 ? fileName.substring(0, 80) + "..." : fileName;
    doc.text(`File: ${display}`, ml, y);
    y += 8;
  }

  // ═══════════════════════════════════════════════════════════
  // ── RISK SCORE CARD ──
  // ═══════════════════════════════════════════════════════════

  const riskLevel =
    result.riskScore <= 3 ? "low" : result.riskScore <= 6 ? "medium" : "high";
  const riskLabel =
    riskLevel === "low"
      ? "Low Risk"
      : riskLevel === "medium"
        ? "Medium Risk"
        : "High Risk";
  const riskColor =
    riskLevel === "low"
      ? BRAND.green
      : riskLevel === "medium"
        ? BRAND.orange
        : BRAND.red;
  const riskBg =
    riskLevel === "low"
      ? BRAND.greenLight
      : riskLevel === "medium"
        ? BRAND.orangeLight
        : BRAND.redLight;

  checkPage(45);
  const riskCardY = y;
  drawRoundedRect(ml, riskCardY, cw, 40, 4, riskBg, riskColor);

  // Score circle
  const circleX = ml + 22;
  const circleY = riskCardY + 20;
  doc.setFillColor(...BRAND.white);
  doc.circle(circleX, circleY, 13, "F");
  doc.setDrawColor(...riskColor);
  doc.setLineWidth(1.5);
  doc.circle(circleX, circleY, 13, "S");

  // Score number
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...riskColor);
  doc.text(String(result.riskScore), circleX, circleY + 2, { align: "center" });

  // "/10" below
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text("/10", circleX, circleY + 9, { align: "center" });

  // Risk label
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...riskColor);
  doc.text(riskLabel, ml + 42, riskCardY + 15);

  // Risk explanation
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.body);
  const riskExpLines: string[] = doc.splitTextToSize(
    result.riskExplanation,
    cw - 50
  );
  doc.text(riskExpLines.slice(0, 3), ml + 42, riskCardY + 23);
  y = riskCardY + 44;

  // ═══════════════════════════════════════════════════════════
  // ── SUMMARY ──
  // ═══════════════════════════════════════════════════════════

  addSectionHeader("Summary");
  wrapText(result.summary, ml, cw, 10, "normal", BRAND.body, 5.5);

  if (result.duration || result.wordCount > 0) {
    y += 3;
    const meta = [
      result.duration ? `Duration: ${result.duration}` : "",
      result.wordCount > 0
        ? `${result.wordCount.toLocaleString()} words`
        : "",
    ]
      .filter(Boolean)
      .join("    |    ");
    wrapText(meta, ml, cw, 8, "normal", BRAND.light, 4);
  }

  // ═══════════════════════════════════════════════════════════
  // ── PARTIES ──
  // ═══════════════════════════════════════════════════════════

  if (result.parties.length > 0) {
    addSectionHeader("Parties Identified");
    // Draw as inline chips
    let chipX = ml;
    for (const p of result.parties) {
      const label = p.role ? `${p.name} — ${p.role}` : p.name;
      doc.setFontSize(9);
      const tw = doc.getTextWidth(label) + 12;
      if (chipX + tw > pw - mr) {
        chipX = ml;
        y += 10;
        checkPage(12);
      }
      drawRoundedRect(chipX, y - 4, tw, 9, 2, BRAND.bgLight, BRAND.divider);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.heading);
      doc.text(label, chipX + 6, y + 2);
      chipX += tw + 4;
    }
    y += 10;
  }

  // ═══════════════════════════════════════════════════════════
  // ── COMMITMENTS ──
  // ═══════════════════════════════════════════════════════════

  if (result.commitments.length > 0) {
    addSectionHeader("Verbal Commitments");
    for (const c of result.commitments) {
      checkPage(22);
      // Light card bg
      const cardStart = y - 2;
      wrapText(c.commitment, ml + 4, cw - 8, 10, "bold", BRAND.heading, 5);
      const speaker = `${c.speaker}${c.timestamp ? `  \u00B7  ${c.timestamp}` : ""}`;
      wrapText(speaker, ml + 4, cw - 8, 8.5, "normal", BRAND.purpleLight, 4.5);
      if (c.quote) {
        y += 1;
        // Left accent bar for quote
        const quoteStartY = y;
        doc.setFillColor(...BRAND.divider);
        wrapText(
          `\u201C${c.quote}\u201D`,
          ml + 12,
          cw - 20,
          8.5,
          "italic",
          BRAND.muted,
          4.5
        );
        doc.setFillColor(...BRAND.purpleLight);
        doc.rect(ml + 7, quoteStartY - 2, 1.5, y - quoteStartY + 1, "F");
      }
      // Underline separator
      const cardEnd = y + 2;
      doc.setDrawColor(...BRAND.divider);
      doc.setLineWidth(0.2);
      doc.line(ml, cardEnd, pw - mr, cardEnd);
      y = cardEnd + 5;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ── DEADLINES ──
  // ═══════════════════════════════════════════════════════════

  if (result.deadlines.length > 0) {
    addSectionHeader("Deadlines & Timelines");
    for (const d of result.deadlines) {
      checkPage(14);
      // Clock icon indicator (small orange dot)
      doc.setFillColor(...BRAND.orange);
      doc.circle(ml + 3, y + 1, 2, "F");
      wrapText(d.description, ml + 10, cw - 12, 10, "bold", BRAND.heading, 5);
      wrapText(
        `${d.date}  \u00B7  ${d.speaker}`,
        ml + 10,
        cw - 12,
        8.5,
        "normal",
        BRAND.muted,
        4.5
      );
      y += 4;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ── FINANCIAL TERMS ──
  // ═══════════════════════════════════════════════════════════

  if (result.financialTerms.length > 0) {
    addSectionHeader("Financial Terms");
    for (const f of result.financialTerms) {
      checkPage(14);
      // Dollar indicator (small green dot)
      doc.setFillColor(...BRAND.green);
      doc.circle(ml + 3, y + 1, 2, "F");
      wrapText(f.description, ml + 10, cw - 12, 10, "bold", BRAND.heading, 5);
      const detail = `${f.amount ? f.amount + "  \u00B7  " : ""}${f.speaker}`;
      wrapText(detail, ml + 10, cw - 12, 8.5, "normal", BRAND.muted, 4.5);
      y += 4;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ── LIABILITY STATEMENTS ──
  // ═══════════════════════════════════════════════════════════

  if (result.liabilityStatements.length > 0) {
    addSectionHeader("Liability Statements");
    for (const l of result.liabilityStatements) {
      checkPage(20);
      wrapText(l.statement, ml + 4, cw - 8, 10, "bold", BRAND.heading, 5);
      wrapText(
        `Speaker: ${l.speaker}`,
        ml + 4,
        cw - 8,
        8.5,
        "normal",
        BRAND.purpleLight,
        4.5
      );
      if (l.quote) {
        y += 1;
        const quoteStartY = y;
        wrapText(
          `\u201C${l.quote}\u201D`,
          ml + 12,
          cw - 20,
          8.5,
          "italic",
          BRAND.muted,
          4.5
        );
        doc.setFillColor(...BRAND.purpleLight);
        doc.rect(ml + 7, quoteStartY - 2, 1.5, y - quoteStartY + 1, "F");
      }
      doc.setDrawColor(...BRAND.divider);
      doc.setLineWidth(0.2);
      doc.line(ml, y + 2, pw - mr, y + 2);
      y += 6;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ── RED FLAGS ──
  // ═══════════════════════════════════════════════════════════

  if (result.redFlags.length > 0) {
    addSectionHeader("Red Flags");
    for (const r of result.redFlags) {
      checkPage(18);
      const sevColor =
        r.severity === "high"
          ? BRAND.red
          : r.severity === "medium"
            ? BRAND.orange
            : BRAND.muted;
      const sevBg =
        r.severity === "high"
          ? BRAND.redLight
          : r.severity === "medium"
            ? BRAND.orangeLight
            : [240, 240, 245] as [number, number, number];

      // Severity badge
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      const badgeText = r.severity.toUpperCase();
      const badgeW = doc.getTextWidth(badgeText) + 8;
      drawRoundedRect(ml, y - 3.5, badgeW, 7, 1.5, sevBg);
      doc.setTextColor(...sevColor);
      doc.text(badgeText, ml + 4, y + 1);

      // Issue text
      wrapText(r.issue, ml + badgeW + 4, cw - badgeW - 6, 10, "normal", BRAND.heading, 5);
      if (r.quote) {
        y += 1;
        const quoteStartY = y;
        wrapText(
          `\u201C${r.quote}\u201D`,
          ml + 12,
          cw - 20,
          8.5,
          "italic",
          BRAND.muted,
          4.5
        );
        doc.setFillColor(...sevColor);
        doc.rect(ml + 7, quoteStartY - 2, 1.5, y - quoteStartY + 1, "F");
      }
      y += 4;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ── AMBIGUOUS TERMS ──
  // ═══════════════════════════════════════════════════════════

  if (result.ambiguousTerms.length > 0) {
    addSectionHeader("Ambiguous Terms");
    for (const a of result.ambiguousTerms) {
      checkPage(24);
      wrapText(`\u201C${a.term}\u201D`, ml + 4, cw - 8, 10, "bold", BRAND.heading, 5);
      y += 1;
      // Two interpretation boxes side by side (or stacked)
      const halfW = (cw - 12) / 2;
      const interpStartY = y;

      // Interpretation 1
      drawRoundedRect(ml + 2, interpStartY - 2, halfW, 0.1, 2, BRAND.bgLight);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.purpleLight);
      doc.text("INTERPRETATION 1", ml + 6, y + 2);
      y += 6;
      wrapText(a.interpretation1, ml + 6, halfW - 8, 8.5, "normal", BRAND.body, 4.5);
      const y1End = y;

      // Interpretation 2
      y = interpStartY;
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.purpleLight);
      doc.text("INTERPRETATION 2", ml + halfW + 10, y + 2);
      y += 6;
      wrapText(a.interpretation2, ml + halfW + 10, halfW - 8, 8.5, "normal", BRAND.body, 4.5);
      const y2End = y;

      y = Math.max(y1End, y2End) + 2;
      // Draw background rects now that we know heights
      const boxH1 = y1End - interpStartY + 4;
      const boxH2 = y2End - interpStartY + 4;
      const boxH = Math.max(boxH1, boxH2);
      // Draw boxes behind (will be behind text since jsPDF draws in order —
      // we already drew text, so just add separator)
      doc.setDrawColor(...BRAND.divider);
      doc.setLineWidth(0.2);
      doc.line(ml, y, pw - mr, y);
      y += 5;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ── ACTION ITEMS ──
  // ═══════════════════════════════════════════════════════════

  if (result.actionItems.length > 0) {
    addSectionHeader("Action Items");
    for (let i = 0; i < result.actionItems.length; i++) {
      const a = result.actionItems[i];
      checkPage(14);

      // Number badge
      const num = String(i + 1);
      doc.setFillColor(...BRAND.purple);
      doc.circle(ml + 4, y + 1, 4, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.white);
      doc.text(num, ml + 4, y + 2.5, { align: "center" });

      // Action text
      wrapText(a.action, ml + 14, cw - 16, 10, "normal", BRAND.heading, 5);
      const detail = `Assigned to: ${a.assignedTo}${a.deadline ? `  \u00B7  Due: ${a.deadline}` : ""}`;
      wrapText(detail, ml + 14, cw - 16, 8.5, "normal", BRAND.muted, 4.5);
      y += 4;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ── FOOTER / DISCLAIMER ──
  // ═══════════════════════════════════════════════════════════

  checkPage(35);
  y += 8;
  doc.setDrawColor(...BRAND.purple);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pw - mr, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...BRAND.muted);
  doc.text(
    "This analysis is for informational purposes only and does not constitute legal advice.",
    pw / 2,
    y,
    { align: "center" }
  );
  y += 4;
  doc.text(
    "Consult a licensed attorney for legal matters.",
    pw / 2,
    y,
    { align: "center" }
  );
  y += 8;

  // Brand footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.purple);
  doc.text("ContractEar", pw / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.light);
  doc.text("contract-ear.vercel.app", pw / 2, y, { align: "center" });

  // Add page footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BRAND.divider);
    doc.setLineWidth(0.3);
    doc.line(ml, ph - 15, pw - mr, ph - 15);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.light);
    doc.text("ContractEar", ml, ph - 10);
    doc.text(`Page ${i} of ${totalPages}`, pw - mr, ph - 10, {
      align: "right",
    });
  }

  // ── Save ──
  const safeName = fileName
    ? fileName
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .substring(0, 50)
    : "analysis";
  doc.save(`${safeName}_analysis.pdf`);
}
