// Product JSON-LD audit + log.
//
//   node scripts/seo/jsonld-audit.mjs                 # pilot: wall-mounted heaters
//   node scripts/seo/jsonld-audit.mjs --all           # every public product
//   node scripts/seo/jsonld-audit.mjs --category floor
//   node scripts/seo/jsonld-audit.mjs --locales en,zh,de
//
// Reads the live Supabase `products` + `product_translations` (anon key, same
// read the site does), builds each product's JSON-LD with the SAME function
// the page uses (src/utils/productJsonLd.js), and writes a record to
// docs/seo/: jsonld-audit.json (machine-readable, overwritten) and
// jsonld-audit-log.md (a new dated section is prepended each run, so the
// history of what had / lacked markup is kept).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProductJsonLd, auditProductJsonLd } from "../../src/utils/productJsonLd.js";
import { PRODUCT_TRANSLATED_LOCALES } from "../../src/i18n/seoProductLocales.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : d; };

// .env parse (values never printed)
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
const KEY = env.SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY;
const get = async (q) => {
  const r = await fetch(`${URL_}/rest/v1/${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${q} -> ${r.status} ${await r.text()}`);
  return r.json();
};

const LOCALES = opt("locales", "en,zh,de,fr,es,th").split(",");
const category = (opt("category", flag("all") ? "" : "wall-mounted")).toLowerCase();

const merge = (p, t) => !t ? p : {
  ...p,
  name: t.name || p.name, short_description: t.short_description || p.short_description,
  description: t.description || p.description, features: t.features || p.features,
  spec_table: t.spec_table || p.spec_table, variations: t.variations || p.variations,
};
const variations = (p) => (Array.isArray(p.variations) ? p.variations : Array.isArray(p.heating_element_groups) ? p.heating_element_groups : Array.isArray(p.variants) ? p.variants : []);
const imgUrl = (v) => (typeof v === "string" ? v : v?.url || v?.src || null);

const products = (await get("products?select=*&is_deleted=eq.false&order=name"))
  .filter((p) => p.visible !== false && (p.status === "published" || (p.publish_at && new Date(p.publish_at) <= new Date())))
  .filter((p) => !category || (p.categories || []).some((c) => String(c).toLowerCase() === category));

const rows = [];
for (const locale of LOCALES) {
  const tr = locale === "en" ? {} : Object.fromEntries(
    (await get(`product_translations?select=product_id,name,short_description,description,features,spec_table,variations&locale=eq.${locale}`)).map((r) => [r.product_id, r])
  );
  for (const p of products) {
    const m = merge(p, tr[p.id]);
    const thumb = imgUrl(p.thumbnail) || imgUrl(p.images?.[0]);
    const pathStr = `${locale === "en" ? "" : `/${locale}`}/products/${p.slug}`;
    const a = auditProductJsonLd(m, {
      locale, path: pathStr, image: thumb || p.og_image,
      images: (p.images || []).map(imgUrl).filter(Boolean), itemCode: variations(m)[0]?.code || variations(p)[0]?.code,
    });
    const translated = locale === "en" ? true : !!tr[p.id]?.name;
    rows.push({
      slug: p.slug, name: p.name, category: (p.categories || []).join(" > "), locale,
      emits: true, translated, hreflangReviewed: locale === "en" || (PRODUCT_TRANSLATED_LOCALES[p.slug] || []).includes(locale),
      models: a.ld["@graph"][1].hasVariant?.length || (a.ld["@graph"][1].sku ? 1 : 0),
      fields: a.fields, missing: a.missing, notes: a.notes,
    });
  }
}

const outDir = path.join(root, "docs", "seo");
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString();
fs.writeFileSync(path.join(outDir, "jsonld-audit.json"), JSON.stringify({ generated: stamp, category: category || "ALL", locales: LOCALES, rows }, null, 1));

const tick = (b) => (b ? "✓" : "—");
const en = rows.filter((r) => r.locale === "en");
const complete = en.filter((r) => r.missing.length === 0).length;
const byLocale = LOCALES.map((l) => { const r = rows.filter((x) => x.locale === l); return `${l}: ${r.filter((x) => x.translated).length}/${r.length} translated`; }).join(" · ");
let md = `## ${stamp.slice(0, 10)} — scope: ${category || "ALL"} (${en.length} products)\n\n`;
md += `Complete in EN (no missing fields): **${complete}/${en.length}** · ${byLocale}\n\n`;
md += `| Product | Category | name | desc | image | sku | cat | specs | Missing | Translated in | Notes |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const r of en) {
  const langs = rows.filter((x) => x.slug === r.slug && x.locale !== "en" && x.translated).map((x) => x.locale).join(",") || "—";
  const f = r.fields;
  const bad = rows.filter((x) => x.slug === r.slug && x.locale !== "en" && x.translated && (x.models !== r.models || x.missing.length)).map((x) => `${x.locale}(${x.models}/${r.models}${x.missing.length ? " " + x.missing.join("+") : ""})`).join(", ") || "—";
  md += `| ${r.name} | ${r.category || ""} | ${tick(f.name)} | ${tick(f.description)} | ${tick(f.image)} | ${tick(f.sku)} | ${tick(f.category)} | ${tick(f.specs)} | ${r.missing.join(", ") || "—"} | ${langs} | ${bad} | ${r.notes.join("; ") || ""} |\n`;
}
const logFile = path.join(outDir, "jsonld-audit-log.md");
const prev = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8").replace(/^# .*\n\n/, "") : "";
fs.writeFileSync(logFile, `# Product JSON-LD audit log\n\nNewest run first. Generated by scripts/seo/jsonld-audit.mjs.\n\n${md}\n${prev}`);

// sample of what ships, for eyeballing / Rich Results Test
const sample = products[0];
if (sample) fs.writeFileSync(path.join(outDir, "jsonld-sample.json"), JSON.stringify(buildProductJsonLd(sample, { locale: "en", path: `/products/${sample.slug}` }), null, 2));
console.log(`products: ${en.length}, complete in EN: ${complete}. Wrote docs/seo/jsonld-audit-log.md, jsonld-audit.json`);
