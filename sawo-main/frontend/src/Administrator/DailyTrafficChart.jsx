import React, { useRef, useState, useMemo, useCallback } from "react";

// Hand-rolled SVG line/area chart (equity-curve style) — no charting library,
// consistent with the rest of this admin-only dashboard. `data` is an array
// of { date: "YYYY-MM-DD", views: number, visitors: number }, already sorted
// ascending and zero-filled for every day in the selected range.
const CHART_W = 600;
const CHART_H = 220;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 8;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM;

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function DailyTrafficChart({ data }) {
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const n = data?.length || 0;
  const maxValue = useMemo(
    () => Math.max(1, ...(data || []).map((d) => Math.max(d.views, d.visitors))),
    [data]
  );

  const x = useCallback(
    (i) => (n <= 1 ? CHART_W / 2 : PAD_X + (i * (CHART_W - PAD_X * 2)) / (n - 1)),
    [n]
  );
  const y = useCallback(
    (value) => PAD_TOP + (1 - value / maxValue) * PLOT_H,
    [maxValue]
  );

  const { viewsPath, viewsAreaPath, visitorsPath } = useMemo(() => {
    if (!data || data.length === 0) return {};
    const viewsPts = data.map((d, i) => `${x(i)},${y(d.views)}`);
    const visitorsPts = data.map((d, i) => `${x(i)},${y(d.visitors)}`);
    const baseline = PAD_TOP + PLOT_H;

    return {
      viewsPath: `M${viewsPts.join(" L")}`,
      viewsAreaPath: `M${x(0)},${baseline} L${viewsPts.join(" L")} L${x(n - 1)},${baseline} Z`,
      visitorsPath: `M${visitorsPts.join(" L")}`,
    };
  }, [data, x, y, n]);

  const updateHover = useCallback(
    (clientX) => {
      if (!containerRef.current || n === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const fraction = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const index = Math.round(fraction * (n - 1));
      setHoverIndex(index);
    },
    [n]
  );

  if (!data || data.length === 0) {
    return <p className="text-[var(--text-3)] text-sm">No data available</p>;
  }

  const labelEvery = n <= 10 ? 1 : n <= 31 ? 3 : 7;
  const hovered = hoverIndex != null ? data[hoverIndex] : null;
  const tooltipLeftPct = hoverIndex != null ? Math.min(Math.max((hoverIndex / (n - 1)) * 100, 10), 90) : 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs text-[var(--text-2)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded-sm" style={{ background: "var(--brand)" }} />
          Page Views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded-sm" style={{ background: "#7dd3a0" }} />
          Unique Visitors
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative"
        onMouseMove={(e) => updateHover(e.clientX)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={(e) => updateHover(e.touches[0].clientX)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: CHART_H, display: "block" }}
        >
          <defs>
            <linearGradient id="dailyTrafficAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines at 0%, 50%, 100% of max */}
          {[0, 0.5, 1].map((frac) => (
            <line
              key={frac}
              x1={PAD_X}
              x2={CHART_W - PAD_X}
              y1={PAD_TOP + PLOT_H * (1 - frac)}
              y2={PAD_TOP + PLOT_H * (1 - frac)}
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}

          {/* Equity-curve style filled area under Page Views */}
          <path d={viewsAreaPath} fill="url(#dailyTrafficAreaFill)" stroke="none" />
          <path d={viewsPath} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={visitorsPath} fill="none" stroke="#7dd3a0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Hover crosshair + point markers */}
          {hovered && (
            <g>
              <line
                x1={x(hoverIndex)} x2={x(hoverIndex)}
                y1={PAD_TOP} y2={PAD_TOP + PLOT_H}
                stroke="var(--text-3)" strokeWidth="1" strokeDasharray="3 3"
              />
              <circle cx={x(hoverIndex)} cy={y(hovered.views)} r="4" fill="var(--brand)" stroke="var(--surface)" strokeWidth="1.5" />
              <circle cx={x(hoverIndex)} cy={y(hovered.visitors)} r="4" fill="#7dd3a0" stroke="var(--surface)" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute top-1 pointer-events-none bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap z-10"
            style={{ left: `${tooltipLeftPct}%`, transform: "translateX(-50%)" }}
          >
            <p className="font-bold text-[var(--text)] mb-1">{formatFullDate(hovered.date)}</p>
            <p className="flex items-center gap-1.5 text-[var(--text-2)]">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />
              {hovered.views.toLocaleString()} views
            </p>
            <p className="flex items-center gap-1.5 text-[var(--text-2)]">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#7dd3a0" }} />
              {hovered.visitors.toLocaleString()} unique visitors
            </p>
          </div>
        )}
      </div>

      <div className="flex mt-1">
        {data.map((day, i) => (
          <div
            key={day.date}
            style={{ width: `${100 / n}%` }}
            className="text-center text-[10px] text-[var(--text-3)] truncate"
          >
            {i % labelEvery === 0 ? formatDayLabel(day.date) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
