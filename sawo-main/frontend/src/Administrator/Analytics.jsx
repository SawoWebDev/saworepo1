import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "./supabase";
import DailyTrafficChart from "./DailyTrafficChart";
import { getCache, setCache } from "./adminCache";
import { computeStats } from "./analytics/computeStats";
import { DATE_RANGE_OPTIONS, resolveRange } from "./analytics/dateRange";
import WorldMap from "./analytics/WorldMap";
import UptimeStatus from "./analytics/UptimeStatus";
import {
  CARD_CONTENT_HEIGHT,
  MetricCard,
  CardHeader,
  BreakdownList,
  TabbedList,
  BreakdownCard,
  Modal,
} from "./analytics/StatPrimitives";

// v3: added This year/Custom ranges (endDate now matters, not just
// startDate) — new key so a stale v2 cache entry can't be mistaken for a
// range it wasn't actually computed for.
const analyticsCacheKey = (dateRange, customStart, customEnd) =>
  dateRange === "custom" ? `admin:analytics:v3:custom:${customStart}:${customEnd}` : `admin:analytics:v3:${dateRange}`;

const EMPTY_STATS = {
  totalPageViews: 0,
  uniqueVisitors: 0,
  avgSessionDuration: 0,
  bounceRate: 0,
  dailyStats: [],
  topPages: [],
  entryPages: [],
  exitPages: [],
  channels: [],
  sources: [],
  campaigns: [],
  countries: [],
  regions: [],
  cities: [],
  browsers: [],
  os: [],
  screenSizes: [],
  devices: [],
  recentEvents: [],
};

const Analytics = () => {
  const [dateRange, setDateRange] = useState("7days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  // Which tab is active inside each breakdown card. Switching tabs only
  // re-selects from the already-computed stats — zero extra fetches.
  const [cardTabs, setCardTabs] = useState({
    sources: "sources",
    pages: "top",
    products: "views",
    locations: "map",
    devices: "browser",
  });
  // slug -> display name, for turning "/products/some-slug" (or /accessories/,
  // /sauna/rooms/) into a human-readable row instead of a raw path. Static
  // reference data — fetched once, not tied to the date range like `stats`.
  const [nameBySlug, setNameBySlug] = useState({});
  const [expandedList, setExpandedList] = useState(null); // { title, icon, rows, valueLabel, showPct }
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [stats, setStats] = useState(() => getCache(analyticsCacheKey("7days")) || EMPTY_STATS);
  const [loading, setLoading] = useState(() => !getCache(analyticsCacheKey("7days")));
  const [error, setError] = useState(null);

  // Custom range with either date not picked yet — nothing to fetch.
  const range = resolveRange(dateRange, customStart, customEnd);

  const fetchAnalytics = useCallback(async () => {
    if (!range) return;
    const { startDate, endDate } = range;
    const cacheKey = analyticsCacheKey(dateRange, customStart, customEnd);
    const cached = getCache(cacheKey);
    // Already have this range's data on screen (seeded at mount, or from a
    // prior visit to this tab within the session) — refresh quietly instead
    // of flashing the full-page spinner.
    if (cached) setStats(cached); else setLoading(true);
    try {
      // Fetch page views
      const { data: pageViews, error: pvError } = await supabase
        .from("analytics_page_views")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      if (pvError) throw pvError;

      // Fetch events
      const { data: events, error: evError } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString())
        .limit(50);

      if (evError) throw evError;

      const newStats = computeStats(pageViews, events, startDate, endDate);
      setStats(newStats);
      setCache(cacheKey, newStats);

      setError(null);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => { setExpandedList(null); }, [dateRange]);

  // Products and sauna rooms both need a slug->name lookup for the "Top
  // Products" card below; accessories live in the same `products` table
  // (an accessory is just a product whose categories match ACCESSORY_
  // CATEGORIES — see DispAccessories.jsx), so one products query covers
  // both /products/:slug and /accessories/:slug.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: products }, { data: rooms }] = await Promise.all([
        supabase.from("products").select("slug, name"),
        supabase.from("sauna_rooms").select("slug, name"),
      ]);
      if (cancelled) return;
      const map = {};
      (products || []).forEach(p => { map[p.slug] = p.name; });
      (rooms || []).forEach(r => { map[r.slug] = r.name; });
      setNameBySlug(map);
    })();
    return () => { cancelled = true; };
  }, []);

  // Pulls product/accessory/sauna-room pageviews out of the generic
  // topPages tally (already computed from the one analytics_page_views
  // fetch — no extra query needed) and resolves each path's slug to a
  // real product name, so this reads as "which products get views" rather
  // than a list of raw URLs.
  const topProducts = useMemo(() => {
    const PRODUCT_PATH_RE = /^\/(products|accessories|sauna\/rooms)\/([^/]+)\/?$/;
    return stats.topPages
      .map(p => {
        const match = p.name.match(PRODUCT_PATH_RE);
        if (!match) return null;
        const slug = match[2];
        return { ...p, name: nameBySlug[slug] || slug };
      })
      .filter(Boolean);
  }, [stats.topPages, nameBySlug]);

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const setCardTab = (card, tab) => setCardTabs(prev => ({ ...prev, [card]: tab }));

  // ── Per-card tab configs, all reading from the one stats object ──────────
  const sourcesTabs = {
    channels:  { label: "Channels",  rows: stats.channels,  valueLabel: "Visitors", showPct: true },
    sources:   { label: "Sources",   rows: stats.sources,   valueLabel: "Visitors", showPct: true },
    campaigns: { label: "Campaigns", rows: stats.campaigns, valueLabel: "Visitors", showPct: false },
  };
  const pagesTabs = {
    top:   { label: "Top pages",   rows: stats.topPages.map(p => ({ ...p, value: p.views, sub: `Avg. time: ${formatTime(p.avgTime)}`, pagePerf: true })), valueLabel: "Views", showPct: false },
    entry: { label: "Entry pages", rows: stats.entryPages.map(r => ({ ...r, pagePerf: true })), valueLabel: "Visitors",     showPct: false },
    exit:  { label: "Exit pages",  rows: stats.exitPages.map(r => ({ ...r, pagePerf: true })),  valueLabel: "Unique exits", showPct: false },
  };
  // Not marked pagePerf — that flag makes BreakdownList rows navigate to
  // /admin/seo (the static-page drill-down), which is the wrong target for
  // a product row. These just aren't clickable for now.
  const productsTabs = {
    views: { label: "By views", rows: [...topProducts].sort((a, b) => b.views - a.views).map(p => ({ ...p, value: p.views, sub: `Avg. time: ${formatTime(p.avgTime)}` })), valueLabel: "Views", showPct: false },
    time:  { label: "By time on page", rows: [...topProducts].sort((a, b) => b.avgTime - a.avgTime).map(p => ({ ...p, value: p.avgTime, sub: `${p.views} view${p.views === 1 ? "" : "s"}` })), valueLabel: "Avg. time (s)", showPct: false },
  };
  const locationsTabs = {
    map:       { label: "Map" },
    countries: { label: "Countries", rows: stats.countries, valueLabel: "Visitors", showPct: false },
    regions:   { label: "Regions",   rows: stats.regions,   valueLabel: "Visitors", showPct: false },
    cities:    { label: "Cities",    rows: stats.cities,    valueLabel: "Visitors", showPct: false },
  };
  const devicesTabs = {
    browser: { label: "Browser", rows: stats.browsers,    valueLabel: "Visitors", showPct: true },
    os:      { label: "OS",      rows: stats.os,          valueLabel: "Visitors", showPct: true },
    size:    { label: "Size",    rows: stats.screenSizes, valueLabel: "Visitors", showPct: true },
  };

  // Date range filter — same options/behavior as Page Performance's, so the
  // two pages' filters don't drift apart. .tax-tabs hardcodes
  // margin-bottom:0 (Taxonomy sits it right above its own toolbar), which
  // silently cancelled the mb-6 here — hence the inline override.
  const dateRangeFilter = (
    <div className="flex items-center justify-between mb-6" style={{ gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div className="tax-tabs" style={{ marginBottom: 0 }}>
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDateRange(opt.key)}
              className={`tax-tab-btn${dateRange === opt.key ? " active" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {dateRange === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <input
              type="date"
              className="form-input"
              style={{ width: "auto" }}
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span className="text-xs text-[var(--text-3)]">to</span>
            <input
              type="date"
              className="form-input"
              style={{ width: "auto" }}
              value={customEnd}
              min={customStart || undefined}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (!range) {
    return (
      <div className="w-full">
        {dateRangeFilter}
        <p className="text-[var(--text-3)] text-sm">Pick a start and end date to load analytics for that range.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-[var(--brand)] mb-4"></i>
          <p className="text-[var(--text-2)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {dateRangeFilter}

      {error && (
        <div className="mb-6 bg-[var(--danger-bg)] border border-[var(--danger)] rounded p-4 text-[var(--danger)]">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon="fa-eye"
          title="Page Views"
          value={stats.totalPageViews.toLocaleString()}
          subtitle="Total views"
        />
        <MetricCard
          icon="fa-users"
          title="Unique Visitors"
          value={stats.uniqueVisitors.toLocaleString()}
          subtitle="Sessions"
        />
        <MetricCard
          icon="fa-clock"
          title="Avg. Duration"
          value={formatTime(stats.avgSessionDuration)}
          subtitle="Per session"
        />
        <MetricCard
          icon="fa-door-open"
          title="Bounce Rate"
          value={`${stats.bounceRate}%`}
          subtitle="Single-page sessions"
        />
      </div>

      {/* Daily Traffic Chart */}
      <div id="analytics-traffic-chart" className="card card-body card-lift mb-8">
        <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <i className="fas fa-chart-column text-[var(--brand)]"></i>
          Traffic Over Time
        </h3>
        <DailyTrafficChart data={stats.dailyStats} />
      </div>

      {/* Row 1: Top Sources | Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BreakdownCard
          id="analytics-top-sources"
          title="Top sources"
          icon="fa-arrow-right-to-bracket"
          tabs={sourcesTabs}
          activeTab={cardTabs.sources}
          onTab={(t) => setCardTab("sources", t)}
          onShowAll={setExpandedList}
        />
        <BreakdownCard
          id="analytics-top-pages"
          title="Top pages"
          icon="fa-chart-bar"
          tabs={pagesTabs}
          activeTab={cardTabs.pages}
          onTab={(t) => setCardTab("pages", t)}
          onShowAll={setExpandedList}
        />
      </div>

      {/* Top Products — which products/accessories/sauna rooms get the most
          views over the selected date range. Pulled from the same page-view
          data as "Top pages" above (see the topProducts memo), just filtered
          to product-detail paths and resolved to real names. */}
      <div className="mb-8">
        <BreakdownCard
          id="analytics-top-products"
          title="Top products"
          icon="fa-box"
          tabs={productsTabs}
          activeTab={cardTabs.products}
          onTab={(t) => setCardTab("products", t)}
          onShowAll={setExpandedList}
        />
      </div>

      {/* Row 2: Locations | Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div id="analytics-locations" className="card card-body card-lift">
          <CardHeader
            title="Locations"
            icon="fa-globe"
            tabs={locationsTabs}
            activeTab={cardTabs.locations}
            onTab={(t) => setCardTab("locations", t)}
          />
          <div style={{ minHeight: CARD_CONTENT_HEIGHT, position: "relative" }}>
            {cardTabs.locations === "map" ? (
              <>
                <button
                  type="button"
                  onClick={() => setMapFullscreen(true)}
                  title="View map fullscreen"
                  style={{
                    position: "absolute", top: 4, right: 4, zIndex: 4,
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6,
                    color: "var(--text-2)", cursor: "pointer",
                  }}
                >
                  <i className="fa-solid fa-expand" style={{ fontSize: "0.78rem" }} />
                </button>
                <WorldMap countries={stats.countries} />
              </>
            ) : (
              <TabbedList
                tab={locationsTabs[cardTabs.locations]}
                title={`Locations: ${locationsTabs[cardTabs.locations].label}`}
                icon="fa-globe"
                onShowAll={setExpandedList}
              />
            )}
          </div>
        </div>
        <BreakdownCard
          id="analytics-devices"
          title="Devices"
          icon="fa-mobile-alt"
          tabs={devicesTabs}
          activeTab={cardTabs.devices}
          onTab={(t) => setCardTab("devices", t)}
          onShowAll={setExpandedList}
        />
      </div>

      {/* Site Uptime — independent of the date-range picker above (always
          shows the last 90 days, like Claude Status), and reads from tables
          a GitHub Actions ping + Supabase cron job keep filled on their own. */}
      <UptimeStatus />

      {/* Show-all modal — card lists stay capped at TOP_LIST_COLLAPSED_COUNT
          rows so no card stretches its grid partner; the full list opens here
          instead of pushing the card taller. */}
      {expandedList && (
        <Modal title={expandedList.title} icon={expandedList.icon} onClose={() => setExpandedList(null)}>
          <BreakdownList
            rows={expandedList.rows}
            valueLabel={expandedList.valueLabel}
            showPct={expandedList.showPct}
          />
        </Modal>
      )}

      {mapFullscreen && (
        <div
          className="modal-overlay"
          onClick={() => setMapFullscreen(false)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "95vw", maxWidth: 1400, height: "88vh",
              display: "flex", flexDirection: "column", padding: 20,
            }}
          >
            <div className="flex items-center justify-between mb-4" style={{ flexShrink: 0 }}>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2" style={{ margin: 0 }}>
                <i className="fas fa-globe text-[var(--brand)]"></i>
                Locations: Map
              </h3>
              <button
                type="button"
                onClick={() => setMapFullscreen(false)}
                aria-label="Close"
                style={{
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6,
                  color: "var(--text-2)", cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <WorldMap countries={stats.countries} height="100%" />
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

// ── Card scaffolding ────────────────────────────────────────────────────────
// MetricCard/CardHeader/BreakdownList/TabbedList/BreakdownCard/Modal now live
// in ./analytics/StatPrimitives, shared with PageSEO.jsx's drill-down.

export default Analytics;
