#!/usr/bin/env node
/**
 * scripts/i18n/finalize-master.js — reshapes ENG_translations_RAW.json
 * (scan-all.js's direct output) into the final ENG_translations.json:
 * self-contained instructions embedded at the top, doNotTranslate/
 * needsReview/hreflang as their own top-level sections, translatable
 * content under "pages"/"shared".
 *
 * Usage: node scripts/i18n/finalize-master.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");
const RAW_FILE = path.join(ROOT, "ENG_translations_RAW.json");
const OUT_FILE = path.join(ROOT, "ENG_translations.json");

const raw = JSON.parse(fs.readFileSync(RAW_FILE, "utf8"));

const instructions = {
  whatThisFileIs:
    "Every user-facing English string on sawo.com's React frontend, scanned directly from the actual source code (frontend/src/pages, frontend/src/components, frontend/src/layouts) via an AST parser — not paraphrased or reconstructed from memory. Organized under `pages.<pageKey>` (one entry per route/page component) and `shared.<componentKey>` (header, footer, buttons, and other components reused across pages).",
  whatWasExtracted: [
    "Visible page copy: headings, subheadings, paragraphs, intros, captions",
    "Buttons, links, and CTA labels",
    "Navigation and footer text",
    "Meta tags: <SEO title=/description=> props, which become each page's meta.title/meta.description",
    "Form labels, placeholder text, validation/error messages, success/confirmation messages",
    "Tooltips, alt text, aria-labels, and other accessibility strings",
    "Empty-state text, loading/status messages",
    "Any hardcoded English string found in JSX text, translatable attributes, or data arrays that feed JSX (e.g. CAROUSEL_ITEMS = [{ title: \"...\" }, ...]), however short",
  ],
  keyNamingConvention:
    "Keys mirror the actual source structure: pages.<pageKey>.<variableOrSectionName>.<arrayIndex>.<fieldName>, generated mechanically from the real JSX/JS structure (variable names, object field names, array positions) so every key maps back to an exact file and line. `pageKey` is derived from the file's path (e.g. pages/Sauna/heaters/Tower.jsx -> saunaHeatersTower). Keys are NOT hand-curated prose — they're deliberately mechanical and traceable, not pretty.",
  doNotTranslate:
    "The top-level `doNotTranslate` array lists brand/product/series names found verbatim as their own standalone string (SAWO, Kivistone, Dragonfire, Saunova, Innova, Tower, Stone, Combi, Floor, Wall-Mounted, and their \"<Name> Series\" forms). Never translate these when they appear as a full string match. When one of these names appears INSIDE a longer sentence (not as its own key), translate the sentence around it but leave the name itself unchanged.",
  needsReview:
    "The top-level `needsReview` array lists strings the scanner could not confidently classify — either short/code-like tokens (certification codes, single symbols) where it's unclear if they're copy, or strings the scanner detected as likely mid-sentence FRAGMENTS (inline JSX formatting like <b>/<strong> tags split one real sentence into multiple disconnected text-node siblings — e.g. an About-page wordplay on SAWO/World splits into fragments like \"una and\" / \"rld. It accurately reflects...\"). Each entry has a `file` and `line` — open that file at that line and read the FULL surrounding sentence before translating; do not translate a needsReview fragment in isolation. Do not silently skip these.",
  preserveExactly:
    "Any {placeholder}, {{variable}}, %s, or template-literal interpolation syntax, and any embedded HTML/JSX tag (e.g. <strong>, <a href>), found inside a string value must be copied character-for-character in the translation — translate only the surrounding text, never the markup or placeholder syntax itself.",
  metaLengthConstraint:
    "Every `meta.title` and `meta.description` value should stay close to the original English value's length — these are SEO snippet fields with real display-length constraints in search results. Do not expand a short title into a long descriptive phrase.",
  hreflangSection:
    "The top-level `hreflang` object is reference-only technical data (locale codes and canonical path patterns actually used by the app's <SEO hreflangAlternates> mechanism) — these are NOT translatable copy, do not translate locale codes or paths.",
  outputFileNaming:
    "Save the translated file as {LANG_CODE}_translations.json using the UPPERCASE ISO 639-1 code for the target language — e.g. FI_translations.json for Finnish, DE_translations.json for German, ES_translations.json for Spanish. NEVER overwrite or reuse the filename ENG_translations.json — that name is reserved for this English source file only.",
  structureRule:
    "Return the exact same JSON structure (same keys, same nesting, same array positions) with every translatable string value translated. Do not add, remove, or rename any key. Do not translate the `doNotTranslate` array's own string values, the `hreflang` section, or file/line/reason fields inside `needsReview` — only translate the `value` field of each `needsReview` entry once you've resolved it against its source context, and merge resolved values back into the appropriate `pages`/`shared` location rather than leaving them in a `needsReview` array in the translated output.",
};

// Reference-only — the app's real hreflang mechanism (SEO.jsx's
// hreflangAlternates prop, src/i18n/translatedRoutes.js's LOCALE_PREFIXES),
// not extracted text. Locale codes/paths, never translatable.
const hreflang = {
  locales: ["en", "fi", "de"],
  defaultLocale: "en",
  xDefault: "en",
  pathPattern: "English is unprefixed (/<path>); every other locale is prefixed (/<localeCode>/<path>), e.g. /fi/sauna, /de/sauna.",
  currentlyRealForLocales: {
    "/": ["en", "fi", "de"],
    "/sauna": ["en", "fi"],
  },
  note: "Only a path×locale pair listed under currentlyRealForLocales has real translated content and a genuine hreflang alternate today (see frontend/src/i18n/translatedRoutes.js's TRANSLATED_PATHS and each page's own <SEO hreflangAlternates> prop). Every other page listed under `pages` below in THIS file is a translation-content bundle to review inject — it does not yet have live hreflang wiring in the app.",
};

const output = {
  instructions,
  doNotTranslate: raw.doNotTranslate,
  needsReview: raw.needsReview,
  hreflang,
  pages: raw.pages.pages || {},
  shared: raw.pages.shared || {},
};

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");

function countStrings(o) {
  let n = 0;
  for (const k in o) {
    const v = o[k];
    if (typeof v === "string") n++;
    else if (v && typeof v === "object") n += countStrings(v);
  }
  return n;
}
const pageCount = Object.keys(output.pages).length;
const sharedCount = Object.keys(output.shared).length;
const stringCount = countStrings(output.pages) + countStrings(output.shared);

console.log(`\nENG_translations.json written -> ${OUT_FILE}`);
console.log(`\nSummary:`);
console.log(`  Pages/components scanned: ${raw.stats.files} files (${pageCount} page components, ${sharedCount} shared components)`);
console.log(`  Strings extracted: ${stringCount}`);
console.log(`  Flagged under needsReview: ${output.needsReview.length}`);
console.log(`  doNotTranslate brand/product names: ${output.doNotTranslate.length}`);
