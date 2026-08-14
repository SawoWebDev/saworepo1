#!/usr/bin/env node
/**
 * scripts/i18n/apply-resolutions.js — applies resolutions.js's hand-review
 * decisions to ENG_translations.json: promotes reconstructed/standalone
 * copy into the pages/shared tree, and replaces the reason on confirmed-
 * non-copy entries so needsReview documents WHY each remaining entry is
 * excluded rather than "unclear."
 *
 * Errors loudly (exits non-zero) if any original needsReview entry isn't
 * accounted for by either a `consumes` match or an EXCLUDED_REASONS
 * predicate — so nothing can be silently dropped.
 *
 * Usage: node scripts/i18n/apply-resolutions.js
 */
const fs = require("fs");
const path = require("path");
const { PROMOTED, PROMOTED_SHARED, EXCLUDED_REASONS } = require("./resolutions");

const ROOT = path.join(__dirname, "..", "..", "..");
const FILE = path.join(ROOT, "ENG_translations.json");

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const original = data.needsReview;

function setPath(root, key, pathParts, value) {
  if (!root[key]) root[key] = {};
  let node = root[key];
  for (let i = 0; i < pathParts.length - 1; i++) {
    const k = pathParts[i];
    if (!node[k] || typeof node[k] !== "object") node[k] = {};
    node = node[k];
  }
  node[pathParts[pathParts.length - 1]] = value;
}

function matchesConsume(entry, c) {
  if (entry.file !== c.file || entry.line !== c.line) return false;
  if (c.value !== undefined) return entry.value === c.value;
  if (c.valuePrefix !== undefined) return entry.value.startsWith(c.valuePrefix);
  return false;
}

const consumed = new Set(); // indices into `original` already accounted for
let promotedCount = 0;

for (const p of [...PROMOTED, ...PROMOTED_SHARED]) {
  if (p.page) setPath(data.pages, p.page, p.path, p.value);
  else setPath(data.shared, "common", p.path.slice(1), p.value); // PROMOTED_SHARED paths are ["common", key]
  promotedCount++;

  for (const c of p.consumes || []) {
    const idx = original.findIndex((e, i) => !consumed.has(i) && matchesConsume(e, c));
    if (idx === -1) {
      console.error(`apply-resolutions: consumes entry not found in needsReview — ${JSON.stringify(c)} (for promoted "${p.value.slice(0, 40)}...")`);
      process.exitCode = 1;
      continue;
    }
    consumed.add(idx);
  }
}

const remaining = [];
let excludedCount = 0;
const unclassified = [];

original.forEach((entry, i) => {
  if (consumed.has(i)) return; // resolved via promotion
  const rule = EXCLUDED_REASONS.find((r) => r.match(entry));
  if (!rule) {
    unclassified.push(entry);
    return;
  }
  excludedCount++;
  remaining.push({ ...entry, reason: rule.reason });
});

if (unclassified.length) {
  console.error(`\napply-resolutions: ${unclassified.length} needsReview entr${unclassified.length === 1 ? "y" : "ies"} not covered by resolutions.js — fix resolutions.js before proceeding:`);
  unclassified.forEach((e) => console.error(`  ${e.file}:${e.line} ${JSON.stringify(e.value)}`));
  process.exitCode = 1;
} else {
  data.needsReview = remaining;
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log(`apply-resolutions: ${original.length} original needsReview entries resolved.`);
  console.log(`  Promoted into translatable copy: ${original.length - excludedCount} (via ${promotedCount} promotion(s), several consolidating multiple fragments/duplicates)`);
  console.log(`  Confirmed non-copy, excluded with documented reason: ${excludedCount}`);
  console.log(`  needsReview now contains ${data.needsReview.length} entries — all with a confirmed exclusion reason, none "unclear."`);
  console.log(`\n-> ${FILE}`);
}
