/**
 * Home ("/zh") page config — same shape as pages/home.js, snapshotting the
 * Simplified Chinese locale instead of English. Locale is resolved entirely
 * client-side (see i18n/LocaleContext.js — synchronous from the URL, no
 * async i18n.changeLanguage race). BUT the Chinese catalog itself is now a
 * lazy webpack chunk (see i18n.js's loadLocale()) fetched after first paint,
 * not bundled eagerly — so waitFor explicitly waits for the real Chinese
 * text (same "体验" marker sanityCheck already trusts) rather than a flat
 * sleep, which would otherwise race the chunk fetch and could bake the
 * English fallback into this snapshot instead of failing loudly.
 */
module.exports = {
  path: "/zh",
  outFile: "zh/index.html",
  blockNetwork: true,
  loaderImgSelector: "#root section img",

  async waitFor(page) {
    await page.waitForSelector("section.sauna-unique img", { timeout: 30000 });
    await page.waitForFunction(
      () => document.getElementById("root")?.innerHTML.includes("体验"),
      { timeout: 30000 }
    );
    await new Promise((r) => setTimeout(r, 500));
  },

  async capture(page) {
    return page.evaluate(() => {
      // Last match, not first — see lib.js's standardCapture comment
      // (static default <meta description> in public/index.html vs
      // Helmet's own, appended not replaced).
      const attr = (selector, attribute) => {
        const matches = document.querySelectorAll(selector);
        const el = matches[matches.length - 1];
        return el ? el.getAttribute(attribute) : null;
      };
      return {
        rootHtml: document.getElementById("root").innerHTML,
        typewriterText: document.querySelector(".typewriter")?.textContent || "",
        head: {
          title: document.title || null,
          description: attr('meta[name="description"]', "content"),
          canonical: attr('link[rel="canonical"]', "href"),
          htmlLang: document.documentElement.lang || null,
          hreflangs: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((el) => ({
            hreflang: el.getAttribute("hreflang"),
            href: el.getAttribute("href"),
          })),
        },
      };
    });
  },

  sanityCheck(captured) {
    if (captured.typewriterText.trim() !== "") throw new Error("typewriter ran before capture — snapshot not pristine");
    if (!captured.rootHtml.includes("体验")) throw new Error("Chinese hero heading missing from snapshot");
    if (captured.head.htmlLang !== "zh") throw new Error(`<html lang> is "${captured.head.htmlLang}", expected "zh"`);
    if (captured.rootHtml.length < 10000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
