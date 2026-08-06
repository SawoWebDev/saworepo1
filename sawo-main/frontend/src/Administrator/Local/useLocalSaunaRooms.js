import { useState, useEffect } from "react";
import { getAllSaunaRoomsLive } from "../../local-storage/supabaseReader";
import { getCache, setCache } from "../adminCache";

// Public pages only (the admin CMS's own sauna rooms page reads Supabase
// directly for editorial freshness). A repeat visit within CACHE_TTL_MS
// paints the cached list instantly with zero requests; past that age it
// still paints instantly from cache but quietly refetches in the
// background, so a CMS edit eventually reaches a tab that's been left open.
// To see an edit immediately, hard-reload (Ctrl+Shift+R): that clears this
// in-memory cache outright and the next load always fetches fresh,
// regardless of TTL.
const LOCAL_ROOMS_CACHE_KEY = "public:sauna-rooms:data";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export function useLocalSaunaRooms() {
  const cached = getCache(LOCAL_ROOMS_CACHE_KEY);
  const [rooms, setRooms] = useState(() => cached?.data || []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = getCache(LOCAL_ROOMS_CACHE_KEY);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) return;

    const load = async () => {
      try {
        if (!cached) setLoading(true);
        const freshRooms = await getAllSaunaRoomsLive();
        setRooms(freshRooms);
        setCache(LOCAL_ROOMS_CACHE_KEY, { data: freshRooms, time: Date.now() });
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
