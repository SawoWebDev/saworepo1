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
  i18n.js          ← react-i18next init, static imports of every catalog
  LocaleContext.js ← useLocale() / useLocaleT(namespace) hooks
  LocaleRoute.jsx  ← wraps each route, provides locale via context

i18n-handoff/      ← gitignored, regenerable. extract.js writes here;
                       this is what you paste into the other AI.
  <page>.en.json
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
and writes `i18n-handoff/<page>.en.json`. That file is self-contained: paste
its entire contents into a translation AI and it has everything it needs
(the rules are in the `instructions` field). Flags any string containing a
`{placeholder}` or `<tag>` so you know to double-check those on the way back
in.

**This does not scan JSX.** If a page hasn't been wired to `t()` calls yet,
there's no `locales/en/<page>.json` for it to read — do the wiring first
(see "Adding a new page").

### `inject.js` — validate + write a translation

```
npm run i18n:inject -- i18n-handoff/sauna.fi.json
npm run i18n:inject -- i18n-handoff/sauna.fi.json --dry-run
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

Regenerates `i18n-handoff/manifest.json` and prints a table: every page ×
every locale directory that exists, with status `source` / `translated` /
`stale (N key(s) behind source)` / `missing`. Run this after any
extract/inject call, or any time you want to see what's left.

## The manual loop (what you actually do)

1. `npm run i18n:extract -- <page>`
2. Open `i18n-handoff/<page>.en.json`, copy the whole file.
3. Paste into a translation AI with: *"Translate this JSON to Finnish
   per the instructions field. Return only valid JSON."*
4. Save the response as `i18n-handoff/<page>.fi.json`.
5. `npm run i18n:inject -- i18n-handoff/<page>.fi.json`
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

## Non-JSX content (out of scope for these scripts)

Product/room/accessory detail pages read copy from Supabase, not from JSX —
`extract.js` can't see it. That's Phase 4 of the plan doc: a
`product_translations` table, a CMS locale tab, and a
`resolveLocalizedProduct()` field-by-field merge with English fallback. A
separate, database-aware extract/inject pair would be needed if that track
wants the same handoff-to-external-AI workflow; not built yet.
