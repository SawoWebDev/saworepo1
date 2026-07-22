// src/pages/Hero.jsx
import React, { useEffect, useRef } from "react";
import ButtonClear from "../../components/Buttons/ButtonClear";
import { afterPageLoad, prefersReducedMotion } from "../../utils/afterPageLoad";

const SENTENCES = [
  "a rejuvenating escape",
  "wellness with ancient tradition",
  "an authentic Finnish sauna",
];
const BUTTON_TEXT = "VIEW CATALOGUE";
const BUTTON_URL  = "https://www.sawo.com/wp-content/uploads/2025/10/SAWO-Product-Catalogue-2025.pdf";
const ALT_TEXT    = "SAWO sauna heaters - Experience wellness and rejuvenation";

const Hero = () => {
  const typewriterRef = useRef(null);
  const wavesRef = useRef(null);

  useEffect(() => {
    const el = wavesRef.current;
    if (!el || prefersReducedMotion()) return;

    // Same idle-callback deferral as the typewriter below: the wave starts
    // paused (see .hero-waves-parallax > use, animation-play-state: paused)
    // so it costs nothing during initial load/LCP, then this just flips one
    // class after the page has gone idle — no JS animation loop involved.
    const cancelStart = afterPageLoad(() => {
      el.classList.add("is-running");
    });

    return cancelStart;
  }, []);

  useEffect(() => {
    const el = typewriterRef.current;
    if (!el) return;

    let n = 0;
    let i = 0;
    let isTyping = true;
    let spans    = [];
    let timeout;

    function setupSentence() {
      const current = SENTENCES[n];
      if (!el) return;
      el.innerHTML = current
        .split("")
        .map((char) => `<span>${char}</span>`)
        .join("");
      spans    = el.querySelectorAll("span");
      i        = 0;
      isTyping = true;
    }

    function animate() {
      if (!el) return;
      if (isTyping) {
        if (i < spans.length) {
          spans[i].style.opacity = 1;
          i++;
          timeout = setTimeout(animate, 70);
        } else {
          isTyping = false;
          timeout  = setTimeout(animate, 900);
        }
      } else {
        if (i > 0) {
          i--;
          spans[i].style.opacity = 0;
          timeout = setTimeout(animate, 50);
        } else {
          n = (n + 1) % SENTENCES.length;
          setupSentence();
          timeout = setTimeout(animate, 500);
        }
      }
    }

    // Reduced motion: render the first sentence statically, no animation loop.
    if (prefersReducedMotion()) {
      el.textContent = SENTENCES[0];
      el.style.opacity = 1;
      return;
    }

    // Defer the typewriter until after load + idle so Lighthouse can finalize
    // LCP/TBT on a settled page (prevents the `NO_LCP` runtime error).
    const cancelStart = afterPageLoad(() => {
      setupSentence();
      animate();
    });

    return () => {
      clearTimeout(timeout);
      cancelStart();
    };
  }, []);

  // Dark bg on the section itself (not just the -z-10 image div) so contrast
  // checkers see white hero text against #3a3a3a instead of the page's white.
  // `isolate` makes the section a stacking context so the -z-10 image still
  // paints above this background.
  return (
    <section
      className="sauna-unique relative isolate w-full min-h-[95vh] flex flex-col justify-center px-5 md:px-10 overflow-hidden"
      style={{ backgroundColor: "#3a3a3a" }}
    >
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: "#3a3a3a" }}
      >
        <picture>
          <source
            media="(max-width: 640px)"
            srcSet="/640.webp 1x"
            type="image/webp"
          />
          <source
            media="(max-width: 1024px)"
            srcSet="/1024.webp 1x"
            type="image/webp"
          />
          <source
            srcSet="/1920.webp 1x"
            type="image/webp"
          />
          <img
            src="/1920.webp"
            alt={ALT_TEXT}
            width="1920"
            height="1080"
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            style={{ display: "block" }}
          />
        </picture>
      </div>

      <h1
        className="font-bold text-white text-left whitespace-nowrap text-2xl mt-10 sm:text-4xl md:text-5xl lg:text-[60px] leading-tight"
        style={{
          fontFamily: "Montserrat, sans-serif",
          textShadow: "4px 6px 7px rgba(0,0,0,0.5)",
        }}
      >
        Experience . . .
      </h1>

      {/* SEO fallback text (screen-reader only) */}
      <div className="sr-only">
        {SENTENCES.join(", ")}, SAWO sauna heaters, Finnish sauna, sauna
        accessories, infrared sauna, steam generator
      </div>

      <div className="stack flex flex-col items-center text-center">
        <div
          ref={typewriterRef}
          className="typewriter font-montserrat font-light text-white text-center mb-6 sm:mb-8 text-lg sm:text-2xl md:text-4xl lg:text-[46px] leading-snug"
          style={{
            letterSpacing: "0.2px",
            textShadow: "0px 12px 10px rgba(0,0,0,0.9)",
            minHeight: "1.4em",
          }}
        />

        <ButtonClear
          text={BUTTON_TEXT}
          href={BUTTON_URL}
          download
        />
      </div>

      {/* Wave divider into the next section — decorative, so hidden from
          screen readers and never intercepts clicks on the hero content. */}
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
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .typewriter span {
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }
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
    </section>
  );
};

export default Hero;
