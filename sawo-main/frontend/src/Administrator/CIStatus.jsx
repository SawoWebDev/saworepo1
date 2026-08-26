// src/Administrator/CIStatus.jsx
//
// Read-only view of the last runs of the GitHub Actions checks that run
// against this repo (Lighthouse SEO, sitemap freshness, sitemap ping,
// Supabase keep-alive, broken-link checker). Each workflow POSTs its own
// result to the ci_check_runs table (service-role key, see
// docs/SEO-AUTOMATION.md / docs/SUPABASE-KEEPALIVE.md / docs/BROKEN-LINK-CHECKER.md)
// — this page just reads it back over the anon key, same pattern as Logs.jsx.
import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import ScrollArea from "./ScrollArea";
import Pagination from "./Pagination";
import { usePagination } from "./usePagination";

const RUNS_LIMIT = 100;

function timeAgo(d) {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CONFIG = {
  success:   { label: "Success",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",  icon: "fa-circle-check" },
  failure:   { label: "Failure",   color: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: "fa-circle-xmark" },
  cancelled: { label: "Cancelled", color: "var(--text-3)", bg: "var(--surface-2)", icon: "fa-circle-minus" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "var(--text-2)", bg: "var(--surface-2)", icon: "fa-circle" };
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

export default function CIStatus() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from("ci_check_runs")
        .select("id, workflow, status, run_url, created_at")
        .order("created_at", { ascending: false })
        .limit(RUNS_LIMIT);
      if (cancelled) return;
      if (fetchError) setError(fetchError.message);
      else setRuns(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Most recent run per workflow, for the summary cards.
  const latestByWorkflow = [];
  const seen = new Set();
  for (const run of runs) {
    if (seen.has(run.workflow)) continue;
    seen.add(run.workflow);
    latestByWorkflow.push(run);
  }

  const { page, setPage, pageSize, setPageSize, totalPages, totalCount, pageItems } = usePagination(runs, { initialPageSize: 25 });

  return (
    <div className="cms-scroll-page">
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

      {loading ? (
        <div className="table-loading">
          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading CI status…
        </div>
      ) : runs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-3)", fontStyle: "italic", fontSize: "0.82rem" }}>
          No CI runs recorded yet. Trigger a workflow manually from GitHub's Actions
          tab (Lighthouse SEO Check, Sitemap Freshness Check, Sitemap Search-Engine
          Ping, Supabase Keep-Alive, or Broken Link Checker) — results will appear
          here after the next run.
        </div>
      ) : (
        <>
          {/* Latest-per-workflow summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
            {latestByWorkflow.map((run) => (
              <a
                key={run.workflow}
                href={run.run_url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", padding: "14px 16px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--r)", textDecoration: "none", color: "inherit",
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                  {run.workflow}
                </div>
                <StatusBadge status={run.status} />
                <div style={{ fontSize: "0.7rem", color: "var(--text-3)", marginTop: 8 }}>
                  {timeAgo(run.created_at)}
                </div>
              </a>
            ))}
          </div>

          {/* Full recent-runs table */}
          <ScrollArea>
          <div className="products-table-wrap">
            <table className="products-table" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>When</th>
                  <th style={{ width: "35%" }}>Workflow</th>
                  <th style={{ width: "20%", textAlign: "center" }}>Status</th>
                  <th style={{ width: "20%", textAlign: "center" }}>Run</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((run) => (
                  <tr key={run.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-2)", lineHeight: 1.2 }}>{timeAgo(run.created_at)}</div>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-3)", lineHeight: 1.2 }}>{formatDate(run.created_at)}</div>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text)" }}>{run.workflow}</td>
                    <td style={{ textAlign: "center" }}><StatusBadge status={run.status} /></td>
                    <td style={{ textAlign: "center" }}>
                      {run.run_url ? (
                        <a href={run.run_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--brand)" }}>
                          View <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem" }} />
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </ScrollArea>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="runs"
          />
        </>
      )}
    </div>
  );
}
