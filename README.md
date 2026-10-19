# SAWO Web System

The SAWO product website and its built-in content management system (CMS), in one React application.

- **Public site:** browse SAWO sauna heaters, sauna rooms, steam and infrared products. Includes a sauna heater sizing calculator, a 3D room viewer, support downloads, a contact form, and 8 URL-prefixed languages.
- **CMS** at `/admin`: staff edit products, sauna rooms, translations (including AI-assisted translation), media, SEO, users and site settings. Edits go live without a redeploy.

The app is hosted on **Cloudflare Pages** with Pages Functions and R2. Data and logins are in **Supabase**, and a **Neon** Postgres database mirrors the main catalogue tables.

> 📘 **Full documentation:** [`docs/Web_System_Documentation.pdf`](docs/Web_System_Documentation.pdf) is a 43-page guide covering architecture, every page and CMS module, workflows, the API, configuration and troubleshooting, with annotated screenshots and diagrams. Its editable source and regeneration scripts are in [`docs/web-system/`](docs/web-system/).
>
> Note: `docs/` is listed in `.gitignore` as internal documentation. The PDF and the screenshots below exist in local checkouts but are **not pushed to GitHub** unless that rule is changed.

| Home | Product page | CMS login |
|---|---|---|
| ![Home page](docs/web-system/screenshots/01-home.png) | ![Product page](docs/web-system/screenshots/05-product-detail.png) | ![CMS login](docs/web-system/screenshots/17-cms-login.png) |

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Commands](#commands)
- [Database](#database)
- [Server endpoints](#server-endpoints)
- [Authentication and permissions](#authentication-and-permissions)
- [Testing](#testing)
- [Build and deployment](#build-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Known issues](#known-issues)
- [More documentation](#more-documentation)

## Features

**Public website** (`sawo-main/frontend/src/pages`)
- Category hubs: Sauna, Heaters (Wall-Mounted, Tower, Stone, Floor, Combi, Dragonfire), Controls, 10 accessory categories, Rooms, Steam and Infrared.
- All-products catalogue (`/products`), organised by tabs and sidebar sections, plus product, accessory and sauna-room detail pages.
- Sauna volume calculator (`/support/sauna-calculator`) that recommends a heater size in kW.
- Interactive 3D sauna-room viewer (`/3d-viewer`), driven by the `sauna_rooms.model_3d_url` field.
- User manuals, the product catalogue PDF, FAQ, About, News, Sustainability and Careers pages.
- Contact form that sends an e-mail, creates an Odoo helpdesk ticket and logs to the CMS Inbox.
- Eight languages via URL prefix: English unprefixed, plus `/fi`, `/de`, `/zh`, `/ja`, `/fr`, `/es` and `/th`. The language switcher is controlled from CMS Settings.
- SEO: per-page metadata with CMS overrides, hreflang, sitemap, about 100 legacy WordPress 301 redirects, and 14 prerendered pages.
- First-party analytics through Cloudflare Functions, plus optional PostHog.

**Admin CMS** (`sawo-main/frontend/src/Administrator`, under `/login` and `/admin/*`)
- Products and Sauna Rooms: create, edit, duplicate, schedule, publish, revision history, bulk actions, and CSV import/export.
- Media uploads to Cloudflare R2. Images are converted to WebP in the browser.
- Translations: per-language status, manual edits, and AI translation jobs through OpenRouter with usage tracking.
- Taxonomy, Models, Logs, Inbox, Analytics, Page Performance (SEO overrides), Keywords, Website Health and CI Status.
- Users, role permissions, Settings (language switcher, GDPR banner, contact recipient, data source, cache) and a 30-day Trash.

## Tech stack

| Area | Technology |
|---|---|
| UI | React 18, Create React App (`react-scripts` 5), React Router 7, Tailwind CSS 3 |
| i18n / SEO | i18next + react-i18next, react-helmet-async |
| Data & auth | Supabase (Postgres, PostgREST, Auth, Edge Functions, pg_cron) via `@supabase/supabase-js` |
| Edge | Cloudflare Pages + Pages Functions, R2 bucket `sawo-media`, Neon (`@neondatabase/serverless`) |
| 3D / media | `@google/model-viewer`, three.js, react-pdf |
| Build extras | puppeteer-core + `@sparticuz/chromium` (prerender) |
| CI | GitHub Actions (Node 20) |

## Architecture

![Architecture diagram](docs/web-system/diagrams/architecture.svg)

The browser loads a static single-page app from Cloudflare Pages and reads and writes data directly in Supabase, using the public anon key. Row-level security (RLS) is enabled on every table. A few jobs run server-side instead:

- **Same-origin Pages Functions** (`sawo-main/frontend/functions`) handle analytics ingestion, R2 media upload and serving, and the Neon read proxy and sync endpoint.
- **Supabase Edge Functions** handle the login repair helpers and AI translation.
- **The Neon mirror** is kept current by the Supabase trigger `trg_neon_sync`. Neon serves as an automatic read fallback and as a superadmin test switch.

See the PDF, chapters 2 and 6–7, for details.

## Project structure

```
saworepo1/
├── README.md
├── docs/                         # internal docs (git-ignored), incl. Web_System_Documentation.pdf
├── .github/workflows/            # CI, Lighthouse, uptime, keep-alive, SEO and sitemap jobs
└── sawo-main/frontend/           # the application
    ├── package.json · wrangler.jsonc · tailwind.config.js
    ├── public/                   # index.html, _redirects, _headers, sitemap.xml, robots.txt, pdfs/
    ├── functions/                # Cloudflare Pages Functions (api/track, api/media-upload, api/neon, media)
    ├── supabase/functions/       # openrouter-translate edge function
    ├── scripts/                  # prerender.js, generate-sitemap.js, i18n/ tooling
    └── src/
        ├── App.jsx · menuPaths.js
        ├── pages/ components/ layouts/
        ├── local-storage/        # data access (Supabase/Neon readers, settings, tracking)
        ├── i18n/                 # i18next setup + locales/<lang>/*.json
        └── Administrator/        # the CMS; Local/scripts holds admin Node scripts + SQL setup files
```

## Getting started

**Prerequisites:** Node.js 20 or newer (CI uses 20) and npm. Google Chrome is needed only to run the prerender step locally. You also need the Supabase URL and anon key for the `sawo-react` project.

```bash
cd sawo-main/frontend
npm ci
# create .env (see below) with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
npm run dev            # http://localhost:3001   (npm start → port 3000)
```

The dev server reads live Supabase data. The CMS is at `http://localhost:3001/login`; ask a superadmin for an account.

Pages Functions don't run under the dev server. `src/setupProxy.js` forwards `/api/media-upload` and `/media/*` to a deployed Pages environment (`REACT_APP_MEDIA_UPLOAD_ORIGIN`, default `https://staging.saworepo1.pages.dev`). As a result, **CMS uploads from localhost go to the real R2 bucket**.

## Environment variables

Never commit values. `.env`, `.env.local` and `.dev.vars` are git-ignored. Every `REACT_APP_*` variable is built into the public JavaScript bundle.

**Front end** (`sawo-main/frontend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `REACT_APP_SUPABASE_URL` | **yes** | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | **yes** | Supabase anon (public) key |
| `REACT_APP_CONTACT_FORM_API_BASE` | no | Contact-form PHP back end (default `https://www.sawo.com/react_helpdeskapi`) |
| `REACT_APP_POSTHOG_KEY`, `REACT_APP_POSTHOG_HOST` | no | Enable PostHog replay and heatmaps |
| `REACT_APP_FRONT_URL` | no | Base URL for "view on site" links in the CMS |
| `REACT_APP_MEDIA_UPLOAD_ORIGIN` | no | Dev only: where media upload and serving are proxied |

**Local scripts** (`sawo-main/frontend/.env.local`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (never give this a `REACT_APP_` prefix), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE`, `CHROME_PATH`.

**Cloudflare Pages:**

| Name | Type | Used by |
|---|---|---|
| `MEDIA_BUCKET` | R2 binding, in both Production and Preview | media serving and upload |
| `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` | variables | the build and the media-upload role check |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | secrets | analytics Functions |
| `NEON_DB_URL` | secret | Neon Functions |
| `NEON_SYNC_API_KEY` | secret, optional | shared secret for `/api/neon/sync` |

**GitHub Actions:**
- Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GSC_SERVICE_ACCOUNT_JSON`, `SERPAPI_API_KEY`.
- Variables: `SITE_URL`, `GSC_SITE_URL`, `INDEXNOW_KEY`, `SEO_CRAWL_*`, `SERPAPI_*`, `SERP_PROVIDER`.

## Commands

Run from `sawo-main/frontend`:

| Command | What it does |
|---|---|
| `npm run dev` / `npm start` | Dev server on port 3001 / 3000 |
| `npm run build` | `react-scripts build`, then `scripts/prerender.js` (14 page snapshots) |
| `npm test` | Jest (there are currently no Jest tests) |
| `npm run sitemap` | Regenerate `public/sitemap.xml` from routes and live Supabase data |
| `npm run i18n:extract` · `i18n:inject` · `i18n:manifest` · `i18n:scan-all` · `i18n:split` | Translation handoff tooling (see [`README-i18n.md`](sawo-main/frontend/README-i18n.md)) |

The admin scripts in `src/Administrator/Local/scripts` are a separate package; run `npm install` there first. They include `npm run sync`, `sync:rooms`, `storage:audit`, `i18n:product:extract`/`apply`, `seo:gsc-sync`, `seo:competitor-crawl` and `seo:serp-check`.

## Database

- **Supabase project:** `sawo-react`, with 29 public tables and RLS enabled on all of them.
  - Main tables: `products`, `sauna_rooms`, `categories`, `tags`, `product_translations`, `app_settings`, `users`, `activity_logs`, `contact_submissions`, `media_upload_log`.
  - Analytics, SEO and monitoring tables: `analytics_*`, `seo_*`, `ci_check_runs`, `uptime_*`.
- **SQL changes:** policies, functions and added columns are in `src/Administrator/Local/scripts/setup-*.sql`. There is no migration runner; apply each file manually in the Supabase SQL editor after reading its header. The repository does **not** contain a full base schema, so rebuilding from scratch requires a schema dump from Supabase.
- **Scheduled jobs (pg_cron):** daily purges of expired trash (30 days), media trash, old analytics, old activity logs and old uptime checks.
- **Neon mirror:** the trigger `trg_neon_sync` on `products`, `categories`, `tags` and `sauna_rooms` posts every change to `/api/neon/sync`.

## Server endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/track/pageview`, `POST /api/track/duration` | First-party analytics (bots filtered, Cloudflare geo) |
| `POST /api/media-upload` | CMS upload to R2 (admin or superadmin, 25 MB max) |
| `GET /media/*` | Serve R2 objects with an immutable cache header |
| `GET /api/neon/:table` | Neon read proxy (products, categories, tags, sauna-rooms), cached 60 s |
| `POST /api/neon/sync` | Supabase trigger target (optional `x-api-key`) |
| Supabase Edge Function `openrouter-translate` | AI translation (source in `supabase/functions`) |
| Supabase Edge Functions `migrate-auth-password`, `create-auth-user`, `send-reset-email` | Auth helpers (deployed; **source not in this repo**) |

The full request/response reference is in PDF chapter 7.

## Authentication and permissions

- **Login:** CMS users sign in with a **username** and password. `apiLogin` resolves the username to an e-mail, then signs in through Supabase Auth.
- **Roles:** `viewer`, `editor`, `admin` and `superadmin`. Each page and action checks a capability defined in `src/Administrator/permissions.js`.
- **Changing defaults:** a superadmin can change role defaults (`/admin/permissions`), grant individual users extra capabilities (`/admin/users`), and preview the CMS as another role.

## Testing

| Check | Status (19 Oct 2026) |
|---|---|
| `CI=true npx react-scripts test --watchAll=false --passWithNoTests` | No Jest tests, exits 0 |
| `node --test seo-keyword-intelligence/rake.nodetest.js` (in `Local/scripts`) | 5/5 pass |
| `npm run seo:test` | Runs **0** tests: its glob `*.test.js` doesn't match `rake.nodetest.js` |
| `CI=false npx react-scripts build` | Succeeds |

## Build and deployment

1. `npm run build` writes `build/`, then prerenders 14 pages in headless Chromium. Prerendering is fail-open: a page that fails falls back to the plain SPA shell.
2. Cloudflare Pages publishes `build/` together with `functions/`. Routing and caching rules are in `public/_redirects` (301s, prerender rewrites, SPA catch-all last) and `public/_headers` (caching and security headers).
3. The Pages project's Git integration, build command and environment are configured in the **Cloudflare dashboard**, not in this repo. Check there to confirm them.
4. Deploy the edge function with `supabase functions deploy openrouter-translate`.
5. GitHub Actions runs CI on every push or PR touching `sawo-main/frontend`, plus scheduled jobs: uptime every 5 min, Supabase keep-alive, GSC/SERP/competitor SEO jobs, and sitemap checks. The broken-link checker is paused until the domain cut-over. Results appear under CMS → CI Status.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Empty pages locally | Set both `REACT_APP_SUPABASE_*` variables and restart `npm run dev` |
| CMS edit not visible publicly | Visitors cache catalogue data for 24 h; check `status`, `visible` and `publish_at`. Settings → Clear Cache clears only your own browser |
| Upload says "Not authorized" | Media upload requires the admin or superadmin role |
| Upload says "MEDIA_BUCKET R2 binding is missing" | Bind R2 in the Cloudflare Preview environment too |
| `ERR_TOO_MANY_REDIRECTS` | Don't add slash/no-slash redirects for prerendered paths in `_redirects` |
| CI build fails on lint | `CI=true` turns ESLint warnings into errors; fix the warnings or build with `CI=false` |
| CMS data looks stale or empty | A superadmin sets Settings → Data Source back to Supabase |

More cases are covered in PDF chapter 12.

## Known issues

- **Media upload auth:** `/api/media-upload` authorises on a `userId` query parameter, not a verified session token.
- **Edge function source:** three deployed edge functions have no source in the repo.
- **Unused items:** a few packages (`express`, `cors`, `dotenv`, `fs-extra`, `concurrently`, `stylelint`, `typescript`) and env vars (`REACT_APP_MAIN_REPO`, `REACT_APP_POSTHOG_PROJECT_URL`) are unused. `startServer.js` and the `/local-storage` dev proxy are leftovers.
- **Outdated planning doc:** `docs/NEON_BACKUP_PLAN.md` still says "planning only", although the Neon mirror is live.

## More documentation

- [`docs/Web_System_Documentation.pdf`](docs/Web_System_Documentation.pdf): the complete reference. To regenerate it, see section 9.6 of the PDF or [`docs/web-system/scripts`](docs/web-system/scripts).
- [`sawo-main/frontend/README-i18n.md`](sawo-main/frontend/README-i18n.md): translation workflow.
- [`I18N-CHECKLIST.md`](sawo-main/frontend/I18N-CHECKLIST.md): per-page translation status.
- [`PRODUCT-TRANSLATION-CONVENTIONS.md`](sawo-main/frontend/PRODUCT-TRANSLATION-CONVENTIONS.md): rules for translating product copy.
- [`PRODUCT_CATALOGUE.md`](sawo-main/frontend/PRODUCT_CATALOGUE.md): `/products` tab and section structure.
- [`BROCHURES.md`](sawo-main/frontend/BROCHURES.md): brochure PDF links by page.
- [`docs/NEON_BACKUP_PLAN.md`](docs/NEON_BACKUP_PLAN.md): Neon backup and failover plan.
