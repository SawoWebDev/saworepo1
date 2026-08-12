// contentExtraction.js
// Pulls title/h1-h3/meta description/image alt text/main body content out
// of a competitor page's raw HTML, stripping nav/header/footer/script/style
// boilerplate first — the JS-stack equivalent of what the spec suggests
// (e.g. Python's trafilatura). Uses `cheerio` (new dependency; no
// HTML-parsing library existed anywhere in this repo yet) rather than a
// heavier jsdom+Readability combo, since we only need targeted tag
// extraction plus a simple main-content heuristic, not full
// browser-fidelity DOM parsing.
import * as cheerio from "cheerio";

const BOILERPLATE_SELECTORS = "nav, header, footer, script, style, noscript, svg, form, aside";

export function extractPageContent(html) {
  const $ = cheerio.load(html);
  $(BOILERPLATE_SELECTORS).remove();

  const title = $("title").first().text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";
  const headings = $("h1, h2, h3")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const imageAlts = $("img[alt]")
    .map((_, el) => $(el).attr("alt")?.trim())
    .get()
    .filter(Boolean);

  // Prefer a <main>/[role=main]/common content-container element if present;
  // fall back to <body> minus the boilerplate already stripped above.
  const mainEl = $("main, [role='main'], #content, .content, article").first();
  const body = (mainEl.length ? mainEl : $("body")).text().replace(/\s+/g, " ").trim();

  return { title, metaDescription, headings, imageAlts, body };
}

export function discoverInternalLinks(html, pageUrl) {
  const $ = cheerio.load(html);
  const origin = new URL(pageUrl).origin;
  const links = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const resolved = new URL(href, pageUrl);
      resolved.hash = "";
      if (resolved.origin === origin) links.add(resolved.toString());
    } catch {
      // Malformed href — skip.
    }
  });

  return Array.from(links);
}
