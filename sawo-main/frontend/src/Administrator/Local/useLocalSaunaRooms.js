import { useState, useEffect } from "react";

export function useLocalSaunaRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const githubOwner = process.env.REACT_APP_GITHUB_OWNER || "jmesrafael";
        const imagesRepo = process.env.REACT_APP_IMAGES_REPO || "saworepo2";
        const url = `https://raw.githubusercontent.com/${githubOwner}/${imagesRepo}/main/saunaroom-data.json`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        setRooms(data || []);
      } catch (err) {
        setError(err.message);
        console.error("Failed to load local sauna rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { rooms, loading, error };
}
