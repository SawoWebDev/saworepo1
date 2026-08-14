#!/usr/bin/env node
/**
 * scripts/i18n/manifest.js — regenerates i18n-handoff/manifest.json, the
 * single place to see every page's translation status per locale. Run
 * after any extract.js or inject.js call; also safe to run standalone.
 *
 * Usage: node scripts/i18n/manifest.js
 */
const fs = require("fs");
const path = require("path");
const lib = require("./lib");

function statusFor(page, locale) {
  const file = lib.localeFile(locale, page);
  if (!fs.existsSync(file)) return "missing";
  if (locale === lib.SOURCE_LOCALE) return "source";

  const sourceFlat = lib.flatten(lib.readJson(lib.localeFile(lib.SOURCE_LOCALE, page)));
  const targetFlat = lib.flatten(lib.readJson(file));
  const sourceKeys = Object.keys(sourceFlat);
  const targetKeys = new Set(Object.keys(targetFlat));
  const missingKeys = sourceKeys.filter((k) => !targetKeys.has(k));
  return missingKeys.length ? `stale (${missingKeys.length} key(s) behind source)` : "translated";
}

function main() {
  const locales = lib.listLocales();
  const pages = lib.listPages();

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceLocale: lib.SOURCE_LOCALE,
    locales,
    sharedNamespaces: lib.SHARED_NAMESPACES,
    pages: {},
  };

  for (const page of pages) {
    const sourceFile = lib.localeFile(lib.SOURCE_LOCALE, page);
    const stringCount = fs.existsSync(sourceFile) ? Object.keys(lib.flatten(lib.readJson(sourceFile))).length : 0;
    const status = {};
    for (const locale of locales) status[locale] = statusFor(page, locale);
    manifest.pages[page] = { file: `${page}.json`, stringCount, status };
  }

  const outFile = path.join(lib.HANDOFF_DIR, "manifest.json");
  lib.writeJson(outFile, manifest);

  console.log(`manifest: ${pages.length} page(s), ${locales.length} locale(s) -> ${path.relative(process.cwd(), outFile)}`);
  const width = Math.max(...pages.map((p) => p.length), 4);
  console.log(`\n  ${"page".padEnd(width)}  ${locales.join("  ")}`);
  for (const page of pages) {
    const row = locales.map((l) => manifest.pages[page].status[l].padEnd(Math.max(l.length, 9))).join("  ");
    console.log(`  ${page.padEnd(width)}  ${row}`);
  }
}

main();
