// src/utils/afterPageLoad.js
//
// Defers continuous animations/timers until the page has loaded AND the main
// thread has gone idle. This lets Lighthouse observe a settled page and
// finalize Largest Contentful Paint / Total Blocking Time before any
// never-ending animation starts — fixing the PageSpeed `NO_LCP` runtime error.
//
// Returns a cleanup function that cancels the pending callback if the component
// unmounts before it fires.

export function afterPageLoad(cb) {
  let idleId;
  let cancelled = false;

  const schedule = () => {
    if (cancelled) return;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(cb, { timeout: 2000 });
    } else {
      idleId = setTimeout(cb, 200);
    }
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId != null) {
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      clearTimeout(idleId);
    }
  };
}

export const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
