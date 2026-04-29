import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export function useLocalSaunaRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from("sauna_rooms")
          .select("*")
          .eq("is_deleted", false)
          .eq("status", "published")
          .order("sort_order", { ascending: true });

        if (err) throw err;

        const parsed = (data || []).map(room => {
          const r = { ...room };
          if (typeof r.configurations === "string") { try { r.configurations = JSON.parse(r.configurations); } catch { r.configurations = {}; } }
          if (typeof r.door_options   === "string") { try { r.door_options   = JSON.parse(r.door_options);   } catch { r.door_options   = []; } }
          if (typeof r.feature_tabs   === "string") { try { r.feature_tabs   = JSON.parse(r.feature_tabs);   } catch { r.feature_tabs   = []; } }
          if (typeof r.resources      === "string") { try { r.resources      = JSON.parse(r.resources);      } catch { r.resources      = []; } }
          if (typeof r.files          === "string") { try { r.files          = JSON.parse(r.files);          } catch { r.files          = []; } }
          if (typeof r.spec_table     === "string") { try { r.spec_table     = JSON.parse(r.spec_table);     } catch { r.spec_table     = null; } }
          return r;
        });

        setRooms(parsed);
      } catch (err) {
        setError(err.message);
        console.error("useLocalSaunaRooms:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { rooms, loading, error };
}
