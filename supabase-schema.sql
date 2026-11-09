-- Jalankan di Supabase → SQL Editor
create table if not exists searches (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  region text default 'ID',
  created_at timestamptz default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references searches(id) on delete cascade,
  product_id text,
  product_name text,
  score int,
  created_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid references recommendations(id) on delete cascade,
  status text not null check (status in ('success','failed')),
  created_at timestamptz default now()
);

-- RLS: app memakai anon key, jadi perlu policy insert + select
alter table searches enable row level security;
alter table recommendations enable row level security;
alter table feedback enable row level security;

create policy "anon insert searches" on searches for insert to anon with check (true);
create policy "anon select searches" on searches for select to anon using (true);
create policy "anon insert recs" on recommendations for insert to anon with check (true);
create policy "anon select recs" on recommendations for select to anon using (true);
create policy "anon insert feedback" on feedback for insert to anon with check (true);
create policy "anon select feedback" on feedback for select to anon using (true);
