// src/Administrator/WebsiteHealth.jsx
//
// Sitewide health checks, in one place: genuinely-actionable product SEO
// gaps (computed live from the products table — NOT the same thing as
// "meta_title/meta_description are empty", which is true for effectively
// every product by design, since DispProduct.jsx derives them from name/
// description/thumbnail when left blank; flagging that would be 100% noise)
// plus a condensed view of the existing GitHub Actions checks (broken
// links, Lighthouse SEO, sitemap freshness) that already run against this
// repo — see CIStatus.jsx for the full history this links out to.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";
import { Modal } from "./analytics/StatPrimitives";

function timeAgo(d) {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CI_STATUS_STYLE = {
  success:   { label: "Passing",  color: "#22c55e", bg: "rgba(34,197,94,0.1)",  icon: "fa-circle-check" },
  failure:   { label: "Failing",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: "fa-circle-xmark" },
  cancelled: { label: "Cancelled", color: "var(--text-3)", bg: "var(--surface-2)", icon: "fa-circle-minus" },
};

// Each check runs against the already-fetched product list — no per-check
// query. `match` returning true means the product HAS the issue.
const SEO_CHECKS = [
  {
    key: "no_description",
    label: "No description content",
    severity: "high",
    hint: "Neither a short description nor a full description is set — nothing for search engines or customers to read, and no source text to derive a meta description from.",
    match: p => !p.short_description?.trim() && !p.description?.trim(),
  },
  {
    key: "no_categories",
    label: "No categories assigned",
    severity: "high",
    hint: "Won't show up on any category/catalog page — effectively invisible on the site even though it's published.",
    match: p => !p.categories || p.categories.length === 0,
  },
  {
    key: "no_thumbnail",
    label: "No featured image",
    severity: "high",
    hint: "No visual on product cards, search results, or social shares (thumbnail is also the fallback for the OG share image).",
    match: p => !p.thumbnail,
  },
  {
    key: "no_tags",
    label: "No tags",
    severity: "low",
    hint: "Optional, but tags help on-site search and cross-linking surface this product.",
    match: p => !p.tags || p.tags.length === 0,
  },
];

const SEVERITY_STYLE = {
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Fix soon" },
  low:  { color: "#f59d0b", bg: "rgba(245,157,11,0.1)", label: "Nice to have" },
};

export default function WebsiteHealth() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCheck, setOpenCheck] = useState(null);
  const [ciRuns, setCiRuns] = useState([]);
  const [ciLoading, setCiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, name, slug, status, short_description, description, categories, tags, thumbnail")
        .eq("status", "published");
      if (cancelled) return;
      if (fetchError) setError(fetchError.message);
      else setProducts(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ci_check_runs")
        .select("id, workflow, status, run_url, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      setCiRuns(data || []);
      setCiLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const latestCiByWorkflow = [];
  const seenWorkflows = new Set();
  for (const run of ciRuns) {
    if (seenWorkflows.has(run.workflow)) continue;
    seenWorkflows.add(run.workflow);
    latestCiByWorkflow.push(run);
  }

  const checkResults = SEO_CHECKS.map(check => ({
    ...check,
    matches: products.filter(check.match),
  }));

  return (
    <div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-3)", margin: "0 0 20px", maxWidth: 720 }}>
        Genuinely-actionable gaps only — this deliberately does not flag blank meta title/description
        fields, since those are designed to fall back to the product name/description/thumbnail
        automatically. What's listed below actually needs attention.
      </p>

      {error && (
        <div style={{ margin: "12px 0", padding: "12px 16px", background: "var(--danger-bg, #fef2f2)", border: "1px solid var(--danger)", borderRadius: "var(--r)", fontSize: "0.82rem", color: "var(--danger)" }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="table-loading">
          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Checking products…
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-magnifying-glass-chart" style={{ color: "var(--brand)" }} />
            Product SEO issues
            <span style={{ fontWeight: 400, fontSize: "0.75rem", color: "var(--text-3)" }}>({products.length} published products checked)</span>
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 28 }}>
            {checkResults.map(check => {
              const sev = SEVERITY_STYLE[check.severity];
              const clean = check.matches.length === 0;
              return (
                <button
                  key={check.key}
                  type="button"
                  onClick={() => !clean && setOpenCheck(check)}
                  style={{
                    textAlign: "left", padding: "14px 16px", borderRadius: "var(--r)",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    cursor: clean ? "default" : "pointer",
                  }}
                  title={check.hint}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 700, color: clean ? "#22c55e" : sev.color }}>
                      {clean ? <i className="fa-solid fa-circle-check" style={{ fontSize: "1.3rem" }} /> : check.matches.length}
                    </span>
                    {!clean && (
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, color: sev.color, background: sev.bg }}>
                        {sev.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{check.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-3)", lineHeight: 1.4 }}>
                    {clean ? "No products affected" : "Click to see which products →"}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <i className="fa-solid fa-list-check" style={{ color: "var(--brand)" }} />
        Automated checks
      </h3>
      {ciLoading ? (
        <div className="table-loading">
          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading…
        </div>
      ) : latestCiByWorkflow.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "var(--text-3)", fontStyle: "italic" }}>
          No CI runs recorded yet — broken-link and Lighthouse SEO checks run automatically via GitHub Actions.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
          {latestCiByWorkflow.map(run => {
            const cfg = CI_STATUS_STYLE[run.status] || { label: run.status, color: "var(--text-2)", bg: "var(--surface-2)", icon: "fa-circle" };
            return (
              <a key={run.workflow} href={run.run_url || undefined} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", textDecoration: "none", color: "inherit" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{run.workflow}</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, color: cfg.color, background: cfg.bg }}>
                  <i className={`fa-solid ${cfg.icon}`} style={{ fontSize: "0.62rem" }} />
                  {cfg.label}
                </span>
                <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 8 }}>{timeAgo(run.created_at)}</div>
              </a>
            );
          })}
        </div>
      )}
      <Link to="/admin/ci-status" style={{ fontSize: "0.78rem", color: "var(--brand)" }}>
        View full CI run history <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.68rem" }} />
      </Link>

      {openCheck && (
        <Modal title={openCheck.label} icon="fa-magnifying-glass-chart" onClose={() => setOpenCheck(null)}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-3)", margin: "0 0 14px" }}>{openCheck.hint}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {openCheck.matches.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, background: "var(--surface-2)" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text)" }}>{p.name}</span>
                <Link to={`/admin/products?edit=${p.id}`} style={{ fontSize: "0.75rem", color: "var(--brand)", fontWeight: 600 }}>
                  Edit <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem" }} />
                </Link>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
