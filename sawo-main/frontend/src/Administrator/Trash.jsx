// src/Administrator/Trash.jsx
//
// Recovery view for soft-deleted products and sauna rooms. Deleting either
// from their own CMS page no longer runs a real SQL DELETE — it flips
// is_deleted/deleted_at instead (see Products.jsx's handleDelete and
// SaunaRoomsCMS.jsx's equivalent). Rows land here for 30 days, restorable at
// any point; a daily Postgres job (purge_expired_trash(), scheduled via
// pg_cron) permanently removes anything past that window on its own — this
// page doesn't need to do anything for that half, it only handles the two
// admin-initiated actions: Restore, and Delete Forever (skip the wait).
import React, { useEffect, useState, useCallback } from "react";
import { supabase, logActivity } from "./supabase";
import { getTrashedProductsLive, getTrashedSaunaRoomsLive, getTrashedMediaLive } from "../local-storage/supabaseReader";
import { deleteR2Urls, trashMediaUrls, restoreMediaLogRow } from "./mediaUpload";
import ScrollArea from "./ScrollArea";
import Pagination from "./Pagination";
import { usePagination } from "./usePagination";

const TRASH_DAYS = 30;

function daysLeft(deletedAt) {
  if (!deletedAt) return TRASH_DAYS;
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(TRASH_DAYS - elapsedDays));
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "-";
}

// Same Supabase-storage URL shape Products.jsx/SaunaRoomsCMS.jsx already
// parse for their own storage cleanup — kept local rather than imported
// since neither of those export it (matches this codebase's existing
// per-file-duplication convention for this exact helper).
function parseStorageUrl(url) {
  if (!url) return null;
  try {
    const clean = url.split("?")[0];
    const match = clean.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (!match) return null;
    return { bucket: match[1], path: match[2] };
  } catch { return null; }
}

async function deleteSupabaseStorageUrls(urls = []) {
  const byBucket = {};
  for (const url of urls) {
    const parsed = parseStorageUrl(url);
    if (!parsed) continue;
    (byBucket[parsed.bucket] = byBucket[parsed.bucket] || []).push(parsed.path);
  }
  await Promise.allSettled(
    Object.entries(byBucket).map(([bucket, paths]) => supabase.storage.from(bucket).remove(paths))
  );
}

function collectMediaUrls(item) {
  return [
    item.thumbnail,
    item.og_image,
    ...(item.images || []),
    ...(item.spec_images || []),
    ...(item.files || []).map(f => f?.url),
  ].filter(Boolean);
}

function Toast({ toasts, remove }) {
  const icons = { error: "fa-circle-xmark", success: "fa-circle-check", info: "fa-circle-info", warning: "fa-triangle-exclamation" };
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`fa-solid ${icons[t.type]}`} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button className="toast-close" onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function TrashSection({ title, icon, emptyLabel, fetchFn, table, onGone, currentUser, addToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await fetchFn()); }
    finally { setLoading(false); }
  }, [fetchFn]);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (item) => {
    setBusyId(item.id);
    try {
      const { error } = await supabase.from(table).update({ is_deleted: false, deleted_at: null }).eq("id", item.id);
      if (error) throw error;
      await logActivity({
        action: "update", entity: table === "products" ? "product" : "sauna_room",
        entity_id: item.id, entity_name: item.name,
        username: currentUser?.username || "unknown", user_id: currentUser?.id || null,
        meta: { restored_from_trash: true },
      });
      addToast(`"${item.name}" restored.`, "success");
      setItems(prev => prev.filter(i => i.id !== item.id));
      onGone?.();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const handlePurge = async () => {
    const item = purgeTarget;
    setPurgeTarget(null);
    setBusyId(item.id);
    try {
      const { error } = await supabase.from(table).delete().eq("id", item.id);
      if (error) throw error;
      const urls = collectMediaUrls(item);
      await Promise.allSettled([
        deleteSupabaseStorageUrls(urls),
        deleteR2Urls(urls, currentUser),
      ]);
      await logActivity({
        action: "delete", entity: table === "products" ? "product" : "sauna_room",
        entity_id: item.id, entity_name: item.name,
        username: currentUser?.username || "unknown", user_id: currentUser?.id || null,
        meta: { permanent: true, from_trash: true },
      });
      addToast(`"${item.name}" permanently deleted.`, "success");
      setItems(prev => prev.filter(i => i.id !== item.id));
      onGone?.();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const { page, setPage, pageSize, setPageSize, totalPages, totalCount, pageItems } = usePagination(items, { initialPageSize: 25 });

  return (
    <div className="card card-body" style={{ padding: 0, marginBottom: 24 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <i className={`fa-solid ${icon}`} style={{ color: "var(--brand)" }} />
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>{title}</h3>
        <span className="tbl-pill" style={{ marginLeft: 4 }}>{items.length}</span>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)" }}>
          <i className="fa-solid fa-spinner fa-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="table-empty" style={{ padding: 24 }}>{emptyLabel}</div>
      ) : (
        <div className="products-table-wrap" style={{ border: "none", borderRadius: 0 }}>
          <table className="products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Deleted</th>
                <th>Auto-purges in</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(item => {
                const left = daysLeft(item.deleted_at);
                return (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontFamily: "var(--font)", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                        {item.name}
                      </span>
                    </td>
                    <td className="tbl-date">{formatDate(item.deleted_at)}</td>
                    <td>
                      <span
                        className="tbl-pill"
                        style={left <= 5
                          ? { background: "var(--danger-bg)", color: "var(--danger)" }
                          : undefined}
                      >
                        {left} day{left === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-sm"
                          disabled={busyId === item.id}
                          onClick={() => handleRestore(item)}
                        >
                          <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 5 }} />
                          Restore
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          title="Delete forever"
                          disabled={busyId === item.id}
                          onClick={() => setPurgeTarget(item)}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel={title.toLowerCase()}
          />
        </div>
      )}

      <Modal open={!!purgeTarget} onClose={() => setPurgeTarget(null)} title="Delete Forever?">
        <p className="confirm-msg">
          This permanently deletes "{purgeTarget?.name}" and its images/files right now — there's no more waiting
          out the {TRASH_DAYS}-day window, and this cannot be undone.
        </p>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setPurgeTarget(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handlePurge}>Delete Forever</button>
        </div>
      </Modal>
    </div>
  );
}

const MEDIA_ROLE_LABELS = { thumbnail: "Featured Image", og: "OG Image", gallery: "Gallery Image", spec: "Spec Image" };
function mediaRoleLabel(role) {
  if (MEDIA_ROLE_LABELS[role]) return MEDIA_ROLE_LABELS[role];
  if (role?.startsWith("variation-")) return "Variant Image";
  if (role?.startsWith("included-")) return "Included Item Image";
  return "Image";
}

// Individual image trash — separate from TrashSection above (which handles
// whole soft-deleted products/rooms) because restoring here means
// something different per role: thumbnail/og are single-slot fields, so
// restoring SWAPS them back in (whatever's currently there gets trashed in
// its place — the same trashMediaUrls() every remove/replace call already
// uses, see Products.jsx/SaunaRoomsCMS.jsx); gallery/spec are arrays, so
// restoring just re-adds the url; everything else (variant/included-item
// images) has no reliable slot to auto-reattach to — see mediaUpload.js's
// restoreMediaLogRow comment — so restoring those only stops the
// auto-purge clock, it doesn't try to put the image back anywhere.
function MediaTrashSection({ currentUser, addToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getTrashedMediaLive()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (item) => {
    setBusyId(item.id);
    try {
      const table = item.entity_prefix === "products" ? "products" : "sauna_rooms";
      const { data: entity, error: fetchErr } = await supabase
        .from(table).select("*").eq("slug", item.slug).maybeSingle();
      if (fetchErr) throw fetchErr;

      if (!entity) {
        addToast(`The original ${table === "products" ? "product" : "sauna room"} ("${item.slug}") no longer exists — un-trashed, but not re-attached anywhere.`, "warning");
      } else if (item.role === "thumbnail" || item.role === "og") {
        const field = item.role === "thumbnail" ? "thumbnail" : "og_image";
        const currentUrl = entity[field];
        // The swap: whatever is currently in this slot goes to trash in
        // this image's place, same as any other replace.
        if (currentUrl && currentUrl !== item.public_url) {
          await trashMediaUrls([currentUrl], currentUser);
        }
        const { error } = await supabase.from(table).update({ [field]: item.public_url }).eq("id", entity.id);
        if (error) throw error;
      } else if (item.role === "gallery" || item.role === "spec") {
        const field = item.role === "gallery" ? "images" : "spec_images";
        const arr = entity[field] || [];
        if (!arr.includes(item.public_url)) {
          const { error } = await supabase.from(table).update({ [field]: [...arr, item.public_url] }).eq("id", entity.id);
          if (error) throw error;
        }
      }
      // else (variation-*/included-*/anything else): no field to write —
      // restoreMediaLogRow below is the entire restore for these.

      await restoreMediaLogRow(item.id);
      addToast("Image restored.", "success");
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const handlePurge = async () => {
    const item = purgeTarget;
    setPurgeTarget(null);
    setBusyId(item.id);
    try {
      await deleteR2Urls([item.public_url], currentUser);
      addToast("Image permanently deleted.", "success");
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const { page, setPage, pageSize, setPageSize, totalPages, totalCount, pageItems } = usePagination(items, { initialPageSize: 24 });

  return (
    <div className="card card-body" style={{ padding: 0, marginBottom: 24 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <i className="fa-solid fa-image" style={{ color: "var(--brand)" }} />
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>Media</h3>
        <span className="tbl-pill" style={{ marginLeft: 4 }}>{items.length}</span>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)" }}>
          <i className="fa-solid fa-spinner fa-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="table-empty" style={{ padding: 24 }}>No trashed images.</div>
      ) : (
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {pageItems.map(item => {
            const left = daysLeft(item.trashed_at);
            return (
              <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-sm)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ aspectRatio: "1/1", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={item.public_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={e => { e.target.style.display = "none"; }} />
                </div>
                <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text)" }}>{mediaRoleLabel(item.role)}</span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.slug}>
                    {item.slug}
                  </span>
                  <span
                    className="tbl-pill"
                    style={{ fontSize: "0.62rem", alignSelf: "flex-start", ...(left <= 5 ? { background: "var(--danger-bg)", color: "var(--danger)" } : {}) }}
                  >
                    {left} day{left === 1 ? "" : "s"} left
                  </span>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button type="button" className="btn btn-sm" style={{ flex: 1 }} disabled={busyId === item.id} onClick={() => handleRestore(item)}>
                      <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 5 }} />
                      Restore
                    </button>
                    <button type="button" className="icon-btn danger" title="Delete forever" disabled={busyId === item.id} onClick={() => setPurgeTarget(item)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="image"
          />
        </div>
      )}

      <Modal open={!!purgeTarget} onClose={() => setPurgeTarget(null)} title="Delete Forever?">
        <p className="confirm-msg">
          This permanently deletes this image right now — there's no more waiting out the {TRASH_DAYS}-day
          window, and this cannot be undone.
        </p>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setPurgeTarget(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handlePurge}>Delete Forever</button>
        </div>
      </Modal>
    </div>
  );
}

export default function Trash({ currentUser }) {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  };
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id));

  return (
    <div className="cms-scroll-page">
      <Toast toasts={toasts} remove={removeToast} />

      <p style={{ fontSize: "0.85rem", color: "var(--text-2)", margin: "0 0 20px", maxWidth: 720 }}>
        Deleting a product, sauna room, or a single image (Featured/OG/gallery/spec/variant photos — replacing
        one counts too, not just removing it) moves it here instead of removing it right away. Anything sitting in
        Trash for {TRASH_DAYS} days gets permanently deleted automatically — restore it before then if it was a
        mistake, or delete it forever yourself to skip the wait. Restoring a Featured/OG image swaps it back in:
        whatever's currently there goes to Trash in its place.
      </p>

      <ScrollArea>
        <TrashSection
          title="Products"
          icon="fa-box"
          emptyLabel="No deleted products."
          fetchFn={getTrashedProductsLive}
          table="products"
          currentUser={currentUser}
          addToast={addToast}
        />
        <TrashSection
          title="Sauna Rooms"
          icon="fa-home"
          emptyLabel="No deleted sauna rooms."
          fetchFn={getTrashedSaunaRoomsLive}
          table="sauna_rooms"
          currentUser={currentUser}
          addToast={addToast}
        />
        <MediaTrashSection currentUser={currentUser} addToast={addToast} />
      </ScrollArea>
    </div>
  );
}
