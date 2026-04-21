// src/pages/Hero.jsx
import React, { useEffect, useRef } from "react";
import ButtonClear from "../../components/Buttons/ButtonClear";

const sentences = [
  "a rejuvenating escape",
  "wellness with ancient tradition",
  "an authentic Finnish sauna",
];

const Hero = () => {
  const typewriterRef = useRef(null);

  useEffect(() => {
    const el = typewriterRef.current;
    if (!el) return;

    let n = 0; // sentence index
    let i = 0; // character index
    let isTyping = true;
    let spans = [];
    let timeout;

    function setupSentence() {
      const current = sentences[n];
      if (!el) return;
      el.innerHTML = current
        .split("")
        .map((char) => `<span>${char}</span>`)
        .join("");
      spans = el.querySelectorAll("span");
      i = 0;
      isTyping = true;
    }

    function animate() {
      if (!el) return;
      if (isTyping) {
        if (i < spans.length) {
          spans[i].style.opacity = 1;
          i++;
          timeout = setTimeout(animate, 70); // faster typing
        } else {
          isTyping = false;
          timeout = setTimeout(animate, 900); // pause at sentence end
        }
      } else {
        if (i > 0) {
          i--;
          spans[i].style.opacity = 0;
          timeout = setTimeout(animate, 50); // faster deleting
        } else {
          n = (n + 1) % sentences.length;
          setupSentence();
          timeout = setTimeout(animate, 500); // short pause before next
        }
      }
    }

    // Slight delay to ensure hero image paints first
    const start = setTimeout(() => {
      setupSentence();
      animate();
    }, 300);

    return () => {
      clearTimeout(timeout);
      clearTimeout(start);
    };
  }, []);

  return (
    <section className="sauna-unique relative w-full min-h-[95vh] flex flex-col justify-center px-5 md:px-10 overflow-hidden">
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
            src="/1920.webp"
            alt="SAWO sauna heaters - Experience wellness and rejuvenation"
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

      <div className="sr-only">
        a rejuvenating escape, wellness with ancient tradition, an authentic
        Finnish sauna, SAWO sauna heaters, Finnish sauna, sauna accessories,
        infrared sauna, steam generator
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
        ></div>

        <ButtonClear
          text="VIEW CATALOGUE"
          href="https://www.sawo.com/wp-content/uploads/2025/10/SAWO-Product-Catalogue-2025.pdf"
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
