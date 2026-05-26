import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';
import * as pdfjsLib from 'npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_UPLOAD_FILES = 5;
const GUEST_EXPIRY_HOURS = 24;
const SIDES: UploadedSide[] = ['A', 'B', 'C', 'D', 'E'];

type UploadedSide = 'A' | 'B' | 'C' | 'D' | 'E';
type ParsedQuoteItem = {
  itemName: string;
  rawText: string;
  totalPrice: number | null;
  quoteValue: string;
  pricingBasis: string | null;
};
type AnalysisItem = {
  item_label: string;
  quote_a_value: string;
  quote_b_value: string;
  delta_value: string;
  status: 'matched' | 'only_in_a' | 'only_in_b' | 'different_basis';
  insight: string;
  sort_order: number;
};
type AnalysisResult = {
  title: string;
  summary: string;
  recommendedQuote: string;
  estimatedSavings: number;
  coverageGaps: number;
  matchedLowerCount: number;
  matchedCount: number;
  items: AnalysisItem[];
  insights: string[];
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assertPdf(file: File | null, label: string): asserts file is File {
  if (!file) {
    throw new Error(`${label} is required.`);
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error(`${label} must be a PDF file.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${label} must be 20MB or smaller.`);
  }
}

async function extractPdfText(file: File) {
  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjsLib.getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
  }).promise;
  const lines: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const groupedLines = new Map<number, Array<{ x: number; text: string }>>();

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) {
        continue;
      }

      const transform = 'transform' in item ? item.transform : [0, 0, 0, 0, 0, 0];
      const x = Number(transform[4] || 0);
      const y = Math.round(Number(transform[5] || 0) / 3) * 3;
      const existing = groupedLines.get(y) || [];
      existing.push({ x, text: item.str.trim() });
      groupedLines.set(y, existing);
    }

    [...groupedLines.entries()]
      .sort(([a], [b]) => b - a)
      .forEach(([, parts]) => {
        const line = parts
          .sort((a, b) => a.x - b.x)
          .map((part) => part.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (line) {
          lines.push(line);
        }
      });
  }

  return lines.join('\n');
}

function parseMoneyValue(value: string) {
  const numeric = value.replace(/[^\d.-]/g, '');
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return '-';
  }

  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function detectPricingBasis(line: string) {
  const lower = line.toLowerCase();

  if (/(\/\s?kg|per\s+kg|1\s?kg|kg당|킬로|키로)/i.test(lower)) {
    return 'per_kg';
  }

  if (/(\/\s?km|per\s+km|1\s?km|km당|거리|distance)/i.test(lower)) {
    return 'per_km';
  }

  if (/(fixed|flat|lump|고정|정액|일괄)/i.test(lower)) {
    return 'fixed';
  }

  if (/(hour|hr|시간|일당|day|monthly|월)/i.test(lower)) {
    return 'time_based';
  }

  return null;
}

function parseQuoteItems(text: string): ParsedQuoteItem[] {
  const moneyPattern = /(?:[$€¥₩]\s*)?-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:원|엔|달러|usd|krw|jpy)?/gi;
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 4);

  const parsedItems: ParsedQuoteItem[] = [];

  for (const line of lines) {
    const matches = [...line.matchAll(moneyPattern)]
      .map((match) => match[0])
      .filter((match) => /[$€¥₩,]|원|엔|달러|usd|krw|jpy/i.test(match) || Number(match.replace(/[^\d.-]/g, '')) >= 10);

    if (matches.length === 0) {
      continue;
    }

    const totalPrice = parseMoneyValue(matches[matches.length - 1]);

    if (totalPrice === null || totalPrice <= 0) {
      continue;
    }

    const firstAmountIndex = line.indexOf(matches[0]);
    const leadingText = firstAmountIndex > 0 ? line.slice(0, firstAmountIndex).trim() : line;
    const itemName = leadingText
      .replace(/^\d+[.)\-\s]+/, '')
      .replace(/\b(qty|quantity|unit|price|total|amount|subtotal|견적|합계|수량|단가|금액)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!itemName || itemName.length < 2) {
      continue;
    }

    parsedItems.push({
      itemName,
      rawText: line,
      totalPrice,
      quoteValue: formatCurrency(totalPrice),
      pricingBasis: detectPricingBasis(line),
    });
  }

  return parsedItems.slice(0, 80);
}

function normalizeItemName(value: string) {
  return value
    .toLowerCase()
    .replace(/["'“”]/g, '')
    .replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龯]+/g, ' ')
    .replace(/\b(the|and|for|with|item|quote|quotation|total|amount)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string) {
  const left = normalizeItemName(a);
  const right = normalizeItemName(b);

  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  if (left.includes(right) || right.includes(left)) {
    return 0.82;
  }

  const leftTokens = new Set(left.split(' '));
  const rightTokens = new Set(right.split(' '));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;

  return union ? intersection / union : 0;
}

function buildInsight(item: ParsedQuoteItem | null, other: ParsedQuoteItem | null, status: AnalysisItem['status'], delta: number | null) {
  if (status === 'only_in_a') {
    return 'This item appears only in Quote A.';
  }

  if (status === 'only_in_b') {
    return 'This item appears only in Quote B.';
  }

  if (status === 'different_basis') {
    return 'The pricing basis differs, so normalize the unit before final approval.';
  }

  if (delta === null || !item || !other) {
    return 'Matched line item.';
  }

  if (delta < 0) {
    return 'Quote B is lower for this matched line item.';
  }

  if (delta > 0) {
    return 'Quote A is lower for this matched line item.';
  }

  return 'Both quotes are equal for this matched line item.';
}

function analyzeQuotes(quoteAItems: ParsedQuoteItem[], quoteBItems: ParsedQuoteItem[]): AnalysisResult {
  const usedB = new Set<number>();
  const items: AnalysisItem[] = [];
  let matchedCount = 0;
  let matchedLowerCount = 0;
  let totalA = 0;
  let totalB = 0;

  quoteAItems.forEach((quoteAItem) => {
    let bestIndex = -1;
    let bestScore = 0;

    quoteBItems.forEach((quoteBItem, index) => {
      if (usedB.has(index)) {
        return;
      }

      const score = similarity(quoteAItem.itemName, quoteBItem.itemName);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0 && bestScore >= 0.45) {
      const quoteBItem = quoteBItems[bestIndex];
      usedB.add(bestIndex);
      matchedCount += 1;
      totalA += quoteAItem.totalPrice || 0;
      totalB += quoteBItem.totalPrice || 0;

      const delta = (quoteBItem.totalPrice || 0) - (quoteAItem.totalPrice || 0);
      const isDifferentBasis =
        Boolean(quoteAItem.pricingBasis || quoteBItem.pricingBasis) &&
        quoteAItem.pricingBasis !== quoteBItem.pricingBasis;

      if (delta < 0) {
        matchedLowerCount += 1;
      }

      items.push({
        item_label: quoteAItem.itemName,
        quote_a_value: quoteAItem.quoteValue,
        quote_b_value: quoteBItem.quoteValue,
        delta_value: isDifferentBasis ? 'Different basis' : `${delta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(delta))}`,
        status: isDifferentBasis ? 'different_basis' : 'matched',
        insight: buildInsight(quoteAItem, quoteBItem, isDifferentBasis ? 'different_basis' : 'matched', delta),
        sort_order: items.length,
      });
      return;
    }

    items.push({
      item_label: quoteAItem.itemName,
      quote_a_value: quoteAItem.quoteValue,
      quote_b_value: '-',
      delta_value: 'Only in A',
      status: 'only_in_a',
      insight: buildInsight(quoteAItem, null, 'only_in_a', null),
      sort_order: items.length,
    });
  });

  quoteBItems.forEach((quoteBItem, index) => {
    if (usedB.has(index)) {
      return;
    }

    items.push({
      item_label: quoteBItem.itemName,
      quote_a_value: '-',
      quote_b_value: quoteBItem.quoteValue,
      delta_value: 'Only in B',
      status: 'only_in_b',
      insight: buildInsight(null, quoteBItem, 'only_in_b', null),
      sort_order: items.length,
    });
  });

  const estimatedSavings = Math.max(0, totalA - totalB);
  const coverageGaps = items.filter((item) => item.status === 'only_in_a' || item.status === 'only_in_b').length;
  const recommendedQuote = totalB && (!totalA || totalB <= totalA) ? 'Quote B' : 'Quote A';
  const title = `${recommendedQuote} is the stronger choice`;
  const summary =
    matchedCount > 0
      ? `${recommendedQuote} is lower across matched line items by ${formatCurrency(estimatedSavings)}. Review coverage gaps and different-basis items before final approval.`
      : 'QuoteWise extracted line items, but could not confidently match overlapping items. Review both documents manually before approval.';
  const insights = [
    matchedCount > 0
      ? `${matchedCount} matched line item${matchedCount === 1 ? '' : 's'} were compared.`
      : 'No confident line-item matches were found.',
    coverageGaps > 0
      ? `${coverageGaps} item${coverageGaps === 1 ? '' : 's'} appear in only one quote.`
      : 'No coverage gaps were detected.',
    items.some((item) => item.status === 'different_basis')
      ? 'At least one item uses a different pricing basis and needs normalization.'
      : 'No different-basis item was detected by the rule parser.',
  ];

  return {
    title,
    summary,
    recommendedQuote,
    estimatedSavings,
    coverageGaps,
    matchedLowerCount,
    matchedCount,
    items: items.slice(0, 40),
    insights,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  let jobId: string | null = null;
  const uploadedPaths: string[] = [];

  try {
    const supabaseUrl = getRequiredEnv('SUPABASE_URL');
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const formData = await req.formData();
    const quoteFiles = formData
      .getAll('quoteFiles')
      .filter((value): value is File => value instanceof File);
    const legacyQuoteA = formData.get('quoteA') as File | null;
    const legacyQuoteB = formData.get('quoteB') as File | null;
    const incomingFiles = quoteFiles.length ? quoteFiles : [legacyQuoteA, legacyQuoteB].filter((file): file is File => Boolean(file));

    if (incomingFiles.length < 2) {
      throw new Error('At least 2 PDF files are required.');
    }

    if (incomingFiles.length > MAX_UPLOAD_FILES) {
      throw new Error(`Up to ${MAX_UPLOAD_FILES} PDF files can be uploaded.`);
    }

    incomingFiles.forEach((file, index) => {
      assertPdf(file, `quoteFiles[${index}]`);
    });

    const guestAccessToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + GUEST_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    const { data: job, error: jobError } = await supabase
      .from('comparison_jobs')
      .insert({
        status: 'uploaded',
        quote_a_name: incomingFiles[0].name,
        quote_b_name: incomingFiles[1].name,
        is_guest: true,
        guest_access_token: guestAccessToken,
        expires_at: expiresAt,
      })
      .select('id, guest_access_token, expires_at')
      .single();

    if (jobError || !job) {
      throw new Error(jobError?.message || 'Failed to create comparison job.');
    }

    jobId = job.id;

    const files: Array<{ side: UploadedSide; file: File; storagePath: string }> = incomingFiles.map((file, index) => {
      const side = SIDES[index];

      return {
        side,
        file,
        storagePath: `guests/${job.id}/quote-${side.toLowerCase()}.pdf`,
      };
    });
    const extractedText: Record<UploadedSide, string> = {
      A: '',
      B: '',
      C: '',
      D: '',
      E: '',
    };

    for (const item of files) {
      const { error: uploadError } = await supabase.storage
        .from('quote-files')
        .upload(item.storagePath, item.file, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedPaths.push(item.storagePath);
      extractedText[item.side] = await extractPdfText(item.file);
    }

    const quoteAItems = parseQuoteItems(extractedText.A);
    const quoteBItems = parseQuoteItems(extractedText.B);
    const analysis = analyzeQuotes(quoteAItems, quoteBItems);

    const { error: filesError } = await supabase.from('uploaded_files').insert(
      files.map((item) => ({
        job_id: job.id,
        user_id: null,
        side: item.side,
        original_filename: item.file.name,
        storage_path: item.storagePath,
        mime_type: item.file.type || 'application/pdf',
        file_size: item.file.size,
        extracted_text: extractedText[item.side],
      })),
    );

    if (filesError) {
      throw new Error(filesError.message);
    }

    const parsedItemsBySide: Record<UploadedSide, ParsedQuoteItem[]> = {
      A: quoteAItems,
      B: quoteBItems,
      C: parseQuoteItems(extractedText.C),
      D: parseQuoteItems(extractedText.D),
      E: parseQuoteItems(extractedText.E),
    };
    const quoteItemPayload = files.flatMap(({ side }) =>
      parsedItemsBySide[side].map((item) => ({
          job_id: job.id,
          side,
          item_name: item.itemName,
          total_price: item.totalPrice,
          pricing_basis: item.pricingBasis,
          raw_text: item.rawText,
      })),
    );
    let quoteItemRowCount = 0;

    if (quoteItemPayload.length > 0) {
      const { data: insertedQuoteItems, error: quoteItemsError } = await supabase
        .from('quote_items')
        .insert(quoteItemPayload)
        .select('id');

      if (quoteItemsError) {
        throw new Error(quoteItemsError.message);
      }

      quoteItemRowCount = insertedQuoteItems?.length || 0;
    }

    const { error: comparisonItemsError } = await supabase.from('comparison_items').insert(
      analysis.items.map((item) => ({
        job_id: job.id,
        item_label: item.item_label,
        quote_a_value: item.quote_a_value,
        quote_b_value: item.quote_b_value,
        delta_value: item.delta_value,
        status: item.status,
        insight: item.insight,
        sort_order: item.sort_order,
      })),
    );

    if (comparisonItemsError) {
      throw new Error(comparisonItemsError.message);
    }

    const { error: insightsError } = await supabase.from('comparison_insights').insert(
      analysis.insights.map((insight, index) => ({
        job_id: job.id,
        insight,
        severity: index === 0 ? 'info' : 'warning',
        sort_order: index,
      })),
    );

    if (insightsError) {
      throw new Error(insightsError.message);
    }

    const { error: updateJobError } = await supabase
      .from('comparison_jobs')
      .update({
        status: 'analyzed',
        recommended_quote: analysis.recommendedQuote,
        estimated_savings: analysis.estimatedSavings,
        summary: analysis.summary,
      })
      .eq('id', job.id);

    if (updateJobError) {
      throw new Error(updateJobError.message);
    }

    return jsonResponse({
      jobId: job.id,
      guestAccessToken: job.guest_access_token,
      expiresAt: job.expires_at,
      analysis,
      extracted: {
        quoteAItemCount: quoteAItems.length,
        quoteBItemCount: quoteBItems.length,
        quoteItemRowCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected upload error.';

    return jsonResponse(
      {
        error: message,
        jobId,
        uploadedPaths,
      },
      400,
    );
  }
});
