// DataSourceBadge.jsx
// Small "Data source: Supabase / Neon" pill for CMS pages that read
// product/sauna-room data (Products.jsx, SaunaRoomsCMS.jsx) — the CMS-only
// indicator half of the Data Source test toggle in Settings.jsx. Deliberately
// not shown on the public site.
import React, { useEffect, useState } from "react";
import { getDataSource } from "../local-storage/dataSource";

export default function DataSourceBadge() {
  const [source, setSource] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDataSource().then((s) => { if (!cancelled) setSource(s); });
    return () => { cancelled = true; };
  }, []);

  if (!source) return null;
  const isNeon = source === "neon";

  return (
    <span
      title={isNeon ? "Reading from the Neon mirror, not Supabase" : "Reading from Supabase"}
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
        isNeon
          ? "bg-[var(--warning-bg,#fef3c7)] text-[var(--warning,#92400e)]"
          : "bg-[var(--surface-2)] text-[var(--text-3)]"
      }`}
    >
      <i className="fa-solid fa-database" />
      {isNeon ? "Neon" : "Supabase"}
    </span>
  );
}
