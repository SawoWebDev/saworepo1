// Builds schema.org JSON-LD for a product detail page, straight from the
// product row — nothing is hand-written per product, so a new CMS product
// gets structured data the moment it's published.
//
// WHERE THE DATA COMES FROM (verified against the live wall-mounted heaters):
//   - model codes (SKUs): product tags shaped like "NRN-45NS-Z-C" / "NRN-45Ni2-Z-C"
//   - specs: the HTML <table> in `description` — one row per model code
//     (kW, room m3, size, stones, control). `spec_table`/`variations` are
//     empty for these products, so they're used only as a fallback.
// Each model row becomes a `hasVariant` Product with its own sku + specs.
//
// LOCALES: DispProduct hands this the product AFTER useLocalProducts has
// merged the active locale's product_translations row on top of the English
// row (name/description/features/spec_table/variations), so the same call
// yields translated markup on /zh, /de, ... with no extra work — including
// the spec names, because the translated description carries translated
// table headers. `url` is the localized path and the WebPage node carries
// `inLanguage`. A field the translation leaves empty falls back to English
// in the merge, never to a blank.
//
// Pure (no React, no window/DOM) so scripts/seo/jsonld-audit.mjs can run the
// very same function over the whole catalogue to log what each product emits.

export const SITE_URL = "https://www.sawo.com";
const BRAND = "SAWO";

const LOCALE_TAGS = { en: "en", fi: "fi", de: "de", zh: "zh-CN", ja: "ja", fr: "fr", es: "es", th: "th" };

// "NRN-45NS-Z-C", "KRI-60NS-P-C", "MN-23NB-P-F" — letters, hyphen, a digit-led
// segment, more hyphenated segments. Excludes plain words and "4.5 – 9.0kW".
const SKU_RE = /^(?=.*\d)[A-Z][A-Z0-9]{1,6}(-[A-Za-z0-9.]+){1,5}$/;

export function stripHtml(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const absolute = (u) => (u && (u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`));
const isEmptyCell = (v) => v === null || v === undefined || ["", "–", "-"].includes(String(v).trim());

export function skusFromTags(product) {
  return (product.tags || []).map((t) => String(t).trim()).filter((t) => SKU_RE.test(t));
}

// Regex table reader (no DOMParser, so it runs in Node too). Returns
// [{ sku, props:[{name,value}] }] for the first table whose rows start with a
// model code. Columns whose header lists A | B | C (safety distances) are
// dropped: they're installation drawings, not product specs.
export function parseModelTable(html) {
  const tables = String(html || "").match(/<table[\s\S]*?<\/table>/gi) || [];
  for (const tbl of tables) {
    const rows = (tbl.match(/<tr[\s\S]*?<\/tr>/gi) || []).map((r) =>
      (r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || []).map((c) => ({
        text: stripHtml(c),
        span: Number((c.match(/colspan="?(\d+)/i) || [])[1] || 1),
        th: /^<th/i.test(c),
      }))
    );
    const headerRow = rows.find((r) => r.length && r.every((c) => c.th));
    const dataRows = rows.filter((r) => r.length && !r.every((c) => c.th) && SKU_RE.test(r[0].text));
    if (!headerRow || !dataRows.length) continue;
    const cols = [];
    let i = 0;
    for (const h of headerRow) {
      if (h.text && !h.text.includes("|")) cols.push({ idx: i, name: h.text });
      i += h.span;
    }
    return dataRows.map((r) => ({
      sku: r[0].text,
      props: cols.slice(1).map((c) => ({ name: c.name, value: r[c.idx]?.text })).filter((p) => !isEmptyCell(p.value)),
    }));
  }
  return [];
}

const toProps = (props) => props.map((p) => ({ "@type": "PropertyValue", name: p.name, value: p.value }));

// One-row CMS spec_table fallback (header -> value). Multi-row tables are
// per-variant grids; flattening them onto one product would assert wrong specs.
function cmsSpecProps(product) {
  const headers = product.spec_table?.headers || [];
  const rows = product.spec_table?.rows || [];
  if (headers.length === 0 || rows.length !== 1) return { props: [], multiRow: rows.length > 1 };
  const row = rows[0];
  const props = headers
    .map((h, i) => ({ name: stripHtml(h), value: stripHtml(Array.isArray(row) ? row[i] : row?.[h]) }))
    .filter((p) => p.name && !isEmptyCell(p.value));
  return { props, multiRow: false };
}

/**
 * @param product  merged (translated) product row
 * @param opts.locale   active locale code
 * @param opts.path     localized path, e.g. "/zh/products/nordex-..."
 * @param opts.image    resolved thumbnail URL (getImageUrl) — falls back to og_image
 * @param opts.images   resolved gallery URLs
 * @param opts.itemCode first variation's code (model/SKU), if any
 */
export function buildProductJsonLd(product, { locale = "en", path, image, images = [], itemCode } = {}) {
  const url = `${SITE_URL}${path || `/products/${product.slug}`}`;
  const description = stripHtml(product.short_description || product.description);
  const imgs = [...new Set([image || product.og_image, ...images].filter(Boolean).map(absolute))];
  const cats = Array.isArray(product.categories) ? product.categories.filter(Boolean) : [];
  const brand = { "@type": "Brand", name: product.brand || BRAND };

  const models = parseModelTable(product.description);
  const tagSkus = skusFromTags(product);
  // Table rows carry specs; any tag SKU the table doesn't list still counts as a model.
  const variants = [
    ...models.map((m) => ({ sku: m.sku, props: m.props })),
    ...tagSkus.filter((s) => !models.some((m) => m.sku === s)).map((sku) => ({ sku, props: [] })),
  ];
  const single = variants.length === 0 ? itemCode : variants.length === 1 ? variants[0].sku : undefined;
  const cms = variants.length ? { props: [] } : cmsSpecProps(product);
  // Marketing feature bullets are deliberately NOT emitted: they're prose, not
  // specs, and stay English on non-English routes until translated.
  const additionalProperty = toProps(cms.props);

  const productNode = {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    ...(description && { description }),
    ...(imgs.length && { image: imgs }),
    ...(single && { sku: single, mpn: single }),
    brand,
    ...(cats.length && { category: cats.join(" > ") }),
    ...(additionalProperty.length && { additionalProperty }),
    ...(variants.length > 1 && {
      hasVariant: variants.map((v) => ({
        "@type": "Product",
        name: `${product.name} ${v.sku}`,
        sku: v.sku,
        mpn: v.sku,
        brand,
        ...(v.props.length && { additionalProperty: toProps(v.props) }),
      })),
    }),
    ...(variants.length === 1 && variants[0].props.length && { additionalProperty: toProps(variants[0].props) }),
    url,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: product.name,
        inLanguage: LOCALE_TAGS[locale] || locale,
        isPartOf: { "@type": "WebSite", name: BRAND, url: SITE_URL },
        mainEntity: { "@id": `${url}#product` },
      },
      productNode,
    ],
  };
}

/**
 * Which of the fields that make the markup useful does this product have?
 * Drives the audit log. `missing` = worth fixing in the CMS; `notes` = FYI.
 */
export function auditProductJsonLd(product, opts = {}) {
  const ld = buildProductJsonLd(product, opts);
  const node = ld["@graph"][1];
  const { multiRow } = cmsSpecProps(product);
  // CJK packs far more meaning per character, so its floor is lower.
  const minDesc = /[぀-ヿ一-鿿]/.test(node.description || "") ? 15 : 50;
  const hasVariantSpecs = (node.hasVariant || []).some((v) => v.additionalProperty?.length);
  const fields = {
    name: !!node.name,
    description: !!node.description && node.description.length >= minDesc,
    image: !!node.image,
    sku: !!node.sku || !!node.hasVariant?.length,
    category: !!node.category,
    specs: hasVariantSpecs || !!node.additionalProperty?.length,
  };
  const missing = Object.keys(fields).filter((k) => !fields[k]);
  const notes = [];
  const variantCount = node.hasVariant?.length || 0;
  if (variantCount) notes.push(`${variantCount} models`);
  const tagSkus = skusFromTags(product);
  const tableSkus = parseModelTable(product.description).map((m) => m.sku);
  const noSpecs = tagSkus.filter((s) => !tableSkus.includes(s));
  if (tableSkus.length && noSpecs.length) notes.push(`${noSpecs.length} tag SKU(s) not in description table`);
  if (multiRow) notes.push("spec_table has several rows — not emitted");
  if (node.description && node.description.length < minDesc) notes.push(`description under ${minDesc} chars`);
  return { fields, missing, notes, ld };
}
