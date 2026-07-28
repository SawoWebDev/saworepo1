/**
 * track.js
 * src/local-storage/track.js
 *
 * First-party visitor analytics feeding the existing /admin/analytics
 * dashboard (tables: analytics_page_views — see scripts/setup-analytics.sql).
 *
 * Talks to same-origin Cloudflare Pages Functions (functions/api/track/*.js),
 * not Supabase directly — the function holds the service-role key, does bot
 * filtering, and reads geo off Cloudflare's request.cf. Fire-and-forget with
 * try/catch so a failure can never affect the page, and skips admins entirely.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PAGEVIEW_ENDPOINT = "/api/track/pageview";
const DURATION_ENDPOINT = "/api/track/duration";

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
  // iOS before Mac: iPads can report "Mac OS X" alongside iPad in the UA.
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "GNU/Linux"
            : "Other";
  return { device_type, browser, os };
}

// Plausible's viewport-width buckets.
function getScreenSize() {
  const w = window.innerWidth;
  return w < 576 ? "Mobile" : w < 992 ? "Tablet" : w < 1440 ? "Laptop" : "Desktop";
}

/**
 * Where this visit came from — external referrer hostname + utm params.
 * Computed once on the visit's landing page and pinned in sessionStorage,
 * then sent with every pageview of the session (first-touch attribution,
 * matching Plausible's per-visit model). Pinning matters because after the
 * first SPA navigation document.referrer/location.search no longer describe
 * the visit's origin.
 */
function getAttribution() {
  const KEY = "sawo_attr";
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* fall through and recompute */ }

  let referrer = null;
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : null;
    // Self-referrals (full reloads, internal links) must not overwrite Direct.
    if (host && host !== window.location.hostname) referrer = host;
  } catch { /* malformed referrer — treat as direct */ }

  let utm_source = null, utm_medium = null, utm_campaign = null;
  try {
    const params = new URLSearchParams(window.location.search);
    utm_source = params.get("utm_source") || null;
    utm_medium = params.get("utm_medium") || null;
    utm_campaign = params.get("utm_campaign") || null;
  } catch { /* ignore */ }

  const attr = { referrer, utm_source, utm_medium, utm_campaign };
  try { sessionStorage.setItem(KEY, JSON.stringify(attr)); } catch { /* ignore */ }
  return attr;
}

// The page view currently being timed: { id, start }
let current = null;

// Input events that only a real visitor produces. Deliberately no "scroll" —
// viewport/screenshot work by an automated runner can synthesize that — and
// deliberately no timer: see gating comment on queuePageView below.
const INTERACTION_EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"];
const LISTENER_OPTS = { passive: true, capture: true };

let hasInteracted = false;
let pendingPath = null;

function onFirstInteraction() {
  if (hasInteracted) return;
  hasInteracted = true;
  removeInteractionListeners();
  const path = pendingPath;
  pendingPath = null;
  if (path) trackPageView(path);
}

function addInteractionListeners() {
  INTERACTION_EVENTS.forEach((e) =>
    window.addEventListener(e, onFirstInteraction, LISTENER_OPTS)
  );
}

function removeInteractionListeners() {
  INTERACTION_EVENTS.forEach((e) =>
    window.removeEventListener(e, onFirstInteraction, LISTENER_OPTS)
  );
}

/**
 * Hold the very first page view until the visitor actually touches the page.
 *
 * A Lighthouse/PageSpeed run loads the page and never touches it, so gating
 * on real input means no tracking request fires during an audit — while any
 * actual visitor fires one of these within seconds and is tracked normally.
 * No timers here on purpose: a delay would still fire inside the audit
 * window. This also used to matter for a cold-started Render backend timing
 * out mid-audit; that no longer applies now that tracking is a same-origin
 * Pages Function, but the audit-exclusion reason alone is enough to keep it.
 *
 * Once the visitor has interacted, later route changes track immediately.
 */
function queuePageView(path) {
  if (hasInteracted) {
    trackPageView(path);
    return;
  }
  pendingPath = path;
}

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
  if (isAdmin()) return;
  if (path.startsWith("/admin") || path === "/login") return;

  finalizeCurrent();
  current = { id: null, start: Date.now() };
  const startedFor = current;

  try {
    const res = await fetch(PAGEVIEW_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: getSessionId(),
        page_path: path,
        ...parseUA(),
        screen_size: getScreenSize(),
        ...getAttribution(),
      }),
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
    queuePageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (!hasInteracted) addInteractionListeners();
    const onHide = () => {
      if (document.visibilityState === "hidden") finalizeCurrent();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", finalizeCurrent);
    return () => {
      removeInteractionListeners();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", finalizeCurrent);
    };
  }, []);
}
