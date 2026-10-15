// Administrator/Translations/TranslationProductsGrid.jsx
//
// Product x Locale status matrix — modeled directly on RolesPermissions.jsx's
// Permission x Role table (same products-table/products-table-wrap CSS,
// same row/column shape), swapping role columns for
// PRODUCT_TRANSLATION_LOCALES and checkbox cells for StatusIcon cells.
// Each cell links to the per-product detail sub-route
// (/admin/translations/products/:productId), landing on that locale's tab.
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCT_TRANSLATION_LOCALES } from "../../i18n/productTranslationLocales";
import StatusIcon from "./StatusIcon";
import { FIELD_STATUS } from "../Local/translationStatus";
import { useTranslationJobs, startTranslationJob, cancelTranslationJob } from "./translationJobs";
import ScrollArea from "../ScrollArea";
import Pagination from "../Pagination";
import { usePagination } from "../usePagination";

const NEW_WITHIN_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const time = (v) => (v ? new Date(v).getTime() || 0 : 0);
const needsWork = (locales) => Object.values(locales).some((l) => l.rollup !== FIELD_STATUS.CURRENT);
// Missing outranks needs-update: a brand-new product with nothing
// translated should sit above one with a single edited field.
const urgency = (locales) => {
  const r = Object.values(locales).map((l) => l.rollup);
  if (r.includes(FIELD_STATUS.MISSING)) return 2;
  if (r.includes(FIELD_STATUS.NEEDS_UPDATE)) return 1;
  return 0;
};

const SORTERS = {
  // Default: anything untranslated/outdated first, newest additions at the
  // top of each group, so freshly added products are the first thing seen.
  attention: (a, b) =>
    urgency(b.locales) - urgency(a.locales) || time(b.product.created_at) - time(a.product.created_at),
  newest:  (a, b) => time(b.product.created_at) - time(a.product.created_at),
  updated: (a, b) => time(b.product.updated_at) - time(a.product.updated_at),
  name:    (a, b) => a.product.name.localeCompare(b.product.name),
};

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

// Right-hand "Translate" cell. The job itself runs in AdminLayout's runner
// (see translationJobs.js) — this only starts/cancels it and shows progress,
// which comes from the database, so it survives a page refresh.
function TranslateCell({ product, locales, job, canTranslate, currentUser }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const pendingLocales = PRODUCT_TRANSLATION_LOCALES.map((l) => l.code).filter((c) => locales[c].rollup !== FIELD_STATUS.CURRENT);
  const active = job && (job.status === "queued" || job.status === "running");

  const run = async (fn) => {
    setBusy(true); setErr(null);
    try { await fn(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (active) {
    const done = job.done_locales?.length || 0;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, whiteSpace: "nowrap" }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "var(--accent, #af8564)" }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
          {job.status === "queued" ? "Queued…" : `Translating ${done}/${job.locales.length}${job.current_locale ? ` · ${job.current_locale.toUpperCase()}` : ""}`}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !canTranslate} onClick={() => run(() => cancelTranslationJob(job.id))} title="Stop translating this product">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, whiteSpace: "nowrap" }}>
      {job?.status === "failed" && (
        <span style={{ fontSize: "0.72rem", color: "var(--danger)" }} title={job.error || ""}>
          <i className="fa-solid fa-triangle-exclamation" /> Failed
        </span>
      )}
      {job?.status === "done" && pendingLocales.length === 0 && (
        <span style={{ fontSize: "0.72rem", color: "var(--success)" }}><i className="fa-solid fa-check" /> Done</span>
      )}
      {err && <span style={{ fontSize: "0.72rem", color: "var(--danger)" }} title={err}><i className="fa-solid fa-triangle-exclamation" /></span>}
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={busy || !canTranslate || pendingLocales.length === 0}
        title={pendingLocales.length ? `AI-translate ${pendingLocales.map((c) => c.toUpperCase()).join(", ")}` : "All languages are up to date"}
        onClick={() => run(() => startTranslationJob({ product, locales: pendingLocales, currentUser }))}
      >
        {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-language" />}
        {job?.status === "failed" ? " Retry" : " Translate"}
      </button>
    </div>
  );
}

export default function TranslationProductsGrid({ grid, currentUser, canTranslate = false, onJobFinished }) {
  const navigate = useNavigate();
  const jobs = useTranslationJobs({ onJobFinished });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | needs_update | missing
  const [sortBy, setSortBy] = useState("attention");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return grid.filter(({ product, locales }) => {
      if (q && !product.name.toLowerCase().includes(q) && !(product.slug || "").toLowerCase().includes(q)) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "pending") return needsWork(locales);
      return Object.values(locales).some((l) => l.rollup === statusFilter.toUpperCase());
    }).sort(SORTERS[sortBy]);
  }, [grid, search, statusFilter, sortBy]);

  const now = Date.now();

  const goToProduct = (productId, localeCode) => {
    navigate(`/admin/translations/products/${productId}${localeCode ? `?locale=${localeCode}` : ""}`);
  };

  const { page, setPage, pageSize, setPageSize, totalPages, totalCount, pageItems } = usePagination(filtered, { initialPageSize: 25 });

  return (
    <div className="cms-scroll-page">
      <div className="products-toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="search-input"
            type="text"
            placeholder="Search product name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Needs translation (any)</option>
            <option value="needs_update">Has languages needing update</option>
            <option value="missing">Has languages missing</option>
          </select>
          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Sort order">
            <option value="attention">Needs translation first</option>
            <option value="newest">Recently added</option>
            <option value="updated">Recently updated</option>
            <option value="name">Name (A–Z)</option>
          </select>
          <span style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{filtered.length} of {grid.length} products</span>
        </div>
      </div>

      <ScrollArea>
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th style={{ width: 120 }}>Added</th>
              {PRODUCT_TRANSLATION_LOCALES.map((l) => (
                <th key={l.code} style={{ textAlign: "center", width: 70 }} title={l.label}>{l.code.toUpperCase()}</th>
              ))}
              <th style={{ textAlign: "right", width: 230 }}>AI Translate</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(({ product, locales }) => (
              <tr key={product.id}>
                <td style={{ fontSize: "0.85rem" }}>
                  <button
                    type="button"
                    onClick={() => goToProduct(product.id)}
                    style={{ background: "none", border: "none", padding: 0, color: "var(--text)", cursor: "pointer", textAlign: "left", font: "inherit" }}
                  >
                    {product.name}
                  </button>
                  {now - time(product.created_at) < NEW_WITHIN_DAYS * DAY_MS && (
                    <span style={{ marginLeft: 8, padding: "1px 7px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: "var(--accent, #af8564)", color: "#fff", verticalAlign: "middle" }}>
                      NEW
                    </span>
                  )}
                </td>
                <td style={{ fontSize: "0.78rem", color: "var(--text-2)", whiteSpace: "nowrap" }} title={product.updated_at ? `Last updated ${fmtDate(product.updated_at)}` : undefined}>
                  {fmtDate(product.created_at)}
                </td>
                {PRODUCT_TRANSLATION_LOCALES.map((l) => (
                  <td key={l.code} style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => goToProduct(product.id, l.code)}
                      title={`${product.name} — ${l.label}`}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    >
                      <StatusIcon status={locales[l.code].rollup} />
                    </button>
                  </td>
                ))}
                <td>
                  <TranslateCell product={product} locales={locales} job={jobs[product.id]} canTranslate={canTranslate} currentUser={currentUser} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={PRODUCT_TRANSLATION_LOCALES.length + 3} style={{ textAlign: "center", color: "var(--text-3)", padding: 24 }}>
                  No products match.
                </td>
              </tr>
            )}
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
        itemLabel="products"
      />
    </div>
  );
}
