const lib = require("../lib");

// Contact.jsx has no data fetch and doesn't use the useHeroLoaded hook at
// all — content is visible immediately, no opacity-gating to worry about.
// No <h1> anywhere in this file; the closest thing to a hero heading is
// <h2 className="ct-form-section-title">Any Questions?</h2> (Contact.jsx:1025).
// useSearchParams() (Contact.jsx:132, 156-174) reads a ?subject=... query
// param to pre-fill the form and jump to step 2 (plus a toast if
// ?addon_saved=1 is also present) — this only triggers with query params
// attached, so navigating to the bare "/contact" naturally captures the
// pristine step-1 state, exactly what we want.
module.exports = {
  path: "/contact",
  outFile: "contact/index.html",
  blockNetwork: true,

  async waitFor(page) {
    await page.waitForSelector(".ct-form-section-title", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("Any Questions?")) throw new Error("hero heading missing from snapshot");
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
