// src/utils/productPower.js
//
// Computes a heater's displayed power rating from its per-wattage tags
// (e.g. "4.5 kW", "6.0 kW", "8.0 kW", "9.0 kW") instead of relying on a
// hand-entered combined range tag (e.g. "4.5 – 9.0kW"). The CMS only ever
// gets the combined tag added inconsistently — many otherwise-identical
// sibling products (e.g. "Nordex NB" vs "Nordex Black NB") never got one,
// so they silently showed no power badge at all. Deriving it from the
// individual tags, which every heater does have, means every product gets
// a badge, and the "9.0kW" vs "9.0 kW" spacing inconsistency in the
// hand-entered tags stops mattering since the output is always formatted
// the same way here.
export function getPowerRange(tags) {
  if (!tags?.length) return "";

  const values = tags
    .map((t) => {
      const m = /^(\d+(?:\.\d+)?)\s*kW$/i.exec(t.trim());
      return m ? parseFloat(m[1]) : null;
    })
    .filter((v) => v !== null);

  if (values.length > 0) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const fmt = (n) => n.toFixed(1);
    return min === max ? `${fmt(min)} kW` : `${fmt(min)} – ${fmt(max)} kW`;
  }

  // No individual "X kW" tags found — fall back to a hand-entered range
  // tag if there is one, normalized to always have a space before "kW".
  const rangeTag = tags.find((t) => /\d+(\.\d+)?\s*[-–]\s*\d+(\.\d+)?\s*kW/i.test(t));
  return rangeTag ? rangeTag.replace(/(\d)\s*kW/i, "$1 kW") : "";
}
