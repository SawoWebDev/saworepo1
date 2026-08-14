#!/usr/bin/env node
/**
 * scripts/i18n/split-master.js — splits ENG_translations.json into 6
 * content-grouped files + a manifest, once the master file's needsReview
 * has been fully hand-resolved (see resolutions.js). Read-only against the
 * master; writes the 7 output files to the repo root.
 *
 * Every page/shared key from the master must land in EXACTLY one output
 * file — the script errors loudly if anything is unassigned or double-
 * assigned, and prints a key-count reconciliation at the end.
 *
 * Usage: node scripts/i18n/split-master.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");
const MASTER = path.join(ROOT, "ENG_translations.json");

const master = JSON.parse(fs.readFileSync(MASTER, "utf8"));

// ── Group assignment ────────────────────────────────────────────────────
// GLOBAL: shared/components that render on every page.
const GLOBAL_SHARED_KEYS = [
  "header", "headerHeaderLanguageSwitcher", "headerSearchBar",
  "footer", "gDPRConsent", "gDPRConsentGate",
  "buttonsBrochureDropdownButton", "buttonsButtonBrown", "buttonsButtonClear",
  "lightbox", "scrollToTop",
];
// Present in `shared` but NOT everywhere-rendered chrome — page-specific or
// decorative components, not named in the 6-way spec. Placed in GLOBAL
// anyway (nowhere better to put them, and they're still under
// components/, not pages/) — flagged explicitly in the summary so this can
// be moved if that's wrong.
const GLOBAL_SHARED_KEYS_UNSPECIFIED = [
  "circlesInfo", "heroWave", "iconsChevronRight", "imageWithLoader", "mainLayout",
  "promoBanner", "sEO", "whyChooseSawo",
];

// "saunaSaunaControls" (Sauna > Controls, a sibling nav item to Sauna >
// Heaters) wasn't named in any of the 4 sauna-domain groups (heaters/
// accessories/rooms/steam) — placed here since it shares the "sauna" page
// prefix with the heater pages and there's no better-fitting group.
const HEATERS_PAGES_UNSPECIFIED = ["saunaSaunaControls"];
const HEATERS_PAGES = [
  "sauna", "saunaSaunaHeaters", "saunaSaunaControls",
  "saunaHeatersCombi", "saunaHeatersDragonfire", "saunaHeatersFloor",
  "saunaHeatersStone", "saunaHeatersTower", "saunaHeatersWallMounted",
];
const ACCESSORIES_PAGES = [
  "saunaSaunaAccessories",
  "saunaAccessoriesAccessorySets", "saunaAccessoriesBenchesFloorTiles",
  "saunaAccessoriesClocksSandtimers", "saunaAccessoriesDoorsHandles",
  "saunaAccessoriesHeadrestsBackrests", "saunaAccessoriesKivistone",
  "saunaAccessoriesPailsLadles", "saunaAccessoriesSaunaLights",
  "saunaAccessoriesThermometers", "saunaAccessoriesVentilationsAddOns",
];
// 11 files exist under pages/Sauna/rooms/, not 9 — every one is included
// (no principled reason to drop 2; SaunaCallToAction/SaunaProductDetails/
// Sauna3DTeaser/SaunaRoomData/SaunaRoomViewer/SaunaWoodMaterials are real
// sub-components with real copy, same as the others).
const ROOMS_PAGES = [
  "saunaSaunaRooms",
  "saunaRoomsInteriorDesign", "saunaRoomsSauna3DTeaser", "saunaRoomsSaunaCallToAction",
  "saunaRoomsSaunaConfigurator", "saunaRoomsSaunaFeatures", "saunaRoomsSaunaProductDetails",
  "saunaRoomsSaunaRoomData", "saunaRoomsSaunaRoomDetails", "saunaRoomsSaunaRoomViewer",
  "saunaRoomsSaunaWoodMaterials", "saunaRoomsWoodPanelandTimbers",
];
const STEAM_PAGES = [
  "steam", "steamSteamAccessories", "steamSteamControls", "steamSteamGenerators",
];
// Everything else — explicitly named in the spec, plus "infrared" (a
// standalone hub page with no subpages of its own, doesn't fit
// heaters/accessories/rooms/steam) and "accessoryCard" (a reusable card
// component used within accessory listing pages, not a shared/every-page
// component) — both unassigned in the original spec, placed here and
// flagged in the summary.
const CORE_PAGES = [
  "home", "homeHero", "homeSection1", "homeSection2", "homeSection3", "homeSection4", "homeSection5",
  "aboutUsAbout", "aboutUsLatestNews", "aboutUsSustainability",
  "careers", "contact",
  "support", "supportFAQ", "supportProductCatalogue", "supportSaunaCalculator", "supportUserManuals",
  "privacyPolicy", "sitemap", "notFound",
  "allProducts", "accessoriesCatalog", "heatersCatalog", "accessoryCard",
  "productPageRouter",
  "individualDisplayDispAccessories", "individualDisplayDispProduct", "individualDisplayDispSaunaRoom",
  "infrared",
];
const CORE_PAGES_UNSPECIFIED = ["infrared", "accessoryCard"];

function pick(obj, keys) {
  const out = {};
  const missing = [];
  for (const k of keys) {
    if (!(k in obj)) { missing.push(k); continue; }
    out[k] = obj[k];
  }
  return { out, missing };
}

function countStrings(o) {
  let n = 0;
  for (const k in o) {
    const v = o[k];
    if (typeof v === "string") n++;
    else if (v && typeof v === "object") n += countStrings(v);
  }
  return n;
}

const manifestNote = {
  seeManifest: "ENG_0_manifest.json",
  note: "This file's own `pages`/`shared` sections are empty on purpose — the instructions, doNotTranslate list, and hreflang reference data live once in ENG_0_manifest.json, not repeated in every split file. Translate the content below and return this file with the same name.",
};

function writeFile(name, pagesObj, sharedObj) {
  const content = {
    ...manifestNote,
    pages: pagesObj,
    shared: sharedObj,
  };
  fs.writeFileSync(path.join(ROOT, name), JSON.stringify(content, null, 2) + "\n", "utf8");
  return countStrings(pagesObj) + countStrings(sharedObj);
}

// ── Build each file, tracking every key consumed ────────────────────────
const consumedPageKeys = new Set();
const consumedSharedKeys = new Set();

function pickPages(keys) {
  const { out, missing } = pick(master.pages, keys);
  if (missing.length) throw new Error(`split-master: page key(s) not found in master: ${missing.join(", ")}`);
  keys.forEach((k) => consumedPageKeys.add(k));
  return out;
}
function pickShared(keys) {
  const { out, missing } = pick(master.shared, keys);
  if (missing.length) throw new Error(`split-master: shared key(s) not found in master: ${missing.join(", ")}`);
  keys.forEach((k) => consumedSharedKeys.add(k));
  return out;
}

const counts = {};

counts["ENG_1_global.json"] = writeFile(
  "ENG_1_global.json",
  {},
  pickShared([...GLOBAL_SHARED_KEYS, ...GLOBAL_SHARED_KEYS_UNSPECIFIED])
);
counts["ENG_2_core_pages.json"] = writeFile("ENG_2_core_pages.json", pickPages(CORE_PAGES), {});
counts["ENG_3_heaters.json"] = writeFile("ENG_3_heaters.json", pickPages(HEATERS_PAGES), {});
counts["ENG_4_accessories.json"] = writeFile("ENG_4_accessories.json", pickPages(ACCESSORIES_PAGES), {});
counts["ENG_5_rooms.json"] = writeFile("ENG_5_rooms.json", pickPages(ROOMS_PAGES), {});
counts["ENG_6_steam.json"] = writeFile("ENG_6_steam.json", pickPages(STEAM_PAGES), {});

// "common" (deduped shared strings, e.g. "No products match") lives in the
// manifest per the spec, not in ENG_1_global.
consumedSharedKeys.add("common");
const manifest = {
  instructions: master.instructions,
  doNotTranslate: master.doNotTranslate,
  hreflang: master.hreflang,
  sharedStrings: master.shared.common,
  splitFiles: [
    "ENG_1_global.json", "ENG_2_core_pages.json", "ENG_3_heaters.json",
    "ENG_4_accessories.json", "ENG_5_rooms.json", "ENG_6_steam.json",
  ],
};
fs.writeFileSync(path.join(ROOT, "ENG_0_manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
counts["ENG_0_manifest.json (sharedStrings only)"] = countStrings(master.shared.common);

// ── Reconciliation ───────────────────────────────────────────────────────
const allPageKeys = Object.keys(master.pages);
const allSharedKeys = Object.keys(master.shared);
const unassignedPages = allPageKeys.filter((k) => !consumedPageKeys.has(k));
const unassignedShared = allSharedKeys.filter((k) => !consumedSharedKeys.has(k));

if (unassignedPages.length || unassignedShared.length) {
  console.error("split-master: unassigned keys found — fix split-master.js before trusting the output:");
  if (unassignedPages.length) console.error("  pages:", unassignedPages.join(", "));
  if (unassignedShared.length) console.error("  shared:", unassignedShared.join(", "));
  process.exitCode = 1;
}

const masterTotal = countStrings(master.pages) + countStrings(master.shared);
const splitTotal = Object.values(counts).reduce((a, b) => a + b, 0);

console.log("split-master: wrote ENG_0_manifest.json + 6 content files\n");
for (const [name, n] of Object.entries(counts)) console.log(`  ${name.padEnd(38)} ${n} strings`);
console.log(`\n  master total (pages + shared):        ${masterTotal} strings`);
console.log(`  split total (all 7 files summed):     ${splitTotal} strings`);
console.log(`  MATCH: ${masterTotal === splitTotal ? "yes — no string lost or duplicated" : "NO — MISMATCH, do not proceed"}`);
if (masterTotal !== splitTotal) process.exitCode = 1;

console.log(`\nUnspecified-in-original-spec placements (confirm or move):`);
console.log(`  shared, placed in ENG_1_global.json: ${GLOBAL_SHARED_KEYS_UNSPECIFIED.join(", ")}`);
console.log(`  pages, placed in ENG_2_core_pages.json: ${CORE_PAGES_UNSPECIFIED.join(", ")}`);
console.log(`  pages, placed in ENG_3_heaters.json: ${HEATERS_PAGES_UNSPECIFIED.join(", ")}`);
console.log(`  rooms: 11 files exist under pages/Sauna/rooms/ (spec said 9) — all 11 included in ENG_5_rooms.json.`);
