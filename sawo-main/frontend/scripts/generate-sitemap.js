/**
 * scripts/generate-sitemap.js — builds public/sitemap.xml.
 *
 * Closes docs/go-live/SEO-GO-LIVE-CHECKLIST.md Scenario 6 (no sitemap.xml
 * existed for the CRA app at all) ahead of the sawo.com cutover
 * (docs/go-live/GO-LIVE-INSTRUCTIONS.md section 4).
 *
 * Covers two kinds of URLs, same as the site's own route table + data:
 *   1. every static route in src/menuPaths.js (hub/category/support pages),
 *      minus admin/auth-only paths, which must never be indexed.
 *   2. every live product/accessory/room detail page slug, read from the
 *      SAME local JSON snapshots src/pages/AllProducts.jsx reads
 *      (src/Administrator/Local/data/{products,saunaroom-data}.json), using
 *      the SAME isPubliclyVisible() and isAccessoryProduct() rules that
 *      page uses — so this only ever lists pages that actually render.
 *
 * This is a static generator, not part of `npm run build` (nothing in this
 * repo currently wires scripts/prerender.js into the CRA build either — the
 * Cloudflare Pages build command controls that from the dashboard, not this
 * repo). Re-run manually (`node scripts/generate-sitemap.js`) whenever
 * menuPaths.js changes or after a product/room data sync, and commit the
 * regenerated public/sitemap.xml.
 */

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://www.sawo.com"; // matches SEO.jsx's SITE_URL — keep these in sync
const OUT_FILE = path.join(__dirname, "..", "public", "sitemap.xml");

// Mirrors src/i18n/translatedRoutes.js's TRANSLATED_PATHS — which paths have
// REAL, reviewed copy per locale (not just an English page rendered under a
// /fi or /de prefix so it doesn't 404, see App.jsx). Same standalone-copy
// reasoning as ACCESSORY_CATEGORIES/STATIC_ROUTES above: this script runs
// via plain `node`, no ESM import available. Keep this in sync by hand
// whenever translatedRoutes.js's TRANSLATED_PATHS changes.
//
// A path listed here gets its own /<locale><path> <url> entry PLUS
// <xhtml:link rel="alternate"> tags on every locale variant pointing at
// every other — the untranslated-locale gotcha from SEO.jsx applies here
// too: a path NOT listed here only gets its English entry, never an
// unreviewed /fi or /de alternate.
const TRANSLATED_PATHS = {
  "/": ["fi", "de"],
  "/sauna": ["fi"],
  "/steam/generators": ["fi"],
};

const PRODUCTS_JSON = path.join(__dirname, "..", "src", "Administrator", "Local", "data", "products.json");
const ROOMS_JSON = path.join(__dirname, "..", "src", "Administrator", "Local", "data", "saunaroom-data.json");

// Mirrors src/pages/IndividualDisplay/DispAccessories.jsx's ACCESSORY_CATEGORIES
// + isAccessoryProduct(). Kept as a literal copy (not a shared import) because
// this script runs standalone via plain `node`, outside CRA's build/webpack
// pipeline — no JSX/ESM transform available here.
const ACCESSORY_CATEGORIES = [
  "pails", "ladles", "pail shower", "thermometers",
  "clocks & timers", "sauna lights", "headrest & backrest",
  "doors & handles", "benches", "cloth hangers",
  "wooden floor mats", "kivistone", "ventilation & miscellaneous",
  "steam accessories", "accessory sets",
];

function isAccessoryProduct(product) {
  if (!product?.categories || !Array.isArray(product.categories)) return false;
  return product.categories.some((c) => ACCESSORY_CATEGORIES.includes(c.toLowerCase()));
}

// Mirrors src/local-storage/visibility.js's isPublicyVisible(). Same
// standalone-copy reasoning as above.
function isPubliclyVisible(item, now = Date.now()) {
  if (!item) return false;
  if (item.visible === false) return false;
  if (item.status === "published") return true;
  if (item.publish_at && new Date(item.publish_at).getTime() <= now) return true;
  return false;
}

// ── Static routes ───────────────────────────────────────────────────────
// Mirrors src/menuPaths.js. Kept as a literal list (not a require of the
// real file) for the same "no JSX/ESM transform outside CRA" reason as the
// helpers above — menuPaths.js is a plain ESM `export default`, which plain
// `node` can't require() without a build step. If menuPaths.js changes,
// update this list to match (see file header).
//
// adminDashboard ("/admin/dashboard") and every other /admin/* and /login
// route are deliberately excluded — never index CMS/auth surfaces.
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/sauna", priority: "0.8", changefreq: "weekly" },
  { path: "/sauna/heaters", priority: "0.9", changefreq: "weekly" },
  { path: "/sauna/heaters/wall-mounted", priority: "0.8", changefreq: "monthly" },
  { path: "/sauna/heaters/tower", priority: "0.8", changefreq: "monthly" },
  { path: "/sauna/heaters/stone", priority: "0.8", changefreq: "monthly" },
  { path: "/sauna/heaters/floor", priority: "0.8", changefreq: "monthly" },
  { path: "/sauna/heaters/combi", priority: "0.8", changefreq: "monthly" },
  { path: "/sauna/heaters/dragonfire", priority: "0.8", changefreq: "monthly" },
  { path: "/sauna/controls", priority: "0.8", changefreq: "monthly" },
  { path: "/sauna/accessories", priority: "0.8", changefreq: "monthly" },
  { path: "/sauna/accessories/accessory-sets", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/pails-ladles", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/thermometers", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/clocks-sandtimers", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/lights-covers", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/headrests-backrests", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/doors-handles", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/benches-floor-tiles", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/kivistone", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/accessories/ventilations-add-ons", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/rooms", priority: "0.8", changefreq: "weekly" },
  { path: "/sauna/rooms/interior-designs", priority: "0.6", changefreq: "monthly" },
  { path: "/sauna/rooms/wood-panels-timbers", priority: "0.6", changefreq: "monthly" },
  { path: "/steam", priority: "0.8", changefreq: "weekly" },
  { path: "/steam/generators", priority: "0.7", changefreq: "monthly" },
  { path: "/steam/controls", priority: "0.7", changefreq: "monthly" },
  { path: "/steam/accessories", priority: "0.7", changefreq: "monthly" },
  { path: "/infrared", priority: "0.8", changefreq: "monthly" },
  { path: "/support", priority: "0.6", changefreq: "monthly" },
  { path: "/support/faq", priority: "0.6", changefreq: "monthly" },
  { path: "/support/sauna-calculator", priority: "0.6", changefreq: "monthly" },
  { path: "/support/manuals", priority: "0.5", changefreq: "monthly" },
  { path: "/support/catalogue", priority: "0.5", changefreq: "monthly" },
  { path: "/contact", priority: "0.7", changefreq: "yearly" },
  { path: "/about", priority: "0.6", changefreq: "yearly" },
  { path: "/about/news", priority: "0.5", changefreq: "weekly" },
  { path: "/about/sustainability", priority: "0.5", changefreq: "yearly" },
  { path: "/careers", priority: "0.5", changefreq: "weekly" },
  { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
  { path: "/sitemap", priority: "0.3", changefreq: "monthly" },
  { path: "/products", priority: "0.9", changefreq: "weekly" },
  { path: "/sauna-accessories", priority: "0.8", changefreq: "weekly" },
  { path: "/sauna-heaters", priority: "0.8", changefreq: "weekly" },
];

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc, { changefreq, priority, lastmod, alternates }) {
  const lines = [
    "  <url>",
    `    <loc>${xmlEscape(SITE_URL + loc)}</loc>`,
  ];
  if (alternates) {
    for (const [hreflang, altPath] of Object.entries(alternates)) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${xmlEscape(SITE_URL + altPath)}"/>`);
    }
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(SITE_URL + alternates.en)}"/>`);
  }
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push("  </url>");
  return lines.join("\n");
}

// Builds { en: "/x", fi: "/fi/x", ... } for a translated path, or null if
// `route.path` isn't in TRANSLATED_PATHS (untranslated paths get no
// alternates block at all — see the gotcha noted above TRANSLATED_PATHS).
function alternatesFor(routePath) {
  const locales = TRANSLATED_PATHS[routePath];
  if (!locales || locales.length === 0) return null;
  const alternates = { en: routePath };
  for (const locale of locales) {
    alternates[locale] = routePath === "/" ? `/${locale}` : `/${locale}${routePath}`;
  }
  return alternates;
}

function toLastmod(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function main() {
  const products = loadJson(PRODUCTS_JSON);
  const rooms = loadJson(ROOMS_JSON);

  const visibleProducts = products.filter(isPubliclyVisible);
  const accessories = visibleProducts.filter(isAccessoryProduct);
  const plainProducts = visibleProducts.filter((p) => !isAccessoryProduct(p));
  const visibleRooms = rooms.filter(isPubliclyVisible);

  const entries = [];

  for (const route of STATIC_ROUTES) {
    const alternates = alternatesFor(route.path);
    entries.push(urlEntry(route.path, { ...route, alternates }));

    if (alternates) {
      for (const locale of TRANSLATED_PATHS[route.path]) {
        entries.push(urlEntry(alternates[locale], { ...route, alternates }));
      }
    }
  }

  for (const p of plainProducts) {
    entries.push(
      urlEntry(`/products/${p.slug}`, {
        changefreq: "monthly",
        priority: "0.7",
        lastmod: toLastmod(p.updated_at),
      })
    );
  }

  for (const a of accessories) {
    entries.push(
      urlEntry(`/accessories/${a.slug}`, {
        changefreq: "monthly",
        priority: "0.6",
        lastmod: toLastmod(a.updated_at),
      })
    );
  }

  for (const r of visibleRooms) {
    entries.push(
      urlEntry(`/sauna/rooms/${r.slug}`, {
        changefreq: "monthly",
        priority: "0.7",
        lastmod: toLastmod(r.updated_at),
      })
    );
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries.join("\n") +
    "\n</urlset>\n";

  fs.writeFileSync(OUT_FILE, xml, "utf8");
  const localeUrlCount = entries.length - STATIC_ROUTES.length - plainProducts.length - accessories.length - visibleRooms.length;
  console.log(
    `SITEMAP: wrote ${entries.length} URLs (${STATIC_ROUTES.length} static + ${localeUrlCount} translated-locale variants + ${plainProducts.length} products + ${accessories.length} accessories + ${visibleRooms.length} rooms) to ${OUT_FILE}`
  );
}

main();
