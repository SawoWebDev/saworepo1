import { useState, useEffect } from "react";
import { getDataSource } from "../../local-storage/dataSource";
import { getAllSaunaRoomsLive } from "../../local-storage/supabaseReader";
import { getCache, setCache } from "../adminCache";

const LOCAL_ROOMS_CACHE_KEY = "admin:sauna-rooms:local";

export function useLocalSaunaRooms() {
  const cached = getCache(LOCAL_ROOMS_CACHE_KEY);
  const [rooms, setRooms] = useState(() => cached || []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Already showing cached rooms — refresh quietly instead of
        // flashing the loading state.
        if (!getCache(LOCAL_ROOMS_CACHE_KEY)) setLoading(true);
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
