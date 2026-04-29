import { useState, useEffect } from "react";

export function useLocalSaunaRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await import("./data/saunaroom-data.json");
        setRooms(res.default || []);
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
