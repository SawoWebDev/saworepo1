// Administrator/Translations/translationPending.js
//
// "How many products still need translating?" — drives the red dot on the
// Translations sidebar item. Same status logic as the Translations grid
// (buildStatusGrid/rollupStatus), so the dot and the grid always agree.
//
// The check pulls every product + every product_translations row, so it's
// cached in sessionStorage for a few minutes rather than re-run on every
// admin navigation. The Translations page publishes a fresh count whenever
// it loads its own grid, and the product detail page triggers a refresh
// after Apply, so the dot clears without waiting for the cache to expire.
import { useEffect, useState } from "react";
import { fetchAllProductsForTranslation, fetchAllTranslations } from "./translationData";
import { buildStatusGrid, FIELD_STATUS } from "../Local/translationStatus";

const STORAGE_KEY = "admin:translations-pending";
const EVENT = "admin:translations-pending";
const TTL_MS = 5 * 60 * 1000;

let inflight = null;

// A product counts as pending if ANY language is missing or out of date.
export function countPendingProducts(grid) {
  return grid.filter(({ locales }) =>
    Object.values(locales).some((l) => l.rollup !== FIELD_STATUS.CURRENT)
  ).length;
}

function readCached() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { count, at } = JSON.parse(raw);
    return Date.now() - at < TTL_MS ? count : null;
  } catch {
    return null;
  }
}

export function publishPendingCount(count) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ count, at: Date.now() }));
  } catch { /* storage unavailable — the event below still updates the UI */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: count }));
}

export async function refreshPendingCount() {
  if (!inflight) {
    inflight = (async () => {
      try {
        const [products, translations] = await Promise.all([
          fetchAllProductsForTranslation(),
          fetchAllTranslations(),
        ]);
        publishPendingCount(countPendingProducts(buildStatusGrid(products, translations)));
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}

// Sidebar hook — returns the pending count (0 until known). `enabled` is
// false for users who can't open the Translations page, so they never pay
// for the fetch.
export function useTranslationsPending(enabled) {
  const [count, setCount] = useState(() => (enabled ? readCached() ?? 0 : 0));

  useEffect(() => {
    if (!enabled) return undefined;
    const onUpdate = (e) => setCount(e.detail);
    window.addEventListener(EVENT, onUpdate);

    let timer;
    if (readCached() === null) {
      // Deferred so the check never competes with the page the admin
      // actually opened.
      timer = setTimeout(() => { refreshPendingCount().catch(() => {}); }, 1500);
    }
    return () => {
      window.removeEventListener(EVENT, onUpdate);
      clearTimeout(timer);
    };
  }, [enabled]);

  return count;
}
