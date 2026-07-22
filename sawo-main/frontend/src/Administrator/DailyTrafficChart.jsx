import React, { useRef, useState, useMemo, useCallback, useLayoutEffect } from "react";

// Hand-rolled SVG line/area chart (equity-curve style) — no charting library,
// consistent with the rest of this admin-only dashboard. `data` is an array
// of { date: "YYYY-MM-DD", views: number, visitors: number }, already sorted
// ascending and zero-filled for every day in the selected range.
//
// The viewBox width tracks the container's actual rendered pixel width (via
// ResizeObserver below) instead of a fixed constant. With `preserveAspectRatio
// ="none"` a fixed viewBox stretched to a wider container scales x and y by
// different factors, which turns the hover <circle> markers into visibly
// squashed/stretched ellipses. Keeping 1 viewBox unit == 1 real pixel makes
// that scale factor 1:1 on both axes, so circles/strokes stay true.
const DEFAULT_CHART_W = 600;
const CHART_H = 220;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 8;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM;

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatMonthLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "long" });
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

// Catmull-Rom -> cubic Bezier, so the line reads as a gentle curve through
// each day's point instead of a sharp zig-zag between them.
function smoothPath(points) {
  if (points.length < 2) return points.length === 1 ? `M${points[0].x},${points[0].y}` : "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export default function DailyTrafficChart({ data }) {
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [chartW, setChartW] = useState(DEFAULT_CHART_W);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w > 0) setChartW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = data?.length || 0;
  const maxValue = useMemo(
    () => Math.max(1, ...(data || []).map((d) => Math.max(d.views, d.visitors))),
    [data]
  );

  const x = useCallback(
    (i) => (n <= 1 ? chartW / 2 : PAD_X + (i * (chartW - PAD_X * 2)) / (n - 1)),
    [n, chartW]
  );
  const y = useCallback(
    (value) => PAD_TOP + (1 - value / maxValue) * PLOT_H,
    [maxValue]
  );

  const { viewsPath, viewsAreaPath, visitorsPath } = useMemo(() => {
    if (!data || data.length === 0) return {};
    const viewsPts = data.map((d, i) => ({ x: x(i), y: y(d.views) }));
    const visitorsPts = data.map((d, i) => ({ x: x(i), y: y(d.visitors) }));
    const baseline = PAD_TOP + PLOT_H;
    const viewsCurve = smoothPath(viewsPts);

    return {
      viewsPath: viewsCurve,
      viewsAreaPath: `${viewsCurve} L${x(n - 1)},${baseline} L${x(0)},${baseline} Z`,
      visitorsPath: smoothPath(visitorsPts),
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

  // Long ranges (90 days) don't have room for a label per day — "Jan 3",
  // "Jan 10"... just truncates. Instead, show each month's full name once,
  // positioned at that month's first day, like an axis section header.
  const isLongRange = n > 31;
  const monthLabels = useMemo(() => {
    if (!isLongRange || !data) return [];
    const out = [];
    let lastMonth = null;
    data.forEach((day, i) => {
      const month = day.date.slice(0, 7); // "YYYY-MM"
      if (month !== lastMonth) {
        out.push({ i, label: formatMonthLabel(day.date) });
        lastMonth = month;
      }
    });
    return out;
  }, [data, isLongRange]);

  if (!data || data.length === 0) {
    return <p className="text-[var(--text-3)] text-sm">No data available</p>;
  }

  const labelEvery = n <= 10 ? 1 : 3;
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
          viewBox={`0 0 ${chartW} ${CHART_H}`}
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
              x2={chartW - PAD_X}
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

      <div className="relative mt-1" style={{ height: 14 }}>
        {isLongRange
          ? monthLabels.map(({ i, label }) => (
              <span
                key={i}
                className="absolute text-[10px] text-[var(--text-3)] whitespace-nowrap"
                style={{ left: x(i), top: 0 }}
              >
                {label}
              </span>
            ))
          : data.map((day, i) =>
              i % labelEvery === 0 ? (
                <span
                  key={day.date}
                  className="absolute text-[10px] text-[var(--text-3)] whitespace-nowrap"
                  style={{ left: x(i), top: 0, transform: "translateX(-50%)" }}
                >
                  {formatDayLabel(day.date)}
                </span>
              ) : null
            )}
      </div>
    </div>
  );
}
