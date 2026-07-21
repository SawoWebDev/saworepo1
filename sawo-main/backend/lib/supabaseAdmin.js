// lib/supabaseAdmin.js
// Service-role Supabase client — bypasses RLS. Server-side only, never
// exposed to the client. Kept separate from the anon client in syncApi.js
// since it's a different privilege level.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Deliberately not process.exit(1) here (unlike syncApi.js): this file is
// imported by the long-running server, and the sync endpoints shouldn't go
// down just because the analytics key hasn't been set yet. Route handlers
// check for null and no-op instead.
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase service-role credentials — /api/track/* routes will no-op.");
  console.error("   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;
