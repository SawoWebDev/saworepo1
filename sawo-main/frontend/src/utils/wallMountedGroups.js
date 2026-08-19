// Shared brand-grouping/ordering logic for wall-mounted heaters (Nordex, Mini,
// Scandia, Krios, Scandifire families). Used by both the dedicated
// Wall-Mounted heaters page (pages/Sauna/heaters/WallMounted.jsx) and the
// "Wall-Mounted Series" section of the full heaters catalog
// (pages/HeatersCatalog.jsx) so the two stay in sync.

// Display order of the brand sections.
export const WALL_MOUNTED_FIXED_ORDER = [
  "Nordex", "Nordex Mini", "Nordex Combi", "Nordex Mini Combi",
  "Mini", "Mini X", "Mini Combi",
  "Scandia", "Scandia Combi",
  "Krios", "Scandifire",
];

// Matching order — most specific keyword combos first, so e.g. "Nordex Mini
// Combi" is claimed before the broader "Nordex Mini" or "Nordex" groups.
// Scandifire must be checked before Scandia — Scandifire products carry a
// "Scandia" tag too (it's a variant of the classic Scandia design), which
// would otherwise match the "Scandia" group first.
export const WALL_MOUNTED_GROUP_KEYWORDS = {
  "Nordex Mini Combi": ["Nordex Mini Combi", "NRMC"],
  "Nordex Combi":      ["Nordex Combi", "NRNC"],
  "Nordex Mini":       ["Nordex Mini", "NRM-"],
  "Nordex":            ["Nordex", "NRN-"],
  "Mini Combi":        ["Mini Combi", "MNC"],
  "Mini X":            ["Mini X", "MX "],
  "Mini":              ["Mini NB", "MN "],
  "Scandifire":        ["Scandifire"],
  "Scandia Combi":     ["Scandia Combi", "SCAC"],
  "Scandia":           ["Scandia", "SCA-"],
  "Krios":             ["Krios", "KRI"],
};

/** Within a brand group, order by control class (Ni2 → NS → NB), then the
 *  plain/standard variant before its Black or Fiber-Coated counterpart. */
export function variantRank(name = "") {
  const n = name.toLowerCase();
  let classRank;
  if (/\bni2\b/.test(n)) classRank = 0;
  else if (/\bns\b/.test(n)) classRank = 1;
  else if (/\bnb\b/.test(n)) classRank = 2;
  else classRank = 3;
  const isAlt = /black|fibercoated|fiber coated/.test(n);
  return classRank * 2 + (isAlt ? 1 : 0);
}

/** Group wall-mounted products by brand/type keywords, each group sorted by variantRank. */
export function groupWallMountedProducts(products) {
  const groupedProducts = products.reduce((groups, product) => {
    let assigned = false;
    for (const [group, keywords] of Object.entries(WALL_MOUNTED_GROUP_KEYWORDS)) {
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
  for (const group of Object.keys(groupedProducts)) {
    groupedProducts[group].sort((a, b) => variantRank(a.name) - variantRank(b.name));
  }
  return groupedProducts;
}
