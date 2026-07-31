import React from "react";

// Minimal inline sparkline for grid cards — deliberately not DailyTrafficChart
// (no ResizeObserver/hover state/axis labels; 40+ of those on one grid would
// be wasteful). `data` is buildDailyStats() output: [{ date, views, visitors }].
export default function Sparkline({ data, width = 90, height = 28 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.views));
  const n = data.length;
  const x = (i) => (n <= 1 ? width / 2 : (i * width) / (n - 1));
  const y = (v) => height - 1 - (v / max) * (height - 2);
  const points = data.map((d, i) => `${x(i)},${y(d.views)}`).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
