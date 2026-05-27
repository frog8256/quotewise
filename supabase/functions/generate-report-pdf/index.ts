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
const navy = rgb(0.06, 0.14, 0.25);
const slate = rgb(0.32, 0.39, 0.49);
const blue = rgb(0.15, 0.39, 0.92);
const green = rgb(0.02, 0.47, 0.34);
const border = rgb(0.84, 0.89, 0.95);
const softBlue = rgb(0.95, 0.98, 1);

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

type PdfPayload = {
  labels: {
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

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageNumber = 1;

  const newPage = () => {
    drawFooter(page, font, pageNumber);
    pageNumber += 1;
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    drawHeader(page, font);
  };

  const ensureSpace = (height: number) => {
    if (y - height < margin + 28) {
      newPage();
    }
  };

  drawHeader(page, font);
  page.drawText('QUOTEWISE ANALYSIS REPORT', {
    x: margin,
    y,
    size: 9,
    font,
    color: blue,
    characterSpacing: 1.6,
  });
  y -= 28;

  y = drawWrappedText(page, report.title, margin, y, pageWidth - margin * 2, 25, 32, font, navy);
  y -= 8;
  y = drawWrappedText(page, report.summary, margin, y, pageWidth - margin * 2, 11, 17, font, slate);
  y -= 18;

  drawInfoBox(page, font, labels.preparedBy, report.quotePair, margin, y - 42, pageWidth - margin * 2, 42);
  y -= 66;

  const metricWidth = (pageWidth - margin * 2 - 24) / 3;
  drawMetric(page, font, labels.totalSavings, report.estimatedSavings, margin, y - 72, metricWidth, 72);
  drawMetric(page, font, labels.recommendedVendor, report.recommendedQuote, margin + metricWidth + 12, y - 72, metricWidth, 72);
  drawMetric(page, font, labels.coverageGaps, report.coverageGaps, margin + (metricWidth + 12) * 2, y - 72, metricWidth, 72);
  y -= 102;

  ensureSpace(56);
  page.drawText(labels.summary, { x: margin, y, size: 16, font, color: navy });
  y -= 24;
  y = drawComparisonTable(page, font, report, labels, y, ensureSpace, () => {
    newPage();
    return page;
  });

  ensureSpace(80);
  y -= 18;
  page.drawText(labels.keyInsights, { x: margin, y, size: 16, font, color: navy });
  y -= 18;

  const insights = report.insights.length ? report.insights : ['No data'];
  for (const insight of insights) {
    const lines = wrapText(insight, pageWidth - margin * 2 - 24, 10, font);
    ensureSpace(lines.length * 15 + 18);
    page.drawText('•', { x: margin + 4, y, size: 10, font, color: green });
    y = drawLines(page, lines, margin + 24, y, 10, 15, font, slate);
    y -= 8;
  }

  ensureSpace(72);
  y -= 6;
  drawRecommendation(page, font, labels.recommendation, report.recommendation, margin, y - 62, pageWidth - margin * 2, 62);

  drawFooter(page, font, pageNumber);
  return pdf.save();
}

function drawHeader(page: any, font: any) {
  page.drawText('QuoteWise', {
    x: margin,
    y: pageHeight - 24,
    size: 12,
    font,
    color: navy,
  });
  page.drawLine({
    start: { x: margin, y: pageHeight - 34 },
    end: { x: pageWidth - margin, y: pageHeight - 34 },
    thickness: 0.5,
    color: border,
  });
}

function drawFooter(page: any, font: any, pageNumber: number) {
  page.drawLine({
    start: { x: margin, y: 30 },
    end: { x: pageWidth - margin, y: 30 },
    thickness: 0.5,
    color: border,
  });
  page.drawText(`QuoteWise - Page ${pageNumber}`, {
    x: margin,
    y: 16,
    size: 8,
    font,
    color: slate,
  });
}

function drawInfoBox(page: any, font: any, label: string, value: string, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, borderColor: border, borderWidth: 1, color: softBlue });
  page.drawText(label, { x: x + 14, y: y + height - 16, size: 8, font, color: slate });
  drawWrappedText(page, value, x + 14, y + height - 28, width - 28, 10, 13, font, navy);
}

function drawMetric(page: any, font: any, label: string, value: string, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, borderColor: border, borderWidth: 1, color: rgb(1, 1, 1) });
  page.drawText(label.toUpperCase(), { x: x + 14, y: y + height - 20, size: 8, font, color: slate });
  drawWrappedText(page, value, x + 14, y + height - 42, width - 28, 18, 22, font, navy);
}

function drawRecommendation(page: any, font: any, label: string, value: string, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, borderColor: border, borderWidth: 1, color: softBlue });
  page.drawText(label.toUpperCase(), { x: x + 16, y: y + height - 20, size: 8, font, color: slate, characterSpacing: 1.2 });
  drawWrappedText(page, value, x + 16, y + height - 40, width - 32, 13, 17, font, navy);
}

function drawComparisonTable(
  page: any,
  font: any,
  report: PdfReport,
  labels: PdfPayload['labels'],
  startY: number,
  ensureSpace: (height: number) => void,
  newPage: () => any,
) {
  let currentPage = page;
  let y = startY;
  const tableWidth = pageWidth - margin * 2;
  const vendorCount = Math.max(report.vendors.length, 1);
  const itemWidth = Math.max(180, tableWidth * 0.28);
  const deltaWidth = 90;
  const vendorWidth = (tableWidth - itemWidth - deltaWidth) / vendorCount;

  const drawTableHeader = () => {
    currentPage.drawRectangle({ x: margin, y: y - 24, width: tableWidth, height: 24, color: softBlue, borderColor: border, borderWidth: 1 });
    currentPage.drawText(labels.item, { x: margin + 8, y: y - 16, size: 8, font, color: slate });
    report.vendors.forEach((vendor, index) => {
      currentPage.drawText(truncate(vendor, 18), { x: margin + itemWidth + vendorWidth * index + 8, y: y - 16, size: 8, font, color: slate });
    });
    currentPage.drawText(labels.delta, { x: margin + itemWidth + vendorWidth * vendorCount + 8, y: y - 16, size: 8, font, color: slate });
    y -= 24;
  };

  drawTableHeader();

  for (const row of report.rows) {
    const itemLines = wrapText(row.itemLabel, itemWidth - 16, 10, font);
    const insightLines = wrapText(row.insight, itemWidth - 16, 8, font).slice(0, 3);
    const cellLineCounts = row.cells.map((cell) => wrapText(cell.value, vendorWidth - 16, 9, font).length + (cell.rawTerm ? 1 : 0));
    const deltaLines = wrapText(row.delta, deltaWidth - 16, 9, font);
    const rowHeight = Math.max(44, (Math.max(itemLines.length + insightLines.length, ...cellLineCounts, deltaLines.length) + 1) * 13);

    if (y - rowHeight < margin + 40) {
      currentPage = newPage();
      y = pageHeight - margin - 18;
      drawTableHeader();
    }

    currentPage.drawRectangle({ x: margin, y: y - rowHeight, width: tableWidth, height: rowHeight, borderColor: border, borderWidth: 0.7, color: rgb(1, 1, 1) });
    let textY = y - 14;
    textY = drawLines(currentPage, itemLines, margin + 8, textY, 10, 13, font, navy);
    drawLines(currentPage, insightLines, margin + 8, textY - 3, 8, 11, font, slate);

    row.cells.forEach((cell, index) => {
      let cellY = y - 14;
      const lines = wrapText(cell.value, vendorWidth - 16, 9, font);
      cellY = drawLines(currentPage, lines, margin + itemWidth + vendorWidth * index + 8, cellY, 9, 12, font, navy);
      if (cell.rawTerm) {
        drawWrappedText(currentPage, cell.rawTerm, margin + itemWidth + vendorWidth * index + 8, cellY - 2, vendorWidth - 16, 7, 10, font, slate);
      }
    });

    drawLines(currentPage, deltaLines, margin + itemWidth + vendorWidth * vendorCount + 8, y - 14, 9, 12, font, navy);
    y -= rowHeight;
  }

  return y;
}

function drawWrappedText(page: any, text: string, x: number, y: number, maxWidth: number, size: number, lineHeight: number, font: any, color: any) {
  const lines = wrapText(text || '-', maxWidth, size, font);
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
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
