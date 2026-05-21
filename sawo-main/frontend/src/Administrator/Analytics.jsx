import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

const Analytics = ({ currentUser }) => {
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
    recentEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const getDaysFromRange = () => {
    const ranges = { "7days": 7, "30days": 30, "90days": 90 };
    return ranges[dateRange] || 7;
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = getDaysFromRange();
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

      // Top countries
      const countryMap = {};
      pageViews?.forEach(pv => {
        const country = pv.country || "Unknown";
        countryMap[country] = (countryMap[country] || 0) + 1;
      });

      const topCountries = Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }));

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
        recentEvents: events || []
      });

      setError(null);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-[#af8564] mb-4"></i>
          <p className="text-[#666]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#333] mb-2">Analytics Dashboard</h1>
        <p className="text-[#666]">Track visitor behavior, page performance, and traffic sources</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 flex gap-2">
        {["7days", "30days", "90days"].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              dateRange === range
                ? "bg-[#af8564] text-white"
                : "bg-[#f5f1ed] text-[#333] hover:bg-[#e8e1da]"
            }`}
          >
            {range === "7days" ? "Last 7 days" : range === "30days" ? "Last 30 days" : "Last 90 days"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded p-4 text-red-700">
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

      {/* Two-column layout for top pages and countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Pages */}
        <div className="bg-white rounded-lg border border-[#ddd] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#333] mb-4 flex items-center gap-2">
            <i className="fas fa-chart-bar text-[#af8564]"></i>
            Top Pages
          </h3>
          {stats.topPages.length > 0 ? (
            <div className="space-y-3">
              {stats.topPages.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#333] truncate">{page.path}</p>
                    <p className="text-xs text-[#999]">Avg. time: {formatTime(page.avgTime)}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-bold text-[#af8564]">{page.views}</p>
                    <p className="text-xs text-[#999]">views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#999] text-sm">No data available</p>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-lg border border-[#ddd] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#333] mb-4 flex items-center gap-2">
            <i className="fas fa-globe text-[#af8564]"></i>
            Top Countries
          </h3>
          {stats.topCountries.length > 0 ? (
            <div className="space-y-3">
              {stats.topCountries.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#333]">{item.country}</p>
                  </div>
                  <div className="ml-4">
                    <div className="w-32 bg-[#f0f0f0] rounded-full h-2">
                      <div
                        className="bg-[#af8564] h-2 rounded-full"
                        style={{ width: `${(item.count / stats.topCountries[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right min-w-[50px]">
                    <p className="text-lg font-bold text-[#af8564]">{item.count}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#999] text-sm">No data available</p>
          )}
        </div>
      </div>

      {/* Device and Browser Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Device Breakdown */}
        <div className="bg-white rounded-lg border border-[#ddd] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#333] mb-4 flex items-center gap-2">
            <i className="fas fa-mobile-alt text-[#af8564]"></i>
            Device Types
          </h3>
          {stats.deviceBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.deviceBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-[#333]">{item.device}</span>
                      <span className="text-sm font-bold text-[#af8564]">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-[#f0f0f0] rounded-full h-2">
                      <div
                        className="bg-[#af8564] h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#999] text-sm">No data available</p>
          )}
        </div>

        {/* Browser Breakdown */}
        <div className="bg-white rounded-lg border border-[#ddd] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#333] mb-4 flex items-center gap-2">
            <i className="fas fa-compass text-[#af8564]"></i>
            Top Browsers
          </h3>
          {stats.browserBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.browserBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-[#333]">{item.browser}</span>
                      <span className="text-sm font-bold text-[#af8564]">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-[#f0f0f0] rounded-full h-2">
                      <div
                        className="bg-[#af8564] h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#999] text-sm">No data available</p>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg border border-[#ddd] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#333] mb-4 flex items-center gap-2">
          <i className="fas fa-history text-[#af8564]"></i>
          Recent User Events
        </h3>
        {stats.recentEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#ddd]">
                  <th className="text-left py-2 px-2 font-medium text-[#666]">Event</th>
                  <th className="text-left py-2 px-2 font-medium text-[#666]">Page</th>
                  <th className="text-left py-2 px-2 font-medium text-[#666]">Time</th>
                  <th className="text-left py-2 px-2 font-medium text-[#666]">Details</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.slice(0, 10).map((event, idx) => (
                  <tr key={idx} className="border-b border-[#f0f0f0] hover:bg-[#f9f7f5]">
                    <td className="py-2 px-2 text-[#333] font-medium">{event.event_name}</td>
                    <td className="py-2 px-2 text-[#666]">{event.page_path || "-"}</td>
                    <td className="py-2 px-2 text-[#999]">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-2 text-[#999]">
                      {event.event_data ? JSON.stringify(event.event_data).substring(0, 50) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#999] text-sm">No recent events</p>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-blue-700 text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          <strong>Note:</strong> Analytics data is collected from page views and user events. Make sure Google Analytics 4 and custom tracking are properly configured in the application.
        </p>
      </div>
    </div>
  );
};

function MetricCard({ icon, title, value, subtitle }) {
  return (
    <div className="bg-white rounded-lg border border-[#ddd] p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[#999] text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-[#333]">{value}</p>
          <p className="text-xs text-[#999] mt-1">{subtitle}</p>
        </div>
        <i className={`fas ${icon} text-2xl text-[#af8564] opacity-70`}></i>
      </div>
    </div>
  );
}

export default Analytics;
