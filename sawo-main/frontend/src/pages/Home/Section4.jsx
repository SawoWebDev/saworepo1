// src/pages/Home/Section4.jsx
import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../menuPaths";
import ChevronRight from "../../components/icons/ChevronRight";
import useDragCarousel from "../../hooks/useDragCarousel";

import imgPailsLadles        from "../../assets/Home/Section4/DRAGON-FIRE-PAIL-AND-LADDLE-SCENE.webp";
import imgThermometers       from "../../assets/Home/Section4/BoxType2-copy-new.webp";
import imgSandTimers         from "../../assets/Home/Section4/sand-timer-copy-new.webp";
import imgSaunaLights        from "../../assets/Home/Section4/TR-LIGHT-COVER_SCENE1-copy.webp";
import imgHeadrests          from "../../assets/Home/Section4/506-2-D.webp";
import imgDoorsHandles       from "../../assets/Home/Section4/DOORS-AND-HANDLES-copy.webp";
import imgBenches            from "../../assets/Home/Section4/siro-bench.webp";
import imgKivistone          from "../../assets/Home/Section4/R-500-D_Scene2.webp";
import imgVentilation        from "../../assets/Home/Section4/Ventilation.webp";

const ACCESSORIES = [
  { title: "Pails and Ladles",                href: menuPaths.sauna.accessories.pailsLadles,        img: imgPailsLadles,    alt: "Sauna pails and ladles" },
  { title: "Thermometers and Combined Meters", href: menuPaths.sauna.accessories.thermometers,       img: imgThermometers,   alt: "Sauna thermometers and combined meters" },
  { title: "Clocks and Sandtimers",            href: menuPaths.sauna.accessories.clocksSandtimers,   img: imgSandTimers,     alt: "Sauna clocks and sand timers" },
  { title: "Sauna Lights and Covers",          href: menuPaths.sauna.accessories.lightsCovers,       img: imgSaunaLights,    alt: "Sauna light covers" },
  { title: "Headrests and Backrests",          href: menuPaths.sauna.accessories.headrestsBackrests, img: imgHeadrests,      alt: "Sauna headrests and backrests" },
  { title: "Doors and Handles",                href: menuPaths.sauna.accessories.doorsHandles,       img: imgDoorsHandles,   alt: "Sauna doors and handles" },
  { title: "Benches and Floor Tiles",          href: menuPaths.sauna.accessories.benches,            img: imgBenches,        alt: "Sauna benches and floor tiles" },
  { title: "Kivistone",                        href: menuPaths.sauna.accessories.kivistone,          img: imgKivistone,      alt: "Kivistone sauna stones" },
  { title: "Ventilation and Add-ons",          href: menuPaths.sauna.accessories.ventilations,       img: imgVentilation,    alt: "Sauna ventilation and add-ons" },
];

/**
 * Section4 — Sauna Accessories carousel. Loop + drag behaviour lives in
 * useDragCarousel (shared with Section2's Sauna Heaters carousel).
 */
const Section4 = () => {
  const { trackRef, setHovered, scrollByItem, dragHandlers } = useDragCarousel({ autoplayMs: 3000 });

  const loopedItems = [...ACCESSORIES, ...ACCESSORIES, ...ACCESSORIES];

  return (
    <section className="relative py-12">
      <h2
        className="text-center mb-6"
        style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500, color: "rgb(175, 133, 100)", fontSize: "35px" }}
      >
        SAUNA ACCESSORIES
      </h2>

      <div className="accessories-viewport relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <button
          className="accessories-nav accessories-nav-left absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center w-9 h-9 text-2xl drop-shadow-md"
          style={{ color: "#fff", transition: "color 0.3s ease" }}
          onMouseEnter={e => e.currentTarget.style.color = "#836450"}
          onMouseLeave={e => e.currentTarget.style.color = "#fff"}
          onClick={() => scrollByItem(-1)}
        ><ChevronRight style={{ transform: "rotate(180deg)" }} /></button>

        <div
          className="accessories-track flex overflow-x-auto gap-6 snap-x snap-mandatory px-2"
          ref={trackRef}
          {...dragHandlers}
        >
          {loopedItems.map((item, idx) => (
            <Link to={item.href} key={idx} draggable={false} className="accessories-slide relative flex-shrink-0 snap-start rounded overflow-hidden group">
              <img src={item.img} alt={item.alt} title={item.title} width="400" height="400" loading="lazy" decoding="async" draggable={false} className="w-full h-auto block transition-transform duration-300 ease-in-out group-hover:scale-105" />
              <div className="accessories-slide-overlay absolute bottom-0 left-0 w-full h-2/3 z-10 pointer-events-none" />
              <div className="accessories-slide-title absolute bottom-0 w-full text-center p-2 z-20" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500, color: "#fff", fontSize: "20px", lineHeight: "30px" }}>
                {item.title}
              </div>
            </Link>
          ))}
        </div>

        <button
          className="accessories-nav accessories-nav-right absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center w-9 h-9 text-2xl drop-shadow-md"
          style={{ color: "#fff", transition: "color 0.3s ease" }}
          onMouseEnter={e => e.currentTarget.style.color = "#836450"}
          onMouseLeave={e => e.currentTarget.style.color = "#fff"}
          onClick={() => scrollByItem(1)}
        ><ChevronRight /></button>
      </div>

      <div className="text-center mt-6">
        <Link
          to={menuPaths.sauna.accessories.parent}
          style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500, fontSize: "15px", lineHeight: "27px", color: "#333333", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", transition: "color 0.3s ease" }}
          onMouseEnter={e => e.currentTarget.style.color = "#af8564"}
          onMouseLeave={e => e.currentTarget.style.color = "#333333"}
        >
          Explore More &#8250;
        </Link>
      </div>

      <style jsx>{`
        .accessories-track::-webkit-scrollbar { display: none; }
        .accessories-track { scrollbar-width: none; }
        /* Must match the container's px-2 padding. Without it, snap-mandatory puts
           the first snap point at scrollLeft:8px, so the browser auto-snaps on
           first layout. That scroll lands just before first paint, and Chrome
           stops reporting LCP candidates at the first scroll — giving PageSpeed
           the NO_LCP error on the homepage. */
        .accessories-track { scroll-padding-left: 0.5rem; cursor: grab; }
        .accessories-track.is-dragging { cursor: grabbing; scroll-snap-type: none; user-select: none; }
        .accessories-track img { -webkit-user-drag: none; user-drag: none; }
        .accessories-slide-overlay { background: linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0)); }
        .accessories-slide { flex: 0 0 calc((100% - 3*1.5rem)/4); }
        @media (max-width: 1024px) { .accessories-slide { flex: 0 0 calc((100% - 1.5rem)/2); } }
        @media (max-width: 640px)  { .accessories-slide { flex: 0 0 100%; } }
      `}</style>
    </section>
  );
};

export default Section4;
