-- Skema 3Search untuk Supabase (PostgreSQL)
-- Jalankan di SQL Editor setelah project Supabase dibuat.
-- Server memakai SERVICE ROLE KEY, sehingga RLS tetap aktif tanpa policy anon.

create extension if not exists "pgcrypto";

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  region text not null default 'ID',
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.searches (id) on delete cascade,
  product_id text not null,
  product_name text not null,
  score integer not null default 0 check (score between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  status text not null check (status in ('success', 'failed')),
  created_at timestamptz not null default now(),
  constraint feedback_recommendation_unique unique (recommendation_id)
);

create index if not exists searches_created_at_idx
  on public.searches (created_at desc);

create index if not exists recommendations_search_id_idx
  on public.recommendations (search_id);

create index if not exists recommendations_product_id_idx
  on public.recommendations (product_id);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

alter table public.searches enable row level security;
alter table public.recommendations enable row level security;
alter table public.feedback enable row level security;

-- Sengaja tidak ada policy untuk anon/authenticated:
-- hanya service role (server 3Search) yang boleh membaca/menulis.
