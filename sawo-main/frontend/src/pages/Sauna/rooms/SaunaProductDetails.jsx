import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  SPD_SLIDES, SPD_STORY_SECTIONS, SPD_FEATURE_TEXT, SPD_PERF_CARDS,
  SPD_ACCORDION_ITEMS, SPD_SLIDE_DELAY, SPD_LOADER_TIMEOUT,
} from "./SaunaRoomData";

const SaunaProductDetails = () => {
  const [index, setIndex]                     = useState(0);
  const [loaderHidden, setLoaderHidden]       = useState(false);
  const [imagesLoaded, setImagesLoaded]       = useState(() => new Array(SPD_SLIDES.length).fill(false));
  const [accordionOpen, setAccordionOpen]     = useState(() => new Array(SPD_ACCORDION_ITEMS.length).fill(false));
  const timerRef      = useRef(null);
  const loadedRef     = useRef(0);
  const timerStarted  = useRef(false);

  const startTimer = useCallback(() => {
    if (timerStarted.current) return;
    timerStarted.current = true;
    timerRef.current = setInterval(
      () => setIndex((i) => (i + 1) % SPD_SLIDES.length),
      SPD_SLIDE_DELAY
    );
  }, []);

  const handleImageLoad = useCallback((idx) => {
    setImagesLoaded((prev) => { const n = [...prev]; n[idx] = true; return n; });
    loadedRef.current += 1;
    if (loadedRef.current === 1) {
      setLoaderHidden(true);
      startTimer();
    }
  }, [startTimer]);

  const handleDotClick = useCallback((idx) => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    timerStarted.current = false;
    setIndex(idx);
    startTimer();
  }, [startTimer]);

  const toggleAccordion = useCallback((idx) => {
    setAccordionOpen((prev) => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  }, []);

  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!loaderHidden) {
        setLoaderHidden(true);
        startTimer();
      }
    }, SPD_LOADER_TIMEOUT);
    return () => {
      clearTimeout(fallback);
      clearInterval(timerRef.current);
    };
  }, [loaderHidden, startTimer]);

  return (
    <div className="sawo-product-details">

      <div className="sawo-product-main">
        <div className="sawo-product-title">The Sauna You'll Actually Use Every Day</div>
        <hr className="sawo-divider-subtle" />

        <div className="sawo-product-story">
          <div className="sawo-product-image">
            <div className="sawo-slideshow">
              <div className={`sawo-loader${loaderHidden ? " hidden" : ""}`}>
                <div className="sawo-loader-ring"></div>
                <div className="sawo-loader-text">Loading</div>
              </div>
              {SPD_SLIDES.map((slide, i) => (
                <div key={slide.alt} className={`sawo-slide${index === i ? " active" : ""}`}>
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className={imagesLoaded[i] ? "loaded" : ""}
                    onLoad={() => handleImageLoad(i)}
                    onError={() => handleImageLoad(i)}
                  />
                </div>
              ))}
              <div className="sawo-slide-dots">
                {SPD_SLIDES.map((slide, i) => (
                  <button
                    key={slide.alt}
                    className={`sawo-dot${index === i ? " active" : ""}`}
                    onClick={() => handleDotClick(i)}
                    aria-label={slide.alt}
                  />
                ))}
              </div>
            </div>
          </div>

          {SPD_STORY_SECTIONS.map((section) => (
            <div key={section.title} className="sawo-story-section">
              <div className="story-section-title">{section.title}</div>
              {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
            </div>
          ))}

          <div className="sawo-product-features">
            <p>{SPD_FEATURE_TEXT}</p>
          </div>
        </div>

        <hr className="sawo-divider-subtle" />
      </div>

      <div className="sawo-performance-grid">
        <div className="performance-header">Crafted with Precision</div>
        <div className="performance-cards">
          {SPD_PERF_CARDS.map((card) => (
            <div key={card.label} className="perf-card">
              <div className="perf-label">{card.label}</div>
              <div className="perf-detail">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sawo-accordion-section">
        {SPD_ACCORDION_ITEMS.map((item, i) => (
          <div key={item.title} className={`sawo-accordion-item${accordionOpen[i] ? " active" : ""}`}>
            <button className="sawo-accordion-header" onClick={() => toggleAccordion(i)}>
              <span className="accordion-title-text">{item.title}</span>
              <span className="sawo-accordion-icon">+</span>
            </button>
            <div className="sawo-accordion-content">
              <table className="sawo-specs-table">
                <tbody>
                  {item.specs.map((s) => (
                    <tr key={s.label}>
                      <td className="spec-label">{s.label}</td>
                      <td className="spec-value">
                        {s.value}
                        {s.unit && <span className="spec-unit"> {s.unit}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SaunaProductDetails;
