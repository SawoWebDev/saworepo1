// About.jsx is fully static (no data fetch). It runs an IntersectionObserver
// on the ISO/Sauna-from-Finland certification badges to trigger a "gleam"
// sweep once they scroll into view; the orchestrator stubs
// IntersectionObserver to a no-op for every page (see prerender.js) so this
// can never fire mid-snapshot regardless of viewport/timing, matching the
// "capture must equal React's untouched initial render" discipline Home's
// requestIdleCallback stub already applies. Hero IS a real <img>
// (aboutusHero, first img in the DOM) so the default loaderImgSelector
// needs no override.
module.exports = {
  path: "/about",
  outFile: "about/index.html",
  blockNetwork: true,

  async waitFor(page) {
    await page.waitForSelector("h1", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
  },

  // Custom capture (not lib.standardCapture): also checks for a live
  // .gleam-active element via the DOM, not via a substring match on the
  // serialized HTML — the page's own <style> tag literally contains the
  // CSS text ".certification-item.gleam-active { ... }" as a selector, so
  // string-matching "gleam-active" against rootHtml is a false positive
  // (it matches the CSS source, not an actually-applied class).
  async capture(page) {
    return page.evaluate(() => {
      const attr = (selector, attribute) => {
        const el = document.querySelector(selector);
        return el ? el.getAttribute(attribute) : null;
      };
      return {
        rootHtml: document.getElementById("root").innerHTML,
        gleamFired: !!document.querySelector(".gleam-active"),
        head: {
          title: document.title || null,
          description: attr('meta[name="description"]', "content"),
          canonical: attr('link[rel="canonical"]', "href"),
        },
      };
    });
  },

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("We are SAWO")) throw new Error("hero heading missing from snapshot");
    if (captured.gleamFired) throw new Error("IntersectionObserver fired before capture — snapshot not pristine");
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
