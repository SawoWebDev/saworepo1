// src/Administrator/adminCache.js
//
// In-memory cache for admin page data, keyed by an arbitrary string.
// React Router unmounts each /admin/* page on navigation, so without this
// every page starts from a blank slate and refetches on every visit. Pages
// seed their initial state from here so a revisit shows the last-known data
// immediately, then quietly refetch in the background to stay current.
const store = new Map();

export function getCache(key) {
  return store.has(key) ? store.get(key) : undefined;
}

export function setCache(key, value) {
  store.set(key, value);
}

// Drops every admin-page entry (Users, Products, Settings, ...) so the next
// mount of each page refetches instead of painting from a stale snapshot.
// Used by Settings.jsx's "Clear Cache" button.
export function clearAllCache() {
  store.clear();
}
