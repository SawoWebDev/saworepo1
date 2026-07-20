// Defers continuous animations/timers until the page has loaded AND the main
// thread has gone idle, so Lighthouse can finalize LCP/TBT before any
// never-ending animation starts (fixes the PageSpeed `NO_LCP` runtime error).
// Returns a cleanup function that cancels the pending callback on unmount.

export function afterPageLoad(cb) {
  let idleId;
  let cancelled = false;

  const schedule = () => {
    if (cancelled) return;
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(cb, { timeout: 2000 });
    } else {
      idleId = setTimeout(cb, 200);
    }
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener('load', schedule);
    if (idleId != null) {
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      clearTimeout(idleId);
    }
  };
}

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
