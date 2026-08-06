// src/Administrator/Dashboard.jsx
//
// Admin landing page (/admin/dashboard). At-a-glance traffic + catalog status
// + recent activity, so /admin isn't just a redirect straight to Products.
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";
import { getCache, setCache } from "./adminCache";
import { computeStats } from "./analytics/computeStats";
import { getPerms } from "./permissions";
import { useLocalProducts } from "./Local/useLocalProducts";
import DailyTrafficChart from "./DailyTrafficChart";
import { MetricCard } from "./analytics/StatPrimitives";

const DASHBOARD_CACHE_KEY = "admin:dashboard:v1";
const RECENT_ACTIVITY_LIMIT = 10;
const RECENT_PRODUCTS_LIMIT = 8;

function resolveImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  return pathOrUrl;
}

function getThumbnail(product) {
  return resolveImageUrl(product?.local_thumbnail || product?.thumbnail);
}

function statusLabel(p) {
  if (!p.visible) return "Hidden";
  return p.status === "published" ? "Published" : "Draft";
}

function timeAgo(d) {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ACTION_CONFIG = {
  create: { label: "Created", color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: "fa-circle-plus" },
  update: { label: "Updated", color: "var(--brand, #6366f1)", bg: "rgba(99,102,241,0.1)", icon: "fa-pen-to-square" },
  delete: { label: "Deleted", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "fa-trash" },
};

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || { label: action, color: "var(--text-2)", bg: "var(--surface-2)", icon: "fa-circle" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      fontSize: "0.72rem", fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}30`,
    }}>
      <i className={`fa-solid ${cfg.icon}`} style={{ fontSize: "0.65rem" }} />
      {cfg.label}
    </span>
  );
}

const QUICK_ACTIONS = [
  { to: "/admin/products", cap: "products.create", label: "New Product", icon: "fa-solid fa-box" },
  { to: "/admin/sauna-rooms", cap: "sauna_rooms.create", label: "New Sauna Room", icon: "fa-solid fa-home" },
  { to: "/admin/analytics", cap: "page.analytics", label: "Analytics", icon: "fa-solid fa-chart-line" },
  { to: "/admin/logs", cap: "page.logs", label: "Logs", icon: "fa-solid fa-file-alt" },
];

export default function Dashboard({ currentUser }) {
  const perms = getPerms(currentUser);

  const [data, setData] = useState(() => getCache(DASHBOARD_CACHE_KEY) || null);
  const [loading, setLoading] = useState(() => !getCache(DASHBOARD_CACHE_KEY));
  const [error, setError] = useState(null);

  // Product list comes from the same hook the public frontend and the
  // Products page use, so counts and the "recently added" list stay correct
  // whether the site is currently serving from Supabase, the GitHub JSON
  // snapshot, or the accessories JSON file — not just whatever's live in
  // Supabase at this moment.
  const { products, loading: productsLoading } = useLocalProducts();

  const fetchDashboard = useCallback(async () => {
    const cached = getCache(DASHBOARD_CACHE_KEY);
    if (cached) setData(cached); else setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const [{ data: pageViews, error: pvErr }, { data: events, error: evErr }, { data: activity, error: actErr }] = await Promise.all([
        supabase.from("analytics_page_views").select("*").gte("timestamp", startDate.toISOString()),
        supabase.from("analytics_events").select("*").gte("timestamp", startDate.toISOString()).limit(50),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(RECENT_ACTIVITY_LIMIT),
      ]);

      if (pvErr) throw pvErr;
      if (evErr) throw evErr;
      if (actErr) throw actErr;

      const stats = computeStats(pageViews || [], events || [], startDate);
      const newData = { stats, activity: activity || [] };
      setData(newData);
      setCache(DASHBOARD_CACHE_KEY, newData);
      setError(null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, RECENT_PRODUCTS_LIMIT);

  const draftCount = products.filter(p => p.status === "draft").length;
  const hiddenCount = products.filter(p => p.visible === false).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-[var(--brand)] mb-4"></i>
          <p className="text-[var(--text-2)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const activity = data?.activity || [];

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 bg-[var(--danger-bg)] border border-[var(--danger)] rounded p-4 text-[var(--danger)]">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        {QUICK_ACTIONS.filter(a => perms.can(a.cap)).map(a => (
          <Link key={a.to} to={a.to} className="btn btn-ghost">
            <i className={a.icon} style={{ marginRight: 6 }} />
            {a.label}
          </Link>
        ))}
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon="fa-eye"
          title="Page Views (7d)"
          value={(stats?.totalPageViews ?? 0).toLocaleString()}
          subtitle="Last 7 days"
        />
        <MetricCard
          icon="fa-users"
          title="Unique Visitors (7d)"
          value={(stats?.uniqueVisitors ?? 0).toLocaleString()}
          subtitle="Last 7 days"
        />
        <MetricCard
          icon="fa-box"
          title="Products"
          value={productsLoading ? "-" : products.length.toLocaleString()}
          subtitle={productsLoading ? "Loading..." : `${draftCount} draft · ${hiddenCount} hidden`}
        />
        <MetricCard
          icon="fa-file-alt"
          title="Recent Changes"
          value={activity.length}
          subtitle="Last 10 logged"
        />
      </div>

      {/* Traffic chart */}
      <div className="card card-body mb-8">
        <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <i className="fas fa-chart-column text-[var(--brand)]"></i>
          Traffic: Last 7 Days
        </h3>
        {stats?.dailyStats?.length > 0 ? (
          <DailyTrafficChart data={stats.dailyStats} />
        ) : (
          <div className="empty-state">No traffic data for this period yet.</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently added products */}
        <div className="card card-body">
          <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <i className="fas fa-box-open text-[var(--brand)]"></i>
            Recently Added Products
          </h3>
          {productsLoading ? (
            <div className="empty-state">Loading products...</div>
          ) : recentProducts.length === 0 ? (
            <div className="empty-state">No products yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentProducts.map(p => (
                <Link
                  key={p.id}
                  to="/admin/products"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 8px", borderRadius: 6, textDecoration: "none",
                  }}
                  className="hover:shadow-md transition-shadow"
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 6, overflow: "hidden",
                    background: "var(--surface-2)", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {getThumbnail(p) ? (
                      <img src={getThumbnail(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="fa-solid fa-image" style={{ color: "var(--text-3)", fontSize: "0.85rem" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-sm font-medium text-[var(--text)] truncate" style={{ margin: 0 }}>{p.name}</p>
                    <p className="text-xs text-[var(--text-3)]" style={{ margin: 0 }}>{statusLabel(p)}</p>
                  </div>
                  {p.created_at && (
                    <span className="text-xs text-[var(--text-3)]" style={{ flexShrink: 0 }}>{timeAgo(p.created_at)}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card card-body">
          <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <i className="fas fa-history text-[var(--brand)]"></i>
            Recent Activity
          </h3>
          {activity.length === 0 ? (
            <div className="empty-state">No activity recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activity.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
                  <ActionBadge action={a.action} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-sm text-[var(--text)] truncate" style={{ margin: 0 }}>
                      {a.entity_name || a.entity_id || a.entity}
                    </p>
                    <p className="text-xs text-[var(--text-3)]" style={{ margin: 0 }}>
                      {a.username ? `@${a.username}` : "system"} · {timeAgo(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {perms.can("page.logs") && (
            <Link to="/admin/logs" className="btn btn-ghost btn-sm w-full justify-center mt-3">
              View all logs
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
