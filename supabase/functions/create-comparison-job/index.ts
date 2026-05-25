import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const GUEST_EXPIRY_HOURS = 24;

type UploadedSide = 'A' | 'B';

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
    const quoteA = formData.get('quoteA') as File | null;
    const quoteB = formData.get('quoteB') as File | null;

    assertPdf(quoteA, 'quoteA');
    assertPdf(quoteB, 'quoteB');

    const guestAccessToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + GUEST_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    const { data: job, error: jobError } = await supabase
      .from('comparison_jobs')
      .insert({
        status: 'uploaded',
        quote_a_name: quoteA.name,
        quote_b_name: quoteB.name,
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

    const files: Array<{ side: UploadedSide; file: File; storagePath: string }> = [
      { side: 'A', file: quoteA, storagePath: `guests/${job.id}/quote-a.pdf` },
      { side: 'B', file: quoteB, storagePath: `guests/${job.id}/quote-b.pdf` },
    ];

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
    }

    const { error: filesError } = await supabase.from('uploaded_files').insert(
      files.map((item) => ({
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

    return jsonResponse({
      jobId: job.id,
      guestAccessToken: job.guest_access_token,
      expiresAt: job.expires_at,
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
