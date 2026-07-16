// src/inline-edit/ImageReplaceDialog.jsx
// Modal opened from EditableImage's "Replace image" overlay. Upload a file
// (converted to WebP + pushed to Supabase Storage) or paste a URL, plus alt
// text. Only ever loaded on demand — never part of the main bundle.

import React, { useState, useRef } from "react";
import { uploadImageToSupabase } from "./uploadImage";

export default function ImageReplaceDialog({ currentUrl, currentAlt, folder, onClose, onConfirm }) {
  const [mode, setMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [altInput, setAltInput] = useState(currentAlt || "");
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageToSupabase(file, folder);
      setPreviewUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const confirm = () => {
    const url = mode === "url" ? urlInput.trim() : previewUrl;
    if (!url) { setError("Choose a file or enter a URL first."); return; }
    onConfirm({ url, altText: altInput });
  };

  return (
    <div className="sawo-dialog-overlay" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}>
      <div className="sawo-dialog" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <div className="sawo-dialog-header">
          <span>Replace image</span>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} className="sawo-dialog-close">✕</button>
        </div>

        <div className="sawo-dialog-body">
          <div className="sawo-dialog-preview-row">
            <div>
              <div className="sawo-dialog-label">Current</div>
              <img src={currentUrl} alt="" className="sawo-dialog-thumb" />
            </div>
            {previewUrl && (
              <div>
                <div className="sawo-dialog-label">New</div>
                <img src={previewUrl} alt="" className="sawo-dialog-thumb" />
              </div>
            )}
          </div>

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
            <input
              type="text"
              placeholder="https://…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="sawo-dialog-input"
            />
          )}

          <div className="sawo-dialog-label" style={{ marginTop: 12 }}>Alt text</div>
          <input
            type="text"
            value={altInput}
            onChange={(e) => setAltInput(e.target.value)}
            className="sawo-dialog-input"
            placeholder="Describe the image for accessibility/SEO"
          />

          {error && <div className="sawo-dialog-error">{error}</div>}
        </div>

        <div className="sawo-dialog-footer">
          <button onClick={onClose} className="sawo-dialog-btn-secondary">Cancel</button>
          <button onClick={confirm} className="sawo-dialog-btn-primary" disabled={uploading}>Use this image</button>
        </div>
      </div>

      <style>{`
        .sawo-dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100001; display: flex; align-items: center; justify-content: center; }
        .sawo-dialog { background: #fff; border-radius: 10px; width: min(480px, 92vw); max-height: 85vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.4); font-family: Montserrat, sans-serif; }
        .sawo-dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e3ddd6; font-weight: 700; font-size: 14px; }
        .sawo-dialog-close { border: none; background: none; cursor: pointer; font-size: 14px; }
        .sawo-dialog-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
        .sawo-dialog-preview-row { display: flex; gap: 14px; }
        .sawo-dialog-label { font-size: 11px; font-weight: 600; color: #9a918a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .sawo-dialog-thumb { width: 120px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #e3ddd6; }
        .sawo-dialog-tabs { display: flex; gap: 6px; }
        .sawo-dialog-tabs button { flex: 1; padding: 6px 10px; border: 1px solid #e3ddd6; background: #f7f5f2; border-radius: 6px; font-size: 12px; cursor: pointer; }
        .sawo-dialog-tabs button.active { background: #af8564; color: #fff; border-color: #af8564; }
        .sawo-dialog-input { width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #e3ddd6; border-radius: 6px; font-size: 13px; }
        .sawo-dialog-hint { font-size: 12px; color: #9a918a; margin-top: 6px; }
        .sawo-dialog-error { color: #c0392b; font-size: 12px; }
        .sawo-dialog-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 18px; border-top: 1px solid #e3ddd6; }
        .sawo-dialog-btn-primary { background: #af8564; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
        .sawo-dialog-btn-secondary { background: #f0ece7; border: 1px solid #e3ddd6; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
      `}</style>
    </div>
  );
}
