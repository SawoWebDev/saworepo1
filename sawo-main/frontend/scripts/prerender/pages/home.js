/**
 * Home ("/") page config — migrated verbatim from the original single-page
 * scripts/prerender.js. Same selectors, same sanity checks, same loader
 * selector ("#root section img") and 4s cap. This must stay behaviorally
 * identical to the pre-refactor script; see homepage_prerender_invariants
 * for why each of these choices exists (typewriter-must-be-empty, hero
 * heading present, size floor, etc.) — do not loosen any of these checks
 * without re-reading that context.
 */
module.exports = {
  path: "/",
  outFile: "index.html",
  blockNetwork: true,
  loaderImgSelector: "#root section img",

  async waitFor(page) {
    await page.waitForSelector("section.sauna-unique img", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500)); // let React finish committing
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
        },
      };
    });
  },

  sanityCheck(captured) {
    if (captured.typewriterText.trim() !== "") throw new Error("typewriter ran before capture — snapshot not pristine");
    if (!captured.rootHtml.includes("Experience")) throw new Error("hero heading missing from snapshot");
    if (captured.rootHtml.length < 10000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
