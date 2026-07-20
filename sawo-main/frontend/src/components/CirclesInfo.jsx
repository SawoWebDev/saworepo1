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
  const DUR = 3.6;
  const dots = [0, 0.5];
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
        <g key={k}>
          <circle r="1.5" fill="url(#dotGlow)">
            <animateMotion
              dur={`${DUR}s`}
              repeatCount="indefinite"
              begin={`${offset * DUR}s`}
              path={`M ${x1},${y1} L ${CX},${CY}`}
              calcMode="spline"
              keyPoints="0;1"
              keyTimes="0;1"
              keySplines="0.45 0 0.55 1"
            />
            <animate attributeName="opacity" values="0;0.55;0.55;0" keyTimes="0;0.2;0.8;1" dur={`${DUR}s`} repeatCount="indefinite" begin={`${offset * DUR}s`} />
          </circle>
          <circle r="0.55" fill="url(#dotCore)">
            <animateMotion
              dur={`${DUR}s`}
              repeatCount="indefinite"
              begin={`${offset * DUR}s`}
              path={`M ${x1},${y1} L ${CX},${CY}`}
              calcMode="spline"
              keyPoints="0;1"
              keyTimes="0;1"
              keySplines="0.45 0 0.55 1"
            />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur={`${DUR}s`} repeatCount="indefinite" begin={`${offset * DUR}s`} />
          </circle>
        </g>
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
  const tapTimerRef = useRef(null);

  // Orbit geometry is a percentage of the stage, so the layout is identical at
  // every screen size — only the stage itself scales.
  const RADIUS = 41;

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

  useEffect(() => () => clearTimeout(tapTimerRef.current), []);

  const handleEnter = (i) => {
    clearTimeout(tapTimerRef.current);
    isPausedRef.current = true;
    setHoveredIdx(i);
    setActiveIdx(i);
    setAnimKey(k => k + 1);
  };
  const handleLeave = () => { isPausedRef.current = false; setHoveredIdx(null); };

  // Touch has no hover: hold the tapped feature briefly, then resume orbiting.
  const handleTap = (i) => {
    handleEnter(i);
    tapTimerRef.current = setTimeout(handleLeave, 4000);
  };

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
      <style>{`
        .ci-root {
          font-family: 'Montserrat', sans-serif;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(28px, 6vw, 60px) clamp(12px, 4vw, 20px);
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        /* One stage at every size. Everything inside is sized from the stage
           (cqw / %), so the orbit keeps its exact proportions as it scales.
           Width is % of ci-root, not vw — a vw-based width forces a fixed
           min-content contribution that a narrow flex/grid ancestor (e.g. a
           two-column "why choose" grid collapsed to one column on mobile)
           can't shrink below, pushing the whole widget off-center/off-screen. */
        .ci-stage {
          position: relative;
          width: 100%;
          max-width: 520px;
          min-width: 0;
          aspect-ratio: 1;
          container-type: inline-size;
        }

        .ci-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }

        /* Center circle — soft sphere shading, same palette */
        .ci-center {
          position: absolute;
          inset: 24%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 32% 26%, rgba(255,255,255,0.32), rgba(255,255,255,0) 52%),
            radial-gradient(circle at 68% 82%, rgba(100,70,40,0.30), rgba(100,70,40,0) 58%),
            #af8564;
          box-shadow:
            inset 0 -12px 26px rgba(100, 70, 40, 0.22),
            inset 0 10px 22px rgba(255, 255, 255, 0.14),
            0 22px 44px rgba(100, 70, 40, 0.20),
            0 6px 14px rgba(100, 70, 40, 0.12);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12%;
          text-align: center;
          overflow: hidden;
          z-index: 1;
        }
        /* Small stage: give the copy a little more room inside the sphere */
        @container (max-width: 400px) {
          .ci-center { inset: 21%; padding: 9%; }
        }

        .ci-center-title {
          position: relative;
          color: #fff;
          font-size: clamp(0.6rem, 2.2vw, 0.95rem);
          font-size: clamp(0.6rem, 2.9cqw, 0.95rem);
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 0.45em;
          line-height: 1.25;
        }
        .ci-center-desc {
          position: relative;
          color: rgba(255, 235, 220, 0.85);
          font-size: clamp(0.52rem, 1.5vw, 0.68rem);
          font-size: clamp(0.52rem, 1.95cqw, 0.68rem);
          font-weight: 300;
          line-height: 1.6;
        }

        @keyframes ci-fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ci-anim { animation: ci-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }

        /* Icon buttons */
        .ci-icon-btn {
          position: absolute;
          /* % fallback keeps the orbit proportional if cqw is unsupported */
          width: 14%;
          height: 14%;
          width: clamp(40px, 14cqw, 74px);
          height: clamp(40px, 14cqw, 74px);
          border-radius: 50%;
          border: none;
          background:
            radial-gradient(circle at 32% 26%, rgba(255,255,255,0.38), rgba(255,255,255,0) 55%),
            radial-gradient(circle at 68% 80%, rgba(100,70,40,0.28), rgba(100,70,40,0) 60%),
            #c9a48a;
          box-shadow:
            inset 0 -4px 8px rgba(100, 70, 40, 0.18),
            inset 0 3px 6px rgba(255, 255, 255, 0.22),
            0 8px 18px rgba(100, 70, 40, 0.16),
            0 2px 5px rgba(100, 70, 40, 0.10);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform: translate(-50%, -50%);
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s, background 0.45s;
          color: #fff;
          font-size: clamp(0.8rem, 3.4vw, 1.4rem);
          font-size: clamp(0.8rem, 4.4cqw, 1.4rem);
          outline: none;
          -webkit-tap-highlight-color: transparent;
          z-index: 3;
        }

        .ci-icon-btn.active {
          background:
            radial-gradient(circle at 32% 26%, rgba(255,255,255,0.34), rgba(255,255,255,0) 55%),
            radial-gradient(circle at 68% 80%, rgba(100,70,40,0.32), rgba(100,70,40,0) 60%),
            #af8564;
          box-shadow:
            inset 0 -4px 10px rgba(100, 70, 40, 0.22),
            inset 0 3px 6px rgba(255, 255, 255, 0.24),
            0 0 0 5px rgba(175, 133, 100, 0.14),
            0 14px 30px rgba(100, 70, 40, 0.26);
          color: #fff;
          transform: translate(-50%, -50%) scale(1.18) translateY(-3px);
        }
        /* Only real pointers get hover — avoids sticky states after a tap */
        @media (hover: hover) {
          .ci-icon-btn:hover {
            background:
              radial-gradient(circle at 32% 26%, rgba(255,255,255,0.34), rgba(255,255,255,0) 55%),
              radial-gradient(circle at 68% 80%, rgba(100,70,40,0.32), rgba(100,70,40,0) 60%),
              #af8564;
            box-shadow:
              inset 0 -4px 10px rgba(100, 70, 40, 0.22),
              inset 0 3px 6px rgba(255, 255, 255, 0.24),
              0 0 0 5px rgba(175, 133, 100, 0.14),
              0 14px 30px rgba(100, 70, 40, 0.26);
            color: #fff;
            transform: translate(-50%, -50%) scale(1.18) translateY(-3px);
          }
        }

        @keyframes ci-orb-pulse {
          0%   { transform: scale(1);    opacity: 0.45; }
          80%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .ci-icon-btn::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1.5px solid rgba(175, 133, 100, 0.55);
          opacity: 0;
          pointer-events: none;
        }
        .ci-icon-btn.active::after { animation: ci-orb-pulse 3s cubic-bezier(0.22,1,0.36,1) infinite; }

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
        @media (hover: hover) {
          .ci-icon-btn:hover .ci-tooltip { opacity: 1; }
        }
        /* No room (and no hover) on a small stage — the center already names it */
        @container (max-width: 400px) {
          .ci-tooltip { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ci-icon-btn.active::after { animation: none; }
          .ci-anim { animation-duration: 0.01ms; }
        }
      `}</style>

      <div className="ci-root">
        {/* One orbit stage at every breakpoint — it scales, it never re-flows */}
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
              <radialGradient id="dotCore" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.95"/>
                <stop offset="45%" stopColor="#c9a48a" stopOpacity="1"/>
                <stop offset="100%" stopColor="#af8564" stopOpacity="1"/>
              </radialGradient>
            </defs>

            {/* Orbit track — faint ring for depth */}
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke="#c9a48a"
              strokeOpacity="0.22"
              strokeWidth="0.35"
            />
            <circle
              cx="50" cy="50" r={RADIUS + 1.4}
              fill="none"
              stroke="#c9a48a"
              strokeOpacity="0.09"
              strokeWidth="0.25"
            />

            {features.map((_, i) => {
              const { lx, ly } = getPos(i, angleDeg);
              return <EnergyLine key={i} x1={lx} y1={ly} isActive={displayIdx === i} />;
            })}

            {(() => {
              const { lx, ly } = getPos(displayIdx, angleDeg);
              return <circle cx={`${lx}%`} cy={`${ly}%`} r="3.4" fill="url(#dotGlow)" opacity="0.45" />;
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
                onClick={() => handleTap(i)}
                aria-label={feat.title}
              >
                <i className={`fas ${feat.icon}`} />
                <span className="ci-tooltip">{feat.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}