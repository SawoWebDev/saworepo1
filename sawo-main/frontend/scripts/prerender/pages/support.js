const lib = require("../lib");

// Support.jsx is fully static (no data fetch). Its hero IS a real <img>
// (supportHeroImg, first img in the DOM), so the default loaderImgSelector
// ("#root img") lands on it correctly with no override needed.
module.exports = {
  path: "/support",
  outFile: "support/index.html",
  blockNetwork: true,

  async waitFor(page) {
    await page.waitForSelector("h1", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
  },

  capture: lib.standardCapture,

  sanityCheck(captured) {
    if (!captured.rootHtml.includes("SUPPORT CENTER")) throw new Error("hero heading missing from snapshot");
    if (captured.rootHtml.length < 3000) throw new Error(`snapshot suspiciously small (${captured.rootHtml.length} bytes)`);
  },
};
