# i18n checklist — page-by-page status

Tracks translation progress per **route**, not per JSON file (see
`README-i18n.md` for the file-per-namespace mechanics this sits on top of).
Update this whenever a page moves between columns.

## Legend

- ✅ **Wired** — page reads copy via `t()`, English JSON written. **This is the
  "ready to translate" signal** — check this column before starting a new
  language on any page; a page with ✅ Wired can be translated into any
  locale immediately (add the JSON, no JSX changes needed). A page without
  it needs wiring work first (see "Not yet touched at all" below).
- ✅ **FI written** — Finnish translation exists in `locales/fi/`, key-parity
  validated (no missing keys, no blanks, placeholders match the English source).
- ✅ **Live** — listed in `translatedRoutes.js`'s `TRANSLATED_PATHS`, so the
  language switcher and hreflang actually offer it. Requires a **native-speaker
  review** first (see `README-i18n.md` step 9) — "FI written" alone does not
  mean reviewed.
- 🟡 Partial — some content on the page still hardcoded English.
- ⬜ Not started.

German (`de`) is not tracked per-page below — per the project's "Finnish
first, pilot before scale" approach, `de` only exists today for Home (`/`).
Add a `de` column here once German work actually starts.

Chinese (`zh`) is likewise not a full tracked column yet — noted inline in a
page's Notes cell only once that specific page gets a `zh` translation (see
`/sauna/rooms` below, added 2026-08-26 as the second zh page after Home).
Run `npm run i18n:manifest` for the authoritative up-to-date state of every
locale/page combination rather than trusting this file alone — it's a
narrative log, the manifest is the source of truth.

## Sauna section

| Route | Wired | FI written | Live | Notes |
|---|---|---|---|---|
| `/sauna` (hub) | ✅ | ✅ | ✅ | Pre-existing, reviewed, live under `/fi/sauna`. |
| `/sauna/heaters` | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, why-choose, video section, 6 heater cards. Needs native review before going live. |
| `/sauna/accessories` | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, brochure dropdown, 10 category cards. Needs native review. |
| `/sauna/controls` | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, intro, search/filter chrome, precaution notice, why-choose, promo banner. Needs native review. |
| `/sauna/rooms` | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, 16-item Configurator, RoomViewer chrome, Features carousel (6 tabs incl. paragraphs/specs), ProductDetails (story sections, feature text, perf cards, spec accordion), Room panels (4 room-type descriptions/features), Wood Materials section, the shared `SaunaCalculatorCTA` ("Find Your Dream Sauna"), plus bench-type/room-title dedup. Needs native review before going live. **ZH added 2026-08-26** — full `roomsPage` section (163/163 keys, verified 0 gap vs. English source via key-diff), reachable via the language switcher pilot (`en/fi/zh`, see `languageSettings.js`'s `PILOT_ENABLED_LOCALES`). Not native-reviewed, not in `TRANSLATED_PATHS`. **Correction, 2026-08-26**: the "Done 2026-08-25" claim above was wrong for two spots — `SaunaConfigurator.jsx` (the 16-item configurator) had the translation JSON written but **zero actual `t()` wiring in the component**, so it silently rendered 100% English on every locale (title, step tabs/labels/headings, all 16 item name/tag/desc, nav buttons, sidebar, CTA — plus the same locale-dropping `menuPaths.contact` link bug fixed elsewhere). Separately, `SaunaRoomViewer.jsx`'s one-line room-type subtitle (`cfg.desc`, sourced from `ROOM_CONFIGS` in `SaunaRoomData.jsx` — a *different* hardcoded data shape from the already-fixed `SRD_PANELS`) was never wired at all. Both fixed now (see "Infra fixes" below); FI and ZH both updated with the missing `roomDescriptions` keys. |
| `/sauna/heaters/tower` | ⬜ | ⬜ | ⬜ | Individual heater model page. |
| `/sauna/heaters/wall-mounted` | ⬜ | ⬜ | ⬜ | |
| `/sauna/heaters/stone` | ⬜ | ⬜ | ⬜ | |
| `/sauna/heaters/floor` | ⬜ | ⬜ | ⬜ | |
| `/sauna/heaters/combi` | ⬜ | ⬜ | ⬜ | |
| `/sauna/heaters/dragonfire` | ⬜ | ⬜ | ⬜ | |
| `/sauna/accessories/*` (9 category pages: accessory-sets, pails-ladles, thermometers, clocks-sandtimers, lights-covers, headrests-backrests, doors-handles, benches-floor-tiles, kivistone, ventilations-add-ons) | ⬜ | ⬜ | ⬜ | All still fully hardcoded English. |
| `/sauna/rooms/interior-designs` | ⬜ | ⬜ | ⬜ | |
| `/sauna/rooms/wood-panels-timbers` | ⬜ | ⬜ | ⬜ | |
| `/sauna-heaters` (all-heaters catalog) | ⬜ | ⬜ | ⬜ | `HeatersCatalog.jsx` — uses `CategoryHero`, no i18n wiring. |
| `/sauna-accessories` (all-accessories catalog) | ⬜ | ⬜ | ⬜ | `AccessoriesCatalog.jsx`. |

## Steam section

| Route | Wired | FI written | Live | Notes |
|---|---|---|---|---|
| `/steam` (hub) | ✅ | ✅ | ⬜ | Done 2026-08-25. Hero, intro, brochure link, and all 3 group sections (Generators/Controls/Accessories: headings, view-all links, descriptions, loading/empty states, card fallback descriptions), CTA. Product content: translated all 15 remaining Steam Controls/Accessories products (name/description/features/specs) in `product_translations`; all 18 steam-category products now have `fi` rows. Needs native review before going live. **ZH added 2026-08-26** — full `hub` section (25/25 keys, 0 gap verified via key-diff). Pre-check per the new audit process: `Steam.jsx` confirmed properly wired (`useLocaleT` used, every visible string traced to a `t("hub....")` call, `PageCTA` receives translated props) before translating — no repeat of the Configurator gap found here. Reachable via the language switcher pilot (`en/fi/zh`). Not native-reviewed, not in `TRANSLATED_PATHS`. |
| `/steam/generators` | ✅ | ✅ | ✅ | Pre-existing, reviewed, live under `/fi/steam/generators`. |
| `/steam/controls` | ⬜ | ⬜ | ⬜ | Fully hardcoded English (confirmed — `steam.json` only has `hub`/`generators` keys). Underlying product data is now translated (all 3 Steam Controls products have `fi` rows in `product_translations`, done 2026-08-25) even though this page's own JSX isn't wired yet. |
| `/steam/accessories` | ⬜ | ⬜ | ⬜ | Underlying product data is now translated (all 12 Steam Accessories products have `fi` rows in `product_translations`, done 2026-08-25) even though this page's own JSX isn't wired yet. |

## Product content (Supabase `product_translations`)

Per-product translation status (name/description/features/specs/variations/
included items) is tracked live in the **Translation CMS**
(`/admin/translations` — see its Products tab for the full product × locale
grid), not exhaustively re-listed here — that page reads `source_field_hashes`
freshness data directly from Supabase, so it's always current; this file
would just go stale. Noteworthy events only:

- **2026-08-25**: all 18 steam-category products (3 Steam Controls + 12
  Steam Accessories + 3 Steam Generators, the last already partially done)
  got `fi` rows via `product-i18n.js extract`/`apply`.
- **2026-08-26 — first `zh` product, as an architecture test**: `ste-steam-generator`
  (STE Steam Generator). Confirmed the pipeline built for the Translation
  CMS (see `TRANSLATION_CMS.txt`/the CMS plan) genuinely works end-to-end for
  a non-`fi` locale, not just in the CMS's own UI — used the CLI directly:
  `node product-i18n.js extract ste-steam-generator zh` →
  `node product-i18n.js apply ste-steam-generator zh`. Verified in Supabase:
  both `fi` and `zh` rows now exist with `source_field_hashes` populated
  (freshness tracking active from day one, not backfilled after the fact),
  and 28 distinct phrases were recorded into `translation_memory` for
  `zh` (was 0 before this — every zh product/page translation from here on
  reuses these for free). `useLocalProducts.js`'s `mergeTranslation()` is
  locale-generic (no `fi`-only special-casing anywhere), so this is live on
  `/zh/products/ste-steam-generator` immediately, no redeploy.
  - **Dictionary sharing across products, confirmed working**: translated
    `stn-steam-generator` (a sibling steam-generator product) into `zh`
    right after — `extract` auto-pre-filled **34 of ~45 fields** straight
    from the 28 phrases the STE translation had just seeded into
    `translation_memory` (variation names "2/3/6 Heating Elements," spec
    headers "Steam Generator Model"/"Weight (kg)"/"Control," repeated
    feature bullets, included-item titles). This is the same mechanism
    already used for `fi` (the original steam-category batch got "45
    field(s) pre-filled" per product for the same reason) — nothing new was
    built, just confirmed it compounds for `zh` too. Only genuinely new
    content (name, short_description, a few STN-specific features/included
    items) needed fresh translation. `zh` `translation_memory` is now at 42
    distinct phrases after 2 products — reuse gets stronger with every
    product translated in the same category, and it's automatic (no manual
    "check if this phrase exists" step, the CLI does the lookup on every
    `extract`).
  - **Important limit, clarified after a question**: translation memory only
    speeds up translating a product *once someone runs the pipeline for it*
    — it does not retroactively translate every product site-wide just
    because their English text overlaps with something already translated.
    `stn-s-steam-generator/zh` had no `product_translations` row at all
    (`locale: null` on lookup) even after STE/STN were done, purely because
    `extract`/`apply` hadn't been run for it yet — confirmed via SQL, then
    fixed: ran the pipeline, got 51/62 fields pre-filled from the by-then
    48-phrase `zh` TM, translated the rest, applied. `zh` TM is now at 48
    phrases after 3 steam-generator products.
  - **2026-08-26 — all 12 `/steam` products completed in `zh`**: after the
    3 Steam Generators (above), translated the remaining 2 Steam Controls
    (`steam-2-0`, `steam-stainless-touch-control`) and all 7 Steam
    Accessories (`aroma-pump`, `demand-button`, `installation-stand`,
    `steam-door`, `steam-head-cover`, `venturi-pipe-l-shape`,
    `venturi-pipe-straight`) — every product shown on `/steam`. Verified via
    SQL: 3/3 Generators, 2/2 Controls, 7/7 Accessories all have `zh` rows.
    `zh` `translation_memory` is now at 122 phrases. Note: Controls/
    Accessories share almost no phrase overlap with Generators (different
    feature vocabulary), so these came back with **0 fields pre-filled** on
    `extract` — TM reuse is strongest *within* a product sub-category
    (steam generator ↔ steam generator), not automatically across all of
    `/steam`. `venturi-pipe-straight` and `venturi-pipe-l-shape` are near-
    duplicates of each other, so most of the second one's fields were
    reused by hand from the first (same underlying mechanism, just applied
    manually since the two share nearly identical source text down to a
    typo — "hizzing" for "hissing" — preserved faithfully rather than
    silently corrected, per the pipeline's "translate what's there" rule).
  - **2026-08-26 — 5 more standalone "included item" products**: `rj12-cable`,
    `autodrain`, `steam-head`, `aroma-fan-and-dimmer-functions`,
    `electronics-compartment` — these are real, separate product pages
    (`type: null`, linked from the "included items" thumbnails on the steam
    generator pages), not just the inline `included_items` sub-fields
    already translated as part of those parent products. Extracted/applied
    all 5 to `zh`; `name` pre-filled from TM on 4/5 (title text was already
    identical to the parent products' included-item titles), `short_description`
    needed fresh translation on all 5 since the standalone-page wording
    differs slightly from the inline note text (no parentheses, full
    sentences).
  - **Real bug found and fixed while investigating a "zh page reverts to
    English" report**: `ProductPageRouter.jsx` (the component behind
    `/products/:slug`) redirects any accessory-category product to
    `/accessories/:slug` via `navigate()` — but that redirect was hardcoded
    to the bare English path, not wrapped in `localize()`. On a page like
    `/zh/products/aroma-pump`, the redirect fires the moment
    `useLocalProducts()` finishes loading and confirms the product is an
    accessory — which is exactly why it looked like "shows the zh
    translation for a while then returns to English": the brief window
    before products load renders fine (or a loading state), then the
    redirect silently drops the `/zh` prefix. Fixed in
    `ProductPageRouter.jsx`, and found the identical bug in one more place
    while sweeping for the same `navigate(\`/...\`)` pattern site-wide:
    `AccessoryCard.jsx`'s `goToProduct` (a shared card component used
    across accessory listing grids) had the same hardcoded, unlocalized
    `navigate()`. Both now use `useLocalizedPath()`. Every other
    `navigate(...)` hit in the same grep was confirmed admin-only
    (`/admin/...`, `/login`) — those are correctly locale-agnostic, not
    bugs.
  - **2026-08-26 — fixed the English-then-Chinese flash on every product
    page**: `useLocalProducts.js` fetches `product_translations` separately
    from the (cached) English product list, and that fetch was never
    reflected in the hook's `loading` flag — so every page painted the
    English product immediately (translations start at `{}`, `mergeTranslation`
    falls back to English when there's no entry yet), then re-rendered a
    moment later once the translation fetch resolved. Every consumer
    already gates its first paint on `loading` (`if (loading) return
    <SkeletonPage/>`, used by `DispProduct.jsx`/`DispAccessories.jsx`/every
    catalog grid), so the fix is one flag: added `translationsReady` state,
    folded into the returned `loading` (`loading: loading || !translationsReady`)
    — no per-page changes needed, every consumer's existing skeleton gate
    now automatically covers the translation fetch too. English visitors
    see zero change (`translationsReady` starts `true` for `locale==="en"`).
    Note this only fixes the *flash*, not the underlying re-fetch-on-every-
    navigation — `product_translations` still isn't cached the way the
    English product list is (still fetched fresh per page, per the comment
    already in that file), so a future speed optimization (client-side
    cache with a short TTL, similar to `PRODUCTS_CACHE_KEY`) is possible but
    wasn't done here — out of scope for a visual-flash fix.
  - **2026-08-26 — 5 more standalone "included item" products, and zh made
    genuinely SEO-discoverable**: translated `rj12-cable`, `autodrain`,
    `steam-head`, `aroma-fan-and-dimmer-functions`, `electronics-compartment`
    (separate product pages linked from the "included items" thumbnails on
    steam generator pages — not just the inline `included_items` sub-fields
    already translated as part of the parent products). That's 17 zh
    products total now.
    - Then, after spot-checking translation quality (user-reviewed via
      screenshots, confirmed natural/accurate), made the whole zh pilot
      actually discoverable to search engines — translated content existing
      is NOT the same thing as a search engine being told about it. Found
      three real gaps, all fixed:
      1. **Canonical tags were asserting the English URL on every locale
         page.** `DispProduct.jsx`/`DispAccessories.jsx` passed a bare
         `/products/${slug}` (no locale prefix) to `<SEO path=...>` — so a
         `/zh/products/...` page's own `<link rel="canonical">` pointed at
         the English URL, actively telling Google "index that one instead,
         this is a duplicate." Fixed: both now use `localize()`.
      2. **No hreflang alternates existed for individual product pages at
         all.** Added a new reviewed-locales allowlist,
         `src/i18n/seoProductLocales.js` (`PRODUCT_TRANSLATED_LOCALES`,
         `reviewedLocalesFor(slug)`) — same "reviewed, not just present in
         the DB" gating philosophy as `TRANSLATED_PATHS` in
         `translatedRoutes.js`, just keyed by product slug. Wired into both
         detail-page components.
      3. **Not in the sitemap.** `/steam` and `/sauna/rooms` added to
         `TRANSLATED_PATHS` (both here and the hand-kept-in-sync mirror in
         `scripts/generate-sitemap.js`) with `zh`; Home's `zh` was already
         translated and spot-checked but had never been flipped on either
         — added there too. Added a parallel `PRODUCT_TRANSLATED_LOCALES`
         mirror + `productAlternatesFor()` to the sitemap script so
         individual products get locale-variant `<url>` entries with
         `<xhtml:link rel="alternate">` tags, same as static routes already
         did. Regenerated `public/sitemap.xml` — verified 42
         `hreflang="zh"` tags total, matching the exact expected count
         (Home ×4 + `/steam` ×2 + `/sauna/rooms` ×2 + 17 products ×2).
    - **`sync.js` fixed properly, not worked around**: it was stale in two
      ways, not just the sitemap-blocking one. (1) Its own env loading used
      plain `dotenv.config()` (only reads `.env`), so `SUPABASE_SERVICE_ROLE_KEY`
      — which lives in `.env.local` — was never picked up; it couldn't
      even authenticate. (2) It still tried to re-download every product's
      images/PDFs from Supabase Storage bucket paths to a local
      `saworepo2/images`+`files` folder (a sibling repo) — dead code from
      before the move to Cloudflare Pages/R2: every product's image/file
      URL is already a live CDN URL (`saworepo1.pages.dev/media/...`),
      confirmed by querying live Supabase directly, and Supabase Storage
      buckets for this project were emptied 2026-08-20 (see memory
      `supabase-storage-winddown`) — so even with a valid path, every
      download would have failed. `saworepo2` itself has been discarded
      per the user, confirming there's no destination to repoint it to
      anyway. Rewrote `sync.js` to do only what's still needed — fetch
      products/categories/tags/meta from Supabase and write the JSON
      snapshots, nothing else — and fixed the env loading. Ran it: 380
      products / 17 categories / 724 tags synced in seconds, all 8
      previously-missing products confirmed present. Re-ran
      `generate-sitemap.js` (no manual patch needed this time) — 508 URLs,
      42 `hreflang="zh"` tags, matching the exact expected count.
      `public/sitemap.xml` served locally at `http://localhost:3001/sitemap.xml`.
  - **Script change**: `product-i18n.js extract` previously hardcoded
    `locale: "fi"` — the whole CLI was built during the Finnish-only pilot
    and never updated for the 7-locale expansion. Now accepts an optional
    locale argument (`extract <slug> [locale]`, defaults to `fi` for every
    existing call site/habit), matching `apply`, which already took one.
    Same script, same packet format, works for any of the 7
    `PRODUCT_TRANSLATION_LOCALES` now.

## Home / global chrome

| Route / area | Wired | FI written | Live | Notes |
|---|---|---|---|---|
| `/` (Home) | ✅ | ✅ (fi, de, **zh**) | ✅ (fi + de) | zh added 2026-08-26 as a timing/quality pilot — reachable via the language switcher (not yet in `TRANSLATED_PATHS`, so no hreflang claim, and not native-reviewed). |
| Header / nav | ✅ | ✅ (fi, de, zh) | — | `nav.json`, shared chrome. |
| Footer | ✅ | ✅ (fi, de, zh) | — | `footer.json`, shared chrome. |
| `product.json` (individual product page copy) | ✅ | ✅ (fi, zh) | — | Feeds `DispProduct.jsx`; separate from the Supabase `product_translations` pilot (see README-i18n.md's "Product content" section). **2026-08-26**: found and fixed `DispAccessories.jsx` and `DispSaunaRoom.jsx` — the individual accessory-product and individual sauna-room detail templates — had **zero** i18n wiring at all (no `useLocaleT`, no `localize()`, unlike `DispProduct.jsx` which was already wired). Every "Resources"/"Specifications"/"Technical Data"/"You might also like"/"Related Products" label, the not-found fallback state, and internal `<Link>`s on those two templates rendered hardcoded English regardless of locale. Wired both to `product.json` (added `sections.technicalData`, `sections.infraredSpecifications`, `moreDetailsSoon`, `notFound.roomTitle/roomDescription/browseRooms`, `related.relatedRooms`) and fixed their locale-dropping links. `zh/product.json` created from scratch (didn't exist before today). Also fixed two misses inside `DispProduct.jsx` itself that an earlier hardcoded-string audit's regex didn't catch: the not-found `error` message was a raw English string that bypassed `t()` entirely when set, and "More details coming soon." was untranslated. **Known remaining gap, not fixed today** (out of scope for this pass — flagged so it isn't lost): `DispSaunaRoom.jsx` still has several untranslated labels beyond what was requested — "Available Door Positions," "Floor Plan," "Bench Configuration," "Details," "Description," the `ROOM_TYPE_LABELS`/`SIZE_LABELS` lookup tables, and the ResourcesPanel's "N Documents"/"Click to expand" text; `DispSaunaRoom.jsx` also still reads from a static JSON snapshot rather than live Supabase (see `sauna-rooms-data-sync-gotcha` note) — separate pre-existing issue, not part of this i18n pass. |
| `common.json` (shared buttons/CTAs) | ✅ | ✅ (fi, de, zh) | — | Includes `catalogFilter.*`, `viewBrochure`, `saunaCalculatorCTA` — see "Home page's full translation dependency list" below for why this file matters more than it looks. |
| `seo.json` (site-wide Organization schema) | — | ✅ (fi, de, zh) | — | Not currently read via `useLocaleT` anywhere (checked 2026-08-26) — tracked for manifest completeness, not a live rendering dependency yet. |

### Home page's full translation dependency list (read this before translating Home into a new language)

Translating `home.json` alone is **not enough** to make the Home page fully
translated — it only covers the page's own copy (hero, the 5 sections). Header, footer, and every shared button/CTA on the page pull from separate
files that must *also* be translated, or they silently render in English
(i18n's fallback-to-source behavior masks this — nothing errors, it just
looks like "some stuff wasn't translated"). This is exactly what happened
with the first Chinese pass: Home content translated, but "Explore More,"
"Inquire Today," and "View Catalogue" stayed English because they live in
`common.json`, not `home.json`.

**Confirmed via `grep -rn 'useLocaleT(' src/pages/Home src/components/Header
src/components/Footer.jsx src/components/SaunaCalculatorCTA.jsx
src/components/PageCTA.jsx` — Home's complete dependency set is:**

| File | Covers |
|---|---|
| `home.json` | Hero, Section1–5 (carousel cards, heater grid, steam/rooms/infrared/controls grid, accessories, CTA) |
| `common.json` | "Explore More," "Inquire Today," "View Catalogue," "View Brochure," Previous/Next, the sauna-calculator CTA banner, `pageCTA` defaults, all 12 `wellnessBenefits` cards |
| `nav.json` | Header menu, dropdowns, search box |
| `footer.json` | Footer columns, office addresses, social links, copyright |

**Don't trust this list blindly for any page other than Home** — re-grep for
that specific page, since which shared components it pulls in isn't always
obvious from the page file alone. See `README-i18n.md`'s "Always check the
`shared` table too" note for the tooling fix that now catches this
automatically: `npm run i18n:manifest` prints a `shared` table alongside
`pages` — a shared namespace showing `stale`/`missing` there means **every**
page using it is incompletely translated, not just the one you're looking at.

## Not yet touched at all

Infrared (`/infrared`, `/infrared/saunas`, `/infrared/panels`, `/infrared/controls`), About (`/about`, sustainability, latest-news), Careers, Contact, Support (FAQ, sauna calculator, user manuals, product catalogue), Privacy Policy, Sitemap. None of these have any `t()` wiring yet.

## Recommended next batch

1. `/steam/controls` + `/steam/accessories` — same `CategoryHero` + `catalogFilter` pattern already built today, should go fast.
2. Native-speaker review pass on everything marked "FI written, not Live" above, then flip each path in `translatedRoutes.js`.

## Infra fixes (2026-08-26)

- **A page can have complete, key-parity-correct translation JSON and still
  render 100% English, silently, if the component itself never calls
  `t()`.** This is exactly what happened to `SaunaConfigurator.jsx` — the
  JSON was right, `npm run i18n:manifest` reported the page as fully
  "translated," and the checklist above said "Done." None of that checks
  whether a component actually *reads* the JSON. **The manifest tool proves
  the JSON is complete; it does not prove a page is wired.** Two independent
  facts, both required, neither implies the other.
  - **Before marking any page "Wired ✅," grep it (and every component it
    renders) for hardcoded English JSX text that should have been `t()`:**
    `grep -noE '>[A-Z][a-z]+ [a-z]+ [a-z]+' path/to/*.jsx` (catches
    multi-word literal sentences sitting directly in JSX) and
    `grep -noE '(alt|title|placeholder|aria-label)="[A-Z][a-zA-Z ]{4,}"'`
    (catches hardcoded attributes). Zero hits doesn't guarantee full
    coverage, but a hit is a real, fast, cheap-to-check signal — this is how
    the Configurator bug above was actually found and confirmed fixed,
    and how every other "Wired ✅" page in this file was re-verified clean
    on 2026-08-26 (see the audit note under `/sauna/rooms`).
  - A second, weaker but useful check: `grep -c useLocaleT path/to/*.jsx`
    across every component a page renders. A properly wired file has at
    least 2 (the import + one `t(...)` call site) — a `0` on a component
    that's supposed to be translated is worth investigating immediately,
    the way it would have caught `SaunaConfigurator.jsx` on day one. This
    is exactly how `DispAccessories.jsx`/`DispSaunaRoom.jsx` were caught
    2026-08-26 — both had 0 `useLocaleT` occurrences despite being live,
    linked-to individual-product/room detail pages.
  - **The 3-word-minimum regex above has real blind spots — don't trust a
    clean scan as proof.** It missed "Technical Data" (2 words) in
    `DispProduct.jsx`, and it can never catch a hardcoded string sitting
    inside a JS variable rather than directly in JSX text — e.g.
    `const error = !loading && !product ? "Product not found." : null;`
    followed by `{error || t(...)}`, which silently shows the raw English
    string instead of the translated one whenever `error` is truthy. Two
    cheap follow-ups worth doing on any page before trusting it: rerun the
    regex without the 3-word floor (`grep -noE '>[A-Z][a-z]+ [a-z]+'`,
    accepting more noise), and grep for `||\s*t\(` / `? "` patterns — both
    are a tell that a literal string and a `t()` call are living side by
    side, which is usually a bug.
- **A page can have more than one hardcoded-English data source, and fixing
  one doesn't fix the others.** `/sauna/rooms` has at least three separate
  places English strings live: `sauna.json` (i18n catalogs), `SRD_PANELS` in
  `SaunaRoomData.jsx` (fixed 2026-08-25, see below), and `ROOM_CONFIGS`/
  `CONFIGURATOR_STEPS` in that same file (missed until 2026-08-26). Before
  calling a page done, identify **every** file it imports data from, not
  just the one JSON namespace — `grep -rn "from \"\./SaunaRoomData\"" .`
  (or the equivalent for any page-local data file) lists every consumer to
  check.

## Infra fixes (2026-08-25, apply to every page above and below)

- **Fixed a real bug**, not just a translation gap: `SaunaRoomDetails`'s
  "About This Room" panels (pill nav + description + feature list) were
  rendering in English on `/sauna/rooms` even though translated content
  existed. Root cause was a shared-component guard checking `props ===
  DEFAULT_ITEMS` — `SaunaRooms.jsx` passes `SRD_PANELS.filter(...)`, and
  `.filter()` returns a new array, so the check silently failed. Fixed, and
  extracted the correct (identity-based, filter-proof) version into
  `src/i18n/translateSharedItems.js`, used by every `pages/Sauna/rooms/*`
  component that takes an `items = DEFAULT` prop. Documented as a named
  gotcha in `README-i18n.md` under "Wiring a component that's shared across
  pages" — read that before adding a new shared-with-a-default component.
- **Language switcher no longer redirects to home.** It used to send you to
  `/fi`'s or `/de`'s home page instead of the equivalent path on any page
  not yet in `TRANSLATED_PATHS` (`HeaderLanguageSwitcher.jsx`'s old
  `isTranslated(...) ? basePath : "/"` fallback). Now it always mirrors the
  current path 1:1 in both directions — untranslated strings on a partially
  wired page fall back to English per-key (already how `i18n.js` works),
  which is a much smaller loss than losing your place entirely.
  `TRANSLATED_PATHS`/`isTranslated()` still exist for `<SEO
  hreflangAlternates>` gating (a separate, narrower question), just not for
  routing.

- **Internal links were dropping the locale prefix, site-wide — fixed on
  every page below.** `useLocalizedPath()`/`localize(path)`
  (`src/i18n/LocaleContext.js`) has existed since this was built
  specifically to keep internal `<Link>`/`<a>` navigation on `/fi`/`/de`
  instead of reverting to English on the next click — but it was only
  actually *used* in `Footer.jsx` and `Header.jsx`. Every other page,
  **including the two already-reviewed live pages** (`/fi/sauna`,
  `/fi/steam/generators`), built its internal links from a bare `menuPaths.x`
  or `` `/products/${slug}` `` with no `localize()` wrapper — so clicking any
  card or "View All" button from a Finnish page silently dropped the visitor
  back to English. This is what surfaced as "the STE Steam Generator card on
  `/fi/steam` goes to English." Audited every page/component in this
  checklist plus `Home/*` (`Sauna.jsx`, `SaunaHeaters.jsx`,
  `SaunaAccessories.jsx`, `SaunaControls.jsx`, `SaunaRooms.jsx` + its
  Configurator/RoomViewer, `Steam.jsx`, `SteamGenerators.jsx`,
  `SaunaCalculatorCTA`, `SaunaCallToAction`, `Home/Section1–5`) and wrapped
  every internal path in `localize()` — 40+ call sites fixed. **True URL
  translation (different slugs per locale, e.g. `/sauna/heaters` becoming a
  distinct Finnish path) does not exist in this codebase and wasn't added —
  the app's model is one canonical English slug set, mirrored under `/fi`
  and `/de` prefixes** (see `LocaleContext.js`'s and `translatedRoutes.js`'s
  own comments). If genuinely separate Finnish slugs are wanted later,
  that's a distinct, larger feature (routing table, redirects for old URLs,
  SEO/hreflang implications) — flag it explicitly if so, since it's not
  what today's fix did.

~~Known open item: `steam.json`'s uncommitted `hub` section~~ — resolved by
another session; `/steam` hub is now wired + translated (see Steam section
above).

- **`manifest.js` used to hide the exact bug the Chinese pilot just hit.**
  It filtered `common`/`footer`/`nav`/`seo` out of its printed report
  entirely, so a stale shared namespace never showed up in `npm run
  i18n:manifest` — only page-specific `.json` files did. This is how German
  Home ended up 12 keys behind in `common.json` (found and fixed
  2026-08-26, same day as the Chinese pilot) without ever showing as a
  problem in the tool meant to catch exactly that. Fixed: `manifest.js` now
  prints a second `shared` table alongside `pages`, so a stale/missing
  shared namespace is visible on every run, not just when someone happens to
  click the specific button in the specific language. Full writeup in
  `README-i18n.md` under `manifest.js`'s docs — read it before trusting an
  all-green `pages` table again.
- **Language switcher couldn't detect `/zh` pages at all** (separate bug
  from the redirect-to-home one fixed earlier) — `HeaderLanguageSwitcher.jsx`
  parsed the URL with a hardcoded `/^\/(fi|de)(\/.*)?$/` regex, so adding a
  new locale prefix elsewhere (`LOCALE_PREFIXES`) didn't teach the switcher
  about it. Now built from `LOCALE_PREFIXES` itself, so a future locale
  addition can't silently repeat this.
