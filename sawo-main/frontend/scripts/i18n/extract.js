#!/usr/bin/env node
/**
 * scripts/i18n/extract.js — bundle a page's English source for handoff to
 * an external translation AI. Read-only: never touches src/i18n/locales/.
 *
 * Usage:
 *   node scripts/i18n/extract.js <page>        # one page
 *   node scripts/i18n/extract.js --all         # every page
 *   node scripts/i18n/extract.js <page> --dry-run
 *
 * Source of truth is src/i18n/locales/en/<page>.json — this script does NOT
 * scan JSX. Getting a page's real English copy into that file (t() calls
 * wired up in the component, same as pages/Home/*.jsx) is a one-time code
 * task that happens before extraction, not something this script automates
 * — see README-i18n.md's "Adding a new page" section for why, and the
 * checklist to follow.
 *
 * Output: i18n-handoff/<page>.en.json — self-describing (lang/page fields),
 * with an `instructions` block restating the translation rules inline so
 * the file is complete context on its own when pasted into another AI.
 */
const fs = require("fs");
const path = require("path");
const lib = require("./lib");

const INSTRUCTIONS =
  "Translate every string value in `content` into the target language. " +
  "Keep every key exactly as-is (same nesting, same array indices). " +
  "Do not add, remove, or rename keys. Preserve any {placeholder} or " +
  "<tag>...</tag> markers exactly, character-for-character, translating only " +
  "the surrounding text. Do not translate `meta.title`/`meta.description` " +
  "into marketing copy that changes length dramatically — keep them close " +
  "to typical search-result title/description lengths. Return ONLY valid " +
  "JSON, same shape as this file, with `lang` changed to the target " +
  "language code and every string in `content` translated.";

function extractOne(page, { dryRun }) {
  const srcFile = lib.localeFile(lib.SOURCE_LOCALE, page);
  if (!fs.existsSync(srcFile)) {
    console.error(`extract: no such page "${page}" (looked for ${srcFile})`);
    process.exitCode = 1;
    return null;
  }
  const content = lib.readJson(srcFile);
  const flat = lib.flatten(content);
  const stringCount = Object.keys(flat).length;
  const flaggedMarkers = Object.entries(flat)
    .filter(([, v]) => lib.extractMarkers(v).length > 0)
    .map(([k, v]) => ({ key: k, markers: lib.extractMarkers(v) }));

  const bundle = {
    lang: lib.SOURCE_LOCALE,
    page,
    instructions: INSTRUCTIONS,
    content,
  };

  const outFile = path.join(lib.HANDOFF_DIR, `${page}.en.json`);
  if (!dryRun) lib.writeJson(outFile, bundle);

  console.log(`extract ${page}: ${stringCount} strings${dryRun ? " (dry-run, not written)" : ` -> ${path.relative(process.cwd(), outFile)}`}`);
  if (flaggedMarkers.length) {
    console.log(`  ${flaggedMarkers.length} string(s) contain {placeholders} or <tags> — flagged for the translator, verify on inject:`);
    flaggedMarkers.forEach(({ key, markers }) => console.log(`    ${key}: ${markers.join(", ")}`));
  }
  return { page, stringCount };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const all = args.includes("--all");
  const page = args.find((a) => !a.startsWith("--"));

  if (!all && !page) {
    console.error("Usage: node scripts/i18n/extract.js <page> | --all [--dry-run]");
    process.exitCode = 1;
    return;
  }

  const pages = all ? lib.listPages() : [page];
  const results = pages.map((p) => extractOne(p, { dryRun })).filter(Boolean);

  if (all) {
    const total = results.reduce((sum, r) => sum + r.stringCount, 0);
    console.log(`\nextract --all: ${results.length} page(s), ${total} strings total`);
  }
}

main();
