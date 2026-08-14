/**
 * scripts/prerender/lib.js — shared engine behind every page's prerender.
 *
 * Extracted from the original single-page (Home-only) scripts/prerender.js
 * so the same battle-tested post-processing (CSS inlining, preload
 * stripping, post-LCP loader injection, SEO head baking, pathname guard)
 * can run for N pages instead of one. The step-by-step logic here is
 * unchanged from the original script — only parameterized by page (path,
 * output file, loader image selector, preload-strip pattern). See
 * scripts/prerender/pages/home.js for the page that proves this is
 * byte-equivalent to the pre-refactor output.
 *
 * Every value that varies per page (rootHtml/head snapshot, own path, own
 * output location, which DOM selector the post-LCP loader waits on, which
 * preload tags to strip) is passed in by the orchestrator (scripts/
 * prerender.js) or a page config (scripts/prerender/pages/*.js) — this file
 * has no page-specific knowledge.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

const BUILD = path.join(__dirname, "..", "..", "build");
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

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Reads build/index.html and confirms it's the pristine CRA output (empty
// #root) — called once per orchestrator run, before any page is processed,
// since every page's output is derived from this same template.
function readTemplate() {
  const html = fs.readFileSync(INDEX, "utf8");
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('build/index.html has no empty <div id="root"></div> anchor (already prerendered?)');
  }
  return html;
}

// Seeds outFile with an unmodified copy of the plain (non-prerendered)
// template before a page's own snapshot is attempted, so a failed/skipped
// snapshot for a NEW route (one that has no previously-generated file to
// fall back to, unlike "/") still serves working client-side-rendered HTML
// instead of a 404 from public/_redirects explicit rewrite to that path.
function seedFallback(template, outFile) {
  const dest = path.join(BUILD, outFile);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, template);
}

/**
 * Turns a page's captured snapshot into final static HTML and writes it to
 * BUILD/<outFile>. Mirrors the original script's post-processing exactly,
 * parameterized by:
 *   - template: pristine build/index.html contents (same string for every page)
 *   - rootHtml / head: this page's captured snapshot (see pages/home.js for shape)
 *   - pagePath: the route this file is for (drives the pathname guard)
 *   - outFile: path relative to BUILD to write to ("index.html" for Home)
 *   - loaderImgSelector: DOM selector the post-LCP loader waits on before
 *     firing main.js + swapping the print-media stylesheets to all. Default
 *     "#root img" — if no element matches, the loader's own fallback path
 *     fires immediately via double-rAF (see the inline loader script below),
 *     so pages with no real hero <img> (a CSS background-image hero, e.g.)
 *     degrade gracefully to "fire on next frame" rather than hanging.
 *   - preloadStripPattern: regex matching <link rel=preload as=image> hrefs
 *     to remove — defaults to Home's own hero sizes, which are irrelevant
 *     dead weight on every other page (they're baked into the shared CRA
 *     template regardless of route).
 */
function buildOutputHtml({
  template,
  rootHtml,
  head,
  pagePath,
  outFile,
  loaderImgSelector = "#root img",
  preloadStripPattern = /<link rel="preload" as="image" href="\/(?:640|1024|1920)\.webp"[^>]*\/?>/g,
}) {
  let out = template.replace(
    '<div id="root"></div>',
    `<div id="root">${rootHtml}</div>` +
      // The SPA rewrite in public/_redirects now points each configured path at
      // its OWN outFile, so this guard is defense-in-depth (misconfigured
      // rewrite, stale cache) rather than the only thing protecting other
      // routes, as it was when every route shared one build/index.html.
      `<script>if(location.pathname!==${JSON.stringify(pagePath)}){var r=document.getElementById("root");if(r)r.innerHTML="";}</script>`
  );

  // <html lang> — the template always ships "en"; a locale snapshot (e.g.
  // /fi, /de) needs its own real value baked in, not left at the default.
  if (head.htmlLang) {
    out = out.replace(/<html lang="[^"]*"/, `<html lang="${escapeHtml(head.htmlLang)}"`);
  }

  // Inline the main stylesheet: with markup in the HTML, this <link> is the
  // last render-blocking request — inlining removes one RTT before FCP.
  const cssMatch = out.match(/<link href="(\/static\/css\/main\.[^"]+\.css)" rel="stylesheet">/);
  if (cssMatch) {
    const css = fs.readFileSync(path.join(BUILD, cssMatch[1]), "utf8");
    out = out.replace(cssMatch[0], `<style>${css}</style>`);
  }

  // Bake the real <SEO> output into <head> so a non-JS crawler/link-preview
  // bot sees this page's actual title/description/canonical.
  if (head.title) {
    out = out.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(head.title)}</title>`);
  }
  if (head.description) {
    out = out.replace(
      /<meta name="description"[^>]*\/>/,
      `<meta name="description" content="${escapeHtml(head.description)}" />`
    );
  }
  if (head.canonical && !out.includes('rel="canonical"')) {
    out = out.replace("</head>", `<link rel="canonical" href="${escapeHtml(head.canonical)}" />\n</head>`);
  }

  // hreflang alternates (SEO.jsx's <SEO hreflangAlternates={...} /> prop) —
  // only emitted by pages/locales that genuinely have real translated copy
  // (see i18n/translatedRoutes.js's TRANSLATED_PATHS), so this stays empty
  // for everything else. React Helmet renders these into the live <head>,
  // but the static template's <head> otherwise only gets title/description/
  // canonical patched above — without this, a non-JS crawler reading the
  // prerendered file would see zero hreflang alternates regardless of what
  // the live SPA renders, exactly the "asserting a translated version that
  // isn't really there" bug in reverse (silently NOT asserting a real one).
  if (Array.isArray(head.hreflangs) && head.hreflangs.length) {
    const tags = head.hreflangs
      .map(({ hreflang, href }) => `<link rel="alternate" hrefLang="${escapeHtml(hreflang)}" href="${escapeHtml(href)}" />`)
      .join("\n");
    out = out.replace("</head>", `${tags}\n</head>`);
  }

  // Strip preload tags that don't apply to this page (see param doc above).
  out = out.replace(preloadStripPattern, "");

  const scriptMatch = out.match(/<script defer="defer" src="(\/static\/js\/main\.[^"]+\.js)"><\/script>/);
  if (!scriptMatch) throw new Error("main.js script tag not found for post-paint rewrite");

  // Strip the eager onload swap from the print-media stylesheets; the
  // loader below flips them at the same post-LCP moment.
  const swaps = out.match(/ onload='this\.media="all"'/g) || [];
  if (swaps.length !== 2) throw new Error(`expected 2 stylesheet onload swaps, found ${swaps.length}`);
  out = out.replace(/ onload='this\.media="all"'/g, "");

  // The loader must live at the END of <body>: CRA's script tag sits in
  // <head>, where #root doesn't exist yet.
  const loader =
    `<script>(function(){var d=false;` +
    `var l=function(){if(d)return;d=true;` +
    `document.querySelectorAll('link[media="print"]').forEach(function(x){x.media="all"});` +
    `var s=document.createElement("script");s.src="${scriptMatch[1]}";document.body.appendChild(s)};` +
    `var r2=function(){if(!("requestAnimationFrame"in window))return setTimeout(l,0);` +
    `requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(l,0)})})};` +
    `var i=document.querySelector(${JSON.stringify(loaderImgSelector)});` +
    `if(!i){r2()}else{setTimeout(l,4000);` +
    `if(i.complete&&i.naturalWidth>0){r2()}else{i.addEventListener("load",r2);i.addEventListener("error",r2)}}` +
    `})()</script>`;
  out = out.replace(scriptMatch[0], "");
  if (!out.includes("</body>")) throw new Error("no </body> to anchor the loader");
  out = out.replace("</body>", `${loader}</body>`);

  const dest = path.join(BUILD, outFile);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return { bytes: rootHtml.length, cssInlined: !!cssMatch };
}

// Shared capture shape for pages with no page-specific extra state to read
// (no typewriter/loading-flag/etc. to check) — just the baked markup + the
// <SEO> component's head tags. Most page configs can use this directly as
// their `capture(page)`; pages that need extra fields (Steam's loading
// state, Contact's initial-render guard) write their own page.evaluate
// instead, following the same {rootHtml, head} shape so buildOutputHtml
// keeps working unchanged.
async function standardCapture(page) {
  return page.evaluate(() => {
    const attr = (selector, attribute) => {
      const el = document.querySelector(selector);
      return el ? el.getAttribute(attribute) : null;
    };
    return {
      rootHtml: document.getElementById("root").innerHTML,
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
}

module.exports = {
  BUILD,
  INDEX,
  serveBuild,
  findChrome,
  escapeHtml,
  readTemplate,
  seedFallback,
  buildOutputHtml,
  standardCapture,
};
