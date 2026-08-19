// src/Administrator/analytics/UptimeStatus.jsx
//
// Claude-Status-style uptime strip for the live site (saworepo1.pages.dev —
// the actual React app this repo deploys, not www.sawo.com, which is still
// the old WordPress site pending cutover).
//
// Data comes from two tables a GitHub Actions workflow (uptime-check.yml)
// and a daily pg_cron rollup (rollup_uptime_day/purge_old_uptime_checks,
// scheduled in Supabase) keep filled in, independently of anything this
// component does:
//   - uptime_checks: one row per ping (~every 5 minutes), kept 90 days.
//   - uptime_daily_summary: one row per day, kept forever (tiny — ~365
//     rows/year), so the long-term trend survives even once the raw pings
//     for that day have been purged.
// This component only reads; it never writes.
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

const TRASH_LIKE_DAYS = 90; // how many day-bars to show, matches Claude Status

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(dayStr) {
  return new Date(`${dayStr}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

const STATUS_COLOR = {
  operational: "#3fb950",
  degraded: "#d29922",
  down: "#f85149",
  unknown: "var(--border)",
};

const STATUS_LABEL = {
  operational: "Operational",
  degraded: "Partial outage",
  down: "Down",
  unknown: "No data",
};

export default function UptimeStatus() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]); // [{ day, uptime_pct, total_checks, up_checks, worst_status }]
  const [current, setCurrent] = useState(null); // most recent single check
  const [hoverDay, setHoverDay] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const since = new Date();
      since.setUTCDate(since.getUTCDate() - (TRASH_LIKE_DAYS - 1));
      const sinceKey = dateKey(since);

      const [{ data: summaryRows }, { data: latestCheck }, { data: todayChecks }] = await Promise.all([
        supabase
          .from("uptime_daily_summary")
          .select("day, total_checks, up_checks, uptime_pct, worst_status")
          .gte("day", sinceKey)
          .order("day", { ascending: true }),
        supabase
          .from("uptime_checks")
          .select("status, checked_at, http_status, response_time_ms")
          .order("checked_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Today isn't in the rollup yet (that only runs once, for the
        // previous day) — compute it live from whatever's been logged so
        // far so "today" still shows a real bar, not a gap.
        supabase
          .from("uptime_checks")
          .select("status")
          .gte("checked_at", `${dateKey(new Date())}T00:00:00Z`),
      ]);

      if (cancelled) return;

      const byDay = Object.fromEntries((summaryRows || []).map(r => [r.day, r]));

      const todayKey = dateKey(new Date());
      if (todayChecks?.length) {
        const total = todayChecks.length;
        const up = todayChecks.filter(c => c.status === "up").length;
        const pct = Math.round((up / total) * 10000) / 100;
        byDay[todayKey] = {
          day: todayKey,
          total_checks: total,
          up_checks: up,
          uptime_pct: pct,
          worst_status: pct === 100 ? "operational" : pct >= 95 ? "degraded" : "down",
        };
      }

      const list = [];
      for (let i = 0; i < TRASH_LIKE_DAYS; i++) {
        const d = new Date(since);
        d.setUTCDate(d.getUTCDate() + i);
        const key = dateKey(d);
        list.push(byDay[key] || { day: key, total_checks: 0, up_checks: 0, uptime_pct: null, worst_status: "unknown" });
      }

      setDays(list);
      setCurrent(latestCheck || null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  const overallPct = (() => {
    const withData = days.filter(d => d.total_checks > 0);
    if (!withData.length) return null;
    const totalUp = withData.reduce((s, d) => s + d.up_checks, 0);
    const totalAll = withData.reduce((s, d) => s + d.total_checks, 0);
    return Math.round((totalUp / totalAll) * 10000) / 100;
  })();

  const currentStatus = current == null
    ? "unknown"
    : (Date.now() - new Date(current.checked_at).getTime() > 30 * 60 * 1000)
      ? "unknown" // last check is stale (>30min) — the checker itself may be broken
      : current.status === "up" ? "operational" : "down";

  return (
    <div id="analytics-uptime" className="card card-body card-lift mb-8" style={{ position: "relative" }}>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: "wrap", gap: 10 }}>
        <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2" style={{ margin: 0 }}>
          <i className="fas fa-heart-pulse text-[var(--brand)]"></i>
          Site Uptime
        </h3>
        <span
          className="tbl-pill"
          style={{
            background: `${STATUS_COLOR[currentStatus]}22`,
            color: STATUS_COLOR[currentStatus],
            fontWeight: 700,
          }}
        >
          <i className="fa-solid fa-circle" style={{ fontSize: "0.5rem", marginRight: 6 }} />
          {currentStatus === "unknown" ? "Status unknown" : STATUS_LABEL[currentStatus]}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-3)" }}>
          <i className="fa-solid fa-spinner fa-spin" />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 40 }}>
            {days.map(d => {
              const color = d.total_checks === 0 ? STATUS_COLOR.unknown : STATUS_COLOR[d.worst_status] || STATUS_COLOR.unknown;
              return (
                <div
                  key={d.day}
                  onMouseEnter={() => setHoverDay(d)}
                  onMouseLeave={() => setHoverDay(h => (h?.day === d.day ? null : h))}
                  style={{
                    flex: 1,
                    height: "100%",
                    background: color,
                    borderRadius: 2,
                    cursor: "pointer",
                    opacity: d.total_checks === 0 ? 0.35 : 1,
                    transition: "transform 0.12s ease",
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = "scaleY(1.08)"; }}
                  onMouseOut={e => { e.currentTarget.style.transform = "scaleY(1)"; }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between" style={{ marginTop: 8, fontSize: "0.72rem", color: "var(--text-3)" }}>
            <span>{TRASH_LIKE_DAYS} days ago</span>
            <span>{overallPct != null ? `${overallPct}% uptime` : "No data yet"}</span>
            <span>Today</span>
          </div>

          {hoverDay && (
            <div
              style={{
                position: "absolute", zIndex: 5, bottom: "100%", marginBottom: 8,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "10px 14px", boxShadow: "var(--shadow-lg)",
                fontSize: "0.78rem", minWidth: 200,
                left: "50%", transform: "translateX(-50%)",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                {formatDayLabel(hoverDay.day)}
              </div>
              {hoverDay.total_checks === 0 ? (
                <div style={{ color: "var(--text-3)" }}>No checks recorded</div>
              ) : (
                <>
                  <div style={{ color: STATUS_COLOR[hoverDay.worst_status], fontWeight: 600 }}>
                    {STATUS_LABEL[hoverDay.worst_status]} — {hoverDay.uptime_pct}% uptime
                  </div>
                  <div style={{ color: "var(--text-3)", marginTop: 2 }}>
                    {hoverDay.up_checks} / {hoverDay.total_checks} checks passed
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
