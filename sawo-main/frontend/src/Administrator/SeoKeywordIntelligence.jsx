// src/Administrator/SeoKeywordIntelligence.jsx
//
// SEO Keyword Intelligence — three deliberately separate views, never
// merged into one generic "keywords" table, because the distinction
// between REAL and INFERRED data is the entire point of this module (see
// docs/🟢 SEO/SEO-KEYWORD-INTELLIGENCE-SPEC.md):
//   1. My Rankings        — real Google Search Console data (own_gsc)
//   2. Competitor Themes   — inferred content themes from crawling
//                            competitor pages (content_extraction) — NOT
//                            ranking data, labeled as such throughout
//   3. Tracked Battle      — real (but limited) SERP-checked positions for
//                            a small curated keyword list (tracked_serp)
//
// Job status for the three GitHub Actions workflows backing this page
// (seo-gsc-sync.yml, seo-competitor-crawl.yml, seo-serp-check.yml) already
// appears on /admin/ci-status automatically — nothing extra needed here.
import React, { useEffect, useMemo, useState } from "react";
import { getCache, setCache } from "./adminCache";
import { logActivity } from "./supabase";
import { MetricCard } from "./analytics/StatPrimitives";
import {
  getOwnRankings,
  computeRankingOpportunities,
  getCompetitors,
  addCompetitor,
  removeCompetitor,
  getCompetitorContentKeywords,
  getContentGaps,
  getTrackedKeywords,
  addTrackedKeyword,
  removeTrackedKeyword,
  getTrackedBattleSummary,
  getTrackedKeywordHistory,
  getSerpUsageThisMonth,
  getSemrushRealGaps,
} from "./seoKeywordIntelligenceData";

const OWN_DOMAIN = "sawo.com";
const TABS = [
  { key: "rankings", label: "My Rankings", icon: "fa-solid fa-magnifying-glass-chart" },
  { key: "themes", label: "Competitor Content Themes", icon: "fa-solid fa-people-group" },
  { key: "battle", label: "Tracked Keyword Battle", icon: "fa-solid fa-chess" },
];

function fmtPosition(p) {
  if (p == null) return "—";
  return Number.isInteger(p) ? String(p) : p.toFixed(1);
}
function fmtPct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function SeoKeywordIntelligence({ currentUser }) {
  const [tab, setTab] = useState("rankings");

  return (
    <div>
      {/* No page header here — AdminLayout already renders one shared
          PageHeader per route from the matched NAV_ITEMS entry (icon/
          title/description), same as every other admin page. This used to
          render a second, duplicate header. */}
      <div className="tax-tabs" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tax-tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <i className={t.icon} style={{ marginRight: 6 }} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rankings" && <MyRankingsTab />}
      {tab === "themes" && <ContentThemesTab currentUser={currentUser} />}
      {tab === "battle" && <TrackedBattleTab currentUser={currentUser} />}
    </div>
  );
}

// ── Tab 1: My Rankings (own_gsc) ────────────────────────────────────────

function MyRankingsTab() {
  const cacheKey = "seoKeywordIntel:rankings";
  const [rankings, setRankings] = useState(() => getCache(cacheKey) || []);
  const [loading, setLoading] = useState(!getCache(cacheKey));
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("impressions");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getOwnRankings(OWN_DOMAIN);
        if (cancelled) return;
        setRankings(data);
        setCache(cacheKey, data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const opportunities = useMemo(() => computeRankingOpportunities(rankings), [rankings]);
  const sorted = useMemo(
    () => [...rankings].sort((a, b) => (b[sortKey] ?? -Infinity) - (a[sortKey] ?? -Infinity)),
    [rankings, sortKey]
  );

  const totals = useMemo(() => {
    const impressions = rankings.reduce((s, r) => s + (r.impressions || 0), 0);
    const clicks = rankings.reduce((s, r) => s + (r.clicks || 0), 0);
    return { impressions, clicks, keywordCount: rankings.length };
  }, [rankings]);

  if (loading) return <TabLoading label="Loading Search Console data…" />;
  if (error) return <TabError message={error} />;

  if (!rankings.length) {
    return (
      <EmptyState
        icon="fa-magnifying-glass-chart"
        title="No Search Console data yet"
        body={`Waiting on the first "SEO: GSC Sync" run against the ${OWN_DOMAIN} property. Once set up (see the Build Checklist in the SEO Keyword Intelligence spec doc), it runs daily and this tab fills in automatically — no redeploy needed. Check /admin/ci-status for the job's status.`}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard icon="fa-key" title="Tracked Keywords" value={totals.keywordCount} subtitle="Distinct query/page pairs, last 28 days" />
        <MetricCard icon="fa-eye" title="Total Impressions" value={totals.impressions.toLocaleString()} subtitle="Last 28 days" />
        <MetricCard icon="fa-arrow-pointer" title="Total Clicks" value={totals.clicks.toLocaleString()} subtitle="Last 28 days" />
        <MetricCard
          icon="fa-chart-line"
          title="Overall CTR"
          value={totals.impressions ? fmtPct(totals.clicks / totals.impressions) : "—"}
          subtitle="Clicks ÷ impressions"
        />
      </div>

      {opportunities.page2.length > 0 && (
        <OpportunityCard
          icon="fa-arrow-up-right-dots"
          title={`Page 2 Opportunities (${opportunities.page2.length})`}
          description="Ranking positions 11-20 — close to page 1, worth pushing with content or internal links."
          rows={opportunities.page2.map((r) => ({
            key: `${r.keyword}-${r.url}`,
            primary: r.keyword,
            secondary: r.url,
            value: `#${fmtPosition(r.position)}`,
          }))}
        />
      )}

      {opportunities.highImpressionLowCtr.length > 0 && (
        <OpportunityCard
          icon="fa-triangle-exclamation"
          title={`Title/Meta Opportunities (${opportunities.highImpressionLowCtr.length})`}
          description="High impressions but CTR well below what's typical for that position — shown often, clicked rarely. Usually a title/meta description problem, not a ranking problem."
          rows={opportunities.highImpressionLowCtr.map((r) => ({
            key: `${r.keyword}-${r.url}`,
            primary: r.keyword,
            secondary: r.url,
            value: `${fmtPct(r.ctr)} CTR at #${fmtPosition(r.position)}`,
          }))}
        />
      )}

      <div className="card card-body card-lift">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: 0 }}>All Keywords</h3>
          <select className="form-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={{ width: "auto" }}>
            <option value="impressions">Sort: Impressions</option>
            <option value="clicks">Sort: Clicks</option>
            <option value="position">Sort: Position (best on top when ascending isn't used — see note)</option>
          </select>
        </div>
        <div className="products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Page</th>
                <th style={{ textAlign: "center" }}>Position</th>
                <th style={{ textAlign: "center" }}>Impressions</th>
                <th style={{ textAlign: "center" }}>Clicks</th>
                <th style={{ textAlign: "center" }}>CTR</th>
                <th style={{ textAlign: "center" }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={`${r.keyword}-${r.url}`}>
                  <td style={{ fontWeight: 600 }}>{r.keyword}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{r.url}</td>
                  <td style={{ textAlign: "center" }}>{fmtPosition(r.position)}</td>
                  <td style={{ textAlign: "center" }}>{r.impressions.toLocaleString()}</td>
                  <td style={{ textAlign: "center" }}>{r.clicks.toLocaleString()}</td>
                  <td style={{ textAlign: "center" }}>{fmtPct(r.ctr)}</td>
                  <td style={{ textAlign: "center" }}>
                    <TrendBadge trend={r.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrendBadge({ trend }) {
  if (trend == null || trend === 0) return <span style={{ color: "var(--text-3)" }}>—</span>;
  const improved = trend > 0; // positive = position number went down = improved
  return (
    <span style={{ color: improved ? "#22c55e" : "#ef4444", fontWeight: 600, fontSize: "0.78rem" }}>
      <i className={`fa-solid ${improved ? "fa-arrow-up" : "fa-arrow-down"}`} style={{ marginRight: 4 }} />
      {Math.abs(trend).toFixed(1)}
    </span>
  );
}

// ── Tab 2: Competitor Content Themes (content_extraction) ──────────────

function ContentThemesTab({ currentUser }) {
  const cacheKey = "seoKeywordIntel:competitors";
  const [competitors, setCompetitors] = useState(() => getCache(cacheKey) || []);
  const [loading, setLoading] = useState(!getCache(cacheKey));
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState(null); // { keywords, gaps }
  const [detailLoading, setDetailLoading] = useState(false);
  const [semrushGaps, setSemrushGaps] = useState(null); // null = not loaded yet, [] = loaded, no data

  useEffect(() => {
    let cancelled = false;
    getSemrushRealGaps(OWN_DOMAIN)
      .then((rows) => { if (!cancelled) setSemrushGaps(rows); })
      .catch(() => { if (!cancelled) setSemrushGaps([]); });
    return () => { cancelled = true; };
  }, []);

  const loadCompetitors = async () => {
    try {
      const data = await getCompetitors();
      setCompetitors(data);
      setCache(cacheKey, data);
      if (!selectedDomain && data.length) setSelectedDomain(data[0].domain);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadCompetitors(); }, []);

  useEffect(() => {
    if (!selectedDomain) { setDetail(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const [keywords, gaps] = await Promise.all([
          getCompetitorContentKeywords(selectedDomain),
          getContentGaps(selectedDomain, OWN_DOMAIN),
        ]);
        if (!cancelled) setDetail({ keywords, gaps });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDomain]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      const row = await addCompetitor(newDomain.trim(), currentUser?.username);
      await logActivity({ action: "create", entity: "seo_competitor", entity_id: row.id, entity_name: row.domain, username: currentUser?.username, user_id: currentUser?.id });
      setNewDomain("");
      await loadCompetitors();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (competitor) => {
    if (!window.confirm(`Remove ${competitor.domain}? Its stored content-keyword data stays until the next crawl overwrites it.`)) return;
    try {
      await removeCompetitor(competitor.id);
      await logActivity({ action: "delete", entity: "seo_competitor", entity_id: competitor.id, entity_name: competitor.domain, username: currentUser?.username, user_id: currentUser?.id });
      if (selectedDomain === competitor.domain) setSelectedDomain(null);
      await loadCompetitors();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <TabLoading label="Loading competitors…" />;

  return (
    <div>
      {error && <ErrorBanner message={error} />}

      <div className="card card-body card-lift" style={{ marginBottom: 20 }}>
        <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: "0 0 8px" }}>Competitors</h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-3)", margin: "0 0 12px" }}>
          Crawled monthly by the <code>seo-competitor-crawl</code> GitHub Actions workflow (also runnable on demand from the
          Actions tab via "Run workflow"). This is content-theme analysis, not ranking data.
        </p>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            className="form-input"
            placeholder="competitor-domain.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={adding}>
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />
            Add Competitor
          </button>
        </form>

        {competitors.length === 0 ? (
          <p style={{ color: "var(--text-3)", fontSize: "0.85rem", fontStyle: "italic" }}>No competitors added yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {competitors.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedDomain(c.domain)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                  border: `1px solid ${selectedDomain === c.domain ? "var(--brand)" : "var(--border)"}`,
                  background: selectedDomain === c.domain ? "var(--brand-bg, rgba(59,130,246,0.08))" : "var(--surface)",
                  fontSize: "0.82rem",
                }}
              >
                <span style={{ fontWeight: 600 }}>{c.domain}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>
                  {c.last_crawled_at ? `crawled ${new Date(c.last_crawled_at).toLocaleDateString()}` : "not crawled yet"}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(c); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0 }}
                  aria-label={`Remove ${c.domain}`}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {semrushGaps && semrushGaps.length > 0 && (
        <div className="card card-body card-lift" style={{ marginBottom: 20, border: "1px solid var(--brand)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
            <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: 0 }}>
              <i className="fa-solid fa-star" style={{ color: "var(--brand)", marginRight: 8 }} />
              Real Keyword Gaps (Semrush Snapshot)
            </h3>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--brand)", background: "var(--brand-bg, rgba(59,130,246,0.08))", padding: "3px 10px", borderRadius: 20 }}>
              ONE-TIME SNAPSHOT — 2026-08-12
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-3)", margin: "0 0 12px" }}>
            Real Semrush-observed competitor rankings (not RAKE-inferred content themes) for keywords we have no ranking
            data for at all, with real search volume and keyword difficulty. Pulled from a Semrush subscription that
            expires ~2026-08-28 and won't auto-refresh after that — see the Build Checklist in the spec doc to pull a
            fresher/broader snapshot before then.
          </p>
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th style={{ textAlign: "center" }}>Search Volume</th>
                  <th style={{ textAlign: "center" }}>Difficulty</th>
                  <th>Who Ranks</th>
                </tr>
              </thead>
              <tbody>
                {semrushGaps.slice(0, 30).map((g) => (
                  <tr key={g.keyword}>
                    <td style={{ fontWeight: 600 }}>{g.keyword}</td>
                    <td style={{ textAlign: "center" }}>{g.search_volume?.toLocaleString() ?? "—"}</td>
                    <td style={{ textAlign: "center" }}>{g.keyword_difficulty ?? "—"}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
                      {g.competitors.map((c) => `${c.domain} #${c.position}`).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedDomain && (
        detailLoading ? (
          <TabLoading label={`Loading ${selectedDomain}…`} />
        ) : detail && (!detail.keywords.length) ? (
          <EmptyState
            icon="fa-people-group"
            title={`No content data for ${selectedDomain} yet`}
            body="Waiting on the first crawl. Trigger seo-competitor-crawl.yml manually from GitHub Actions, or wait for its monthly schedule."
          />
        ) : detail && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card card-body card-lift">
              <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: "0 0 4px" }}>
                <i className="fa-solid fa-ranking-star" style={{ color: "var(--brand)", marginRight: 8 }} />
                Content Keyword Themes
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0 0 12px" }}>
                Prominent phrases from {selectedDomain}'s own content — inferred themes, not their search rankings.
              </p>
              <KeywordScoreTable rows={detail.keywords.slice(0, 30)} />
            </div>
            <div className="card card-body card-lift">
              <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: "0 0 4px" }}>
                <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--brand)", marginRight: 8 }} />
                Topics They Emphasize That We Don't Rank For
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0 0 12px" }}>
                {selectedDomain}'s content keywords with no match anywhere in our own {OWN_DOMAIN} Search Console data. Not
                a claim about their rankings — just a coverage gap worth considering.
              </p>
              {detail.gaps.length === 0 ? (
                <p style={{ color: "var(--text-3)", fontSize: "0.85rem", fontStyle: "italic" }}>
                  No gaps found — every content theme detected also appears somewhere in our own ranking data.
                </p>
              ) : (
                <KeywordScoreTable rows={detail.gaps.slice(0, 30)} />
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function KeywordScoreTable({ rows }) {
  return (
    <div className="products-table-wrap">
      <table className="products-table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th style={{ textAlign: "center", width: 90 }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.keyword}>
              <td>{r.keyword}</td>
              <td style={{ textAlign: "center" }}>{Number(r.content_score).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab 3: Tracked Keyword Battle (tracked_serp) ────────────────────────

function TrackedBattleTab({ currentUser }) {
  const cacheKey = "seoKeywordIntel:tracked";
  const [tracked, setTracked] = useState(() => getCache(cacheKey) || []);
  const [battle, setBattle] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(!getCache(cacheKey));
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ keyword: "", target_domain: OWN_DOMAIN });
  const [adding, setAdding] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);

  const load = async () => {
    try {
      const [trackedRows, battleRows, used] = await Promise.all([
        getTrackedKeywords(),
        getTrackedBattleSummary(),
        getSerpUsageThisMonth(),
      ]);
      setTracked(trackedRows);
      setCache(cacheKey, trackedRows);
      setBattle(battleRows);
      setUsage(used);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.keyword.trim() || !form.target_domain.trim()) return;
    if (tracked.length >= 30) {
      setError("30 tracked keywords is the recommended ceiling for this SerpApi plan's monthly quota — remove one before adding another.");
      return;
    }
    setAdding(true);
    try {
      const row = await addTrackedKeyword(form.keyword.trim(), form.target_domain.trim(), currentUser?.username);
      await logActivity({ action: "create", entity: "seo_tracked_keyword", entity_id: row.id, entity_name: row.keyword, username: currentUser?.username, user_id: currentUser?.id });
      setForm({ keyword: "", target_domain: OWN_DOMAIN });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (row) => {
    if (!window.confirm(`Stop tracking "${row.keyword}" for ${row.target_domain}?`)) return;
    try {
      await removeTrackedKeyword(row.id);
      await logActivity({ action: "delete", entity: "seo_tracked_keyword", entity_id: row.id, entity_name: row.keyword, username: currentUser?.username, user_id: currentUser?.id });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openHistory = async (row) => {
    setHistoryFor(row);
    try {
      setHistory(await getTrackedKeywordHistory(row.keyword));
    } catch (err) {
      setError(err.message);
    }
  };

  // Group battle rows by keyword, so each keyword shows our position next to every tracked competitor's.
  const battleByKeyword = useMemo(() => {
    const map = new Map();
    for (const row of battle) {
      if (!map.has(row.keyword)) map.set(row.keyword, []);
      map.get(row.keyword).push(row);
    }
    return map;
  }, [battle]);

  if (loading) return <TabLoading label="Loading tracked keywords…" />;

  return (
    <div>
      {error && <ErrorBanner message={error} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard icon="fa-list-check" title="Tracked Keywords" value={tracked.length} subtitle="Recommended ceiling: 30" />
        <MetricCard
          icon="fa-gauge-high"
          title="SerpApi Usage This Month"
          value={usage != null ? `${usage}/130` : "—"}
          subtitle="Capped in code below the plan's 200/month limit"
        />
      </div>

      <div className="card card-body card-lift" style={{ marginBottom: 20 }}>
        <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: "0 0 8px" }}>Tracked Keywords</h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-3)", margin: "0 0 12px" }}>
          Checked weekly by the <code>seo-serp-check</code> GitHub Actions workflow, budgeted against a monthly SerpApi
          quota. Keep this list small (tens, not thousands).
        </p>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <input
            className="form-input"
            placeholder="keyword to track"
            value={form.keyword}
            onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
            style={{ flex: 2, minWidth: 180 }}
          />
          <input
            className="form-input"
            placeholder="domain to check position for (e.g. sawo.com)"
            value={form.target_domain}
            onChange={(e) => setForm((f) => ({ ...f, target_domain: e.target.value }))}
            style={{ flex: 2, minWidth: 200 }}
          />
          <button type="submit" className="btn btn-primary" disabled={adding}>
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />
            Add
          </button>
        </form>

        {tracked.length === 0 ? (
          <p style={{ color: "var(--text-3)", fontSize: "0.85rem", fontStyle: "italic" }}>No tracked keywords yet.</p>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Target Domain</th>
                  <th style={{ textAlign: "center" }}>Latest Position</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tracked.map((t) => {
                  const results = battleByKeyword.get(t.keyword) || [];
                  const own = results.find((r) => r.domain === t.target_domain);
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.keyword}</td>
                      <td>{t.target_domain}</td>
                      <td style={{ textAlign: "center" }}>{own ? `#${fmtPosition(own.position)}` : "not checked yet"}</td>
                      <td style={{ textAlign: "center" }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openHistory(t)} style={{ marginRight: 6 }}>
                          History
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRemove(t)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {battle.length > 0 && (
        <div className="card card-body card-lift">
          <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: "0 0 12px" }}>
            Battle: Our Position vs. Tracked Competitors
          </h3>
          {Array.from(battleByKeyword.entries()).map(([keyword, rows]) => (
            <div key={keyword} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{keyword}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {rows
                  .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
                  .map((r) => (
                    <div
                      key={r.domain}
                      style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: "0.8rem",
                        background: r.domain === OWN_DOMAIN ? "var(--brand-bg, rgba(59,130,246,0.08))" : "var(--surface-2)",
                        border: r.domain === OWN_DOMAIN ? "1px solid var(--brand)" : "1px solid var(--border)",
                      }}
                    >
                      <strong>{r.domain === OWN_DOMAIN ? "Us" : r.domain}</strong>: #{fmtPosition(r.position)}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {historyFor && (
        <div className="modal-overlay" onClick={() => setHistoryFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">History: {historyFor.keyword}</h2>
              <button className="modal-close-btn" onClick={() => setHistoryFor(null)} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {history.length === 0 ? (
                <p style={{ color: "var(--text-3)", fontStyle: "italic" }}>No checks recorded yet.</p>
              ) : (
                <table className="products-table">
                  <thead>
                    <tr><th>Date</th><th>Domain</th><th style={{ textAlign: "center" }}>Position</th></tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>{new Date(h.checked_at).toLocaleDateString()}</td>
                        <td>{h.domain}</td>
                        <td style={{ textAlign: "center" }}>{fmtPosition(h.position)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── shared small pieces ─────────────────────────────────────────────────

function OpportunityCard({ icon, title, description, rows }) {
  return (
    <div className="card card-body card-lift" style={{ marginBottom: 16 }}>
      <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: "0 0 4px" }}>
        <i className={`fa-solid ${icon}`} style={{ color: "var(--brand)", marginRight: 8 }} />
        {title}
      </h3>
      <p style={{ fontSize: "0.8rem", color: "var(--text-3)", margin: "0 0 12px" }}>{description}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.slice(0, 10).map((r) => (
          <div key={r.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.85rem" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{r.primary}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>{r.secondary}</div>
            </div>
            <div style={{ flexShrink: 0, fontWeight: 600, color: "var(--brand)" }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabLoading({ label }) {
  return (
    <div className="table-loading">
      <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> {label}
    </div>
  );
}

function TabError({ message }) {
  return <ErrorBanner message={message} />;
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      margin: "0 0 16px", padding: "12px 16px",
      background: "var(--danger-bg, #fef2f2)",
      border: "1px solid var(--danger)",
      borderRadius: "var(--r)",
      fontSize: "0.82rem", color: "var(--danger)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <i className="fa-solid fa-triangle-exclamation" />
      {message}
    </div>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <div className="card card-body card-lift" style={{ textAlign: "center", padding: "48px 20px" }}>
      <i className={`fa-solid ${icon}`} style={{ fontSize: "2rem", color: "var(--text-3)", marginBottom: 12 }} />
      <h3 className="text-lg font-bold text-[var(--text)]" style={{ margin: "0 0 6px" }}>{title}</h3>
      <p style={{ color: "var(--text-3)", fontSize: "0.85rem", maxWidth: 480, margin: "0 auto" }}>{body}</p>
    </div>
  );
}
