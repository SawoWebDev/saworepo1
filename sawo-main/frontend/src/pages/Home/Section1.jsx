// src/pages/Section1.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../menuPaths";
import { afterPageLoad, prefersReducedMotion } from "../../utils/afterPageLoad";
import { useLocaleT } from "../../i18n/LocaleContext";

import FinnishSauna      from "../../assets/Home/Section1/FinnishSauna.webp";
import SteamGenerator    from "../../assets/Home/Section1/5-SAUNA-ROOM-STEAM-GENERATOR.webp";
import SaunaRoom         from "../../assets/Home/Section1/Sauna-Room.webp";
// The infrared card shows the sauna ROOM, matching the image the Sauna
// Rooms section uses (Section3/INFRARED-SAUNA-ROOM.webp). Kept as its own
// 350x350 crop rather than importing Section3s 700x525 original, because
// .sawo-carousel-item img is height:auto and every other card here is
// square — a 4:3 image would render visibly shorter than its neighbours.
import InfraredSauna     from "../../assets/Home/Section1/INFRARED-SAUNA-ROOM.webp";
import SaunaAccessories  from "../../assets/Home/Section1/Sauna-Accessories.webp";
import SaunovaSeries     from "../../assets/Home/Section1/INC-S-V2AspenSauna.webp";

const ITEM_KEYS = ["heaters", "steamGenerators", "rooms", "infrared", "accessories", "controls"];
const ITEM_HREFS = {
  heaters: menuPaths.sauna.heaters.parent,
  steamGenerators: menuPaths.steam.generators,
  rooms: menuPaths.sauna.rooms,
  infrared: menuPaths.infrared.parent,
  accessories: menuPaths.sauna.accessories.parent,
  controls: menuPaths.sauna.controls,
};
const ITEM_IMAGES = {
  heaters: FinnishSauna,
  steamGenerators: SteamGenerator,
  rooms: SaunaRoom,
  infrared: InfraredSauna,
  accessories: SaunaAccessories,
  controls: SaunovaSeries,
};

const SPEED_PX_PER_SEC = 40;

/**
 * Section1 — Product category carousel.
 *
 * Autoplays via requestAnimationFrame + CSS transform (not a CSS @keyframes
 * loop), wrapping the translateX value modulo half the track width so the
 * loop is truly seamless — never resets/jumps. Same rAF loop also drives
 * pointer-drag scrubbing (mouse + touch), pausing autoplay while dragging or
 * hovered. The track is duplicated once (CAROUSEL_ITEMS x2) so the wrap point
 * always lands on a matching item.
 */
const Section1 = () => {
  const t = useLocaleT("home");
  const CAROUSEL_ITEMS = ITEM_KEYS.map((key) => ({
    key,
    title: t(`section1.items.${key}.title`),
    caption: t(`section1.items.${key}.caption`),
    alt: t(`section1.items.${key}.alt`),
    href: ITEM_HREFS[key],
    img: ITEM_IMAGES[key],
  }));
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  // Keep autoplay paused until after load so Lighthouse can settle the page
  // and finalize LCP/TBT (prevents the `NO_LCP` runtime error). Dragging still
  // works before this flips true.
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);
  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    return afterPageLoad(() => setIsReady(true));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    let x = 0;
    let half = 0;
    let isHover = false;
    let isDragging = false;
    let dragMoved = false;
    let startX = 0;
    let startXPos = 0;
    let lastTime = null;
    let rafId = null;

    const measure = () => {
      half = track.scrollWidth / 2;
    };

    const wrap = (val) => {
      if (half <= 0) return val;
      val = val % half;
      if (val > 0) val -= half;
      return val;
    };

    const apply = () => {
      track.style.transform = `translateX(${x}px)`;
    };

    const tick = (time) => {
      if (lastTime === null) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isReadyRef.current && !isDragging && !isHover && half > 0) {
        x -= SPEED_PX_PER_SEC * dt;
        x = wrap(x);
        apply();
      }
      rafId = requestAnimationFrame(tick);
    };

    const getClientX = (e) => {
      if (e.touches && e.touches.length) return e.touches[0].clientX;
      if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
      return e.clientX;
    };

    const dragStart = (e) => {
      isDragging = true;
      dragMoved = false;
      startX = getClientX(e);
      startXPos = x;
      window.addEventListener("pointermove", dragMove);
      window.addEventListener("pointerup", dragEnd);
      window.addEventListener("pointercancel", dragEnd);
    };

    const dragMove = (e) => {
      if (!isDragging) return;
      const clientX = getClientX(e);
      const dx = clientX - startX;
      if (Math.abs(dx) > 3) {
        // Only enter "dragging" visuals (and disable link pointer-events)
        // once real movement is detected — never on a plain pointerdown,
        // so a click that never moves can't have its <a> hit-tested with
        // pointer-events already stripped.
        dragMoved = true;
        track.classList.add("sawo-dragging");
      }
      x = wrap(startXPos + dx);
      apply();
    };

    const dragEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove("sawo-dragging");
      window.removeEventListener("pointermove", dragMove);
      window.removeEventListener("pointerup", dragEnd);
      window.removeEventListener("pointercancel", dragEnd);
    };

    // Prevent link navigation from firing right after a drag.
    const onClickCapture = (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    };

    const onNativeDragStart = (e) => e.preventDefault();
    const onPointerEnter = () => { isHover = true; };
    const onPointerLeave = () => { isHover = false; };

    track.addEventListener("pointerdown", dragStart);
    track.addEventListener("dragstart", onNativeDragStart);
    track.addEventListener("click", onClickCapture, true);
    container.addEventListener("pointerenter", onPointerEnter);
    container.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", measure);

    measure();
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", dragMove);
      window.removeEventListener("pointerup", dragEnd);
      window.removeEventListener("pointercancel", dragEnd);
      track.removeEventListener("pointerdown", dragStart);
      track.removeEventListener("dragstart", onNativeDragStart);
      track.removeEventListener("click", onClickCapture, true);
      container.removeEventListener("pointerenter", onPointerEnter);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div>
      {/* Title Above Carousel */}
      <section className="py-8">
        <h2
          className="text-center"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 500,
            color: "rgb(175, 133, 100)",
            fontSize: "35px",
          }}
        >
          {t("section1.heading")}
        </h2>
      </section>

      {/* Carousel Section */}
      <section className="pb-12">
        <div
          className="sawo-carousel-container"
          role="region"
          aria-label={t("section1.carouselLabel")}
          ref={containerRef}
        >
          <div className="sawo-carousel-track" role="list" ref={trackRef}>
            {[...CAROUSEL_ITEMS, ...CAROUSEL_ITEMS].map((item, index) => (
              <div className="sawo-carousel-item" key={index} role="listitem" aria-hidden={index >= CAROUSEL_ITEMS.length}>
                <Link to={item.href}>
                  <img
                    src={item.img}
                    alt={item.alt}
                    title={item.title}
                    width="350"
                    height="350"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="sawo-carousel-overlay" />
                  <div className="sawo-carousel-content">
                    <div className="sawo-carousel-title">{item.title}</div>
                    <div className="sawo-carousel-caption-wrap">
                      <div className="sawo-carousel-caption">{item.caption}</div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Styles */}
      <style jsx>{`
        .sawo-carousel-container {
          position: relative;
          overflow: hidden;
          width: 100%;
          padding: 20px 0;
        }
        .sawo-carousel-track {
          display: flex;
          gap: 20px;
          will-change: transform;
          cursor: grab;
          user-select: none;
        }
        .sawo-carousel-track.sawo-dragging { cursor: grabbing; }
        .sawo-carousel-track.sawo-dragging * { pointer-events: none; }

        .sawo-carousel-item {
          flex: 0 0 calc(25% - 20px);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          font-family: 'Montserrat', sans-serif;
        }
        .sawo-carousel-item a {
          display: block;
          position: relative;
          text-decoration: none;
          color: #fff;
        }
        .sawo-carousel-item img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform .6s ease;
        }
        .sawo-carousel-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.3);
          z-index: 1;
        }
        .sawo-carousel-content {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 14px 16px;
          background: linear-gradient(to top, rgba(0,0,0,.7), transparent);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          z-index: 2;
        }
        .sawo-carousel-title, .sawo-carousel-caption {
          position: relative;
          z-index: 3;
          color: #fff !important;
          font-family: 'Montserrat', sans-serif;
        }
        .sawo-carousel-title {
          font-size: clamp(12px, 3vw, 20px);
          margin: 0;
          font-weight: 500;
          line-height: 1.2;
          flex-shrink: 0;
          text-shadow: 2px 3px 5px rgba(0,0,0,.7);
        }
        /* Collapsed to zero height by default so the title sits flush at the
           card's bottom edge, matching the other homepage carousels. On
           hover this grows to fit the caption, which pushes the title up
           from underneath rather than the title itself animating. */
        .sawo-carousel-caption-wrap {
          max-height: 0;
          overflow: hidden;
          transition: max-height .4s ease;
        }
        .sawo-carousel-caption {
          font-size: clamp(10px, 1.2vw, 14px);
          line-height: 1.4;
          opacity: 0;
          transition: opacity .3s ease;
          margin-top: 4px;
          font-weight: 400;
          text-align: left;
          text-shadow: 1px 2px 4px rgba(0,0,0,.6);
        }
        .sawo-carousel-item:hover img { transform: scale(1.08); }
        .sawo-carousel-item:hover .sawo-carousel-caption-wrap {
          max-height: 100px;
        }
        .sawo-carousel-item:hover .sawo-carousel-caption {
          opacity: 1;
        }

        /* Breakpoints intentionally match Section2/Section4's carousels
           (4 → 2 → 1) so every image card on the homepage steps down at the
           same widths. Going 4→3→2 here left these cards visibly smaller than
           the rest of the page on tablets and phones. */
        @media (max-width: 1024px) { .sawo-carousel-item { flex: 0 0 calc(50% - 20px); } }
        @media (max-width: 640px)  { .sawo-carousel-item { flex: 0 0 100%; } }
      `}</style>
    </div>
  );
};

export default Section1;
