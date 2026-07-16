/**
 * track.js
 * src/local-storage/track.js
 *
 * First-party visitor analytics feeding the existing /admin/analytics
 * dashboard (tables: analytics_page_views — see scripts/setup-analytics.sql).
 *
 * Deliberately tiny: talks to Supabase's REST endpoint with plain fetch()
 * (no supabase-js), fire-and-forget with try/catch so a failure can never
 * affect the page, and skips admins entirely. Total cost per page view is
 * one ~300-byte POST after render plus one PATCH when leaving the page.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const ENDPOINT = `${SUPABASE_URL}/rest/v1/analytics_page_views`;

const HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
};

function isAdmin() {
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
    // keepalive lets this complete even during unload/navigation
    fetch(`${ENDPOINT}?id=eq.${current.id}`, {
      method: "PATCH",
      keepalive: true,
      headers: HEADERS,
      body: JSON.stringify({ time_on_page: seconds }),
    }).catch(() => {});
  } catch {
    /* never let analytics break the page */
  }
}

async function trackPageView(path) {
  if (!SUPABASE_URL || !ANON_KEY || isAdmin()) return;
  if (path.startsWith("/admin") || path === "/login") return;

  finalizeCurrent();
  current = { id: null, start: Date.now() };
  const startedFor = current;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { ...HEADERS, Prefer: "return=representation" },
      body: JSON.stringify({ session_id: getSessionId(), page_path: path, ...parseUA() }),
    });
    if (res.ok) {
      const rows = await res.json();
      // Only attach the id if the visitor hasn't already navigated on
      if (current === startedFor && rows?.[0]?.id) current.id = rows[0].id;
    }
  } catch {
    /* offline / blocked / table missing — silently do nothing */
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
