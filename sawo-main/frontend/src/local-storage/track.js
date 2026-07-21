/**
 * track.js
 * src/local-storage/track.js
 *
 * First-party visitor analytics feeding the existing /admin/analytics
 * dashboard (tables: analytics_page_views — see scripts/setup-analytics.sql).
 *
 * Talks to our own backend (backend/trackingApi.js), not Supabase directly —
 * the backend holds the service-role key, does bot filtering, and looks up
 * geo from the visitor's real IP. Fire-and-forget with try/catch so a
 * failure can never affect the page, and skips admins entirely.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const PAGEVIEW_ENDPOINT = `${BACKEND_URL}/api/track/pageview`;
const DURATION_ENDPOINT = `${BACKEND_URL}/api/track/duration`;

export function isAdmin() {
  try {
    return !!(localStorage.getItem("sawo_token") || sessionStorage.getItem("sawo_token"));
  } catch {
    return false;
  } 
}

function getSessionId() {
  try {
    let sid = sessionStorage.getItem("sawo_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("sawo_sid", sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

function parseUA() {
  const ua = navigator.userAgent;
  const device_type = /Mobi|Android.*Mobile|iPhone/i.test(ua)
    ? "mobile"
    : /iPad|Tablet|Android/i.test(ua)
      ? "tablet"
      : "desktop";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua) && !/Chrome/.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Other";
  return { device_type, browser };
}

// The page view currently being timed: { id, start }
let current = null;

function finalizeCurrent() {
  if (!current?.id) return;
  const seconds = Math.round((Date.now() - current.start) / 1000);
  if (seconds < 1) return;
  try {
    const blob = new Blob(
      [JSON.stringify({ id: current.id, time_on_page: seconds })],
      { type: "application/json" }
    );
    // sendBeacon survives page unload/navigation, unlike a regular fetch.
    const sent = navigator.sendBeacon?.(DURATION_ENDPOINT, blob);
    if (!sent) {
      // Fallback for browsers without sendBeacon, or when it refuses the
      // payload (e.g. queue full) — keepalive gives it a similar chance to
      // complete during unload.
      fetch(DURATION_ENDPOINT, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: current.id, time_on_page: seconds }),
      }).catch(() => {});
    }
  } catch {
    /* never let analytics break the page */
  }
}

async function trackPageView(path) {
  if (!BACKEND_URL || isAdmin()) return;
  if (path.startsWith("/admin") || path === "/login") return;

  finalizeCurrent();
  current = { id: null, start: Date.now() };
  const startedFor = current;

  try {
    const res = await fetch(PAGEVIEW_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), page_path: path, ...parseUA() }),
    });
    if (res.ok) {
      const row = await res.json();
      // Only attach the id if the visitor hasn't already navigated on
      if (current === startedFor && row?.id) current.id = row.id;
    }
  } catch {
    /* offline / blocked / backend down — silently do nothing */
  }
}

/**
 * Mount once inside the router (MainLayout) — records a page view per
 * route change and patches time-on-page when the visitor leaves.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") finalizeCurrent();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", finalizeCurrent);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", finalizeCurrent);
    };
  }, []);
}
