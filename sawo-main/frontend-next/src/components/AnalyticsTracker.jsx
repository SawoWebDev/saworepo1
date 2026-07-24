'use client';

/**
 * AnalyticsTracker.jsx
 *
 * First-party visitor analytics for the i18n (Next.js) site — a direct port
 * of the CRA app's src/local-storage/track.js, so translated pages land in
 * the same analytics_page_views table and show up in the same /admin/analytics
 * dashboard. The locale prefix in the pathname (/en/…, /fi/…, /de/…) is what
 * distinguishes them in Top Pages.
 *
 * Talks to the shared backend (backend/trackingApi.js), never Supabase
 * directly. Fire-and-forget with try/catch so a failure can never affect the
 * page. No admin-skip here: this app has no admin area or login.
 *
 * Requires NEXT_PUBLIC_BACKEND_URL (set in Vercel env) — without it the
 * component renders null and tracks nothing.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const PAGEVIEW_ENDPOINT = `${BACKEND_URL}/api/track/pageview`;
const DURATION_ENDPOINT = `${BACKEND_URL}/api/track/duration`;

function getSessionId() {
  try {
    let sid = sessionStorage.getItem('sawo_sid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('sawo_sid', sid);
    }
    return sid;
  } catch {
    return 'anon';
  }
}

function parseUA() {
  const ua = navigator.userAgent;
  const device_type = /Mobi|Android.*Mobile|iPhone/i.test(ua)
    ? 'mobile'
    : /iPad|Tablet|Android/i.test(ua)
      ? 'tablet'
      : 'desktop';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Safari\//.test(ua) && !/Chrome/.test(ua)
        ? 'Safari'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : 'Other';
  // iOS before Mac: iPads can report "Mac OS X" alongside iPad in the UA.
  const os = /iPhone|iPad|iPod/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'GNU/Linux'
            : 'Other';
  return { device_type, browser, os };
}

// Plausible's viewport-width buckets.
function getScreenSize() {
  const w = window.innerWidth;
  return w < 576 ? 'Mobile' : w < 992 ? 'Tablet' : w < 1440 ? 'Laptop' : 'Desktop';
}

/**
 * Where this visit came from — external referrer hostname + utm params,
 * computed once on the landing page and pinned in sessionStorage
 * (first-touch attribution per visit, matching Plausible's model).
 */
function getAttribution() {
  const KEY = 'sawo_attr';
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
    utm_source = params.get('utm_source') || null;
    utm_medium = params.get('utm_medium') || null;
    utm_campaign = params.get('utm_campaign') || null;
  } catch { /* ignore */ }

  const attr = { referrer, utm_source, utm_medium, utm_campaign };
  try { sessionStorage.setItem(KEY, JSON.stringify(attr)); } catch { /* ignore */ }
  return attr;
}

// The page view currently being timed: { id, start }
let current = null;

// Input events only a real visitor produces — same gating rationale as the
// CRA tracker: the backend (Render free tier) can be cold, and a timed-out
// request during a Lighthouse lab run logs a console error the audit scores
// against us. A lab run never touches the page; a real visitor does within
// seconds.
const INTERACTION_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'];
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
      { type: 'application/json' }
    );
    // sendBeacon survives page unload/navigation, unlike a regular fetch.
    const sent = navigator.sendBeacon?.(DURATION_ENDPOINT, blob);
    if (!sent) {
      fetch(DURATION_ENDPOINT, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: current.id, time_on_page: seconds }),
      }).catch(() => {});
    }
  } catch {
    /* never let analytics break the page */
  }
}

async function trackPageView(path) {
  if (!BACKEND_URL) return;

  finalizeCurrent();
  current = { id: null, start: Date.now() };
  const startedFor = current;

  try {
    const res = await fetch(PAGEVIEW_ENDPOINT, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
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

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) queuePageView(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!hasInteracted) addInteractionListeners();
    const onHide = () => {
      if (document.visibilityState === 'hidden') finalizeCurrent();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', finalizeCurrent);
    return () => {
      removeInteractionListeners();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', finalizeCurrent);
    };
  }, []);

  return null;
}
