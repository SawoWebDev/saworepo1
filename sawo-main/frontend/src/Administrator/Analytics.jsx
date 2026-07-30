import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import DailyTrafficChart from "./DailyTrafficChart";
import { getCache, setCache } from "./adminCache";
import { computeStats } from "./analytics/computeStats";
import WorldMap from "./analytics/WorldMap";
import {
  CARD_CONTENT_HEIGHT,
  MetricCard,
  CardHeader,
  BreakdownList,
  TabbedList,
  BreakdownCard,
} from "./analytics/StatPrimitives";

// v2: cache shape changed with the Plausible-style rework (sources/entry-exit/
// regions/os/size lists) — new key so a stale pre-rework cache object from an
// earlier session can't render against the new card structure.
const analyticsCacheKey = (dateRange) => `admin:analytics:v2:${dateRange}`;

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
  const [dateRange, setDateRange] = useState("7days"); // 7days, 30days, 90days
  // Which tab is active inside each breakdown card. Switching tabs only
  // re-selects from the already-computed stats — zero extra fetches.
  const [cardTabs, setCardTabs] = useState({
    sources: "sources",
    pages: "top",
    locations: "map",
    devices: "browser",
  });
  const [expandedList, setExpandedList] = useState(null); // { title, icon, rows, valueLabel, showPct }
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [stats, setStats] = useState(() => getCache(analyticsCacheKey("7days")) || EMPTY_STATS);
  const [loading, setLoading] = useState(() => !getCache(analyticsCacheKey("7days")));
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    const ranges = { "7days": 7, "30days": 30, "90days": 90 };
    const days = ranges[dateRange] || 7;
    const cacheKey = analyticsCacheKey(dateRange);
    const cached = getCache(cacheKey);
    // Already have this range's data on screen (seeded at mount, or from a
    // prior visit to this tab within the session) — refresh quietly instead
    // of flashing the full-page spinner.
    if (cached) setStats(cached); else setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch page views
      const { data: pageViews, error: pvError } = await supabase
        .from("analytics_page_views")
        .select("*")
        .gte("timestamp", startDate.toISOString());

      if (pvError) throw pvError;

      // Fetch events
      const { data: events, error: evError } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .limit(50);

      if (evError) throw evError;

      const newStats = computeStats(pageViews, events, startDate);
      setStats(newStats);
      setCache(cacheKey, newStats);

      setError(null);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => { setExpandedList(null); }, [dateRange]);

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
    top:   { label: "Top pages",   rows: stats.topPages.map(p => ({ ...p, value: p.views, sub: `Avg. time: ${formatTime(p.avgTime)}`, posthog: true })), valueLabel: "Views", showPct: false },
    entry: { label: "Entry pages", rows: stats.entryPages, valueLabel: "Visitors",     showPct: false },
    exit:  { label: "Exit pages",  rows: stats.exitPages,  valueLabel: "Unique exits", showPct: false },
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
      {/* Date Range Filter — pill tabs, same component as Taxonomy's tabs.
          .tax-tabs hardcodes margin-bottom:0 (Taxonomy sits it right above
          its own toolbar), which silently cancelled the mb-6 here — hence
          the inline override. */}
      <div className="tax-tabs mb-6" style={{ marginBottom: 24 }}>
        {["7days", "30days", "90days"].map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => setDateRange(range)}
            className={`tax-tab-btn${dateRange === range ? " active" : ""}`}
          >
            {range === "7days" ? "Last 7 days" : range === "30days" ? "Last 30 days" : "Last 90 days"}
          </button>
        ))}
      </div>

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
      <div id="analytics-traffic-chart" className="card card-body mb-8">
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

      {/* Row 2: Locations | Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div id="analytics-locations" className="card card-body">
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
                title={`Locations — ${locationsTabs[cardTabs.locations].label}`}
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
                Locations — Map
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

      {/* Recent Events */}
      <div className="card card-body">
        <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <i className="fas fa-history text-[var(--brand)]"></i>
          Recent User Events
        </h3>
        {stats.recentEvents.length > 0 ? (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Page</th>
                  <th>Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.slice(0, 10).map((event, idx) => (
                  <tr key={idx}>
                    <td style={{ color: "var(--text)", fontWeight: 500 }}>{event.event_name}</td>
                    <td style={{ color: "var(--text-2)" }}>{event.page_path || "-"}</td>
                    <td style={{ color: "var(--text-3)" }}>{new Date(event.timestamp).toLocaleString()}</td>
                    <td style={{ color: "var(--text-3)" }}>
                      {event.event_data ? JSON.stringify(event.event_data).substring(0, 50) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[var(--text-3)] text-sm">No recent events</p>
        )}
      </div>

    </div>
  );
};

// ── Card scaffolding ────────────────────────────────────────────────────────
// MetricCard/CardHeader/BreakdownList/TabbedList/BreakdownCard now live in
// ./analytics/StatPrimitives — Modal stays here as it's specific to this
// page's "show all" list expansion.

function Modal({ title, icon, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {icon && <i className={`fas ${icon} text-[var(--brand)]`} style={{ marginRight: 8 }}></i>}
            {title}
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
