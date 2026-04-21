// src/Administrator/Logs.jsx
//
// Activity Logs page — shows every create / update / delete event written by
// logActivity() across the CMS.  Read-only; no mutations.
//
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    month:  "short",
    day:    "numeric",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgo(d) {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Action badge config ───────────────────────────────────────────────────────
const ACTION_CONFIG = {
  create: { label: "Created", color: "#22c55e",  bg: "rgba(34,197,94,0.1)",   icon: "fa-circle-plus"     },
  update: { label: "Updated", color: "var(--brand, #6366f1)", bg: "rgba(99,102,241,0.1)", icon: "fa-pen-to-square" },
  delete: { label: "Deleted", color: "#ef4444",  bg: "rgba(239,68,68,0.1)",   icon: "fa-trash"           },
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

// ─── Entity badge ─────────────────────────────────────────────────────────────
function EntityBadge({ entity }) {
  const map = {
    product: { label: "Product", icon: "fa-box",  color: "#f59e0b" },
    user:    { label: "User",    icon: "fa-user", color: "#8b5cf6" },
  };
  const cfg = map[entity] || { label: entity, icon: "fa-circle-dot", color: "var(--text-3)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: "0.72rem", fontWeight: 600, color: cfg.color,
    }}>
      <i className={`fa-solid ${cfg.icon}`} style={{ fontSize: "0.68rem" }} />
      {cfg.label}
    </span>
  );
}

// ─── Simple username display ──────────────────────────────────────────────────
function UserChip({ username }) {
  if (!username) return <span style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>—</span>;
  return (
    <span style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
      @{username}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Logs() {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Filters
  const [search,       setSearch]       = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterUser,   setFilterUser]   = useState("");

  // Pagination
  const PAGE_SIZE = 50;
  const [page,      setPage]      = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterAction) q = q.eq("action", filterAction);
      if (filterEntity) q = q.eq("entity", filterEntity);
      if (filterUser)   q = q.eq("username", filterUser);
      if (search)       q = q.ilike("entity_name", `%${search}%`);

      const { data, error: qErr, count } = await q;
      if (qErr) throw qErr;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEntity, filterUser, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [filterAction, filterEntity, filterUser, search]);

  // Distinct usernames for the user filter dropdown
  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => {
    supabase.from("activity_logs").select("username").then(({ data }) => {
      const names = [...new Set((data || []).map(r => r.username).filter(Boolean))].sort();
      setAllUsers(names);
    });
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="products-page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: "0.5rem", color: "var(--brand)" }} />
            Activity Logs
          </h1>
          <p className="products-subtitle">
            {loading ? "Loading…" : `${totalCount.toLocaleString()} events recorded`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={fetchLogs}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}
        >
          <i className="fa-solid fa-rotate" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="products-toolbar" style={{ flexWrap: "wrap" }}>
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product name…"
          />
        </div>

        <select className="filter-select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">All Actions</option>
          <option value="create">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
        </select>

        <select className="filter-select" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
          <option value="">All Types</option>
          <option value="product">Product</option>
          <option value="user">User</option>
        </select>

        <select className="filter-select" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
          <option value="">All Users</option>
          {allUsers.map(u => <option key={u} value={u}>@{u}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: "12px 0", padding: "12px 16px",
          background: "var(--danger-bg, #fef2f2)",
          border: "1px solid var(--danger)",
          borderRadius: "var(--r)",
          fontSize: "0.82rem", color: "var(--danger)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <i className="fa-solid fa-triangle-exclamation" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="products-table-wrap">
        {loading ? (
          <div className="table-loading">
            <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading logs…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-3)", fontStyle: "italic", fontSize: "0.82rem" }}>
            {search || filterAction || filterEntity || filterUser
              ? "No logs match the current filters."
              : "No activity recorded yet. Logs will appear here after you create, edit, or delete products."}
          </div>
        ) : (
          <table className="products-table" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "20%" }}>When</th>
                <th style={{ width: "20%", textAlign: "center" }}>Action</th>
                <th style={{ width: "20%", textAlign: "center" }}>Type</th>
                <th style={{ width: "20%", textAlign: "center" }}>Details</th>
                <th style={{ width: "20%" }}>By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  {/* When */}
                  <td className="tbl-date" style={{ whiteSpace: "nowrap", paddingRight: 8 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-2)", lineHeight: 1.2 }}>{timeAgo(log.created_at)}</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-3)", lineHeight: 1.2 }}>{formatDate(log.created_at)}</div>
                  </td>

                  {/* Action */}
                  <td style={{ textAlign: "center" }}><ActionBadge action={log.action} /></td>

                  {/* Entity type */}
                  <td style={{ textAlign: "center" }}><EntityBadge entity={log.entity} /></td>

                  {/* Details */}
                  <td style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.82rem", color: "var(--text)", marginBottom: 4 }}>
                      {log.entity_name || <span style={{ color: "var(--text-3)", fontStyle: "italic", fontWeight: 400 }}>Unnamed</span>}
                    </div>
                    {log.meta && (
                      <div style={{ fontSize: "0.7rem", color: "var(--text-3)", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                        {log.meta.bulk && <span style={{ background: "var(--surface-2)", padding: "2px 6px", borderRadius: 3, fontWeight: 500 }}>bulk delete</span>}
                        {log.meta.deleted_files > 0 && <span style={{ background: "var(--surface-2)", padding: "2px 6px", borderRadius: 3 }}>📎 {log.meta.deleted_files} file{log.meta.deleted_files !== 1 ? 's' : ''}</span>}
                        {log.meta.had_images && <span style={{ background: "var(--surface-2)", padding: "2px 6px", borderRadius: 3 }}>🖼️ with images</span>}
                      </div>
                    )}
                  </td>

                  {/* By */}
                  <td><UserChip username={log.username} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 16, padding: "0 4px",
          fontSize: "0.78rem", color: "var(--text-2)",
        }}>
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            {/* Page number pills — show up to 7 */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p;
              if (totalPages <= 7) {
                p = i;
              } else if (page < 4) {
                p = i;
              } else if (page > totalPages - 5) {
                p = totalPages - 7 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${page === p ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setPage(p)}
                  style={{ minWidth: 32 }}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      )}

      {/* SQL hint shown when table is empty */}
      {!loading && logs.length === 0 && !search && !filterAction && !filterEntity && !filterUser && (
        <div style={{
          marginTop: 24, padding: "14px 18px",
          background: "var(--surface-2)", border: "1px dashed var(--border)",
          borderRadius: "var(--r)", fontSize: "0.78rem", color: "var(--text-3)", lineHeight: 1.8,
        }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 6, color: "var(--brand)" }} />
          If you see a <strong>relation does not exist</strong> error, run the SQL migration in{" "}
          <strong>Supabase → SQL Editor</strong> to create the <code>activity_logs</code> table.
          See <code>LOGS_SETUP.md</code> for the full script.
        </div>
      )}
    </div>
  );
}