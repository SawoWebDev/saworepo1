// computeStats.js
// Pure metric computation for Analytics.jsx — one pass over the single
// analytics_page_views fetch, no extra queries (egress-conscious: every tab
// of every card re-selects from this one result client-side).
import { resolveSource, resolveChannel } from "./sources";

const dayKey = (iso) => iso.slice(0, 10); // "YYYY-MM-DD" from an ISO timestamp

// FA 6 brand/solid icons for the Devices card (Browser + OS tabs).
const BROWSER_ICONS = {
  Chrome:  "fa-brands fa-chrome",
  Edge:    "fa-brands fa-edge",
  Safari:  "fa-brands fa-safari",
  Firefox: "fa-brands fa-firefox-browser",
  Other:   "fa-solid fa-globe",
};
const OS_ICONS = {
  Windows:      "fa-brands fa-windows",
  macOS:        "fa-brands fa-apple",
  iOS:          "fa-brands fa-apple",
  Android:      "fa-brands fa-android",
  "GNU/Linux":  "fa-brands fa-linux",
  Other:        "fa-solid fa-desktop",
};

/**
 * @param {Array} pageViews rows from analytics_page_views for the date range
 * @param {Array} events    rows from analytics_events
 * @param {Date}  startDate start of the selected range (for zero-filled days)
 */
export function computeStats(pageViews, events, startDate) {
  const views = pageViews || [];

  // ── Session index: session_id → rows sorted by timestamp ─────────────────
  // Entry/exit pages and first-touch attribution all need per-session order.
  const sessions = new Map();
  views.forEach(pv => {
    if (!sessions.has(pv.session_id)) sessions.set(pv.session_id, []);
    sessions.get(pv.session_id).push(pv);
  });
  sessions.forEach(rows => rows.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));

  const uniqueVisitors = sessions.size;
  const totalDuration = views.reduce((sum, pv) => sum + (pv.time_on_page || 0), 0);

  // ── Daily views + unique visitors, zero-filled across the range ──────────
  const dailyViews = {};
  const dailySessions = {};
  views.forEach(pv => {
    const key = dayKey(pv.timestamp);
    dailyViews[key] = (dailyViews[key] || 0) + 1;
    if (!dailySessions[key]) dailySessions[key] = new Set();
    dailySessions[key].add(pv.session_id);
  });
  const dailyStats = [];
  const cursor = new Date(startDate);
  const today = new Date();
  while (cursor <= today) {
    const key = dayKey(cursor.toISOString());
    dailyStats.push({
      date: key,
      views: dailyViews[key] || 0,
      visitors: dailySessions[key]?.size || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // ── Bounce rate: sessions with a single page view ────────────────────────
  let bouncedSessions = 0;
  sessions.forEach(rows => { if (rows.length === 1) bouncedSessions += 1; });
  const bounceRate = uniqueVisitors > 0 ? Math.round((bouncedSessions / uniqueVisitors) * 100) : 0;

  // ── Generic tally helpers ────────────────────────────────────────────────
  // By pageview: share of page views (device/browser/os/size cards).
  const tallyViews = (getKey) => {
    const map = {};
    views.forEach(pv => {
      const key = getKey(pv) || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / (views.length || 1)) * 100),
      }));
  };
  // By session: unique visitors (sources/locations/entry-exit cards) — one
  // visitor browsing 5 pages must not count as 5.
  const tallySessions = (getKey) => {
    const map = {};
    sessions.forEach(rows => {
      const key = getKey(rows) || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, visitors]) => ({
        name,
        visitors,
        pct: Math.round((visitors / (uniqueVisitors || 1)) * 100),
      }));
  };

  // ── Pages: top (views), entry (first of session), exit (last) ────────────
  const pageMap = {};
  views.forEach(pv => {
    if (!pageMap[pv.page_path]) pageMap[pv.page_path] = { path: pv.page_path, views: 0, totalTime: 0 };
    pageMap[pv.page_path].views += 1;
    pageMap[pv.page_path].totalTime += pv.time_on_page || 0;
  });
  const topPages = Object.values(pageMap)
    .sort((a, b) => b.views - a.views)
    .map(p => ({ name: p.path, views: p.views, avgTime: Math.round(p.totalTime / p.views) }));

  const entryPages = tallySessions(rows => rows[0]?.page_path);
  const exitPages  = tallySessions(rows => rows[rows.length - 1]?.page_path);

  // ── Sources / Channels / Campaigns: first-touch per session ──────────────
  // The tracker pins attribution in sessionStorage and sends it on every row,
  // but legacy rows predate that — the session's first row is the landing
  // pageview either way.
  const firstTouch = (rows) => {
    const r = rows[0] || {};
    return {
      referrer: r.referrer || null,
      utm_source: r.utm_source || null,
      utm_medium: r.utm_medium || null,
      utm_campaign: r.utm_campaign || null,
    };
  };
  const sourceIcons = {};
  const sources = tallySessions(rows => {
    const { name, icon } = resolveSource(firstTouch(rows));
    sourceIcons[name] = icon;
    return name;
  }).map(row => ({ ...row, icon: sourceIcons[row.name] }));

  const channels  = tallySessions(rows => resolveChannel(firstTouch(rows)));
  const campaigns = tallySessions(rows => firstTouch(rows).utm_campaign || "None");

  // ── Locations ────────────────────────────────────────────────────────────
  const countries = tallySessions(rows => rows[0]?.country);
  const regions   = tallySessions(rows => rows[0]?.region);
  const cities    = tallySessions(rows => rows[0]?.city);

  // ── Devices ──────────────────────────────────────────────────────────────
  const browsers    = tallyViews(pv => pv.browser).map(r => ({ ...r, icon: BROWSER_ICONS[r.name] || BROWSER_ICONS.Other }));
  const os          = tallyViews(pv => pv.os).map(r => ({ ...r, icon: OS_ICONS[r.name] || OS_ICONS.Other }));
  const screenSizes = tallyViews(pv => pv.screen_size);
  const devices     = tallyViews(pv => pv.device_type);

  return {
    totalPageViews: views.length,
    uniqueVisitors,
    avgSessionDuration: uniqueVisitors > 0 ? Math.round(totalDuration / uniqueVisitors) : 0,
    bounceRate,
    dailyStats,
    topPages,
    entryPages,
    exitPages,
    channels,
    sources,
    campaigns,
    countries,
    regions,
    cities,
    browsers,
    os,
    screenSizes,
    devices,
    recentEvents: events || [],
  };
}
