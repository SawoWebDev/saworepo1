// src/pages/Section5.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import ButtonBrown from "../../components/Buttons/ButtonBrown";

// Import local images
import imgCustomizedSolutions from "../../assets/Home/Section5/Customized-Solutions_1.webp";
import imgPreventiveMaintenance from "../../assets/Home/Section5/PREVENTIVE-MAINTENANCE_1.webp";

const Section5 = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove],
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove],
  );

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleMouseUp);
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
              style={{
                fontFamily: "Montserrat, sans-serif",
                color: "#141617",
              }}
            >
              Customized Solutions
            </h2>
            <p
              className="text-lg mb-6"
              style={{
                fontFamily: "Montserrat, sans-serif",
                color: "#AF8564",
                fontWeight: 500,
              }}
            >
              Let's bring your sauna vision to life.
            </p>
            <p
              className="text-base mb-8 leading-relaxed"
              style={{
                fontFamily: "Montserrat, sans-serif",
                color: "#141617",
              }}
            >
              We craft sauna solutions tailored to your style and space. Whether
              for home or business, we've got you covered from design to
              installation to technical support.
            </p>
            <p
              className="text-base mb-8"
              style={{
                fontFamily: "Montserrat, sans-serif",
                color: "#141617",
              }}
            >
              Call us or send us a message.
            </p>
            <ButtonBrown text="INQUIRE TODAY" href="#inquire" />
          </div>

          {/* Right Image Comparison Slider */}
          <div className="w-full lg:w-1/2">
            <div
              ref={containerRef}
              className="relative w-full aspect-[4/3] overflow-hidden rounded-lg cursor-ew-resize select-none"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              {/* Background Image (Right side - Image 2) */}
              <div className="absolute inset-0">
                <img
                  src={imgCustomizedSolutions}
                  alt="Customized sauna solutions"
                  className="w-full h-full object-cover"
                  draggable="false"
                  loading="eager"
                />
              </div>

              {/* Foreground Image (Left side - Image 1) */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={imgPreventiveMaintenance}
                  alt="Preventive maintenance"
                  className="w-full h-full object-cover"
                  draggable="false"
                  loading="eager"
                />
              </div>

              {/* Slider Line and Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center gap-0.5">
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="rotate-180"
                    style={{ color: "#AF8564" }}
                  />
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    style={{ color: "#AF8564" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .container {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
      `}</style>
    </section>
  );
};

export default Section5;
