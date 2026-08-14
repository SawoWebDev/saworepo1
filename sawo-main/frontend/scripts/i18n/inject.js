#!/usr/bin/env node
/**
 * scripts/i18n/inject.js — validate a translated JSON bundle and write it
 * into src/i18n/locales/<locale>/<page>.json.
 *
 * Usage:
 *   node scripts/i18n/inject.js <path-to-translated.json> [--dry-run]
 *   node scripts/i18n/inject.js fi/sauna.json               # shorthand,
 *                                                            # resolved against
 *                                                            # i18n-handoff/
 *
 * Expects the file at i18n-handoff/<lang>/<page>.json — the translator saves
 * it there directly (extract.js's instructions field names this exact
 * path), separate from i18n-handoff/en/ (the reference source, never
 * written to by this script). Pass either that path directly or any other
 * path on disk.
 *
 * The file itself is expected to be exactly what extract.js produced,
 * translated in place: { lang, page, instructions?, content }. `lang` in
 * the file determines which locale directory it's written to — the script
 * doesn't take locale as a separate argument, so a mislabeled file can't
 * silently land in the wrong place.
 *
 * Validates BEFORE writing anything (see README-i18n.md for the full rule
 * list): same key set as the English source, no empty values, and every
 * {placeholder}/<tag> marker preserved exactly. Any failure aborts with no
 * write — never a partial file.
 */
const fs = require("fs");
const path = require("path");
const lib = require("./lib");

function diffKeys(sourceFlat, targetFlat) {
  const sourceKeys = new Set(Object.keys(sourceFlat));
  const targetKeys = new Set(Object.keys(targetFlat));
  const missing = [...sourceKeys].filter((k) => !targetKeys.has(k));
  const extra = [...targetKeys].filter((k) => !sourceKeys.has(k));
  return { missing, extra };
}

function validate(sourceContent, translatedContent) {
  const errors = [];
  const sourceFlat = lib.flatten(sourceContent);
  const targetFlat = lib.flatten(translatedContent);

  const { missing, extra } = diffKeys(sourceFlat, targetFlat);
  if (missing.length) errors.push(`missing ${missing.length} key(s) present in English source: ${missing.join(", ")}`);
  if (extra.length) errors.push(`${extra.length} unexpected key(s) not in English source: ${extra.join(", ")}`);

  for (const [key, value] of Object.entries(targetFlat)) {
    if (typeof value === "string" && value.trim() === "") {
      errors.push(`empty value at "${key}"`);
      continue;
    }
    if (typeof value !== "string") continue;
    const sourceMarkers = lib.extractMarkers(sourceFlat[key]).sort();
    const targetMarkers = lib.extractMarkers(value).sort();
    if (JSON.stringify(sourceMarkers) !== JSON.stringify(targetMarkers)) {
      errors.push(
        `marker mismatch at "${key}": source had [${sourceMarkers.join(", ")}], translation has [${targetMarkers.join(", ")}]`
      );
    }
  }

  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const rawPath = args.find((a) => !a.startsWith("--"));

  if (!rawPath) {
    console.error("Usage: node scripts/i18n/inject.js <path-to-translated.json> [--dry-run]");
    process.exitCode = 1;
    return;
  }

  // Accept either a real path or the "<lang>/<page>.json" shorthand,
  // resolved against i18n-handoff/ — matches exactly what extract.js's
  // instructions field tells the translator to save the file as.
  const inputPath = fs.existsSync(rawPath) ? rawPath : path.join(lib.HANDOFF_DIR, rawPath);
  if (!fs.existsSync(inputPath)) {
    console.error(`inject: file not found: ${rawPath} (also checked ${inputPath})`);
    process.exitCode = 1;
    return;
  }

  let bundle;
  try {
    bundle = lib.readJson(inputPath);
  } catch (err) {
    console.error(`inject: ${inputPath} is not valid JSON — ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const { lang, page, content } = bundle;
  if (!lang || !page || !content) {
    console.error('inject: file must have "lang", "page", and "content" fields (the shape extract.js produces)');
    process.exitCode = 1;
    return;
  }
  if (lang === lib.SOURCE_LOCALE) {
    console.error(`inject: lang is "${lib.SOURCE_LOCALE}" (the source locale) — nothing to inject, this would overwrite the English source`);
    process.exitCode = 1;
    return;
  }

  const sourceFile = lib.localeFile(lib.SOURCE_LOCALE, page);
  if (!fs.existsSync(sourceFile)) {
    console.error(`inject: no English source for page "${page}" (looked for ${sourceFile}) — run extract.js on this page first`);
    process.exitCode = 1;
    return;
  }
  const sourceContent = lib.readJson(sourceFile);

  const errors = validate(sourceContent, content);
  if (errors.length) {
    console.error(`inject: validation FAILED for ${page} (${lang}) — nothing written:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exitCode = 1;
    return;
  }

  const destFile = lib.localeFile(lang, page);
  const previous = fs.existsSync(destFile) ? lib.readJson(destFile) : null;

  if (!dryRun) lib.writeJson(destFile, content);

  console.log(`inject ${page} (${lang}): validation passed, ${Object.keys(lib.flatten(content)).length} strings${dryRun ? " (dry-run, not written)" : ` -> ${destFile}`}`);

  if (previous) {
    const prevFlat = lib.flatten(previous);
    const newFlat = lib.flatten(content);
    const changed = Object.keys(newFlat).filter((k) => prevFlat[k] !== newFlat[k]);
    if (changed.length) {
      console.log(`  ${changed.length} value(s) changed vs the previous ${lang}/${page}.json:`);
      changed.slice(0, 20).forEach((k) => console.log(`    ${k}: "${prevFlat[k] ?? "(new)"}" -> "${newFlat[k]}"`));
      if (changed.length > 20) console.log(`    ...and ${changed.length - 20} more`);
    } else {
      console.log("  no value changes vs the previous translation");
    }
  } else {
    console.log(`  new file (no previous ${lang}/${page}.json existed)`);
  }
}

main();
