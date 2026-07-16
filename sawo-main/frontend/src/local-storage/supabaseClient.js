/**
 * supabaseClient.js
 * src/local-storage/supabaseClient.js
 *
 * Lazy access to the shared Supabase client for code that runs on PUBLIC
 * pages. A static `import { supabase } from "../Administrator/supabase"`
 * here would pull the entire @supabase/supabase-js SDK into the main bundle
 * for every visitor — even though the default (github) data path never
 * talks to Supabase. The dynamic import below moves the SDK into its own
 * async chunk that only downloads the first time something actually needs
 * it. Admin code can keep importing Administrator/supabase directly; all
 * admin pages are already lazy-loaded chunks.
 */

let clientPromise = null;

export function getSupabase() {
  if (!clientPromise) {
    clientPromise = import("../Administrator/supabase").then((m) => m.supabase);
  }
  return clientPromise;
}
