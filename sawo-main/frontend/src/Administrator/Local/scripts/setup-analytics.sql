-- setup-analytics.sql
-- Creates the two tables the existing /admin/analytics dashboard reads
-- (Analytics.jsx) and the first-party tracker writes (src/local-storage/track.js).
-- Run once in the Supabase SQL editor (same workflow as setup-site-content.sql).

create table if not exists public.analytics_page_views (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,
  page_path    text not null,
  time_on_page integer,           -- seconds; patched when the visitor leaves the page
  country      text,              -- looked up server-side from the visitor's IP via ipapi.co
  region       text,              -- looked up server-side from the visitor's IP via ipapi.co
  city         text,              -- looked up server-side from the visitor's IP via ipapi.co
  device_type  text,              -- mobile | tablet | desktop
  browser      text,              -- Chrome | Safari | Firefox | Edge | Other
  os           text,              -- Windows | macOS | iOS | Android | GNU/Linux | Other
  screen_size  text,              -- Mobile | Tablet | Laptop | Desktop (viewport-width buckets)
  referrer     text,              -- external referrer hostname; null = direct visit
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  "timestamp"  timestamptz not null default now()
);

-- Existing deployments: add the new column if the table already exists.
alter table public.analytics_page_views add column if not exists city text;

-- Plausible-style dashboard upgrade: acquisition + richer device/geo dimensions.
alter table public.analytics_page_views add column if not exists referrer     text;
alter table public.analytics_page_views add column if not exists utm_source   text;
alter table public.analytics_page_views add column if not exists utm_medium   text;
alter table public.analytics_page_views add column if not exists utm_campaign text;
alter table public.analytics_page_views add column if not exists region       text;
alter table public.analytics_page_views add column if not exists os           text;
alter table public.analytics_page_views add column if not exists screen_size  text;

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

-- RLS: writes to analytics_page_views now happen ONLY server-side, via
-- backend/trackingApi.js using the Supabase service-role key (which bypasses
-- RLS entirely — no insert/update policy is needed or granted to anon
-- anymore). This closes the previous hole where anyone with devtools and the
-- public anon key could spoof rows directly against the REST API.
--
-- The admin dashboard (Analytics.jsx) still reads via the anon key (the
-- app's custom auth doesn't use Supabase Auth), so the anon SELECT policy
-- is kept.
alter table public.analytics_page_views enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "anon can insert page views" on public.analytics_page_views;
drop policy if exists "anon can update page views" on public.analytics_page_views;

drop policy if exists "anon can read page views" on public.analytics_page_views;
create policy "anon can read page views" on public.analytics_page_views
  for select to anon, authenticated using (true);

drop policy if exists "anon can insert events" on public.analytics_events;
create policy "anon can insert events" on public.analytics_events
  for insert to anon, authenticated with check (true);

drop policy if exists "anon can read events" on public.analytics_events;
create policy "anon can read events" on public.analytics_events
  for select to anon, authenticated using (true);