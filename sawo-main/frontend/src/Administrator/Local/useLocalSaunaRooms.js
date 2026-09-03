import { useState, useEffect } from "react";
import { getAllSaunaRoomsLive } from "../../local-storage/supabaseReader";
import { readPublicCache, writePublicCache } from "./publicDataCache";

// Public pages only (the admin CMS's own sauna rooms page reads Supabase
// directly for editorial freshness). A repeat visit within CACHE_TTL_MS
// paints the cached list instantly with zero requests — persisted to
// localStorage (see publicDataCache.js), so this now actually survives a
// full page reload or a new tab, not just same-session SPA navigation;
// past CACHE_TTL_MS it still paints instantly from cache but quietly
// refetches in the background, so a CMS edit eventually reaches a tab
// that's been left open. To see an edit immediately, hard-reload
// (Ctrl+Shift+R): that clears the in-memory cache, but the localStorage
// copy is still read on the next load unless it too has aged past
// CACHE_TTL_MS.
export const LOCAL_ROOMS_CACHE_KEY = "public:sauna-rooms:data";
export const LOCAL_ROOMS_STORAGE_KEY = "sawo_public_sauna_rooms_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export function useLocalSaunaRooms() {
  const cached = readPublicCache(LOCAL_ROOMS_CACHE_KEY, LOCAL_ROOMS_STORAGE_KEY);
  const [rooms, setRooms] = useState(() => cached?.data || []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = readPublicCache(LOCAL_ROOMS_CACHE_KEY, LOCAL_ROOMS_STORAGE_KEY);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) return;

    const load = async () => {
      try {
        if (!cached) setLoading(true);
        const freshRooms = await getAllSaunaRoomsLive();
        setRooms(freshRooms);
        writePublicCache(LOCAL_ROOMS_CACHE_KEY, LOCAL_ROOMS_STORAGE_KEY, { data: freshRooms, time: Date.now() });
      } catch (err) {
        setError(err.message);
        console.error("Failed to load sauna rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { rooms, loading, error };
}
