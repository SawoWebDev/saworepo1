// src/Administrator/csv/CsvImportModal.jsx
//
// CSV import for Products: parse -> map columns -> dry-run diff -> commit.
// No writes happen before the user explicitly clicks "Import" on the
// reviewed dry-run — see the "preview" stage below.
import React, { useState, useMemo } from "react";
import { COLUMNS, parseCsvString, classifyImportRow } from "./productCsv";

const CHUNK_SIZE = 50;

function guessMapping(headers) {
  const mapping = {};
  for (const h of headers) {
    const norm = h.trim().toLowerCase().replace(/[\s-]+/g, "_");
    mapping[h] = COLUMNS.includes(norm) ? norm : "";
  }
  return mapping;
}

function applyMapping(rawRows, mapping) {
  return rawRows.map(raw => {
    const mapped = {};
    for (const [header, col] of Object.entries(mapping)) {
      if (col) mapped[col] = raw[header];
    }
    return mapped;
  });
}

const ACTION_STYLE = {
  create:    { label: "Create",    color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  update:    { label: "Update",    color: "var(--brand, #6366f1)", bg: "rgba(99,102,241,0.1)" },
  unchanged: { label: "Unchanged", color: "var(--text-3)", bg: "var(--surface-2)" },
  error:     { label: "Error",     color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

function ActionPill({ action }) {
  const cfg = ACTION_STYLE[action];
  return (
    <span style={{
      display: "inline-flex", padding: "2px 9px", borderRadius: 20,
      fontSize: "0.7rem", fontWeight: 700, color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

export default function CsvImportModal({
  open, onClose, existingProducts, currentUser,
  upsertTaxonomy, buildProductPayload, supabase, logActivity, add, onImported,
}) {
  const [stage, setStage] = useState("pick"); // pick | mapping | preview | committing | done
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [parseErrors, setParseErrors] = useState([]);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [commitErrors, setCommitErrors] = useState([]);

  const existingBySlug = useMemo(() => {
    const m = new Map();
    for (const p of existingProducts) if (p.slug) m.set(p.slug, p);
    return m;
  }, [existingProducts]);

  const counts = useMemo(() => {
    const c = { create: 0, update: 0, unchanged: 0, error: 0 };
    for (const r of results) c[r.action]++;
    return c;
  }, [results]);

  if (!open) return null;

  const reset = () => {
    setStage("pick"); setRawRows([]); setHeaders([]); setMapping({});
    setParseErrors([]); setResults([]); setProgress({ done: 0, total: 0 }); setCommitErrors([]);
  };

  const handleFile = async file => {
    const text = await file.text();
    const { rows, headers: hdrs, errors } = parseCsvString(text);
    setRawRows(rows);
    setHeaders(hdrs);
    setParseErrors(errors);
    setMapping(guessMapping(hdrs));
    setStage("mapping");
  };

  const runDryRun = () => {
    const mappedRows = applyMapping(rawRows, mapping);
    setResults(mappedRows.map(row => classifyImportRow(row, existingBySlug)));
    setStage("preview");
  };

  const commit = async () => {
    const toWrite = results.filter(r => r.action === "create" || r.action === "update");
    setStage("committing");
    setProgress({ done: 0, total: toWrite.length });
    const errors = [];

    // Dedupe taxonomy across the whole import instead of per-row.
    const allCategories = new Set();
    const allTags = new Set();
    for (const r of toWrite) {
      (r.product.categories || []).forEach(c => allCategories.add(c));
      (r.product.tags || []).forEach(t => allTags.add(t));
    }
    await upsertTaxonomy([...allCategories], "categories");
    await upsertTaxonomy([...allTags], "tags");

    for (let i = 0; i < toWrite.length; i += CHUNK_SIZE) {
      const chunk = toWrite.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async r => {
        try {
          const now = new Date().toISOString();
          const payload = {
            ...buildProductPayload(r.product, r.product.tags),
            updated_at: now,
            updated_by_username: currentUser?.username || null,
            ...(r.action === "create" ? { created_by_username: currentUser?.username || null } : {}),
          };
          if (r.action === "update") {
            const { error } = await supabase.from("products").update(payload).eq("id", r.existingId);
            if (error) throw error;
            await logActivity({
              action: "update", entity: "product", entity_id: r.existingId,
              entity_name: r.product.name, username: currentUser?.username, user_id: currentUser?.id,
              meta: { source: "csv_import" },
            });
          } else {
            const { data: inserted, error } = await supabase.from("products").insert([payload]).select("id").single();
            if (error) throw error;
            await logActivity({
              action: "create", entity: "product", entity_id: inserted?.id,
              entity_name: r.product.name, username: currentUser?.username, user_id: currentUser?.id,
              meta: { source: "csv_import" },
            });
          }
        } catch (err) {
          errors.push({ slug: r.slug, message: err.message });
        } finally {
          setProgress(p => ({ ...p, done: p.done + 1 }));
        }
      }));
    }

    setCommitErrors(errors);
    setStage("done");
    add(`CSV import finished: ${toWrite.length - errors.length} written, ${errors.length} failed.`, errors.length ? "warning" : "success");
    onImported();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Import Products from CSV</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close" />
        </div>
        <div className="modal-body">
          {stage === "pick" && (
            <div>
              <p className="form-helper">
                Upload a CSV exported from this page (or matching its column headers). Existing
                products are matched by <strong>slug</strong> — nothing is written until you review
                the changes and click Import.
              </p>
              <input
                type="file" accept=".csv,text/csv"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          )}

          {stage === "mapping" && (
            <div>
              <p className="form-helper">
                {rawRows.length} row(s) found. Confirm which column each CSV header maps to —
                unmapped columns are ignored.
              </p>
              {parseErrors.length > 0 && (
                <div className="mb-4" style={{ color: "var(--danger)", fontSize: "0.8rem" }}>
                  {parseErrors.length} row-parsing warning(s) — malformed rows will show as errors in the preview.
                </div>
              )}
              <table className="products-table">
                <thead><tr><th>CSV Header</th><th>Maps To</th></tr></thead>
                <tbody>
                  {headers.map(h => (
                    <tr key={h}>
                      <td>{h}</td>
                      <td>
                        <select
                          className="filter-select"
                          value={mapping[h] || ""}
                          onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                        >
                          <option value="">— Ignore —</option>
                          {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!Object.values(mapping).includes("slug") && (
                <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: 8 }}>
                  A column must be mapped to "slug" — it's how existing products are matched.
                </p>
              )}
              <div className="confirm-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={reset}>Back</button>
                <button
                  type="button" className="btn btn-primary"
                  disabled={!Object.values(mapping).includes("slug") || !Object.values(mapping).includes("name")}
                  onClick={runDryRun}
                >
                  Preview Changes
                </button>
              </div>
            </div>
          )}

          {stage === "preview" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <ActionPill action="create" /> {counts.create} to create &nbsp;
                <ActionPill action="update" /> {counts.update} to update &nbsp;
                <ActionPill action="unchanged" /> {counts.unchanged} unchanged &nbsp;
                <ActionPill action="error" /> {counts.error} error(s)
              </div>
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                <table className="products-table">
                  <thead><tr><th>Slug</th><th>Action</th><th>Details</th></tr></thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td>{r.slug || <em style={{ color: "var(--text-3)" }}>(missing)</em>}</td>
                        <td><ActionPill action={r.action} /></td>
                        <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
                          {r.action === "error" && r.error}
                          {r.action === "update" && Object.keys(r.changes).join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="confirm-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStage("mapping")}>Back</button>
                <button
                  type="button" className="btn btn-primary"
                  disabled={counts.create + counts.update === 0}
                  onClick={commit}
                >
                  Import {counts.create + counts.update} row(s)
                </button>
              </div>
            </div>
          )}

          {stage === "committing" && (
            <div style={{ textAlign: "center", padding: 24 }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.8rem", color: "var(--brand)" }} />
              <p style={{ marginTop: 12 }}>Writing {progress.done} / {progress.total}...</p>
            </div>
          )}

          {stage === "done" && (
            <div>
              <p>Import finished. {progress.total - commitErrors.length} written, {commitErrors.length} failed.</p>
              {commitErrors.length > 0 && (
                <ul style={{ fontSize: "0.8rem", color: "var(--danger)" }}>
                  {commitErrors.map((e, i) => <li key={i}>{e.slug}: {e.message}</li>)}
                </ul>
              )}
              <div className="confirm-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
