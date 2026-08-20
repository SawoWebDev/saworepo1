// src/pages/Hero.jsx
import React, { useEffect, useRef, useState } from "react";
import ButtonClear from "../../components/Buttons/ButtonClear";
import HeroWave from "../../components/HeroWave";
import { afterPageLoad, prefersReducedMotion } from "../../utils/afterPageLoad";
import { useLocaleT } from "../../i18n/LocaleContext";

const BUTTON_URL = "https://www.sawo.com/wp-content/uploads/2025/10/SAWO-Product-Catalogue-2025.pdf";

const Hero = () => {
  const tHome = useLocaleT("home");
  const tCommon = useLocaleT("common");
  const SENTENCES = tHome("hero.sentences", { returnObjects: true });
  const BUTTON_TEXT = tCommon("viewCatalogue");
  const ALT_TEXT = tHome("hero.alt");
  const typewriterRef = useRef(null);
  const heroImgRef = useRef(null);
  const [heroLoaded, setHeroLoaded] = useState(() => {
    // On "/", main.js only executes after the *prerendered* hero <img>'s
    // load event (scripts/prerender.js's post-LCP gate) — so by the time
    // this component's render phase runs, that already-painted img is still
    // in the DOM (createRoot hasn't committed the replacement yet). Starting
    // heroLoaded at false here unconditionally meant the fresh mount always
    // swapped in a brand-new <img> at opacity:0, which blanked the already-
    // visible hero back to the dark placeholder for a frame before the
    // effect below caught up — the "blinks twice" flash on homepage load.
    // Checking the outgoing element's own load state up front skips that.
    if (typeof document === "undefined") return false;
    const existing = document.querySelector("section.sauna-unique img");
    return !!(existing && existing.complete && existing.naturalWidth > 0);
  });

  // Fade the hero image in once it's actually painted instead of it popping
  // in abruptly, without gating the real <img>'s fetch/paint behind JS —
  // fetchPriority="high" + loading="eager" below stay untouched, this just
  // listens on the same element. img.complete covers the cache-hit case
  // (repeat visits) where the load event has already fired before mount.
  useEffect(() => {
    const img = heroImgRef.current;
    if (!img) return;
    if (img.complete) setHeroLoaded(true);
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
    // SENTENCES is derived from the locale fixed at mount (LocaleContext
    // doesn't change during Home's lifetime) — intentionally excluded so
    // this effect runs once, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            ref={heroImgRef}
            src="/1920.webp"
            alt={ALT_TEXT}
            width="1920"
            height="1080"
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            onLoad={() => setHeroLoaded(true)}
            onError={() => setHeroLoaded(true)}
            style={{ display: "block", opacity: heroLoaded ? 1 : 0, transition: "opacity 0.6s ease" }}
          />
        </picture>
      </div>

      {/* SEO fallback text (screen-reader only) — kept outside the fade so
          screen readers always have it, regardless of image load state. */}
      <div className="sr-only">
        {SENTENCES.join(", ")}, {tHome("hero.seoKeywords")}
      </div>

      {/* Text fades in alongside the hero image instead of popping in ahead
          of it — synced to the same heroLoaded state, no opaque layer ever
          sits on top of the image so this doesn't touch LCP occlusion. */}
      <div style={{ opacity: heroLoaded ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <h1
          className="font-bold text-white text-left whitespace-nowrap text-3xl mt-10 sm:text-5xl md:text-6xl lg:text-[60px] leading-tight"
          style={{
            fontFamily: "Montserrat, sans-serif",
            textShadow: "4px 6px 7px rgba(0,0,0,0.5)",
          }}
        >
          {tHome("hero.experience")}
        </h1>

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
      </div>

      {/* Wave divider into the next section — decorative, so hidden from
          screen readers and never intercepts clicks on the hero content. */}
      <HeroWave />

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
