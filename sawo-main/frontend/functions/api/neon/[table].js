// functions/api/neon/[table].js
// GET /api/neon/products | categories | tags | sauna-rooms
// Read proxy for the CMS's "Data Source: Neon" test toggle (see
// local-storage/dataSource.js) and the automatic fallback in
// supabaseReader.js — Neon has no PostgREST layer, so the browser can't
// query it directly the way it queries Supabase.
//
// Edge-cached at Cloudflare's Cache API for 60s: without this, a burst of
// concurrent first-time visitors (no per-browser cache yet — see
// useLocalProducts.js's 24h cache, which only helps repeat visits) would
// each trigger a live Neon query, eating into the free plan's 100
// CU-hour/month compute cap. One cache miss per POP per 60s now serves
// everyone hitting that edge location in that window instead. Tradeoff:
// up to 60s of staleness after a write — acceptable here since this is a
// fallback/test path, not the primary read path, and the underlying data
// itself already lags Supabase by ~1s via the sync trigger.
import { getNeonSql, listTable } from "../../_lib/neonDb.js";

const ROUTE_TO_TABLE = { products: "products", categories: "categories", tags: "tags", "sauna-rooms": "sauna_rooms" };
const CACHE_TTL_SECONDS = 60;

export async function onRequestGet({ params, env, request, waitUntil }) {
  const table = ROUTE_TO_TABLE[params.table];
  if (!table) return Response.json({ error: "Unknown resource" }, { status: 404 });

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const sql = getNeonSql(env);
  if (!sql) return Response.json({ error: "Neon not configured" }, { status: 503 });

  try {
    const rows = await listTable(sql, table);
    const response = Response.json(
      { data: rows },
      { headers: { "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}` } }
    );
    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error(`neon/${params.table} read failed:`, err.message);
    // Errors are never cached — a transient Neon failure shouldn't be
    // pinned at the edge for 60s once it recovers.
    return Response.json({ error: err.message }, { status: 500 });
  }
}
