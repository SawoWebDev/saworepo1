import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import DailyTrafficChart from "./DailyTrafficChart";

// Deep-links out to PostHog's Heatmaps tool (session replay + heatmaps live
// there, not duplicated in this CMS — see lib/posthog.js). PostHog doesn't
// document a reliable query param to auto-filter Heatmaps to one URL, so
// this opens the tool and the page path is shown in the tooltip/title for
// the admin to pick from PostHog's own page selector, rather than faking a
// filter param that might silently not apply.
const POSTHOG_PROJECT_URL = process.env.REACT_APP_POSTHOG_PROJECT_URL;

const Analytics = () => {
  const [dateRange, setDateRange] = useState("7days"); // 7days, 30days, 90days
  const [stats, setStats] = useState({
    totalPageViews: 0,
    uniqueVisitors: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    topPages: [],
    topCountries: [],
    deviceBreakdown: [],
    browserBreakdown: [],
    recentEvents: [],
    dailyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    const ranges = { "7days": 7, "30days": 30, "90days": 90 };
    const days = ranges[dateRange] || 7;
    try {
      setLoading(true);
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

      // Calculate metrics
      const uniqueSessions = new Set(pageViews?.map(pv => pv.session_id) || []).size;
      const totalDuration = pageViews?.reduce((sum, pv) => sum + (pv.time_on_page || 0), 0) || 0;

      // Daily views + unique visitors, zero-filled for every day in range so
      // the chart always spans the full selected period (not just days with
      // traffic).
      const dayKey = (iso) => iso.slice(0, 10); // "YYYY-MM-DD" from an ISO timestamp
      const dailyViews = {};
      const dailySessions = {};
      pageViews?.forEach(pv => {
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

      // Top pages
      const pageMap = {};
      pageViews?.forEach(pv => {
        if (!pageMap[pv.page_path]) {
          pageMap[pv.page_path] = { path: pv.page_path, views: 0, totalTime: 0 };
        }
        pageMap[pv.page_path].views += 1;
        pageMap[pv.page_path].totalTime += pv.time_on_page || 0;
      });

      const topPages = Object.values(pageMap)
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map(p => ({
          path: p.path,
          views: p.views,
          avgTime: Math.round(p.totalTime / p.views)
        }));

      // Top countries — unique visitors (sessions), not raw page views, so
      // one visitor browsing 5 pages doesn't count as "5" for their country.
      const countrySessionMap = {};
      pageViews?.forEach(pv => {
        const country = pv.country || "Unknown";
        if (!countrySessionMap[country]) countrySessionMap[country] = new Set();
        countrySessionMap[country].add(pv.session_id);
      });

      const topCountries = Object.entries(countrySessionMap)
        .map(([country, sessions]) => ({ country, visitors: sessions.size }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 10);

      // Device breakdown
      const deviceMap = {};
      pageViews?.forEach(pv => {
        const device = pv.device_type || "Unknown";
        deviceMap[device] = (deviceMap[device] || 0) + 1;
      });

      const deviceBreakdown = Object.entries(deviceMap).map(([device, count]) => ({
        device,
        count,
        percentage: Math.round((count / (pageViews?.length || 1)) * 100)
      }));

      // Browser breakdown
      const browserMap = {};
      pageViews?.forEach(pv => {
        const browser = pv.browser || "Unknown";
        browserMap[browser] = (browserMap[browser] || 0) + 1;
      });

      const browserBreakdown = Object.entries(browserMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([browser, count]) => ({
          browser,
          count,
          percentage: Math.round((count / (pageViews?.length || 1)) * 100)
        }));

      // Calculate bounce rate (sessions with only 1 page view)
      const sessionMap = {};
      pageViews?.forEach(pv => {
        if (!sessionMap[pv.session_id]) {
          sessionMap[pv.session_id] = 0;
        }
        sessionMap[pv.session_id] += 1;
      });
      const bouncedSessions = Object.values(sessionMap).filter(count => count === 1).length;
      const bounceRate = uniqueSessions > 0 ? Math.round((bouncedSessions / uniqueSessions) * 100) : 0;

      setStats({
        totalPageViews: pageViews?.length || 0,
        uniqueVisitors: uniqueSessions,
        avgSessionDuration: uniqueSessions > 0 ? Math.round(totalDuration / uniqueSessions) : 0,
        bounceRate,
        topPages,
        topCountries,
        deviceBreakdown,
        browserBreakdown,
        recentEvents: events || [],
        dailyStats
      });

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

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Analytics Dashboard</h1>
        <p className="text-[var(--text-2)]">Track visitor behavior, page performance, and traffic sources</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 flex gap-2">
        {["7days", "30days", "90days"].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              dateRange === range
                ? "bg-[var(--brand)] text-white"
                : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)]"
            }`}
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
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <i className="fas fa-chart-column text-[var(--brand)]"></i>
          Traffic Over Time
        </h3>
        <DailyTrafficChart data={stats.dailyStats} />
      </div>

      {/* Two-column layout for top pages and countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Pages */}
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <i className="fas fa-chart-bar text-[var(--brand)]"></i>
            Top Pages
          </h3>
          {stats.topPages.length > 0 ? (
            <div className="space-y-3">
              {stats.topPages.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between pb-3 border-b border-[var(--border-light)] last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{page.path}</p>
                    <p className="text-xs text-[var(--text-3)]">Avg. time: {formatTime(page.avgTime)}</p>
                  </div>
                  {POSTHOG_PROJECT_URL && (
                    <a
                      href={`${POSTHOG_PROJECT_URL}/heatmaps`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Opens PostHog Heatmaps — select "${page.path}" from the page picker there`}
                      className="ml-3 text-[var(--text-3)] hover:text-[var(--brand)] transition-colors"
                    >
                      <i className="fa-solid fa-fire"></i>
                    </a>
                  )}
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold text-[var(--brand)]">{page.views}</p>
                    <p className="text-xs text-[var(--text-3)]">views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-3)] text-sm">No data available</p>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <i className="fas fa-globe text-[var(--brand)]"></i>
            Top Countries
          </h3>
          {stats.topCountries.length > 0 ? (
            <div className="space-y-3">
              {stats.topCountries.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between pb-3 border-b border-[var(--border-light)] last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text)]">{item.country}</p>
                  </div>
                  <div className="ml-4">
                    <div className="w-32 bg-[var(--surface-2)] rounded-full h-2">
                      <div
                        className="bg-[var(--brand)] h-2 rounded-full"
                        style={{ width: `${(item.visitors / stats.topCountries[0].visitors) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right min-w-[50px]">
                    <p className="text-lg font-bold text-[var(--brand)]">{item.visitors}</p>
                    <p className="text-xs text-[var(--text-3)]">visitors</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-3)] text-sm">No data available</p>
          )}
        </div>
      </div>

      {/* Device and Browser Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Device Breakdown */}
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <i className="fas fa-mobile-alt text-[var(--brand)]"></i>
            Device Types
          </h3>
          {stats.deviceBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.deviceBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--text)]">{item.device}</span>
                      <span className="text-sm font-bold text-[var(--brand)]">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-[var(--surface-2)] rounded-full h-2">
                      <div
                        className="bg-[var(--brand)] h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-3)] text-sm">No data available</p>
          )}
        </div>

        {/* Browser Breakdown */}
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <i className="fas fa-compass text-[var(--brand)]"></i>
            Top Browsers
          </h3>
          {stats.browserBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.browserBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--text)]">{item.browser}</span>
                      <span className="text-sm font-bold text-[var(--brand)]">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-[var(--surface-2)] rounded-full h-2">
                      <div
                        className="bg-[var(--brand)] h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-3)] text-sm">No data available</p>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <i className="fas fa-history text-[var(--brand)]"></i>
          Recent User Events
        </h3>
        {stats.recentEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-2 font-medium text-[var(--text-2)]">Event</th>
                  <th className="text-left py-2 px-2 font-medium text-[var(--text-2)]">Page</th>
                  <th className="text-left py-2 px-2 font-medium text-[var(--text-2)]">Time</th>
                  <th className="text-left py-2 px-2 font-medium text-[var(--text-2)]">Details</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.slice(0, 10).map((event, idx) => (
                  <tr key={idx} className="border-b border-[var(--border-light)] hover:bg-[var(--brand-muted)]">
                    <td className="py-2 px-2 text-[var(--text)] font-medium">{event.event_name}</td>
                    <td className="py-2 px-2 text-[var(--text-2)]">{event.page_path || "-"}</td>
                    <td className="py-2 px-2 text-[var(--text-3)]">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-2 text-[var(--text-3)]">
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

function MetricCard({ icon, title, value, subtitle }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[var(--text-3)] text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-[var(--text)]">{value}</p>
          <p className="text-xs text-[var(--text-3)] mt-1">{subtitle}</p>
        </div>
        <i className={`fas ${icon} text-2xl text-[var(--brand)] opacity-70`}></i>
      </div>
    </div>
  );
}

export default Analytics;
