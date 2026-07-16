// src/pages/Hero.jsx
import React, { useEffect, useRef } from "react";
import ButtonClear from "../../components/Buttons/ButtonClear";
import { afterPageLoad, prefersReducedMotion } from "../../utils/afterPageLoad";

// ── Hardcoded fallbacks (used when CMS has no override) ──────────────────────
const DEFAULT_SENTENCES = [
  "a rejuvenating escape",
  "wellness with ancient tradition",
  "an authentic Finnish sauna",
];
const DEFAULT_BUTTON_TEXT = "VIEW CATALOGUE";
const DEFAULT_BUTTON_URL  = "https://www.sawo.com/wp-content/uploads/2025/10/SAWO-Product-Catalogue-2025.pdf";
const DEFAULT_ALT         = "SAWO sauna heaters - Experience wellness and rejuvenation";

/**
 * Hero — receives `content` prop from Home.jsx (may be undefined/null initially).
 * All values fall back to hardcoded defaults so the page never breaks.
 *
 * CMS-editable fields (from site_content table, home › hero):
 *   image_640  / image_1024 / image_1920  — hero background at each breakpoint
 *   alt_text                              — img alt attribute
 *   typewriter_sentences                  — animated text lines array
 *   button_text / button_url              — CTA button
 */
const Hero = ({ content = {} }) => {
  const typewriterRef = useRef(null);

  // Resolve CMS values with fallbacks
  const img640     = content.image_640  || "/640.webp";
  const img1024    = content.image_1024 || "/1024.webp";
  const img1920    = content.image_1920 || "/1920.webp";
  const altText    = content.alt_text   || DEFAULT_ALT;
  const sentences  = (content.typewriter_sentences?.length > 0)
    ? content.typewriter_sentences
    : DEFAULT_SENTENCES;
  const buttonText = content.button_text || DEFAULT_BUTTON_TEXT;
  const buttonUrl  = content.button_url  || DEFAULT_BUTTON_URL;

  // Re-run typewriter when sentences change (e.g. CMS loaded after mount)
  useEffect(() => {
    const el = typewriterRef.current;
    if (!el) return;

    let n = 0;
    let i = 0;
    let isTyping = true;
    let spans    = [];
    let timeout;

    function setupSentence() {
      const current = sentences[n];
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
          n = (n + 1) % sentences.length;
          setupSentence();
          timeout = setTimeout(animate, 500);
        }
      }
    }

    // Reduced motion: render the first sentence statically, no animation loop.
    if (prefersReducedMotion()) {
      el.textContent = sentences[0];
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences.join("|")]); // re-run only when sentences actually change

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
            srcSet={`${img640} 1x`}
            type="image/webp"
          />
          <source
            media="(max-width: 1024px)"
            srcSet={`${img1024} 1x`}
            type="image/webp"
          />
          <source
            srcSet={`${img1920} 1x`}
            type="image/webp"
          />
          <img
            src={img1920}
            alt={altText}
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
        {sentences.join(", ")}, SAWO sauna heaters, Finnish sauna, sauna
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
          text={buttonText}
          href={buttonUrl}
          download
        />
      </div>

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
      `}</style>
    </section>
  );
};

export default Hero;
