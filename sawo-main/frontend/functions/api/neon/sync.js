// functions/api/neon/sync.js
// POST /api/neon/sync — called by Supabase's neon_sync_notify pg_net
// trigger (see docs/NEON_BACKUP_PLAN.md) on every INSERT/UPDATE/DELETE to
// products/categories/tags/sauna_rooms. This is what keeps Neon tracking
// Supabase automatically, regardless of which code path in the CMS (CSV
// import, bulk actions, a script) made the write — the trigger fires at
// the database level, not the application level.
//
// Optional shared-secret check: if NEON_SYNC_API_KEY is set as a Pages
// secret, the Supabase trigger must send a matching x-api-key header (set
// the same value in the trigger's net.http_post headers). Left open when
// unset, matching this project's existing unauthenticated-until-configured
// posture for its other server-only write endpoints.
import { getNeonSql, upsertRow, deleteRow } from "../../_lib/neonDb.js";

export async function onRequestPost({ request, env }) {
  if (env.NEON_SYNC_API_KEY && request.headers.get("x-api-key") !== env.NEON_SYNC_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getNeonSql(env);
  if (!sql) return Response.json({ error: "Neon not configured" }, { status: 503 });

  try {
    const { table, op, row } = await request.json();
    if (!table || !op || !row) throw new Error("Missing required fields: table, op, row");

    if (op === "DELETE") {
      await deleteRow(sql, table, row.id);
    } else {
      await upsertRow(sql, table, row);
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("neon/sync failed:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
