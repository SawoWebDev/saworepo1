/**
 * Home ("/fi") page config — same shape as pages/home.js, snapshotting the
 * Finnish locale instead of English. Locale is resolved entirely client-side
 * (see i18n/LocaleContext.js — synchronous from the URL, no async
 * i18n.changeLanguage race), so no extra waitFor step is needed beyond
 * Home's own hero-image selector.
 */
module.exports = {
  path: "/fi",
  outFile: "fi/index.html",
  blockNetwork: true,
  loaderImgSelector: "#root section img",

  async waitFor(page) {
    await page.waitForSelector("section.sauna-unique img", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
  },

  async capture(page) {
    return page.evaluate(() => {
      const attr = (selector, attribute) => {
        const el = document.querySelector(selector);
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
    if (!captured.rootHtml.includes("Koe")) throw new Error("Finnish hero heading missing from snapshot");
    if (captured.head.htmlLang !== "fi") throw new Error(`<html lang> is "${captured.head.htmlLang}", expected "fi"`);
    if (captured.rootHtml.length < 10000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
