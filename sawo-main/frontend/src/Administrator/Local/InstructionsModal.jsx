import React, { useState } from "react";

export function InstructionsModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("sync");

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          maxWidth: "680px",
          width: "100%",
          maxHeight: "85vh",
          overflow: "auto",
          padding: 0,
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--surface-2)",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>How Sync Works</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text-3)" }}>
              What the Sync buttons do and what needs to be running
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "var(--text-2)",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-2)",
            position: "sticky",
            top: "65px",
            zIndex: 1,
          }}
        >
          {[
            { id: "sync", label: "Sync Buttons" },
            { id: "daemon", label: "Daemon Setup" },
            { id: "backend", label: "Backend Setup" },
            { id: "troubleshoot", label: "Troubleshooting" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "10px 8px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--brand)" : "var(--text-2)",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>

          {/* ── SYNC BUTTONS TAB ── */}
          {activeTab === "sync" && (
            <div>
              <p style={{ margin: "0 0 18px", color: "var(--text-2)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                There are <strong>two sync buttons</strong> on this page — they do different things and require different services to be running.
              </p>

              {/* Sync button 1 */}
              <div style={{ marginBottom: "20px", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>1</span>
                  <strong style={{ fontSize: "0.95rem" }}>Header "Sync" button — Pull from Supabase</strong>
                </div>
                <div style={{ padding: "14px 16px", fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-2)" }}>
                  <p style={{ margin: "0 0 10px" }}>
                    Located in the <strong>Local tab header</strong> next to the Live/Local toggle. Pulls product data from Supabase and saves it to local JSON files.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "6px 12px", fontSize: "0.82rem" }}>
                      Calls: <code style={{ color: "var(--brand)" }}>POST localhost:5000/api/sync</code>
                    </div>
                    <div style={{ background: "var(--warning-bg, rgba(241,196,15,0.1))", border: "1px solid var(--warning, #f1c40f)", borderRadius: 4, padding: "6px 12px", fontSize: "0.82rem", color: "var(--warning, #b8860b)" }}>
                      Requires: Backend server running on port 5000
                    </div>
                  </div>
                </div>
              </div>

              {/* Sync button 2 */}
              <div style={{ marginBottom: "20px", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>2</span>
                  <strong style={{ fontSize: "0.95rem" }}>Modal "Sync" button — Push to GitHub</strong>
                </div>
                <div style={{ padding: "14px 16px", fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-2)" }}>
                  <p style={{ margin: "0 0 10px" }}>
                    Located inside the <strong>product edit modal</strong> toolbar. Pushes saved product data and images from local to the GitHub repo (saworepo2). Also triggers automatically after saving a product.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "6px 12px", fontSize: "0.82rem" }}>
                      Calls: <code style={{ color: "var(--brand)" }}>POST localhost:3001/api/sync-products</code>
                    </div>
                    <div style={{ background: "var(--warning-bg, rgba(241,196,15,0.1))", border: "1px solid var(--warning, #f1c40f)", borderRadius: 4, padding: "6px 12px", fontSize: "0.82rem", color: "var(--warning, #b8860b)" }}>
                      Requires: Sync daemon running on port 3001
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--info-bg, rgba(26,111,168,0.08))", border: "1px solid var(--info, #1a6fa8)", borderRadius: "var(--r)", padding: "12px 16px", fontSize: "0.85rem", color: "var(--info, #1a6fa8)" }}>
                <strong>Typical workflow:</strong> Start both services → edit/add products in Live → click header Sync to pull to local → changes auto-push to GitHub via daemon.
              </div>
            </div>
          )}

          {/* ── DAEMON SETUP TAB ── */}
          {activeTab === "daemon" && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--brand)" }}>Sync Daemon — port 3001</h3>
              <p style={{ color: "var(--text-2)", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: 20 }}>
                The sync daemon watches for product changes and auto-pushes them to GitHub. The modal Sync button won't work without it running.
              </p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 1 — Open a terminal and navigate to the daemon folder</div>
                <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  cd saworepo1/sawo-main/sync-daemon
                </code>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 2 — Install dependencies (first time only)</div>
                <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  npm install
                </code>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 3 — Start the daemon</div>
                <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  npm start
                </code>
              </div>

              <div style={{ background: "var(--success-bg, rgba(39,174,96,0.1))", border: "1px solid var(--success, #27ae60)", borderRadius: "var(--r)", padding: "12px 16px", fontSize: "0.85rem", color: "var(--success, #27ae60)", marginBottom: 16 }}>
                <strong>Ready when you see:</strong> "Sync daemon listening on port 3001"
              </div>

              <div style={{ background: "var(--warning-bg, rgba(241,196,15,0.1))", border: "1px solid var(--warning, #f1c40f)", borderRadius: "var(--r)", padding: "12px 16px", fontSize: "0.85rem", color: "var(--warning, #b8860b)" }}>
                <strong>Keep this terminal open</strong> — the daemon must stay running while you work. If you close it, the modal Sync button will show "Daemon not running".
              </div>
            </div>
          )}

          {/* ── BACKEND SETUP TAB ── */}
          {activeTab === "backend" && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--brand)" }}>Backend Server — port 5000</h3>
              <p style={{ color: "var(--text-2)", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: 20 }}>
                The backend server connects to Supabase and handles the pull sync. The header Sync button won't work without it running.
              </p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 1 — Open a new terminal and navigate to the backend</div>
                <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  cd saworepo1/sawo-main/backend
                </code>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 2 — Install dependencies (first time only)</div>
                <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  npm install
                </code>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 3 — Start the backend</div>
                <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  npm start
                </code>
              </div>

              <div style={{ background: "var(--success-bg, rgba(39,174,96,0.1))", border: "1px solid var(--success, #27ae60)", borderRadius: "var(--r)", padding: "12px 16px", fontSize: "0.85rem", color: "var(--success, #27ae60)", marginBottom: 16 }}>
                <strong>Ready when you see:</strong> "Backend server running on port 5000"
              </div>

              <div style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-2)" }}>
                <strong>Make sure your .env has:</strong>
                <code style={{ display: "block", marginTop: 8, fontFamily: "monospace", fontSize: "0.82rem", lineHeight: 1.8 }}>
                  SUPABASE_URL=your_supabase_url<br />
                  SUPABASE_SERVICE_KEY=your_service_key
                </code>
              </div>
            </div>
          )}

          {/* ── TROUBLESHOOTING TAB ── */}
          {activeTab === "troubleshoot" && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--brand)" }}>Troubleshooting</h3>

              {[
                {
                  error: "Daemon not running / Sync queued",
                  cause: "The sync daemon on port 3001 is not running.",
                  fix: 'Start it: cd saworepo1/sawo-main/sync-daemon && npm start',
                },
                {
                  error: "Sync failed: Failed to fetch (header Sync button)",
                  cause: "The backend server on port 5000 is not running.",
                  fix: 'Start it: cd saworepo1/sawo-main/backend && npm start',
                },
                {
                  error: "Supabase connection error",
                  cause: "Missing or incorrect Supabase credentials in .env",
                  fix: 'Check that SUPABASE_URL and SUPABASE_SERVICE_KEY are set correctly in backend/.env',
                },
                {
                  error: "EADDRINUSE: port already in use",
                  cause: "A previous instance of the server/daemon is still running.",
                  fix: 'Kill the process: On Windows: netstat -ano | findstr :3001  then  taskkill /PID <pid> /F',
                },
                {
                  error: "No changes to sync (but data looks stale)",
                  cause: "The daemon compares hashes — data may already be up to date.",
                  fix: 'Try the header Sync button to force-pull the latest from Supabase first.',
                },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 16, border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", background: "var(--error-bg, rgba(231,76,60,0.08))", borderBottom: "1px solid var(--border)" }}>
                    <strong style={{ color: "var(--error, #e74c3c)", fontSize: "0.88rem" }}>❌ {item.error}</strong>
                  </div>
                  <div style={{ padding: "12px 14px", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-2)" }}>
                    <div><strong>Cause:</strong> {item.cause}</div>
                    <div style={{ marginTop: 6 }}>
                      <strong>Fix:</strong>{" "}
                      <code style={{ background: "var(--surface-3)", padding: "2px 6px", borderRadius: 3, fontSize: "0.82rem", fontFamily: "monospace" }}>
                        {item.fix}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface-2)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "7px 16px",
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
