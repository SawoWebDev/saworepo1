import { useState, useEffect } from "react";
import { getDataSource } from "../../local-storage/dataSource";
import { getAllSaunaRoomsLive } from "../../local-storage/supabaseReader";
import { getCache, setCache } from "../adminCache";

// Public pages only (the admin CMS's own sauna rooms page reads Supabase
// directly for editorial freshness). A repeat visit within CACHE_TTL_MS
// paints the cached list instantly with zero requests; past that age it
// still paints instantly from cache but quietly refetches in the
// background, so a CMS edit reaches visitors who already have a tab open
// within a bounded delay instead of only on their next hard reload. The
// cache lives only in this JS module's memory, so any real page reload
// (including Ctrl+Shift+R) clears it and the next visit fetches fresh again.
const LOCAL_ROOMS_CACHE_KEY = "public:sauna-rooms:data";
const CACHE_TTL_MS = 5 * 60 * 1000;

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
        const source = await getDataSource();

        let freshRooms;
        if (source === "supabase") {
          freshRooms = await getAllSaunaRoomsLive();
        } else {
          const githubOwner = process.env.REACT_APP_GITHUB_OWNER || "jmesrafael";
          const imagesRepo = process.env.REACT_APP_IMAGES_REPO || "saworepo2";
          const url = `https://raw.githubusercontent.com/${githubOwner}/${imagesRepo}/main/saunaroom-data.json`;

          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
          freshRooms = (await res.json()) || [];
        }
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
