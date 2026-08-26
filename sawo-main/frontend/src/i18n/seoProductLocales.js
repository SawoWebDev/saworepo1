/**
 * seoProductLocales.js
 *
 * Product-level counterpart to TRANSLATED_PATHS in translatedRoutes.js —
 * same reviewed-before-claiming-it philosophy, just keyed by product slug
 * instead of route path (a product's Supabase `product_translations` row
 * existing is not the same thing as "reviewed and safe to tell search
 * engines this is a distinct indexable page in that language" — asserting
 * hreflang/canonical for a locale that hasn't actually been checked is
 * worse for SEO than not claiming one, per SEO.jsx's own comment).
 *
 * Add a slug here only once its `product_translations` row for that locale
 * has actually been spot-checked (native speaker, or an explicit review
 * pass) — not merely "a row exists." Keeps the bar identical to how
 * TRANSLATED_PATHS gates page-level hreflang.
 */
export const PRODUCT_TRANSLATED_LOCALES = {
  // Steam Generators
  "ste-steam-generator": ["zh"],
  "stn-steam-generator": ["zh"],
  "stn-s-steam-generator": ["zh"],
  // Steam Controls
  "steam-2-0": ["zh"],
  "steam-stainless-touch-control": ["zh"],
  // Steam Accessories
  "aroma-pump": ["zh"],
  "demand-button": ["zh"],
  "installation-stand": ["zh"],
  "steam-door": ["zh"],
  "steam-head-cover": ["zh"],
  "venturi-pipe-l-shape": ["zh"],
  "venturi-pipe-straight": ["zh"],
  // Standalone "included item" product pages
  "rj12-cable": ["zh"],
  "autodrain": ["zh"],
  "steam-head": ["zh"],
  "aroma-fan-and-dimmer-functions": ["zh"],
  "electronics-compartment": ["zh"],
};

// Locales a given slug should assert hreflang/discoverability for — empty
// array (not undefined) when nothing's reviewed yet, so callers can always
// safely .map()/.length it without a null-check.
export function reviewedLocalesFor(slug) {
  return PRODUCT_TRANSLATED_LOCALES[slug] || [];
}
