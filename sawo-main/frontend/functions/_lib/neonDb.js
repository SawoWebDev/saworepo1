// functions/_lib/neonDb.js
// Read + upsert/delete helpers for the Neon Postgres mirror of Supabase's
// products/categories/tags/sauna_rooms tables — the CMS's "Data Source:
// Neon" test toggle reads through this, and the Supabase pg_net trigger
// (neon_sync_notify, see docs/NEON_BACKUP_PLAN.md) posts here to keep Neon
// in sync with every Supabase write.
//
// Uses @neondatabase/serverless (HTTP, not raw TCP) because Pages Functions
// run on the Workers runtime, same reason functions/_lib/supabaseAdmin.js
// uses a per-request `env` factory instead of a module-level client.
import { neon } from "@neondatabase/serverless";

const TABLE_DEFS = {
  products: {
    pk: "id",
    cols: [
      "id","name","slug","short_description","description","thumbnail","images","spec_images",
      "categories","tags","auto_tag_columns","features","brand","type","spec_table","resources",
      "status","visible","featured","sort_order","created_by","created_by_username","created_at",
      "updated_at","files","updated_by_username","is_deleted","capacity_liters","variant_type",
      "product_family","parent_product_id","variants","meta_title","meta_description","og_image",
      "publish_at","heating_element_groups","variations","included_items","deleted_at",
    ],
    jsonbCols: ["spec_table","resources","files","variants","heating_element_groups","variations","included_items"],
    listWhere: "is_deleted = false",
    listOrder: "created_at desc",
  },
  categories: {
    pk: "id",
    cols: ["id","name","slug","description","usage_count","created_at"],
    jsonbCols: [],
    listWhere: null,
    listOrder: "name asc",
  },
  tags: {
    pk: "id",
    cols: ["id","name","slug","usage_count","created_at"],
    jsonbCols: [],
    listWhere: null,
    listOrder: "name asc",
  },
  sauna_rooms: {
    pk: "id",
    cols: [
      "id","name","slug","short_description","description","thumbnail","sku","room_type","model_code",
      "size_category","width_m","depth_m","height_m","capacity_label","capacity_min","capacity_max",
      "wood_options","wood_options_enabled","configurations","door_options","side_order",
      "ir_panel_wattage_w","ir_total_power_w","ir_voltage_v","ir_session_time_min","features",
      "feature_tabs","spec_table","images","spec_images","resources","files","tags","categories",
      "status","visible","featured","is_best_seller","has_door_filter","sort_order","is_deleted",
      "created_by","created_by_username","updated_by_username","created_at","updated_at",
      "meta_title","meta_description","og_image","publish_at","deleted_at",
    ],
    jsonbCols: ["configurations","door_options","feature_tabs","spec_table","resources","files"],
    listWhere: "is_deleted = false",
    listOrder: "sort_order asc, created_at desc",
  },
};

export function getNeonSql(env) {
  if (!env.NEON_DB_URL) return null;
  return neon(env.NEON_DB_URL);
}

export async function listTable(sql, table) {
  const def = TABLE_DEFS[table];
  if (!def) throw new Error(`Unknown table: ${table}`);
  const where = def.listWhere ? `where ${def.listWhere}` : "";
  return sql.query(`select * from public.${table} ${where} order by ${def.listOrder}`);
}

function jsonbParam(v) {
  return v === null || v === undefined ? null : JSON.stringify(v);
}

export async function upsertRow(sql, table, row) {
  const def = TABLE_DEFS[table];
  if (!def) throw new Error(`Unknown table: ${table}`);

  const cols = def.cols.filter((c) => c in row);
  if (!cols.includes(def.pk)) throw new Error(`Row missing primary key '${def.pk}'`);

  const values = cols.map((c) => (def.jsonbCols.includes(c) ? jsonbParam(row[c]) : row[c]));
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const updateSet = cols.filter((c) => c !== def.pk).map((c) => `${c} = excluded.${c}`).join(", ");

  await sql.query(
    `insert into public.${table} (${cols.join(",")}) values (${placeholders.join(",")})
     on conflict (${def.pk}) do update set ${updateSet}`,
    values
  );
}

export async function deleteRow(sql, table, id) {
  const def = TABLE_DEFS[table];
  if (!def) throw new Error(`Unknown table: ${table}`);
  await sql.query(`delete from public.${table} where ${def.pk} = $1`, [id]);
}
