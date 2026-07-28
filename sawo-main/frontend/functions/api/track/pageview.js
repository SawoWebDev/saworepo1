// functions/api/track/pageview.js
// Cloudflare Pages Function — ported from backend/trackingApi.js's
// handlePageView. Runs inside this same Pages project, so no separate
// backend deployment is needed for analytics.
//
// Geo lookup no longer calls an external provider (ipapi.co / ip-api.com):
// Cloudflare populates request.cf.country/region/city for every request that
// reaches a Worker/Pages Function, for free, with no rate limit — so the
// 24h-cache + two-provider-fallback dance in the old backend code doesn't
// need to exist here at all.
import { isBot } from "../../_lib/botPatterns.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

// Body fields come straight from the browser — cap length and normalize
// empties to null so junk/oversized values can't bloat the table.
function clean(v, max = 200) {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

export async function onRequestPost({ request, env }) {
  const userAgent = request.headers.get("user-agent");

  if (!userAgent) {
    return Response.json({ error: "Missing User-Agent header" }, { status: 400 });
  }

  if (isBot(userAgent)) {
    return new Response(null, { status: 204 });
  }

  const supabaseAdmin = getSupabaseAdmin(env);
  if (!supabaseAdmin) {
    return Response.json({ error: "Analytics not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    session_id, page_path, device_type, browser, os, screen_size,
    referrer, utm_source, utm_medium, utm_campaign,
  } = body || {};
  if (!session_id || !page_path) {
    return Response.json({ error: "Missing session_id or page_path" }, { status: 400 });
  }

  const { country = null, region = null, city = null } = request.cf || {};

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
    return Response.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("track/pageview insert failed:", err.message);
    return Response.json({ error: "Insert failed" }, { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
