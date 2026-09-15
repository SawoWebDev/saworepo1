// Shared brand-grouping/ordering logic for Stone-series heaters (Cumulus,
// Nimbus families). Used by both the dedicated Stone heaters page
// (pages/Sauna/heaters/Stone.jsx) and the "Stone Series" section of the
// full heaters catalog (pages/HeatersCatalog.jsx) plus the admin Sauna
// Heaters view (Administrator/Products.jsx) so all three stay in sync —
// mirrors floorGroups.js/combiGroups.js's exact shape for the same reason
// those files exist.

// Display order of the brand sections.
export const STONE_FIXED_ORDER = ["Cumulus", "Nimbus"];

// Matching order — checked in this exact sequence, first match wins.
export const STONE_GROUP_KEYWORDS = {
  Cumulus: ["Cumulus"],
  Nimbus: ["Nimbus"],
};

/** Group Stone products by brand keywords. No within-group sort — Stone.jsx
 *  has never variant-sorted these, so this stays faithful to that existing
 *  behavior rather than introducing a new order. */
export function groupStoneProducts(products) {
  return products.reduce((groups, product) => {
    let assigned = false;
    for (const [group, keywords] of Object.entries(STONE_GROUP_KEYWORDS)) {
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
