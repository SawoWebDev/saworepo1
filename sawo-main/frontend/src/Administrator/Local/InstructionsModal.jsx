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
              What the Sync buttons do and what must be running
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--text-2)", lineHeight: 1 }}
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
            { id: "quickstart", label: "Quick Start" },
            { id: "manual", label: "Manual Start" },
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

        <div style={{ padding: "20px 24px" }}>

          {/* ── SYNC BUTTONS TAB ── */}
          {activeTab === "sync" && (
            <div>
              <p style={{ margin: "0 0 18px", color: "var(--text-2)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                There are <strong>two Sync buttons</strong> — they do different things and each requires a different service running.
              </p>

              {/* Button 1 */}
              <div style={{ marginBottom: 16, border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div style={{ padding: "11px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>1</span>
                  <strong style={{ fontSize: "0.9rem" }}>Header "Sync" — Pull from Supabase → local JSON</strong>
                </div>
                <div style={{ padding: "12px 16px", fontSize: "0.87rem", lineHeight: 1.7, color: "var(--text-2)" }}>
                  <p style={{ margin: "0 0 10px" }}>
                    Pulls product data from Supabase and saves it to local JSON files in this repo.
                    Located next to the Live / Local toggle.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <code style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", fontSize: "0.8rem" }}>
                      POST localhost:5000/api/sync
                    </code>
                    <div style={{ background: "var(--warning-bg, rgba(241,196,15,0.1))", border: "1px solid var(--warning, #f1c40f)", borderRadius: 4, padding: "5px 10px", fontSize: "0.8rem", color: "var(--warning, #b8860b)" }}>
                      Requires: backend server (port 5000)
                    </div>
                  </div>
                </div>
              </div>

              {/* Button 2 */}
              <div style={{ marginBottom: 18, border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div style={{ padding: "11px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>2</span>
                  <strong style={{ fontSize: "0.9rem" }}>Modal "Sync" — Push images & data → GitHub</strong>
                </div>
                <div style={{ padding: "12px 16px", fontSize: "0.87rem", lineHeight: 1.7, color: "var(--text-2)" }}>
                  <p style={{ margin: "0 0 10px" }}>
                    Inside the product edit modal. Commits and pushes product images and data to saworepo2 on GitHub.
                    Also triggers automatically after saving a product.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <code style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", fontSize: "0.8rem" }}>
                      POST localhost:3001/api/sync-products
                    </code>
                    <div style={{ background: "var(--warning-bg, rgba(241,196,15,0.1))", border: "1px solid var(--warning, #f1c40f)", borderRadius: 4, padding: "5px 10px", fontSize: "0.8rem", color: "var(--warning, #b8860b)" }}>
                      Requires: sync daemon (port 3001)
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--info-bg, rgba(26,111,168,0.08))", border: "1px solid var(--info, #1a6fa8)", borderRadius: "var(--r)", padding: "12px 16px", fontSize: "0.85rem", color: "var(--info, #1a6fa8)" }}>
                <strong>Typical flow:</strong> Run <code style={{ fontSize: "0.82rem" }}>start-all-services.bat</code> to start everything →
                edit products in Live → header Sync to pull to local → daemon auto-pushes to GitHub after each save.
              </div>
            </div>
          )}

          {/* ── QUICK START TAB ── */}
          {activeTab === "quickstart" && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--brand)" }}>Easiest way — run the bat file</h3>
              <p style={{ color: "var(--text-2)", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: 16 }}>
                This starts both the backend server and the sync daemon in separate windows automatically.
              </p>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 1 — Navigate to the root folder</div>
                <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  cd c:\Users\WEB.WEB-DEVPC1\Desktop\git-sawo
                </code>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Step 2 — Run the startup script</div>
                <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                  start-all-services.bat
                </code>
              </div>

              <div style={{ background: "var(--success-bg, rgba(39,174,96,0.1))", border: "1px solid var(--success, #27ae60)", borderRadius: "var(--r)", padding: "12px 16px", fontSize: "0.85rem", color: "var(--success, #27ae60)", marginBottom: 14 }}>
                <strong>This opens two windows:</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 20, lineHeight: 1.8 }}>
                  <li><strong>Product Auto-Sync Daemon</strong> — port 3001, handles GitHub pushes</li>
                  <li><strong>SAWO Admin - Product Manager</strong> — the main app on port 3000</li>
                </ul>
              </div>

              <div style={{ background: "var(--warning-bg, rgba(241,196,15,0.1))", border: "1px solid var(--warning, #f1c40f)", borderRadius: "var(--r)", padding: "12px 16px", fontSize: "0.85rem", color: "var(--warning, #b8860b)" }}>
                <strong>Note:</strong> The bat file does NOT start the backend server (port 5000). If you need the header Sync button to work, start the backend separately — see the Manual Start tab.
              </div>
            </div>
          )}

          {/* ── MANUAL START TAB ── */}
          {activeTab === "manual" && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--brand)" }}>Manual startup — two separate terminals</h3>

              {/* Daemon */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem" }}>Terminal 1</span>
                  Sync Daemon — port 3001
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: 5 }}>Navigate to saworepo2</div>
                  <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "9px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    cd c:\Users\WEB.WEB-DEVPC1\Desktop\git-sawo\saworepo2
                  </code>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: 5 }}>Start the daemon</div>
                  <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "9px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    node auto-commit-hook.js
                  </code>
                </div>

                <div style={{ background: "var(--success-bg, rgba(39,174,96,0.1))", border: "1px solid var(--success, #27ae60)", borderRadius: 4, padding: "8px 12px", fontSize: "0.82rem", color: "var(--success, #27ae60)" }}>
                  Ready when you see: "[AUTO-SYNC] HTTP server listening on http://localhost:3001"
                </div>
              </div>

              {/* Backend */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem" }}>Terminal 2</span>
                  Backend Server — port 5000
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: 5 }}>Navigate to backend</div>
                  <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "9px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    cd c:\Users\WEB.WEB-DEVPC1\Desktop\git-sawo\saworepo1\sawo-main\backend
                  </code>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: 5 }}>Start the backend</div>
                  <code style={{ display: "block", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "9px 14px", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    npm start
                  </code>
                </div>

                <div style={{ background: "var(--success-bg, rgba(39,174,96,0.1))", border: "1px solid var(--success, #27ae60)", borderRadius: 4, padding: "8px 12px", fontSize: "0.82rem", color: "var(--success, #27ae60)" }}>
                  Ready when you see: "✅ SAWO Backend API running on http://localhost:5000"
                </div>
              </div>

              <div style={{ background: "var(--warning-bg, rgba(241,196,15,0.1))", border: "1px solid var(--warning, #f1c40f)", borderRadius: "var(--r)", padding: "11px 14px", fontSize: "0.83rem", color: "var(--warning, #b8860b)" }}>
                <strong>Keep both terminals open</strong> while working. Closing either one will disable its Sync button.
              </div>
            </div>
          )}

          {/* ── TROUBLESHOOTING TAB ── */}
          {activeTab === "troubleshoot" && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--brand)" }}>Troubleshooting</h3>

              {[
                {
                  error: 'Modal Sync shows "Daemon not running"',
                  cause: "The sync daemon (auto-commit-hook.js) is not running.",
                  fix: "cd saworepo2 → node auto-commit-hook.js",
                },
                {
                  error: 'Header Sync fails with "Failed to fetch"',
                  cause: "The backend server on port 5000 is not running.",
                  fix: "cd saworepo1/sawo-main/backend → npm start",
                },
                {
                  error: "Supabase connection error on header Sync",
                  cause: "Missing or wrong credentials in backend/.env",
                  fix: "Check SUPABASE_URL and SUPABASE_SERVICE_KEY in saworepo1/sawo-main/backend/.env",
                },
                {
                  error: "EADDRINUSE — port already in use",
                  cause: "A previous instance is still running in another terminal.",
                  fix: "netstat -ano | findstr :3001  then  taskkill /PID <pid> /F  (use :5000 for backend)",
                },
                {
                  error: 'Sync says "No changes" but data looks stale',
                  cause: "The daemon compares file hashes — data may already match.",
                  fix: "Use the header Sync button first to force-pull latest from Supabase.",
                },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 14, border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px", background: "var(--error-bg, rgba(231,76,60,0.08))", borderBottom: "1px solid var(--border)" }}>
                    <strong style={{ color: "var(--error, #e74c3c)", fontSize: "0.87rem" }}>❌ {item.error}</strong>
                  </div>
                  <div style={{ padding: "11px 14px", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-2)" }}>
                    <div><strong>Cause:</strong> {item.cause}</div>
                    <div style={{ marginTop: 5 }}>
                      <strong>Fix:</strong>{" "}
                      <code style={{ background: "var(--surface-3)", padding: "2px 6px", borderRadius: 3, fontSize: "0.81rem", fontFamily: "monospace" }}>
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
            padding: "13px 24px",
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
