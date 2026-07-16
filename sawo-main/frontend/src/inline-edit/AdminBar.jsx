// src/inline-edit/AdminBar.jsx
// Fixed top bar for logged-in admins. Desktop-only by design (hidden below
// 768px) — see the plan note: the edit UI (contentEditable, hover overlays,
// modals) isn't a good fit for touch/small screens, and hiding it there adds
// zero risk to the mobile experience anyone else sees.

import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditContext } from "./EditProvider";
import { clearSession } from "../Administrator/supabase";
import { can } from "../Administrator/permissions";
import { saveAndPublish } from "./saveAndPublish";

const BAR_HEIGHT = 40;

export default function AdminBar() {
  const ctx = useContext(EditContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("sawo-admin-bar-active");
    return () => document.documentElement.classList.remove("sawo-admin-bar-active");
  }, []);

  if (!ctx || !ctx.session) return null;
  const {
    session, pageId, editMode, dirtyCount, pending,
    enterEditMode, discardEdits, clearPending, loadingEditBase,
  } = ctx;
  const { user } = session;
  const canSync = can(user?.role, "content.sync");

  const handleToggleEdit = async () => {
    setStatus(null);
    if (editMode) { discardEdits(); return; }
    await enterEditMode();
  };

  const handleDiscard = () => {
    discardEdits();
    setStatus(null);
  };

  const handleSave = async () => {
    if (!pageId || dirtyCount === 0) return;
    setSaving(true);
    setStatus(null);
    try {
      const result = await saveAndPublish({
        pageId,
        pending,
        username: user?.username,
        userId: user?.id,
        onPublishEvent: () => {},
      });
      clearPending();
      if (result.published) {
        setStatus({ type: "success", message: "Saved and published — live for visitors now." });
      } else if (result.source === "supabase") {
        setStatus({ type: "success", message: "Saved — live immediately (Supabase data source)." });
      } else if (result.publishError) {
        setStatus({ type: "error", message: `Saved to database. Publish failed: ${result.publishError}. Run "Sync to GitHub" from /admin/content.` });
      } else {
        setStatus({ type: "success", message: "Saved." });
      }
    } catch (err) {
      setStatus({ type: "error", message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <>
      <div className="sawo-admin-bar">
        <span className="sawo-admin-bar-brand">SAWO Admin</span>

        {pageId ? (
          <>
            <button
              className={`sawo-admin-bar-btn ${editMode ? "active" : ""}`}
              onClick={handleToggleEdit}
              disabled={loadingEditBase}
            >
              {loadingEditBase ? "Loading…" : editMode ? "Exit Edit Mode" : "Edit Page"}
            </button>

            {editMode && (
              <>
                <span className="sawo-admin-bar-dirty">
                  {dirtyCount > 0 ? `${dirtyCount} unsaved section${dirtyCount > 1 ? "s" : ""}` : "No changes yet"}
                </span>
                <button className="sawo-admin-bar-btn primary" onClick={handleSave} disabled={saving || dirtyCount === 0}>
                  {saving ? "Saving…" : canSync ? "Save & Publish" : "Save"}
                </button>
                <button className="sawo-admin-bar-btn" onClick={handleDiscard} disabled={saving || dirtyCount === 0}>
                  Discard
                </button>
              </>
            )}
          </>
        ) : (
          <span className="sawo-admin-bar-dirty" title="Inline editing isn't wired up for this page yet">
            Edit Page (not available here)
          </span>
        )}

        <span className="sawo-admin-bar-spacer" />

        {status && <span className={`sawo-admin-bar-status ${status.type}`}>{status.message}</span>}

        <button className="sawo-admin-bar-btn" onClick={() => navigate("/admin/products")}>Dashboard</button>
        <button className="sawo-admin-bar-btn" onClick={handleLogout}>Log out</button>
      </div>

      <style>{`
        html.sawo-admin-bar-active header.fixed.top-0 { top: ${BAR_HEIGHT}px; }
        html.sawo-admin-bar-active body { padding-top: ${BAR_HEIGHT}px; }

        .sawo-admin-bar {
          position: fixed; top: 0; left: 0; width: 100%; height: ${BAR_HEIGHT}px;
          background: #1a1714; color: #d4cfc9; z-index: 999999;
          display: flex; align-items: center; gap: 10px; padding: 0 16px;
          font-family: Montserrat, sans-serif; font-size: 12.5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .sawo-admin-bar-brand { font-weight: 700; color: #af8564; margin-right: 6px; white-space: nowrap; }
        .sawo-admin-bar-btn {
          background: rgba(255,255,255,0.08); color: #d4cfc9; border: 1px solid rgba(255,255,255,0.12);
          border-radius: 4px; padding: 5px 10px; font-size: 12px; cursor: pointer; white-space: nowrap;
        }
        .sawo-admin-bar-btn:hover:not(:disabled) { background: rgba(255,255,255,0.16); }
        .sawo-admin-bar-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sawo-admin-bar-btn.active, .sawo-admin-bar-btn.primary { background: #af8564; color: #fff; border-color: #af8564; }
        .sawo-admin-bar-dirty { color: #d4a017; white-space: nowrap; }
        .sawo-admin-bar-spacer { flex: 1; }
        .sawo-admin-bar-status { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40vw; }
        .sawo-admin-bar-status.success { color: #68d391; }
        .sawo-admin-bar-status.error { color: #fc8181; }

        @media (max-width: 768px) {
          .sawo-admin-bar { display: none; }
          html.sawo-admin-bar-active header.fixed.top-0 { top: 0; }
          html.sawo-admin-bar-active body { padding-top: 0; }
        }
      `}</style>
    </>
  );
}
