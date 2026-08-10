const lib = require("../lib");

// Sauna.jsx is fully static (hardcoded heater/accessory arrays, no data
// fetch). Hero is a CSS background-image div (useHeroLoaded hook, no real
// <img> tag) — default loaderImgSelector falls through to the first real
// <img> further down the page, or the loader's own no-match fallback.
// Note: unlike Careers/Infrared, Sauna's hero <h1>/<p> are themselves inside
// the SAME opacity-gated wrapper as the background photo (heroLoaded ? 1 :
// 0), not just the photo — so the pristine (heroLoaded=false) snapshot this
// captures bakes the hero text at opacity:0 too. That's the correct
// "equal React's initial render" capture; it just means Sauna's hero text
// won't be visibly painted until main.js runs and the image loads, unlike
// the other static pages. Not something to fix here (would mean editing
// Sauna.jsx's own markup, out of scope for prerender config).
// The "sauna-card-unique" benefit-card hover/tap wiring (Sauna.jsx:37-94) is
// interaction-only JS, not an on-mount animation, so it's inert at snapshot
// time regardless.
module.exports = {
  path: "/sauna",
  outFile: "sauna/index.html",
  blockNetwork: true,

  async waitFor(page) {
    await page.waitForSelector("h1", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("FINNISH SAUNA")) throw new Error("hero heading missing from snapshot");
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
