// src/pages/Home/Section2.jsx
import React, { useRef, useEffect, useState } from "react";

// Import local images
import Tower from "../../assets/Home/Section2/TOWER-SERIES-2-600x360-1.webp";
import WallMounted from "../../assets/Home/Section2/WALL-MOUNTED-SERIES-v2-1.webp";
import Floor from "../../assets/Home/Section2/FLOOR-MOUNTED-SERIES1-1024x614-1.webp";
import Combi from "../../assets/Home/Section2/COMBI-SERIES-600x360-1.webp";
import Stone from "../../assets/Home/Section2/STONE-SERIES-3-600x320-new-.webp";
import Dragonfire from "../../assets/Home/Section2/DRAGON-SERIES-1-600x360-1.webp";

const saunaHeaters = [
  {
    title: "TOWER",
    href: "https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/tower-series/",
    img: Tower,
    alt: "SAWO Tower Sauna Heater Series with elegant vertical design",
    caption:
      "Height and energy efficiency in a sleek, elegant design. Consistent warmth delivered from the lowest to the highest parts of the sauna for optimal relaxation and wellness.",
  },
  {
    title: "WALL-MOUNTED",
    href: "https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/wall-mounted-series/",
    img: WallMounted,
    alt: "SAWO Wall-Mounted Sauna Heater Series for compact sauna rooms",
    caption:
      "Space-saving and energy-efficient wall-mounted sauna heaters that generate steady, powerful heat. Sleek, modern design and superior comfort for the ultimate sauna experience.",
  },
  {
    title: "FLOOR",
    href: "https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/floor-series/",
    img: Floor,
    alt: "SAWO Floor-Mounted Sauna Heater Series for commercial saunas",
    caption:
      "Premium, highly powerful standalone heaters that provide the unbeatable combination of energy efficiency and elegant design. Ideal for commercial use.",
  },
  {
    title: "COMBI",
    href: "https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/combi-series/",
    img: Combi,
    alt: "SAWO Combi Sauna Heater Series with steam and heat combination",
    caption:
      "Versatility in one modern, energy-efficient unit. Steam and heat combined for customizable comfort, wellness, and relaxation.",
  },
  {
    title: "STONE",
    href: "https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/stone-series/",
    img: Stone,
    alt: "SAWO Stone Sauna Heater Series with stainless steel and soapstone",
    caption:
      "The perfect heater for every type of sauna: stainless steel durability, superior Finnish soapstone heat conduction, and sleek aesthetics. Modern, energy-efficient, highly comfortable saunas designed for relaxation and wellness.",
  },
  {
    title: "DRAGONFIRE",
    href: "https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/dragonfire-series/",
    img: Dragonfire,
    alt: "SAWO Dragonfire Sauna Heater Series with artistic design by Stefan Lindfors",
    caption:
      "A blend of artistic flair and cutting-edge technology designed by industrial and interior designer Stefan Lindfors. Heaters that deliver powerful, consistent heat with stylish elegance.",
  },
];

const Section2 = () => {
  const carouselRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Duplicate array for seamless loop
  const loopedItems = [...saunaHeaters, ...saunaHeaters];

  // Auto-scroll
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
    if (!carouselRef.current) return;
    const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
    carouselRef.current.scrollBy({
      left:
        carouselRef.current.scrollLeft <= 0
          ? carouselRef.current.scrollWidth / 2
          : -itemWidth,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    if (!carouselRef.current) return;
    const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
    carouselRef.current.scrollBy({
      left:
        carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2
          ? -carouselRef.current.scrollWidth / 2
          : itemWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative pt-12">
      <h2
        className="text-center mb-6"
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 500,
          color: "#AF8564",
          fontSize: "2.2rem",
        }}
      >
        SAUNA HEATERS
      </h2>

      <div
        className="sauna-carousel-wrapper relative flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Arrow */}
        <button
          className="arrow left-arrow text-3xl font-bold text-gray-700 hover:text-amber-600 mr-2 z-20"
          onClick={scrollLeft}
        >
          &#10094;
        </button>

        {/* Carousel */}
        <div
          className="sauna-carousel flex overflow-x-auto gap-6 scroll-smooth snap-x snap-mandatory px-2"
          ref={carouselRef}
        >
          {loopedItems.map((item, idx) => (
            <a
              href={item.href}
              key={idx}
              className="carousel-item relative flex-shrink-0 snap-start rounded overflow-hidden group"
            >
              <img
                src={item.img}
                alt={item.alt}
                title={item.title}
                className="w-full h-auto block transition-transform duration-300 ease-in-out group-hover:scale-105"
              />
              <div className="overlay absolute inset-0 bg-black/10 transition duration-300 group-hover:bg-black/60"></div>
              <div className="content absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                <div className="title text-white text-base uppercase font-semibold text-center z-10 group-hover:opacity-0 transition-opacity duration-300">
                  {item.title}
                </div>
                <div className="caption absolute inset-0 flex justify-center items-center text-center text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3">
                  {item.caption}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          className="arrow right-arrow text-3xl font-bold text-gray-700 hover:text-yellow-900 ml-2 z-20"
          onClick={scrollRight}
        >
          &#10095;
        </button>
      </div>

      <style jsx>{`
        .sauna-carousel::-webkit-scrollbar {
          display: none;
        }
        .sauna-carousel {
          scrollbar-width: none;
        }

        /* Desktop: 4 cards */
        .carousel-item {
          flex: 0 0 calc((100% - 3 * 1.5rem) / 4);
        }

        /* Tablet: 2 cards */
        @media (max-width: 1024px) {
          .carousel-item {
            flex: 0 0 calc((100% - 1.5rem) / 2);
          }
        }

        /* Mobile: 1 card */
        @media (max-width: 640px) {
          .carousel-item {
            flex: 0 0 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default Section2;

