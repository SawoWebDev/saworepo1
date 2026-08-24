// publicDataCache.js
// localStorage-backed persistence layered on top of adminCache.js's
// in-memory Map, for the two hooks (useLocalProducts, useLocalSaunaRooms)
// that serve PUBLIC pages. Deliberately not added to adminCache.js itself
// — its other ~13 admin-only consumers (Analytics, Inbox, Logs, ...) are
// appropriately memory-only: their data can be sensitive (contact
// submissions, activity logs) or go misleadingly stale across sessions for
// an admin, neither of which applies to the public product/room catalog
// this backs.
//
// Without this, the 24h TTL these two hooks already implement only ever
// helped same-session SPA navigation — adminCache.js's Map is a fresh,
// empty module instance on every full page load/new tab, so a repeat
// visitor days (or even minutes) later was still hitting Supabase/Neon
// live every time, despite the "24h cache" framing in their own comments.
import { getCache, setCache } from "../adminCache";

export function readPublicCache(memoryKey, storageKey) {
  const mem = getCache(memoryKey);
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed && parsed.data !== undefined && typeof parsed.time === "number" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function writePublicCache(memoryKey, storageKey, entry) {
  setCache(memoryKey, entry);
  try {
    localStorage.setItem(storageKey, JSON.stringify(entry));
  } catch {
    // Quota exceeded or unavailable (private browsing) — the in-memory
    // cache above still works for the rest of this tab's session.
  }
}
