// computePagePerformance.js
// Per-page analytics for the Page SEO grid + drill-down. Reuses computeStats'
// session/attribution logic rather than duplicating it — a page's "visitor
// profile" (sources/locations/devices/entry/exit/bounce) is just computeStats
// run over the subset of sessions that included that page at some point.
import { computeStats, buildDailyStats } from "./computeStats";

// One row per STATIC_PAGES entry, sorted by views desc — cheap enough at
// current data volumes to just filter the full pageViews array once per page.
export function computeAllPagesSummary(pageViews, paths, startDate, endDate = new Date()) {
  const views = pageViews || [];
  const byPath = {};
  paths.forEach((p) => {
    byPath[p.path] = { views: 0, totalTime: 0, sessionIds: new Set() };
  });

  views.forEach((pv) => {
    const entry = byPath[pv.page_path];
    if (!entry) return; // product/detail pages etc. — not in the static list
    entry.views += 1;
    entry.totalTime += pv.time_on_page || 0;
    entry.sessionIds.add(pv.session_id);
  });

  return paths
    .map((p) => {
      const e = byPath[p.path];
      const ownViews = views.filter((v) => v.page_path === p.path);
      return {
        ...p, // carries label + any other STATIC_PAGES fields (e.g. defaultTitle/defaultDescription) through
        views: e.views,
        uniqueVisitors: e.sessionIds.size,
        avgTime: e.views ? Math.round(e.totalTime / e.views) : 0,
        dailyStats: buildDailyStats(ownViews, startDate, endDate),
      };
    })
    .sort((a, b) => b.views - a.views);
}

// Full stats scoped to one page: every session that visited `path` at any
// point in the range, with all of that session's pageviews (not just the
// rows on `path`) fed into computeStats — that's what makes entry/exit,
// sources, and device breakdowns meaningful (a session's channel/location is
// a first-touch property of the whole session, not of one page in it).
export function computePageDetail(pageViews, events, path, startDate, endDate = new Date()) {
  const views = pageViews || [];

  const sessions = new Map();
  views.forEach((pv) => {
    if (!sessions.has(pv.session_id)) sessions.set(pv.session_id, []);
    sessions.get(pv.session_id).push(pv);
  });

  const sessionIds = new Set();
  sessions.forEach((rows, id) => {
    if (rows.some((r) => r.page_path === path)) sessionIds.add(id);
  });

  const subsetViews = views.filter((v) => sessionIds.has(v.session_id));
  const subsetEvents = (events || []).filter((e) => e.page_path === path);

  const base = computeStats(subsetViews, subsetEvents, startDate, endDate);
  const pageRow = base.topPages.find((p) => p.name === path) || { views: 0, avgTime: 0 };
  const entryRow = base.entryPages.find((p) => p.name === path) || { visitors: 0, pct: 0 };
  const exitRow = base.exitPages.find((p) => p.name === path) || { visitors: 0, pct: 0 };

  return {
    ...base,
    path,
    views: pageRow.views,
    avgTime: pageRow.avgTime,
    entryCount: entryRow.visitors,
    entryPct: entryRow.pct,
    exitCount: exitRow.visitors,
    exitPct: exitRow.pct,
    // Page-specific daily trend (base.dailyStats covers every page these
    // visitors browsed, not just this one).
    dailyStats: buildDailyStats(views.filter((v) => v.page_path === path), startDate, endDate),
  };
}
