import React, { useState, useEffect, useCallback, useRef } from "react";
import { SFW_ITEMS, SFW_AUTO_DELAY, SFW_RESUME_DELAY } from "./SaunaRoomData";

const SaunaFeatures = () => {
  const [sfwIndex, setSfwIndex] = useState(0);
  const sfwAutoRef   = useRef(null);
  const sfwResumeRef = useRef(null);

  const sfwStopAuto = useCallback(() => {
    if (sfwAutoRef.current) { clearInterval(sfwAutoRef.current); sfwAutoRef.current = null; }
  }, []);

  const sfwStartAuto = useCallback(() => {
    sfwStopAuto();
    sfwAutoRef.current = setInterval(
      () => setSfwIndex((i) => (i + 1) % SFW_ITEMS.length),
      SFW_AUTO_DELAY
    );
  }, [sfwStopAuto]);

  const sfwGoTo = useCallback((idx) => {
    setSfwIndex(((idx % SFW_ITEMS.length) + SFW_ITEMS.length) % SFW_ITEMS.length);
    sfwStopAuto();
    if (sfwResumeRef.current) clearTimeout(sfwResumeRef.current);
    sfwResumeRef.current = setTimeout(sfwStartAuto, SFW_RESUME_DELAY);
  }, [sfwStopAuto, sfwStartAuto]);

  useEffect(() => {
    sfwStartAuto();
    return () => {
      sfwStopAuto();
      if (sfwResumeRef.current) clearTimeout(sfwResumeRef.current);
    };
  }, [sfwStartAuto, sfwStopAuto]);

  return (
    <div
      className="sfw"
      onMouseEnter={sfwStopAuto}
      onMouseLeave={sfwStartAuto}
    >
      <div className="sfw-inner">
        <div className="sfw-heading">What Makes Our Sauna Different</div>

        <div className="sfw-tabs">
          {SFW_ITEMS.map((item, i) => (
            <button
              key={item.tab}
              className={`sfw-tab${sfwIndex === i ? " active" : ""}`}
              onClick={() => sfwGoTo(i)}
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
              {SFW_ITEMS.map((item, i) => (
                <div key={item.tab} className={`sfw-slide${sfwIndex === i ? " active" : ""}`}>
                  <img src={item.image} alt={item.tab} />
                </div>
              ))}
            </div>

            <button className="sfw-arr sfw-arr-prev" onClick={() => sfwGoTo(sfwIndex - 1)} aria-label="Previous">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7L7 13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="sfw-arr sfw-arr-next" onClick={() => sfwGoTo(sfwIndex + 1)} aria-label="Next">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1L7 7L1 13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="sfw-dots">
              {SFW_ITEMS.map((item, i) => (
                <button
                  key={item.tab}
                  className={`sfw-dot${sfwIndex === i ? " active" : ""}`}
                  onClick={() => sfwGoTo(i)}
                  aria-label={item.tab}
                />
              ))}
            </div>
          </div>

          <div className="sfw-content">
            {SFW_ITEMS.map((item, i) => (
              <div key={item.tab} className={`sfw-pane${sfwIndex === i ? " active" : ""}`}>
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
