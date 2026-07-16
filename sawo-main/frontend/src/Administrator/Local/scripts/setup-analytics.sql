-- setup-analytics.sql
-- Creates the two tables the existing /admin/analytics dashboard reads
-- (Analytics.jsx) and the first-party tracker writes (src/local-storage/track.js).
-- Run once in the Supabase SQL editor (same workflow as setup-site-content.sql).

create table if not exists public.analytics_page_views (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,
  page_path    text not null,
  time_on_page integer,           -- seconds; patched when the visitor leaves the page
  country      text,              -- unused for now (no geo lookup, keeps tracking light)
  device_type  text,              -- mobile | tablet | desktop
  browser      text,              -- Chrome | Safari | Firefox | Edge | Other
  "timestamp"  timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  event_name  text not null,
  page_path   text,
  event_data  jsonb,
  "timestamp" timestamptz not null default now()
);

-- Dashboard filters by timestamp range on every load
create index if not exists analytics_page_views_timestamp_idx on public.analytics_page_views ("timestamp");
create index if not exists analytics_events_timestamp_idx on public.analytics_events ("timestamp");

-- RLS: the tracker inserts/patches with the anon key from visitors' browsers,
-- and the admin dashboard reads with the same anon key (the app's custom auth
-- doesn't use Supabase Auth). This matches the permissive posture of the
-- site's other tables. time_on_page updates are limited to that use case only
-- in practice (the client only ever PATCHes time_on_page by row id).
alter table public.analytics_page_views enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "anon can insert page views" on public.analytics_page_views;
create policy "anon can insert page views" on public.analytics_page_views
  for insert to anon, authenticated with check (true);

drop policy if exists "anon can update page views" on public.analytics_page_views;
create policy "anon can update page views" on public.analytics_page_views
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "anon can read page views" on public.analytics_page_views;
create policy "anon can read page views" on public.analytics_page_views
  for select to anon, authenticated using (true);

drop policy if exists "anon can insert events" on public.analytics_events;
create policy "anon can insert events" on public.analytics_events
  for insert to anon, authenticated with check (true);

drop policy if exists "anon can read events" on public.analytics_events;
create policy "anon can read events" on public.analytics_events
  for select to anon, authenticated using (true);
