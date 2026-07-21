// trackingApi.js
// Server-side first-party analytics endpoints. Receives what track.js used
// to POST/PATCH straight to Supabase's REST API; now the browser only ever
// talks to this server, which holds the service-role key.
import fetch from "node-fetch";
import { isBot } from "./lib/botPatterns.js";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";

// In-memory geo cache: IP -> { country, city, expiresAt }. ipapi.co's free
// tier is capped at 1,000 requests/day — caching repeat visitors for a few
// hours keeps a single busy session from burning separate quota per
// pageview. If the daily cap is hit anyway, the ipapi.co call below fails,
// is swallowed by the try/catch, and country/city just go null again for
// new IPs until the next UTC day — an accepted degradation, not a bug.
const GEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const geoCache = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip;
}

async function lookupGeo(ip) {
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return { country: cached.country, city: cached.city };
  }

  let country = null;
  let city = null;
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        country = data.country_name || null;
        city = data.city || null;
      }
    }
  } catch {
    // offline / rate-limited / malformed IP — leave country/city null
  }

  geoCache.set(ip, { country, city, expiresAt: Date.now() + GEO_CACHE_TTL_MS });
  return { country, city };
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

  const { session_id, page_path, device_type, browser } = req.body || {};
  if (!session_id || !page_path) {
    return res.status(400).json({ error: "Missing session_id or page_path" });
  }

  const ip = getClientIp(req);
  const { country, city } = await lookupGeo(ip);

  try {
    const { data, error } = await supabaseAdmin
      .from("analytics_page_views")
      .insert({ session_id, page_path, device_type, browser, country, city })
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
