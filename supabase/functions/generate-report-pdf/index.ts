import { PDFDocument, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const fontUrl =
  'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf';
const pageWidth = 842;
const pageHeight = 595;
const margin = 42;
const navy = rgb(0.05, 0.13, 0.24);
const ink = rgb(0.09, 0.17, 0.29);
const slate = rgb(0.34, 0.42, 0.53);
const lightSlate = rgb(0.58, 0.65, 0.75);
const blue = rgb(0.12, 0.32, 0.78);
const green = rgb(0.02, 0.48, 0.34);
const rose = rgb(0.88, 0.08, 0.28);
const border = rgb(0.84, 0.89, 0.95);
const softBlue = rgb(0.95, 0.98, 1);
const softGreen = rgb(0.93, 0.98, 0.96);
const white = rgb(1, 1, 1);

type PdfCell = {
  vendor: string;
  value: string;
  rawTerm?: string;
};

type PdfRow = {
  itemLabel: string;
  insight: string;
  delta: string;
  cells: PdfCell[];
};

type PdfReport = {
  title: string;
  summary: string;
  quotePair: string;
  estimatedSavings: string;
  recommendedQuote: string;
  coverageGaps: string;
  recommendation: string;
  vendors: string[];
  rows: PdfRow[];
  insights: string[];
};

type PdfLabels = {
  summary: string;
  totalSavings: string;
  recommendedVendor: string;
  coverageGaps: string;
  item: string;
  delta: string;
  keyInsights: string;
  recommendation: string;
  preparedBy: string;
};

type PdfPayload = {
  labels: PdfLabels;
  report: PdfReport;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const payload = (await request.json()) as PdfPayload;

    if (!payload?.report || !payload?.labels) {
      return jsonResponse({ error: 'Missing report payload' }, 400);
    }

    const pdfBytes = await buildPdf(payload);

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="quotewise-analysis-report.pdf"',
      },
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to generate PDF' }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

async function buildPdf({ labels, report }: PdfPayload) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const fontBytes = await fetch(fontUrl).then((response) => {
    if (!response.ok) {
      throw new Error('Unable to load report font');
    }

    return response.arrayBuffer();
  });
  const font = await pdf.embedFont(fontBytes, { subset: true });

  let pageNumber = 1;
  let page = pdf.addPage([pageWidth, pageHeight]);

  drawExecutivePage(page, font, labels, report, pageNumber);
  drawFooter(page, font, pageNumber);

  pageNumber += 1;
  page = pdf.addPage([pageWidth, pageHeight]);
  drawHeader(page, font, 'DECISION SUPPORT DETAIL');
  let y = pageHeight - margin - 34;

  y = drawDecisionBasis(page, font, labels, report, y);
  y -= 22;
  y = drawDetailedTable(pdf, page, font, labels, report, y, () => {
    drawFooter(page, font, pageNumber);
    pageNumber += 1;
    page = pdf.addPage([pageWidth, pageHeight]);
    drawHeader(page, font, 'LINE ITEM APPENDIX');
    return page;
  });

  drawFooter(page, font, pageNumber);
  return pdf.save();
}

function drawExecutivePage(page: any, font: any, labels: PdfLabels, report: PdfReport, pageNumber: number) {
  drawHeader(page, font, 'QUOTEWISE ANALYSIS REPORT');

  page.drawText('DECISION REPORT', {
    x: margin,
    y: pageHeight - margin - 20,
    size: 9,
    font,
    color: blue,
    characterSpacing: 1.8,
  });

  drawWrappedText(page, report.title, margin, pageHeight - margin - 54, 470, 26, 31, font, navy, 3);
  drawWrappedText(page, report.summary, margin, pageHeight - margin - 154, 470, 11, 17, font, slate, 5);

  drawScopeCard(page, font, labels, report, margin, 286, 470, 78);
  drawDecisionPanel(page, font, labels, report, 545, 350, 255, 150);

  const metricY = 236;
  drawMetricCard(page, font, labels.totalSavings, report.estimatedSavings, margin, metricY, 150, 72, green);
  drawMetricCard(page, font, labels.recommendedVendor, report.recommendedQuote, margin + 162, metricY, 150, 72, blue);
  drawMetricCard(page, font, labels.coverageGaps, report.coverageGaps, margin + 324, metricY, 146, 72, rose);

  drawInsightRail(page, font, labels, report, 545, 104, 255, 220);

  page.drawText(labels.recommendation, {
    x: margin,
    y: 184,
    size: 12,
    font,
    color: navy,
  });
  drawWrappedText(page, report.recommendation, margin, 162, 470, 14, 19, font, ink, 5);

  page.drawText('Generated by QuoteWise', {
    x: margin,
    y: 62,
    size: 8,
    font,
    color: lightSlate,
  });
  page.drawText(`Page ${pageNumber}`, {
    x: pageWidth - margin - 42,
    y: 62,
    size: 8,
    font,
    color: lightSlate,
  });
}

function drawHeader(page: any, font: any, eyebrow: string) {
  page.drawText('QuoteWise', {
    x: margin,
    y: pageHeight - 25,
    size: 13,
    font,
    color: navy,
  });
  page.drawText(eyebrow, {
    x: pageWidth - margin - 210,
    y: pageHeight - 23,
    size: 8,
    font,
    color: lightSlate,
    characterSpacing: 1.2,
  });
  page.drawLine({
    start: { x: margin, y: pageHeight - 36 },
    end: { x: pageWidth - margin, y: pageHeight - 36 },
    thickness: 0.7,
    color: border,
  });
}

function drawFooter(page: any, font: any, pageNumber: number) {
  page.drawLine({
    start: { x: margin, y: 34 },
    end: { x: pageWidth - margin, y: 34 },
    thickness: 0.6,
    color: border,
  });
  page.drawText('QuoteWise Analysis Report', {
    x: margin,
    y: 18,
    size: 8,
    font,
    color: lightSlate,
  });
  page.drawText(`Page ${pageNumber}`, {
    x: pageWidth - margin - 42,
    y: 18,
    size: 8,
    font,
    color: lightSlate,
  });
}

function drawScopeCard(page: any, font: any, labels: PdfLabels, report: PdfReport, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: softBlue, borderColor: border, borderWidth: 1 });
  page.drawText(labels.preparedBy, { x: x + 16, y: y + height - 20, size: 8, font, color: slate });
  drawWrappedText(page, report.quotePair, x + 16, y + height - 42, width - 32, 11, 15, font, navy, 2);
  const vendorText = report.vendors.length ? report.vendors.join(' / ') : '-';
  drawWrappedText(page, vendorText, x + 16, y + 18, width - 32, 8, 11, font, lightSlate, 1);
}

function drawDecisionPanel(page: any, font: any, labels: PdfLabels, report: PdfReport, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: navy });
  page.drawText(labels.recommendation.toUpperCase(), {
    x: x + 18,
    y: y + height - 26,
    size: 8,
    font,
    color: rgb(0.75, 0.84, 1),
    characterSpacing: 1.3,
  });
  drawWrappedText(page, report.recommendedQuote || '-', x + 18, y + height - 62, width - 36, 24, 28, font, white, 2);
  drawWrappedText(page, report.recommendation, x + 18, y + 54, width - 36, 10, 14, font, rgb(0.82, 0.88, 0.96), 4);
}

function drawMetricCard(page: any, font: any, label: string, value: string, x: number, y: number, width: number, height: number, accent: any) {
  page.drawRectangle({ x, y, width, height, color: white, borderColor: border, borderWidth: 1 });
  page.drawRectangle({ x, y: y + height - 4, width, height: 4, color: accent });
  page.drawText(label.toUpperCase(), { x: x + 12, y: y + height - 22, size: 7, font, color: slate, characterSpacing: 0.8 });
  drawWrappedText(page, value || '-', x + 12, y + height - 48, width - 24, 18, 21, font, navy, 2);
}

function drawInsightRail(page: any, font: any, labels: PdfLabels, report: PdfReport, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: white, borderColor: border, borderWidth: 1 });
  page.drawText(labels.keyInsights.toUpperCase(), {
    x: x + 16,
    y: y + height - 24,
    size: 8,
    font,
    color: slate,
    characterSpacing: 1.1,
  });

  const insights = report.insights.length ? report.insights.slice(0, 4) : ['No data'];
  let currentY = y + height - 48;
  insights.forEach((insight, index) => {
    page.drawCircle({ x: x + 20, y: currentY + 3, size: 4, color: green });
    currentY = drawWrappedText(page, insight, x + 34, currentY + 8, width - 52, 9, 13, font, ink, 3);
    if (index < insights.length - 1) {
      currentY -= 9;
    }
  });
}

function drawDecisionBasis(page: any, font: any, labels: PdfLabels, report: PdfReport, y: number) {
  page.drawText(labels.keyInsights, { x: margin, y, size: 16, font, color: navy });
  y -= 24;

  const insights = report.insights.length ? report.insights.slice(0, 6) : ['No data'];
  const gap = 12;
  const cardWidth = (pageWidth - margin * 2 - gap) / 2;
  let leftY = y;
  let rightY = y;

  insights.forEach((insight, index) => {
    const isLeft = index % 2 === 0;
    const x = isLeft ? margin : margin + cardWidth + gap;
    const targetY = isLeft ? leftY : rightY;
    const lines = wrapText(insight, cardWidth - 38, 9, font).slice(0, 4);
    const height = Math.max(48, lines.length * 13 + 22);

    page.drawRectangle({ x, y: targetY - height, width: cardWidth, height, color: softGreen, borderColor: border, borderWidth: 1 });
    page.drawCircle({ x: x + 16, y: targetY - 19, size: 4, color: green });
    drawLines(page, lines, x + 28, targetY - 14, 9, 13, font, ink);

    if (isLeft) {
      leftY = targetY - height - 10;
    } else {
      rightY = targetY - height - 10;
    }
  });

  return Math.min(leftY, rightY);
}

function drawDetailedTable(
  pdf: any,
  page: any,
  font: any,
  labels: PdfLabels,
  report: PdfReport,
  startY: number,
  nextPage: () => any,
) {
  let currentPage = page;
  let y = startY;
  const tableWidth = pageWidth - margin * 2;
  const vendorCount = Math.max(report.vendors.length, 1);
  const itemWidth = Math.max(190, tableWidth * 0.28);
  const deltaWidth = 108;
  const vendorWidth = (tableWidth - itemWidth - deltaWidth) / vendorCount;

  const drawSectionTitle = () => {
    currentPage.drawText(labels.summary, { x: margin, y, size: 16, font, color: navy });
    y -= 24;
  };

  const drawHeaderRow = () => {
    currentPage.drawRectangle({ x: margin, y: y - 25, width: tableWidth, height: 25, color: softBlue, borderColor: border, borderWidth: 1 });
    currentPage.drawText(labels.item, { x: margin + 8, y: y - 17, size: 8, font, color: slate });
    report.vendors.forEach((vendor, index) => {
      currentPage.drawText(truncate(vendor, 18), { x: margin + itemWidth + vendorWidth * index + 8, y: y - 17, size: 8, font, color: slate });
    });
    currentPage.drawText(labels.delta, { x: margin + itemWidth + vendorWidth * vendorCount + 8, y: y - 17, size: 8, font, color: slate });
    y -= 25;
  };

  drawSectionTitle();
  drawHeaderRow();

  const rows = report.rows.length ? report.rows : [{ itemLabel: 'No data', insight: '', delta: '-', cells: report.vendors.map((vendor) => ({ vendor, value: '-' })) }];

  for (const row of rows) {
    const itemLines = wrapText(row.itemLabel, itemWidth - 16, 9.5, font);
    const insightLines = row.insight ? wrapText(row.insight, itemWidth - 16, 7.5, font).slice(0, 3) : [];
    const cellLineCounts = row.cells.map((cell) => wrapText(cell.value, vendorWidth - 16, 8.5, font).length + (cell.rawTerm ? 1 : 0));
    const deltaLines = wrapText(row.delta, deltaWidth - 16, 8.5, font);
    const rowHeight = Math.max(44, (Math.max(itemLines.length + insightLines.length, ...cellLineCounts, deltaLines.length) + 1) * 12);

    if (y - rowHeight < margin + 38) {
      currentPage = nextPage();
      y = pageHeight - margin - 34;
      drawSectionTitle();
      drawHeaderRow();
    }

    currentPage.drawRectangle({ x: margin, y: y - rowHeight, width: tableWidth, height: rowHeight, color: white, borderColor: border, borderWidth: 0.7 });

    let itemY = y - 14;
    itemY = drawLines(currentPage, itemLines, margin + 8, itemY, 9.5, 12, font, navy);
    if (insightLines.length) {
      drawLines(currentPage, insightLines, margin + 8, itemY - 2, 7.5, 10, font, slate);
    }

    row.cells.forEach((cell, index) => {
      let cellY = y - 14;
      const lines = wrapText(cell.value, vendorWidth - 16, 8.5, font);
      cellY = drawLines(currentPage, lines, margin + itemWidth + vendorWidth * index + 8, cellY, 8.5, 11, font, ink);
      if (cell.rawTerm) {
        drawWrappedText(currentPage, cell.rawTerm, margin + itemWidth + vendorWidth * index + 8, cellY - 1, vendorWidth - 16, 7, 9, font, lightSlate, 1);
      }
    });

    drawLines(currentPage, deltaLines, margin + itemWidth + vendorWidth * vendorCount + 8, y - 14, 8.5, 11, font, deltaColor(row.delta));
    y -= rowHeight;
  }

  return y;
}

function deltaColor(delta: string) {
  if (delta.includes('+')) return rose;
  if (delta.includes('-')) return green;
  return navy;
}

function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  lineHeight: number,
  font: any,
  color: any,
  maxLines?: number,
) {
  let lines = wrapText(text || '-', maxWidth, size, font);

  if (maxLines && lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[lines.length - 1] = truncate(lines[lines.length - 1], Math.max(4, lines[lines.length - 1].length - 3));
  }

  return drawLines(page, lines, x, y, size, lineHeight, font, color);
}

function drawLines(page: any, lines: string[], x: number, y: number, size: number, lineHeight: number, font: any, color: any) {
  let currentY = y;
  for (const line of lines) {
    page.drawText(line, { x, y: currentY, size, font, color });
    currentY -= lineHeight;
  }

  return currentY;
}

function wrapText(text: string, maxWidth: number, size: number, font: any) {
  const source = (text || '-').replace(/\s+/g, ' ').trim();
  const words = source.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) {
      lines.push(line);
      line = '';
    }

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      line = word;
    } else {
      const chunks = splitLongWord(word, maxWidth, size, font);
      lines.push(...chunks.slice(0, -1));
      line = chunks[chunks.length - 1] || '';
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : ['-'];
}

function splitLongWord(word: string, maxWidth: number, size: number, font: any) {
  const chunks: string[] = [];
  let chunk = '';

  for (const char of Array.from(word)) {
    const candidate = `${chunk}${char}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      chunk = candidate;
      continue;
    }

    if (chunk) {
      chunks.push(chunk);
    }
    chunk = char;
  }

  if (chunk) {
    chunks.push(chunk);
  }

  return chunks;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 3))}...` : value;
}
