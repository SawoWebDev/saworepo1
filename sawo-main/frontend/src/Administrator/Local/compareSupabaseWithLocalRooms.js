import { supabase } from "../supabase";

async function fetchSupabaseRooms() {
  const { data, error } = await supabase
    .from("sauna_rooms")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function loadLocalRooms() {
  try {
    const res = await import("./data/saunaroom-data.json");
    return res.default || [];
  } catch {
    return [];
  }
}

function normalizeUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("supabase.co") || url.includes("storage/v1/object")) {
    return url.split("/").pop();
  }
  if (url.includes("raw.githubusercontent.com")) {
    return url.split("/").pop();
  }
  return url.split("/").pop();
}

function valueEqual(v1, v2) {
  if (v1 === v2) return true;
  if (v1 == null || v2 == null) return v1 === v2;
  if (typeof v1 === "string" && typeof v2 === "string") {
    if (v1.includes("/") || v2.includes("/") || v1.includes(".") || v2.includes(".")) {
      return normalizeUrl(v1) === normalizeUrl(v2);
    }
  }
  return false;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!kb.includes(k)) return false;
    const va = a[k], vb = b[k];
    if (k === "thumbnail" || k === "images" || k === "spec_images" || k === "files") {
      if (Array.isArray(va) && Array.isArray(vb)) {
        if (va.length !== vb.length) return false;
        for (let i = 0; i < va.length; i++) {
          if (typeof va[i] === "object" && typeof vb[i] === "object") {
            if (va[i].url && vb[i].url && !valueEqual(va[i].url, vb[i].url)) return false;
            if (va[i].name && vb[i].name && va[i].name !== vb[i].name) return false;
          } else if (!valueEqual(va[i], vb[i])) return false;
        }
      } else if (typeof va === "string" && typeof vb === "string") {
        if (!valueEqual(va, vb)) return false;
      } else if (va !== vb) return false;
    } else if (Array.isArray(va) && Array.isArray(vb)) {
      if (va.length !== vb.length) return false;
      for (let i = 0; i < va.length; i++) {
        if (!deepEqual(va[i], vb[i])) return false;
      }
    } else if (typeof va === "object" && typeof vb === "object") {
      if (!deepEqual(va, vb)) return false;
    } else if (!valueEqual(va, vb)) return false;
  }
  return true;
}

const IGNORED_FIELDS = new Set([
  "updated_at", "created_at", "updated_by", "updated_by_username",
  "created_by", "created_by_username", "is_deleted",
]);

function compareRooms(supabaseRooms, localRooms) {
  const changes = { added: [], updated: [], deleted: [] };
  const localMap = new Map(localRooms.map(r => [r.id, r]));
  const supabaseMap = new Map(supabaseRooms.map(r => [r.id, r]));

  for (const room of supabaseRooms) {
    const local = localMap.get(room.id);
    if (!local) {
      changes.added.push({ type: "room", item: room });
    } else if (!deepEqual(room, local)) {
      const diff = {};
      for (const field in room) {
        if (IGNORED_FIELDS.has(field)) continue;
        if (!deepEqual(room[field], local[field])) {
          diff[field] = { supabase: room[field], local: local[field] };
        }
      }
      if (Object.keys(diff).length > 0) {
        changes.updated.push({ type: "room", id: room.id, item: room, diff });
      }
    }
  }

  for (const room of localRooms) {
    if (!supabaseMap.has(room.id)) {
      changes.deleted.push({ type: "room", item: room });
    }
  }

  return changes;
}

export async function checkSaunaRoomsSync(onEvent = () => {}) {
  const report = {
    timestamp: new Date().toISOString(),
    rooms: { added: [], updated: [], deleted: [] },
    summary: "",
    totalChanges: 0,
  };

  try {
    onEvent({ phase: "fetching", message: "Fetching sauna rooms from Supabase..." });
    const supabaseRooms = await fetchSupabaseRooms();

    onEvent({ phase: "loading", message: "Loading local saunaroom-data.json..." });
    const localRooms = await loadLocalRooms();

    onEvent({ phase: "comparing", message: "Comparing rooms..." });
    report.rooms = compareRooms(supabaseRooms, localRooms);

    const total = report.rooms.added.length + report.rooms.updated.length + report.rooms.deleted.length;
    report.totalChanges = total;
    report.summary = `Found ${report.rooms.added.length} added, ${report.rooms.updated.length} updated, ${report.rooms.deleted.length} deleted rooms.`;

    onEvent({ phase: "complete", message: report.summary, report });
    return report;
  } catch (err) {
    const msg = `Sync check failed: ${err.message}`;
    onEvent({ phase: "error", message: msg, error: err.message });
    throw err;
  }
}

export async function applyLocalRoomChanges(report, onEvent = () => {}) {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

  try {
    if (report.totalChanges === 0) {
      onEvent({ phase: "complete", message: "No changes to apply." });
      return { success: true, message: "No changes needed." };
    }

    onEvent({ phase: "applying", message: "Applying changes to local files..." });

    const localRooms = await loadLocalRooms();
    let updated = [...localRooms];

    report.rooms.deleted.forEach(({ item }) => { updated = updated.filter(r => r.id !== item.id); });
    report.rooms.added.forEach(({ item }) => { updated.push(item); });
    report.rooms.updated.forEach(({ item }) => {
      const idx = updated.findIndex(r => r.id === item.id);
      if (idx !== -1) updated[idx] = item;
    });

    onEvent({ phase: "writing", message: "Writing changes to backend..." });

    const response = await fetch(`${BACKEND_URL}/api/update-local-sauna-rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rooms: updated }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    if (!responseText.trim()) throw new Error("Backend returned empty response");

    const lines = responseText.trim().split("\n");
    let result = { success: false };
    for (const line of lines) {
      if (line.trim()) {
        try {
          const event = JSON.parse(line);
          onEvent(event);
          if (event.success === true) result = { success: true, message: event.message };
          else if (event.phase === "error") throw new Error(event.message || "Backend error");
        } catch (parseErr) {
          throw new Error(`Failed to parse backend response: ${parseErr.message}`);
        }
      }
    }

    onEvent({ phase: "complete", message: "Changes applied successfully." });
    return { success: true, message: "Local files updated.", changes: { rooms: updated } };
  } catch (err) {
    const msg = `Failed to apply changes: ${err.message}`;
    onEvent({ phase: "error", message: msg, error: err.message });
    throw err;
  }
}
