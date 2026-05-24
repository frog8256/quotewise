import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseConfig = {
  supabaseUrl: string;
  supabaseKey: string;
};

const defaultSupabaseConfig: SupabaseConfig = {
  supabaseUrl: 'https://aylnpdrheactwwnhanyt.supabase.co',
  supabaseKey: 'sb_publishable_i9G_HBi9GxnfQhzBZeBe9w_oQOIvThK',
};

const supabaseConfig: SupabaseConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || defaultSupabaseConfig.supabaseUrl,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseConfig.supabaseKey,
};

const supabase: SupabaseClient | null =
  supabaseConfig.supabaseUrl && supabaseConfig.supabaseKey
    ? createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseKey)
    : null;

export default supabase;
