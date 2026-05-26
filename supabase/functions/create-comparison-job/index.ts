import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_UPLOAD_FILES = 5;
const GUEST_EXPIRY_HOURS = 24;
const SIDES = ['A', 'B', 'C', 'D', 'E'] as const;

type UploadedSide = (typeof SIDES)[number];
type VendorAnalysis = {
  side: UploadedSide;
  name: string;
  filename: string;
};
type AnalysisCell = {
  vendorSide: UploadedSide;
  value: string;
  rawTerm: string;
  included: boolean;
  pricingBasis?: string;
};
type AnalysisItem = {
  item_label: string;
  cells: AnalysisCell[];
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
  vendors: VendorAnalysis[];
  items: AnalysisItem[];
  insights: string[];
  risks: string[];
};
type OutputLanguage = 'en' | 'ko' | 'ja' | 'zh';
const languageLabels: Record<OutputLanguage, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Simplified Chinese',
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

function sanitizeName(value: string) {
  return value.replace(/[^a-zA-Z0-9가-힣ぁ-んァ-ン一-龯._ -]/g, '').slice(0, 160) || 'quote.pdf';
}

function normalizeCurrency(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `$${Math.round(value).toLocaleString('en-US')}`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return '-';
}

async function fileToDataUrl(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return `data:application/pdf;base64,${btoa(binary)}`;
}

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function createFileFingerprints(files: Array<{ side: UploadedSide; file: File }>) {
  return Promise.all(
    files.map(async ({ side, file }) => {
      const fileHash = bytesToHex(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));

      return {
        side,
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        hash: fileHash,
      };
    }),
  );
}

async function createCacheKey(
  language: OutputLanguage,
  fingerprints: Array<{ side: UploadedSide; name: string; size: number; type: string; hash: string }>,
) {
  return sha256(
    JSON.stringify({
      version: 2,
      model: 'gpt-4.1-mini',
      language,
      files: fingerprints.map((item) => ({
        side: item.side,
        size: item.size,
        hash: item.hash,
      })),
    }),
  );
}

function normalizeAnalysis(raw: unknown, files: Array<{ side: UploadedSide; file: File }>): AnalysisResult {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const vendorsRaw = Array.isArray(source.vendors) ? source.vendors : [];
  const vendors: VendorAnalysis[] = files.map(({ side, file }, index) => {
    const candidate = vendorsRaw.find((vendor) => vendor && typeof vendor === 'object' && (vendor as Record<string, unknown>).side === side) as
      | Record<string, unknown>
      | undefined;

    return {
      side,
      filename: file.name,
      name: typeof candidate?.name === 'string' && candidate.name.trim() ? candidate.name.trim() : `Quote ${side}`,
    };
  });
  const vendorSides = new Set(vendors.map((vendor) => vendor.side));
  const itemsRaw = Array.isArray(source.items) ? source.items : [];
  const items: AnalysisItem[] = itemsRaw.slice(0, 80).map((item, index) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const cellsRaw = Array.isArray(row.cells) ? row.cells : [];
    const cells: AnalysisCell[] = vendors.map((vendor) => {
      const rawCell = cellsRaw.find(
        (cell) => cell && typeof cell === 'object' && (cell as Record<string, unknown>).vendorSide === vendor.side,
      ) as Record<string, unknown> | undefined;
      const value = normalizeCurrency(rawCell?.value);
      const included = typeof rawCell?.included === 'boolean' ? rawCell.included : value !== '-';

      return {
        vendorSide: vendor.side,
        value: included ? value : '-',
        rawTerm: typeof rawCell?.rawTerm === 'string' ? rawCell.rawTerm.trim() : '',
        included,
        pricingBasis: typeof rawCell?.pricingBasis === 'string' ? rawCell.pricingBasis.trim() : undefined,
      };
    });
    const status = row.status === 'only_in_a' || row.status === 'only_in_b' || row.status === 'different_basis' ? row.status : 'matched';

    return {
      item_label: typeof row.item_label === 'string' && row.item_label.trim() ? row.item_label.trim() : `Item ${index + 1}`,
      cells,
      delta_value: typeof row.delta_value === 'string' && row.delta_value.trim() ? row.delta_value.trim() : '',
      status,
      insight: typeof row.insight === 'string' ? row.insight.trim() : '',
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
    };
  });
  const coverageGaps =
    Number(source.coverageGaps) ||
    items.filter((item) => item.cells.some((cell) => !cell.included) && item.cells.some((cell) => vendorSides.has(cell.vendorSide))).length;
  const insights = Array.isArray(source.insights)
    ? source.insights.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).slice(0, 8)
    : [];
  const risks = Array.isArray(source.risks)
    ? source.risks.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).slice(0, 8)
    : [];

  return {
    title: typeof source.title === 'string' && source.title.trim() ? source.title.trim() : 'QuoteWise comparison is ready',
    summary: typeof source.summary === 'string' && source.summary.trim() ? source.summary.trim() : 'Review the normalized items and vendor differences below.',
    recommendedQuote:
      typeof source.recommendedQuote === 'string' && source.recommendedQuote.trim()
        ? source.recommendedQuote.trim()
        : vendors[0]?.name || 'Quote A',
    estimatedSavings: Number.isFinite(Number(source.estimatedSavings)) ? Number(source.estimatedSavings) : 0,
    coverageGaps,
    matchedLowerCount: Number.isFinite(Number(source.matchedLowerCount)) ? Number(source.matchedLowerCount) : 0,
    matchedCount: Number.isFinite(Number(source.matchedCount)) ? Number(source.matchedCount) : items.length,
    vendors,
    items,
    insights: insights.length ? insights : ['AI normalized item names and compared vendor quote lines.'],
    risks,
  };
}

function getOutputText(payload: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }, label: string) {
  const outputText =
    typeof payload.output_text === 'string'
      ? payload.output_text
      : payload.output?.flatMap((item) => item.content || [])?.find((item) => item.text)?.text;

  if (!outputText) {
    throw new Error(`OpenAI ${label} did not return JSON text.`);
  }

  return outputText;
}

async function extractQuotesWithOpenAI(openAiKey: string, files: Array<{ side: UploadedSide; file: File }>) {
  const fileContent = await Promise.all(
    files.map(async ({ side, file }) => ({
      type: 'input_file',
      filename: `${side}-${sanitizeName(file.name)}`,
      file_data: await fileToDataUrl(file),
    })),
  );
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'You are QuoteWise extraction engine. Extract structured procurement quotation data from PDFs. Preserve vendor names, item names, raw terms, currencies, units, notes, and pricing basis exactly when possible. Return only valid JSON.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Extract every provided quotation PDF. Use sides A-E based on filenames. Return this JSON shape exactly: {"quotes":[{"side":"A","vendorName":string,"filename":string,"validityPeriod":string,"currency":string,"items":[{"rawTerm":string,"description":string,"quantity":string,"unit":string,"unitPrice":string,"totalPrice":string,"pricingBasis":string,"included":boolean,"notes":string}],"terms":[string],"hiddenCosts":[string],"risks":[string]}]}. Do not compare yet.',
            },
            ...fileContent,
          ],
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI extraction failed: ${errorText}`);
  }

  const payload = await response.json();

  return JSON.parse(getOutputText(payload, 'extraction'));
}

async function compareExtractedQuotesWithOpenAI(
  openAiKey: string,
  extractedQuotes: unknown,
  files: Array<{ side: UploadedSide; file: File }>,
  language: OutputLanguage,
) {
  const outputLanguage = languageLabels[language] || languageLabels.en;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            `You are QuoteWise, an expert procurement quotation analyst. Compare already-extracted supplier quotation data. Normalize item terminology, compare prices, detect missing/hidden costs, detect pricing-basis differences, and identify risk factors. Return only valid JSON. Write all user-facing analysis text in ${outputLanguage}. Keep vendor names and rawTerm exactly as written in the extracted data.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                `Compare this extracted quotation JSON. Extracted data: ${JSON.stringify(extractedQuotes)}. Normalize equivalent item names into one item_label in ${outputLanguage}, but preserve each quote's original term in rawTerm exactly as written. Include all vendors A-E that are provided. For each item, provide each vendor cell with value, rawTerm, included, and pricingBasis. Detect only-in-vendor items, different pricing basis, hidden costs, missing items, and risk factors. Write title, summary, item_label, delta_value, insight, insights, and risks in ${outputLanguage}. Keep rawTerm and vendor names untranslated. Use this JSON shape exactly: {"title":string,"summary":string,"recommendedQuote":string,"estimatedSavings":number,"coverageGaps":number,"matchedLowerCount":number,"matchedCount":number,"vendors":[{"side":"A","name":string,"filename":string}],"items":[{"item_label":string,"cells":[{"vendorSide":"A","value":string,"rawTerm":string,"included":boolean,"pricingBasis":string}],"delta_value":string,"status":"matched|only_in_a|only_in_b|different_basis","insight":string,"sort_order":number}],"insights":[string],"risks":[string]}.`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI comparison failed: ${errorText}`);
  }

  const payload = await response.json();

  return normalizeAnalysis(JSON.parse(getOutputText(payload, 'comparison')), files);
}

async function analyzeWithOpenAI(openAiKey: string, files: Array<{ side: UploadedSide; file: File }>, language: OutputLanguage) {
  const extractedQuotes = await extractQuotesWithOpenAI(openAiKey, files);

  return compareExtractedQuotesWithOpenAI(openAiKey, extractedQuotes, files, language);
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
    const openAiKey = getRequiredEnv('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const formData = await req.formData();
    const requestedLanguage = formData.get('language');
    const language: OutputLanguage =
      requestedLanguage === 'ko' || requestedLanguage === 'ja' || requestedLanguage === 'zh' || requestedLanguage === 'en'
        ? requestedLanguage
        : 'en';
    const quoteFiles = formData.getAll('quoteFiles').filter((value): value is File => value instanceof File);
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

    const files = incomingFiles.map((file, index) => ({
      side: SIDES[index],
      file,
      storagePath: `guests/pending/quote-${SIDES[index].toLowerCase()}.pdf`,
    }));
    const cacheFingerprints = await createFileFingerprints(files.map(({ side, file }) => ({ side, file })));
    const cacheKey = await createCacheKey(language, cacheFingerprints);
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

    const storedFiles = files.map((item) => ({
      ...item,
      storagePath: `guests/${job.id}/quote-${item.side.toLowerCase()}.pdf`,
    }));

    for (const item of storedFiles) {
      const { error: uploadError } = await supabase.storage.from('quote-files').upload(item.storagePath, item.file, {
        contentType: 'application/pdf',
        upsert: false,
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedPaths.push(item.storagePath);
    }

    const analysisFiles = storedFiles.map(({ side, file }) => ({ side, file }));
    const { data: cachedAnalysis } = await supabase
      .from('comparison_analysis_cache')
      .select('analysis, hit_count')
      .eq('cache_key', cacheKey)
      .maybeSingle();
    let cacheHit = false;
    let analysis: AnalysisResult;

    if (cachedAnalysis?.analysis) {
      cacheHit = true;
      analysis = normalizeAnalysis(cachedAnalysis.analysis, analysisFiles);
      await supabase
        .from('comparison_analysis_cache')
        .update({
          hit_count: Number(cachedAnalysis.hit_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('cache_key', cacheKey);
    } else {
      analysis = await analyzeWithOpenAI(openAiKey, analysisFiles, language);
      await supabase.from('comparison_analysis_cache').upsert({
        cache_key: cacheKey,
        language,
        model: 'gpt-4.1-mini',
        file_count: storedFiles.length,
        file_fingerprints: cacheFingerprints,
        analysis,
        hit_count: 0,
        last_used_at: new Date().toISOString(),
      });
    }
    const { error: filesError } = await supabase.from('uploaded_files').insert(
      storedFiles.map((item) => ({
        job_id: job.id,
        user_id: null,
        side: item.side,
        original_filename: item.file.name,
        storage_path: item.storagePath,
        mime_type: item.file.type || 'application/pdf',
        file_size: item.file.size,
      })),
    );

    if (filesError) {
      throw new Error(filesError.message);
    }

    const { error: comparisonItemsError } = await supabase.from('comparison_items').insert(
      analysis.items.slice(0, 80).map((item) => ({
        job_id: job.id,
        item_label: item.item_label,
        quote_a_value: item.cells.find((cell) => cell.vendorSide === 'A')?.value || '-',
        quote_b_value: item.cells.find((cell) => cell.vendorSide === 'B')?.value || '-',
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
      [...analysis.insights, ...analysis.risks].slice(0, 16).map((insight, index) => ({
        job_id: job.id,
        insight,
        severity: index < analysis.insights.length ? 'info' : 'warning',
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
      cacheHit,
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
