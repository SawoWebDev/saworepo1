'use client';

import { useEffect, useRef } from 'react';
import { afterPageLoad, prefersReducedMotion } from '../utils/afterPageLoad';

// Decorative wave divider for hero sections with a background image. Starts
// paused (costs nothing during initial load/LCP), flips a class once the
// page has gone idle — no JS animation loop.
export default function HeroWave() {
  const wavesRef = useRef(null);

  useEffect(() => {
    const el = wavesRef.current;
    if (!el || prefersReducedMotion()) return;

    const cancelStart = afterPageLoad(() => {
      el.classList.add('is-running');
    });

    return cancelStart;
  }, []);

  return (
    <>
      <svg
        className="hero-waves absolute bottom-0 left-0 w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <path
            id="hero-gentle-wave"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g ref={wavesRef} className="hero-waves-parallax">
          <use xlinkHref="#hero-gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.4)" />
          <use xlinkHref="#hero-gentle-wave" x="48" y="7" fill="#fff" />
        </g>
      </svg>
    </>
  );
}
