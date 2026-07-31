import React from "react";
import { useNavigate } from "react-router-dom";

// Shared stat-tile building blocks — originally lived only in Analytics.jsx,
// extracted so Dashboard.jsx (and any future stats page) can reuse them
// without duplicating the Plausible-style card/list/tab markup.

export const TOP_LIST_COLLAPSED_COUNT = 5;

// Fixed height for every breakdown card's tab content (matches WorldMap's own
// fixed pixel height) so switching tabs — list ↔ list, or list ↔ the map —
// never resizes the card.
export const CARD_CONTENT_HEIGHT = 320;

export function MetricCard({ icon, title, value, subtitle }) {
  return (
    <div className="card card-body card-lift hover:shadow-md transition-shadow">
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

// Card title row with Plausible-style underlined text-link tabs on the right
// (deliberately lighter than the page-level .tax-tabs pills so the two tab
// levels read differently).
export function CardHeader({ title, icon, tabs, activeTab, onTab }) {
  return (
    <div className="flex items-center justify-between mb-4" style={{ gap: 12, flexWrap: "wrap" }}>
      <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2" style={{ margin: 0 }}>
        <i className={`fas ${icon} text-[var(--brand)]`}></i>
        {title}
      </h3>
      <div style={{ display: "flex", gap: 14 }}>
        {Object.entries(tabs).map(([key, t]) => (
          <button
            key={key}
            type="button"
            onClick={() => onTab(key)}
            style={{
              background: "none",
              border: "none",
              padding: "2px 0",
              cursor: "pointer",
              fontSize: "0.78rem",
              fontWeight: activeTab === key ? 600 : 500,
              color: activeTab === key ? "var(--text)" : "var(--text-3)",
              borderBottom: activeTab === key ? "2px solid var(--brand)" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Plausible-style breakdown rows: subtle brand-tinted bar behind each label
// (width = share of the list max), optional source icon, bold count on the
// right. Text stays in the CMS text tokens; only the bar carries the hue.
export function BreakdownList({ rows, valueLabel, showPct }) {
  const navigate = useNavigate();
  if (!rows || rows.length === 0) {
    return <p className="text-[var(--text-3)] text-sm">No data available</p>;
  }
  const max = rows.reduce((m, r) => Math.max(m, r.value ?? r.visitors ?? r.count ?? 0), 0) || 1;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>
          {valueLabel === "Views" ? "Page" : "Name"}
        </span>
        <span style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>
          {valueLabel}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map((row, idx) => {
          const value = row.value ?? row.visitors ?? row.count ?? 0;
          const clickable = !!row.pagePerf;
          return (
            <div
              key={idx}
              className={clickable ? "breakdown-row breakdown-row--clickable" : "breakdown-row"}
              style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "5px 8px", borderRadius: 4 }}
              onClick={clickable ? () => navigate(`/admin/seo?open=${encodeURIComponent(row.name)}`) : undefined}
              title={clickable ? `View "${row.name}" in Page Performance` : undefined}
            >
              <div
                style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${(value / max) * 100}%`,
                  background: "var(--brand)", opacity: 0.1,
                  borderRadius: 4, pointerEvents: "none",
                }}
              />
              {row.icon && (
                <i className={row.icon} style={{ fontSize: "0.85rem", color: "var(--text-2)", width: 16, textAlign: "center", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-sm font-medium text-[var(--text)] truncate" style={{ margin: 0 }}>{row.name}</p>
                {row.sub && <p className="text-xs text-[var(--text-3)]" style={{ margin: 0 }}>{row.sub}</p>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span className="text-sm font-bold text-[var(--brand)]">{value}</span>
                {showPct && typeof row.pct === "number" && (
                  <span className="text-xs text-[var(--text-3)]" style={{ marginLeft: 8, minWidth: 34, display: "inline-block" }}>{row.pct}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// A capped BreakdownList with the "Show all N" escape hatch into a modal.
export function TabbedList({ tab, title, icon, onShowAll }) {
  const rows = tab.rows || [];
  return (
    <>
      <BreakdownList
        rows={rows.slice(0, TOP_LIST_COLLAPSED_COUNT)}
        valueLabel={tab.valueLabel}
        showPct={tab.showPct}
      />
      {rows.length > TOP_LIST_COLLAPSED_COUNT && (
        <button
          type="button"
          className="btn btn-ghost btn-sm w-full justify-center mt-3"
          onClick={() => onShowAll({ title, icon, rows, valueLabel: tab.valueLabel, showPct: tab.showPct })}
        >
          <i className="fa-solid fa-up-right-and-down-left-from-center" />
          Show all {rows.length}
        </button>
      )}
    </>
  );
}

// A full breakdown card: header + tabs + the active tab's capped list.
export function BreakdownCard({ id, title, icon, tabs, activeTab, onTab, onShowAll }) {
  const tab = tabs[activeTab];
  return (
    <div id={id} className="card card-body card-lift">
      <CardHeader title={title} icon={icon} tabs={tabs} activeTab={activeTab} onTab={onTab} />
      <div style={{ minHeight: CARD_CONTENT_HEIGHT }}>
        <TabbedList tab={tab} title={`${title}: ${tab.label}`} icon={icon} onShowAll={onShowAll} />
      </div>
    </div>
  );
}

// Generic small modal used for BreakdownCard's "Show all N" expansion —
// shared so any page using these primitives gets the same behavior instead
// of each one growing its own copy.
export function Modal({ title, icon, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {icon && <i className={`fas ${icon} text-[var(--brand)]`} style={{ marginRight: 8 }}></i>}
            {title}
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
