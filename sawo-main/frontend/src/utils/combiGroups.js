// Shared brand-grouping/ordering logic for Combi-series heaters (Taurus D,
// Nordex Pro/S/Mini/plain, Mini, Savonia, Scandia, Nimbus combi models).
// Used by both the dedicated Combi heaters page
// (pages/Sauna/heaters/Combi.jsx) and the "Combi Series" section of the
// full heaters catalog (pages/HeatersCatalog.jsx) plus the admin Sauna
// Heaters view (Administrator/Products.jsx) so all three stay in sync —
// mirrors wallMountedGroups.js/floorGroups.js's exact shape for the same
// reason those files exist.
import { variantRank } from "./wallMountedGroups";

// Display order of the brand sections.
export const COMBI_FIXED_ORDER = [
  "Taurus D Combi",
  "Nordex Pro Combi",
  "Nordex S Combi",
  "Nordex Combi",
  "Nordex Mini Combi",
  "Mini Combi",
  "Savonia Combi",
  "Scandia Combi",
  "Nimbus Combi",
];

// Matching order — most specific first, so e.g. "Nordex Pro Combi" is
// claimed before the broader "Nordex Combi" group.
export const COMBI_GROUP_KEYWORDS = {
  "Taurus D Combi": ["Taurus D Combi", "TRDC-NS"],
  "Nordex Pro Combi": ["Nordex Pro Combi", "NRNC-PRO"],
  "Nordex S Combi": ["Nordex S Combi", "NRNSC"],
  "Nordex Combi": ["Nordex Combi", "NRNC"],
  "Nordex Mini Combi": ["Nordex Mini Combi", "NRMC"],
  "Mini Combi": ["Mini Combi", "MNC"],
  "Savonia Combi": ["Savonia Combi", "SAVC"],
  "Scandia Combi": ["Scandia Combi", "SCAC"],
  "Nimbus Combi": ["Nimbus Combi", "NIMC"],
};

/** Group Combi products by brand keywords, each group sorted by
 *  variantRank (plain/standard variant before its Black or Fiber-Coated
 *  counterpart). */
export function groupCombiProducts(products) {
  const groups = products.reduce((groups, product) => {
    let assigned = false;
    for (const [group, keywords] of Object.entries(COMBI_GROUP_KEYWORDS)) {
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
  for (const group of Object.keys(groups)) {
    groups[group].sort((a, b) => variantRank(a.name) - variantRank(b.name));
  }
  return groups;
}
