// trackingApi.js
// Server-side first-party analytics endpoints. Receives what track.js used
// to POST/PATCH straight to Supabase's REST API; now the browser only ever
// talks to this server, which holds the service-role key.
import fetch from "node-fetch";
import { isBot } from "./lib/botPatterns.js";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";

// In-memory geo cache: IP -> { country, city, expiresAt }. A visitor's IP
// almost never changes country mid-session, so 24h keeps quota usage down
// (ipapi.co's free tier is capped at 1,000 req/day) without staling data in
// any way that matters for a "which country did this pageview come from"
// metric. If both providers below fail (daily cap hit on both, or a genuinely
// unroutable/private IP), country/city just stay null and show as "Unknown"
// in the dashboard — an accepted degradation, not a bug, but now much rarer
// since a single ipapi.co outage/cap no longer means every visitor for the
// rest of the day goes unresolved.
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Localhost/dev + RFC1918 private ranges — never geolocatable, so skip the
// network round-trip (and don't burn provider quota) entirely for these.
const PRIVATE_IP_RE = /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

const geoCache = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip;
}

async function lookupGeoFromIpapiCo(ip) {
  const res = await fetch(`https://ipapi.co/${ip}/json/`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;
  return { country: data.country_name || null, region: data.region || null, city: data.city || null };
}

// Fallback provider — different vendor, different quota, so a rate limit or
// outage on ipapi.co doesn't take down geolocation entirely. No API key/HTTPS
// on the free tier, but this is a server-to-server call, so that's fine.
async function lookupGeoFromIpApiCom(ip) {
  const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== "success") return null;
  return { country: data.country || null, region: data.regionName || null, city: data.city || null };
}

async function lookupGeo(ip) {
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return { country: cached.country, region: cached.region, city: cached.city };
  }

  let result = null;
  if (!PRIVATE_IP_RE.test(ip)) {
    try {
      result = await lookupGeoFromIpapiCo(ip);
    } catch {
      // offline / rate-limited / malformed IP — try the fallback below
    }
    if (!result) {
      try {
        result = await lookupGeoFromIpApiCom(ip);
      } catch {
        // both providers down/rate-limited — country/region/city stay null
      }
    }
  }

  const { country = null, region = null, city = null } = result || {};
  geoCache.set(ip, { country, region, city, expiresAt: Date.now() + GEO_CACHE_TTL_MS });
  return { country, region, city };
}

// Body fields come straight from the browser — cap length and normalize
// empties to null so junk/oversized values can't bloat the table.
function clean(v, max = 200) {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

export async function handlePageView(req, res) {
  const userAgent = req.get("user-agent");

  if (!userAgent) {
    return res.status(400).json({ error: "Missing User-Agent header" });
  }

  if (isBot(userAgent)) {
    return res.status(204).end();
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Analytics not configured" });
  }

  const {
    session_id, page_path, device_type, browser, os, screen_size,
    referrer, utm_source, utm_medium, utm_campaign,
  } = req.body || {};
  if (!session_id || !page_path) {
    return res.status(400).json({ error: "Missing session_id or page_path" });
  }

  const ip = getClientIp(req);
  const { country, region, city } = await lookupGeo(ip);

  try {
    const { data, error } = await supabaseAdmin
      .from("analytics_page_views")
      .insert({
        session_id: clean(session_id),
        page_path: clean(page_path, 500),
        device_type: clean(device_type, 40),
        browser: clean(browser, 40),
        os: clean(os, 40),
        screen_size: clean(screen_size, 40),
        referrer: clean(referrer),
        utm_source: clean(utm_source),
        utm_medium: clean(utm_medium),
        utm_campaign: clean(utm_campaign),
        country, region, city,
      })
      .select("id")
      .single();

    if (error) throw error;
    return res.status(201).json({ id: data.id });
  } catch (err) {
    console.error("❌ track/pageview insert failed:", err.message);
    return res.status(500).json({ error: "Insert failed" });
  }
}

export async function handleDuration(req, res) {
  if (!supabaseAdmin) {
    return res.status(503).end();
  }

  const { id, time_on_page } = req.body || {};
  if (!id || typeof time_on_page !== "number") {
    return res.status(400).json({ error: "Missing id or time_on_page" });
  }

  try {
    const { error } = await supabaseAdmin
      .from("analytics_page_views")
      .update({ time_on_page })
      .eq("id", id);

    if (error) throw error;
    return res.status(204).end();
  } catch (err) {
    console.error("❌ track/duration update failed:", err.message);
    return res.status(500).json({ error: "Update failed" });
  }
}
