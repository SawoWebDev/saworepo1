import React, { useState, useEffect, useCallback, useRef } from "react";
import { SRD_PANELS, SRD_AUTO_DELAY } from "./SaunaRoomData";

const SaunaRoomDetails = () => {
  const [srdIndex, setSrdIndex] = useState(0);
  const srdTimerRef = useRef(null);

  const srdStopTimer = useCallback(() => {
    clearInterval(srdTimerRef.current);
    srdTimerRef.current = null;
  }, []);

  const srdStartTimer = useCallback(() => {
    srdStopTimer();
    srdTimerRef.current = setInterval(
      () => setSrdIndex((i) => (i + 1) % SRD_PANELS.length),
      SRD_AUTO_DELAY
    );
  }, [srdStopTimer]);

  const srdGoTo = useCallback((idx) => {
    setSrdIndex(((idx % SRD_PANELS.length) + SRD_PANELS.length) % SRD_PANELS.length);
    srdStopTimer();
    srdStartTimer();
  }, [srdStopTimer, srdStartTimer]);

  useEffect(() => {
    srdStartTimer();
    return () => srdStopTimer();
  }, [srdStartTimer, srdStopTimer]);

  return (
    <div className="srd">
      <div className="srd-inner">

        <div
          className="srd-nav"
          onMouseEnter={srdStopTimer}
          onMouseLeave={srdStartTimer}
        >
          <button className="srd-nav-arrow" onClick={() => srdGoTo(srdIndex - 1)} aria-label="Previous">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7L7 13" stroke="#af8564" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="srd-nav-pills">
            {SRD_PANELS.map((panel, i) => (
              <button
                key={panel.pill}
                className={`srd-nav-pill${srdIndex === i ? " active" : ""}`}
                onClick={() => srdGoTo(i)}
              >
                {panel.pill}
              </button>
            ))}
          </div>

          <button className="srd-nav-arrow" onClick={() => srdGoTo(srdIndex + 1)} aria-label="Next">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1L7 7L1 13" stroke="#af8564" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="srd-panels">
          {SRD_PANELS.map((panel, i) => (
            <div key={panel.pill} className={`srd-panel${srdIndex === i ? " active" : ""}`}>
              <div>
                <div className="srd-label">{panel.label}</div>
                <div className="srd-title">{panel.title}</div>
                {panel.descriptions.map((d, j) => (
                  <p key={j} className="srd-desc">{d}</p>
                ))}
                <ul className="srd-features">
                  {panel.features.map((f) => (
                    <li key={f}>
                      <span className="ico">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" stroke="#fff" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="srd-img-wrap">
                <img src={panel.image} alt={panel.imageAlt} />
              </div>
            </div>
          ))}
        </div>

        <div className="srd-counter">{srdIndex + 1} / {SRD_PANELS.length}</div>

      </div>
    </div>
  );
};

export default SaunaRoomDetails;
