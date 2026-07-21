import React, { useEffect, useState } from "react";
import { logActivity } from "./supabase";
import {
  getDataSource, setDataSource as saveDataSource,
  getJsonSourceScope, setJsonSourceScope as saveJsonSourceScope,
} from "../local-storage/dataSource";

// Moved out of the sidebar footer (was a bare <select> wedged next to
// logout/theme) — this is a high-stakes, rarely-changed control (it changes
// what the PUBLIC site serves), so it belongs on a dedicated page rather
// than one accidental click away at all times. See local-storage/dataSource.js.
const SOURCE_OPTIONS = [
  { value: "github", label: "GitHub", description: "The GitHub-synced JSON snapshot (bundled products.json). Current default." },
  { value: "supabase", label: "Supabase", description: "Live Supabase rows, direct and instant — no sync step needed." },
  { value: "jsonfile", label: "Json File", description: "A single hand-edited JSON file in the images repo, scoped below. Falls back to the GitHub snapshot outside that scope." },
];

const SCOPE_OPTIONS = [
  { value: "accessories", label: "Accessories" },
  { value: "all", label: "All (coming soon)", disabled: true },
  { value: "saunarooms", label: "Sauna Rooms (coming soon)", disabled: true },
  { value: "heaters", label: "Heaters (coming soon)", disabled: true },
];

export default function Settings({ currentUser }) {
  const [source, setSource] = useState(null);
  const [scope, setScope] = useState("accessories");
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getDataSource(), getJsonSourceScope()])
      .then(([s, sc]) => { setSource(s); setScope(sc); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSwitchSource = async (next) => {
    setSwitching(true);
    setError(null);
    try {
      await saveDataSource(next, currentUser?.username);
      setSource(next);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "data_source",
        entity_name: `Live Data Source → ${next}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
    } catch (err) {
      setError("Failed to switch data source: " + err.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleSwitchScope = async (next) => {
    setSwitching(true);
    setError(null);
    try {
      await saveJsonSourceScope(next, currentUser?.username);
      setScope(next);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "json_source_scope",
        entity_name: `Json Source Scope → ${next}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
    } catch (err) {
      setError("Failed to switch json source scope: " + err.message);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-[var(--brand)] mb-4"></i>
          <p className="text-[var(--text-2)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Settings</h1>
        <p className="text-[var(--text-2)]">Site-wide configuration for the public frontend</p>
      </div>

      {error && (
        <div className="mb-6 bg-[var(--danger-bg)] border border-[var(--danger)] rounded p-4 text-[var(--danger)]">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
          <i className="fa-solid fa-satellite-dish text-[var(--brand)]"></i>
          Live Data Source
        </h3>
        <p className="text-sm text-[var(--text-3)] mb-4">
          Controls where the public site reads product / sauna room / site content
          data from — takes effect for visitors within seconds, no redeploy needed.
        </p>

        <div className="space-y-2 mb-4">
          {SOURCE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                source === opt.value
                  ? "border-[var(--brand)] bg-[var(--brand-muted)]"
                  : "border-[var(--border)] hover:bg-[var(--surface-2)]"
              } ${switching ? "opacity-60 pointer-events-none" : ""}`}
            >
              <input
                type="radio"
                name="data-source"
                value={opt.value}
                checked={source === opt.value}
                onChange={() => handleSwitchSource(opt.value)}
                disabled={switching}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{opt.label}</p>
                <p className="text-xs text-[var(--text-3)]">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        {source === "jsonfile" && (
          <div className="pl-4 border-l-2 border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">
              Json File scope
            </label>
            <select
              value={scope}
              disabled={switching}
              onChange={(e) => handleSwitchScope(e.target.value)}
              title="Which product group the Json File source applies to. Only Accessories is available today; edits to it live in the images repo's allaccs-data.json, not in this admin."
              className="text-sm border border-[var(--border)] rounded px-3 py-2 bg-[var(--surface)] text-[var(--text)]"
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
