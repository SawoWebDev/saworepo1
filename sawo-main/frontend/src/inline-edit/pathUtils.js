// src/inline-edit/pathUtils.js
// Dot-path get/set helpers for reading and patching nested site_content JSONB
// (e.g. "items.0.title", "hero_photo.image_url") without touching sibling data.

export function getAtPath(obj, path) {
  if (!obj || !path) return undefined;
  let cur = obj;
  for (const key of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

// Returns a new object/array with `value` set at `path`, cloning only the
// branches along the path (siblings elsewhere in `obj` are left untouched).
export function setAtPath(obj, path, value) {
  const keys = path.split(".");
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = root;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextIsIndex = /^\d+$/.test(keys[i + 1]);
    const existing = cur[key];
    const clone = existing != null
      ? (Array.isArray(existing) ? [...existing] : { ...existing })
      : (nextIsIndex ? [] : {});
    cur[key] = clone;
    cur = clone;
  }

  cur[keys[keys.length - 1]] = value;
  return root;
}

// Deep-merges `patch` onto `base`. Arrays are merged element-wise by index
// (only indices present in `patch` are touched); everything else in `base`
// is preserved. Used to combine a field-level pending patch with the
// latest saved row before upserting.
export function deepMerge(base, patch) {
  if (Array.isArray(patch)) {
    const baseArr = Array.isArray(base) ? base : [];
    const result = [...baseArr];
    for (const key of Object.keys(patch)) {
      const i = Number(key);
      result[i] = deepMerge(result[i], patch[i]);
    }
    return result;
  }
  if (patch && typeof patch === "object") {
    const baseObj = (base && typeof base === "object" && !Array.isArray(base)) ? base : {};
    const result = { ...baseObj };
    for (const key of Object.keys(patch)) {
      result[key] = deepMerge(result[key], patch[key]);
    }
    return result;
  }
  return patch;
}
