// robotsAndSitemap.js
// URL discovery + robots.txt compliance for the Phase 3 competitor crawler.
// Deliberately minimal: only the Disallow rules for our own User-Agent (and
// the wildcard "*" group) are honored, and only <loc> entries are pulled
// from sitemaps (including one level of sitemap-index nesting) — enough for
// polite discovery without pulling in a full robots-parser dependency.
import fetch from "node-fetch";

export const CRAWLER_USER_AGENT = "SAWOKeywordIntelBot/1.0 (+https://sawo.com; SEO content research, respects robots.txt)";

export async function fetchRobotsRules(origin) {
  try {
    const res = await fetch(new URL("/robots.txt", origin).toString(), { headers: { "User-Agent": CRAWLER_USER_AGENT } });
    if (!res.ok) return { disallow: [], sitemaps: [] };
    return parseRobotsTxt(await res.text());
  } catch {
    return { disallow: [], sitemaps: [] };
  }
}

export function parseRobotsTxt(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const disallow = [];
  const sitemaps = [];
  let inRelevantGroup = false;
  let sawAnyUserAgent = false;

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      sawAnyUserAgent = true;
      inRelevantGroup = value === "*" || value.toLowerCase() === "sawokeywordintelbot";
    } else if (key === "disallow" && inRelevantGroup && value) {
      disallow.push(value);
    } else if (key === "sitemap" && value) {
      sitemaps.push(value);
    }
  }

  // No groups at all → nothing disallowed for anyone.
  if (!sawAnyUserAgent) return { disallow: [], sitemaps };
  return { disallow, sitemaps };
}

export function isDisallowed(pathname, disallowRules) {
  return disallowRules.some((rule) => pathname.startsWith(rule));
}

/** Pulls <loc> URLs from a sitemap, following one level of sitemap-index nesting. */
export async function discoverUrlsFromSitemaps(sitemapUrls, maxUrls) {
  const urls = new Set();

  for (const sitemapUrl of sitemapUrls) {
    if (urls.size >= maxUrls) break;
    try {
      const res = await fetch(sitemapUrl, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
      if (!res.ok) continue;
      const xml = await res.text();
      const locs = Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)).map((m) => m[1]);

      const nestedSitemaps = locs.filter((u) => /sitemap.*\.xml$/i.test(u));
      const pageUrls = locs.filter((u) => !/sitemap.*\.xml$/i.test(u));
      pageUrls.forEach((u) => urls.size < maxUrls && urls.add(u));

      if (nestedSitemaps.length) {
        const nested = await discoverUrlsFromSitemaps(nestedSitemaps, maxUrls - urls.size);
        nested.forEach((u) => urls.size < maxUrls && urls.add(u));
      }
    } catch {
      // Unreachable/malformed sitemap — skip, fall back to BFS if nothing was found at all.
    }
  }

  return Array.from(urls);
}
