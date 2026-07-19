/**
 * accessoriesTransform.js
 *
 * Shared transform: allaccs-data category object -> products.json-shaped
 * accessory records. Pure CommonJS so it loads identically from webpack
 * (named-export interop) and from node (build-accessories.js `require()`),
 * keeping the runtime "jsonfile" source and the offline --merge build from
 * ever diverging.
 *
 * allaccs category key -> site display category (must match the accessory
 * pages' DISPLAY_CATEGORIES so records show up in the right section).
 */
const CATEGORY_MAP = {
  pails: "Pails",
  ladles: "Ladles",
  pail_shower: "Pail Shower",
  thermometers_and_combined_meters: "Thermometers",
  clocks_and_timers: "Clocks & Timers",
  sauna_lights: "Sauna Lights",
  headrest_and_backrests: "Headrest & Backrest",
  doors_and_handles: "Doors & Handles",
  benches: "Benches",
  hangers_and_hook_racks: "Cloth Hangers",
  floor_mat_tiles: "Wooden Floor Mats",
  kivistone: "Kivistone",
  ventilations_and_miscellaneous: "Ventilation & Miscellaneous",
  accessory_sets: "Accessory Sets",
};

// The display categories this transform owns (existing rows in these get replaced).
const OWNED_CATEGORIES = new Set(Object.values(CATEGORY_MAP));

function stripHtml(s) {
  return String(s || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function slugify(s) {
  return stripHtml(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseCapacityLiters(cap) {
  if (!cap) return null;
  const m = String(cap).match(/(\d+(?:\.\d+)?)\s*L/i);
  return m ? Number(m[1]) : null;
}

// Collect labeled spec rows from the misc scalar fields on a product.
function buildSpecTable(p) {
  const rows = [];
  const add = (label, val) => { if (val) rows.push([label, stripHtml(val)]); };
  add("Capacity", p.capacity);
  add("Size", p.size_display || p.size);
  add("Thickness", p.thickness);
  add("Weight", p.weight);
  add("Material", p.material);
  add("Opening Size", p.opening_size);
  add("Frame Size", p.frame_size);
  add("Ducting Hole", p.ducting_hole);
  add("Use", p.use);
  add("Includes", p.inclusions);
  add("Set Codes", p.set_codes);
  if (!rows.length) return null;
  return { headers: ["Specification", "Detail"], rows };
}

// The raw variant list for a product; flat items get one synthesized variant.
function rawVariants(p) {
  return Array.isArray(p.variants) && p.variants.length
    ? p.variants
    : [{ color: p.option || "", code: p.code || "", image: p.image }];
}

/**
 * Transform the allaccs-data category object into products.json-shaped
 * accessory records.
 *
 * @param {object} rawData - the accessoriesData object (category key -> array)
 * @param {object} [opts]
 * @param {(url: string) => string} [opts.mapImage] - rewrites an image
 *   reference (identity by default — used at runtime where the JSON file
 *   already stores `images/<file>` relative paths; build-accessories.js
 *   passes a WordPress-URL -> local-filename resolver instead).
 * @param {(slug: string, product: object) => string} [opts.makeId] -
 *   generates each record's id. Defaults to a deterministic `"jf-" + slug`
 *   (safe in the browser, stable across refetches). build-accessories.js
 *   passes crypto.randomUUID to preserve its existing --merge output.
 */
function transformAccessories(rawData, opts = {}) {
  const mapImage = opts.mapImage || ((url) => url || null);
  const makeId = opts.makeId || ((slug) => "jf-" + slug);

  const records = [];
  const usedSlugs = new Set();
  const now = new Date().toISOString();

  const uniqueSlug = (base) => {
    let s = base || "accessory";
    let i = 2;
    while (usedSlugs.has(s)) s = `${base}-${i++}`;
    usedSlugs.add(s);
    return s;
  };

  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    const items = rawData[key];
    if (!Array.isArray(items)) continue;

    items.forEach((p, idx) => {
      const displayName = stripHtml(p.name_display || p.name);
      const primaryCode = p.code || (p.variants && p.variants[0] && p.variants[0].code) || "";
      const slug = p.slug
        ? uniqueSlug(slugify(p.slug))
        : uniqueSlug(slugify(displayName + (primaryCode ? "-" + primaryCode : "")));

      const thumbnail = mapImage(p.image);
      const variants = rawVariants(p).map(v => ({
        color: v.color || "", code: v.code || "", image: mapImage(v.image),
      }));

      records.push({
        id: makeId(slug, p),
        name: displayName,
        slug,
        short_description: p.description ? stripHtml(p.description) : null,
        description: null,
        thumbnail,
        images: [],
        spec_images: [],
        categories: [category],
        tags: [],
        auto_tag_columns: null,
        features: [],
        brand: "SAWO",
        type: category,
        spec_table: buildSpecTable(p),
        resources: p.video ? { video: p.video, files: [] } : null,
        status: "published",
        visible: true,
        featured: !!p.bestSeller,
        sort_order: idx,
        created_by: null,
        created_by_username: "Rafael",
        created_at: now,
        updated_at: now,
        files: [],
        updated_by_username: "Rafael",
        is_deleted: false,
        capacity_liters: parseCapacityLiters(p.capacity),
        variant_type: variants.length > 1 ? "material" : null,
        product_family: null,
        parent_product_id: null,
        variants, // extra field — rendered by DispAccessories; not a Supabase column yet
      });
    });
  }

  return records;
}

// Every source image reference a product carries (thumbnail + variants),
// used by build-accessories.js to build its url -> local-filename resolver.
function productImageUrls(p) {
  const urls = [];
  if (p.image) urls.push(p.image);
  for (const v of rawVariants(p)) if (v.image) urls.push(v.image);
  return urls;
}

module.exports = {
  CATEGORY_MAP,
  OWNED_CATEGORIES,
  stripHtml,
  slugify,
  parseCapacityLiters,
  buildSpecTable,
  rawVariants,
  productImageUrls,
  transformAccessories,
};
