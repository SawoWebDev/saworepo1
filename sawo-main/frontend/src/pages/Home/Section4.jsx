// src/pages/Home/Section4.jsx
import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../menuPaths";

// Local images (fallbacks)
import imgPailsLadles        from "../../assets/Home/Section4/DRAGON-FIRE-PAIL-AND-LADDLE-SCENE.webp";
import imgThermometers       from "../../assets/Home/Section4/BoxType2-copy-new.webp";
import imgSandTimers         from "../../assets/Home/Section4/sand-timer-copy-new.webp";
import imgSaunaLights        from "../../assets/Home/Section4/TR-LIGHT-COVER_SCENE1-copy.webp";
import imgHeadrests          from "../../assets/Home/Section4/506-2-D.webp";
import imgDoorsHandles       from "../../assets/Home/Section4/DOORS-AND-HANDLES-copy.webp";
import imgBenches            from "../../assets/Home/Section4/siro-bench.webp";
import imgKivistone          from "../../assets/Home/Section4/R-500-D_Scene2.webp";
import imgVentilation        from "../../assets/Home/Section4/Ventilation.webp";

const DEFAULT_ACCESSORIES = [
  { title: "PAILS and LADLES",                href: menuPaths.sauna.accessories.pailsLadles,        img: imgPailsLadles,    alt: "Sauna pails and ladles" },
  { title: "THERMOMETERS and COMBINED METERS", href: menuPaths.sauna.accessories.thermometers,       img: imgThermometers,   alt: "Sauna thermometers and combined meters" },
  { title: "CLOCKS and SANDTIMERS",            href: menuPaths.sauna.accessories.clocksSandtimers,   img: imgSandTimers,     alt: "Sauna clocks and sand timers" },
  { title: "SAUNA LIGHTS and COVERS",          href: menuPaths.sauna.accessories.lightsCovers,       img: imgSaunaLights,    alt: "Sauna light covers" },
  { title: "HEADRESTS and BACKRESTS",          href: menuPaths.sauna.accessories.headrestsBackrests, img: imgHeadrests,      alt: "Sauna headrests and backrests" },
  { title: "DOORS and HANDLES",                href: menuPaths.sauna.accessories.doorsHandles,       img: imgDoorsHandles,   alt: "Sauna doors and handles" },
  { title: "BENCHES and FLOOR TILES",          href: menuPaths.sauna.accessories.benches,            img: imgBenches,        alt: "Sauna benches and floor tiles" },
  { title: "KIVISTONE",                        href: menuPaths.sauna.accessories.kivistone,          img: imgKivistone,      alt: "Kivistone sauna stones" },
  { title: "VENTILATION and ADD-ONS",          href: menuPaths.sauna.accessories.ventilations,       img: imgVentilation,    alt: "Sauna ventilation and add-ons" },
];

/**
 * Section4 — Sauna Accessories carousel.
 * CMS-editable: heading, and per-card title / image_url / alt.
 */
const Section4 = ({ content = {} }) => {
  const carouselRef  = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const heading  = content.heading || "SAUNA ACCESSORIES";
  const cmsItems = content.items   || [];

  const accessories = DEFAULT_ACCESSORIES.map((def, i) => {
    const cms = cmsItems[i] || {};
    return { ...def, title: cms.title || def.title, alt: cms.alt || def.alt, img: cms.image_url || def.img };
  });

  const loopedItems = [...accessories, ...accessories];

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current && !isHovered) {
        const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
        if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) {
          carouselRef.current.scrollLeft = 0;
        } else {
          carouselRef.current.scrollBy({ left: itemWidth, behavior: "smooth" });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
      if (carouselRef.current.scrollLeft <= 0) carouselRef.current.scrollLeft = carouselRef.current.scrollWidth / 2;
      carouselRef.current.scrollBy({ left: -itemWidth, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
      if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) carouselRef.current.scrollLeft = 0;
      carouselRef.current.scrollBy({ left: itemWidth, behavior: "smooth" });
    }
  };

  return (
    <section className="relative py-12">
      <h2
        className="text-center mb-6"
        style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500, color: "rgb(175, 133, 100)", fontSize: "35px" }}
      >
        {heading}
      </h2>

      <div className="accessories-carousel-wrapper relative flex items-center" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <button className="arrow left-arrow text-2xl font-bold text-gray-700 hover:text-amber-600 mr-2 z-20" onClick={scrollLeft}>&#10094;</button>

        <div className="accessories-carousel flex overflow-x-auto gap-6 scroll-smooth snap-x snap-mandatory px-2" ref={carouselRef}>
          {loopedItems.map((item, idx) => (
            <Link to={item.href} key={idx} className="carousel-item relative flex-shrink-0 snap-start rounded overflow-hidden group">
              <img src={item.img} alt={item.alt} title={item.title} loading="lazy" decoding="async" className="w-full h-auto block transition-transform duration-300 ease-in-out group-hover:scale-105" />
              <div className="gradient-overlay absolute bottom-0 left-0 w-full h-2/3 z-10 pointer-events-none" />
              <div className="slide-title absolute bottom-0 w-full text-center p-2 z-20" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500, color: "#fff", fontSize: "20px", lineHeight: "30px" }}>
                {item.title}
              </div>
            </Link>
          ))}
        </div>

        <button className="arrow right-arrow text-2xl font-bold text-gray-700 hover:text-yellow-700 ml-2 z-20" onClick={scrollRight}>&#10095;</button>
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
        .accessories-carousel::-webkit-scrollbar { display: none; }
        .accessories-carousel { scrollbar-width: none; }
        .gradient-overlay { background: linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0)); }
        .carousel-item { flex: 0 0 calc((100% - 3*1.5rem)/4); }
        @media (max-width: 1024px) { .carousel-item { flex: 0 0 calc((100% - 1.5rem)/2); } }
        @media (max-width: 640px)  { .carousel-item { flex: 0 0 100%; } }
      `}</style>
    </section>
  );
};

export default Section4;
