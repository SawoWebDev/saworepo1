import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SFW_ITEMS, SFW_AUTO_DELAY, SFW_RESUME_DELAY, wrapIndex } from "./SaunaRoomData";
import { useLocaleT } from "../../../i18n/LocaleContext";
import { translateSharedItems } from "../../../i18n/translateSharedItems";

// SFW_ITEMS (SaunaRoomData.jsx) only has one consumer today (see
// /sauna/rooms, always the untranslated default) — routed through
// translateSharedItems anyway, on the same reasoning as SaunaRoomDetails:
// a future caller passing SFW_ITEMS.filter(...)/.slice(...) should still
// translate correctly instead of silently rendering English, or landing
// the wrong tab's copy on the wrong image.
const SFW_KEYS = ["ventilation", "lighting", "benchHeight", "excellentHeat", "roomSizes", "insulation"];

const SaunaFeatures = ({ items = SFW_ITEMS, heading }) => {
  const t = useLocaleT("sauna");
  const tc = useLocaleT("common");
  const resolvedHeading = heading ?? t("roomsPage.features.heading");
  const translatedItems = useMemo(
    () => translateSharedItems(items, SFW_ITEMS, SFW_KEYS, (item, key) => {
      const tr = t(`roomsPage.features.items.${key}`, { returnObjects: true });
      return { ...item, tab: tr.tab, title: tr.title, paragraphs: tr.paragraphs, specs: tr.specs || item.specs };
    }),
    [items, t]
  );
  const [index, setIndex] = useState(0);
  const autoRef   = useRef(null);
  const resumeRef = useRef(null);

  const stopAuto = useCallback(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    autoRef.current = setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      SFW_AUTO_DELAY
    );
  }, [stopAuto, items.length]);

  const goTo = useCallback((idx) => {
    setIndex(wrapIndex(idx, items.length));
    stopAuto();
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(startAuto, SFW_RESUME_DELAY);
  }, [stopAuto, startAuto, items.length]);

  useEffect(() => {
    startAuto();
    return () => {
      stopAuto();
      if (resumeRef.current) clearTimeout(resumeRef.current);
    };
  }, [startAuto, stopAuto]);

  return (
    <div
      className="sfw"
      onMouseEnter={stopAuto}
      onMouseLeave={startAuto}
    >
      <div className="sfw-inner">
        <div className="sfw-heading">{resolvedHeading}</div>

        <div className="sfw-tabs">
          {translatedItems.map((item, i) => (
            <button
              key={item.tab}
              className={`sfw-tab${index === i ? " active" : ""}`}
              onClick={() => goTo(i)}
            >
              <span className="sfw-chk">
                <svg viewBox="0 0 12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              </span>
              {item.tab}
            </button>
          ))}
        </div>

        <div className="sfw-body">
          <div className="sfw-carousel">
            <div className="sfw-slides">
              {translatedItems.map((item, i) => (
                <div key={item.tab} className={`sfw-slide${index === i ? " active" : ""}`}>
                  <img src={item.image} alt={item.tab} />
                </div>
              ))}
            </div>

            <button className="sfw-arr sfw-arr-prev" onClick={() => goTo(index - 1)} aria-label={tc("previous")}>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7L7 13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="sfw-arr sfw-arr-next" onClick={() => goTo(index + 1)} aria-label={tc("next")}>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1L7 7L1 13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="sfw-dots">
              {translatedItems.map((item, i) => (
                <button
                  key={item.tab}
                  className={`sfw-dot${index === i ? " active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={item.tab}
                />
              ))}
            </div>
          </div>

          <div className="sfw-content">
            {translatedItems.map((item, i) => (
              <div key={item.tab} className={`sfw-pane${index === i ? " active" : ""}`}>
                <div className="sfw-pane-title">{item.title}</div>
                {item.paragraphs.map((p, j) => (
                  <div key={j} className="sfw-pane-text">{p}</div>
                ))}
                {item.specs && (
                  <div className="sfw-specs">
                    {item.specs.map((s) => (
                      <div key={s.key} className="sfw-spec-row">
                        <div className="sfw-spec-key">{s.key}</div>
                        <div className="sfw-spec-val">
                          {s.val}
                          {s.note && <span className="sfw-spec-note"> {s.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaunaFeatures;
