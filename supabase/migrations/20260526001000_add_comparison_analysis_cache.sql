create table if not exists public.comparison_analysis_cache (
  cache_key text primary key,
  language text not null,
  model text not null,
  file_count int not null,
  file_fingerprints jsonb not null,
  analysis jsonb not null,
  hit_count int not null default 0,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

alter table public.comparison_analysis_cache enable row level security;

create index if not exists comparison_analysis_cache_last_used_at_idx
on public.comparison_analysis_cache (last_used_at);
