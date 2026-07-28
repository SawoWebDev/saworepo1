// functions/_lib/supabaseAdmin.js
// Service-role Supabase client — bypasses RLS. Server-side only (this file
// only ever runs inside a Pages Function), never exposed to the client.
//
// Pages Functions get secrets via the per-request `env` object, not
// process.env (there is no long-lived process to hold module-level state
// across requests the way backend/lib/supabaseAdmin.js could), so this is a
// factory instead of a module-level singleton.
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
