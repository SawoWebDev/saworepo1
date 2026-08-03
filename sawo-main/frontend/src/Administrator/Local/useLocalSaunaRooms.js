import { useState, useEffect } from "react";
import { getDataSource } from "../../local-storage/dataSource";
import { getAllSaunaRoomsLive } from "../../local-storage/supabaseReader";
import { getCache, setCache } from "../adminCache";

// Public pages only (the admin CMS's own sauna rooms page reads Supabase
// directly for editorial freshness) — session-cache-and-skip rather than
// revalidate-in-background, so a repeat visit reuses the cached list with
// zero requests instead of refetching every time. Cleared by any real page
// reload (including Ctrl+Shift+R), since it lives only in JS memory.
const LOCAL_ROOMS_CACHE_KEY = "public:sauna-rooms:data";

export function useLocalSaunaRooms() {
  const cached = getCache(LOCAL_ROOMS_CACHE_KEY);
  const [rooms, setRooms] = useState(() => cached || []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (getCache(LOCAL_ROOMS_CACHE_KEY)) return;

    const load = async () => {
      try {
        setLoading(true);
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
        setCache(LOCAL_ROOMS_CACHE_KEY, freshRooms);
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
