// src/inline-edit/EditProvider.jsx
//
// Mounted once in MainLayout, wrapping every public page. For logged-out
// visitors this only ever reads localStorage (hasAdminSession) and renders
// {children} — no extra DOM, no extra network calls, no admin code downloaded.
//
// For a logged-in admin with the "content.edit" capability, it also:
//  - loads the current page's site_content (same cache as before) for display
//  - on "Edit Page", re-fetches the page's rows live from Supabase (`editBase`)
//    so edits start from the latest saved state, not the possibly-stale
//    GitHub-snapshot cache
//  - tracks pending, unsaved edits per section (`pending`)
//  - lazily mounts the admin bar + editing chrome (AdminEditSystem), which is
//    a separate chunk never requested by logged-out visitors
//
// EditableText / EditableImage read/write through the `useEditableField`
// hook exported below; they don't talk to Supabase or localStorage directly.

import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo, lazy, Suspense,
} from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../Administrator/supabase";
import { can } from "../Administrator/permissions";
import { getSiteContent } from "../local-storage/cacheReader";
import { hasAdminSession, getAdminUser } from "./adminSession";
import { getPageIdForPath } from "./pageIds";
import { getAtPath, setAtPath } from "./pathUtils";

export const EditContext = createContext(null);

const AdminEditSystem = lazy(() => import("./AdminEditSystem"));

export function EditProvider({ children }) {
  const location = useLocation();
  const pageId = useMemo(() => getPageIdForPath(location.pathname), [location.pathname]);

  const [session] = useState(() => {
    if (!hasAdminSession()) return null;
    const user = getAdminUser();
    if (!user || !can(user.role, "content.edit")) return null;
    return { user };
  });

  const [content, setContent] = useState({});
  const [editBase, setEditBase] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [pending, setPending] = useState({});
  const [loadingEditBase, setLoadingEditBase] = useState(false);

  // Reset edit state and (re)load display content whenever the route changes.
  useEffect(() => {
    setEditMode(false);
    setPending({});
    if (!pageId) { setContent({}); return; }
    let cancelled = false;
    getSiteContent(pageId).then((data) => { if (!cancelled) setContent(data || {}); }).catch(() => {});
    return () => { cancelled = true; };
  }, [pageId]);

  const enterEditMode = useCallback(async () => {
    if (!pageId || !session) return;
    setLoadingEditBase(true);
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("section, data")
        .eq("page", pageId);
      if (!error) {
        const base = {};
        for (const row of data || []) base[row.section] = row.data;
        setEditBase(base);
      }
    } finally {
      setLoadingEditBase(false);
      setEditMode(true);
    }
  }, [pageId, session]);

  const discardEdits = useCallback(() => {
    setPending({});
    setEditMode(false);
  }, []);

  const clearPending = useCallback(() => setPending({}), []);

  const setFieldValue = useCallback((section, path, value) => {
    setPending((prev) => ({ ...prev, [section]: setAtPath(prev[section] || {}, path, value) }));
  }, []);

  const dirtyCount = Object.keys(pending).length;

  const ctxValue = useMemo(() => ({
    session, pageId, content, editBase, editMode, pending, dirtyCount, loadingEditBase,
    enterEditMode, discardEdits, clearPending, setFieldValue,
  }), [session, pageId, content, editBase, editMode, pending, dirtyCount, loadingEditBase, enterEditMode, discardEdits, clearPending, setFieldValue]);

  return (
    <EditContext.Provider value={ctxValue}>
      {children}
      {session && (
        <>
          <Suspense fallback={null}>
            <AdminEditSystem />
          </Suspense>
          {/* Edit-mode affordance styles — only ever shipped to a logged-in admin's page. */}
          <style>{`
            .sawo-editable-active { outline: 2px dashed #af8564; outline-offset: 2px; cursor: text; border-radius: 2px; }
            .sawo-edit-pencil {
              margin-left: 6px; border: none; background: rgba(175,133,100,0.18); color: #af8564;
              border-radius: 4px; width: 22px; height: 22px; cursor: pointer; font-size: 12px; vertical-align: middle;
            }
            .sawo-edit-pencil-fixed { margin-left: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
            .sawo-edit-popover {
              background: #fff; border: 1px solid #e3ddd6;
              border-radius: 6px; padding: 8px; display: flex; gap: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
              white-space: nowrap;
            }
            .sawo-edit-popover input {
              border: 1px solid #e3ddd6; border-radius: 4px; padding: 4px 8px; font-size: 13px; min-width: 220px;
            }
            .sawo-edit-popover button {
              border: none; border-radius: 4px; padding: 4px 10px; font-size: 12px; cursor: pointer;
              background: #af8564; color: #fff;
            }
            .sawo-rich-toolbar { display: inline-flex; gap: 4px; margin-bottom: 4px; }
            .sawo-rich-toolbar button {
              border: 1px solid #e3ddd6; background: #fff; border-radius: 4px; width: 24px; height: 22px;
              font-size: 12px; cursor: pointer; line-height: 1;
            }
            .sawo-image-replace-btn {
              background: rgba(20,17,15,0.82); color: #fff; border: 1px solid rgba(255,255,255,0.25);
              border-radius: 6px; padding: 7px 12px; font-size: 12px; cursor: pointer;
              box-shadow: 0 4px 16px rgba(0,0,0,0.35); white-space: nowrap;
            }
            .sawo-image-replace-btn:hover { background: rgba(175,133,100,0.92); }
            .sawo-card-edit-btn {
              background: rgba(175,133,100,0.95); color: #fff; border: 1px solid rgba(255,255,255,0.3);
              border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
              box-shadow: 0 4px 16px rgba(0,0,0,0.35);
            }
            .sawo-card-edit-btn:hover { background: #8c6540; }
          `}</style>
        </>
      )}
    </EditContext.Provider>
  );
}

// Read/write a single field. `page`/`section` identify the site_content row,
// `path` is a dot-path into its JSONB `data` (see pathUtils).
export function useEditableField({ page, section, path }) {
  const ctx = useContext(EditContext);
  if (!ctx) return { value: undefined, editMode: false, setValue: () => {} };

  const { pageId, content, editBase, editMode, pending, setFieldValue } = ctx;
  const active = editMode && pageId === page;
  const base = active ? (editBase[section] || {}) : (content[section] || {});
  const patch = pending[section];
  const patchedValue = patch ? getAtPath(patch, path) : undefined;
  const baseValue = getAtPath(base, path);
  const value = patchedValue !== undefined ? patchedValue : baseValue;

  return {
    value,
    editMode: active,
    setValue: (v) => setFieldValue(section, path, v),
  };
}
