// scripts/i18n/lib.js
//
// Shared helpers for extract.js / inject.js / manifest.js. See
// README-i18n.md for the workflow these three scripts implement — this
// file has no CLI of its own.
const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "..", "src", "i18n", "locales");
const HANDOFF_DIR = path.join(__dirname, "..", "..", "i18n-handoff");
const SOURCE_LOCALE = "en";

// Namespaces shared across every page (not page-specific content) — these
// are NOT part of the per-page extract/inject workflow.
const SHARED_NAMESPACES = ["common", "footer", "nav", "seo"];

function localeFile(locale, page) {
  return path.join(LOCALES_DIR, locale, `${page}.json`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function listPages() {
  const enDir = path.join(LOCALES_DIR, SOURCE_LOCALE);
  return fs
    .readdirSync(enDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((page) => !SHARED_NAMESPACES.includes(page));
}

function listLocales() {
  return fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory());
}

// Flattens a nested object into dot/bracket-notation leaf paths, e.g.
// { hero: { sentences: ["a", "b"] } } -> { "hero.sentences[0]": "a", "hero.sentences[1]": "b" }
// Mirrors the key style used throughout the existing locale files.
function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const path_ = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === "object") {
          Object.assign(out, flatten(item, `${path_}[${i}]`));
        } else {
          out[`${path_}[${i}]`] = item;
        }
      });
    } else if (value !== null && typeof value === "object") {
      Object.assign(out, flatten(value, path_));
    } else {
      out[path_] = value;
    }
  }
  return out;
}

// Extracts every {placeholder} and <tag ...>...</tag>-ish marker from a
// string so inject.js can confirm a translation didn't drop or mangle one.
function extractMarkers(str) {
  if (typeof str !== "string") return [];
  const placeholders = str.match(/\{[^}]+\}/g) || [];
  const tags = str.match(/<\/?[a-zA-Z][^>]*>/g) || [];
  return [...placeholders, ...tags].sort();
}

module.exports = {
  LOCALES_DIR,
  HANDOFF_DIR,
  SOURCE_LOCALE,
  SHARED_NAMESPACES,
  localeFile,
  readJson,
  writeJson,
  listPages,
  listLocales,
  flatten,
  extractMarkers,
};
