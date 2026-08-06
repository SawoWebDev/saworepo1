// src/Administrator/SaunaRoomsCMS.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase, logActivity } from "./supabase";
import { getPerms } from "./permissions";
import { getCache, setCache } from "./adminCache";
import { diffFormFields } from "./diff";
import RevisionFieldDiff from "./RevisionFieldDiff";
import { uploadFileToR2, deleteR2Urls, effectiveSlug } from "./mediaUpload";
import { processPastedTableHTML } from "../utils/cleanTableHTML";

const ROOMS_CACHE_KEY = "admin:sauna-rooms:live";
const ROOMS_META_CACHE_KEY = "admin:sauna-rooms:live:meta";

const FRONT_URL = process.env.REACT_APP_FRONT_URL || "";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoomImageUrl(room, field) {
  return room?.[field] || null;
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in the browser's local time,
// not an ISO/UTC string — converts a stored publish_at back to that shape.
function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Mirrors DispSaunaRoom.jsx's seoDescription fallback exactly, so the admin's
// placeholder preview shows the real inherited value rather than an
// approximation.
function derivedSeoDescription(form) {
  const raw = form.description || "";
  const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return `${form.name || "Sauna room"} by SAWO. A premium Finnish sauna room.`;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

const LONG_TEXT_FIELDS = new Set(["description", "short_description"]);
const SET_ARRAY_FIELDS = new Set(["images", "spec_images", "files", "resources"]);

function diffRoomForms(before, after) {
  return diffFormFields(before, after, Object.keys(EMPTY_FORM), {
    longTextFields: LONG_TEXT_FIELDS, setArrayFields: SET_ARRAY_FIELDS,
  });
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

// Matches the actual room_type values in the data (verified against
// saunaroom-data.json) — "traditional/steam/combo" never existed here and
// meant Standard/Glassfront rooms couldn't be filtered or correctly
// labeled in the admin.
const ROOM_TYPES = [
  { value: "standard",   label: "Standard" },
  { value: "glassfront", label: "Glassfront" },
  { value: "infrared",   label: "Infrared" },
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
  room_type: "standard", model_code: "", size_category: "",
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
  meta_title: "", meta_description: "", og_image: "",
  publish_at: "",
};

// Uploads now go through uploadFileToR2 (./mediaUpload.js), which does its
// own WebP conversion via the same canvas approach.

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

function Modal({ open, onClose, title, children, wide, actions, fixedHeight }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${wide ? " modal-wide" : ""}${fixedHeight ? " modal-fixed-height" : ""}`} onClick={e => e.stopPropagation()}>
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

function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", confirmVariant = "danger" }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="confirm-msg">{message}</p>
      <div className="confirm-actions">
        <Btn label="Cancel" variant="ghost" onClick={onClose} />
        <Btn label={confirmLabel} variant={confirmVariant} onClick={onConfirm} />
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
        <option value="">Select...</option>
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

// ─── Smart Tag Suggestions from Name & Description ───────────────────────────
// Same idea as Products.jsx's TagSuggestions: scans existing tags for ones
// that already appear in this room's own name/description/features, so
// editors have a reference instead of guessing which tags apply.
function TagSuggestions({ name, description, features = [], currentTags, allTags, onAddTags }) {
  const suggestedTags = allTags.filter(tag => {
    if (currentTags.includes(tag)) return false;
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    return pattern.test(name || "") || pattern.test(description || "") || pattern.test((features || []).join(" "));
  });

  if (!suggestedTags.length) return null;

  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid rgba(245,157,11,0.25)",
      borderRadius: "var(--r)", padding: "12px 14px",
      fontSize: "0.78rem", color: "var(--text-2)", lineHeight: 1.7, marginTop: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, fontWeight: 700, color: "var(--text)", fontSize: "0.8rem" }}>
        <i className="fa-solid fa-lightbulb" style={{ color: "#f59d0b" }} />
        Found matching keywords in your content
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        {suggestedTags.map(t => (
          <span key={t} className="suggested-tag-pill" style={{
            fontSize: "0.72rem", fontWeight: 600,
            border: "1px solid rgba(245,157,11,0.3)",
            borderRadius: 4, padding: "3px 8px",
          }}>+ {t}</span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onAddTags(suggestedTags)}
        style={{
          background: "#f59d0b", color: "#fff", border: "none",
          padding: "6px 12px", borderRadius: 4, fontSize: "0.75rem",
          fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#d97706"}
        onMouseLeave={e => e.currentTarget.style.background = "#f59d0b"}
      >
        <i className="fa-solid fa-check" style={{ marginRight: 4 }} />
        Add these tags
      </button>
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

// ─── RichField (WYSIWYG editor + raw HTML source toggle) ──────────────────────
function RichField({ label, value, onChange, rows = 6, onNotify }) {
  const [mode, setMode] = useState("text");
  const textareaRef = useRef(null);
  const editorRef = useRef(null);

  // dangerouslySetInnerHTML on a contentEditable re-applies the HTML on
  // every render, which resets the caret to the start of the element even
  // when the content hasn't actually changed — every keystroke landed back
  // at position 0. Set the DOM imperatively instead, and only when the
  // value actually differs from what's already there (i.e. it changed from
  // outside — switching rooms, or typing in the raw-HTML textarea — not
  // from this element's own onInput echoing straight back).
  useEffect(() => {
    if (editorRef.current && (value || "") !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const cleanPastedHTML = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const comments = temp.querySelectorAll("*");
    comments.forEach(el => {
      if (el.nodeType === 8) el.remove();
    });

    const allElements = temp.querySelectorAll("*");
    allElements.forEach(el => {
      const allowedTags = ["P", "DIV", "BR", "B", "STRONG", "I", "EM", "U", "H1", "H2", "H3", "H4", "H5", "H6", "OL", "UL", "LI", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "SPAN"];

      if (!allowedTags.includes(el.tagName)) {
        const parent = el.parentNode;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      } else {
        const oldStyle = el.getAttribute("style") || "";
        const alignMatch = oldStyle.match(/text-align:\s*(left|center|right|justify)/);

        Array.from(el.attributes).forEach(attr => {
          el.removeAttribute(attr.name);
        });

        if (alignMatch) {
          el.setAttribute("style", `text-align: ${alignMatch[1]};`);
        }
      }
    });

    let result = temp.innerHTML;
    result = result.replace(/&nbsp;/g, " ");
    result = result.replace(/<!--.*?-->/g, "");

    return result;
  };

  const handlePaste = (e) => {
    if (!editorRef.current?.contains(e.target)) return;

    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (!html && !text) return;

    e.preventDefault();

    let contentToInsert = html || text;

    if (/<table/i.test(contentToInsert)) {
      contentToInsert = processPastedTableHTML(contentToInsert);
      if (onNotify) onNotify("✓ Table cleaned and formatted! kW tags will be auto-extracted on Save.", "success");
    } else if (contentToInsert.includes("<")) {
      contentToInsert = cleanPastedHTML(contentToInsert);
    }

    document.execCommand("insertHTML", false, contentToInsert);

    setTimeout(() => {
      if (editorRef.current) {
        onChange({ target: { value: editorRef.current.innerHTML } });
        autoExpandEditor();
      }
    }, 0);
  };

  const execCommand = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      onChange({ target: { value: editorRef.current.innerHTML } });
      autoExpandEditor();
    }
  };

  const autoExpandEditor = () => {
    if (editorRef.current) {
      editorRef.current.style.height = "auto";
      const scrollHeight = editorRef.current.scrollHeight;
      editorRef.current.style.height = Math.max(150, scrollHeight + 4) + "px";
    }
  };

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
      {/* Both stay mounted (CSS-toggled, not conditionally rendered) and share
          the same value/onChange, so editing in either one flows through the
          parent's state and back down to the other automatically — no manual
          sync step needed when switching modes. "Text" is the default and
          shows the rendered view (existing HTML content renders as actual
          formatting, not visible tags); "HTML" shows the raw markup source. */}
      <textarea
        ref={textareaRef}
        value={value} onChange={onChange} rows={rows}
        onPaste={handlePaste}
        placeholder="<p>Enter HTML here...</p>"
        className="form-textarea"
        style={{ fontFamily: "monospace", marginTop: 4, display: mode === "html" ? "block" : "none" }}
      />
      <div style={{ display: mode === "text" ? "block" : "none" }}>
        <div className="rich-field-preview" style={{ marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
            <p className="rich-field-preview-label" style={{ margin: 0 }}>Editor</p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
              <button type="button" onClick={() => execCommand("bold")} title="Bold (Ctrl+B)" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                <i className="fa-solid fa-bold" />
              </button>
              <button type="button" onClick={() => execCommand("italic")} title="Italic (Ctrl+I)" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                <i className="fa-solid fa-italic" />
              </button>
              <button type="button" onClick={() => execCommand("underline")} title="Underline (Ctrl+U)" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                <i className="fa-solid fa-underline" />
              </button>
              <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
              <button type="button" onClick={() => execCommand("justifyLeft")} title="Align Left" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                <i className="fa-solid fa-align-left" />
              </button>
              <button type="button" onClick={() => execCommand("justifyCenter")} title="Align Center" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                <i className="fa-solid fa-align-center" />
              </button>
              <button type="button" onClick={() => execCommand("justifyRight")} title="Align Right" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                <i className="fa-solid fa-align-right" />
              </button>
              <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
              <button type="button" onClick={() => execCommand("insertUnorderedList")} title="Bullet List" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                <i className="fa-solid fa-list-ul" />
              </button>
              <button type="button" onClick={() => execCommand("insertOrderedList")} title="Numbered List" style={{ padding: "4px 8px", fontSize: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                <i className="fa-solid fa-list-ol" />
              </button>
            </div>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorChange}
            onBlur={handleEditorChange}
            onPaste={handlePaste}
            style={{
              padding: 12,
              borderRadius: "var(--r)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              minHeight: 150,
              height: "auto",
              fontFamily: "var(--font)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "var(--text)",
              outline: "none",
              overflowY: "auto",
              resize: "none",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          />
        </div>
      </div>
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
      tabIndex="0"
      contentEditable={hovering && !uploading}
      suppressContentEditableWarning
      style={{ outline: "none" }}
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
        contentEditable={hovered && !uploading}
        suppressContentEditableWarning
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
      tabIndex="0"
      contentEditable={hovering && !uploading}
      suppressContentEditableWarning
      style={{ outline: "none" }}
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

// ─── Room Preview Modal ─────────────────────────────────────────────────────
// Ported from Products.jsx's ProductPreviewModal (see that file for the
// original) — same read-only detail view + Visit URL/Edit footer, adapted
// to the room object's field names. Rooms have no local_-prefixed fields
// (unlike products), so the resolve helpers are simpler.
function previewRoomResolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  return pathOrUrl;
}
function previewRoomImgsArr(room, field) {
  const arr = room?.[field];
  if (!Array.isArray(arr)) return [];
  return arr.map(previewRoomResolveUrl).filter(Boolean);
}
function previewRoomGetFiles(room) {
  return (room?.files || []).map(f => ({ name: f.name, url: f.path ? previewRoomResolveUrl(f.path) : f.url }));
}
function cleanRoomPreviewHTML(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  temp.querySelectorAll("*").forEach(el => el.removeAttribute("style"));
  return temp.innerHTML;
}
function RoomPreviewSectionLabel({ text }) {
  return (
    <h3 style={{
      fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
      fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase",
      color: "#8b5e3c", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6,
    }}>
      {text}
    </h3>
  );
}
function RoomPreviewLightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  const prev = useCallback(() => { setIdx(i => (i - 1 + images.length) % images.length); setScale(1); setOffset({ x: 0, y: 0 }); }, [images.length]);
  const next = useCallback(() => { setIdx(i => (i + 1) % images.length); setScale(1); setOffset({ x: 0, y: 0 }); }, [images.length]);

  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, prev, next]);

  const handleWheel = e => { e.preventDefault(); setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 1), 4)); };
  const handleMouseDown = e => { if (scale <= 1) return; setDragging(true); dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; };
  const handleMouseMove = e => { if (!dragging || !dragStart.current) return; setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const handleMouseUp = () => setDragging(false);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 20000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className="fa-solid fa-xmark" />
      </button>
      {images.length > 1 && (
        <div style={{ position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.12)", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, fontFamily: "'Montserrat',sans-serif" }}>
          {idx + 1} / {images.length}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "4px 14px", borderRadius: 20, fontSize: "0.65rem", fontFamily: "'Montserrat',sans-serif", pointerEvents: "none" }}>
        Scroll to zoom · Drag to pan · Esc to close
      </div>
      {images.length > 1 && (
        <>
          {[{ fn: prev, side: "left", icon: "fa-chevron-left" }, { fn: next, side: "right", icon: "fa-chevron-right" }].map(({ fn, side, icon }) => (
            <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{ position: "absolute", [side]: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", zIndex: 10 }}>
              <i className={`fa-solid ${icon}`} />
            </button>
          ))}
        </>
      )}
      <div onClick={e => e.stopPropagation()} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ maxWidth: "88vw", maxHeight: "88vh", cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default", userSelect: "none" }}>
        <img src={images[idx]} alt="" style={{ maxWidth: "88vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 10, transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`, transition: dragging ? "none" : "transform 0.15s ease", display: "block" }} />
      </div>
      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
          {images.map((url, i) => (
            <button key={i} onClick={() => { setIdx(i); setScale(1); setOffset({ x: 0, y: 0 }); }} style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", border: `2px solid ${i === idx ? "#a67853" : "rgba(255,255,255,0.25)"}`, background: "rgba(0,0,0,0.4)", cursor: "pointer", padding: 0 }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function RoomPreviewCarousel({ images, thumbnail, onImageClick }) {
  const all = [...(thumbnail ? [thumbnail] : []), ...(images || []).filter(u => u !== thumbnail)].filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState({});

  if (!all.length) return (
    <div style={{ width: "100%", aspectRatio: "1/1", background: "#faf7f4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #edddd0" }}>
      <i className="fa-regular fa-image" style={{ fontSize: "3.5rem", color: "#d5b99a" }} />
    </div>
  );

  const prev = () => setIdx(i => (i - 1 + all.length) % all.length);
  const next = () => setIdx(i => (i + 1) % all.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-in" }} onClick={() => onImageClick(all, idx)}>
        {!err[idx] && (
          <img key={idx} src={all[idx]} alt="" onError={() => setErr(e => ({ ...e, [idx]: true }))} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", width: "100%", height: "100%" }} />
        )}
        {err[idx] && <i className="fa-regular fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />}
        {all.length > 1 && (
          <>
            {[{ fn: prev, side: "left", icon: "fa-chevron-left" }, { fn: next, side: "right", icon: "fa-chevron-right" }].map(({ fn, side, icon }) => (
              <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{ position: "absolute", [side]: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#a67853" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#8b5e3c"; e.currentTarget.style.transform = "translateY(-50%) scale(1.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#a67853"; e.currentTarget.style.transform = "translateY(-50%)"; }}
              >
                <i className={`fa-solid ${icon}`} style={{ fontSize: "1.2rem" }} />
              </button>
            ))}
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
              {all.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, padding: 0, border: "none", cursor: "pointer", transition: "all 0.22s", background: i === idx ? "#a67853" : "rgba(139,94,60,0.25)" }} />
              ))}
            </div>
            <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(44,26,14,0.55)", color: "#fff", fontSize: "0.65rem", fontFamily: "'Montserrat',sans-serif", fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
              {idx + 1} / {all.length}
            </span>
          </>
        )}
      </div>
      {all.length > 1 && (
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
          {all.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ flexShrink: 0, width: 58, height: 58, borderRadius: 8, overflow: "hidden", border: `2px solid ${i === idx ? "#a67853" : "#edddd0"}`, background: "#faf7f4", cursor: "pointer", padding: 0 }}>
              {!err[i] && <img src={url} alt="" onError={() => setErr(e => ({ ...e, [i]: true }))} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} />}
              {err[i] && <i className="fa-regular fa-image" style={{ color: "#d5b99a", fontSize: "1rem" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function RoomPreviewCompactSpecImages({ images, onImageClick }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  const single = images.length === 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: 100 }} onClick={() => onImageClick(images, idx)}>
        <img key={idx} src={images[idx]} alt="" style={{ width: "100%", objectFit: "contain", display: "block" }} />
        {!single && (
          <>
            <span style={{ position: "absolute", top: 4, right: 4, background: "rgba(44,26,14,0.45)", color: "#fff", fontSize: "0.6rem", fontFamily: "'Montserrat',sans-serif", fontWeight: 600, padding: "2px 7px", borderRadius: 20, pointerEvents: "none" }}>
              {idx + 1} / {images.length}
            </span>
            {[{ fn: () => setIdx(i => (i - 1 + images.length) % images.length), side: "left", icon: "fa-chevron-left" }, { fn: () => setIdx(i => (i + 1) % images.length), side: "right", icon: "fa-chevron-right" }].map(({ fn, side, icon }) => (
              <button key={side} onClick={e => { e.stopPropagation(); fn(); }} style={{ position: "absolute", [side]: 2, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#a67853" }}>
                <i className={`fa-solid ${icon}`} style={{ fontSize: "0.9rem" }} />
              </button>
            ))}
          </>
        )}
      </div>
      {!single && (
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
          {images.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: `2px solid ${i === idx ? "#a67853" : "#edddd0"}`, background: "transparent", cursor: "pointer", padding: 0 }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function RoomPreviewResourcesPanel({ files }) {
  const [expanded, setExpanded] = useState(false);
  if (!files?.length) return null;
  const isMultiple = files.length > 1;

  if (!isMultiple) {
    return (
      <div>
        {files.map((f, i) => (
          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#faf7f4", borderRadius: 10, border: "1px solid #edddd0", color: "#2c1a0e", textDecoration: "none", fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; e.currentTarget.style.borderColor = "#d4b896"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#faf7f4"; e.currentTarget.style.borderColor = "#edddd0"; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 9, background: "linear-gradient(135deg,#8b5e3c,#a67853)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="fa-solid fa-file-pdf" style={{ color: "#fff", fontSize: "1rem" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
              <div style={{ fontSize: "0.65rem", color: "#a67853", marginTop: 2 }}>PDF · Click to open</div>
            </div>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: "#a67853", fontSize: "0.7rem", flexShrink: 0 }} />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#faf7f4", borderRadius: expanded ? "10px 10px 0 0" : 10, border: "1px solid #edddd0", color: "#2c1a0e", cursor: "pointer", fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem", fontWeight: 700, width: "100%", transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#faf7f4"; }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 9, background: "linear-gradient(135deg,#8b5e3c,#a67853)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="fa-solid fa-file-pdf" style={{ color: "#fff", fontSize: "0.9rem" }} />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e" }}>{files.length} Documents</div>
          <div style={{ fontSize: "0.65rem", color: "#a67853", marginTop: 2 }}>Click to {expanded ? "collapse" : "expand"}</div>
        </div>
        <i className={`fa-solid fa-chevron-${expanded ? "up" : "down"}`} style={{ color: "#a67853", fontSize: "0.7rem" }} />
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0", border: "1px solid #edddd0", borderTop: "none", borderRadius: "0 0 10px 10px" }}>
          {files.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "#fdf8f5", borderRadius: 8, color: "#2c1a0e", textDecoration: "none", fontFamily: "'Montserrat',sans-serif", fontSize: "0.80rem", marginLeft: 8, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f5ede3"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fdf8f5"; }}
            >
              <i className="fa-solid fa-file-pdf" style={{ color: "#a67853", fontSize: "0.85rem", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: "#a67853", fontSize: "0.65rem", flexShrink: 0 }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomPreviewModal({ room, onClose, onEdit, liveUrl }) {
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = e => { if (e.key === "Escape" && !lightbox) onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, lightbox]);

  const thumb      = getRoomImageUrl(room, "thumbnail");
  const images     = previewRoomImgsArr(room, "images");
  const specImages = previewRoomImgsArr(room, "spec_images");
  const files       = previewRoomGetFiles(room);

  const hasShortDesc = !!room.short_description;
  const hasDesc      = !!room.description;
  const hasFeatures  = (room.features || []).length > 0;
  const hasSpec      = specImages.length > 0;
  const hasResources = files.length > 0;
  const cats         = room.categories || [];
  const tags         = room.tags || [];
  const hasMeta      = cats.length > 0 || tags.length > 0;
  const roomTypeLabel = ROOM_TYPES.find(t => t.value === room.room_type)?.label || room.room_type;

  const openLightbox = (imgs, i) => setLightbox({ images: imgs, index: i });

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 10002, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px 60px" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes rpmPreviewFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .rpm-preview-modal { animation: rpmPreviewFade 0.2s ease; }
        @media(max-width:720px) { .rpm-preview-s1 { grid-template-columns: 1fr !important; gap: 20px !important; } }
      `}</style>

      <div
        className="rpm-preview-modal"
        style={{ background: "#fff", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.28)", width: "100%", maxWidth: 1060, position: "relative", fontFamily: "'Montserrat',sans-serif", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#faf7f4", borderBottom: "1px solid #edddd0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <i className="fa-solid fa-eye" style={{ color: "#a67853", fontSize: "0.85rem", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</span>
            <span style={{ fontSize: "0.7rem", color: "#a67853", background: "rgba(166,120,83,0.1)", padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>Preview</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8b5e3c", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", transition: "background 0.15s", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(139,94,60,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Section 1: Images + Info */}
        <div style={{ padding: "28px 32px 24px" }}>
          <div className="rpm-preview-s1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>

            {/* Left: Carousel + Resources (only when Diagram also exists) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <RoomPreviewCarousel images={images} thumbnail={thumb} onImageClick={openLightbox} />
              {hasResources && hasSpec && (
                <div>
                  <RoomPreviewSectionLabel text="Resources" />
                  <RoomPreviewResourcesPanel files={files} />
                </div>
              )}
            </div>

            {/* Right: Type/Model, Name, Short Desc, Features, Diagram, Resources (if no Diagram) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {(roomTypeLabel || room.model_code) && (
                <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a67853", margin: 0 }}>
                  {[roomTypeLabel, room.model_code].filter(Boolean).join(" · ")}
                </p>
              )}
              <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "clamp(1.1rem,2vw,1.5rem)", color: "#2c1a0e", margin: 0, lineHeight: 1.2 }}>
                {room.name}
              </h2>
              {hasShortDesc && (
                <div style={{ paddingBottom: 16, borderBottom: "1px solid #edddd0" }}>
                  <div style={{ fontSize: "0.82rem", color: "#7a5c45", lineHeight: 1.6, whiteSpace: "pre-wrap", wordWrap: "break-word" }} dangerouslySetInnerHTML={{ __html: cleanRoomPreviewHTML(room.short_description) }} />
                </div>
              )}
              {hasFeatures && (
                <div>
                  <RoomPreviewSectionLabel text="Features" />
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                    {room.features.map((f, i) => (
                      <li key={i} style={{ color: "#5a4030", fontSize: "0.78rem", lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: 7 }}>
                        <i className="fa-solid fa-check" style={{ color: "#a67853", fontSize: "0.68rem", marginTop: 4, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hasSpec && (
                <div>
                  <RoomPreviewSectionLabel text="Diagram" />
                  <RoomPreviewCompactSpecImages images={specImages} onImageClick={openLightbox} />
                </div>
              )}
              {hasResources && !hasSpec && (
                <div>
                  <RoomPreviewSectionLabel text="Resources" />
                  <RoomPreviewResourcesPanel files={files} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Full Description */}
        {hasDesc && (
          <>
            <div style={{ height: 1, background: "linear-gradient(to right,transparent,#edddd0,transparent)", margin: "0 32px" }} />
            <div style={{ padding: "20px 32px" }}>
              <RoomPreviewSectionLabel text="Specifications" />
              <div style={{ color: "#5a4030", lineHeight: 1.7, fontSize: "0.82rem", whiteSpace: "pre-wrap", wordWrap: "break-word" }} dangerouslySetInnerHTML={{ __html: cleanRoomPreviewHTML(room.description) }} />
            </div>
          </>
        )}

        {/* Categories + Tags */}
        {hasMeta && (
          <>
            <div style={{ height: 1, background: "linear-gradient(to right,transparent,#edddd0,transparent)", margin: "0 32px" }} />
            <div style={{ padding: "20px 32px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
              {cats.length > 0 && (
                <div>
                  <RoomPreviewSectionLabel text="Categories" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cats.map(c => (
                      <span key={c} style={{ padding: "4px 12px", background: "rgba(166,120,83,0.12)", color: "#7a5234", borderRadius: 20, fontSize: "0.73rem", fontWeight: 600, border: "1px solid rgba(166,120,83,0.25)" }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {tags.length > 0 && (
                <div>
                  <RoomPreviewSectionLabel text="Tags" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {tags.map(t => (
                      <span key={t} style={{ padding: "3px 10px", background: "rgba(139,94,60,0.08)", color: "#6b4c30", borderRadius: 20, fontSize: "0.70rem", border: "1px solid rgba(139,94,60,0.18)", wordBreak: "break-word" }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer: Visit URL + Edit */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 32px", borderTop: "1px solid #edddd0", background: "#faf7f4" }}>
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, color: "#7a5234", background: "transparent", border: "1px solid rgba(166,120,83,0.35)", borderRadius: 6, textDecoration: "none" }}>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.75rem" }} /> Visit URL
            </a>
          )}
          {onEdit && (
            <button type="button" onClick={onEdit}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, color: "#fff", background: "#a67853", border: "none", borderRadius: 6, cursor: "pointer" }}>
              <i className="fa-solid fa-pen" style={{ fontSize: "0.75rem" }} /> Edit
            </button>
          )}
        </div>
      </div>

      {lightbox && (
        <RoomPreviewLightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// ─── Room Card (Grid view) ────────────────────────────────────────────────────
function RoomCard({ room, onEdit, onDelete, onDuplicate, onPreview, perms }) {
  const [hovered, setHovered]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    if (!menuOpen) return;
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const showMenu = hovered && (perms.can("sauna_rooms.edit") || perms.can("sauna_rooms.duplicate") || perms.can("sauna_rooms.delete"));
  const isUnpublished = room.status === "draft" || room.visible === false;

  return (
    <div role="button" tabIndex={0}
      onClick={() => onPreview(room)}
      onKeyDown={e => { if (e.key === "Enter") onPreview(room); }}
      className={`product-grid-card${isUnpublished ? " is-unpublished" : ""}`}
      style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
    >
      {isUnpublished && <span className="product-grid-unpublished-badge">Not Visible</span>}
      <div className="product-grid-thumb">
        {getRoomImageUrl(room, "thumbnail")
          ? <img src={getRoomImageUrl(room, "thumbnail")} alt={room.name} />
          : <i className="fa-regular fa-image" style={{ fontSize: "1.5rem", color: "var(--border)" }} />
        }
        {showMenu && (
          <div className="product-grid-options" ref={menuRef} onClick={e => e.stopPropagation()}>
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
        <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 2, textAlign: "center" }}>
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
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SaunaRooms({ currentUser }) {
  const perms = getPerms(currentUser);
  const { toasts, add, remove } = useToast();

  const [rooms,      setRooms]      = useState(() => getCache(ROOMS_CACHE_KEY) || []);
  const [loading,    setLoading]    = useState(() => !getCache(ROOMS_CACHE_KEY));
  const [allCats,    setAllCats]    = useState(() => getCache(ROOMS_META_CACHE_KEY)?.cats || []);
  const [allTags,    setAllTags]    = useState(() => getCache(ROOMS_META_CACHE_KEY)?.tags || []);

  const [search,       setSearch]       = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [sortDir,      setSortDir]      = useState("desc");
  const [viewMode,     setViewMode]     = useState("grid");

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
  const [previewRoom, setPreviewRoom] = useState(null);

  const [upThumb, setUpThumb] = useState(false);
  const [upOg,    setUpOg]    = useState(false);
  const [upImgs,  setUpImgs]  = useState(false);
  const [upSpec,  setUpSpec]  = useState(false);
  const [upFile,  setUpFile]  = useState(false);

  const [modalMenuOpen, setModalMenuOpen] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [expandedRevisionId, setExpandedRevisionId] = useState(null);
  const [revisions,     setRevisions]     = useState([]);

  const isDirty = !formsEqual(form, savedForm);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  // `search` is deliberately NOT a dependency here — it's applied purely
  // client-side against whatever's already in `rooms` (see the `filtered`
  // memo below), so typing a search query never re-triggers a full-table
  // refetch. It used to: this function pre-filtered by search and stored
  // the *shrunk* result into `rooms` state, which both wasted egress on
  // every keystroke and silently dropped the non-matching rows from state.
  const fetchRooms = useCallback(async () => {
    // Cached data is already on screen — refresh quietly in the background
    // instead of flashing the loading state.
    if (!getCache(ROOMS_CACHE_KEY)) setLoading(true);
    try {
      let query = supabase
        .from("sauna_rooms")
        .select("*")
        .eq("is_deleted", false);
      if (filterStatus) query = query.eq("status", filterStatus);
      if (filterType)   query = query.eq("room_type", filterType);
      query = query.order("created_at", { ascending: sortDir === "asc" });
      const { data, error } = await query;
      if (error) throw error;

      const processed = (data || []).map(room => {
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

      setRooms(processed);
      setCache(ROOMS_CACHE_KEY, processed);
      setSelected(new Set());
    } catch (err) { add(err.message, "error"); }
    finally { setLoading(false); }
  }, [filterStatus, filterType, sortDir]); // eslint-disable-line

  const fetchMeta = useCallback(async () => {
    try {
      const { data: roomsMeta } = await supabase.from("sauna_rooms").select("categories, tags").eq("is_deleted", false);
      const cats = new Set(), tags = new Set();
      (roomsMeta || []).forEach(r => {
        (r.categories || []).forEach(c => cats.add(c));
        (r.tags       || []).forEach(t => tags.add(t));
      });
      const catList = [...cats].sort();
      const tagList = [...tags].sort();
      setAllCats(catList);
      setAllTags(tagList);
      setCache(ROOMS_META_CACHE_KEY, { cats: catList, tags: tagList });
    } catch (err) { console.error("fetchMeta:", err); }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchRooms();
    fetchMeta();
  }, [fetchRooms, fetchMeta]); // eslint-disable-line

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

  // ── Image / File Uploads ───────────────────────────────────────────────────
  const handleThumbUpload = async file => {
    setUpThumb(true);
    try {
      const slug = effectiveSlug(form);
      if (form.thumbnail) await Promise.allSettled([deleteStorageUrls([form.thumbnail]), deleteR2Urls([form.thumbnail], currentUser)]);
      const url = await uploadFileToR2(file, { entityPrefix: "sauna-rooms", slug, role: "thumbnail", currentUser });
      setForm(f => ({ ...f, thumbnail: url }));
      add("Thumbnail uploaded.", "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpThumb(false); }
  };

  const handleOgUpload = async file => {
    setUpOg(true);
    try {
      const slug = effectiveSlug(form);
      if (form.og_image) await Promise.allSettled([deleteStorageUrls([form.og_image]), deleteR2Urls([form.og_image], currentUser)]);
      const url = await uploadFileToR2(file, { entityPrefix: "sauna-rooms", slug, role: "og", currentUser });
      setForm(f => ({ ...f, og_image: url }));
      add("OG image uploaded.", "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpOg(false); }
  };

  const uploadMoreImages = async files => {
    setUpImgs(true);
    try {
      const slug = effectiveSlug(form);
      const arr  = Array.isArray(files) ? files : [files];
      const urls = await Promise.all(arr.map(f => uploadFileToR2(f, { entityPrefix: "sauna-rooms", slug, role: "gallery", currentUser })));
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      add(`${urls.length} image(s) uploaded.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpImgs(false); }
  };

  const uploadSpecImages = async files => {
    setUpSpec(true);
    try {
      const slug = effectiveSlug(form);
      const arr  = Array.isArray(files) ? files : [files];
      const urls = await Promise.all(arr.map(f => uploadFileToR2(f, { entityPrefix: "sauna-rooms", slug, role: "spec", currentUser })));
      setForm(f => ({ ...f, spec_images: [...f.spec_images, ...urls] }));
      add(`${urls.length} spec image(s) uploaded.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpSpec(false); }
  };

  const handleFileUpload = async file => {
    setUpFile(true);
    try {
      const slug = effectiveSlug(form);
      const rawName = file.name.replace(/\.pdf$/i, "");
      const displayName = rawName.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const role = `manual-${slugify(displayName).slice(0, 30)}`;
      const url  = await uploadFileToR2(file, { entityPrefix: "sauna-rooms", slug, role, currentUser });
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
    room_type:         data.room_type         || "standard",
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
    meta_title:       data.meta_title       || "",
    meta_description: data.meta_description || "",
    og_image:         data.og_image         || "",
    publish_at:       toDatetimeLocalValue(data.publish_at),
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
      // Not copied — name just changed to "(Copy)" so the derived fallback
      // (recomputed from the new name/description) is more correct than a
      // stale override. og_image is fine to carry over, same as thumbnail.
      loaded.meta_title = "";
      loaded.meta_description = "";
      // Never copy a schedule — a duplicate is already forced to "draft",
      // so a leftover publish_at could otherwise reveal an unreviewed copy.
      loaded.publish_at = "";
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
        meta_title:       form.meta_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
        og_image:         form.og_image || null,
        publish_at:       form.publish_at ? new Date(form.publish_at).toISOString() : null,
        updated_at:             now,
        updated_by_username:    currentUser?.username || null,
        ...(editing ? {} : { created_by_username: currentUser?.username || null }),
      };

      if (editing) {
        const { error } = await supabase.from("sauna_rooms").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logActivity({ action: "update", entity: "sauna_room", entity_id: editing.id, entity_name: form.name.trim(), username: currentUser?.username, user_id: currentUser?.id, changes: diffRoomForms(savedForm, form) });
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

      <div style={{ marginBottom: 14 }}>
        <div>
          <div className="data-source-row">
            <p className="products-subtitle" style={{ margin: 0 }}>
              {loading ? "Loading..." : `${filtered.length} of ${rooms.length} rooms`}
            </p>
            {perms.can("sauna_rooms.create") && (
              <Btn icon="fa-plus" label="New Room" onClick={openCreate} style={{ marginLeft: "auto" }} />
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="tax-tabs">
          {[{ key: "", label: "All" }, ...ROOM_TYPES.map(t => ({ key: t.value, label: t.label }))].map(({ key, label }) => (
            <button key={key || "all"} type="button" onClick={() => setFilterType(key)}
              className={`tax-tab-btn${filterType === key ? " active" : ""}`}>
              {label}
            </button>
          ))}
        </div>

        <div className={`toolbar-filters-row${mobileSearchOpen ? " search-open" : ""}`}>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select className="filter-select" value={sortDir} onChange={e => setSortDir(e.target.value)}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <div className="tax-tabs">
            {[{ mode: "list", icon: "fa-list" }, { mode: "grid", icon: "fa-grip" }].map(({ mode, icon }) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)}
                className={`tax-tab-btn${viewMode === mode ? " active" : ""}`}>
                <i className={`fa-solid ${icon}`} />
              </button>
            ))}
          </div>
          {perms.can("sauna_rooms.bulk_delete") && selected.size > 0 && (
            <button type="button" className="btn btn-sm"
              style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)", gap: 5 }}
              onClick={() => setBulkConfirm(true)}>
              <i className="fa-solid fa-trash" /> Delete {selected.size}
            </button>
          )}
          <button type="button" className="mobile-search-toggle"
            onClick={() => setMobileSearchOpen(o => !o)}
            aria-label={mobileSearchOpen ? "Close search" : "Open search"}>
            <i className={`fa-solid ${mobileSearchOpen ? "fa-xmark" : "fa-magnifying-glass"}`} />
          </button>
          <div className="search-wrap">
            <i className="fa-solid fa-magnifying-glass" />
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, model, tag..." />
          </div>
        </div>
      </div>

      {/* Grid View */}
      {!loading && viewMode === "grid" && (
        <div className="product-grid">
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text-3)", fontStyle: "italic", fontSize: "0.82rem" }}>
              {search ? `No rooms match "${search}"` : "No sauna rooms yet. Click New Room to create one."}
            </div>
          )}
          {filtered.map(r => (
            <RoomCard key={r.id} room={r} onEdit={openEdit} onDelete={setConfirmDel} onDuplicate={openDuplicate} onPreview={setPreviewRoom} perms={perms} />
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
                  {perms.can("sauna_rooms.bulk_delete") && (
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
                  <tr><td colSpan={perms.can("sauna_rooms.bulk_delete") ? 9 : 8} className="table-empty">
                    {search
                      ? `No rooms match "${search}"`
                      : "No sauna rooms yet. Click New Room to create one."}
                  </td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} className={selected.has(r.id) ? "row-selected" : ""}>
                    {perms.can("sauna_rooms.bulk_delete") && (
                      <td style={{ paddingRight: 0 }}>
                        <input type="checkbox" className="tbl-checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                      </td>
                    )}
                    <td style={{ width: 44 }}>
                      {getRoomImageUrl(r, "thumbnail")
                        ? <img src={getRoomImageUrl(r, "thumbnail")} alt="" className="product-thumb" />
                        : <div className="product-thumb-placeholder"><i className="fa-regular fa-image" /></div>
                      }
                    </td>
                    <td>
                      <button type="button" className="product-name-link" onClick={() => setPreviewRoom(r)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                        {r.name}
                      </button>
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
                      <span className="tbl-status">
                        {!r.visible ? "Hidden" : r.status === "published" ? "Published" : (r.publish_at && new Date(r.publish_at) > new Date()) ? "Scheduled" : "Draft"}
                      </span>
                    </td>
                    <td className="tbl-date" style={{ fontSize: "0.75rem" }}>{formatDate(r.created_at)}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{r.created_by_username ? `@${r.created_by_username}` : "-"}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions">
                        <IconBtn icon="fa-eye" title="Preview" onClick={() => setPreviewRoom(r)} />
                        {perms.can("sauna_rooms.edit")      && <IconBtn icon="fa-pen"   title="Edit"      onClick={() => openEdit(r)} />}
                        {perms.can("sauna_rooms.duplicate") && <IconBtn icon="fa-copy"  title="Duplicate" onClick={() => openDuplicate(r)} />}
                        {perms.can("sauna_rooms.delete")    && <IconBtn icon="fa-trash" title="Delete"    onClick={() => setConfirmDel(r)} danger />}
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
        fixedHeight
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
                      {rev.action === "update" && (
                        rev.changes && Object.keys(rev.changes).length > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setExpandedRevisionId(id => id === rev.id ? null : rev.id)}
                              style={{ marginTop: 6, background: "none", border: "none", padding: 0, color: "var(--brand)", fontSize: "0.7rem", cursor: "pointer", fontWeight: 600 }}
                            >
                              <i className={`fa-solid fa-chevron-${expandedRevisionId === rev.id ? "down" : "right"}`} style={{ marginRight: 4, fontSize: "0.6rem" }} />
                              {Object.keys(rev.changes).length} field(s) changed
                            </button>
                            {expandedRevisionId === rev.id && (
                              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                                {Object.entries(rev.changes).map(([field, change]) => (
                                  <RevisionFieldDiff key={field} field={field} change={change} />
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ marginTop: 4, color: "var(--text-3)", fontSize: "0.68rem", fontStyle: "italic" }}>
                            Field details not recorded for this revision
                          </div>
                        )
                      )}
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
                  <RichField value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} rows={3} onNotify={add} />
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
                  <RichField value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={10} onNotify={add} />

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

                  <TagSuggestions
                    name={form.name}
                    description={form.short_description}
                    features={form.features}
                    currentTags={form.tags}
                    allTags={allTags}
                    onAddTags={suggestedTags => {
                      setForm(f => ({ ...f, tags: [...new Set([...f.tags, ...suggestedTags])] }));
                      add(`✓ Added ${suggestedTags.length} matching tag(s) from content`, "success");
                    }}
                  />
                </>
              )}

              {/* ── TAB: Settings ── */}
              {activeTab === "settings" && (
                <>
                  {/* SEO — pure overrides. Empty = the frontend keeps deriving
                      title/description/image from name + description +
                      thumbnail (see DispSaunaRoom.jsx's seoDescription), so
                      leaving these blank is never "broken", just inherited. */}
                  <SectionLabel label="SEO" />
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <Field label="Meta Title" value={form.meta_title}
                        onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                        placeholder={form.name || "Inherits room name"} />
                      <p className="form-helper">
                        {form.meta_title.length}/60 {form.meta_title.length > 60 && "(longer titles may get truncated in search results)"}
                      </p>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Meta Description</label>
                      <textarea
                        value={form.meta_description}
                        onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                        rows={3}
                        placeholder={derivedSeoDescription(form) || "Inherits from Description"}
                        className="form-textarea"
                      />
                      <p className="form-helper">
                        {form.meta_description.length}/155 {form.meta_description.length > 155 && "(longer descriptions may get truncated in search results)"}
                      </p>
                    </div>
                    <div>
                      <label className="form-label">OG Image (social share preview)</label>
                      {form.og_image ? (
                        <ThumbnailPreview
                          url={form.og_image}
                          onRemove={() => { deleteStorageUrls([form.og_image]).catch(console.warn); setForm(f => ({ ...f, og_image: "" })); }}
                          onReplace={handleOgUpload}
                          uploading={upOg}
                        />
                      ) : (
                        <ThumbnailUploader onUpload={handleOgUpload} uploading={upOg} />
                      )}
                      <p className="form-helper">Inherits the Featured Image if left empty</p>
                    </div>
                  </div>

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

                  {/* Scheduled publishing — only meaningful for a draft. No
                      server cron: goes live the moment a visitor's page load
                      evaluates isPubliclyVisible() past this timestamp. */}
                  {form.status === "draft" && (
                    <div style={{ marginTop: 4 }}>
                      <Field label="Publish At" type="datetime-local" value={form.publish_at}
                        onChange={e => setForm(f => ({ ...f, publish_at: e.target.value }))}
                        helper={form.publish_at
                          ? new Date(form.publish_at) > new Date()
                            ? `Scheduled: goes live ${new Date(form.publish_at).toLocaleString()}`
                            : "This date is in the past, so it will go live on next page load"
                          : "Leave empty to stay a draft indefinitely."}
                      />
                    </div>
                  )}

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

      {previewRoom && (
        <RoomPreviewModal
          room={previewRoom}
          onClose={() => setPreviewRoom(null)}
          onEdit={() => { const r = previewRoom; setPreviewRoom(null); openEdit(r); }}
          liveUrl={`${FRONT_URL || window.location.origin}/sauna/rooms/${previewRoom.slug}`}
        />
      )}
    </div>
  );
}

