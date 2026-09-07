// infraredClassification.js
//
// Every Infrared product carries the single CMS category "Infrared", so
// Panels and Controls can only be told apart by a hand-maintained slug
// allowlist (re-categorising in the CMS as "Infrared Panels"/"Infrared
// Controls" would let this become data-driven — worth doing if this range
// grows, but that's a content change, not a code one). Defined here (not in
// InfraredPanels.jsx/InfraredControls.jsx) so this module and the getter
// below can import both lists without a circular dependency between the two
// page files.
export const PANEL_SLUGS = ["infrared-panels", "infrared-backrest", "interface-holder"];

export const CONTROL_SLUGS = [
  "infrared-2-0-user-interface",
  "infrared-2-0-power-controller",
  "infrared-2-0-built-in-control",
];

const KNOWN_SLUGS = new Set([...PANEL_SLUGS, ...CONTROL_SLUGS]);

// Safety net: without this, a new Infrared product added in the CMS falls
// into neither allowlist above and silently disappears from every Infrared
// view (standalone Panels/Controls pages and /products' Infrared tab) until
// a developer notices and edits both lists by hand. This doesn't fix the
// root cause (that needs the CMS taxonomy change mentioned above) but stops
// products from vanishing: anything tagged "Infrared" but missing from both
// allowlists still shows up (appended to Panels, since there's no signal to
// place it more precisely) and logs a console warning so it gets a real
// slug added to the right list.
export function getUnclassifiedInfraredProducts(publiclyVisibleProducts) {
  const unclassified = publiclyVisibleProducts.filter(
    (p) => (p.categories || []).some((c) => c.toLowerCase() === "infrared") && !KNOWN_SLUGS.has(p.slug)
  );
  if (unclassified.length) {
    console.warn(
      "[Infrared] Product(s) tagged \"Infrared\" but missing from PANEL_SLUGS/CONTROL_SLUGS " +
      "(infraredClassification.js) — showing under Panels as a fallback:",
      unclassified.map((p) => p.slug)
    );
  }
  return unclassified;
}
