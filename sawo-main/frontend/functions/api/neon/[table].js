// functions/api/neon/[table].js
// GET /api/neon/products | categories | tags | sauna-rooms
// Read proxy for the CMS's "Data Source: Neon" test toggle (see
// local-storage/dataSource.js) — Neon has no PostgREST layer, so the
// browser can't query it directly the way it queries Supabase.
import { getNeonSql, listTable } from "../../_lib/neonDb.js";

const ROUTE_TO_TABLE = { products: "products", categories: "categories", tags: "tags", "sauna-rooms": "sauna_rooms" };

export async function onRequestGet({ params, env }) {
  const table = ROUTE_TO_TABLE[params.table];
  if (!table) return Response.json({ error: "Unknown resource" }, { status: 404 });

  const sql = getNeonSql(env);
  if (!sql) return Response.json({ error: "Neon not configured" }, { status: 503 });

  try {
    const rows = await listTable(sql, table);
    return Response.json({ data: rows });
  } catch (err) {
    console.error(`neon/${params.table} read failed:`, err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
