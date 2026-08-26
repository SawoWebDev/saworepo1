// Administrator/Translations/StatusIcon.jsx
//
// ✓ / ⚠ / ○ — the small status symbol used throughout the Translation CMS
// (grid cells, detail-view locale list). Deliberately just 3 states,
// matching translationStatus.js's FIELD_STATUS — no partial/in-progress
// icon invented on top of it.
import React from "react";
import { FIELD_STATUS } from "../Local/translationStatus";

const CONFIG = {
  [FIELD_STATUS.CURRENT]:      { icon: "fa-circle-check",        color: "var(--success)", label: "Current" },
  [FIELD_STATUS.NEEDS_UPDATE]: { icon: "fa-triangle-exclamation", color: "var(--warning)", label: "Needs update" },
  [FIELD_STATUS.MISSING]:      { icon: "fa-circle",               color: "var(--text-3)",  label: "Not translated" },
};

export default function StatusIcon({ status, showLabel }) {
  const cfg = CONFIG[status] || CONFIG[FIELD_STATUS.MISSING];
  return (
    <span title={cfg.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: cfg.color }}>
      <i className={`fa-solid ${cfg.icon}`} />
      {showLabel && <span style={{ fontSize: "0.8rem" }}>{cfg.label}</span>}
    </span>
  );
}
