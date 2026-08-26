# i18n workflow — extract / translate / inject

How this app's translations get produced, checked in, and served. Read this
before touching anything under `src/i18n/` or `scripts/i18n/`.

**Stack:** plain Create React App + `react-i18next`. No Next.js, no CMS.
Locale is resolved from the URL prefix (`/`, `/fi`, `/de`) via React context
(`src/i18n/LocaleContext.js`), not `i18next.changeLanguage()` in an effect —
that would race the build-time prerender snapshot's first paint. See
`docs/🔴 GO-LIVE/CRA-I18N-TRANSLATIONS-PLAN.md` for why this app (not
Next.js) and the phased rollout this file's workflow serves.

## The division of labor

Two separate jobs get conflated if you're not careful, and this workflow
exists to keep them apart:

1. **Wiring a page's JSX to read from the i18n system** — importing
   `useLocaleT`, replacing hardcoded strings with `t("key")` calls, writing
   the resulting English strings into `src/i18n/locales/en/<page>.json`.
   This is a one-time, mechanical, code-only task. Claude Code does this
   directly, page by page — see "Adding a new page" below.
2. **Producing actual translated text** — real Finnish, German, etc. This
   does **not** happen by an AI editing JSON files inside this repo by
   guesswork. It happens externally: `extract.js` bundles a page's English
   source into a clean, self-contained handoff file, a human pastes that
   into a separate translation AI (or sends it to a professional
   translator), and `inject.js` validates the result and writes it into
   `src/i18n/locales/<locale>/<page>.json`.

Never hand-edit a non-English locale file directly. Always go through
`inject.js` — it's the only thing that checks a translation didn't drop a
key, leave a value blank, or mangle a `{placeholder}`/`<tag>` marker.

## File layout

```
src/i18n/
  locales/
    en/            ← source of truth, one file per page + 4 shared namespaces
      home.json
      sauna.json   ← (as pages get migrated)
      common.json  ← shared: button labels, "Previous"/"Next", etc.
      footer.json  ← shared: footer copy
      nav.json     ← shared: header/nav labels
      seo.json     ← shared: site-wide meta only (siteName, Organization JSON-LD) —
                       NOT per-page meta, that lives in each page's own file
    fi/            ← same filenames, translated (via inject.js only)
    de/
  i18n.js          ← react-i18next init, auto-discovers every locale/*.json
                       via require.context — no manual import list to
                       maintain. A locale missing a given page's file falls
                       back to English for that page automatically.
  LocaleContext.js ← useLocale() / useLocaleT(namespace) hooks
  LocaleRoute.jsx  ← wraps each route, provides locale via context

i18n-handoff/      ← gitignored, regenerable. One subfolder per locale, kept
                       separate so it's never ambiguous which is the
                       reference and which are translations.
  en/              ← the reference/source, written ONLY by extract.js
    <page>.json
  fi/              ← translated bundles YOU save here (or hand to inject.js
    <page>.json      directly) — never hand-write these, always through
                       inject.js so they get validated
  de/
  manifest.json
```

**One file per page, meta included.** Every page's own JSON file has a
`meta` block (`meta.title`, `meta.description`) alongside its visible copy
(`hero.*`, `section1.*`, etc.) — not split into a separate SEO file. `home.json`
is the reference example. The only things that live in the shared
`common`/`footer`/`nav`/`seo` namespaces are content that's genuinely
identical across every page (nav labels, footer, the sitewide Organization
schema).

## The three scripts

All under `frontend/scripts/i18n/`, runnable via `npm run i18n:<name>` from
`frontend/`.

### `extract.js` — bundle English source for handoff

```
npm run i18n:extract -- home              # one page
npm run i18n:extract -- --all             # every page
npm run i18n:extract -- home --dry-run    # preview, writes nothing
```

Read-only — never touches `src/i18n/locales/`. Reads
`src/i18n/locales/en/<page>.json`, wraps it with translation instructions
and writes `i18n-handoff/en/<page>.json`. That file is self-contained: paste
its entire contents into a translation AI and it has everything it needs —
the rules are in the `instructions` field, including the exact save path for
the result (`i18n-handoff/<languageCode>/<page>.json`, e.g.
`i18n-handoff/fi/sauna.json`). Flags any string containing a `{placeholder}`
or `<tag>` so you know to double-check those on the way back in.

**This does not scan JSX.** If a page hasn't been wired to `t()` calls yet,
there's no `locales/en/<page>.json` for it to read — do the wiring first
(see "Adding a new page").

### `inject.js` — validate + write a translation

```
npm run i18n:inject -- i18n-handoff/fi/sauna.json
npm run i18n:inject -- fi/sauna.json              # shorthand, same file
npm run i18n:inject -- fi/sauna.json --dry-run
```

Takes back exactly what a translation AI should return: the same
`{ lang, page, content }` shape `extract.js` produced, with `lang` changed
to the target locale code and every string in `content` translated. Before
writing anything, it checks:

- every key in the English source is present (no missing keys)
- no unexpected extra keys
- no empty/blank values
- every `{placeholder}`/`<tag>` marker from the source string is present,
  unchanged, in the translated string

Any failure prints every problem found and **writes nothing** — never a
partial file. `lang` in the file determines the destination
(`src/i18n/locales/<lang>/<page>.json>`), so a mislabeled file can't
silently land in the wrong locale.

### `manifest.js` — status overview

```
npm run i18n:manifest
```

Regenerates `i18n-handoff/manifest.json` and prints **two** tables: `pages`
(page-specific content) and `shared` (`common`/`footer`/`nav`/`seo` —
every page depends on these). Each cell is `source` / `translated` /
`stale (N key(s) behind source)` / `missing`. Run this after any
extract/inject call, or any time you want to see what's left.

**Always check the `shared` table too, not just `pages`.** A page can show
`translated` while its buttons still render in English, because "Explore
More," "Inquire Today," "View Catalogue," the sauna-calculator CTA, and the
search/filter chrome all live in `common.json` — not the page's own file —
and nothing about wiring a page pulls those in for you. This is not
theoretical: it shipped twice already before this table existed (Finnish
Home was fine because `common.json`'s `fi` was translated early, but German
Home quietly fell 12 keys behind when new shared keys were added later and
only `en`/`fi` got updated; the first Chinese pilot hit the identical gap
for the same reason). `manifest.js` used to filter shared namespaces **out**
of its report entirely (see git history, fixed 2026-08-26) — that's exactly
how both gaps went unnoticed for as long as they did. The fix isn't
"remember to check common.json" (that's what failed twice) — it's that the
tool now can't produce an all-green report while a shared namespace is
behind, so a stale shared file surfaces on the very next `npm run
i18n:manifest` instead of only when someone happens to click the right
button in the right language.

**Before shipping a language into a new page or a new locale**, confirm what
that page actually depends on — grep the page and everything it renders for
`useLocaleT(` and translate every namespace that turns up, not just the
page's own. Home's is `home` + `common` + `nav` + `footer` (confirmed via
`grep -rn 'useLocaleT(' src/pages/Home src/components/Header
src/components/Footer.jsx src/components/SaunaCalculatorCTA.jsx
src/components/PageCTA.jsx` — `seo.json` exists but nothing reads it via
`useLocaleT` yet, so it's tracked but not currently a rendering risk). Don't
assume this list — grep it fresh for other pages, since which shared
components a page pulls in isn't always obvious from the page file alone.

### `scan-all.js` + `finalize-master.js` — whole-codebase bulk extraction

```
npm run i18n:scan-all
```

Different tool for a different job than `extract.js`. `extract.js` only
reads pages already wired to `t()` calls (`locales/en/<page>.json` has to
exist first). `scan-all.js` parses raw JSX **directly** via
`@babel/parser`/`@babel/traverse` — real AST parsing, not regex — across
every file in `src/pages/`, `src/components/`, `src/layouts/`, so it works
whether or not a page has been migrated yet. Read-only, never touches
source. `finalize-master.js` reshapes its output into one self-contained
file at the repo root: **`ENG_translations.json`** — every string found,
`doNotTranslate` (brand/product names, exact-match excluded), `needsReview`
(short/ambiguous tokens, and mid-sentence fragments where inline `<b>`/
`<strong>` formatting split one real sentence into disconnected JSX text
siblings — each entry names the exact file/line to check before translating
it), `hreflang` (reference-only locale/path data), and the translatable
content itself under `pages.<pageKey>`/`shared.<componentKey>`.

Use this when you want one locale translated across the **whole site** in a
single handoff instead of page-by-page: send `ENG_translations.json` to a
translator AI (its `instructions` field is self-contained — the file
explains its own rules), get back `FI_translations.json` (or whatever
`{LANG_CODE}_translations.json` the target language calls for), then merge
each page's translated content into `locales/<lang>/<page>.json` — either
by hand-copying per page through `inject.js`, or by writing a one-off
splitter script if doing this for many pages at once. `scan-all.js` is
read-only and doesn't do that merge itself.

Gitignored, like `i18n-handoff/` — regenerate anytime with
`npm run i18n:scan-all`. Re-run after any content change to keep it current.
Before sending `ENG_translations.json` anywhere: read every entry in its
`needsReview` array — each one needs a resolution in `resolutions.js`
(promoted into real copy, or confirmed non-copy with a specific reason).
`apply-resolutions.js` (chained into `npm run i18n:scan-all`) enforces this —
it errors loudly if any needsReview entry isn't accounted for, so a fresh
scan can never silently ship an unreviewed batch.

### `split-master.js` — break the master file into translator-sized chunks

```
npm run i18n:split
```

Splits the (fully-resolved) `ENG_translations.json` into `ENG_0_manifest.json`
(instructions/doNotTranslate/hreflang/shared strings, referenced by every
other file instead of repeated in each) plus 6 content-grouped files
(`ENG_1_global.json` through `ENG_6_steam.json` — global chrome, core pages,
heaters, accessories, rooms, steam) sized for one translation-AI conversation
each instead of one 2000+-string monolith. Every page/shared key from the
master lands in exactly one output file — the script errors loudly on any
unassigned or double-assigned key, and prints a total-string reconciliation
(master total vs. sum of all 7 output files) so a mismatch can never ship
silently. Also gitignored, regenerable.

## The manual loop (what you actually do)

1. `npm run i18n:extract -- <page>`
2. Open `i18n-handoff/en/<page>.json`, copy the whole file.
3. Paste into a translation AI — the file's own `instructions` field
   already tells it what to do and where the result should be saved
   (`i18n-handoff/<languageCode>/<page>.json`).
4. Save the response there — `i18n-handoff/fi/<page>.json` for Finnish.
5. `npm run i18n:inject -- fi/<page>.json`
6. If it fails validation, fix the file (or re-prompt the translation AI
   with the specific error) and re-run step 5. Nothing is written until it
   passes.
7. `npm run i18n:manifest` to confirm the page now shows `translated` for
   `fi`.
8. `npm run build` and check the `PRERENDERED <path>: yes` lines for every
   configured page — a translation change alone shouldn't break the build,
   but a page that's been newly wired to `t()` for the first time needs a
   prerender config too if it's getting its own locale snapshot (see the
   plan doc's Phase 2, and `scripts/prerender/pages/home-fi.js` /
   `home-de.js` as the worked example).
9. Native-speaker review before flipping that locale "live" for that page
   in `src/i18n/translatedRoutes.js`'s `TRANSLATED_PATHS` — an unreviewed
   machine translation asserting itself as a real `fi` page is worse for
   SEO than not claiming one (see the plan doc).

## Adding a new page (the code-wiring step extract.js doesn't do)

Using `pages/Home/*.jsx` as the reference implementation:

1. Identify every hardcoded English string in the page's component(s) —
   headings, body copy, `alt` text, `aria-label`s, button labels, and the
   `<SEO title=... description=...>` props.
2. Import `useLocaleT` from `../../i18n/LocaleContext` and call
   `const t = useLocaleT("<page>");` in the component. For strings that are
   genuinely shared (not page-specific — "Previous"/"Next" arrows, "Explore
   More"), use `useLocaleT("common")` instead and pull from the existing
   `common.json`, don't duplicate them into the page's own file.
3. Replace each hardcoded string with `t("section.key")`, using dot-notation
   keys that mirror the page's own structure (`hero.heading`,
   `section1.items.heaters.title`, etc.) — see any `Home/Section*.jsx` file
   for the pattern with repeated/carousel content (map a list of keys over
   `t()`, don't write one call per item).
4. Add a `meta` block and pass it to `<SEO>` the same way `Home.jsx` does —
   `rawTitle={locale === "en" ? undefined : t("meta.title")}`, `description`
   likewise. Only pass `hreflangAlternates` once the page genuinely has (or
   will imminently have) real copy in every locale listed — see
   `SEO.jsx`'s prop comment.
5. Write the resulting English strings into
   `src/i18n/locales/en/<page>.json` (this is literally the JSON you'd have
   hardcoded anyway, just structured).
6. `npm run build` and confirm the page still renders correctly in English
   (nothing about steps 1–5 should change English output at all — it's a
   refactor, not a content change).
7. Now `extract.js` works for this page — continue with "The manual loop"
   above to get it translated.

## Wiring a component that's shared across pages (the `items = DEFAULT` gotcha)

Several components in `pages/Sauna/rooms/` (`SaunaFeatures`, `SaunaProductDetails`,
`SaunaRoomDetails`) take a prop like `items = DEFAULT_ITEMS`, rendered by one
page with the default and by another page (e.g. `/infrared/saunas`) with its
own, completely different content passed explicitly. Translating one of
these needs to (a) only touch the default content, never a caller's
override, and (b) know which i18n key each default item maps to.

**Do not write either check as `props === DEFAULT_ITEMS` or a positional
index into the prop itself.** Both look correct and both silently break the
moment any caller passes a *derived* array instead of the literal default —
most commonly `DEFAULT_ITEMS.filter(...)`, which is a completely ordinary
thing to write. `filter()` returns a new array (fails `===`, so translation
gets skipped and the page quietly renders English) and shifts indexes for
everything after a removed element (so even same-length `.map()`/reordering
maps translated content onto the wrong item). This shipped once already —
`SaunaRooms.jsx` passes `SRD_PANELS.filter(p => p.pill !== "Infrared")` to
`SaunaRoomDetails`, which silently left the "About This Room" panels in
English (fixed 2026-08-25).

Use `src/i18n/translateSharedItems.js` instead — it checks each item's own
identity within the default array (survives filtering/reordering) rather
than the array's identity or position:

- `translateSharedItems(items, DEFAULT_ITEMS, keysByIndex, translateOne)` —
  for a list where each item gets its own translation (`SaunaFeatures`,
  `SaunaRoomDetails`'s pattern).
- `isDerivedFromDefault(arr, DEFAULT_ARR)` — for a component that swaps in
  one whole translated block at a time rather than per-item
  (`SaunaProductDetails`'s pattern: `storySections`, `perfCards`,
  `accordionItems` are each translated as a unit, gated by whether the
  whole array is still made up of `DEFAULT_ARR`'s own items).

Both live in that one file with full doc comments — read them before adding
a fourth ad-hoc version of this check somewhere else.

## Adding a new locale

1. Add the locale code to `SUPPORTED_LOCALES` in `src/i18n/i18n.js` and
   `LOCALES` in `src/i18n/translatedRoutes.js`.
2. Add the locale prefix to `LOCALE_PREFIXES` in `src/i18n/translatedRoutes.js`
   — this alone mirrors every route under `/<locale>/*` in `App.jsx`
   (nothing 404s), same as `/fi` and `/de` today.
3. Run `npm run i18n:extract -- --all`, get every page translated via "The
   manual loop", `npm run i18n:inject` each one.
4. Add per-locale prerender configs for whichever pages are getting their
   own static snapshot, following `scripts/prerender/pages/home-fi.js` as
   the template — swap the sanity-check's translated substring and the
   expected `<html lang>`.
5. Add `/<locale>` and `/<locale>/index.html` (etc.) rewrites to
   `public/_redirects`, mirroring the `/fi`/`/de` entries.

## Product content (Supabase, not JSX) — `product-i18n.js`

Product/room/accessory detail pages read copy from Supabase (`products`
table), not from JSX — none of the scripts above can see it, and it doesn't
belong in `src/i18n/locales/`. This is Phase 4 of the plan doc, now built:
a `product_translations` table (one row per `(product_id, locale)`, see
`src/Administrator/Local/scripts/setup-product-translations.sql`) that a
`useLocalProducts()` merge overlays on top of the English `products` row,
field by field, falling back to English for anything not yet translated.
**No rebuild or redeploy needed** — a new translation row is live the next
time that product's page is fetched.

**The problem this script solves:** a product row mixes real prose (name,
descriptions, feature bullets, spec-table column headers, "included in
package" titles/notes, per-variation labels) with data that must NEVER be
translated (image URLs, slugs, model codes like `STN-45-C1/3`, physical
dimensions, weights, control-mode names like "Classic 2.0"). Hand-writing
SQL per product means re-deriving that split every time, and one wrong
guess silently mistranslates a model code that ends up in someone's spec
sheet. `Administrator/Local/scripts/product-i18n.js` knows the split once
and reuses it in both directions.

**Which field actually renders**, per `DispAccessories.jsx`'s
`getVariationsArray()` (mirrored exactly by the script's own
`getVariationGroups()` — check both if either ever changes): `variations`
if populated, else a legacy fallback combining `variants` +
`heating_element_groups`. A product's per-configuration content (the "2/3/6
Heating Elements" style groups) can live in *either* field depending on how
old the row is — **always verify what's actually on the live page against
what the extracted packet contains before translating**; a field that looks
plausible but isn't the one actually rendered is the single most likely way
to waste a translation pass (this happened once already: an early pass on
`stn-steam-generator` translated `heating_element_groups`, which that row
still has as unused legacy data, while the live page actually reads
`variations`. Silent-looking bug — the build was clean, only `name`/
`short_description`/`type` visibly changed, and the "2 Heating Elements"
table block stayed English until re-checked field-by-field against the
rendered page).

### Workflow

```
cd src/Administrator/Local/scripts

# 1. Extract prose-only packet for one product
node product-i18n.js extract <slug>
#    -> data/product-i18n/<slug>.fi.packet.json

# 2. Translate — open the packet, replace every string VALUE with Finnish.
#    Keep every key. Keep array length/order (apply matches by index).
#    Never touch the _english_* reference fields — read-only context.
#    Leave a field null/absent to skip it (falls back to English live).

# 3. Apply — re-fetches the English row as the source of truth for
#    anything NOT prose (images, slugs, model codes, dimensions), splices
#    the packet's translated text back into copies of those structures,
#    upserts into product_translations.
node product-i18n.js apply <slug> fi
```

(`npm run i18n:product:extract -- <slug>` / `npm run i18n:product:apply --
<slug> fi` also work, from `Administrator/Local/scripts/`.)

Requires `SUPABASE_URL` (from `frontend/.env`) and
`SUPABASE_SERVICE_ROLE_KEY` (from `frontend/.env.local`) — same two files
`sync.js` already reads, nothing new to configure.

### What gets extracted (and what deliberately doesn't)

| Field | Extracted? | Why |
|---|---|---|
| `name`, `short_description`, `description`, `type` | Yes | Straight prose. HTML fields (`short_description`/`description`) keep their tags — only text nodes are meant to change. |
| `spec_table.headers` / `variations[].spec_table.headers` | Yes | Column titles ("Steam Room (m²)") are prose. |
| `spec_table.rows` / `variations[].spec_table.rows` | **No** | Model codes, kW, dimensions, weight, control-mode names — data, not prose. |
| `variations[].name`, `.description`, `.features[]` | Yes | Per-variation label/copy/bullets. |
| `variations[].image`, `.code`, `.color` | **No** | Asset URLs and SKU-ish data. |
| `included_items[].title`, `.note` | Yes | Package-contents card copy. |
| `included_items[].slug`, `.image` | **No** | Routing/asset data. |
| `files[].name` (PDF resource labels) | **No, not yet** | These label a specific English-only PDF (`STN_Eng_0318.pdf`) — translating the label without a Finnish PDF to actually link to would be misleading. Revisit once/if localized PDFs exist. |

### After applying

Same verification discipline as the JSX workflow — `npm run build`, then
load the actual page in a browser (`/fi/products/<slug>`) and read every
visible string, not just the ones you remember translating. The build will
be silently, completely fine even if you translated the wrong field (see
above) — only actually looking at the rendered page catches that.

### Translation memory — reuse across products

This catalog's product copy is heavily boilerplated: spec-table headers
("Steam Generator Model", "kW", "Weight (kg)"...), feature bullets ("Auto
drain", "Steam head included"...), and included-item titles/notes repeat
near-verbatim across every product in a category, not just within one
product's own variation groups. Translating the same phrase from scratch
per product is pure waste on a catalog this size.

`translation_memory` (`setup-translation-memory.sql`) is a `(locale,
source_text) -> translated_text` lookup, exact-match on normalized
(trimmed, whitespace-collapsed) English — no fuzzy matching, not needed for
this catalog's literal phrase reuse. `extract` checks it for every prose
string and pre-fills any match directly into the packet, listing what it
filled under the packet's own `tmPrefilled` array so you know what's
already Finnish (worth a quick sanity read) versus what's genuinely new and
needs translating. `apply` writes every (English, Finnish) pair it just
applied back into the table, so the memory grows with every product —
whether that pair came from you translating it fresh or from a TM hit
being carried forward unchanged.

**Measured, not estimated:** translating `stn-steam-generator` first (cold
memory) needed ~40 fresh strings. Extracting `ste-steam-generator` next
pre-filled 34 of its fields automatically — only `name`, `short_description`,
and 3 fields that were genuinely different (STE uses `m³` not `m²` for
steam-room size, a different header wording, its own control lineup) needed
fresh translation. `stn-s-steam-generator` after that had 51 fields
pre-filled, including every one of its 6 included-items entries verbatim.
48 distinct phrases in memory after 3 products — each one now free for
every remaining product in the catalog that reuses it.

One caveat worth knowing before trusting a pre-fill blindly: a TM hit means
the *English source string* matched exactly, not that reusing it is
necessarily correct in every context — a phrase that happens to read
identically in English can occasionally need different Finnish depending on
grammatical context (rare for this catalog's short, formulaic strings, but
`tmPrefilled` exists specifically so a pre-filled value is at least visible
for a second look, not silently invisible).

### Scaling beyond one product at a time

Everything above is still one product per `extract`/`apply` pass,
deliberately — matches this repo's "Finnish first, pilot before scale"
approach (see `docs/🔴 GO-LIVE/SAWO_Multilingual_Implementation_
Specification(1).md` §74). Translation memory cuts the *amount of new
text* per product as the catalog fills in, but each product still needs
its own `extract` → review/translate what's left → `apply` cycle. The
natural next step, once ready to move past piloting: a `--category
<name>` (or `--all`) mode on `extract` that writes one packet per product
in that scope to `data/product-i18n/` in one run, then an `apply --dir
data/product-i18n/` that walks all of them — not built yet, but the
per-product plumbing (`fetchProduct`, `getVariationGroups`, the TM lookup,
the prose/data split, the upserts) is already exactly what a batch mode
would reuse; it's a loop around what exists, not new machinery.
