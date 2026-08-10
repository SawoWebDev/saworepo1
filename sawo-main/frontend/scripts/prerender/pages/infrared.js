const lib = require("../lib");

// Infrared.jsx is fully static (hardcoded accessories/controls/benefits
// arrays, no data fetch). It has an always-running CSS @keyframes carousel
// (ir-scroll-carousel) on the health-benefits section — harmless to snapshot
// since CSS animations aren't reflected in the captured innerHTML/attributes,
// only real DOM/inline-style state is. Hero is a CSS background-image div
// (no <img>), same as Careers — default loaderImgSelector falls through to
// the first real <img> (the sauna-room photo) or the loader's own no-match
// fallback if that's ever absent.
module.exports = {
  path: "/infrared",
  outFile: "infrared/index.html",
  blockNetwork: true,

  async waitFor(page) {
    await page.waitForSelector("h1", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("INFRARED SAUNA")) throw new Error("hero heading missing from snapshot");
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
