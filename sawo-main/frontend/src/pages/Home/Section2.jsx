// src/pages/Home/Section2.jsx
import React, { useRef, useEffect, useState } from "react";
import menuPaths from "../../menuPaths";
import { afterPageLoad, prefersReducedMotion } from "../../utils/afterPageLoad";
import { useDragScroll } from "../../utils/useDragScroll";
import { useLocaleT } from "../../i18n/LocaleContext";

import Tower      from "../../assets/Home/Section2/TOWER-SERIES-2-600x360-1.webp";
import WallMounted from "../../assets/Home/Section2/WALL-MOUNTED-SERIES-v2-1.webp";
import Floor      from "../../assets/Home/Section2/FLOOR-MOUNTED-SERIES1-1024x614-1.webp";
import Combi      from "../../assets/Home/Section2/COMBI-SERIES-600x360-1.webp";
import Stone      from "../../assets/Home/Section2/STONE-SERIES-3-600x320-new-.webp";
import Dragonfire from "../../assets/Home/Section2/DRAGON-SERIES-1-600x360-1.webp";

const HEATER_KEYS = ["tower", "wallMounted", "floor", "combi", "stone", "dragonfire"];
const HEATER_HREFS = {
  tower: menuPaths.sauna.heaters.tower,
  wallMounted: menuPaths.sauna.heaters.wallMounted,
  floor: menuPaths.sauna.heaters.floor,
  combi: menuPaths.sauna.heaters.combi,
  stone: menuPaths.sauna.heaters.stone,
  dragonfire: menuPaths.sauna.heaters.dragonfire,
};
const HEATER_IMAGES = { tower: Tower, wallMounted: WallMounted, floor: Floor, combi: Combi, stone: Stone, dragonfire: Dragonfire };

/**
 * Section2 — Sauna Heaters carousel.
 */
const Section2 = () => {
  const t = useLocaleT("home");
  const tc = useLocaleT("common");
  const SAUNA_HEATERS = HEATER_KEYS.map((key) => ({
    key,
    title: t(`section2.items.${key}.title`),
    caption: t(`section2.items.${key}.caption`),
    alt: t(`section2.items.${key}.alt`),
    href: HEATER_HREFS[key],
    img: HEATER_IMAGES[key],
  }));
  const carouselRef  = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useDragScroll(carouselRef, setIsHovered);

  const loopedItems = [...SAUNA_HEATERS, ...SAUNA_HEATERS];

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let interval;
    // Defer the auto-scroll until after load + idle so Lighthouse can settle
    // the page and finalize LCP/TBT (prevents the `NO_LCP` runtime error).
    const cancelStart = afterPageLoad(() => {
      interval = setInterval(() => {
        if (carouselRef.current && !isHovered) {
          const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
          if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) {
            carouselRef.current.scrollLeft = 0;
          } else {
            carouselRef.current.scrollBy({ left: itemWidth, behavior: "smooth" });
          }
        }
      }, 3000);
    });
    return () => {
      cancelStart();
      clearInterval(interval);
    };
  }, [isHovered]);

  const scrollLeft = () => {
    if (!carouselRef.current) return;
    const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
    carouselRef.current.scrollBy({
      left: carouselRef.current.scrollLeft <= 0
        ? carouselRef.current.scrollWidth / 2
        : -itemWidth,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    if (!carouselRef.current) return;
    const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
    carouselRef.current.scrollBy({
      left: carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2
        ? -carouselRef.current.scrollWidth / 2
        : itemWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative pt-12">
      <h2
        className="text-center mb-6"
        style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500, color: "#AF8564", fontSize: "2.2rem" }}
      >
        {t("section2.heading")}
      </h2>

      <div
        className="sauna-carousel-wrapper relative flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button className="arrow left-arrow text-3xl font-bold text-gray-700 hover:text-amber-600 mr-2 z-20" onClick={scrollLeft} aria-label={tc("previous")}>&#10094;</button>

        <div className="sauna-carousel flex overflow-x-auto gap-6 scroll-smooth snap-x snap-mandatory px-2" ref={carouselRef}>
          {loopedItems.map((item, idx) => (
            <a href={item.href} key={idx} className="carousel-item relative flex-shrink-0 snap-start rounded overflow-hidden group">
              <img src={item.img} alt={item.alt} title={item.title} width="600" height="360" loading="lazy" decoding="async" className="w-full h-auto block transition-transform duration-300 ease-in-out group-hover:scale-105" />
              <div className="overlay absolute inset-0 bg-black/10 transition duration-300 group-hover:bg-black/60" />
              <div className="content absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                <div className="title text-white text-base uppercase font-semibold text-center z-10 group-hover:opacity-0 transition-opacity duration-300">{item.title}</div>
                <div className="caption absolute inset-0 flex justify-center items-center text-center text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3">{item.caption}</div>
              </div>
            </a>
          ))}
        </div>

        <button className="arrow right-arrow text-3xl font-bold text-gray-700 hover:text-yellow-900 ml-2 z-20" onClick={scrollRight} aria-label={tc("next")}>&#10095;</button>
      </div>

      <style jsx>{`
        .sauna-carousel::-webkit-scrollbar { display: none; }
        .sauna-carousel { scrollbar-width: none; cursor: grab; }
        .sauna-carousel.sawo-drag-scrolling { cursor: grabbing; }
        .sauna-carousel.sawo-drag-scrolling * { pointer-events: none; }
        /* Must match the container's px-2 padding. Without it, snap-mandatory puts
           the first snap point at scrollLeft:8px, so the browser auto-snaps on
           first layout. That scroll lands just before first paint, and Chrome
           stops reporting LCP candidates at the first scroll — giving PageSpeed
           the NO_LCP error on the homepage. */
        .sauna-carousel { scroll-padding-left: 0.5rem; }
        .carousel-item { flex: 0 0 calc((100% - 3 * 1.5rem) / 4); }
        @media (max-width: 1024px) { .carousel-item { flex: 0 0 calc((100% - 1.5rem) / 2); } }
        @media (max-width: 640px)  { .carousel-item { flex: 0 0 100%; } }
      `}</style>
    </section>
  );
};

export default Section2;
