import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  SPD_SLIDES, SPD_STORY_SECTIONS, SPD_FEATURE_TEXT, SPD_PERF_CARDS,
  SPD_ACCORDION_ITEMS, SPD_SLIDE_DELAY, SPD_LOADER_TIMEOUT,
} from "./SaunaRoomData";
import { useLocaleT } from "../../../i18n/LocaleContext";
import { isDerivedFromDefault } from "../../../i18n/translateSharedItems";

const SaunaProductDetails = ({
  slides = SPD_SLIDES,
  storySections = SPD_STORY_SECTIONS,
  featureText = SPD_FEATURE_TEXT,
  perfCards = SPD_PERF_CARDS,
  accordionItems = SPD_ACCORDION_ITEMS,
  title,
}) => {
  const t = useLocaleT("sauna");
  const resolvedTitle = title ?? t("roomsPage.productDetails.title");
  // These 4 props default to the standard-sauna English data, but
  // /infrared/saunas renders this same component with its own IR_-prefixed
  // props — only translate when the caller is using the (untranslated)
  // standard-sauna default, never a caller-supplied override. Checked via
  // isDerivedFromDefault, not `=== SPD_STORY_SECTIONS`, so this stays
  // correct even if a future caller passes a filtered/reordered subset of
  // the default (see translateSharedItems.js for why that distinction
  // matters — SaunaRoomDetails shipped with exactly this bug once already).
  const isDefault = isDerivedFromDefault(storySections, SPD_STORY_SECTIONS);
  const resolvedStorySections = isDefault
    ? t("roomsPage.productDetails.storySections", { returnObjects: true })
    : storySections;
  const resolvedFeatureText = isDefault ? t("roomsPage.productDetails.featureText") : featureText;
  const resolvedPerfCards = isDefault
    ? t("roomsPage.productDetails.perfCards", { returnObjects: true })
    : perfCards;
  const resolvedAccordionItems = isDefault
    ? t("roomsPage.productDetails.accordionItems", { returnObjects: true })
    : accordionItems;
  const [index, setIndex]                     = useState(0);
  const [loaderHidden, setLoaderHidden]       = useState(false);
  const [imagesLoaded, setImagesLoaded]       = useState(() => new Array(slides.length).fill(false));
  const [accordionOpen, setAccordionOpen]     = useState(() => new Array(accordionItems.length).fill(false));
  const timerRef      = useRef(null);
  const loadedRef     = useRef(0);
  const timerStarted  = useRef(false);

  const startTimer = useCallback(() => {
    if (timerStarted.current) return;
    timerStarted.current = true;
    timerRef.current = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      SPD_SLIDE_DELAY
    );
  }, [slides.length]);

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
        <div className="sawo-product-title">{resolvedTitle}</div>
        <hr className="sawo-divider-subtle" />

        <div className="sawo-product-story">
          <div className="sawo-product-image">
            <div className="sawo-slideshow">
              <div className={`sawo-loader${loaderHidden ? " hidden" : ""}`}>
                <div className="sawo-loader-ring"></div>
                <div className="sawo-loader-text">{t("roomsPage.productDetails.loading")}</div>
              </div>
              {slides.map((slide, i) => (
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
                {slides.map((slide, i) => (
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

          {resolvedStorySections.map((section) => (
            <div key={section.title} className="sawo-story-section">
              <div className="story-section-title">{section.title}</div>
              {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
            </div>
          ))}

          <div className="sawo-product-features">
            <p>{resolvedFeatureText}</p>
          </div>
        </div>

        <hr className="sawo-divider-subtle" />
      </div>

      <div className="sawo-performance-grid">
        <div className="performance-header">{t("roomsPage.productDetails.performanceHeader")}</div>
        <div className="performance-cards">
          {resolvedPerfCards.map((card) => (
            <div key={card.label} className="perf-card">
              <div className="perf-label">{card.label}</div>
              <div className="perf-detail">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sawo-accordion-section">
        {resolvedAccordionItems.map((item, i) => (
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
