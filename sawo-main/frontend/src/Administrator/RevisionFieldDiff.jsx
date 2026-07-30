// src/Administrator/RevisionFieldDiff.jsx
//
// Renders one changed field's before/after for a revision diff view. Shared
// by Products.jsx, SaunaRoomsCMS.jsx, and Logs.jsx. Handles the three shapes
// diffFormFields() (see ./diff.js) produces: plain scalar {before,after},
// truncated long text {before:{len,excerpt},after:{...}}, and set-style
// image/file arrays {added,removed}.
import React from "react";

export default function RevisionFieldDiff({ field, change }) {
  const fmt = v => {
    if (v === null || v === undefined || v === "") return <em style={{ color: "var(--text-3)" }}>empty</em>;
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };
  if ("added" in change || "removed" in change) {
    return (
      <div style={{ marginBottom: 6 }}>
        <strong style={{ color: "var(--text)" }}>{field}</strong>
        {change.added.length > 0 && <div style={{ color: "#22c55e" }}>+ {change.added.length} added</div>}
        {change.removed.length > 0 && <div style={{ color: "#ef4444" }}>− {change.removed.length} removed</div>}
      </div>
    );
  }
  if (change.before && typeof change.before === "object" && "excerpt" in change.before) {
    return (
      <div style={{ marginBottom: 6 }}>
        <strong style={{ color: "var(--text)" }}>{field}</strong>
        <div style={{ color: "#ef4444", textDecoration: "line-through", opacity: 0.8 }}>{fmt(change.before.excerpt)}</div>
        <div style={{ color: "#22c55e" }}>{fmt(change.after.excerpt)}</div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 6 }}>
      <strong style={{ color: "var(--text)" }}>{field}</strong>
      <div style={{ color: "#ef4444", textDecoration: "line-through", opacity: 0.8 }}>{fmt(change.before)}</div>
      <div style={{ color: "#22c55e" }}>{fmt(change.after)}</div>
    </div>
  );
}
