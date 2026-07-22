import React, { useEffect, useRef } from "react";
import { afterPageLoad, prefersReducedMotion } from "../utils/afterPageLoad";

/**
 * Decorative wave divider for hero sections with a background image, matching
 * Home/Hero.jsx. The wave starts paused (see .hero-waves-parallax > use,
 * animation-play-state: paused) so it costs nothing during initial load/LCP,
 * then flips one class after the page has gone idle — no JS animation loop.
 */
export default function HeroWave() {
  const wavesRef = useRef(null);

  useEffect(() => {
    const el = wavesRef.current;
    if (!el || prefersReducedMotion()) return;

    const cancelStart = afterPageLoad(() => {
      el.classList.add("is-running");
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

      <style>{`
        .hero-waves {
          height: 5vh;
          min-height: 60px;
          max-height: 110px;
        }
        .hero-waves-parallax > use {
          animation: hero-wave-move 25s cubic-bezier(.55,.5,.45,.5) infinite;
          animation-play-state: paused;
          transform: translate3d(0, 0, 0);
        }
        .hero-waves-parallax.is-running > use { animation-play-state: running; }
        .hero-waves-parallax > use:nth-child(1) { animation-delay: -4s; animation-duration: 14s; }
        .hero-waves-parallax > use:nth-child(2) { animation-delay: -5s; animation-duration: 22s; }
        @keyframes hero-wave-move {
          0%   { transform: translate3d(-90px, 0, 0); }
          100% { transform: translate3d(85px, 0, 0); }
        }
        @media (max-width: 768px) {
          .hero-waves { height: 32px; min-height: 32px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-waves-parallax > use { animation: none; }
        }
      `}</style>
    </>
  );
}
