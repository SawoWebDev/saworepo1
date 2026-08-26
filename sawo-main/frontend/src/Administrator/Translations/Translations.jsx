// Administrator/Translations/Translations.jsx
//
// Translation CMS entry point — one route (/admin/translations), three
// internal tabs (Overview / Products / Translation Memory), matching how
// every other multi-view admin page here works (Taxonomy, PageSEO,
// Analytics) rather than a new nested-sidebar pattern.
import React, { useEffect, useState, useMemo } from "react";
import { getPerms } from "../permissions";
import { getCache, setCache } from "../adminCache";
import { supabase } from "../supabase";
import { fetchAllProductsForTranslation, fetchAllTranslations } from "./translationData";
import { buildStatusGrid, summarizeGrid, FIELD_STATUS } from "../Local/translationStatus";
import { PRODUCT_TRANSLATION_LOCALES } from "../../i18n/productTranslationLocales";
import TranslationProductsGrid from "./TranslationProductsGrid";
import ScrollArea from "../ScrollArea";
import Pagination from "../Pagination";
import { usePagination } from "../usePagination";

const CACHE_KEY = "admin:translations-grid";

export default function Translations({ currentUser }) {
  const perms = getPerms(currentUser);
  const cached = getCache(CACHE_KEY);
  const [grid, setGrid] = useState(() => cached || []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  const load = async () => {
    if (!getCache(CACHE_KEY)) setLoading(true);
    setError(null);
    try {
      const [products, translations] = await Promise.all([
        fetchAllProductsForTranslation(),
        fetchAllTranslations(),
      ]);
      const nextGrid = buildStatusGrid(products, translations);
      setGrid(nextGrid);
      setCache(CACHE_KEY, nextGrid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => summarizeGrid(grid), [grid]);

  if (!perms.can("page.translations")) {
    return (
      <div className="alert alert-error">
        <i className="fa-solid fa-circle-exclamation" /> You don't have access to this page.
      </div>
    );
  }

  return (
    <div className="cms-scroll-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div className="tax-tabs">
          <button type="button" className={`tax-tab-btn${tab === "overview" ? " active" : ""}`} onClick={() => setTab("overview")}>
            <i className="fa-solid fa-chart-simple" /> Overview
          </button>
          <button type="button" className={`tax-tab-btn${tab === "products" ? " active" : ""}`} onClick={() => setTab("products")}>
            <i className="fa-solid fa-box" /> Products
          </button>
          <button type="button" className={`tax-tab-btn${tab === "memory" ? " active" : ""}`} onClick={() => setTab("memory")}>
            <i className="fa-solid fa-database" /> Translation Memory
          </button>
        </div>

        <button type="button" className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <i className={`fa-solid fa-rotate${loading ? " fa-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      {loading && grid.length === 0 ? (
        <div className="table-loading">
          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading translation status...
        </div>
      ) : (
        <div className="cms-scroll-page">
          {tab === "overview" && <OverviewTab summary={summary} grid={grid} onGoToProducts={() => setTab("products")} />}
          {tab === "products" && <TranslationProductsGrid grid={grid} />}
          {tab === "memory" && <TranslationMemoryTab />}
        </div>
      )}
    </div>
  );
}

function OverviewTab({ summary, grid, onGoToProducts }) {
  const staleProducts = grid.filter(({ locales }) =>
    Object.values(locales).some((l) => l.rollup === FIELD_STATUS.NEEDS_UPDATE)
  );
  const missingProducts = grid.filter(({ locales }) =>
    Object.values(locales).every((l) => l.rollup === FIELD_STATUS.MISSING)
  );
  const fullyTranslated = grid.filter(({ locales }) =>
    Object.values(locales).every((l) => l.rollup === FIELD_STATUS.CURRENT)
  );

  return (
    <div>
      <div className="tw-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatTile label="Products" value={summary.products} />
        <StatTile label="Languages" value={summary.languages} />
        <StatTile label="Current" value={summary.current} tone="success" />
        <StatTile label="Needs Update" value={summary.needsUpdate} tone="warning" />
        <StatTile label="Missing" value={summary.missing} tone="danger" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Languages with the most pending work
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
            {PRODUCT_TRANSLATION_LOCALES
              .map((l) => ({ ...l, pending: summary.perLocale[l.code].needsUpdate + summary.perLocale[l.code].missing }))
              .sort((a, b) => b.pending - a.pending)
              .map((l) => (
                <li key={l.code} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{l.label} ({l.code})</span>
                  <span style={{ color: l.pending ? "var(--warning)" : "var(--text-3)" }}>{l.pending}</span>
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            At a glance
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
            <li style={{ padding: "4px 0" }}>{staleProducts.length} product(s) with stale translations</li>
            <li style={{ padding: "4px 0" }}>{missingProducts.length} product(s) with no translations at all</li>
            <li style={{ padding: "4px 0" }}>{fullyTranslated.length} product(s) fully translated across all {PRODUCT_TRANSLATION_LOCALES.length} languages</li>
          </ul>
        </div>
      </div>

      <button type="button" className="btn btn-primary btn-sm" onClick={onGoToProducts}>
        <i className="fa-solid fa-list" /> View products needing attention
      </button>
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const color = tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : tone === "danger" ? "var(--danger)" : "var(--text)";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px" }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function TranslationMemoryTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLocale, setActiveLocale] = useState(PRODUCT_TRANSLATION_LOCALES[0].code);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("translation_memory")
      .select("locale, source_text, translated_text, hit_count")
      .order("locale", { ascending: true })
      .limit(2000)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        else setRows(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const countsByLocale = useMemo(() => {
    const counts = {};
    for (const { code } of PRODUCT_TRANSLATION_LOCALES) counts[code] = 0;
    for (const r of rows) if (counts[r.locale] !== undefined) counts[r.locale]++;
    return counts;
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (r.locale !== activeLocale) return false;
    if (search && !r.source_text.toLowerCase().includes(search.toLowerCase()) && !r.translated_text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const { page, setPage, pageSize, setPageSize, totalPages, totalCount, pageItems } = usePagination(filtered, { initialPageSize: 25 });

  if (loading) {
    return (
      <div className="table-loading">
        <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading translation memory...
      </div>
    );
  }

  return (
    <div className="cms-scroll-page">
      {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
      <p style={{ fontSize: "0.82rem", color: "var(--text-3)", marginBottom: 14, maxWidth: 720 }}>
        Every distinct English phrase translated so far, reused automatically next time the same phrase
        turns up on another product. Showing the {rows.length} most recent (max 2000) across all languages.
      </p>

      <div className="products-toolbar">
        <div className="tax-tabs">
          {PRODUCT_TRANSLATION_LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setActiveLocale(l.code)}
              className={`tax-tab-btn${activeLocale === l.code ? " active" : ""}`}
              title={l.label}
            >
              {l.code.toUpperCase()}
              <span style={{ marginLeft: 6, color: activeLocale === l.code ? "rgba(255,255,255,0.85)" : "var(--text-2)" }}>
                ({countsByLocale[l.code]})
              </span>
            </button>
          ))}
        </div>

        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="search-input"
            type="text"
            placeholder={`Search ${activeLocale.toUpperCase()} phrases...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea>
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th>English</th>
              <th>Translation</th>
              <th style={{ width: 60, textAlign: "center" }}>Uses</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r, i) => (
              <tr key={`${r.locale}-${i}`}>
                <td style={{ fontSize: "0.82rem" }}>{r.source_text}</td>
                <td style={{ fontSize: "0.82rem" }}>{r.translated_text}</td>
                <td style={{ textAlign: "center" }}>{r.hit_count ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-3)", padding: 24 }}>No matches for {activeLocale.toUpperCase()}.</td></tr>
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
        itemLabel="phrases"
      />
    </div>
  );
}
