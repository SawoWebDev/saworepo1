import { useState, useEffect, useRef, useCallback } from "react";

const defaultFeatures = [
  { id: 1, title: "User-Friendly Controls",  description: "Easily adjust temperature and time settings.",                                        icon: "fa-sliders" },
  { id: 2, title: "Efficient Heating",        description: "Quick and consistent heat distribution for a relaxing sauna experience.",             icon: "fa-fire" },
  { id: 3, title: "Energy Efficient",         description: "Consumes less power for optimal heat.",                                               icon: "fa-bolt" },
  { id: 4, title: "Safety Features",          description: "Overheat protection and automatic shut-off for safe use.",                            icon: "fa-shield" },
  { id: 5, title: "Durable Construction",     description: "High-quality materials ensure long-lasting performance.",                             icon: "fa-hammer" },
];

function EnergyLine({ x1, y1, isActive }) {
  const CX = 50, CY = 50;
  const dots = [0, 0.33, 0.66];
  return (
    <g>
      <line
        x1={`${x1}%`} y1={`${y1}%`} x2={`${CX}%`} y2={`${CY}%`}
        stroke={isActive ? "url(#lineGradActive)" : "url(#lineGradInactive)"}
        strokeWidth={isActive ? "0.7" : "0.4"}
        strokeLinecap="round"
        style={{ transition: "stroke 0.5s, stroke-width 0.5s" }}
      />
      {isActive && dots.map((offset, k) => (
        <circle key={k} r="0.9" fill="#af8564" opacity="0.9">
          <animateMotion
            dur="1.6s"
            repeatCount="indefinite"
            begin={`${offset * 1.6}s`}
            path={`M ${x1},${y1} L ${CX},${CY}`}
          />
          <animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite" begin={`${offset * 1.6}s`} />
        </circle>
      ))}
    </g>
  );
}

export default function CirclesInfo({ features = defaultFeatures, rotationSpeed = 22 }) {
  const count = features.length;
  const angleRef = useRef(0);
  const [angleDeg, setAngleDeg] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const isPausedRef = useRef(false);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Track window width for responsive behavior
  const [screenW, setScreenW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setScreenW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ≥768 → desktop (wide orbit), 560–767 → tablet (tight orbit), <560 → mobile list
  const isDesktop = screenW >= 768;
  const isMobile  = screenW < 560;
  const RADIUS     = isDesktop ? 43 : 33;

  const getActiveFromAngle = useCallback((angle) => {
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < count; i++) {
      const base = (360 / count) * i;
      const cur  = (base + angle) % 360;
      const dist = Math.min(Math.abs(cur - 270), 360 - Math.abs(cur - 270));
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best;
  }, [count]);

  useEffect(() => {
    const degsPerMs = 360 / (rotationSpeed * 1000);
    const tick = (ts) => {
      if (!isPausedRef.current) {
        if (lastTimeRef.current !== null) {
          const delta = ts - lastTimeRef.current;
          angleRef.current = (angleRef.current + delta * degsPerMs) % 360;
          setAngleDeg(angleRef.current);
          const na = getActiveFromAngle(angleRef.current);
          setActiveIdx(prev => { if (prev !== na) { setAnimKey(k => k + 1); return na; } return prev; });
        }
        lastTimeRef.current = ts;
      } else { lastTimeRef.current = null; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rotationSpeed, getActiveFromAngle]);

  const handleEnter = (i) => { isPausedRef.current = true; setHoveredIdx(i); setActiveIdx(i); setAnimKey(k => k + 1); };
  const handleLeave = () => { isPausedRef.current = false; setHoveredIdx(null); };

  const displayIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;

  const getPos = (i, angle) => {
    const deg = (360 / count) * i + angle;
    const rad = (deg * Math.PI) / 180;
    return {
      left: `${50 + RADIUS * Math.sin(rad)}%`,
      top:  `${50 - RADIUS * Math.cos(rad)}%`,
      lx:    50 + RADIUS * Math.sin(rad),
      ly:    50 - RADIUS * Math.cos(rad),
    };
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet" />

      <style>{`
        .ci-root {
          font-family: 'Montserrat', sans-serif;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          min-height: 520px;
        }

        /* Stage: full on desktop, compact on tablet */
        .ci-stage {
          position: relative;
          width: min(520px, 90vw);
          aspect-ratio: 1;
        }
        @media (max-width: 767px) {
          .ci-stage { width: min(360px, 90vw); }
          .ci-root  { min-height: unset; padding: 40px 16px; }
        }

        .ci-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }

        /* Center circle */
        .ci-center {
          position: absolute;
          inset: 24%;
          border-radius: 50%;
          background: #af8564;
          box-shadow: 0 8px 32px rgba(100, 70, 40, 0.18);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12%;
          text-align: center;
          overflow: hidden;
          z-index: 1;
        }
        /* On tablet, expand center since icons are closer in */
        @media (max-width: 767px) {
          .ci-center { inset: 20%; padding: 10%; }
        }

        .ci-center-title {
          position: relative;
          color: #fff;
          font-size: clamp(0.72rem, 2vw, 0.95rem);
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 0.45rem;
          line-height: 1.2;
        }
        .ci-center-desc {
          position: relative;
          color: rgba(255, 235, 220, 0.85);
          font-size: clamp(0.58rem, 1.3vw, 0.68rem);
          font-weight: 300;
          line-height: 1.7;
        }

        @keyframes ci-fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ci-anim { animation: ci-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }

        /* Icon buttons */
        .ci-icon-btn {
          position: absolute;
          width: clamp(58px, 13vw, 74px);
          height: clamp(58px, 13vw, 74px);
          border-radius: 50%;
          border: none;
          background: #c9a48a;
          box-shadow: 0 4px 14px rgba(100, 70, 40, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform: translate(-50%, -50%);
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s, background 0.35s;
          color: #fff;
          font-size: clamp(1.15rem, 2.8vw, 1.4rem);
          outline: none;
          z-index: 3;
        }
        @media (max-width: 767px) {
          .ci-icon-btn {
            width: clamp(44px, 10vw, 54px);
            height: clamp(44px, 10vw, 54px);
            font-size: clamp(0.9rem, 2vw, 1.05rem);
          }
        }

        .ci-icon-btn:hover,
        .ci-icon-btn.active {
          background: #af8564;
          box-shadow:
            0 0 0 5px rgba(175, 133, 100, 0.18),
            0 8px 24px rgba(100, 70, 40, 0.28);
          color: #fff;
          transform: translate(-50%, -50%) scale(1.22) translateY(-2px);
        }

        @keyframes ci-orb-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(175,133,100,0.45), 0 8px 24px rgba(100,70,40,0.28); }
          70%  { box-shadow: 0 0 0 14px rgba(175,133,100,0),   0 8px 24px rgba(100,70,40,0.28); }
          100% { box-shadow: 0 0 0 0   rgba(175,133,100,0),   0 8px 24px rgba(100,70,40,0.28); }
        }
        .ci-icon-btn.active { animation: ci-orb-pulse 2.2s ease-out infinite; }

        .ci-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          background: #af8564;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.56rem;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          padding: 5px 11px;
          border-radius: 20px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
          box-shadow: 0 3px 12px rgba(100, 70, 40, 0.2);
        }
        .ci-icon-btn:hover .ci-tooltip { opacity: 1; }

        /* Mobile list */
        .ci-mobile {
          flex-direction: column;
          align-items: center;
          gap: 1.8rem;
          width: 100%;
          max-width: 380px;
        }
        .ci-mobile-center {
          width: min(230px, 72vw);
          aspect-ratio: 1;
          border-radius: 50%;
          background: #af8564;
          box-shadow: 0 8px 28px rgba(100, 70, 40, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 13%;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .ci-mobile-icons { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
        .ci-mobile-icon-btn {
          width: 60px; height: 60px;
          border-radius: 50%;
          border: none;
          background: #c9a48a;
          box-shadow: 0 4px 12px rgba(100, 70, 40, 0.15);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #fff;
          font-size: 1.2rem;
          transition: all 0.3s;
          outline: none;
        }
        .ci-mobile-icon-btn.active, .ci-mobile-icon-btn:hover {
          background: #af8564;
          box-shadow: 0 0 0 4px rgba(175,133,100,0.18), 0 8px 20px rgba(100,70,40,0.25);
          transform: scale(1.14) translateY(-2px);
        }
      `}</style>

      <div className="ci-root">
        {/* Orbit stage — desktop & tablet */}
        {!isMobile && (
          <div className="ci-stage">
            <svg className="ci-svg" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="lineGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#af8564" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#af8564" stopOpacity="0.15"/>
                </linearGradient>
                <linearGradient id="lineGradInactive" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c9a48a" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#c9a48a" stopOpacity="0.05"/>
                </linearGradient>
                <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#af8564" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#af8564" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {features.map((_, i) => {
                const { lx, ly } = getPos(i, angleDeg);
                return <EnergyLine key={i} x1={lx} y1={ly} isActive={displayIdx === i} />;
              })}

              {(() => {
                const { lx, ly } = getPos(displayIdx, angleDeg);
                return <circle cx={`${lx}%`} cy={`${ly}%`} r="3" fill="url(#dotGlow)" opacity="0.6" />;
              })()}
            </svg>

            <div className="ci-center">
              <div key={animKey} className="ci-anim">
                <div className="ci-center-title">{features[displayIdx].title}</div>
                <div className="ci-center-desc">{features[displayIdx].description}</div>
              </div>
            </div>

            {features.map((feat, i) => {
              const pos = getPos(i, angleDeg);
              return (
                <button
                  key={feat.id}
                  className={`ci-icon-btn${displayIdx === i ? " active" : ""}`}
                  style={{ left: pos.left, top: pos.top }}
                  onMouseEnter={() => handleEnter(i)}
                  onMouseLeave={handleLeave}
                  aria-label={feat.title}
                >
                  <i className={`fas ${feat.icon}`} />
                  <span className="ci-tooltip">{feat.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile list */}
        {isMobile && (
          <div className="ci-mobile" style={{ display: "flex" }}>
            <div className="ci-mobile-center">
              <div key={`m-${animKey}`} className="ci-anim">
                <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "0.4rem", lineHeight: 1.2 }}>
                  {features[displayIdx].title}
                </div>
                <div style={{ color: "rgba(255,235,220,0.85)", fontSize: "0.62rem", fontWeight: 300, lineHeight: 1.65 }}>
                  {features[displayIdx].description}
                </div>
              </div>
            </div>
            <div className="ci-mobile-icons">
              {features.map((feat, i) => (
                <button
                  key={feat.id}
                  className={`ci-mobile-icon-btn${displayIdx === i ? " active" : ""}`}
                  onClick={() => { setActiveIdx(i); setAnimKey(k => k + 1); }}
                  aria-label={feat.title}
                >
                  <i className={`fas ${feat.icon}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}