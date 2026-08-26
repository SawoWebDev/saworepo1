// src/pages/Home/Section2.jsx
import React from "react";
import menuPaths from "../../menuPaths";
import ChevronRight from "../../components/icons/ChevronRight";
import useDragCarousel from "../../hooks/useDragCarousel";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

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
 * Section2 — Sauna Heaters carousel. Loop + drag behaviour lives in
 * useDragCarousel (shared with Section4's Sauna Accessories carousel).
 */
const Section2 = () => {
  const t = useLocaleT("home");
  const localize = useLocalizedPath();
  const tc = useLocaleT("common");
  const SAUNA_HEATERS = HEATER_KEYS.map((key) => ({
    key,
    title: t(`section2.items.${key}.title`),
    caption: t(`section2.items.${key}.caption`),
    alt: t(`section2.items.${key}.alt`),
    href: HEATER_HREFS[key],
    img: HEATER_IMAGES[key],
  }));
  const { trackRef, setHovered, scrollByItem, dragHandlers } = useDragCarousel({ autoplayMs: 3000 });

  const loopedItems = [...SAUNA_HEATERS, ...SAUNA_HEATERS, ...SAUNA_HEATERS];

  return (
    <section className="relative pt-12">
      <h2
        className="text-center mb-6"
        style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500, color: "#AF8564", fontSize: "2.2rem" }}
      >
        {t("section2.heading")}
      </h2>

      <div
        className="heaters-viewport relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          className="heaters-nav heaters-nav-left absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center w-9 h-9 text-2xl drop-shadow-md"
          style={{ color: "#af8564", transition: "color 0.3s ease" }}
          onMouseEnter={e => e.currentTarget.style.color = "#836450"}
          onMouseLeave={e => e.currentTarget.style.color = "#af8564"}
          onClick={() => scrollByItem(-1)}
          aria-label={tc("previous")}
        ><ChevronRight style={{ transform: "rotate(180deg)" }} /></button>

        <div
          className="heaters-track flex overflow-x-auto gap-6 snap-x snap-mandatory px-2"
          ref={trackRef}
          {...dragHandlers}
        >
          {loopedItems.map((item, idx) => (
            <a href={localize(item.href)} key={idx} draggable={false} className="heaters-slide relative flex-shrink-0 snap-start rounded overflow-hidden group">
              <img src={item.img} alt={item.alt} title={item.title} width="600" height="360" loading="lazy" decoding="async" draggable={false} className="w-full h-auto block transition-transform duration-300 ease-in-out group-hover:scale-105" />
              <div className="heaters-slide-overlay absolute inset-0 transition duration-300 group-hover:bg-black/60" />
              <div className="heaters-slide-content absolute inset-0 flex flex-col justify-end p-4 pointer-events-none">
                <div className="heaters-slide-title text-white text-center z-10 group-hover:opacity-0 transition-opacity duration-300">{item.title}</div>
                <div className="heaters-slide-caption absolute inset-0 flex justify-center items-center text-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3">{item.caption}</div>
              </div>
            </a>
          ))}
        </div>

        <button
          className="heaters-nav heaters-nav-right absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center w-9 h-9 text-2xl drop-shadow-md"
          style={{ color: "#af8564", transition: "color 0.3s ease" }}
          onMouseEnter={e => e.currentTarget.style.color = "#836450"}
          onMouseLeave={e => e.currentTarget.style.color = "#af8564"}
          onClick={() => scrollByItem(1)}
          aria-label={tc("next")}
        ><ChevronRight /></button>
      </div>

      <style jsx>{`
        .heaters-track::-webkit-scrollbar { display: none; }
        .heaters-track { scrollbar-width: none; }
        /* Must match the container's px-2 padding. Without it, snap-mandatory puts
           the first snap point at scrollLeft:8px, so the browser auto-snaps on
           first layout. That scroll lands just before first paint, and Chrome
           stops reporting LCP candidates at the first scroll — giving PageSpeed
           the NO_LCP error on the homepage. */
        .heaters-track { scroll-padding-left: 0.5rem; cursor: grab; }
        .heaters-track.is-dragging { cursor: grabbing; scroll-snap-type: none; user-select: none; }
        .heaters-track img { -webkit-user-drag: none; user-drag: none; }
        .heaters-slide { flex: 0 0 calc((100% - 2 * 1.5rem) / 3); }
        @media (max-width: 1024px) { .heaters-slide { flex: 0 0 calc((100% - 1.5rem) / 2); } }
        @media (max-width: 640px)  { .heaters-slide { flex: 0 0 100%; } }
        .heaters-slide-title { font-size: clamp(14px, 2vw, 20px); font-weight: 500; }
        .heaters-slide-caption { font-size: 16px; }
        .heaters-slide-content {
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.85) 0%,
            rgba(0, 0, 0, 0.45) 18%,
            rgba(0, 0, 0, 0.15) 35%,
            rgba(0, 0, 0, 0.03) 50%,
            rgba(0, 0, 0, 0) 65%
          );
        }
      `}</style>
    </section>
  );
};

export default Section2;
