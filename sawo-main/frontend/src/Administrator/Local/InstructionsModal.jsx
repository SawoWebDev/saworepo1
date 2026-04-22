import React, { useState } from "react";

/**
 * Instructions Modal - Shows users how to sync from Supabase to Local
 * Click the question mark icon to open
 */
export function InstructionsModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState("quick");

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
          maxWidth: "700px",
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
            padding: "20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--surface-2)",
            position: "sticky",
            top: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
            📚 Sync Instructions
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--text-2)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid var(--border)",
            padding: "0",
            background: "var(--surface-2)",
            position: "sticky",
            top: "68px",
          }}
        >
          {[
            { id: "quick", label: "⚡ Quick Start" },
            { id: "detailed", label: "📖 Detailed Guide" },
            { id: "troubleshoot", label: "🔧 Troubleshooting" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: activeTab === tab.id ? "var(--surface)" : "transparent",
                border: "none",
                color: activeTab === tab.id ? "var(--brand)" : "var(--text-2)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: activeTab === tab.id ? 600 : 400,
                borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          {activeTab === "quick" && (
            <div>
              <h3 style={{ marginTop: 0, color: "var(--brand)" }}>
                🚀 Get Started in 3 Steps
              </h3>

              {/* Step 1 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    background: "var(--success-bg, rgba(39, 174, 96, 0.1))",
                    border: "1px solid var(--success, #27ae60)",
                    borderRadius: "var(--r)",
                    padding: "12px 16px",
                    marginBottom: "10px",
                  }}
                >
                  <strong style={{ color: "var(--success, #27ae60)" }}>
                    Step 1: Open Terminal
                  </strong>
                </div>
                <code
                  style={{
                    background: "var(--surface-3)",
                    padding: "12px",
                    borderRadius: "var(--r)",
                    display: "block",
                    fontSize: "0.85rem",
                    fontFamily: "monospace",
                    border: "1px solid var(--border)",
                    overflow: "auto",
                  }}
                >
                  # Windows Command Prompt or PowerShell
                </code>
              </div>

              {/* Step 2 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    background: "var(--success-bg, rgba(39, 174, 96, 0.1))",
                    border: "1px solid var(--success, #27ae60)",
                    borderRadius: "var(--r)",
                    padding: "12px 16px",
                    marginBottom: "10px",
                  }}
                >
                  <strong style={{ color: "var(--success, #27ae60)" }}>
                    Step 2: Navigate & Sync
                  </strong>
                </div>
                <code
                  style={{
                    background: "var(--surface-3)",
                    padding: "12px",
                    borderRadius: "var(--r)",
                    display: "block",
                    fontSize: "0.85rem",
                    fontFamily: "monospace",
                    border: "1px solid var(--border)",
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
{`cd c:\\Users\\WEB.WEB-DEVPC1\\Desktop\\git-sawo\\saworepo1\\sawo-main\\frontend
npm run sync:supabase`}
                </code>
              </div>

              {/* Step 3 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    background: "var(--success-bg, rgba(39, 174, 96, 0.1))",
                    border: "1px solid var(--success, #27ae60)",
                    borderRadius: "var(--r)",
                    padding: "12px 16px",
                    marginBottom: "10px",
                  }}
                >
                  <strong style={{ color: "var(--success, #27ae60)" }}>
                    Step 3: Wait & Done!
                  </strong>
                </div>
                <div
                  style={{
                    background: "var(--surface-3)",
                    padding: "12px 16px",
                    borderRadius: "var(--r)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                  }}
                >
                  Data syncs from Supabase → Local JSON files. Look for success message
                  in terminal.
                </div>
              </div>

              <div
                style={{
                  background: "var(--info-bg, rgba(26, 111, 168, 0.08))",
                  border: "1px solid var(--info, #1a6fa8)",
                  borderRadius: "var(--r)",
                  padding: "12px 16px",
                  marginTop: "20px",
                  fontSize: "0.85rem",
                  color: "var(--info, #1a6fa8)",
                }}
              >
                <strong>💡 Tip:</strong> Run this daily to keep local data fresh from
                Supabase, or whenever you upload new images/products.
              </div>
            </div>
          )}

          {activeTab === "detailed" && (
            <div>
              <h3 style={{ marginTop: 0, color: "var(--brand)" }}>
                📖 Complete Guide
              </h3>

              <h4 style={{ marginTop: "20px" }}>What is Sync?</h4>
              <p style={{ color: "var(--text-2)", lineHeight: 1.6 }}>
                Syncing downloads your product data from Supabase (cloud database) and
                saves it as JSON files on your computer. This creates a local backup and
                enables offline access.
              </p>

              <h4 style={{ marginTop: "20px" }}>Files That Get Synced</h4>
              <ul style={{ color: "var(--text-2)", lineHeight: 1.8 }}>
                <li>
                  <strong>products.json</strong> - All product information
                </li>
                <li>
                  <strong>categories.json</strong> - Product categories
                </li>
                <li>
                  <strong>tags.json</strong> - Product tags
                </li>
                <li>
                  <strong>Last sync timestamp</strong> - Tracks when data was updated
                </li>
              </ul>

              <h4 style={{ marginTop: "20px" }}>Step-by-Step</h4>

              <div
                style={{
                  background: "var(--surface-3)",
                  padding: "16px",
                  borderRadius: "var(--r)",
                  marginTop: "12px",
                  border: "1px solid var(--border)",
                  fontSize: "0.9rem",
                  lineHeight: 1.8,
                }}
              >
                <strong>1. Open Command Prompt or PowerShell</strong>
                <p style={{ margin: "8px 0", color: "var(--text-3)" }}>
                  Press Win+R, type "cmd" or "powershell", hit Enter
                </p>

                <strong>2. Navigate to project folder</strong>
                <code
                  style={{
                    display: "block",
                    background: "var(--surface)",
                    padding: "8px",
                    borderRadius: "4px",
                    margin: "8px 0",
                    fontSize: "0.85rem",
                    overflow: "auto",
                  }}
                >
                  cd c:\Users\WEB.WEB-DEVPC1\Desktop\git-sawo\saworepo1\sawo-main\frontend
                </code>

                <strong>3. Run sync command</strong>
                <code
                  style={{
                    display: "block",
                    background: "var(--surface)",
                    padding: "8px",
                    borderRadius: "4px",
                    margin: "8px 0",
                    fontSize: "0.85rem",
                  }}
                >
                  npm run sync:supabase
                </code>

                <strong>4. Watch for confirmation</strong>
                <p style={{ margin: "8px 0", color: "var(--text-3)" }}>
                  Terminal shows: "✅ Sync completed successfully!"
                </p>

                <strong>5. Check local files</strong>
                <code
                  style={{
                    display: "block",
                    background: "var(--surface)",
                    padding: "8px",
                    borderRadius: "4px",
                    margin: "8px 0",
                    fontSize: "0.85rem",
                    overflow: "auto",
                  }}
                >
                  src/Administrator/Local/data/
                </code>
                <p style={{ margin: "8px 0", color: "var(--text-3)" }}>
                  Look for updated JSON files with new timestamp
                </p>
              </div>

              <h4 style={{ marginTop: "20px" }}>When to Sync?</h4>
              <ul style={{ color: "var(--text-2)", lineHeight: 1.8 }}>
                <li>🌅 Morning - Start of workday</li>
                <li>📤 After upload - New images/products added</li>
                <li>🔄 Mid-day - Every few hours</li>
                <li>🌙 Before close - End of workday</li>
              </ul>
            </div>
          )}

          {activeTab === "troubleshoot" && (
            <div>
              <h3 style={{ marginTop: 0, color: "var(--brand)" }}>
                🔧 Troubleshooting
              </h3>

              {/* Issue 1 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    background: "var(--error-bg, rgba(231, 76, 60, 0.1))",
                    border: "1px solid var(--error, #e74c3c)",
                    borderRadius: "var(--r)",
                    padding: "12px 16px",
                    marginBottom: "10px",
                  }}
                >
                  <strong style={{ color: "var(--error, #e74c3c)" }}>
                    ❌ Command not found: npm
                  </strong>
                </div>
                <div
                  style={{
                    background: "var(--surface-3)",
                    padding: "12px 16px",
                    borderRadius: "var(--r)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: "0 0 10px" }}>
                    <strong>Problem:</strong> Node.js/npm not installed
                  </p>
                  <p style={{ margin: "0" }}>
                    <strong>Solution:</strong> Download Node.js from{" "}
                    <code style={{ background: "var(--surface)", padding: "2px 6px" }}>
                      nodejs.org
                    </code>
                    , install, then restart terminal
                  </p>
                </div>
              </div>

              {/* Issue 2 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    background: "var(--error-bg, rgba(231, 76, 60, 0.1))",
                    border: "1px solid var(--error, #e74c3c)",
                    borderRadius: "var(--r)",
                    padding: "12px 16px",
                    marginBottom: "10px",
                  }}
                >
                  <strong style={{ color: "var(--error, #e74c3c)" }}>
                    ❌ Permission denied
                  </strong>
                </div>
                <div
                  style={{
                    background: "var(--surface-3)",
                    padding: "12px 16px",
                    borderRadius: "var(--r)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: "0 0 10px" }}>
                    <strong>Problem:</strong> Missing file permissions
                  </p>
                  <p style={{ margin: "0 0 10px" }}>
                    <strong>Solution:</strong> Run terminal as Administrator:
                  </p>
                  <code
                    style={{
                      display: "block",
                      background: "var(--surface)",
                      padding: "8px",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                    }}
                  >
                    Right-click Terminal → Run as administrator
                  </code>
                </div>
              </div>

              {/* Issue 3 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    background: "var(--error-bg, rgba(231, 76, 60, 0.1))",
                    border: "1px solid var(--error, #e74c3c)",
                    borderRadius: "var(--r)",
                    padding: "12px 16px",
                    marginBottom: "10px",
                  }}
                >
                  <strong style={{ color: "var(--error, #e74c3c)" }}>
                    ❌ Supabase connection error
                  </strong>
                </div>
                <div
                  style={{
                    background: "var(--surface-3)",
                    padding: "12px 16px",
                    borderRadius: "var(--r)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: "0 0 10px" }}>
                    <strong>Problem:</strong> Can't reach Supabase (network issue)
                  </p>
                  <ul style={{ margin: "0", paddingLeft: "20px" }}>
                    <li>Check internet connection</li>
                    <li>Check if Supabase service is up</li>
                    <li>Try again in 1 minute</li>
                    <li>Check .env file has correct Supabase URL</li>
                  </ul>
                </div>
              </div>

              {/* Issue 4 */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    background: "var(--error-bg, rgba(231, 76, 60, 0.1))",
                    border: "1px solid var(--error, #e74c3c)",
                    borderRadius: "var(--r)",
                    padding: "12px 16px",
                    marginBottom: "10px",
                  }}
                >
                  <strong style={{ color: "var(--error, #e74c3c)" }}>
                    ❌ Sync seems stuck
                  </strong>
                </div>
                <div
                  style={{
                    background: "var(--surface-3)",
                    padding: "12px 16px",
                    borderRadius: "var(--r)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: "0 0 10px" }}>
                    <strong>Problem:</strong> Large dataset or slow connection
                  </p>
                  <ul style={{ margin: "0", paddingLeft: "20px" }}>
                    <li>Wait 2-5 minutes (may have lots of data)</li>
                    <li>Check if it's actually downloading (watch CPU)</li>
                    <li>If truly stuck, press Ctrl+C to cancel</li>
                    <li>Try again or check internet speed</li>
                  </ul>
                </div>
              </div>

              <div
                style={{
                  background: "var(--warning-bg, rgba(241, 196, 15, 0.1))",
                  border: "1px solid var(--warning, #f1c40f)",
                  borderRadius: "var(--r)",
                  padding: "12px 16px",
                  marginTop: "20px",
                  fontSize: "0.85rem",
                  color: "var(--warning, #f1c40f)",
                }}
              >
                <strong>ℹ️ Still stuck?</strong> Check the terminal output for error
                messages - they tell you exactly what's wrong!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface-2)",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
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
