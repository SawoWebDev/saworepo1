/**
 * scripts/prerender.js — post-build multi-page prerender orchestrator.
 *
 * CRA ships an empty <div id="root"> so on slow mobile nothing paints until
 * the JS bundle downloads and executes. This script renders each configured
 * page once in headless Chromium at build time and bakes the resulting
 * markup into its own static HTML file, so first paint needs no JS.
 *
 * Originally a single Home-only script; now a thin loop over
 * scripts/prerender/pages/*.js (auto-discovered — adding a new page never
 * requires editing this file), sharing one Chromium instance + one static
 * file server across all of them. All the actual snapshot post-processing
 * (CSS inlining, preload stripping, post-LCP loader injection, SEO head
 * baking, pathname guard) lives in scripts/prerender/lib.js, unchanged from
 * the original script's logic — see that file's header comment for why each
 * step exists, and homepage_prerender_invariants for the invariants Home's
 * page config (pages/home.js) must keep holding.
 *
 * Each page's output is written to build/<outFile> (build/index.html for
 * Home, build/<page>/index.html for everything else) with a matching
 * explicit rewrite added to public/_redirects. FAIL-OPEN, per page: a page whose
 * snapshot throws is seeded with the plain (non-prerendered) template
 * first, so a broken/flaky snapshot for one page can never 404 that route
 * OR block any other page's prerender OR break a deploy. Grep build logs
 * for "PRERENDERED:" to see how each page went.
 *
 * Browser: puppeteer-core + @sparticuz/chromium on Linux (Cloudflare Pages' build
 * container); local Chrome on Windows/macOS.
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const lib = require("./prerender/lib");

const PAGES_DIR = path.join(__dirname, "prerender", "pages");

function loadPages() {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith(".js"))
    .map((f) => require(path.join(PAGES_DIR, f)));
}

async function main() {
  let template;
  try {
    template = lib.readTemplate();
  } catch (err) {
    console.error("PRERENDERED: no (setup) —", err.message);
    return; // fail-open: leave build/ untouched, exit cleanly below
  }

  const pages = loadPages();

  // Seed every non-Home page with the plain template BEFORE attempting any
  // snapshot, so public/_redirects' explicit rewrite to that path never 404s
  // even if this run never gets to (or fails) that page's snapshot.
  for (const config of pages) {
    if (config.outFile !== "index.html") lib.seedFallback(template, config.outFile);
  }

  const server = await lib.serveBuild(template);
  try {
    const port = server.address().port;
    const { executablePath, args } = await lib.findChrome();
    const browser = await puppeteer.launch({
      executablePath,
      args: [...args, "--headless=new", "--no-sandbox", "--disable-gpu"],
    });

    try {
      for (const config of pages) {
        try {
          const page = await browser.newPage();
          try {
            await page.setViewport({ width: 1350, height: 940 });

            // Freeze all afterPageLoad()-deferred work (typewriter,
            // carousels, CMS refresh, scroll-triggered observers) so the
            // snapshot equals React's untouched initial render.
            await page.evaluateOnNewDocument(() => {
              window.requestIdleCallback = () => 1;
              window.cancelIdleCallback = () => {};
              window.IntersectionObserver = class {
                observe() {}
                unobserve() {}
                disconnect() {}
              };
            });

            // Determinism by default: no CMS/analytics network in the
            // snapshot environment. Pages whose real content depends on
            // live data (e.g. Steam's useLocalProducts()) opt out via
            // `blockNetwork: false` and wait for that data themselves.
            if (config.blockNetwork !== false) {
              await page.setRequestInterception(true);
              page.on("request", (req) => {
                const url = req.url();
                if (/raw\.githubusercontent\.com|supabase\.co|googleapis|gstatic|cdnjs/.test(url)) req.abort();
                else req.continue();
              });
            }

            await page.goto(`http://127.0.0.1:${port}${config.path}`, { waitUntil: "load", timeout: 60000 });
            await config.waitFor(page);
            const captured = await config.capture(page);
            config.sanityCheck(captured);

            const opts = { template, rootHtml: captured.rootHtml, head: captured.head, pagePath: config.path, outFile: config.outFile };
            if (config.loaderImgSelector) opts.loaderImgSelector = config.loaderImgSelector;
            if (config.preloadStripPattern) opts.preloadStripPattern = config.preloadStripPattern;
            const { bytes, cssInlined } = lib.buildOutputHtml(opts);

            console.log(`PRERENDERED ${config.path}: yes (root ${bytes} bytes, css inlined: ${cssInlined})`);
          } finally {
            await page.close();
          }
        } catch (err) {
          // Per-page fail-open: outFile already holds either a previous
          // good snapshot or the plain-template fallback seeded above.
          console.error(`PRERENDERED ${config.path}: no —`, err.message);
        }
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("PRERENDERED: no (fatal) —", err.message);
  process.exit(0); // fail-open: ship whatever build/ already has
});
