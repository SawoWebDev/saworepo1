const lib = require("../lib");

// Steam hub ("/zh/steam") page config — same shape as pages/steam.js,
// snapshotting the Simplified Chinese locale. Steam.jsx is NOT static:
// useLocalProducts() fetches from Supabase, and the page renders
// "正在加载发生器...", "正在加载控制器...", "正在加载配件..." (steam.json's
// hub.*Section.loading keys) until that resolves — same reasoning as
// pages/steam.js, so this opts out of blockNetwork and waits for real data
// instead. Locale is resolved client-side via LocaleContext (see
// home-zh.js's comment). The Chinese catalog is now a lazy chunk (i18n.js's
// loadLocale()) though: the absence check below ("no more Chinese loading
// placeholder text") would pass trivially on the still-English fallback
// render too, since the English placeholder never matches those Chinese
// strings either — so it's not actually proof the zh chunk has loaded. The
// added positive check for "蒸汽" (same marker sanityCheck trusts) closes
// that gap.
module.exports = {
  path: "/zh/steam",
  outFile: "zh/steam/index.html",
  blockNetwork: false,

  async waitFor(page) {
    await page.waitForFunction(
      () => document.getElementById("root")?.innerHTML.includes("蒸汽")
        && !document.body.textContent.includes("正在加载发生器...")
        && !document.body.textContent.includes("正在加载控制器...")
        && !document.body.textContent.includes("正在加载配件..."),
      { timeout: 30000 }
    );
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("蒸汽")) throw new Error("Chinese hero heading missing from snapshot");
    if (/正在加载发生器\.\.\.|正在加载控制器\.\.\.|正在加载配件\.\.\./.test(captured.rootHtml)) {
      throw new Error("loading placeholder baked into snapshot — data never resolved");
    }
    if (captured.head.htmlLang !== "zh") throw new Error(`<html lang> is "${captured.head.htmlLang}", expected "zh"`);
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
