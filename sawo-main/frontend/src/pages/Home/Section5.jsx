// src/pages/Section5.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import ChevronRight from "../../components/icons/ChevronRight";
import ButtonBrown from "../../components/Buttons/ButtonBrown";
import menuPaths from "../../menuPaths";

import imgCustomizedSolutions   from "../../assets/Home/Section5/Customized-Solutions_1.webp";
import imgPreventiveMaintenance from "../../assets/Home/Section5/PREVENTIVE-MAINTENANCE_1.webp";

const HEADING     = "Customized Solutions";
const SUBTITLE    = "Let's bring your sauna vision to life.";
const BODY1       = "We craft sauna solutions tailored to your style and space. Whether for home or business, we've got you covered from design to installation to technical support.";
const BODY2       = "Call us or send us a message.";
const BUTTON_TEXT = "INQUIRE TODAY";

/**
 * Section5 — Customized Solutions with image comparison slider.
 */
const Section5 = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging,     setIsDragging]     = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect       = containerRef.current.getBoundingClientRect();
    const x          = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp   = () => setIsDragging(false);

  const handleMouseMove = useCallback((e) => { if (isDragging) handleMove(e.clientX); }, [isDragging, handleMove]);
  const handleTouchMove = useCallback((e) => { if (isDragging) handleMove(e.touches[0].clientX); }, [isDragging, handleMove]);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup",   handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend",  handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup",   handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend",  handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="w-full lg:w-1/2 lg:pr-8">
            <h2
              className="text-4xl lg:text-5xl font-medium mb-4"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#141617" }}
            >
              {HEADING}
            </h2>
            <p
              className="text-lg mb-6"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#916e53", fontWeight: 500 }}
            >
              {SUBTITLE}
            </p>
            <p
              className="text-base mb-8 leading-relaxed"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#141617" }}
            >
              {BODY1}
            </p>
            <p
              className="text-base mb-8"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#141617" }}
            >
              {BODY2}
            </p>
            <ButtonBrown text={BUTTON_TEXT} href={menuPaths.contact} />
          </div>

          {/* Right Image Comparison Slider */}
          <div className="w-full lg:w-1/2">
            <div
              ref={containerRef}
              className="relative w-full aspect-[4/3] overflow-hidden rounded-lg cursor-ew-resize select-none"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              {/* Background Image (always visible — right side) */}
              <div className="absolute inset-0">
                <img
                  src={imgCustomizedSolutions}
                  alt="Sauna customized solutions"
                  className="w-full h-full object-cover"
                  draggable="false"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Foreground Image (clipped — left side) */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={imgPreventiveMaintenance}
                  alt="Preventive maintenance"
                  className="w-full h-full object-cover"
                  draggable="false"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Slider Line and Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center gap-0.5">
                  <ChevronRight className="rotate-180" style={{ color: "#AF8564" }} />
                  <ChevronRight style={{ color: "#AF8564" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) { .container { padding-left: 1.5rem; padding-right: 1.5rem; } }
      `}</style>
    </section>
  );
};

export default Section5;
