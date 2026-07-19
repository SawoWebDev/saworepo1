/**
 * jsonFileProducts.js
 *
 * "jsonfile" data source for accessories: fetches allaccs-data.json straight
 * from the saworepo2 GitHub repo at runtime (same pattern as
 * useLocalSaunaRooms' saunaroom-data.json fetch), so editing that file +
 * pushing updates the live site with no rebuild/redeploy.
 */
import { transformAccessories } from "./accessoriesTransform";

const CACHE_MS = 5 * 60 * 1000; // 5 min — matches GitHub raw's own CDN max-age

let cache = null;   // { records, time }
let inflight = null; // in-flight fetch promise, deduped across simultaneous hook mounts

function accessoriesUrl() {
  const owner = process.env.REACT_APP_GITHUB_OWNER || "jmesrafael";
  const repo = process.env.REACT_APP_IMAGES_REPO || "saworepo2";
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/allaccs-data.json`;
}

export async function getJsonFileAccessories() {
  const now = Date.now();
  if (cache && now - cache.time < CACHE_MS) return cache.records;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(accessoriesUrl());
    if (!res.ok) throw new Error(`Failed to fetch allaccs-data.json: ${res.status}`);
    const data = await res.json();
    const records = transformAccessories(data);
    cache = { records, time: Date.now() };
    return records;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
