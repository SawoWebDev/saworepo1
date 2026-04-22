import React from "react";

export function InstructionsModal({ open, onClose }) {
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
          maxWidth: "520px",
          width: "92%",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--surface-2)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>How to use Sync</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.3rem",
              cursor: "pointer",
              color: "var(--text-2)",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "22px 24px" }}>
          <p style={{ margin: "0 0 14px", color: "var(--text-2)", fontSize: "0.92rem", lineHeight: 1.6 }}>
            Before clicking the <strong>Sync</strong> button, start the backend once:
          </p>

          <code
            style={{
              display: "block",
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              padding: "12px 16px",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              marginBottom: 16,
            }}
          >
            start-all-services.bat
          </code>

          <p style={{ margin: "0 0 8px", color: "var(--text-2)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            That's it. The <strong>Sync</strong> button will then:
          </p>

          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-2)", fontSize: "0.88rem", lineHeight: 1.8 }}>
            <li>Pull new products from Supabase</li>
            <li>Download all images and files</li>
            <li>Save them to local JSON</li>
            <li>Auto-commit and push to GitHub</li>
          </ul>

          <div
            style={{
              marginTop: 18,
              background: "var(--info-bg, rgba(26,111,168,0.08))",
              border: "1px solid var(--info, #1a6fa8)",
              borderRadius: "var(--r)",
              padding: "10px 14px",
              fontSize: "0.82rem",
              color: "var(--info, #1a6fa8)",
            }}
          >
            All steps happen automatically — just watch the progress dialog.
          </div>
        </div>

        <div
          style={{
            padding: "12px 20px",
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
              background: "var(--brand)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--r)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
