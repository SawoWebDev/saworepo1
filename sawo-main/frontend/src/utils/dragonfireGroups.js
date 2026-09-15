// Shared brand-grouping/ordering logic for Dragonfire-series heaters
// (Heaterking, Fiberjungle, Scandifire, Minidragon families). Used by both
// the dedicated Dragonfire heaters page (pages/Sauna/heaters/Dragonfire.jsx)
// and the "Dragonfire Series" section of the full heaters catalog
// (pages/HeatersCatalog.jsx) plus the admin Sauna Heaters view
// (Administrator/Products.jsx) so all three stay in sync — mirrors
// floorGroups.js/combiGroups.js's exact shape for the same reason those
// files exist. GROUP_KEYWORDS is also exported (unlike the other Group
// files) because Dragonfire.jsx's own admission filter reuses it directly.

// Display order of the brand sections.
export const DRAGONFIRE_FIXED_ORDER = ["Heaterking", "Fiberjungle", "Scandifire", "Minidragon"];

// Matching order — checked in this exact sequence, first match wins.
export const DRAGONFIRE_GROUP_KEYWORDS = {
  Heaterking: ["Heaterking"],
  Fiberjungle: ["Fiberjungle"],
  Scandifire: ["Scandifire"],
  Minidragon: ["Minidragon"],
};

/** Group Dragonfire products by brand keywords. No within-group sort —
 *  Dragonfire.jsx has never variant-sorted these, so this stays faithful
 *  to that existing behavior rather than introducing a new order. */
export function groupDragonfireProducts(products) {
  return products.reduce((groups, product) => {
    let assigned = false;
    for (const [group, keywords] of Object.entries(DRAGONFIRE_GROUP_KEYWORDS)) {
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
