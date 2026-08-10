const lib = require("../lib");

// Careers.jsx is fully static (hardcoded job list + images, no data fetch).
// Its hero is a CSS background-image div, not an <img>, so there's no real
// hero element for the post-LCP loader to gate on — the default loaderImgSelector
// ("#root img") will match the first real <img> further down the page
// (the "Join SAWO Team" photo); if that's absent for any reason the loader's
// own no-match fallback fires on the next frame instead, so this degrades
// safely either way.
module.exports = {
  path: "/careers",
  outFile: "careers/index.html",
  blockNetwork: true,

  async waitFor(page) {
    await page.waitForSelector("h1", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("Join the SAWO Team")) throw new Error("hero heading missing from snapshot");
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
