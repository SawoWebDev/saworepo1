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

function buildSection(names, locales) {
  const section = {};
  for (const name of names) {
    const sourceFile = lib.localeFile(lib.SOURCE_LOCALE, name);
    const stringCount = fs.existsSync(sourceFile) ? Object.keys(lib.flatten(lib.readJson(sourceFile))).length : 0;
    const status = {};
    for (const locale of locales) status[locale] = statusFor(name, locale);
    section[name] = { file: `${name}.json`, stringCount, status };
  }
  return section;
}

function printTable(title, names, entries, locales) {
  if (!names.length) return;
  const width = Math.max(...names.map((n) => n.length), title.length);
  console.log(`\n  ${title}`);
  console.log(`  ${"".padEnd(width)}  ${locales.join("  ")}`);
  for (const name of names) {
    const row = locales.map((l) => entries[name].status[l].padEnd(Math.max(l.length, 9))).join("  ");
    console.log(`  ${name.padEnd(width)}  ${row}`);
  }
}

function main() {
  const locales = lib.listLocales();
  const pages = lib.listPages();
  const shared = lib.SHARED_NAMESPACES;

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceLocale: lib.SOURCE_LOCALE,
    locales,
    sharedNamespaces: shared,
    pages: buildSection(pages, locales),
    // Shared chrome (common/nav/footer/seo) — every page implicitly depends
    // on these, so a page reading "translated" above does NOT mean the page
    // renders fully translated unless these are current too. Tracked here,
    // not folded into `pages`, so this table can never silently disappear
    // from the printed report the way it did before this fix (shared
    // namespaces used to be filtered OUT of manifest entirely — see
    // README-i18n.md's "Shared namespaces are not optional" section).
    shared: buildSection(shared, locales),
  };

  const outFile = path.join(lib.HANDOFF_DIR, "manifest.json");
  lib.writeJson(outFile, manifest);

  console.log(`manifest: ${pages.length} page(s), ${shared.length} shared namespace(s), ${locales.length} locale(s) -> ${path.relative(process.cwd(), outFile)}`);
  printTable("pages", pages, manifest.pages, locales);
  printTable("shared (every page depends on these — check this table too)", shared, manifest.shared, locales);
}

main();
