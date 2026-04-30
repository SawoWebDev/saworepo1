// src/Administrator/SaunaRoomsCMS.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase, logActivity } from "./supabase";
import { getPerms } from "./permissions";
import { checkSaunaRoomsSync, applyLocalRoomChanges } from "./Local/compareSupabaseWithLocalRooms";
import { useLocalSaunaRooms } from "./Local/useLocalSaunaRooms";

const FRONT_URL = process.env.REACT_APP_FRONT_URL || "";
const STORAGE_BUCKETS = ["saunaroom-images", "sauna-pdf"];
const PREVIEW_GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoomImageUrl(room, field, dataSource) {
  const val = room?.[field];
  if (!val) return null;
  if (val.includes("://")) return val;
  if (dataSource === "live") return val;
  return `${PREVIEW_GITHUB_RAW}${val}`;
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formsEqual(a, b) {
  for (const k of Object.keys(EMPTY_FORM)) {
    const av = a[k], bv = b[k];
    if (Array.isArray(av) && Array.isArray(bv)) {
      if (JSON.stringify(av) !== JSON.stringify(bv)) return false;
    } else if (typeof av === "object" && av !== null && typeof bv === "object" && bv !== null) {
      if (JSON.stringify(av) !== JSON.stringify(bv)) return false;
    } else if (av !== bv) return false;
  }
  return true;
}

const ROOM_TYPES = [
  { value: "traditional", label: "Traditional" },
  { value: "infrared",    label: "Infrared" },
  { value: "steam",       label: "Steam" },
  { value: "combo",       label: "Combo" },
];

const SIZE_CATEGORIES = [
  { value: "compact",    label: "Compact (1–2 person)" },
  { value: "small",      label: "Small (2–3 person)" },
  { value: "medium",     label: "Medium (3–4 person)" },
  { value: "large",      label: "Large (4–6 person)" },
  { value: "xl",         label: "XL (6+ person)" },
  { value: "commercial", label: "Commercial" },
];

const EMPTY_FORM = {
  // Core identity
  name: "", slug: "", short_description: "", description: "", thumbnail: "", sku: "",
  // Classification
  room_type: "traditional", model_code: "", size_category: "",
  // Dimensions
  width_m: "", depth_m: "", height_m: "",
  // Capacity
  capacity_label: "", capacity_min: "", capacity_max: "",
  // Materials
  wood_options: [], wood_options_enabled: [],
  // Configs
  configurations: {}, door_options: [], side_order: [],
  // IR-specific
  ir_panel_wattage_w: "", ir_total_power_w: "", ir_voltage_v: 230, ir_session_time_min: "",
  // Features & specs
  features: [], feature_tabs: [], spec_table: null,
  // Media
  images: [], spec_images: [], resources: [], files: [],
  // CMS flags
  tags: [], categories: [],
  status: "draft", visible: true, featured: false,
  is_best_seller: false, has_door_filter: true,
  sort_order: 0,
};

// ─── WebP conversion + resize ─────────────────────────────────────────────────
const WEBP_QUALITY = 0.82;
const WEBP_MAX_DIM = 1800;

function convertToWebP(file, maxDim = WEBP_MAX_DIM, quality = WEBP_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else { width = Math.round((width / height) * maxDim); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error("WebP conversion failed")),
        "image/webp", quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

async function uploadFileToSupabase(file, bucket = "saunaroom-images") {
  let uploadBlob, fileName;
  if (file.type.startsWith("image/")) {
    try {
      uploadBlob = await convertToWebP(file);
      fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
    } catch {
      uploadBlob = file;
      const ext = file.name.split(".").pop();
      fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    }
  } else {
    uploadBlob = file;
    const ext = file.name.split(".").pop();
    fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  }
  const contentType = file.type.startsWith("image/") ? "image/webp" : file.type;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, uploadBlob, { cacheControl: "3600", upsert: false, contentType });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

function parseStorageUrl(url) {
  if (!url) return null;
  try {
    const clean = url.split("?")[0];
    const match = clean.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (!match) return null;
    return { bucket: match[1], path: match[2] };
  } catch { return null; }
}

async function deleteStorageUrls(urls = []) {
  const byBucket = {};
  for (const url of urls) {
    const parsed = parseStorageUrl(url);
    if (!parsed) continue;
    (byBucket[parsed.bucket] = byBucket[parsed.bucket] || []).push(parsed.path);
  }
  await Promise.allSettled(
    Object.entries(byBucket).map(([bucket, paths]) =>
      supabase.storage.from(bucket).remove(paths)
    )
  );
}

async function deleteRoomStorageFiles(room) {
  const urls = [
    room.thumbnail,
    ...(room.images      || []),
    ...(room.spec_images || []),
    ...(room.files       || []).map(f => f?.url),
    ...(room.resources   || []).map(f => f?.url),
  ].filter(Boolean);
  await deleteStorageUrls(urls);
}

function findOrphanedUrls(savedForm, currentForm) {
  const collect = f => [
    f.thumbnail,
    ...(f.images      || []),
    ...(f.spec_images || []),
    ...(f.files       || []).map(fi => fi?.url),
    ...(f.resources   || []).map(fi => fi?.url),
  ].filter(Boolean).filter(url => parseStorageUrl(url) !== null);
  const savedSet   = new Set(collect(savedForm));
  const currentSet = new Set(collect(currentForm));
  return [...savedSet].filter(url => !currentSet.has(url));
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  };
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

function Toast({ toasts, remove }) {
  const icons = { error: "fa-circle-xmark", success: "fa-circle-check", info: "fa-circle-info", warning: "fa-triangle-exclamation" };
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`fa-solid ${icons[t.type]}`} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button className="toast-close" onClick={() => remove(t.id)}></button>
        </div>
      ))}
    </div>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Btn({ loading, label, onClick, type = "button", variant = "primary", icon, size, style: extra = {}, disabled }) {
  const cls = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : ""].filter(Boolean).join(" ");
  return (
    <button type={type} disabled={loading || disabled} onClick={onClick} className={cls} style={extra}>
      {loading
        ? <i className="fa-solid fa-spinner" style={{ animation: "spin 1s linear infinite" }} />
        : icon && <i className={`fa-solid ${icon}`} style={{ fontSize: "0.85em" }} />
      }
      {label}
    </button>
  );
}

function IconBtn({ icon, onClick, title, danger }) {
  return (
    <button type="button" onClick={onClick} title={title} className={`icon-btn${danger ? " danger" : ""}`}>
      <i className={`fa-solid ${icon}`} />
    </button>
  );
}

function Modal({ open, onClose, title, children, wide, actions }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${wide ? " modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {actions && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              {actions}
            </div>
          )}
          <button className="modal-close-btn" onClick={onClose}></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = "Delete" }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="confirm-msg">{message}</p>
      <div className="confirm-actions">
        <Btn label="Cancel" variant="ghost" onClick={onClose} />
        <Btn label={confirmLabel} variant="danger" onClick={onConfirm} />
      </div>
    </Modal>
  );
}

function SectionLabel({ label }) {
  return <div className="section-label"><span>{label}</span></div>;
}

function Field({ label, type = "text", value, onChange, placeholder, required, helper, disabled, step }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      {label && (
        <label className="form-label">
          {label}{required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <input
        type={type} value={value} onChange={onChange} step={step}
        placeholder={placeholder} required={required} disabled={disabled}
        className="form-input"
      />
      {helper && <p className="form-helper">{helper}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options = [], required }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      {label && (
        <label className="form-label">
          {label}{required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <select value={value} onChange={onChange} className="form-select">
        <option value="">— Select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange, helper }) {
  return (
    <div className="toggle-row">
      <div className={`toggle-track${checked ? " on" : ""}`} onClick={() => onChange(!checked)}>
        <div className="toggle-thumb" />
      </div>
      <div>
        {label && <div className="toggle-label">{label}</div>}
        {helper && <div className="toggle-helper">{helper}</div>}
      </div>
    </div>
  );
}

function PillInput({ label, value = [], onChange, placeholder, suggestions = [] }) {
  const [input, setInput]     = useState("");
  const [showSug, setShowSug] = useState(false);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)).slice(0, 8);
  const add = v => { const t = v.trim(); if (!t || value.includes(t)) return; onChange([...value, t]); setInput(""); setShowSug(false); };
  const remove = i => onChange(value.filter((_, idx) => idx !== i));
  const handleKey = e => {
    if (e.key === "Enter")    { e.preventDefault(); add(input); }
    if (e.key === "Backspace" && !input && value.length) remove(value.length - 1);
    if (e.key === "Escape")   setShowSug(false);
  };
  const handlePaste = e => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain") || "";
    if (!text.trim()) return;
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    const bulletPattern = /^[»•\-*+]\s+/;
    const hasBullets = lines.some(l => bulletPattern.test(l));
    let newItems = hasBullets
      ? lines.map(l => l.replace(bulletPattern, "").trim()).filter(l => l && !value.includes(l))
      : lines.filter(l => l && !value.includes(l));
    if (newItems.length > 0) { onChange([...value, ...newItems]); setInput(""); setShowSug(false); }
  };
  return (
    <div className="form-group" style={{ marginBottom: 0, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        {label && <label className="form-label" style={{ margin: 0 }}>{label}</label>}
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])}
            style={{ fontSize: "0.75rem", padding: "4px 8px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", color: "var(--text-3)", cursor: "pointer" }}>
            <i className="fa-solid fa-trash-can" style={{ marginRight: 4 }} />Clear
          </button>
        )}
      </div>
      <div className="pill-input-wrap" onClick={e => { e.currentTarget.querySelector("input")?.focus(); setShowSug(true); }}>
        {value.map((v, i) => (
          <span key={i} className="pill-item">
            {v}
            <button type="button" onClick={e => { e.stopPropagation(); remove(i); }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </span>
        ))}
        <input
          value={input} onChange={e => { setInput(e.target.value); setShowSug(true); }}
          onKeyDown={handleKey} onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          onPaste={handlePaste}
          placeholder={value.length ? "" : (placeholder || "Type and press Enter...")}
          className="pill-input-field"
        />
      </div>
      {showSug && (filtered.length > 0 || input.trim()) && (
        <div className="pill-suggestions">
          {filtered.map((s, i) => (
            <div key={i} className="pill-suggestion-item" onMouseDown={() => add(s)}>{s}</div>
          ))}
          {input.trim() && !value.includes(input.trim()) && (
            <div className="pill-suggestion-item pill-suggestion-create" onMouseDown={() => add(input)}>
              <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />Create "{input.trim()}"
            </div>
          )}
        </div>
      )}
      <p className="pill-hint">Press Enter to add · Backspace to remove last · paste lists (» • - *)</p>
    </div>
  );
}

// ─── Wood Options Editor ──────────────────────────────────────────────────────
function WoodOptionsEditor({ woodOptions = [], woodOptionsEnabled = [], onChange }) {
  const [input, setInput] = useState("");

  const addWood = () => {
    const t = input.trim();
    if (!t || woodOptions.includes(t)) return;
    onChange([...woodOptions, t], [...woodOptionsEnabled, true]);
    setInput("");
  };

  const removeWood = i => {
    onChange(woodOptions.filter((_, idx) => idx !== i), woodOptionsEnabled.filter((_, idx) => idx !== i));
  };

  const toggleEnabled = i => {
    const updated = [...woodOptionsEnabled];
    updated[i] = !updated[i];
    onChange(woodOptions, updated);
  };

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">Wood Options</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
        {woodOptions.map((wood, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--surface-2)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
            <div className={`toggle-track${woodOptionsEnabled[i] ? " on" : ""}`} style={{ transform: "scale(0.8)" }} onClick={() => toggleEnabled(i)}>
              <div className="toggle-thumb" />
            </div>
            <span style={{ flex: 1, fontSize: "0.82rem", color: woodOptionsEnabled[i] ? "var(--text)" : "var(--text-3)" }}>{wood}</span>
            <button type="button" onClick={() => removeWood(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: "2px 4px" }}>
              <i className="fa-solid fa-xmark" style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addWood(); } }}
          placeholder="e.g. Nordic Spruce, Hemlock, Cedar..."
          className="form-input" style={{ flex: 1 }}
        />
        <button type="button" onClick={addWood} className="btn btn-primary btn-sm">
          <i className="fa-solid fa-plus" />
        </button>
      </div>
      <p className="form-helper">Toggle to enable/disable each wood option for customers</p>
    </div>
  );
}

// ─── JSON Editor (for configurations, door_options, spec_table, feature_tabs) ─
function JsonEditor({ label, value, onChange, placeholder, helper, rows = 6 }) {
  const [text, setText] = useState(() => {
    if (!value) return "";
    try { return JSON.stringify(value, null, 2); } catch { return ""; }
  });
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const str = value ? JSON.stringify(value, null, 2) : "";
      setText(str);
    } catch { /* ignore */ }
  }, []); // eslint-disable-line

  const handleChange = e => {
    const raw = e.target.value;
    setText(raw);
    if (!raw.trim()) { setError(""); onChange(null); return; }
    try {
      const parsed = JSON.parse(raw);
      setError("");
      onChange(parsed);
    } catch (err) {
      setError("Invalid JSON: " + err.message);
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      {label && <label className="form-label">{label}</label>}
      <textarea
        value={text} onChange={handleChange} rows={rows}
        placeholder={placeholder || '{\n  "key": "value"\n}'}
        className="form-textarea"
        style={{ fontFamily: "monospace", fontSize: "0.8rem" }}
      />
      {error && <p style={{ color: "var(--danger)", fontSize: "0.72rem", marginTop: 4 }}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }} />{error}</p>}
      {helper && !error && <p className="form-helper">{helper}</p>}
    </div>
  );
}

// ─── RichField (simple textarea + html mode) ──────────────────────────────────
function RichField({ label, value, onChange, rows = 6 }) {
  const [mode, setMode] = useState("text");
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <div className="rich-field-header">
        {label && <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>}
        <div className="rich-field-modes">
          {["text", "html"].map(m => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`rich-field-mode-btn${mode === m ? " active" : ""}`}>{m}</button>
          ))}
        </div>
      </div>
      <textarea
        value={value} onChange={onChange} rows={rows}
        placeholder={mode === "html" ? "<p>Enter HTML here...</p>" : "Enter description..."}
        className="form-textarea"
        style={{ fontFamily: mode === "html" ? "monospace" : "var(--font)", marginTop: 4 }}
      />
    </div>
  );
}

// ─── Image Uploaders ──────────────────────────────────────────────────────────
function ThumbnailUploader({ onUpload, uploading }) {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const ref = useRef(); const divRef = useRef();
  const handleFiles = files => { const file = files instanceof FileList ? files[0] : Array.isArray(files) ? files[0] : files; if (file) onUpload(file); };
  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items; if (!items) return;
    for (let item of items) { if (item.kind === "file" && item.type.startsWith("image/")) { const f = item.getAsFile(); if (f) { e.preventDefault(); handleFiles(f); return; } } }
  };
  return (
    <div ref={divRef}
      className={`thumb-upload-zone${dragging ? " dragging" : ""}${uploading ? " disabled" : ""}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onPaste={handlePaste}
      onMouseEnter={() => { setHovering(true); divRef.current?.focus(); }}
      onMouseLeave={() => setHovering(false)}
      onClick={() => !uploading && ref.current?.click()}
      tabIndex="0" style={{ outline: "none" }}
    >
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) { handleFiles(e.target.files[0]); e.target.value = ""; } }} />
      {uploading ? (
        <><i className="fa-solid fa-spinner" style={{ color: "var(--brand)", fontSize: "1.8rem", animation: "spin 1s linear infinite" }} /><span style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>Converting &amp; uploading…</span></>
      ) : (
        <><div className="thumb-upload-icon"><i className="fa-solid fa-image" /></div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", margin: "0 0 4px" }}>Add Featured Image</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0 0 6px" }}>Click or drag &amp; drop · auto-converted to WebP</p>
            {hovering && <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>Hover to paste · Ctrl+V</p>}
          </div>
        </>
      )}
    </div>
  );
}

function ThumbnailPreview({ url, onRemove, onReplace, uploading }) {
  const [hovered, setHovered] = useState(false);
  const replaceRef = useRef(); const containerRef = useRef();
  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items; if (!items) return;
    for (let item of items) { if (item.kind === "file" && item.type.startsWith("image/")) { const f = item.getAsFile(); if (f) { e.preventDefault(); onReplace(f); return; } } }
  };
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
      <div ref={containerRef} style={{ position: "relative", display: "inline-block", outline: "none", cursor: !uploading ? "pointer" : "default" }}
        onMouseEnter={() => { setHovered(true); containerRef.current?.focus(); }}
        onMouseLeave={() => setHovered(false)}
        onPaste={handlePaste}
        onClick={() => !uploading && replaceRef.current?.click()}
        tabIndex="0"
      >
        <img src={url} alt="Thumbnail" style={{ display: "block", maxHeight: 220, maxWidth: "100%", borderRadius: "var(--r)", objectFit: "contain", opacity: uploading ? 0.5 : hovered ? 0.8 : 1, transition: "opacity 0.18s" }} />
        {hovered && !uploading && (
          <>
            <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", zIndex: 10 }}>
              <i className="fa-solid fa-xmark" />
            </button>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "8px 16px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(3px)", whiteSpace: "nowrap", pointerEvents: "none" }}>
              <i className="fa-solid fa-arrow-up-from-bracket" style={{ fontSize: "0.72rem" }} />Replace
            </div>
          </>
        )}
        <input ref={replaceRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { if (e.target.files[0]) { onReplace(e.target.files[0]); e.target.value = ""; } }} />
      </div>
    </div>
  );
}

function ImageUploader({ onUpload, label = "Upload Images", multiple = false, uploading = false }) {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const ref = useRef(); const divRef = useRef();
  const handleFiles = files => { if (!files?.length) return; onUpload(multiple ? Array.from(files) : files[0]); };
  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items; if (!items) return;
    const files = [];
    for (let item of items) { if (item.kind === "file" && item.type.startsWith("image/")) { const f = item.getAsFile(); if (f) files.push(f); } }
    if (files.length > 0) { e.preventDefault(); handleFiles(files); }
  };
  return (
    <div ref={divRef}
      className={`img-upload-zone${dragging ? " dragging" : ""}${uploading ? " disabled" : ""}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onPaste={handlePaste}
      onMouseEnter={() => { setHovering(true); divRef.current?.focus(); }}
      onMouseLeave={() => setHovering(false)}
      onClick={() => !uploading && ref.current?.click()}
      tabIndex="0" style={{ outline: "none" }}
    >
      <input ref={ref} type="file" accept="image/*" multiple={multiple} style={{ display: "none" }}
        onChange={e => handleFiles(multiple ? e.target.files : e.target.files[0])} />
      {uploading
        ? <><i className="fa-solid fa-spinner" style={{ color: "var(--brand)", fontSize: "1.8rem", animation: "spin 1s linear infinite" }} /><span style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>Converting &amp; uploading…</span></>
        : <><div className="thumb-upload-icon"><i className={`fa-solid ${multiple ? "fa-images" : "fa-image"}`} /></div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", margin: "0 0 4px" }}>{label}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0 0 6px" }}>Click or drag &amp; drop · auto-converted to WebP</p>
              {hovering && <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>Hover to paste · Ctrl+V</p>}
            </div>
          </>
      }
    </div>
  );
}

function AddMoreImagesButton({ label, uploading, onChange }) {
  const ref = useRef(); const divRef = useRef();
  const [hovering, setHovering] = useState(false);
  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items; if (!items) return;
    const files = [];
    for (let item of items) { if (item.kind === "file" && item.type.startsWith("image/")) { const f = item.getAsFile(); if (f) files.push(f); } }
    if (files.length > 0) { e.preventDefault(); onChange?.({ target: { files } }); }
  };
  return (
    <div ref={divRef} className={`add-more-label${uploading ? " uploading" : ""}`}
      onPaste={handlePaste}
      onMouseEnter={() => { setHovering(true); divRef.current?.focus(); }}
      onMouseLeave={() => setHovering(false)}
      onClick={() => !uploading && ref.current?.click()}
      tabIndex="0" contentEditable={hovering && !uploading} suppressContentEditableWarning
      style={{ outline: "none", cursor: uploading ? "default" : "pointer" }}
    >
      <i className="fa-solid fa-plus" />
      {uploading ? "Converting & uploading…" : label}
      {hovering && !uploading && <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>Hover to paste · Ctrl+V</p>}
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }} disabled={uploading} onChange={onChange} />
    </div>
  );
}

function ImageStrip({ images = [], onRemove }) {
  if (!images.length) return null;
  return (
    <div className="image-strip">
      {images.map((url, i) => (
        <div key={i} className="image-strip-item">
          <img src={url} alt="" />
          {onRemove && (
            <button type="button" className="image-strip-remove" onClick={() => onRemove(i)}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PDF / File Uploader ──────────────────────────────────────────────────────
function PdfUploader({ onUploadFile, onAddUrl, uploading = false }) {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const fileInputRef = useRef(); const divRef = useRef();
  const handleFiles = async files => { for (const f of Array.from(files || [])) await onUploadFile(f); };
  const handlePaste = async e => {
    if (uploading) return;
    const items = e.clipboardData?.items; if (!items) return;
    for (let item of items) {
      if (item.kind === "file") { const f = item.getAsFile(); if (f) { e.preventDefault(); await handleFiles([f]); return; } }
    }
    const text = e.clipboardData.getData("text/plain")?.trim();
    if (text && (text.startsWith("http://") || text.startsWith("https://"))) { e.preventDefault(); await onAddUrl(text); }
  };
  return (
    <div ref={divRef}
      className={`pdf-upload-zone${dragging ? " dragging" : ""}${uploading ? " disabled" : ""}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onPaste={handlePaste}
      onMouseEnter={() => { setHovering(true); divRef.current?.focus(); }}
      onMouseLeave={() => { setHovering(false); divRef.current?.blur(); }}
      onClick={() => !uploading && fileInputRef.current?.click()}
      contentEditable={hovering && !uploading} suppressContentEditableWarning
      tabIndex="0" style={{ outline: "none" }}
    >
      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)} disabled={uploading} />
      {uploading
        ? <><i className="fa-solid fa-spinner" style={{ color: "var(--brand)", fontSize: "1.2rem", animation: "spin 1s linear infinite" }} /><p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "5px 0 0" }}>Uploading…</p></>
        : <><i className="fa-solid fa-file-pdf" style={{ color: "var(--brand)", fontSize: "1.2rem" }} />
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "5px 0 0" }}>Upload PDFs / Resources</p>
            {hovering && <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>Hover &amp; Ctrl+V to paste a link or file</p>}
          </>
      }
    </div>
  );
}

function FileRow({ file, index, onRemove, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(file.name);
  return (
    <div className="file-row">
      <div className="file-row-icon"><i className="fa-solid fa-file-pdf" /></div>
      <div className="file-row-info">
        {editing
          ? <input value={name} onChange={e => setName(e.target.value)} autoFocus className="file-row-input"
              onBlur={() => { onRename(index, name); setEditing(false); }}
              onKeyDown={e => { if (e.key === "Enter") { onRename(index, name); setEditing(false); } }} />
          : <div className="file-row-name">{file.name}</div>
        }
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-row-url">
          {file.url ? file.url.split("/").pop() : ""}
        </a>
      </div>
      <button type="button" onClick={() => setEditing(true)} title="Rename" className="file-row-btn file-row-edit"><i className="fa-solid fa-pen" /></button>
      <button type="button" onClick={() => onRemove(index)} title="Remove" className="file-row-btn file-row-trash"><i className="fa-solid fa-trash" /></button>
    </div>
  );
}

// ─── Unsaved Guard ─────────────────────────────────────────────────────────────
function UnsavedConfirm({ open, onStay, onDiscard }) {
  if (!open) return null;
  return (
    <div className="unsaved-overlay">
      <div className="unsaved-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div className="unsaved-icon"><i className="fa-solid fa-triangle-exclamation" style={{ color: "#e6a817", fontSize: "1rem" }} /></div>
          <h3 style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--text)", margin: 0 }}>Unsaved Changes</h3>
        </div>
        <p style={{ fontSize: "0.83rem", color: "var(--text-2)", margin: "0 0 20px", lineHeight: 1.6 }}>You have unsaved changes. If you leave now your progress will be lost.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn label="Stay & Keep Editing" variant="ghost" onClick={onStay} />
          <Btn label="Discard" variant="danger" icon="fa-trash" onClick={onDiscard} />
        </div>
      </div>
    </div>
  );
}

// ─── Audit Strip ──────────────────────────────────────────────────────────────
function RoomAuditStrip({ room }) {
  const fmt = d => d ? new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
  const created = fmt(room?.created_at), updated = fmt(room?.updated_at);
  const createdBy = room?.created_by_username, updatedBy = room?.updated_by_username;
  if (!created && !updated) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: "13px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: "0.76rem", color: "var(--text-3)", lineHeight: 1.7 }}>
      {created && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className="fa-solid fa-circle-plus" style={{ color: "#22c55e", fontSize: "0.82rem" }} />
          <span><span style={{ fontWeight: 600, color: "var(--text-2)" }}>Created</span>{createdBy && <> by <span style={{ fontWeight: 700, color: "var(--text)" }}>@{createdBy}</span></>}<span style={{ marginLeft: 5, color: "var(--text-3)" }}>· {created}</span></span>
        </div>
      )}
      {updated && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className="fa-solid fa-pen-to-square" style={{ color: "var(--brand)", fontSize: "0.82rem" }} />
          <span><span style={{ fontWeight: 600, color: "var(--text-2)" }}>Last updated</span>{updatedBy && <> by <span style={{ fontWeight: 700, color: "var(--text)" }}>@{updatedBy}</span></>}<span style={{ marginLeft: 5, color: "var(--text-3)" }}>· {updated}</span></span>
        </div>
      )}
    </div>
  );
}

// ─── Room Card (Grid view) ────────────────────────────────────────────────────
function RoomCard({ room, onEdit, onDelete, onDuplicate, perms, dataSource }) {
  const [hovered, setHovered]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    if (!menuOpen) return;
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const roomUrl = `${FRONT_URL || window.location.origin}/sauna/rooms/${room.slug}`;
  const showMenu = hovered && (perms.can("sauna_rooms.edit") || perms.can("sauna_rooms.duplicate") || perms.can("sauna_rooms.delete"));

  return (
    <a href={roomUrl} target="_blank" rel="noopener noreferrer"
      className="product-grid-card"
      style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
    >
      <div className="product-grid-thumb">
        {getRoomImageUrl(room, "thumbnail", dataSource)
          ? <img src={getRoomImageUrl(room, "thumbnail", dataSource)} alt={room.name} />
          : <i className="fa-regular fa-image" style={{ fontSize: "1.5rem", color: "var(--border)" }} />
        }
        {showMenu && (
          <div className="product-grid-options" ref={menuRef} onClick={e => e.preventDefault()}>
            <button type="button" className="product-grid-opts-btn"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(m => !m); }}>
              <i className="fa-solid fa-ellipsis-vertical" />
            </button>
            {menuOpen && (
              <div className="product-grid-menu">
                {perms.can("sauna_rooms.edit") && (
                  <button type="button" onClick={e => { e.preventDefault(); setMenuOpen(false); onEdit(room); }}>
                    <i className="fa-solid fa-pen" /> Edit
                  </button>
                )}
                {perms.can("sauna_rooms.duplicate") && (
                  <button type="button" onClick={e => { e.preventDefault(); setMenuOpen(false); onDuplicate(room); }}>
                    <i className="fa-solid fa-copy" /> Duplicate
                  </button>
                )}
                {perms.can("sauna_rooms.delete") && (
                  <button type="button" className="danger" onClick={e => { e.preventDefault(); setMenuOpen(false); onDelete(room); }}>
                    <i className="fa-solid fa-trash" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="product-grid-info">
        <div className="product-grid-name">{room.name}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 2 }}>
          {[room.room_type, room.model_code].filter(Boolean).join(" · ")}
        </div>
        {(room.categories || []).length > 0 && (
          <div className="product-grid-pills">
            {(room.categories || []).slice(0, 2).map(c => <span key={c} className="tbl-pill tbl-pill-cat">{c}</span>)}
          </div>
        )}
        {(room.tags || []).length > 0 && (
          <div className="product-grid-pills">
            {(room.tags || []).slice(0, 3).map(t => <span key={t} className="tbl-pill tbl-pill-tag">{t}</span>)}
            {(room.tags || []).length > 3 && <span className="tbl-pill tbl-pill-more">+{room.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </a>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SaunaRooms({ currentUser }) {
  const perms = getPerms(currentUser);
  const { toasts, add, remove } = useToast();
  const { rooms: localRooms, loading: localLoading } = useLocalSaunaRooms();

  const [rooms,      setRooms]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [allCats,    setAllCats]    = useState([]);
  const [allTags,    setAllTags]    = useState([]);
  const [dataSource, setDataSource] = useState("local");

  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [sortDir,      setSortDir]      = useState("desc");
  const [viewMode,     setViewMode]     = useState("list");

  const [selected,    setSelected]    = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [editingFull, setEditingFull] = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [savedForm,   setSavedForm]   = useState(EMPTY_FORM);
  const [slugEdited,  setSlugEdited]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("basic");

  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const pendingClose = useRef(null);

  const [confirmDel, setConfirmDel] = useState(null);

  const [upThumb, setUpThumb] = useState(false);
  const [upImgs,  setUpImgs]  = useState(false);
  const [upSpec,  setUpSpec]  = useState(false);
  const [upFile,  setUpFile]  = useState(false);

  const [modalMenuOpen, setModalMenuOpen] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions,     setRevisions]     = useState([]);
  const [realtimeActive, setRealtimeActive] = useState(true);

  const [checkSyncOpen,    setCheckSyncOpen]    = useState(false);
  const [syncCheckLoading, setSyncCheckLoading] = useState(false);
  const [syncCheckReport,  setSyncCheckReport]  = useState(null);
  const [syncCheckEvents,  setSyncCheckEvents]  = useState([]);
  const [syncCheckApplying, setSyncCheckApplying] = useState(false);

  const isDirty = !formsEqual(form, savedForm);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      if (dataSource === "local") {
        let data = localRooms;
        if (filterStatus) data = data.filter(r => r.status === filterStatus);
        if (filterType)   data = data.filter(r => r.room_type === filterType);
        data = [...data].sort((a, b) => {
          const at = new Date(a.created_at).getTime(), bt = new Date(b.created_at).getTime();
          return sortDir === "asc" ? at - bt : bt - at;
        });
        setRooms(data);
        setSelected(new Set());
        return;
      }

      let query = supabase
        .from("sauna_rooms")
        .select("*")
        .eq("is_deleted", false);
      if (filterStatus) query = query.eq("status", filterStatus);
      if (filterType)   query = query.eq("room_type", filterType);
      query = query.order("created_at", { ascending: sortDir === "asc" });
      const { data, error } = await query;
      if (error) throw error;

      let processed = (data || []).map(room => {
        const fixed = { ...room };
        if (Array.isArray(fixed.wood_options_enabled)) {
          fixed.wood_options_enabled = fixed.wood_options_enabled.map(v =>
            v === 'true' ? true : v === 'false' ? false : v
          );
        }
        const jsonFields = { configurations: {}, door_options: [], feature_tabs: [], resources: [], files: [], spec_table: null };
        for (const [f, fallback] of Object.entries(jsonFields)) {
          if (typeof fixed[f] === 'string') { try { fixed[f] = JSON.parse(fixed[f]); } catch { fixed[f] = fallback; } }
        }
        return fixed;
      });

      if (search) {
        const q = search.toLowerCase();
        processed = processed.filter(r =>
          r.name?.toLowerCase().includes(q) ||
          r.slug?.toLowerCase().includes(q) ||
          r.model_code?.toLowerCase().includes(q) ||
          r.room_type?.toLowerCase().includes(q)
        );
      }

      setRooms(processed);
      setSelected(new Set());
    } catch (err) { add(err.message, "error"); }
    finally { setLoading(false); }
  }, [dataSource, localRooms, filterStatus, filterType, sortDir, search]); // eslint-disable-line

  const fetchMeta = useCallback(async () => {
    try {
      if (dataSource === "local") {
        const cats = new Set(), tags = new Set();
        localRooms.forEach(r => {
          (r.categories || []).forEach(c => cats.add(c));
          (r.tags       || []).forEach(t => tags.add(t));
        });
        setAllCats([...cats].sort());
        setAllTags([...tags].sort());
        return;
      }
      const { data: roomsMeta } = await supabase.from("sauna_rooms").select("categories, tags").eq("is_deleted", false);
      const cats = new Set(), tags = new Set();
      (roomsMeta || []).forEach(r => {
        (r.categories || []).forEach(c => cats.add(c));
        (r.tags       || []).forEach(t => tags.add(t));
      });
      setAllCats([...cats].sort());
      setAllTags([...tags].sort());
    } catch (err) { console.error("fetchMeta:", err); }
  }, [dataSource, localRooms]); // eslint-disable-line

  useEffect(() => {
    if (dataSource === "live" || (dataSource === "local" && !localLoading)) {
      fetchRooms();
      fetchMeta();
    }
  }, [fetchRooms, fetchMeta, dataSource, localLoading]); // eslint-disable-line

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    console.log("[DEBUG] Setting up real-time subscription...");
    const subscription = supabase
      .channel("sauna_rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sauna_rooms",
        },
        (payload) => {
          console.log("[DEBUG] Real-time event received:", payload.eventType, payload);

          // Fix data types
          const fixRoomData = (room) => {
            const fixed = { ...room };
            if (Array.isArray(fixed.wood_options_enabled)) {
              fixed.wood_options_enabled = fixed.wood_options_enabled.map(v =>
                v === 'true' ? true : v === 'false' ? false : v
              );
            }
            if (typeof fixed.configurations === 'string') {
              try {
                fixed.configurations = JSON.parse(fixed.configurations);
              } catch (e) {
                fixed.configurations = {};
              }
            }
            if (typeof fixed.door_options === 'string') {
              try {
                fixed.door_options = JSON.parse(fixed.door_options);
              } catch (e) {
                fixed.door_options = [];
              }
            }
            return fixed;
          };

          // Apply current filters and search to the new/updated data
          const passesFilters = (room) => {
            if (room.is_deleted) return false;
            if (filterStatus && room.status !== filterStatus) return false;
            if (filterType && room.room_type !== filterType) return false;
            if (search) {
              const q = search.toLowerCase();
              return (
                room.name?.toLowerCase().includes(q) ||
                room.slug?.toLowerCase().includes(q) ||
                room.model_code?.toLowerCase().includes(q) ||
                room.room_type?.toLowerCase().includes(q)
              );
            }
            return true;
          };

          if (payload.eventType === "INSERT") {
            const fixed = fixRoomData(payload.new);
            if (passesFilters(fixed)) {
              setRooms(prev => {
                const exists = prev.some(r => r.id === fixed.id);
                return exists ? prev : [fixed, ...prev];
              });
            }
            fetchMeta();
          } else if (payload.eventType === "UPDATE") {
            const fixed = fixRoomData(payload.new);
            setRooms(prev => {
              if (passesFilters(fixed)) {
                // Include the updated room
                const exists = prev.some(r => r.id === fixed.id);
                if (exists) {
                  return prev.map(r => r.id === fixed.id ? fixed : r);
                } else {
                  return [fixed, ...prev];
                }
              } else {
                // Filter out the room if it no longer matches
                return prev.filter(r => r.id !== fixed.id);
              }
            });
            fetchMeta();
          } else if (payload.eventType === "DELETE") {
            setRooms(prev => prev.filter(r => r.id !== payload.old.id));
            fetchMeta();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filterStatus, filterType, search, fetchMeta]);

  useEffect(() => { if (!perms.can("sauna_rooms.edit")) setViewMode("grid"); }, []); // eslint-disable-line

  // ── Revisions ──────────────────────────────────────────────────────────────
  const fetchRevisions = async id => {
    try {
      const { data, error } = await supabase
        .from("activity_logs").select("*")
        .eq("entity_id", id).eq("entity", "sauna_room")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRevisions(data || []);
    } catch { setRevisions([]); }
  };

  // ── Sync from Supabase ─────────────────────────────────────────────────────
  const handleCheckSync = async () => {
    setSyncCheckLoading(true);
    setSyncCheckReport(null);
    setSyncCheckEvents([{ phase: "start", message: "Comparing Supabase with local files..." }]);
    try {
      const report = await checkSaunaRoomsSync((event) => {
        setSyncCheckEvents(prev => [...prev, event]);
      });
      setSyncCheckReport(report);
      if (report.totalChanges === 0) {
        add("✓ Local files are in sync with Supabase!", "success");
      } else {
        add(`Found ${report.totalChanges} changes to review.`, "info");
      }
    } catch (err) {
      const msg = `Sync check failed: ${err.message}`;
      setSyncCheckEvents(prev => [...prev, { phase: "error", message: msg }]);
      add(msg, "error");
    } finally {
      setSyncCheckLoading(false);
    }
  };

  const handleApplySyncChanges = async () => {
    if (!syncCheckReport) return;
    setSyncCheckApplying(true);
    try {
      const result = await applyLocalRoomChanges(syncCheckReport, (event) => {
        setSyncCheckEvents(prev => [...prev, event]);
      });
      if (result.success && result.changes) {
        add("Sauna rooms synced to local files.", "success");
      }
    } catch (err) {
      add(`Failed to apply changes: ${err.message}`, "error");
    } finally {
      setSyncCheckApplying(false);
    }
  };

  // ── Image / File Uploads ───────────────────────────────────────────────────
  const handleThumbUpload = async file => {
    setUpThumb(true);
    try {
      if (form.thumbnail) await deleteStorageUrls([form.thumbnail]).catch(console.warn);
      const url = await uploadFileToSupabase(file, "saunaroom-images");
      setForm(f => ({ ...f, thumbnail: url }));
      add("Thumbnail uploaded.", "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpThumb(false); }
  };

  const uploadMoreImages = async files => {
    setUpImgs(true);
    try {
      const arr  = Array.isArray(files) ? files : [files];
      const urls = await Promise.all(arr.map(f => uploadFileToSupabase(f, "saunaroom-images")));
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      add(`${urls.length} image(s) uploaded.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpImgs(false); }
  };

  const uploadSpecImages = async files => {
    setUpSpec(true);
    try {
      const arr  = Array.isArray(files) ? files : [files];
      const urls = await Promise.all(arr.map(f => uploadFileToSupabase(f, "saunaroom-images")));
      setForm(f => ({ ...f, spec_images: [...f.spec_images, ...urls] }));
      add(`${urls.length} spec image(s) uploaded.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpSpec(false); }
  };

  const handleFileUpload = async file => {
    setUpFile(true);
    try {
      const url  = await uploadFileToSupabase(file, "sauna-pdf");
      const rawName = file.name.replace(/\.pdf$/i, "");
      const displayName = rawName.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      setForm(f => ({ ...f, files: [...f.files, { name: displayName, url }] }));
      add("File uploaded.", "success");
    } catch (err) { add("Upload failed: " + err.message, "error"); }
    finally { setUpFile(false); }
  };

  const handleAddFileUrl = async url => {
    const fileName = url.split("/").pop().replace(/\.pdf$/i, "");
    const displayName = fileName.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    setForm(f => ({ ...f, files: [...f.files, { name: displayName, url }] }));
    add("File link added.", "success");
  };

  const renameFile = (i, name) => setForm(f => ({ ...f, files: f.files.map((fi, idx) => idx === i ? { ...fi, name } : fi) }));

  const removeFile = i => {
    const file = form.files[i];
    if (file?.url) deleteStorageUrls([file.url]).catch(console.warn);
    setForm(f => ({ ...f, files: f.files.filter((_, idx) => idx !== i) }));
  };

  const removeImageFile = (field, index) => {
    const url = form[field][index];
    if (url) deleteStorageUrls([url]).catch(console.warn);
    setForm(f => ({ ...f, [field]: f[field].filter((_, idx) => idx !== index) }));
  };

  // ── Modal guard ────────────────────────────────────────────────────────────
  const actualClose = () => {
    setModalOpen(false); setEditing(null); setEditingFull(null);
    setShowRevisions(false); setModalMenuOpen(false);
    setUnsavedOpen(false); setActiveTab("basic");
    pendingClose.current = null;
  };
  const handleModalClose = () => { if (isDirty) { pendingClose.current = actualClose; setUnsavedOpen(true); } else actualClose(); };
  const handleUnsavedStay    = () => { setUnsavedOpen(false); pendingClose.current = null; };
  const handleUnsavedDiscard = () => actualClose();

  // ── Open create / edit / duplicate ────────────────────────────────────────
  const openCreate = () => {
    setEditing(null); setEditingFull(null);
    setForm({ ...EMPTY_FORM }); setSavedForm({ ...EMPTY_FORM });
    setSlugEdited(false); setActiveTab("basic"); setModalOpen(true);
  };

  const loadRoomIntoForm = data => ({
    name:              data.name              || "",
    slug:              data.slug              || "",
    short_description: data.short_description || "",
    description:       data.description       || "",
    thumbnail:         data.thumbnail         || "",
    sku:               data.sku               || "",
    room_type:         data.room_type         || "traditional",
    model_code:        data.model_code        || "",
    size_category:     data.size_category     || "",
    width_m:           data.width_m           ?? "",
    depth_m:           data.depth_m           ?? "",
    height_m:          data.height_m          ?? "",
    capacity_label:    data.capacity_label    || "",
    capacity_min:      data.capacity_min      ?? "",
    capacity_max:      data.capacity_max      ?? "",
    wood_options:          data.wood_options          || [],
    wood_options_enabled:  data.wood_options_enabled  || [],
    configurations:    data.configurations    || {},
    door_options:      data.door_options      || [],
    side_order:        data.side_order        || [],
    ir_panel_wattage_w:  data.ir_panel_wattage_w  ?? "",
    ir_total_power_w:    data.ir_total_power_w    ?? "",
    ir_voltage_v:        data.ir_voltage_v        ?? 230,
    ir_session_time_min: data.ir_session_time_min ?? "",
    features:       data.features       || [],
    feature_tabs:   data.feature_tabs   || [],
    spec_table:     data.spec_table     || null,
    images:         data.images         || [],
    spec_images:    data.spec_images    || [],
    resources:      data.resources      || [],
    files:          data.files          || [],
    tags:           data.tags           || [],
    categories:     data.categories     || [],
    status:         data.status         || "draft",
    visible:        data.visible        !== false,
    featured:       data.featured       || false,
    is_best_seller: data.is_best_seller || false,
    has_door_filter:data.has_door_filter !== false,
    sort_order:     data.sort_order     || 0,
  });

  const openEdit = async row => {
    try {
      const { data, error } = await supabase.from("sauna_rooms").select("*").eq("id", row.id).single();
      if (error) throw error;
      const loaded = loadRoomIntoForm(data);
      setForm(loaded); setSavedForm(loaded);
      setSlugEdited(true); setEditing(row); setEditingFull(data);
      setShowRevisions(false); setModalMenuOpen(false); setActiveTab("basic");
      setModalOpen(true);
    } catch (err) { add(err.message, "error"); }
  };

  const openDuplicate = async row => {
    try {
      const { data, error } = await supabase.from("sauna_rooms").select("*").eq("id", row.id).single();
      if (error) throw error;
      const loaded = loadRoomIntoForm(data);
      loaded.name       = `${loaded.name} (Copy)`;
      loaded.slug       = `${loaded.slug}-copy`;
      loaded.model_code = `${loaded.model_code}-copy`;
      loaded.status     = "draft";
      loaded.featured   = false;
      loaded.is_best_seller = false;
      setForm(loaded); setSavedForm(EMPTY_FORM);
      setSlugEdited(false); setEditing(null); setEditingFull(null);
      setShowRevisions(false); setModalMenuOpen(false); setActiveTab("basic");
      setModalOpen(true);
      add("Duplicated! Update the slug and model code before saving.", "info");
    } catch (err) { add(err.message, "error"); }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async e => {
    e.preventDefault();
    if (!form.name)       return add("Room name is required.", "error");
    if (!form.slug)       return add("Slug is required.", "error");
    if (!form.room_type)  return add("Room type is required.", "error");
    if (!form.model_code) return add("Model code is required.", "error");
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        name:              form.name.trim(),
        slug:              form.slug.trim(),
        short_description: form.short_description.trim() || null,
        description:       form.description.trim()       || null,
        thumbnail:         form.thumbnail                || null,
        sku:               form.sku.trim()               || null,
        room_type:         form.room_type,
        model_code:        form.model_code.trim(),
        size_category:     form.size_category            || null,
        width_m:           form.width_m  !== "" ? parseFloat(form.width_m)  : null,
        depth_m:           form.depth_m  !== "" ? parseFloat(form.depth_m)  : null,
        height_m:          form.height_m !== "" ? parseFloat(form.height_m) : null,
        capacity_label:    form.capacity_label           || null,
        capacity_min:      form.capacity_min !== "" ? parseInt(form.capacity_min) : null,
        capacity_max:      form.capacity_max !== "" ? parseInt(form.capacity_max) : null,
        wood_options:          form.wood_options,
        wood_options_enabled:  form.wood_options_enabled,
        configurations:    form.configurations,
        door_options:      form.door_options,
        side_order:        form.side_order,
        ir_panel_wattage_w:  form.ir_panel_wattage_w  !== "" ? parseInt(form.ir_panel_wattage_w)  : null,
        ir_total_power_w:    form.ir_total_power_w    !== "" ? parseInt(form.ir_total_power_w)    : null,
        ir_voltage_v:        form.ir_voltage_v        !== "" ? parseInt(form.ir_voltage_v)        : 230,
        ir_session_time_min: form.ir_session_time_min !== "" ? parseInt(form.ir_session_time_min) : null,
        features:       form.features,
        feature_tabs:   form.feature_tabs,
        spec_table:     form.spec_table,
        images:         form.images,
        spec_images:    form.spec_images,
        resources:      form.resources,
        files:          form.files,
        tags:           form.tags,
        categories:     form.categories,
        status:         form.status,
        visible:        form.visible,
        featured:       form.featured,
        is_best_seller: form.is_best_seller,
        has_door_filter:form.has_door_filter,
        sort_order:     form.sort_order,
        updated_at:             now,
        updated_by_username:    currentUser?.username || null,
        ...(editing ? {} : { created_by_username: currentUser?.username || null }),
      };

      if (editing) {
        const { error } = await supabase.from("sauna_rooms").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logActivity({ action: "update", entity: "sauna_room", entity_id: editing.id, entity_name: form.name.trim(), username: currentUser?.username, user_id: currentUser?.id });
        const orphans = findOrphanedUrls(savedForm, form);
        if (orphans.length) {
          await deleteStorageUrls(orphans).catch(console.warn);
          add(`Cleaned up ${orphans.length} removed file(s).`, "success");
        }
      } else {
        const { data: inserted, error } = await supabase.from("sauna_rooms").insert([payload]).select("id").single();
        if (error) throw error;
        await logActivity({ action: "create", entity: "sauna_room", entity_id: inserted?.id, entity_name: form.name.trim(), username: currentUser?.username, user_id: currentUser?.id });
      }

      add(editing ? "Sauna room saved." : "Sauna room created.", "success");
      actualClose(); fetchRooms(); fetchMeta();
    } catch (err) { add(err.message, "error"); }
    finally { setSaving(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const target = confirmDel; setConfirmDel(null);
    try {
      const { data: full } = await supabase.from("sauna_rooms").select("*").eq("id", target.id).single();
      const { error } = await supabase.from("sauna_rooms").update({ is_deleted: true }).eq("id", target.id);
      if (error) throw error;
      if (full) await deleteRoomStorageFiles(full);
      await logActivity({ action: "delete", entity: "sauna_room", entity_id: target.id, entity_name: target.name, username: currentUser?.username, user_id: currentUser?.id });
      add("Sauna room deleted.", "success");
    } catch (err) { add(err.message, "error"); }
    finally { fetchRooms(); }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const ids = Array.from(selected); setBulkConfirm(false);
    try {
      const { data: fullRooms } = await supabase.from("sauna_rooms").select("*").in("id", ids);
      const { error } = await supabase.from("sauna_rooms").update({ is_deleted: true }).in("id", ids);
      if (error) throw error;
      await Promise.allSettled((fullRooms || []).map(r => deleteRoomStorageFiles(r)));
      await Promise.allSettled((fullRooms || []).map(r =>
        logActivity({ action: "delete", entity: "sauna_room", entity_id: r.id, entity_name: r.name, username: currentUser?.username, user_id: currentUser?.id, meta: { bulk: true } })
      ));
      add(`${ids.length} room(s) deleted.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setSelected(new Set()); fetchRooms(); }
  };

  const toggleSelect = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => { if (selected.size === filtered.length) setSelected(new Set()); else setSelected(new Set(filtered.map(r => r.id))); };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = rooms.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.slug?.toLowerCase().includes(q) ||
      r.model_code?.toLowerCase().includes(q) ||
      r.room_type?.toLowerCase().includes(q) ||
      r.sku?.toLowerCase().includes(q) ||
      (r.categories || []).some(c => c.toLowerCase().includes(q)) ||
      (r.tags       || []).some(t => t.toLowerCase().includes(q))
    );
  });

  const handleNameChange = e => {
    const name = e.target.value;
    setForm(f => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }));
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "-";

  const isIR = form.room_type === "infrared";

  // ── Form Tabs ──────────────────────────────────────────────────────────────
  const TABS = [
    { id: "basic",     label: "Basic Info",    icon: "fa-circle-info" },
    { id: "specs",     label: "Specs",         icon: "fa-ruler-combined" },
    { id: "media",     label: "Media",         icon: "fa-images" },
    { id: "content",   label: "Content",       icon: "fa-align-left" },
    { id: "config",    label: "Config",        icon: "fa-sliders" },
    { id: "taxonomy",  label: "Taxonomy",      icon: "fa-tags" },
    { id: "settings",  label: "Settings",      icon: "fa-gear" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="products-page">
      <Toast toasts={toasts} remove={remove} />
      <UnsavedConfirm open={unsavedOpen} onStay={handleUnsavedStay} onDiscard={handleUnsavedDiscard} />

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-fire-flame-curved" style={{ marginRight: "0.5rem", color: "var(--brand)" }} />
            Sauna Rooms
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 0, borderRadius: 4, border: "1px solid var(--border)" }}>
              {[
                { id: "live",  label: "Live",  icon: "fa-cloud" },
                { id: "local", label: "Local", icon: "fa-folder" },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDataSource(tab.id)}
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    border: "none",
                    background: dataSource === tab.id ? "var(--brand-bg)" : "transparent",
                    color: dataSource === tab.id ? "var(--brand)" : "var(--text-2)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: dataSource === tab.id ? 600 : 500,
                    borderRight: tab.id === "live" ? "1px solid var(--border)" : "none",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <i className={`fa-solid ${tab.icon}`} style={{ fontSize: "0.9em" }} />
                  {tab.label}
                </button>
              ))}
            </div>
            {dataSource === "local" && (
              <button
                type="button"
                onClick={() => { setCheckSyncOpen(true); handleCheckSync(); }}
                disabled={syncCheckLoading}
                title="Syncs sauna rooms from Supabase to local — compares added, updated, and deleted items, then lets you apply the changes"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: syncCheckLoading ? "var(--text-3)" : "var(--text)",
                  cursor: syncCheckLoading ? "not-allowed" : "pointer",
                  borderRadius: 4,
                  transition: "all 0.2s ease",
                  opacity: syncCheckLoading ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!syncCheckLoading) e.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; }}
              >
                <i className={`fa-solid ${syncCheckLoading ? "fa-circle-notch fa-spin" : "fa-arrows-rotate"}`} style={{ fontSize: "0.85em" }} />
                {syncCheckLoading ? "Syncing..." : "Sync"}
              </button>
            )}
            <p className="products-subtitle" style={{ margin: 0 }}>
              {(loading || (dataSource === "local" && localLoading)) ? "Loading..." : `${filtered.length} of ${rooms.length} rooms`}
            </p>
          </div>
        </div>
      </div>

      {/* Local Mode Notice */}
      {dataSource === "local" && (
        <div style={{
          background: "var(--info-bg)",
          border: "1px solid var(--info-border)",
          color: "var(--info)",
          padding: "10px 14px",
          borderRadius: 4,
          marginBottom: 14,
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <i className="fa-solid fa-circle-info" style={{ fontSize: "1em" }} />
          <span>Viewing <strong>locally saved sauna rooms</strong> — this is read-only. Switch to Live to edit.</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, model, tag..." />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="filter-select" value={sortDir} onChange={e => setSortDir(e.target.value)}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <div className="view-toggle">
          {[{ mode: "list", icon: "fa-list" }, { mode: "grid", icon: "fa-grip" }].map(({ mode, icon }) => (
            <button key={mode} type="button" onClick={() => setViewMode(mode)}
              className={`view-toggle-btn${viewMode === mode ? " active" : ""}`}>
              <i className={`fa-solid ${icon}`} />
            </button>
          ))}
        </div>
        {perms.can("sauna_rooms.bulk_delete") && dataSource === "live" && selected.size > 0 && (
          <button type="button" className="btn btn-sm"
            style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)", gap: 5 }}
            onClick={() => setBulkConfirm(true)}>
            <i className="fa-solid fa-trash" /> Delete {selected.size}
          </button>
        )}
        {perms.can("sauna_rooms.create") && dataSource === "live" && (
          <Btn icon="fa-plus" label="New Room" onClick={openCreate} style={{ marginLeft: "auto" }} />
        )}
      </div>

      {/* Grid View */}
      {!loading && viewMode === "grid" && (
        <div className="product-grid">
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text-3)", fontStyle: "italic", fontSize: "0.82rem" }}>
              {search ? `No rooms match "${search}"` : "No sauna rooms yet — click New Room to create one."}
            </div>
          )}
          {filtered.map(r => (
            <RoomCard key={r.id} room={r} onEdit={openEdit} onDelete={setConfirmDel} onDuplicate={openDuplicate} perms={perms} dataSource={dataSource} />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="products-table-wrap">
          {loading ? (
            <div className="table-loading"><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading...</div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  {perms.can("sauna_rooms.bulk_delete") && dataSource === "live" && (
                    <th style={{ width: 36, paddingRight: 0 }}>
                      <input type="checkbox" className="tbl-checkbox"
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        onChange={toggleSelectAll} />
                    </th>
                  )}
                  <th style={{ width: 44 }}></th>
                  <th>Room</th>
                  <th>Type / Model</th>
                  <th>Size / Capacity</th>
                  <th>Status</th>
                  <th style={{ width: 100 }}>Created</th>
                  <th style={{ width: 110 }}>Created By</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={perms.can("sauna_rooms.bulk_delete") && dataSource === "live" ? 9 : 8} className="table-empty">
                    {search
                      ? `No rooms match "${search}"`
                      : dataSource === "local"
                        ? "No locally saved rooms yet — sync from Supabase to populate."
                        : "No sauna rooms yet — click New Room to create one."}
                  </td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} className={selected.has(r.id) ? "row-selected" : ""}>
                    {perms.can("sauna_rooms.bulk_delete") && dataSource === "live" && (
                      <td style={{ paddingRight: 0 }}>
                        <input type="checkbox" className="tbl-checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                      </td>
                    )}
                    <td style={{ width: 44 }}>
                      {getRoomImageUrl(r, "thumbnail", dataSource)
                        ? <img src={getRoomImageUrl(r, "thumbnail", dataSource)} alt="" className="product-thumb" />
                        : <div className="product-thumb-placeholder"><i className="fa-regular fa-image" /></div>
                      }
                    </td>
                    <td>
                      <a href={`${FRONT_URL}/sauna/rooms/${r.slug}`} target="_blank" rel="noopener noreferrer" className="product-name-link">{r.name}</a>
                      <div className="product-meta">
                        {r.sku && <span className="product-meta-tag"><i className="fa-solid fa-barcode" style={{ marginRight: 3 }} />{r.sku}</span>}
                        {r.featured      && <span className="product-meta-tag featured"><i className="fa-solid fa-star" style={{ marginRight: 3 }} />Featured</span>}
                        {r.is_best_seller && <span className="product-meta-tag" style={{ background: "rgba(245,158,11,0.1)", color: "#b45309" }}><i className="fa-solid fa-fire" style={{ marginRight: 3 }} />Best Seller</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem" }}>{ROOM_TYPES.find(t => t.value === r.room_type)?.label || r.room_type}</div>
                      {r.model_code && <div style={{ fontSize: "0.72rem", color: "var(--text-3)", fontFamily: "monospace" }}>{r.model_code}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem" }}>{SIZE_CATEGORIES.find(s => s.value === r.size_category)?.label || r.size_category || "-"}</div>
                      {r.capacity_label && <div style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>{r.capacity_label}</div>}
                    </td>
                    <td>
                      <span className="tbl-status">{!r.visible ? "Hidden" : r.status === "published" ? "Published" : "Draft"}</span>
                    </td>
                    <td className="tbl-date" style={{ fontSize: "0.75rem" }}>{formatDate(r.created_at)}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{r.created_by_username ? `@${r.created_by_username}` : "-"}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions">
                        {perms.can("sauna_rooms.edit")      && dataSource === "live" && <IconBtn icon="fa-pen"   title="Edit"      onClick={() => openEdit(r)} />}
                        {perms.can("sauna_rooms.duplicate") && dataSource === "live" && <IconBtn icon="fa-copy"  title="Duplicate" onClick={() => openDuplicate(r)} />}
                        {perms.can("sauna_rooms.delete")    && dataSource === "live" && <IconBtn icon="fa-trash" title="Delete"    onClick={() => setConfirmDel(r)} danger />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Room Form Modal ── */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        title={editing ? `Edit: ${editing.name}` : "New Sauna Room"}
        wide
        actions={(
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="submit" form="room-form" disabled={saving}
              style={{ padding: "6px 12px", fontSize: "0.8rem", fontWeight: 500, background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--r-sm)", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
              <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`} />
              {editing ? "Save Changes" : "Create Room"}
            </button>
            {editing && (
              <div style={{ position: "relative" }}>
                <button type="button" onClick={e => { e.stopPropagation(); setModalMenuOpen(m => !m); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontSize: "1rem", color: "var(--text-2)", borderRadius: "var(--r-sm)" }}>
                  <i className="fa-solid fa-ellipsis-vertical" />
                </button>
                {modalMenuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "4px 0", minWidth: 150, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 1100 }}>
                    <button type="button"
                      onClick={() => { setShowRevisions(true); setModalMenuOpen(false); fetchRevisions(editing.id); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.8rem", color: "var(--text)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <i className="fa-solid fa-clock-rotate-left" style={{ color: "var(--brand)", fontSize: "0.75rem" }} />Revisions
                    </button>
                    <button type="button"
                      onClick={() => { setModalMenuOpen(false); setConfirmDel(editing); handleModalClose(); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.8rem", color: "var(--danger)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <i className="fa-solid fa-trash" style={{ fontSize: "0.75rem" }} />Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      >
        {showRevisions && editing ? (
          <div>
            <button type="button" onClick={() => setShowRevisions(false)}
              style={{ marginBottom: 16, padding: "8px 12px", background: "none", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer", fontSize: "0.78rem", color: "var(--text-2)" }}>
              <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />Back
            </button>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 12 }}>Revisions</h3>
            {revisions.length === 0
              ? <div style={{ textAlign: "center", padding: "16px", color: "var(--text-3)", fontSize: "0.75rem" }}>No revisions recorded yet</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {revisions.map(rev => (
                    <div key={rev.id} style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: "4px", fontSize: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {rev.action === "create" && <i className="fa-solid fa-plus" style={{ color: "#22c55e", fontSize: "0.7rem" }} />}
                          {rev.action === "update" && <i className="fa-solid fa-pen" style={{ color: "var(--brand)", fontSize: "0.7rem" }} />}
                          {rev.action === "delete" && <i className="fa-solid fa-trash" style={{ color: "#ef4444", fontSize: "0.7rem" }} />}
                          <span style={{ fontWeight: 500 }}>{rev.action === "create" ? "Created" : rev.action === "update" ? "Updated" : "Deleted"}</span>
                        </div>
                        <span style={{ color: "var(--text-3)" }}>{new Date(rev.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div style={{ color: "var(--text-2)", fontSize: "0.7rem" }}>@{rev.username || "unknown"}</div>
                    </div>
                  ))}
                </div>
            }
          </div>
        ) : (
          <>
            {isDirty && (
              <div className="dirty-banner">
                <i className="fa-solid fa-circle-dot" style={{ fontSize: "0.6rem" }} />
                You have unsaved changes
              </div>
            )}

            {/* Tab Nav */}
            <div style={{ display: "flex", gap: 0, marginBottom: 18, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
              {TABS.map(tab => (
                <button key={tab.id} type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 14px", border: "none", background: "none",
                    borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent",
                    color: activeTab === tab.id ? "var(--brand)" : "var(--text-2)",
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap",
                    marginBottom: -1, transition: "all 0.15s",
                  }}>
                  <i className={`fa-solid ${tab.icon}`} style={{ fontSize: "0.75em" }} />
                  {tab.label}
                </button>
              ))}
            </div>

            <form id="room-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── TAB: Basic Info ── */}
              {activeTab === "basic" && (
                <>
                  <SectionLabel label="Featured Image" />
                  {form.thumbnail
                    ? <ThumbnailPreview url={form.thumbnail} onRemove={() => { deleteStorageUrls([form.thumbnail]).catch(console.warn); setForm(f => ({ ...f, thumbnail: "" })); }} onReplace={handleThumbUpload} uploading={upThumb} />
                    : <ThumbnailUploader onUpload={handleThumbUpload} uploading={upThumb} />
                  }

                  <SectionLabel label="Identity" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Room Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Fjord 4-Person Traditional" required />
                    <Field label="Slug" value={form.slug}
                      onChange={e => { setSlugEdited(true); setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })); }}
                      placeholder="fjord-4-person-traditional" required helper="Auto-generated · URL-safe" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <SelectField label="Room Type" value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))} options={ROOM_TYPES} required />
                    <Field label="Model Code" value={form.model_code} onChange={e => setForm(f => ({ ...f, model_code: e.target.value }))} placeholder="e.g. FJORD-4T" required helper="Must be unique per type" />
                    <Field label="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. SR-FJORD-4T" />
                  </div>

                  <SectionLabel label="Short Description" />
                  <RichField value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} rows={3} />
                </>
              )}

              {/* ── TAB: Specs ── */}
              {activeTab === "specs" && (
                <>
                  <SectionLabel label="Size & Dimensions" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <SelectField label="Size Category" value={form.size_category} onChange={e => setForm(f => ({ ...f, size_category: e.target.value }))} options={SIZE_CATEGORIES} />
                    <Field label="Capacity Label" value={form.capacity_label} onChange={e => setForm(f => ({ ...f, capacity_label: e.target.value }))} placeholder="e.g. 2–4 persons" helper="Display label shown to customers" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
                    <Field label="Width (m)" type="number" step="0.01" value={form.width_m} onChange={e => setForm(f => ({ ...f, width_m: e.target.value }))} placeholder="1.20" />
                    <Field label="Depth (m)" type="number" step="0.01" value={form.depth_m} onChange={e => setForm(f => ({ ...f, depth_m: e.target.value }))} placeholder="1.00" />
                    <Field label="Height (m)" type="number" step="0.01" value={form.height_m} onChange={e => setForm(f => ({ ...f, height_m: e.target.value }))} placeholder="2.10" />
                    <Field label="Min Persons" type="number" value={form.capacity_min} onChange={e => setForm(f => ({ ...f, capacity_min: e.target.value }))} placeholder="1" />
                    <Field label="Max Persons" type="number" value={form.capacity_max} onChange={e => setForm(f => ({ ...f, capacity_max: e.target.value }))} placeholder="4" />
                  </div>

                  {isIR && (
                    <>
                      <SectionLabel label="Infrared Specs" />
                      <div style={{ background: "var(--surface-2)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--r)", padding: "14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                        <Field label="Panel Wattage (W)" type="number" value={form.ir_panel_wattage_w} onChange={e => setForm(f => ({ ...f, ir_panel_wattage_w: e.target.value }))} placeholder="300" />
                        <Field label="Total Power (W)" type="number" value={form.ir_total_power_w} onChange={e => setForm(f => ({ ...f, ir_total_power_w: e.target.value }))} placeholder="1800" />
                        <Field label="Voltage (V)" type="number" value={form.ir_voltage_v} onChange={e => setForm(f => ({ ...f, ir_voltage_v: e.target.value }))} placeholder="230" />
                        <Field label="Session Time (min)" type="number" value={form.ir_session_time_min} onChange={e => setForm(f => ({ ...f, ir_session_time_min: e.target.value }))} placeholder="30" />
                      </div>
                    </>
                  )}

                  <SectionLabel label="Spec Table (JSON)" />
                  <JsonEditor
                    value={form.spec_table}
                    onChange={v => setForm(f => ({ ...f, spec_table: v }))}
                    placeholder={'{\n  "rows": [\n    { "label": "Heater Type", "value": "Electric" }\n  ]\n}'}
                    helper='Structured spec table rendered on the product page. Use { "rows": [ { "label": "...", "value": "..." } ] }'
                    rows={8}
                  />
                </>
              )}

              {/* ── TAB: Media ── */}
              {activeTab === "media" && (
                <>
                  <SectionLabel label="Gallery Images" />
                  {form.images.length > 0 ? (
                    <>
                      <ImageStrip images={form.images} onRemove={i => removeImageFile("images", i)} />
                      <AddMoreImagesButton label="Add More Images" uploading={upImgs}
                        onChange={e => e.target.files?.length && uploadMoreImages(Array.from(e.target.files))} />
                    </>
                  ) : (
                    <ImageUploader onUpload={uploadMoreImages} label="Add Gallery Images" multiple uploading={upImgs} />
                  )}

                  <SectionLabel label="Spec / Diagram Images" />
                  {form.spec_images.length > 0 ? (
                    <>
                      <ImageStrip images={form.spec_images} onRemove={i => removeImageFile("spec_images", i)} />
                      <AddMoreImagesButton label="Add More Spec Images" uploading={upSpec}
                        onChange={e => e.target.files?.length && uploadSpecImages(Array.from(e.target.files))} />
                    </>
                  ) : (
                    <ImageUploader onUpload={uploadSpecImages} label="Add Spec / Diagram Images" multiple uploading={upSpec} />
                  )}

                  <SectionLabel label="Files / Resources (PDFs)" />
                  {form.files.length > 0 ? (
                    <div className="file-rows">
                      {form.files.map((file, i) => <FileRow key={i} file={file} index={i} onRemove={removeFile} onRename={renameFile} />)}
                    </div>
                  ) : null}
                  <PdfUploader onUploadFile={handleFileUpload} onAddUrl={handleAddFileUrl} uploading={upFile} />
                </>
              )}

              {/* ── TAB: Content ── */}
              {activeTab === "content" && (
                <>
                  <SectionLabel label="Full Description / Specifications" />
                  <RichField value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={10} />

                  <SectionLabel label="Features" />
                  <PillInput label="Key Features" value={form.features} onChange={v => setForm(f => ({ ...f, features: v }))}
                    placeholder="e.g. Harvia heater included, FSC-certified wood" />

                  <SectionLabel label="Feature Tabs (JSON)" />
                  <JsonEditor
                    value={form.feature_tabs}
                    onChange={v => setForm(f => ({ ...f, feature_tabs: v }))}
                    placeholder={'[\n  {\n    "title": "Materials",\n    "content": "<p>Premium Nordic wood...</p>"\n  }\n]'}
                    helper="Array of { title, content } tabs rendered on the room detail page"
                    rows={8}
                  />
                </>
              )}

              {/* ── TAB: Config ── */}
              {activeTab === "config" && (
                <>
                  <SectionLabel label="Wood Options" />
                  <WoodOptionsEditor
                    woodOptions={form.wood_options}
                    woodOptionsEnabled={form.wood_options_enabled}
                    onChange={(opts, enabled) => setForm(f => ({ ...f, wood_options: opts, wood_options_enabled: enabled }))}
                  />

                  <SectionLabel label="Bench Configurations (JSON)" />
                  <JsonEditor
                    value={form.configurations}
                    onChange={v => setForm(f => ({ ...f, configurations: v }))}
                    placeholder={'{\n  "L-bench": {\n    "label": "L-shaped Bench",\n    "images": ["/img/config-l.webp"]\n  }\n}'}
                    helper="Keyed object of bench configuration variants with images and labels"
                    rows={10}
                  />

                  <SectionLabel label="Door Options (JSON)" />
                  <JsonEditor
                    value={form.door_options}
                    onChange={v => setForm(f => ({ ...f, door_options: v }))}
                    placeholder={'[\n  {\n    "id": "glass-clear",\n    "label": "Clear Glass",\n    "image": "/img/door-clear.webp"\n  }\n]'}
                    helper="Array of door option variants available for this room"
                    rows={8}
                  />

                  <SectionLabel label="Side Order" />
                  <PillInput label="Side Order" value={form.side_order} onChange={v => setForm(f => ({ ...f, side_order: v }))}
                    placeholder="e.g. left, right, back..." />
                  <p className="form-helper" style={{ marginTop: -8 }}>Defines the order of sides/panels for layout rendering</p>
                </>
              )}

              {/* ── TAB: Taxonomy ── */}
              {activeTab === "taxonomy" && (
                <>
                  <SectionLabel label="Categories & Tags" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <PillInput label="Categories" value={form.categories} onChange={v => setForm(f => ({ ...f, categories: v }))}
                      placeholder="e.g. Indoor, Outdoor, Barrel" suggestions={allCats} />
                    <PillInput label="Tags" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))}
                      placeholder="e.g. 4-person, hemlock, infrared" suggestions={allTags} />
                  </div>
                </>
              )}

              {/* ── TAB: Settings ── */}
              {activeTab === "settings" && (
                <>
                  <SectionLabel label="Status & Visibility" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "start" }}>
                    <SelectField label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      options={[{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }]} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 20 }}>
                      <Toggle label="Visible"        checked={form.visible}         onChange={v => setForm(f => ({ ...f, visible: v }))}        helper="Show on website" />
                      <Toggle label="Featured"       checked={form.featured}        onChange={v => setForm(f => ({ ...f, featured: v }))} />
                      <Toggle label="Best Seller"    checked={form.is_best_seller}  onChange={v => setForm(f => ({ ...f, is_best_seller: v }))} />
                      <Toggle label="Door Filter"    checked={form.has_door_filter} onChange={v => setForm(f => ({ ...f, has_door_filter: v }))} helper="Enable door option filter on listing" />
                    </div>
                    <Field label="Sort Order" type="number" value={String(form.sort_order)}
                      onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                      helper="Lower = shown first" />
                  </div>

                  {editing && editingFull && (
                    <>
                      <SectionLabel label="Record Info" />
                      <RoomAuditStrip room={editingFull} />
                    </>
                  )}

                  {!editing && currentUser && (
                    <div className="created-by-notice">
                      <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6 }} />
                      Will be created by <strong>@{currentUser.username}</strong>
                    </div>
                  )}
                </>
              )}

            </form>
          </>
        )}
      </Modal>

      {/* Bulk delete confirm */}
      <Confirm open={bulkConfirm} onClose={() => setBulkConfirm(false)} onConfirm={handleBulkDelete}
        title="Delete Selected?"
        message={`Delete ${selected.size} selected room(s)? This cannot be undone. All associated images and files will also be removed.`}
        confirmLabel="Delete All" />

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete Sauna Room?"
        message={`Delete "${confirmDel?.name}"? This cannot be undone. All associated images and files will also be removed.`}
        confirmLabel="Delete" />

      <CheckRoomsSyncModal
        open={checkSyncOpen}
        loading={syncCheckLoading}
        report={syncCheckReport}
        events={syncCheckEvents}
        onClose={() => { setCheckSyncOpen(false); setSyncCheckEvents([]); setSyncCheckReport(null); }}
        onApply={handleApplySyncChanges}
        applying={syncCheckApplying}
      />
    </div>
  );
}

function CheckRoomsSyncModal({ open, loading, report, events, onClose, onApply, applying }) {
  const [expandedId, setExpandedId] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  useEffect(() => {
    const lastEvent = events[events.length - 1];
    const wasApplied = !applying && !loading && report?.totalChanges > 0
      && events.some(e => e.phase === "applying") && lastEvent?.phase === "complete";
    if (wasApplied) {
      const t = setTimeout(onClose, 1800);
      return () => clearTimeout(t);
    }
  }, [applying, loading, report, events, onClose]);

  if (!open) return null;

  const lastEvent = events[events.length - 1];
  const isError   = lastEvent?.phase === "error";
  const hasChanges = report && report.totalChanges > 0;

  // ── Check phase ──────────────────────────────────────────────────────────────
  const checkSteps = [
    { key: "fetching",  label: "Fetch Supabase data", icon: "fa-cloud-arrow-down" },
    { key: "loading",   label: "Load local file",     icon: "fa-folder-open" },
    { key: "cmp_rooms", label: "Compare rooms",       icon: "fa-fire-flame-curved" },
    { key: "complete",  label: "Analysis complete",   icon: "fa-circle-check" },
  ];
  const checkOrder = ["fetching", "loading", "cmp_rooms", "complete"];
  const checkPct   = { fetching: 20, loading: 45, cmp_rooms: 75, complete: 100 };

  const normCheckEvts = events.map(ev => {
    if (ev.phase === "comparing") return "cmp_rooms";
    return ev.phase;
  });
  let curCheckKey = "";
  for (const k of checkOrder.slice().reverse()) {
    if (normCheckEvts.includes(k)) { curCheckKey = k; break; }
  }
  if (isError && !applying) curCheckKey = "error";
  const checkProgress = checkPct[curCheckKey] || 5;
  const checkStepStatus = key => {
    const ki = checkOrder.indexOf(key), ci = checkOrder.indexOf(curCheckKey);
    if (isError && !applying && ki === ci) return "error";
    if (ki < ci) return "done";
    if (ki === ci) return "active";
    return "pending";
  };

  // ── Apply phase ──────────────────────────────────────────────────────────────
  const applySteps = [
    { key: "applying",  label: "Process changes",   icon: "fa-gears" },
    { key: "writing",   label: "Send to backend",   icon: "fa-upload" },
    { key: "start",     label: "Initialize",        icon: "fa-play" },
    { key: "clone",     label: "Clone repository",  icon: "fa-code-branch" },
    { key: "write",     label: "Write files",       icon: "fa-file-pen" },
    { key: "git",       label: "Commit & push",     icon: "fa-code-commit" },
    { key: "complete",  label: "Complete",          icon: "fa-circle-check" },
  ];
  const applyOrder = ["applying", "writing", "start", "clone", "write", "git", "complete"];
  const applyPct   = { applying: 10, writing: 26, start: 38, clone: 55, write: 73, git: 88, complete: 100 };

  const applyStartIdx   = events.findIndex(e => e.phase === "applying");
  const applyEvts       = applyStartIdx >= 0 ? events.slice(applyStartIdx) : [];
  const applyPhasesSeen = applyEvts.map(e => e.phase);
  let curApplyKey = "";
  for (const k of applyOrder.slice().reverse()) {
    if (applyPhasesSeen.includes(k)) { curApplyKey = k; break; }
  }
  if (isError && applyEvts.length > 0) curApplyKey = "error";
  const applyProgress   = applyPct[curApplyKey] || 5;
  const applyStepStatus = key => {
    const ki = applyOrder.indexOf(key), ci = applyOrder.indexOf(curApplyKey);
    if (isError && applyEvts.some(e => e.phase === "error") && ki === ci) return "error";
    if (ki < ci) return "done";
    if (ki === ci) return "active";
    return "pending";
  };

  const wasApplied = !applying && !loading && applyEvts.length > 0 && lastEvent?.phase === "complete";

  const renderProgressBar = (pct, err) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>Progress</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: err ? "var(--danger)" : "var(--brand)" }}>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: err ? "var(--danger)" : "var(--brand)",
          borderRadius: 4, transition: "width 0.65s cubic-bezier(0.4,0,0.2,1)",
          position: "relative", overflow: "hidden",
        }}>
          {!err && pct > 0 && pct < 100 && (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.28) 50%,transparent 100%)", backgroundSize: "200% 100%", animation: "csmShimmer 1.6s infinite linear" }} />
          )}
        </div>
      </div>
    </div>
  );

  const renderSteps = (steps, getStatus, activeMsg) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
      {steps.map(step => {
        const st = getStatus(step.key);
        const done = st === "done", active = st === "active", err = st === "error";
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem",
              background: done ? "var(--brand)" : err ? "var(--danger)" : active ? "var(--surface)" : "var(--surface-2)",
              border: `2px solid ${done ? "var(--brand)" : err ? "var(--danger)" : active ? "var(--brand)" : "var(--border)"}`,
              color: done ? "#fff" : err ? "#fff" : active ? "var(--brand)" : "var(--text-3)",
            }}>
              {done ? <i className="fa-solid fa-check" /> : err ? <i className="fa-solid fa-xmark" /> : active ? <i className={`fa-solid ${step.icon} fa-spin`} style={{ animationDuration: "1.2s" }} /> : <i className={`fa-solid ${step.icon}`} />}
            </div>
            <span style={{ fontSize: "0.8rem", color: done ? "var(--text)" : err ? "var(--danger)" : active ? "var(--text)" : "var(--text-3)", fontWeight: active ? 500 : 400 }}>
              {step.label}
              {active && activeMsg && <span style={{ color: "var(--text-3)", fontWeight: 400 }}> — {activeMsg}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );

  const isApplying = applyEvts.length > 0;
  const currentPhaseMsg = lastEvent?.message || "";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget && !loading && !applying) onClose(); }}>
      <style>{`@keyframes csmShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
      <div style={{ background: "var(--surface)", borderRadius: 8, padding: 28, width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              <i className="fa-solid fa-arrows-rotate" style={{ marginRight: 8, color: "var(--brand)" }} />
              Sync Sauna Rooms
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-3)" }}>
              {isApplying ? "Applying changes to local files..." : "Comparing Supabase with local saunaroom-data.json"}
            </p>
          </div>
          {!loading && !applying && (
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-3)", padding: 4 }}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {/* Progress */}
        {isApplying
          ? renderProgressBar(applyProgress, isError && applyEvts.some(e => e.phase === "error"))
          : renderProgressBar(checkProgress, isError && !applying)
        }

        {/* Steps */}
        {!isApplying && renderSteps(checkSteps, checkStepStatus, loading ? currentPhaseMsg : "")}
        {isApplying  && renderSteps(applySteps, applyStepStatus, applying ? currentPhaseMsg : "")}

        {/* Success banner after apply */}
        {wasApplied && (
          <div style={{ padding: "12px 16px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fa-solid fa-circle-check" style={{ color: "#22c55e", fontSize: "1.1rem" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#16a34a" }}>Changes applied successfully!</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2 }}>Local files updated and pushed to GitHub.</div>
            </div>
          </div>
        )}

        {/* Report: no changes */}
        {!loading && !isApplying && report && report.totalChanges === 0 && (
          <div style={{ padding: "12px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fa-solid fa-circle-check" style={{ color: "#22c55e" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#16a34a" }}>Local files are already in sync with Supabase.</span>
          </div>
        )}

        {/* Report: changes found */}
        {!loading && !isApplying && hasChanges && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 10 }}>Changes Found</div>
            {[
              { label: "Rooms", data: report.rooms, icon: "fa-fire-flame-curved" },
            ].map(({ label, data, icon }) => (
              (data.added.length + data.updated.length + data.deleted.length) > 0 && (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: "0.8rem", fontWeight: 600 }}>
                    <i className={`fa-solid ${icon}`} style={{ color: "var(--brand)", fontSize: "0.8em" }} />{label}
                  </div>
                  {[
                    { items: data.added,   color: "#22c55e", label: "Added" },
                    { items: data.updated, color: "var(--brand)", label: "Updated" },
                    { items: data.deleted, color: "var(--danger)", label: "Deleted" },
                  ].map(({ items, color, label: changeLabel }) => items.length > 0 && (
                    <div key={changeLabel} style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: "0.72rem", color, fontWeight: 600, marginBottom: 4 }}>{changeLabel} ({items.length})</div>
                      {items.map(change => (
                        <div key={change.item?.id || change.item?.slug} style={{ marginBottom: 4 }}>
                          <div
                            style={{ fontSize: "0.75rem", padding: "6px 10px", background: "var(--surface-2)", borderRadius: 4, cursor: change.diff ? "pointer" : "default", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onClick={() => change.diff && setExpandedId(expandedId === change.item?.id ? null : change.item?.id)}
                          >
                            <span style={{ fontWeight: 500 }}>{change.item?.name || change.item?.slug || change.item?.id}</span>
                            {change.diff && <i className={`fa-solid fa-chevron-${expandedId === change.item?.id ? "up" : "down"}`} style={{ fontSize: "0.65rem", color: "var(--text-3)" }} />}
                          </div>
                          {change.diff && expandedId === change.item?.id && (
                            <div style={{ padding: "8px 10px", background: "var(--surface-3, var(--surface-2))", borderRadius: "0 0 4px 4px", borderTop: "1px solid var(--border)" }}>
                              {Object.entries(change.diff).map(([field, { supabase: sv, local: lv }]) => (
                                <div key={field} style={{ marginBottom: 6, fontSize: "0.72rem" }}>
                                  <div style={{ fontWeight: 600, color: "var(--text-2)", marginBottom: 2 }}>{field}</div>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ flex: 1, padding: "3px 6px", background: "rgba(34,197,94,0.08)", borderRadius: 3 }}>
                                      <div style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.65rem", marginBottom: 1 }}>SUPABASE</div>
                                      <div style={{ wordBreak: "break-all", color: "var(--text-2)" }}>{JSON.stringify(sv)?.slice(0, 100)}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: "3px 6px", background: "rgba(239,68,68,0.08)", borderRadius: 3 }}>
                                      <div style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.65rem", marginBottom: 1 }}>LOCAL</div>
                                      <div style={{ wordBreak: "break-all", color: "var(--text-2)" }}>{JSON.stringify(lv)?.slice(0, 100)}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
        )}

        {/* Event log */}
        <div ref={logRef} style={{ background: "var(--surface-2)", borderRadius: 4, padding: "10px 12px", maxHeight: 120, overflowY: "auto", marginBottom: 16, fontFamily: "monospace", fontSize: "0.72rem", lineHeight: 1.6 }}>
          {events.map((e, i) => (
            <div key={i} style={{ color: e.phase === "error" ? "var(--danger)" : e.warning ? "#f59e0b" : "var(--text-2)" }}>
              {e.phase === "error" ? "✗" : e.warning ? "⚠" : "›"} {e.message}
            </div>
          ))}
          {(loading || applying) && <div style={{ color: "var(--brand)" }}>›<span style={{ display: "inline-block", animation: "csmShimmer 1s infinite" }}>_</span></div>}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {!loading && !applying && (
            <button type="button" onClick={onClose} style={{ padding: "8px 14px", fontSize: "0.8rem", border: "1px solid var(--border)", background: "var(--surface)", borderRadius: 4, cursor: "pointer", color: "var(--text-2)" }}>
              Close
            </button>
          )}
          {!loading && !isApplying && hasChanges && !wasApplied && (
            <button
              type="button"
              onClick={onApply}
              disabled={applying}
              style={{ padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, border: "none", background: "var(--brand)", color: "#fff", borderRadius: 4, cursor: applying ? "not-allowed" : "pointer", opacity: applying ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}
            >
              <i className={`fa-solid ${applying ? "fa-circle-notch fa-spin" : "fa-download"}`} />
              {applying ? "Applying..." : `Apply ${report.totalChanges} Change${report.totalChanges !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
