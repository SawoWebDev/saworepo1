/**
 * scripts/prerender.js — post-build homepage snapshot.
 *
 * CRA ships an empty <div id="root"> so on slow mobile nothing paints until
 * ~80KB-gzip of JS downloads and executes (mobile FCP was 3.6s / LCP 4.2s).
 * This script renders "/" once in headless Chromium at build time and bakes
 * the resulting markup into build/index.html, so first paint needs no JS.
 *
 * This is a paint accelerator only, NOT server-rendered markup — src/index.js
 * deliberately uses createRoot() (not hydrateRoot) against it, because the
 * snapshot is captured via element.innerHTML, which the browser re-serializes
 * through its own CSSOM (hex colors -> rgb(), attribute casing, shorthand
 * consolidation) in ways that don't match what React itself writes on a
 * fresh render. hydrateRoot reliably throws "Hydration failed" against text
 * that came from an innerHTML round-trip, for any element with an inline
 * style or a camelCased DOM prop (fetchPriority, etc.) — confirmed with a
 * dev-mode React build. createRoot just discards the snapshot and mounts
 * fresh once main.js runs (gated on the hero image's own load event, so this
 * happens after the snapshot has already delivered its FCP/LCP benefit).
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

    // Load the bundle AND activate the async font stylesheets only after the
    // hero image (the LCP element) has loaded and its frame committed.
    // Lighthouse's lantern simulation chains every request that starts before
    // the observed LCP timestamp into simulated LCP, so anything heavy that
    // begins earlier — the 84KB-gz bundle, or the ~300KB of FontAwesome +
    // Montserrat woff2s the print-media swap triggers — inflates PSI's LCP by
    // seconds even though the real paint never waited for them.
    // The gate is the img `load` event (+ double-rAF so the frame showing the
    // hero is committed first). NOT img.decode(): on a still-loading <picture>
    // Chromium rejects decode() immediately, which un-gated main.js in
    // production (started at 976ms vs LCP at 1773ms). 4s safety cap, and an
    // immediate start when the route guard emptied the root, so hydration can
    // never hang on a broken image.
    const scriptMatch = out.match(/<script defer="defer" src="(\/static\/js\/main\.[^"]+\.js)"><\/script>/);
    if (!scriptMatch) throw new Error("main.js script tag not found for post-paint rewrite");

    // Strip the eager onload swap from the print-media stylesheets; the
    // loader below flips them at the same post-LCP moment. (noscript
    // fallbacks in the template still cover JS-disabled visitors.)
    const swaps = out.match(/ onload='this\.media="all"'/g) || [];
    if (swaps.length !== 2) throw new Error(`expected 2 stylesheet onload swaps, found ${swaps.length}`);
    out = out.replace(/ onload='this\.media="all"'/g, "");

    // The loader must live at the END of <body>: CRA's script tag sits in
    // <head>, where #root doesn't exist yet — a querySelector there returns
    // null and the gate silently never engages (this exact bug shipped once:
    // main.js started before the hero request on slow 4G).
    const loader =
      `<script>(function(){var d=false;` +
      `var l=function(){if(d)return;d=true;` +
      `document.querySelectorAll('link[media="print"]').forEach(function(x){x.media="all"});` +
      `var s=document.createElement("script");s.src="${scriptMatch[1]}";document.body.appendChild(s)};` +
      `var r2=function(){if(!("requestAnimationFrame"in window))return setTimeout(l,0);` +
      `requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(l,0)})})};` +
      `var i=document.querySelector("#root section img");` +
      `if(!i){r2()}else{setTimeout(l,4000);` +
      `if(i.complete&&i.naturalWidth>0){r2()}else{i.addEventListener("load",r2);i.addEventListener("error",r2)}}` +
      `})()</script>`;
    out = out.replace(scriptMatch[0], "");
    if (!out.includes("</body>")) throw new Error("no </body> to anchor the loader");
    out = out.replace("</body>", `${loader}</body>`);

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
