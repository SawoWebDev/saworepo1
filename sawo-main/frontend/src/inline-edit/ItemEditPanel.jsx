// src/inline-edit/ItemEditPanel.jsx
// The consolidated "edit this box" modal opened from EditableCard — shows
// whichever of image / heading / description apply to that card in one
// panel, instead of separate scattered controls per field. Portaled to
// document.body by EditableCard, so it's never a DOM descendant of the
// card's Link — no navigation risk regardless of where it's opened from.
import React, { useState, useRef } from "react";
import { uploadImageToSupabase } from "./uploadImage";

function stop(e) {
  e.preventDefault();
  e.stopPropagation();
}

export default function ItemEditPanel({
  title, caption, image, imageAlt, folder, onClose, onSave,
}) {
  const [titleDraft, setTitleDraft] = useState(title ?? "");
  const [captionDraft, setCaptionDraft] = useState(caption ?? "");
  const [imageUrl, setImageUrl] = useState(image);
  const [mode, setMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setImageUrl(await uploadImageToSupabase(file, folder));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const applyUrl = () => {
    if (urlInput.trim()) { setImageUrl(urlInput.trim()); setUrlInput(""); }
  };

  const save = () => {
    onSave({
      title: title !== undefined ? titleDraft : undefined,
      caption: caption !== undefined ? captionDraft : undefined,
      imageUrl: image !== undefined ? imageUrl : undefined,
    });
  };

  return (
    <div className="sawo-dialog-overlay" onClick={(e) => { stop(e); onClose(); }}>
      <div className="sawo-dialog" onClick={stop}>
        <div className="sawo-dialog-header">
          <span>Edit content</span>
          <button onClick={(e) => { stop(e); onClose(); }} className="sawo-dialog-close">✕</button>
        </div>

        <div className="sawo-dialog-body">
          {image !== undefined && (
            <>
              <div className="sawo-dialog-label">Image</div>
              <img src={imageUrl} alt={imageAlt || ""} className="sawo-dialog-thumb" style={{ width: "100%", height: 140 }} />
              <div className="sawo-dialog-tabs">
                <button type="button" className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}>Upload file</button>
                <button type="button" className={mode === "url" ? "active" : ""} onClick={() => setMode("url")}>Paste URL</button>
              </div>
              {mode === "upload" ? (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
                  {uploading && <div className="sawo-dialog-hint">Uploading…</div>}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="text" placeholder="https://…" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="sawo-dialog-input" />
                  <button type="button" className="sawo-dialog-btn-secondary" onClick={applyUrl}>Use</button>
                </div>
              )}
            </>
          )}

          {title !== undefined && (
            <>
              <div className="sawo-dialog-label" style={{ marginTop: 12 }}>Heading</div>
              <input type="text" value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} className="sawo-dialog-input" />
            </>
          )}

          {caption !== undefined && (
            <>
              <div className="sawo-dialog-label" style={{ marginTop: 12 }}>Description</div>
              <textarea value={captionDraft} onChange={(e) => setCaptionDraft(e.target.value)} className="sawo-dialog-input" rows={3} />
            </>
          )}

          {error && <div className="sawo-dialog-error">{error}</div>}
        </div>

        <div className="sawo-dialog-footer">
          <button onClick={(e) => { stop(e); onClose(); }} className="sawo-dialog-btn-secondary">Cancel</button>
          <button onClick={(e) => { stop(e); save(); }} className="sawo-dialog-btn-primary" disabled={uploading}>Save</button>
        </div>
      </div>

      <style>{`
        .sawo-dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100001; display: flex; align-items: center; justify-content: center; }
        .sawo-dialog { background: #fff; border-radius: 10px; width: min(480px, 92vw); max-height: 85vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.4); font-family: Montserrat, sans-serif; }
        .sawo-dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e3ddd6; font-weight: 700; font-size: 14px; }
        .sawo-dialog-close { border: none; background: none; cursor: pointer; font-size: 14px; }
        .sawo-dialog-body { padding: 18px; display: flex; flex-direction: column; gap: 6px; }
        .sawo-dialog-label { font-size: 11px; font-weight: 600; color: #9a918a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .sawo-dialog-thumb { object-fit: cover; border-radius: 6px; border: 1px solid #e3ddd6; margin-bottom: 8px; }
        .sawo-dialog-tabs { display: flex; gap: 6px; }
        .sawo-dialog-tabs button { flex: 1; padding: 6px 10px; border: 1px solid #e3ddd6; background: #f7f5f2; border-radius: 6px; font-size: 12px; cursor: pointer; }
        .sawo-dialog-tabs button.active { background: #af8564; color: #fff; border-color: #af8564; }
        .sawo-dialog-input { width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #e3ddd6; border-radius: 6px; font-size: 13px; font-family: inherit; }
        .sawo-dialog-hint { font-size: 12px; color: #9a918a; margin-top: 6px; }
        .sawo-dialog-error { color: #c0392b; font-size: 12px; }
        .sawo-dialog-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px; border-top: 1px solid #e3ddd6; }
        .sawo-dialog-btn-primary { background: #af8564; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
        .sawo-dialog-btn-secondary { background: #f0ece7; border: 1px solid #e3ddd6; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
      `}</style>
    </div>
  );
}
