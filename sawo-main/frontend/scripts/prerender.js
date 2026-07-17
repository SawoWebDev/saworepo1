/**
 * scripts/prerender.js — post-build homepage snapshot.
 *
 * CRA ships an empty <div id="root"> so on slow mobile nothing paints until
 * ~80KB-gzip of JS downloads and executes (mobile FCP was 3.6s / LCP 4.2s).
 * This script renders "/" once in headless Chromium at build time and bakes
 * the resulting markup into build/index.html, so first paint needs no JS.
 * src/index.js hydrates when the root has children (hydrateRoot) and falls
 * back to normal client rendering otherwise.
 *
 * Only the homepage is prerendered. The SPA rewrite serves index.html for
 * every route, so a guard script empties #root on any other path — non-home
 * routes behave exactly as before.
 *
 * FAIL-OPEN: any error leaves build/index.html untouched and exits 0, so a
 * flaky prerender can never break a deploy. Grep build logs for
 * "PRERENDERED:" to see which way it went.
 *
 * Browser: puppeteer-core + @sparticuz/chromium on Linux (Vercel's build
 * container — no system-deps install needed); local Chrome on Windows/macOS.
 */

const fs = require("fs");
const http = require("http");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BUILD = path.join(__dirname, "..", "build");
const INDEX = path.join(BUILD, "index.html");

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webp": "image/webp", ".png": "image/png",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".map": "application/json",
};

function serveBuild() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      let file = path.join(BUILD, urlPath);
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = INDEX; // SPA fallback
      res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function findChrome() {
  if (process.env.CHROME_PATH) return { executablePath: process.env.CHROME_PATH, args: [] };
  if (process.platform === "linux") {
    // v149 ships transpiled ESM: require() returns { default: <api> }.
    const mod = require("@sparticuz/chromium");
    const chromium = mod.default || mod;
    return { executablePath: await chromium.executablePath(), args: chromium.args };
  }
  const candidates = process.platform === "darwin"
    ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
    : [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      ];
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error("No Chrome executable found; set CHROME_PATH");
  return { executablePath: found, args: [] };
}

async function main() {
  const html = fs.readFileSync(INDEX, "utf8");
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('build/index.html has no empty <div id="root"></div> anchor (already prerendered?)');
  }

  const server = await serveBuild();
  const port = server.address().port;
  const { executablePath, args } = await findChrome();
  const browser = await puppeteer.launch({
    executablePath,
    args: [...args, "--headless=new", "--no-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1350, height: 940 });

    // Freeze all afterPageLoad()-deferred work (typewriter, carousels, CMS
    // refresh): stub requestIdleCallback so callbacks never fire. The snapshot
    // must equal React's *initial* render or hydration would mismatch.
    await page.evaluateOnNewDocument(() => {
      window.requestIdleCallback = () => 1;
      window.cancelIdleCallback = () => {};
    });

    // Determinism: no CMS/analytics network in the snapshot environment.
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (/raw\.githubusercontent\.com|supabase\.co|googleapis|gstatic|cdnjs/.test(url)) req.abort();
      else req.continue();
    });

    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector("section.sauna-unique img", { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500)); // let React finish committing

    const { rootHtml, typewriterText } = await page.evaluate(() => ({
      rootHtml: document.getElementById("root").innerHTML,
      typewriterText: document.querySelector(".typewriter")?.textContent || "",
    }));

    // Sanity: snapshot must be the pristine initial render.
    if (typewriterText.trim() !== "") throw new Error("typewriter ran before capture — snapshot not pristine");
    if (!rootHtml.includes("Experience")) throw new Error("hero heading missing from snapshot");
    if (rootHtml.length < 10000) throw new Error(`snapshot suspiciously small (${rootHtml.length} bytes)`);

    let out = html.replace(
      '<div id="root"></div>',
      `<div id="root">${rootHtml}</div>` +
        // SPA rewrite serves this file for every path; only "/" may show the
        // homepage snapshot. Other routes get an empty root (exactly the old
        // behavior) and index.js then uses createRoot instead of hydrateRoot.
        '<script>if(location.pathname!=="/"){var r=document.getElementById("root");if(r)r.innerHTML="";}</script>'
    );

    // Inline the main stylesheet: with markup in the HTML, this <link> is the
    // last render-blocking request — inlining removes one RTT before FCP.
    const cssMatch = out.match(/<link href="(\/static\/css\/main\.[^"]+\.css)" rel="stylesheet">/);
    if (cssMatch) {
      const css = fs.readFileSync(path.join(BUILD, cssMatch[1]), "utf8");
      out = out.replace(cssMatch[0], `<style>${css}</style>`);
    }

    // Drop the hero <link rel=preload> tags from the prerendered page: the
    // <picture> markup is now in the HTML, so the preload scanner discovers
    // the correct source directly (with the img's fetchpriority=high). The
    // preloads' media queries are evaluated against the pre-emulation window
    // in Lighthouse/PSI, double-fetching a second hero variant (~77KB) into
    // the LCP window. public/index.html keeps them for the no-prerender path.
    out = out.replace(/<link rel="preload" as="image" href="\/(?:640|1024|1920)\.webp"[^>]*\/?>/g, "");

    // Load the bundle AFTER first paint instead of `defer`. The prerendered
    // page paints without JS, but a deferred script still executes at
    // parse-end — often *before* the first paint opportunity — which makes
    // Lighthouse's lantern simulation chain the whole bundle into LCP
    // (pessimistic graph = all nodes before the observed LCP timestamp).
    // rAF + setTimeout(0) queues the script right after the first frame is
    // committed, taking main.js out of the LCP dependency graph on every
    // device. Hydration starts one frame later — invisible to users.
    const scriptMatch = out.match(/<script defer="defer" src="(\/static\/js\/main\.[^"]+\.js)"><\/script>/);
    if (!scriptMatch) throw new Error("main.js script tag not found for post-paint rewrite");
    out = out.replace(
      scriptMatch[0],
      `<script>(function(){var l=function(){var s=document.createElement("script");s.src="${scriptMatch[1]}";document.body.appendChild(s)};` +
        `"requestAnimationFrame"in window?requestAnimationFrame(function(){setTimeout(l,0)}):setTimeout(l,0)})()</script>`
    );

    fs.writeFileSync(INDEX, out);
    console.log(`PRERENDERED: yes (root ${rootHtml.length} bytes, css inlined: ${!!cssMatch})`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("PRERENDERED: no —", err.message);
  process.exit(0); // fail-open: ship the normal CSR index.html
});
