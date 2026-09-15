// Shared brand-grouping/ordering logic for Floor-series heaters (Helius,
// Taurus D, Savonia, Nordex families). Used by both the dedicated Floor
// heaters page (pages/Sauna/heaters/Floor.jsx) and the "Floor Series"
// section of the full heaters catalog (pages/HeatersCatalog.jsx) so the
// two stay in sync — mirrors wallMountedGroups.js's exact shape for the
// same reason that file exists (see its own header comment).

// Display order of the brand sections. Krios is intentionally excluded —
// Floor Series no longer displays it — but its keyword entry below still
// claims any Krios product before it could otherwise fall through to
// "Other" or get mismatched into Savonia/Nordex.
export const FLOOR_FIXED_ORDER = ["Helius", "Taurus D", "Savonia", "Nordex"];

// Matching order — checked in this exact sequence, first match wins.
export const FLOOR_GROUP_KEYWORDS = {
  "Taurus D": ["Taurus D", "Taurus"],
  Helius: ["Helius", "HELIUS"],
  Krios: ["Krios Floor", "Krios"],
  Savonia: ["Savonia"],
  Nordex: ["Nordex"],
};

/** Group Floor products by brand keywords. Each group's own internal order
 *  is left to the caller (Floor.jsx doesn't variant-sort today; pass
 *  products already sorted if that's wanted). */
export function groupFloorProducts(products) {
  return products.reduce((groups, product) => {
    let assigned = false;
    for (const [group, keywords] of Object.entries(FLOOR_GROUP_KEYWORDS)) {
      for (const kw of keywords) {
        const nameMatch = product.name?.toLowerCase().includes(kw.toLowerCase());
        const tagMatch = product.tags?.some((t) => t.toLowerCase().includes(kw.toLowerCase()));
        if (nameMatch || tagMatch) {
          if (!groups[group]) groups[group] = [];
          groups[group].push(product);
          assigned = true;
          break;
        }
      }
      if (assigned) break;
    }
    if (!assigned) {
      if (!groups["Other"]) groups["Other"] = [];
      groups["Other"].push(product);
    }
    return groups;
  }, {});
}
