// Administrator/Translations/AiUsageTab.jsx
//
// Translations > AI Usage — cost/usage analytics for the AI "Translate"
// button, modeled on SAWO_CHATBOT's Cost tab (public/js/costAnalytics.js):
// account balance from the OpenRouter management key, plus range-scoped
// spend/tokens/calls from our own per-call log (public.ai_usage_log, written
// by the openrouter-translate edge function with OpenRouter's exact billed
// cost). Aggregated client-side — volumes here are hundreds of rows, not
// millions.
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { fetchAllPages } from "./translationData";
import { callOpenRouter, LOCALE_NAMES } from "./aiTranslation";
import ScrollArea from "../ScrollArea";

const RANGES = [
  { key: "1", label: "24h", days: 1 },
  { key: "7", label: "7d", days: 7 },
  { key: "30", label: "30d", days: 30 },
  { key: "90", label: "90d", days: 90 },
  { key: "all", label: "All", days: null },
];

const BAR = "#af8564"; // brand accent — single series, so no categorical palette
const DAY_MS = 86400000;

const usd = (n, dp = 2) => `$${(Number(n) || 0).toFixed(dp)}`;
const usdSmart = (n) => usd(n, Math.abs(Number(n) || 0) < 1 ? 4 : 2);
const compact = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const dayLabel = (key, full) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, full ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric" });
const shortModel = (m) => (m ? String(m).split("/").pop() : "—");

function Tile({ label, value, detail, tone }) {
  const color = tone === "danger" ? "var(--danger)" : tone === "warning" ? "var(--warning)" : "var(--text)";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px" }}>
      <div style={{ fontSize: "0.72rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color, margin: "2px 0" }}>{value}</div>
      {detail && <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{detail}</div>}
    </div>
  );
}

function Card({ title, scope, children, right }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "var(--text)" }}>
          {title} {scope && <span style={{ fontWeight: 500, color: "var(--text-3)", marginLeft: 4 }}>{scope}</span>}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

// Daily spend — one bar per day, hover for the exact figures.
function DailySpendChart({ days }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...days.map((d) => d.cost), 0.000001);
  const showEvery = Math.ceil(days.length / 10);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 160, borderBottom: "1px solid var(--border)" }}>
        {days.map((d, i) => (
          <div
            key={d.key}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", cursor: "default" }}
          >
            <div
              style={{
                width: "100%",
                height: d.cost ? `${Math.max((d.cost / max) * 100, 2)}%` : 0,
                background: BAR,
                opacity: hover === null || hover === i ? 1 : 0.55,
                borderRadius: "4px 4px 0 0",
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
        {days.map((d, i) => (
          <div key={d.key} style={{ flex: 1, fontSize: "0.62rem", color: "var(--text-3)", textAlign: "center", whiteSpace: "nowrap", overflow: "visible" }}>
            {i % showEvery === 0 ? dayLabel(d.key) : ""}
          </div>
        ))}
      </div>
      {hover !== null && (
        <div
          style={{
            position: "absolute", top: -6, left: `${((hover + 0.5) / days.length) * 100}%`,
            transform: `translateX(${hover > days.length / 2 ? "-100%" : "0"})`,
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6,
            padding: "6px 10px", fontSize: "0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 2,
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--text)" }}>{dayLabel(days[hover].key, true)}</div>
          <div style={{ color: "var(--text-2)" }}>
            {usdSmart(days[hover].cost)} · {days[hover].calls} call{days[hover].calls === 1 ? "" : "s"} · {compact(days[hover].tokens)} tokens
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleTable({ cols, rows, empty = "No data." }) {
  return (
    <ScrollArea>
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr>{cols.map((c) => <th key={c.key} style={{ textAlign: c.num ? "right" : "left" }}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                {cols.map((c) => (
                  <td key={c.key} style={{ fontSize: "0.8rem", textAlign: c.num ? "right" : "left", whiteSpace: c.wrap ? "normal" : "nowrap" }} title={c.title ? c.title(r) : undefined}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={cols.length} style={{ textAlign: "center", color: "var(--text-3)", padding: 20 }}>{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}

function groupBy(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, { key: k, calls: 0, errors: 0, tokens: 0, prompt: 0, completion: 0, cost: 0, latency: 0, latencyN: 0 });
    const g = m.get(k);
    g.calls++;
    if (r.status === "error") g.errors++;
    g.tokens += r.total_tokens || 0;
    g.prompt += r.prompt_tokens || 0;
    g.completion += r.completion_tokens || 0;
    g.cost += Number(r.cost) || 0;
    if (r.latency_ms) { g.latency += r.latency_ms; g.latencyN++; }
  }
  return [...m.values()].sort((a, b) => b.cost - a.cost);
}

function downloadCsv(rows) {
  const cols = ["created_at", "status", "product_name", "locale", "model", "provider", "prompt_tokens", "completion_tokens", "total_tokens", "cost", "latency_ms", "username", "error"];
  const cell = (v) => { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const csv = [cols.join(",")].concat(rows.map((r) => cols.map((c) => cell(r[c])).join(","))).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = "ai-translation-usage.csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AiUsageTab() {
  const [range, setRange] = useState("30");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null); // null = loading
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    callOpenRouter({ action: "status" })
      .then((s) => setBalance(s))
      .catch((e) => setBalance({ error: e.message }));
  }, [reloadTick]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const r = RANGES.find((x) => x.key === range);
    const since = r.days ? new Date(Date.now() - r.days * DAY_MS).toISOString() : null;
    fetchAllPages(() => {
      let q = supabase
        .from("ai_usage_log")
        .select("id, created_at, status, error, model, provider, product_id, product_name, locale, prompt_tokens, completion_tokens, total_tokens, cost, latency_ms, username")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (since) q = q.gte("created_at", since);
      return q;
    }).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(/does not exist|Could not find the table/i.test(err.message)
          ? "The ai_usage_log table is missing in Supabase."
          : err.message);
        setRows([]);
      } else {
        setRows(data || []);
      }
    });
    return () => { cancelled = true; };
  }, [range, reloadTick]);

  const stats = useMemo(() => {
    if (!rows) return null;
    const ok = rows.filter((r) => r.status === "ok");
    const cost = rows.reduce((s, r) => s + (Number(r.cost) || 0), 0);
    const tokens = rows.reduce((s, r) => s + (r.total_tokens || 0), 0);
    const products = new Set(ok.map((r) => r.product_id).filter(Boolean)).size;

    // One bucket per calendar day across the whole window (empty days included).
    const rDef = RANGES.find((x) => x.key === range);
    const nDays = rDef.days
      ? Math.max(rDef.days, 1)
      : rows.length ? Math.max(1, Math.ceil((Date.now() - new Date(rows[rows.length - 1].created_at).getTime()) / DAY_MS) + 1) : 1;
    const buckets = new Map();
    for (let i = nDays - 1; i >= 0; i--) {
      const k = dayKey(Date.now() - i * DAY_MS);
      buckets.set(k, { key: k, cost: 0, calls: 0, tokens: 0 });
    }
    for (const r of rows) {
      const b = buckets.get(dayKey(r.created_at));
      if (b) { b.cost += Number(r.cost) || 0; b.calls++; b.tokens += r.total_tokens || 0; }
    }
    const today = buckets.get(dayKey(Date.now()));

    return {
      cost, tokens, products,
      calls: rows.length,
      errors: rows.length - ok.length,
      perLanguage: ok.length ? cost / ok.length : 0,
      today: today || { cost: 0, calls: 0 },
      days: [...buckets.values()],
      byModel: groupBy(rows, (r) => r.model || "unknown"),
      byLocale: groupBy(rows, (r) => r.locale || "—"),
    };
  }, [rows, range]);

  const rangeLabel = RANGES.find((x) => x.key === range).label;
  const remaining = balance && balance.credits && !balance.credits.error
    ? (balance.credits.total_credits ?? 0) - (balance.credits.total_usage ?? 0)
    : null;

  return (
    <div className="cms-scroll-page">
      <div className="products-toolbar">
        <div className="tax-tabs">
          {RANGES.map((r) => (
            <button key={r.key} type="button" className={`tax-tab-btn${range === r.key ? " active" : ""}`} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReloadTick((n) => n + 1)} disabled={rows === null}>
          <i className={`fa-solid fa-rotate${rows === null ? " fa-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Tile
          label="OpenRouter balance"
          value={balance === null ? "…" : remaining != null ? usd(remaining) : "—"}
          tone={remaining != null && remaining <= 2 ? "danger" : remaining != null && remaining <= 5 ? "warning" : undefined}
          detail={
            balance === null ? "Checking…"
              : balance.error ? balance.error
              : balance.credits?.error ? `Management key: ${balance.credits.error}`
              : balance.credits ? `${usd(balance.credits.total_usage)} used of ${usd(balance.credits.total_credits)} · whole account`
              : "Add a Management key in Settings"
          }
        />
        <Tile label={`Spend (${rangeLabel})`} value={stats ? usdSmart(stats.cost) : "…"} detail={stats ? `Today ${usdSmart(stats.today.cost)}` : null} />
        <Tile label={`Calls (${rangeLabel})`} value={stats ? stats.calls : "…"} detail={stats ? `${stats.errors} failed` : null} tone={stats?.errors ? "warning" : undefined} />
        <Tile label="Tokens" value={stats ? compact(stats.tokens) : "…"} detail={stats ? `${stats.products} product(s) translated` : null} />
        <Tile label="Avg per product-language" value={stats ? usdSmart(stats.perLanguage) : "…"} detail={stats ? `≈ ${usdSmart(stats.perLanguage * 7)} for all 7 languages` : null} />
      </div>

      {rows === null ? (
        <div className="table-loading"><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: 8 }} /> Loading usage…</div>
      ) : (
        <>
          <Card title="Daily spend" scope={rangeLabel}>
            {stats.days.some((d) => d.calls) ? <DailySpendChart days={stats.days} /> : (
              <div style={{ color: "var(--text-3)", fontSize: "0.82rem", padding: "24px 0", textAlign: "center" }}>
                No AI translations in this range yet. Click <b>Translate</b> on a product in the Products tab.
              </div>
            )}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
            <Card title="By model" scope={rangeLabel}>
              <SimpleTable
                cols={[
                  { key: "key", label: "Model", render: (g) => <span title={g.key}>{shortModel(g.key)}</span> },
                  { key: "calls", label: "Calls", num: true },
                  { key: "tokens", label: "Tokens", num: true, render: (g) => compact(g.tokens) },
                  { key: "cost", label: "Cost", num: true, render: (g) => usdSmart(g.cost) },
                  { key: "per", label: "Per call", num: true, render: (g) => usdSmart(g.calls ? g.cost / g.calls : 0) },
                  { key: "lat", label: "Avg time", num: true, render: (g) => (g.latencyN ? `${(g.latency / g.latencyN / 1000).toFixed(1)}s` : "—") },
                ]}
                rows={stats.byModel}
              />
            </Card>
            <Card title="By language" scope={rangeLabel}>
              <SimpleTable
                cols={[
                  { key: "key", label: "Language", render: (g) => `${LOCALE_NAMES[g.key] || g.key} (${g.key.toUpperCase()})` },
                  { key: "calls", label: "Calls", num: true },
                  { key: "errors", label: "Failed", num: true },
                  { key: "tokens", label: "Tokens", num: true, render: (g) => compact(g.tokens) },
                  { key: "cost", label: "Cost", num: true, render: (g) => usdSmart(g.cost) },
                ]}
                rows={stats.byLocale}
              />
            </Card>
          </div>

          <Card
            title="Recent calls"
            scope={`${Math.min(rows.length, 100)} of ${rows.length}`}
            right={rows.length > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadCsv(rows)}>
                <i className="fa-solid fa-download" /> Export CSV
              </button>
            )}
          >
            <SimpleTable
              cols={[
                { key: "created_at", label: "When", render: (r) => new Date(r.created_at).toLocaleString() },
                { key: "product_name", label: "Product", wrap: true },
                { key: "locale", label: "Lang", render: (r) => (r.locale || "—").toUpperCase() },
                { key: "model", label: "Model", render: (r) => shortModel(r.model) },
                { key: "total_tokens", label: "Tokens", num: true, render: (r) => compact(r.total_tokens) },
                { key: "cost", label: "Cost", num: true, render: (r) => (r.cost != null ? usdSmart(r.cost) : "—") },
                { key: "latency_ms", label: "Time", num: true, render: (r) => (r.latency_ms ? `${(r.latency_ms / 1000).toFixed(1)}s` : "—") },
                {
                  key: "status", label: "Status",
                  title: (r) => r.error || undefined,
                  render: (r) => r.status === "ok"
                    ? <span style={{ color: "var(--success)" }}><i className="fa-solid fa-check" /> OK</span>
                    : <span style={{ color: "var(--danger)" }}><i className="fa-solid fa-triangle-exclamation" /> Failed</span>,
                },
                { key: "username", label: "By" },
              ]}
              rows={rows.slice(0, 100)}
              empty="No calls yet."
            />
          </Card>
        </>
      )}
    </div>
  );
}
