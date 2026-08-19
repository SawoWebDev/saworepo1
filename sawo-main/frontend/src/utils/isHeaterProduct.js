// Shared admission guard for every heater listing page (WallMounted, Floor,
// Combi, Dragonfire, ...). Keeps two concerns separate:
//
//   1. ADMISSION — does this product belong on a heaters page at all?
//      Decided ONLY by category, checked here.
//   2. GROUPING   — which brand sub-section (Nordex, Scandia, Heaterking...)
//      does it land in? Each page still does its own name/tag keyword
//      matching for this, but only AFTER admission has already passed.
//
// This exists because accessories often reference a heater model in their
// own name for compatibility (e.g. "Wooden Heater Guard (Heaterking
// Round)"), which used to be enough to get them admitted to the Dragonfire
// page via its name-keyword fallback. Gating admission on category alone —
// before any keyword matching runs — prevents that regardless of what tags
// or name text a future product shares with a heater family.

import { ACCESSORY_CATEGORIES } from "../pages/IndividualDisplay/DispAccessories";

// Category strings (case-insensitive) that genuinely mark a product as a heater.
const HEATER_CATEGORIES = [
  "wall-mounted", "wall mounted",
  "floor",
  "combi",
  "dragonfire",
  "towers", "tower",
  "stones", "stone",
];

function categoriesInclude(categories, list) {
  return (categories || []).some(c => list.includes(c.toLowerCase()));
}

/** True if `product` is an accessory, a heater guard/cover, or otherwise
 *  not a heater — regardless of what its name or tags happen to mention. */
export function isAccessoryLikeProduct(product) {
  const categories = product?.categories || [];
  if (categoriesInclude(categories, ACCESSORY_CATEGORIES)) return true;
  return categories.some(c => /accessor|guard/i.test(c));
}

/** True only if `product` is a genuine heater — has a real heater category
 *  AND isn't accessory-like. Use this as the FIRST filter on every heater
 *  listing page, before any brand/name keyword matching. */
export function isHeaterProduct(product) {
  if (!product) return false;
  if (product.type === "room") return false;
  if (isAccessoryLikeProduct(product)) return false;
  return categoriesInclude(product.categories, HEATER_CATEGORIES);
}
