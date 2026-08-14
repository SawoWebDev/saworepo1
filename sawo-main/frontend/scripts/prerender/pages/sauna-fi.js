const lib = require("../lib");

// Sauna ("/fi/sauna") page config — same shape as pages/sauna.js,
// snapshotting the Finnish locale. See sauna.js's comment for why
// loaderImgSelector isn't overridden (CSS background-image hero, no real
// <img> tag) and why the hero text is baked at opacity:0 in the pristine
// snapshot. Locale is resolved client-side via LocaleContext (see
// home-fi.js's comment) — no extra waitFor step needed.
module.exports = {
  path: "/fi/sauna",
  outFile: "fi/sauna/index.html",
  blockNetwork: true,

  async waitFor(page) {
    await page.waitForSelector("h1", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("SUOMALAINEN SAUNA")) throw new Error("Finnish hero heading missing from snapshot");
    if (captured.head.htmlLang !== "fi") throw new Error(`<html lang> is "${captured.head.htmlLang}", expected "fi"`);
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
