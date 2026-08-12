// serpApiProvider.js
// First concrete SerpProvider implementation, using SerpApi's Google Search
// endpoint (https://serpapi.com/search.json). Confirm SerpApi's current
// pricing/free-tier terms before relying on numbers here — they change; see
// docs/🟢 SEO/SEO-KEYWORD-INTELLIGENCE-SPEC.md's own warning about this.
//
// The user's current SerpApi plan allows 200 searches/month; the CALLER
// (seo-serp-check.js) enforces a stricter 130/month cap as a safety margin
// — this file has no opinion on quota, it just makes one search per call.
import fetch from "node-fetch";

const SERPAPI_ENDPOINT = "https://serpapi.com/search.json";
const RESULTS_PER_SEARCH = 100; // SerpApi's max organic results per request — check the whole first page+ for the domain

export async function checkPositionViaSerpApi(keyword, domain) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error("Missing SERPAPI_API_KEY.");

  const params = new URLSearchParams({
    q: keyword,
    api_key: apiKey,
    num: String(RESULTS_PER_SEARCH),
    hl: "en",
    gl: "us",
    google_domain: "google.com",
  });

  const res = await fetch(`${SERPAPI_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SerpApi HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  if (json.error) throw new Error(`SerpApi error: ${json.error}`);

  const normalizedDomain = normalizeDomain(domain);
  const results = json.organic_results || [];
  const match = results.find((r) => {
    try {
      return normalizeDomain(new URL(r.link).hostname) === normalizedDomain;
    } catch {
      return false;
    }
  });

  return {
    position: match ? match.position : null,
    url: match ? match.link : null,
    checkedAt: new Date().toISOString(),
  };
}

function normalizeDomain(domain) {
  return (domain || "").toLowerCase().replace(/^www\./, "");
}
