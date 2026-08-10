const lib = require("../lib");

// Steam.jsx is NOT static: useLocalProducts() (Steam.jsx:51) fetches from
// Supabase, and the page renders "Loading generators...", "Loading
// controls...", "Loading accessories..." (Steam.jsx:129,173,217) until that
// resolves. The orchestrator's default `blockNetwork: true` (deterministic
// snapshot, no CMS network) would freeze this page on the loading state
// forever — actively worse than no prerender — so this page opts out and
// waits for real data instead. The baked snapshot reflects whatever's live
// in Supabase at build time, refreshed on every deploy (same tradeoff as
// any other build-time data snapshot).
//
// "No steam generators available yet." (Steam.jsx:131) is a legitimate
// state to snapshot if a category is genuinely empty — waitFor only asserts
// the LOADING text is gone, not that product cards exist, so an empty
// category doesn't make this flaky.
module.exports = {
  path: "/steam",
  outFile: "steam/index.html",
  blockNetwork: false,

  async waitFor(page) {
    await page.waitForFunction(
      () => !document.body.textContent.includes("Loading generators...")
        && !document.body.textContent.includes("Loading controls...")
        && !document.body.textContent.includes("Loading accessories..."),
      { timeout: 30000 }
    );
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("STEAM")) throw new Error("hero heading missing from snapshot");
    if (/Loading generators\.\.\.|Loading controls\.\.\.|Loading accessories\.\.\./.test(captured.rootHtml)) {
      throw new Error("loading placeholder baked into snapshot — data never resolved");
    }
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
