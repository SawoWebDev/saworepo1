// src/local-storage/visibility.js
//
// Single source of truth for "is this product/room visible to a public
// visitor right now?" — used everywhere the old `status === "published"`
// check used to be. There is no server cron for scheduled publishing: a
// draft with a past/present `publish_at` becomes visible the moment a
// visitor's browser evaluates this function, which is why it takes `now`
// as an explicit (optional, testable) argument rather than reading
// Date.now() internally in a way that's hard to reason about.
export function isPubliclyVisible(item, now = Date.now()) {
  if (!item) return false;
  if (item.visible === false) return false;
  if (item.status === "published") return true;
  if (item.publish_at && new Date(item.publish_at).getTime() <= now) return true;
  return false;
}
