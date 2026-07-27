'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Orbiting feature-highlight widget used in "Why choose SAWO" sections.
// `features` (array of {id, title, description, icon}) must be passed in
// pre-translated by the caller — this component has no text of its own.
function EnergyLine({ x1, y1, isActive }) {
  const CX = 50, CY = 50;
  const DUR = 3.6;
  const dots = [0, 0.5];
  return (
    <g>
      <line
        x1={`${x1}%`} y1={`${y1}%`} x2={`${CX}%`} y2={`${CY}%`}
        stroke={isActive ? 'url(#lineGradActive)' : 'url(#lineGradInactive)'}
        strokeWidth={isActive ? '0.7' : '0.4'}
        strokeLinecap="round"
        style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
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

export default function CirclesInfo({ features, rotationSpeed = 22 }) {
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

  const RADIUS = 41;

  const getActiveFromAngle = useCallback((angle) => {
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < count; i++) {
      const base = (360 / count) * i;
      const cur = (base + angle) % 360;
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
      top: `${50 - RADIUS * Math.cos(rad)}%`,
      lx: 50 + RADIUS * Math.sin(rad),
      ly: 50 - RADIUS * Math.cos(rad),
    };
  };

  return (
    <div className="ci-root">
      <div className="ci-stage">
        <svg className="ci-svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="lineGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#af8564" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#af8564" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="lineGradInactive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c9a48a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c9a48a" stopOpacity="0.05" />
            </linearGradient>
            <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#af8564" stopOpacity="1" />
              <stop offset="100%" stopColor="#af8564" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="dotCore" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#c9a48a" stopOpacity="1" />
              <stop offset="100%" stopColor="#af8564" stopOpacity="1" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#c9a48a" strokeOpacity="0.22" strokeWidth="0.35" />
          <circle cx="50" cy="50" r={RADIUS + 1.4} fill="none" stroke="#c9a48a" strokeOpacity="0.09" strokeWidth="0.25" />

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
              type="button"
              className={`ci-icon-btn${displayIdx === i ? ' active' : ''}`}
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
  );
}
