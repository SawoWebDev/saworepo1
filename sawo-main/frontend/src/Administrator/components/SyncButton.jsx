import React, { useState } from "react";
import { queueAutoSync } from "../Local/triggerAutoSync";

/**
 * Manual Sync Button Component
 * Shows sync status and triggers immediate sync when clicked
 */
export function SyncButton({ compact = false }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [status, setStatus] = useState(null);

  const handleSync = async () => {
    if (syncing) return;

    setSyncing(true);
    setStatus({ type: "info", message: "🔄 Syncing..." });

    try {
      const result = await queueAutoSync(true); // Force immediate sync

      if (result?.success === false && result?.message === 'Daemon unavailable') {
        setStatus({
          type: "warning",
          message: "⚠️ Daemon not running - start it for auto-sync",
        });
      } else if (result?.changed) {
        setStatus({
          type: "success",
          message: `✅ Synced! ${result.pushed ? "Pushed to GitHub" : "Ready to push"}`,
        });
        setLastSync(new Date().toLocaleTimeString());
      } else if (result?.success === false) {
        setStatus({
          type: "info",
          message: "💡 Sync queued (daemon may not be running)",
        });
      } else {
        setStatus({
          type: "info",
          message: "✓ No changes to sync",
        });
        setLastSync(new Date().toLocaleTimeString());
      }

      // Auto-clear message after 4-5 seconds
      setTimeout(() => setStatus(null), result?.success === false ? 5000 : 4000);
    } catch (err) {
      setStatus({
        type: "error",
        message: `❌ Error: ${err.message}`,
      });
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  if (compact) {
    // Minimal button for toolbar
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          title="Click to sync product images & data to GitHub"
          style={{
            padding: "6px 12px",
            borderRadius: "var(--r)",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
            cursor: syncing ? "wait" : "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: syncing ? 0.6 : 1,
            transition: "all 0.2s",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            if (!syncing) e.target.style.background = "var(--surface-3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "var(--surface-2)";
          }}
        >
          <i className={`fa-solid fa-${syncing ? "spinner fa-spin" : "cloud-arrow-up"}`} />
          {syncing ? "Syncing..." : "Sync"}
        </button>

        {status && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "8px",
              background:
                status.type === "success"
                  ? "var(--success-bg, rgba(39, 174, 96, 0.1))"
                  : status.type === "error"
                    ? "var(--error-bg, rgba(231, 76, 60, 0.1))"
                    : "var(--info-bg, rgba(26, 111, 168, 0.1))",
              border:
                status.type === "success"
                  ? "1px solid var(--success, #27ae60)"
                  : status.type === "error"
                    ? "1px solid var(--error, #e74c3c)"
                    : "1px solid var(--info, #1a6fa8)",
              color:
                status.type === "success"
                  ? "var(--success, #27ae60)"
                  : status.type === "error"
                    ? "var(--error, #e74c3c)"
                    : "var(--info, #1a6fa8)",
              padding: "6px 10px",
              borderRadius: "var(--r)",
              fontSize: "0.75rem",
              whiteSpace: "nowrap",
              zIndex: 1000,
            }}
          >
            {status.message}
          </div>
        )}
      </div>
    );
  }

  // Full widget for sidebar/dashboard
  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        padding: "14px",
        marginBottom: "12px",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "4px" }}>
          📤 GitHub Sync
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          Sync product images & data to GitHub
        </div>
      </div>

      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "var(--r)",
          border: "1px solid var(--border)",
          background: syncing ? "var(--surface-3)" : "var(--brand)",
          color: "#fff",
          cursor: syncing ? "wait" : "pointer",
          fontSize: "0.85rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          opacity: syncing ? 0.7 : 1,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!syncing) e.target.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = syncing ? "0.7" : "1";
        }}
      >
        <i className={`fa-solid fa-${syncing ? "spinner fa-spin" : "cloud-arrow-up"}`} />
        {syncing ? "Syncing..." : "Sync Now"}
      </button>

      {status && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px 10px",
            borderRadius: "var(--r)",
            fontSize: "0.8rem",
            background:
              status.type === "success"
                ? "var(--success-bg, rgba(39, 174, 96, 0.1))"
                : status.type === "error"
                  ? "var(--error-bg, rgba(231, 76, 60, 0.1))"
                  : "var(--info-bg, rgba(26, 111, 168, 0.08))",
            color:
              status.type === "success"
                ? "var(--success, #27ae60)"
                : status.type === "error"
                  ? "var(--error, #e74c3c)"
                  : "var(--info, #1a6fa8)",
            border:
              status.type === "success"
                ? "1px solid var(--success, #27ae60)"
                : status.type === "error"
                  ? "1px solid var(--error, #e74c3c)"
                  : "1px solid var(--info-bg, #d0e0eb)",
          }}
        >
          {status.message}
        </div>
      )}

      {lastSync && (
        <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "var(--text-3)" }}>
          Last synced: <strong>{lastSync}</strong>
        </div>
      )}
    </div>
  );
}
