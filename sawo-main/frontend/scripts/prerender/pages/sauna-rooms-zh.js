const lib = require("../lib");

// Sauna Rooms ("/zh/sauna/rooms") page config. SaunaRooms.jsx and its
// subcomponents (SaunaRoomViewer, SaunaFeatures, SaunaProductDetails,
// SaunaRoomDetails, Sauna3DTeaser, SaunaWoodMaterials, SaunaConfigurator,
// SaunaCallToAction) are all fully static — no Supabase/product fetch, same
// as pages/sauna.js — so this uses the default blockNetwork: true. Hero is a
// CSS background-image div (useHeroLoaded hook, no real <img> tag) — default
// loaderImgSelector falls through to the first real <img> further down the
// page, or the loader's own no-match fallback. Locale is resolved
// client-side via LocaleContext (see home-zh.js's comment) — but the
// Chinese catalog is a lazy chunk (i18n.js's loadLocale()), so waitFor
// explicitly waits for the real Chinese heading (same "桑拿房" marker
// sanityCheck already trusts) instead of a flat sleep, to not race the
// chunk fetch.
module.exports = {
  path: "/zh/sauna/rooms",
  outFile: "zh/sauna/rooms/index.html",
  blockNetwork: true,

  async waitFor(page) {
    await page.waitForSelector("h1", { timeout: 30000 });
    await page.waitForFunction(
      () => document.getElementById("root")?.innerHTML.includes("桑拿房"),
      { timeout: 30000 }
    );
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("桑拿房")) throw new Error("Chinese hero heading missing from snapshot");
    if (captured.head.htmlLang !== "zh") throw new Error(`<html lang> is "${captured.head.htmlLang}", expected "zh"`);
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
