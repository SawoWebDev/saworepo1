/**
 * lib/posthog.js
 *
 * PostHog, scoped deliberately to session replay + (future) funnel events.
 * NOT pageviews, NOT geo — the patched first-party tracker
 * (local-storage/track.js -> backend/trackingApi.js -> analytics_page_views)
 * already owns those. capture_pageview and autocapture are off here so the
 * two systems don't double up.
 *
 * Gated the same way as the first-party tracker: production only, admins
 * excluded, /admin and /login excluded — admins must never appear in
 * session replay.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import posthog from "posthog-js";
import { isAdmin } from "../local-storage/track";

const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY;
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

function isProduction() {
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
}

function shouldInit(pathname) {
  if (!POSTHOG_KEY) return false;
  if (!isProduction()) return false;
  if (isAdmin()) return false;
  if (pathname.startsWith("/admin") || pathname === "/login") return false;
  return true;
}

/**
 * Mount once inside the router (MainLayout), alongside usePageTracking.
 * Initializes PostHog lazily on the first qualifying route — never for
 * admins, never on /admin or /login, never outside production.
 */
export function usePostHogTracking() {
  const location = useLocation();

  useEffect(() => {
    if (initialized || !shouldInit(location.pathname)) return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      defaults: "2026-05-30",
      // We never call posthog.identify() (no visitor auth on the public
      // site) — this stops PostHog from creating a person profile per
      // anonymous visitor, which matters against the free-tier caps.
      person_profiles: "identified_only",
      // Our own first-party tracker is the source of truth for
      // pageviews/top-pages/country — PostHog must not duplicate that.
      capture_pageview: false,
      autocapture: false,
      session_recording: {
        maskAllInputs: true,
      },
    });
    initialized = true;
  }, [location.pathname]);
}

/**
 * Wrapper for future funnel/conversion event tracking (e.g. "signup
 * started", "form submitted"). No call sites yet — this is just the helper.
 * No-ops if PostHog was never initialized (admin/localhost/no key).
 */
export function trackEvent(name, properties) {
  if (!initialized) return;
  posthog.capture(name, properties);
}
