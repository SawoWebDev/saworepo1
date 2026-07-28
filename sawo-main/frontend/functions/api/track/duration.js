// functions/api/track/duration.js
// Cloudflare Pages Function — ported from backend/trackingApi.js's
// handleDuration. Same project as the site, no separate deployment.
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

export async function onRequestPost({ request, env }) {
  const supabaseAdmin = getSupabaseAdmin(env);
  if (!supabaseAdmin) {
    return new Response(null, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const { id, time_on_page } = body || {};
  if (!id || typeof time_on_page !== "number") {
    return Response.json({ error: "Missing id or time_on_page" }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from("analytics_page_views")
      .update({ time_on_page })
      .eq("id", id);

    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("track/duration update failed:", err.message);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
