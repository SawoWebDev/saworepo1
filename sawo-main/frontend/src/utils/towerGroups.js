// Shared brand-grouping/ordering logic for Tower-series heaters (SAWO30,
// Tower, Aries, Cubos, Heaterking, Phoenix, Fiberjungle families). Used by
// both the dedicated Tower heaters page (pages/Sauna/heaters/Tower.jsx)
// and the "Tower Series" section of the full heaters catalog
// (pages/HeatersCatalog.jsx) plus the admin Sauna Heaters view
// (Administrator/Products.jsx) so all three stay in sync — mirrors
// floorGroups.js/combiGroups.js's exact shape for the same reason those
// files exist. Admission (which products even belong on the Tower page at
// all) stays local to Tower.jsx, same as the other heater pages — only the
// second-tier brand grouping is shared here.

// Display order of the brand sections.
export const TOWER_FIXED_ORDER = ["SAWO30", "Tower", "Aries", "Cubos", "Heaterking", "Phoenix", "Fiberjungle"];

/** Which brand a Tower product's name identifies as. Checked as a fixed
 *  priority chain (not a keyword map) because "Fiberjungle NS" needs the
 *  " NS" suffix to avoid false-matching unrelated products, and unmatched
 *  names fall through to "Other" rather than the last checked brand. */
export function getTowerSeriesName(name = "") {
  const u = name.toUpperCase();
  if (u.includes("SAWO30"))         return "SAWO30";
  if (u.includes("ARIES"))          return "Aries";
  if (u.includes("CUBOS"))          return "Cubos";
  if (u.includes("HEATERKING"))     return "Heaterking";
  if (u.includes("PHOENIX"))        return "Phoenix";
  if (u.includes("FIBERJUNGLE NS")) return "Fiberjungle";
  if (u.includes("TOWER"))          return "Tower";
  return "Other";
}

/** Group Tower products by brand. No within-group sort — Tower.jsx has
 *  never variant-sorted these (unlike Combi/Wall-Mounted), so this stays
 *  faithful to that existing behavior rather than introducing a new order. */
export function groupTowerProducts(products) {
  return products.reduce((groups, product) => {
    const series = getTowerSeriesName(product.name);
    if (!groups[series]) groups[series] = [];
    groups[series].push(product);
    return groups;
  }, {});
}
