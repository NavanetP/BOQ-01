import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatMoney,
  normalizeQuoteSettings,
  taxLineLabel,
  totalInclTaxLabel,
  type CurrencyCode,
} from "./currency";

export type BoqLine = {
  category: string;
  name: string;
  spec: string;
  unitPrice: number;
  qty: number;
  total: number;
};

export type ProjectInfo = {
  name: string;
  client: string;
  date: string;
  engineer: string;
  notes: string;
  currency?: string;
  fxRate?: number;
  taxRate?: number;
  taxLabel?: string;
};

export type BoqPdfPayload = {
  projectInfo: ProjectInfo;
  refNo: string;
  today: string;
  segmentLabel?: string;
  rationale?: string;
  allLines: BoqLine[];
  serverTotal: number;
  infraTotal: number;
  grandTotal: number;
  tax: number;
  total: number;
};

/** jsPDF standard fonts only support Latin-1; strip/replace other chars */
function pdfSafe(s: string, max = 120) {
  const t = (s || "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\u0020-\u00FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 3)}...` : t;
}

function slug(s: string) {
  return (s || "project")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "project";
}

function pdfFmt(amount: number, currency: CurrencyCode) {
  return formatMoney(amount, currency).replace(/[^\u0020-\u00FF]/g, (ch) => {
    const map: Record<string, string> = { "\u20B9": "INR ", "\u20AC": "EUR ", "\u00A3": "GBP " };
    return map[ch] ?? " ";
  });
}

export function downloadBoqPdf(opts: BoqPdfPayload): void {
  const {
    projectInfo,
    refNo,
    today,
    segmentLabel,
    rationale,
    allLines,
    serverTotal,
    infraTotal,
    grandTotal,
    tax,
    total,
  } = opts;

  const quote = normalizeQuoteSettings(projectInfo);
  const money = (n: number) => pdfFmt(n, quote.currency);
  const exclLabel = quote.taxRate > 0 ? `Total (excl. ${quote.taxLabel})` : "Total";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Sniper Data Centre Presales - Bill of Quantity", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(pdfSafe(refNo, 40), pageW - 14, 12, { align: "right" });
  doc.text(pdfSafe(today, 30), pageW - 14, 18, { align: "right" });

  doc.setTextColor(30, 58, 95);
  y = 34;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(pdfSafe(projectInfo.name || "Datacenter Project", 80), 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    pdfSafe(
      `Client: ${projectInfo.client || "-"}  |  Engineer: ${projectInfo.engineer || "-"}  |  Date: ${projectInfo.date || today}`,
      110
    ),
    14,
    y
  );
  y += 5;
  if (segmentLabel) {
    doc.setFont("helvetica", "bold");
    doc.text(pdfSafe(`Segment: ${segmentLabel}`, 60), 14, y);
    y += 5;
  }
  doc.setFont("helvetica", "normal");
  if (projectInfo.notes?.trim()) {
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(pdfSafe(`Notes: ${projectInfo.notes}`, 500), pageW - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 3.5 + 2;
  }

  if (rationale?.trim()) {
    doc.setFontSize(8);
    doc.setTextColor(59, 130, 246);
    doc.text("Solution rationale:", 14, y);
    y += 4;
    const split = doc.splitTextToSize(pdfSafe(rationale, 2000), pageW - 28);
    doc.text(split, 14, y);
    y += split.length * 3.2 + 4;
    doc.setTextColor(30, 58, 95);
  }

  y += 4;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(pdfSafe(`${totalInclTaxLabel(quote.taxLabel, quote.taxRate)}:`, 60), 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(money(total), pageW - 14, y, { align: "right" });
  y += 8;

  if (allLines.length === 0) {
    doc.setFontSize(10);
    doc.text("No line items selected.", 14, y);
    y += 10;
  } else {
    const body = allLines.map((li, i) => [
      String(i + 1),
      pdfSafe(li.category, 28),
      pdfSafe(li.name, 42),
      pdfSafe(li.spec, 55),
      money(li.unitPrice),
      String(li.qty),
      money(li.total),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Category", "Product / Model", "Specifications", "Unit $", "Qty", "Total"]],
      body,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        4: { halign: "right" },
        5: { halign: "right", cellWidth: 12 },
        6: { halign: "right", cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
    });

    const tableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (tableEnd ?? y) + 8;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let ty = y;
  const rows: [string, string][] = [
    ["Servers subtotal", money(serverTotal)],
    ["Infrastructure subtotal", money(infraTotal)],
    [exclLabel, money(grandTotal)],
  ];
  if (quote.taxRate > 0) {
    rows.push([taxLineLabel(quote.taxLabel, quote.taxRate), money(tax)]);
  }
  rows.push([totalInclTaxLabel(quote.taxLabel, quote.taxRate), money(total)]);
  for (const [l, v] of rows) {
    doc.text(l, pageW - 70, ty);
    doc.setFont("helvetica", "bold");
    doc.text(v, pageW - 14, ty, { align: "right" });
    doc.setFont("helvetica", "normal");
    ty += 5;
  }

  ty += 6;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  [
    `Prices in ${quote.currency} (catalogue USD x FX ${quote.fxRate}); confirmed on PO.`,
    "Lead time 4-10 weeks. OEM warranty per option.",
    "BOQ validity 30 days from issue.",
  ].forEach((t) => {
    doc.text(`- ${t}`, 14, ty);
    ty += 3.5;
  });

  const fname = `BOQ-${slug(projectInfo.name)}-${refNo}.pdf`.replace(/-+/g, "-");
  doc.save(fname);
}
