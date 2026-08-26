// Administrator/Local/scripts/product-i18n-fields.js
//
// Pure field-walking/hashing logic for product translation, shared between
// the CLI pipeline (product-i18n.js, Node-only: fs/dotenv/service-role
// Supabase client) and the browser-side Translation CMS (which can't import
// any of that into a CRA bundle). Zero Node-only imports here on purpose —
// this file is safe to import from both.
//
// normalize() and getVariationGroups() are moved verbatim from
// product-i18n.js — same behavior, just relocated so both the CLI script
// and the CMS call the exact same implementation instead of two copies
// silently drifting apart. See README-i18n.md's "Product content" section
// for the prose/data split this all serves.

// ── normalize ───────────────────────────────────────────────────────────
// Trim + collapse whitespace. Used both as the translation_memory lookup
// key and (here) as what gets hashed for freshness comparison — the same
// two trivial English variations ("Steam Door" vs " Steam Door ") that
// shouldn't cost a fresh translation shouldn't register as "source
// changed" either.
export function normalize(text) {
  return typeof text === "string" ? text.trim().replace(/\s+/g, " ") : text;
}

// ── getVariationGroups ──────────────────────────────────────────────────
// Mirrors pages/IndividualDisplay/DispAccessories.jsx's getVariationsArray()
// priority EXACTLY — local_variations > variations > a legacy fallback that
// combines variants + heating_element_groups into the same {name, image,
// features, spec_table, description} shape. Whichever one a given product
// actually has populated is what DispProduct.jsx renders, so that's what
// needs translating (and hashing) — always written back to
// product_translations.variations regardless of which field it came from.
// DO NOT change this logic without also updating DispAccessories.jsx and
// re-verifying against both — it's deliberately duplicated reasoning, not
// duplicated code, and the two are expected to stay in lockstep.
export function getVariationGroups(product) {
  if (product.local_variations?.length) return product.local_variations;
  if (product.variations?.length) return product.variations;

  const legacyVariants = product.local_variants?.length ? product.local_variants : product.variants || [];
  const legacyGroups = product.heating_element_groups || [];
  return [
    ...legacyVariants.map((v) => ({
      name: [v.color, v.code ? `(${v.code})` : ""].filter(Boolean).join(" ").trim() || null,
      color: v.color || null,
      code: v.code || null,
      image: v.image || null,
      description: "",
      features: [],
      spec_table: null,
    })),
    ...legacyGroups.map((g) => ({
      name: g.label || null,
      color: null,
      code: null,
      image: g.image || null,
      description: g.description || "",
      features: g.features || [],
      spec_table: g.spec_table || null,
    })),
  ];
}

// ── walkProseFields ──────────────────────────────────────────────────────
// Yields every {path, value} translatable prose field on a product, using
// the exact path-label strings product-i18n.js's buildPacket()/tmLookup
// already produce ("name", "description", "features[0]",
// "variations[0].name", "variations[0].spec_table_headers[0]",
// "included_items[0].title", ...). This is the single source of truth for
// "what counts as translatable" — buildPacket() (CLI extract) and the CMS's
// status/task-generation code both walk from this, so they can never
// silently diverge on which fields matter.
//
// Deliberately excludes (never yields a path for): spec_table.rows,
// variations[].image/code/color, included_items[].slug/image — data, not
// prose, per README-i18n.md's product-i18n.js table.
export function walkProseFields(product) {
  const out = [];
  const add = (path, value) => out.push({ path, value: value ?? null });

  add("name", product.name);
  add("short_description", product.short_description);
  add("description", product.description);
  add("type", product.type);

  if (Array.isArray(product.features)) {
    product.features.forEach((s, i) => add(`features[${i}]`, s));
  }

  if (product.spec_table?.headers?.length > 0) {
    product.spec_table.headers.forEach((s, i) => add(`spec_table_headers[${i}]`, s));
  }

  const variationGroups = getVariationGroups(product);
  variationGroups.forEach((g, i) => {
    add(`variations[${i}].name`, g.name);
    add(`variations[${i}].description`, g.description);
    if (Array.isArray(g.features)) {
      g.features.forEach((s, fi) => add(`variations[${i}].features[${fi}]`, s));
    }
    if (g.spec_table?.headers?.length > 0) {
      g.spec_table.headers.forEach((s, hi) => add(`variations[${i}].spec_table_headers[${hi}]`, s));
    }
  });

  if (Array.isArray(product.included_items)) {
    product.included_items.forEach((item, i) => {
      add(`included_items[${i}].title`, item.title);
      add(`included_items[${i}].note`, item.note);
    });
  }

  return out;
}

// ── hashSourceValue ──────────────────────────────────────────────────────
// FNV-1a, 32-bit, over normalize(text). Not cryptographic — doesn't need
// to be, this only has to be deterministic so the same English string
// always hashes the same way, in both Node (CLI) and the browser (CMS).
// null/empty normalizes to the empty-string hash, which is fine: a field
// that's null in English (rare, but possible) is still a stable value to
// compare against.
export function hashSourceValue(text) {
  const str = normalize(text) || "";
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // hash *= 16777619 (FNV prime), done via shifts to stay in 32-bit int math
    hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// ── computeSourceFieldHashes ──────────────────────────────────────────────
// Returns { path: hash } for the given paths (or every prose path on the
// product, if touchedPaths is omitted). Used by product-i18n.js's apply()
// (CLI) and by the CMS's apply flow — same function, same output shape,
// called from two different runtimes.
export function computeSourceFieldHashes(product, touchedPaths) {
  const all = walkProseFields(product);
  const wanted = touchedPaths ? new Set(touchedPaths) : null;
  const out = {};
  for (const { path, value } of all) {
    if (wanted && !wanted.has(path)) continue;
    out[path] = hashSourceValue(value);
  }
  return out;
}

// ── packetTouchedPaths ────────────────────────────────────────────────────
// Given a packet's `fields` object (the same shape buildPacket() in
// product-i18n.js produces, and what the CMS's task-generation should also
// produce for consistency), returns every field-path it covers — "covers"
// meaning the key was present for the translator to see, whether they
// filled it in or deliberately left it null. This is "was reviewed," which
// is what apply() needs to know which hashes to (re)write. Array items are
// matched by their own `index` property (not array position), matching how
// apply() already merges variations/included_items by index.
export function packetTouchedPaths(fields) {
  const paths = [];
  if (!fields || typeof fields !== "object") return paths;

  for (const key of ["name", "short_description", "description", "type"]) {
    if (key in fields) paths.push(key);
  }

  if (Array.isArray(fields.features)) {
    fields.features.forEach((_, i) => paths.push(`features[${i}]`));
  }

  if (Array.isArray(fields.spec_table_headers)) {
    fields.spec_table_headers.forEach((_, i) => paths.push(`spec_table_headers[${i}]`));
  }

  if (Array.isArray(fields.variations)) {
    fields.variations.forEach((v) => {
      const i = v.index;
      if (i === undefined || i === null) return;
      paths.push(`variations[${i}].name`, `variations[${i}].description`);
      if (Array.isArray(v.features)) {
        v.features.forEach((_, fi) => paths.push(`variations[${i}].features[${fi}]`));
      }
      if (Array.isArray(v.spec_table_headers)) {
        v.spec_table_headers.forEach((_, hi) => paths.push(`variations[${i}].spec_table_headers[${hi}]`));
      }
    });
  }

  if (Array.isArray(fields.included_items)) {
    fields.included_items.forEach((item) => {
      const i = item.index;
      if (i === undefined || i === null) return;
      paths.push(`included_items[${i}].title`, `included_items[${i}].note`);
    });
  }

  return paths;
}
