// src/Administrator/Products.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase, cleanOrphanedStorageFiles, logActivity } from "./supabase";
import { getPerms } from "./permissions";
import { processPastedTableHTML } from "../utils/cleanTableHTML";
import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive, getProductByIdLive } from "../local-storage/supabaseReader";
import { useLocalProducts } from "./Local/useLocalProducts";
import { checkSupabaseSync, applyLocalChanges } from "./Local/compareSupabaseWithLocal";

const FRONT_URL = process.env.REACT_APP_FRONT_URL || "";
const STORAGE_BUCKETS = ["product-images", "product-pdf"];
const PREVIEW_GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function getImageUrl(product, field, dataSource) {
  const imgPath = localOrRemote(product, field);
  if (!imgPath) return null;
  if (imgPath.includes("://")) return imgPath;
  if (dataSource === "live") return imgPath;
  return `${PREVIEW_GITHUB_RAW}${imgPath}`;
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Convert Supabase URL to relative path for GitHub storage
// e.g., https://qsdfdfuooeythaioucpx.supabase.co/storage/v1/object/public/product-images/products/file.webp → products/file.webp
function supabaseUrlToRelativePath(url) {
  if (!url) return null;
  if (!url.includes("/object/public/")) return url; // Not a Supabase URL, return as-is
  const match = url.match(/\/object\/public\/product-images\/(.+)$/);
  return match ? match[1] : url;
}

function formsEqual(a, b) {
  for (const k of Object.keys(EMPTY_FORM)) {
    const av = a[k], bv = b[k];
    if (Array.isArray(av) && Array.isArray(bv)) {
      if (JSON.stringify(av) !== JSON.stringify(bv)) return false;
    } else if (av !== bv) return false;
  }
  return true;
}

// Matches the real products schema (no "model" column — use type for that).
const EMPTY_FORM = {
  name: "", slug: "", short_description: "", description: "",
  thumbnail: "", images: [], spec_images: [], files: [],
  categories: [], tags: [], features: [],
  brand: "SAWO", type: "",
  capacity_liters: "", variant_type: "", product_family: "", parent_product_id: "",
  status: "published",
  visible: true, featured: false, sort_order: 0,
};

// ─── Auto-extract tags from description HTML ──────────────────────────────────
function extractTagsFromDescription(html) {
  if (!html) return { kwTags: [], modelTags: [] };
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const kwTags    = new Set();
    const modelTags = new Set();

    // Extract text content for power range patterns
    const textContent = doc.body.textContent;

    // Pattern 1: Extract power ranges like "4.5 – 9.0kW" or "4.5-9.0 kW"
    const powerRangePattern = /(\d+(?:[.,]\d+)?)\s*(?:–|-|to)\s*(\d+(?:[.,]\d+)?)\s*k[wW]/gi;
    let match;
    while ((match = powerRangePattern.exec(textContent)) !== null) {
      const min = parseFloat(match[1].replace(",", "."));
      const max = parseFloat(match[2].replace(",", "."));
      if (!isNaN(min) && !isNaN(max) && min > 0 && max < 1000) {
        kwTags.add(`${min.toFixed(1)} – ${max.toFixed(1)} kW`);
      }
    }

    // Pattern 2: Extract single kW values like "9.0 kW"
    const singleKwPattern = /(\d+(?:[.,]\d+)?)\s*k[wW]\b/gi;
    while ((match = singleKwPattern.exec(textContent)) !== null) {
      const val = parseFloat(match[1].replace(",", "."));
      if (!isNaN(val) && val > 0 && val < 1000) {
        const formatted = `${val.toFixed(1)} kW`;
        if (![...kwTags].some(t => t.includes(formatted))) {
          kwTags.add(formatted);
        }
      }
    }

    // Extract from tables (existing logic)
    const tables = doc.querySelectorAll("table");
    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length < 2) continue;
      const headerRow = rows.find(r => r.querySelector("th")) || rows[0];
      const headers   = Array.from(headerRow.querySelectorAll("th, td"))
        .map(cell => cell.textContent.replace(/\s+/g, " ").trim().toLowerCase());
      const kwColIndex    = headers.findIndex(h => /\bkw\b/i.test(h) || /kilowatt/i.test(h));
      const modelColIndex = headers.findIndex(h => /model/i.test(h) || /heater\s*name/i.test(h));
      if (kwColIndex === -1) continue;
      const dataRows = rows.filter(r => r !== headerRow);
      for (const row of dataRows) {
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells[kwColIndex]) {
          const raw = cells[kwColIndex].textContent.trim();
          const val = parseFloat(raw.replace(",", "."));
          if (!isNaN(val) && val > 0 && val < 1000) kwTags.add(`${val.toFixed(1)} kW`);
        }
        if (modelColIndex !== -1 && cells[modelColIndex]) {
          const model = cells[modelColIndex].textContent.trim();
          if (model && model.length > 2 && !/^\d+(\.\d+)?$/.test(model)) modelTags.add(model);
        }
      }
    }
    return {
      kwTags:    [...kwTags].sort((a, b) => parseFloat(a) - parseFloat(b)),
      modelTags: [...modelTags],
    };
  } catch (err) {
    console.warn("[extractTagsFromDescription] Parse error:", err);
    return { kwTags: [], modelTags: [] };
  }
}

function mergeAutoTags(existingTags, kwTags, modelTags) {
  const all = new Set([...existingTags, ...kwTags, ...modelTags]);
  return [...all];
}

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

async function uploadFileToSupabase(file, bucket = "product-images") {
  let uploadBlob, fileName;
  if (file.type.startsWith("image/")) {
    try {
      uploadBlob = await convertToWebP(file);
      fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
    } catch (err) {
      console.warn("WebP conversion failed, uploading original:", err);
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

async function deleteProductStorageFiles(product) {
  const urls = [
    product.thumbnail,
    ...(product.images      || []),
    ...(product.spec_images || []),
    ...(product.files       || []).map(f => f?.url),
  ].filter(Boolean);
  await deleteStorageUrls(urls);
}

function findOrphanedUrls(savedForm, currentForm) {
  const collect = f => [
    f.thumbnail,
    ...(f.images      || []),
    ...(f.spec_images || []),
    ...(f.files       || []).map(fi => fi?.url),
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

function Field({ label, type = "text", value, onChange, placeholder, required, helper, disabled }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      {label && (
        <label className="form-label">
          {label}{required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required} disabled={disabled}
        className="form-input"
      />
      {helper && <p className="form-helper">{helper}</p>}
    </div>
  );
}

function RichField({ label, value, onChange, rows = 6, onNotify }) {
  const [mode, setMode] = useState("text");
  const textareaRef = useRef(null);
  const editorRef = useRef(null);

  const cleanPastedHTML = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Remove comments and unwanted elements
    const comments = temp.querySelectorAll("*");
    comments.forEach(el => {
      if (el.nodeType === 8) el.remove(); // Remove comments
    });

    // Process all elements
    const allElements = temp.querySelectorAll("*");
    allElements.forEach(el => {
      // Keep only semantic tags
      const allowedTags = ["P", "DIV", "BR", "B", "STRONG", "I", "EM", "U", "H1", "H2", "H3", "H4", "H5", "H6", "OL", "UL", "LI", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "SPAN"];

      if (!allowedTags.includes(el.tagName)) {
        // Replace non-allowed tags with their content
        const parent = el.parentNode;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      } else {
        // Extract text-align value before removing attributes
        const oldStyle = el.getAttribute("style") || "";
        const alignMatch = oldStyle.match(/text-align:\s*(left|center|right|justify)/);

        // Remove all attributes
        Array.from(el.attributes).forEach(attr => {
          el.removeAttribute(attr.name);
        });

        // Only restore text-align if it existed
        if (alignMatch) {
          el.setAttribute("style", `text-align: ${alignMatch[1]};`);
        }
      }
    });

    // Convert &nbsp; to regular spaces for cleaner output
    let result = temp.innerHTML;
    result = result.replace(/&nbsp;/g, " ");
    result = result.replace(/<!--.*?-->/g, ""); // Remove any remaining comments

    return result;
  };

  const handlePaste = (e) => {
    // Check if paste happened inside the editor (not just exact target match)
    if (!editorRef.current?.contains(e.target)) return;

    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (!html && !text) return;

    e.preventDefault();

    let contentToInsert = html || text;

    // Clean and process the pasted content
    if (/<table/i.test(contentToInsert)) {
      contentToInsert = processPastedTableHTML(contentToInsert);
      if (onNotify) onNotify("✓ Table cleaned and formatted! kW tags will be auto-extracted on Save.", "success");
    } else if (contentToInsert.includes("<")) {
      // Clean HTML paste: remove inline styles
      contentToInsert = cleanPastedHTML(contentToInsert);
    }

    // Use execCommand to insert the cleaned HTML
    document.execCommand("insertHTML", false, contentToInsert);

    // Update the form state
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

  const syncFromTextarea = () => {
    if (editorRef.current && textareaRef.current) {
      editorRef.current.innerHTML = textareaRef.current.value;
      setTimeout(autoExpandEditor, 0);
    }
  };

  const syncToTextarea = () => {
    if (textareaRef.current && editorRef.current) {
      textareaRef.current.value = editorRef.current.innerHTML;
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <div className="rich-field-header">
        {label && <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>}
        <div className="rich-field-modes">
          {["text", "html"].map(m => (
            <button key={m} type="button" onClick={() => {
              if (mode === "html" && m === "text") syncToTextarea();
              if (mode === "text" && m === "html") syncFromTextarea();
              setMode(m);
            }}
              className={`rich-field-mode-btn${mode === m ? " active" : ""}`}>{m}</button>
          ))}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={value} onChange={onChange} rows={rows}
        onPaste={handlePaste}
        placeholder={mode === "html" ? "<p>Enter HTML here...</p>" : "Enter plain text description..."}
        className="form-textarea"
        style={{ fontFamily: mode === "html" ? "monospace" : "var(--font)", marginTop: 4, display: mode === "text" ? "block" : "none" }}
      />
      {mode === "html" && (
        <>
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: 6 }}>
            💡 Paste WordPress tables directly — they'll auto-format! kW values &amp; model codes will be auto-tagged on Save.
          </div>
          <div className="rich-field-preview" style={{ marginTop: 12 }}>
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
              onInput={handleEditorChange}
              onBlur={handleEditorChange}
              onPaste={handlePaste}
              dangerouslySetInnerHTML={{ __html: value }}
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
        </>
      )}
    </div>
  );
}

// ─── Auto-tag preview banner ───────────────────────────────────────────────────
// ─── Smart Tag Suggestions from Name & Description ──────────────────────
function TagSuggestions({ name, description, features = [], currentTags, allTags, onAddTags }) {
  // Find tags that appear in name, description, or features
  const suggestedTags = allTags.filter(tag => {
    if (currentTags.includes(tag)) return false; // Already added
    const nameLower = (name || "").toLowerCase();
    const descLower = (description || "").toLowerCase();
    const featuresText = (features || []).join(" ").toLowerCase();
    // Check if tag appears as a word in name, description, or features
    return new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(nameLower) ||
           new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(descLower) ||
           new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(featuresText);
  });

  if (!suggestedTags.length) return null;

  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid rgba(245,157,11,0.25)",
      borderRadius: "var(--r)", padding: "12px 14px",
      fontSize: "0.78rem", color: "var(--text-2)", lineHeight: 1.7, marginTop: 8, marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, fontWeight: 700, color: "var(--text)", fontSize: "0.8rem" }}>
        <i className="fa-solid fa-lightbulb" style={{ color: "#f59d0b" }} />
        Found matching keywords in your content
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        {suggestedTags.map(t => (
          <span key={t} style={{
            fontSize: "0.72rem", fontWeight: 600,
            background: "rgba(245,157,11,0.1)",
            color: "#92400e",
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

function AutoTagPreview({ description, currentTags }) {
  const { kwTags, modelTags } = extractTagsFromDescription(description);
  const newKw    = kwTags.filter(t => !currentTags.includes(t));
  const newModel = modelTags.filter(t => !currentTags.includes(t));
  const hasNew   = newKw.length > 0 || newModel.length > 0;
  if (!description || (!hasNew && kwTags.length === 0)) return null;
  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid rgba(var(--brand-rgb, 99,102,241), 0.25)",
      borderRadius: "var(--r)", padding: "10px 14px",
      fontSize: "0.78rem", color: "var(--text-2)", lineHeight: 1.7, marginTop: -4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, fontWeight: 700, color: "var(--text)", fontSize: "0.8rem" }}>
        <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "var(--brand)" }} />
        Auto-tags detected in description
        <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: "0.72rem" }}>— will be added on Save</span>
      </div>
      {kwTags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: modelTags.length > 0 ? 6 : 0 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-3)", marginRight: 2, alignSelf: "center" }}>kW:</span>
          {kwTags.map(t => (
            <span key={t} style={{
              fontSize: "0.72rem", fontWeight: 700,
              background: currentTags.includes(t) ? "var(--surface-3, #e5e7eb)" : "rgba(34,197,94,0.12)",
              color:      currentTags.includes(t) ? "var(--text-3)" : "#16a34a",
              border:     `1px solid ${currentTags.includes(t) ? "var(--border)" : "rgba(34,197,94,0.3)"}`,
              borderRadius: 4, padding: "2px 7px",
            }}>{currentTags.includes(t) ? "✓ " : "+ "}{t}</span>
          ))}
        </div>
      )}
      {modelTags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-3)", marginRight: 2, alignSelf: "center" }}>Models:</span>
          {modelTags.map(t => (
            <span key={t} style={{
              fontSize: "0.72rem", fontWeight: 600,
              background: currentTags.includes(t) ? "var(--surface-3, #e5e7eb)" : "rgba(99,102,241,0.1)",
              color:      currentTags.includes(t) ? "var(--text-3)" : "var(--brand)",
              border:     `1px solid ${currentTags.includes(t) ? "var(--border)" : "rgba(99,102,241,0.25)"}`,
              borderRadius: 4, padding: "2px 7px",
            }}>{currentTags.includes(t) ? "✓ " : "+ "}{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options = [] }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      {label && <label className="form-label">{label}</label>}
      <select value={value} onChange={onChange} className="form-select">
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

    // Split by newlines and filter out empty lines
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);

    // Check if lines have bullet points (», •, -, *, etc.)
    const bulletPattern = /^[»•\-*+]\s+/;
    const hasBullets = lines.some(l => bulletPattern.test(l));

    let newFeatures = [];
    if (hasBullets) {
      // Parse lines with bullets
      newFeatures = lines
        .map(l => l.replace(bulletPattern, "").trim())
        .filter(l => l && !value.includes(l));
    } else {
      // If no bullets, treat each non-empty line as a feature
      newFeatures = lines.filter(l => l && !value.includes(l));
    }

    if (newFeatures.length > 0) {
      onChange([...value, ...newFeatures]);
      setInput("");
      setShowSug(false);
    }
  };
  return (
    <div className="form-group" style={{ marginBottom: 0, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        {label && <label className="form-label" style={{ margin: 0 }}>{label}</label>}
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              fontSize: "0.75rem",
              padding: "4px 8px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              color: "var(--text-3)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={e => { e.target.style.color = "var(--text)"; e.target.style.borderColor = "var(--text-3)"; }}
            onMouseLeave={e => { e.target.style.color = "var(--text-3)"; e.target.style.borderColor = "var(--border)"; }}
            title="Clear all items"
          >
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
      <p className="pill-hint">Press Enter to add items, Backspace to remove the last item, or paste formatted lists (» • - *)</p>
    </div>
  );
}

// ─── Model Select — dropdown of existing models to prevent duplicates ─────────
function ModelSelect({ label, value, onChange, placeholder, suggestions = [] }) {
  const [showSug, setShowSug] = useState(false);
  const inputRef = useRef();
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8);

  return (
    <div className="form-group" style={{ marginBottom: 0, position: "relative" }}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text" value={value} onChange={e => { onChange(e.target.value); setShowSug(true); }}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder={placeholder || "Search or create new model"}
          className="form-input"
          autoComplete="off"
        />
        {showSug && filtered.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)", zIndex: 10, maxHeight: 200, overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}>
            {filtered.map((model, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => { onChange(model); setShowSug(false); }}
                style={{
                  width: "100%", padding: "10px 14px", textAlign: "left",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontSize: "0.85rem", color: "var(--text)", borderBottom: "1px solid var(--border)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <i className="fa-solid fa-folder-open" style={{ marginRight: 8, color: "var(--brand)", fontSize: "0.75rem" }} />
                {model}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="form-helper" style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 6 }}>
        Select an existing model or type a new one
      </p>
    </div>
  );
}

// ─── Smart Image Gallery — adapts display based on count ────────────────────────
function SmartImageGallery({ images = [], onRemove, isSingle = false }) {
  if (!images.length) return null;

  // Single image: display large
  if (isSingle && images.length === 1) {
    return (
      <div className="smart-image-single">
        <div className="smart-image-wrapper">
          <img src={images[0]} alt="" />
          {onRemove && (
            <button type="button" className="smart-image-remove" onClick={() => onRemove(0)}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2-3 images: grid display
  if (isSingle && images.length <= 3) {
    return (
      <div className={`smart-image-grid grid-${images.length}`}>
        {images.map((url, i) => (
          <div key={i} className="smart-image-item">
            <img src={url} alt="" />
            {onRemove && (
              <button type="button" className="smart-image-remove" onClick={() => onRemove(i)}>
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Many images: compact strip
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


function AddMoreImagesButton({ label, uploading, onChange }) {
  const [hovering, setHovering] = useState(false);
  const ref = useRef();
  const divRef = useRef();

  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (let item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) { e.preventDefault(); onChange?.({ target: { files: files } }); }
  };

  return (
    <div
      ref={divRef}
      className={`add-more-label${uploading ? " uploading" : ""}`}
      onPaste={handlePaste}
      onMouseEnter={() => { setHovering(true); divRef.current?.focus(); }}
      onMouseLeave={() => setHovering(false)}
      onClick={() => !uploading && ref.current?.click()}
      tabIndex="0"
      contentEditable={hovering && !uploading}
      suppressContentEditableWarning
      style={{ outline: "none", cursor: uploading ? "default" : "pointer", position: "relative" }}
    >
      <i className="fa-solid fa-plus" />
      {uploading ? "Converting & uploading…" : label}
      {hovering && !uploading && <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>Hover to paste image • Ctrl+V</p>}
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }} disabled={uploading}
        onChange={onChange} />
    </div>
  );
}

function AddMorePdfsButton({ label, uploading, onUploadFile, onAddUrl }) {
  const [hovering, setHovering] = useState(false);
  const ref = useRef();
  const divRef = useRef();

  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.kind === "file" && (item.type === "application/pdf" || item.type === "")) {
        const file = item.getAsFile();
        if (file) { e.preventDefault(); onUploadFile?.(file); return; }
      }
    }
    const text = e.clipboardData.getData("text/plain")?.trim();
    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
      e.preventDefault();
      onAddUrl?.(text);
    }
  };

  return (
    <div
      ref={divRef}
      className={`add-more-label${uploading ? " uploading" : ""}`}
      onPaste={handlePaste}
      onMouseEnter={() => { setHovering(true); divRef.current?.focus(); }}
      onMouseLeave={() => setHovering(false)}
      onClick={() => !uploading && ref.current?.click()}
      tabIndex="0"
      style={{ outline: "none", cursor: uploading ? "default" : "pointer", position: "relative" }}
    >
      <i className="fa-solid fa-plus" />
      {uploading ? "Converting & uploading…" : label}
      {hovering && !uploading && <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>Hover to paste PDF • Ctrl+V</p>}
      <input ref={ref} type="file" accept=".pdf,application/pdf" style={{ display: "none" }} disabled={uploading}
        onChange={e => { if (e.target.files?.[0]) onUploadFile?.(e.target.files[0]); }} />
    </div>
  );
}

function ImageUploader({ onUpload, label = "Upload Image", multiple = false, uploading = false }) {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const ref    = useRef();
  const divRef = useRef();
  const handleFiles = files => { if (!files?.length) return; onUpload(multiple ? Array.from(files) : files[0]); };
  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (let item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) { e.preventDefault(); handleFiles(files); }
  };
  return (
    <div
      ref={divRef}
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
        ? <>
            <i className="fa-solid fa-spinner" style={{ color: "var(--brand)", fontSize: "1.8rem", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>Converting &amp; uploading…</span>
          </>
        : <>
            <div className="thumb-upload-icon">
              <i className={`fa-solid ${multiple ? "fa-images" : "fa-image"}`} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", margin: "0 0 4px" }}>{label}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0 0 6px" }}>Click to browse or drag &amp; drop · auto-converted to WebP</p>
              {hovering && <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>Hover to paste image • Ctrl+V</p>}
            </div>
          </>
      }
    </div>
  );
}

// ─── Floating thumbnail with hover overlay ────────────────────────────────────
function ThumbnailPreview({ url, onRemove, onReplace, uploading }) {
  const [hovered, setHovered] = useState(false);
  const replaceRef = useRef();
  const containerRef = useRef();

  const handleFiles = files => {
    const file = files instanceof FileList ? files[0] : (Array.isArray(files) ? files[0] : files);
    if (file) onReplace(file);
  };

  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) { e.preventDefault(); handleFiles(file); return; }
      }
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
      <div
        ref={containerRef}
        style={{ position: "relative", display: "inline-block", outline: "none", cursor: !uploading ? "pointer" : "default" }}
        onMouseEnter={() => { setHovered(true); containerRef.current?.focus(); }}
        onMouseLeave={() => { setHovered(false); }}
        onPaste={handlePaste}
        onClick={() => !uploading && replaceRef.current?.click()}
        tabIndex="0"
      >
        <img src={url} alt="Featured" style={{
          display: "block", maxHeight: 220, maxWidth: "100%",
          borderRadius: "var(--r)", objectFit: "contain",
          transition: "opacity 0.18s", opacity: uploading ? 0.5 : (hovered ? 0.8 : 1),
        }} />
        {hovered && !uploading && (
        <>
          {/* ✕ remove — top right */}
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove image" style={{
            position: "absolute", top: 8, right: 8,
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(0,0,0,0.65)", color: "#fff",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.8rem", zIndex: 10, backdropFilter: "blur(2px)",
            transition: "background 0.15s",
          }} onMouseEnter={e => e.target.style.background = "rgba(192,57,43,0.8)"} onMouseLeave={e => e.target.style.background = "rgba(0,0,0,0.65)"}>
            <i className="fa-solid fa-xmark" />
          </button>
          {/* Replace — centered over image */}
          <div title="Click to browse or Ctrl+V to paste" style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.7)", color: "#fff",
            padding: "8px 16px", borderRadius: 20, fontSize: "0.78rem",
            fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, flexDirection: "column",
            backdropFilter: "blur(3px)", whiteSpace: "nowrap", zIndex: 10, userSelect: "none",
            pointerEvents: "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="fa-solid fa-arrow-up-from-bracket" style={{ fontSize: "0.72rem" }} />
              Replace
            </div>
            <div style={{ fontSize: "0.65rem", opacity: 0.8, fontWeight: 400, marginTop: 2 }}>Click or Ctrl+V</div>
          </div>
        </>
        )}
        {uploading && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.6)", borderRadius: "var(--r)", gap: 6,
          }}>
            <i className="fa-solid fa-spinner" style={{ color: "var(--brand)", fontSize: "1.4rem", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>Converting &amp; uploading…</span>
          </div>
        )}
        <input ref={replaceRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { if (e.target.files[0]) { handleFiles(e.target.files[0]); e.target.value = ""; } }} />
      </div>
    </div>
  );
}

function ThumbnailUploader({ onUpload, uploading }) {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const ref    = useRef();
  const divRef = useRef();
  const handleFiles = files => {
    const file = files instanceof FileList ? files[0] : (Array.isArray(files) ? files[0] : files);
    if (file) onUpload(file);
  };
  const handlePaste = e => {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) { e.preventDefault(); handleFiles(file); return; }
      }
    }
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
        <>
          <i className="fa-solid fa-spinner" style={{ color: "var(--brand)", fontSize: "1.8rem", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>Converting &amp; uploading…</span>
        </>
      ) : (
        <>
          <div className="thumb-upload-icon"><i className="fa-solid fa-image" /></div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)", margin: "0 0 4px" }}>Add Featured Image</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0 0 6px" }}>Click to browse or drag &amp; drop · auto-converted to WebP</p>
            {hovering && <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>Hover to paste image • Ctrl+V</p>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Smart File Display — adapts layout based on count ────────────────────────
function SmartFileDisplay({ files = [], onRemove, onRename, isSingle = false }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(files.length > 0 ? files[0].name : "");

  if (!files.length) return null;

  // Single file: display large card
  if (isSingle && files.length === 1) {
    const file = files[0];

    return (
      <div className="smart-file-single">
        <div className="smart-file-card">
          <div className="smart-file-icon">
            <i className="fa-solid fa-file-pdf" />
          </div>
          <div className="smart-file-content">
            {editing ? (
              <input value={name} onChange={e => setName(e.target.value)} autoFocus className="file-row-input"
                onBlur={() => { onRename(0, name); setEditing(false); }}
                onKeyDown={e => { if (e.key === "Enter") { onRename(0, name); setEditing(false); } }} />
            ) : (
              <>
                <div className="smart-file-name">{file.name}</div>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="smart-file-link">
                  {file.url ? file.url.split("/").pop() : ""}
                </a>
              </>
            )}
          </div>
          <button type="button" onClick={() => setEditing(true)} title="Rename" className="smart-file-btn smart-file-edit">
            <i className="fa-solid fa-pen" />
          </button>
          <button type="button" onClick={() => onRemove(0)} title="Remove" className="smart-file-btn smart-file-trash">
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </div>
    );
  }

  // Multiple files: compact list
  return (
    <div className="file-rows">
      {files.map((file, index) => <FileRow key={index} file={file} index={index} onRemove={onRemove} onRename={onRename} />)}
    </div>
  );
}

function FileRow({ file, index, onRemove, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(file.name);
  return (
    <div className="file-row">
      <div className="file-row-icon"><i className="fa-solid fa-file-pdf" /></div>
      <div className="file-row-info">
        {editing ? (
          <input value={name} onChange={e => setName(e.target.value)} autoFocus className="file-row-input"
            onBlur={() => { onRename(index, name); setEditing(false); }}
            onKeyDown={e => { if (e.key === "Enter") { onRename(index, name); setEditing(false); } }} />
        ) : (
          <div className="file-row-name">{file.name}</div>
        )}
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-row-url">
          {file.url ? file.url.split("/").pop() : ""}
        </a>
      </div>
      <button type="button" onClick={() => setEditing(true)} title="Rename" className="file-row-btn file-row-edit">
        <i className="fa-solid fa-pen" />
      </button>
      <button type="button" onClick={() => onRemove(index)} title="Remove" className="file-row-btn file-row-trash">
        <i className="fa-solid fa-trash" />
      </button>
    </div>
  );
}

// ─── PDF Uploader — hover-to-paste ────────────────────────────────────────────
function PdfUploader({ onUploadFile, onAddUrl, uploading = false }) {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const fileInputRef = useRef();
  const divRef = useRef();

  const handleFiles = async files => {
    const fileArray = Array.from(files || []);
    for (const file of fileArray) await onUploadFile(file);
  };

  const handlePaste = async e => {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.kind === "file" && (item.type === "application/pdf" || item.type === "")) {
        const file = item.getAsFile();
        if (file) { e.preventDefault(); await handleFiles([file]); return; }
      }
    }
    const text = e.clipboardData.getData("text/plain")?.trim();
    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
      e.preventDefault();
      await onAddUrl(text);
    }
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
      contentEditable={hovering && !uploading}
      suppressContentEditableWarning
      tabIndex="0" style={{ outline: "none" }}
    >
      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple
        style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} disabled={uploading} />
      {uploading ? (
        <>
          <i className="fa-solid fa-spinner" style={{ color: "var(--brand)", fontSize: "1.2rem", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "5px 0 0" }}>Uploading PDF(s)…</p>
        </>
      ) : (
        <>
          <i className="fa-solid fa-file-pdf" style={{ color: "var(--brand)", fontSize: "1.2rem" }} />
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "5px 0 0" }}>Upload PDF(s)</p>
          {hovering && (
            <p style={{ fontSize: "0.65rem", color: "var(--brand)", margin: "4px 0 0", fontWeight: 600 }}>
              Hover &amp; Ctrl+V to paste a PDF link or file
            </p>
          )}
        </>
      )}
    </div>
  );
}

function UnsavedConfirm({ open, onStay, onDiscard }) {
  if (!open) return null;
  return (
    <div className="unsaved-overlay">
      <div className="unsaved-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div className="unsaved-icon">
            <i className="fa-solid fa-triangle-exclamation" style={{ color: "#e6a817", fontSize: "1rem" }} />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--text)", margin: 0 }}>Unsaved Changes</h3>
        </div>
        <p style={{ fontSize: "0.83rem", color: "var(--text-2)", margin: "0 0 20px", lineHeight: 1.6 }}>
          You have unsaved changes. If you leave now your progress will be lost.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn label="Stay & Keep Editing" variant="ghost" onClick={onStay} />
          <Btn label="Discard" variant="danger" icon="fa-trash" onClick={onDiscard} />
        </div>
      </div>
    </div>
  );
}

// ─── Storage Cleanup Modal ────────────────────────────────────────────────────
function StorageCleanupModal({ open, onClose, addToast }) {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [dryRun,  setDryRun]  = useState(true);

  useEffect(() => { if (open) { setResult(null); setDryRun(true); } }, [open]);

  const handleRun = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await cleanOrphanedStorageFiles({ dryRun });
      setResult(res);
      if (!dryRun) {
        const total = Object.values(res.deleted).reduce((s, a) => s + a.length, 0);
        addToast(
          total > 0 ? `Storage cleaned: ${total} orphaned file(s) deleted.` : "Storage is already clean.",
          total > 0 ? "success" : "info"
        );
      }
    } catch (err) { addToast("Storage cleanup failed: " + err.message, "error"); }
    finally { setLoading(false); }
  };

  const totalOrphans = result ? Object.values(result.deleted).reduce((s, a) => s + a.length, 0) : 0;
  const totalFailed  = result ? Object.values(result.failed).reduce((s, a)  => s + a.length, 0) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Storage Cleanup" wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "12px 14px", fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--text)" }}>What this does:</strong> Scans the{" "}
          <code style={{ background: "var(--surface)", padding: "1px 5px", borderRadius: 4 }}>product-images</code> and{" "}
          <code style={{ background: "var(--surface)", padding: "1px 5px", borderRadius: 4 }}>product-pdf</code> buckets
          and removes any file whose URL is not referenced by any product.
          <br />
          <span style={{ color: "#e6a817", fontWeight: 600 }}>⚠ Always run a Dry Run first</span> to preview before committing.
        </div>

        <div style={{ background: "var(--info-bg, rgba(26,111,168,0.08))", border: "1px solid var(--info, #1a6fa8)", borderRadius: "var(--r)", padding: "12px 14px", fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--info, #1a6fa8)" }}>🔍 How do orphaned files appear?</strong>
          <div style={{ marginTop: 6, fontSize: "0.78rem" }}>
            • Uploading images/PDFs but removing them from products without deleting from storage
            <br />
            • Replacing product images with new versions (old files left behind)
            <br />
            • Duplicate uploads of the same file
            <br />
            • Failed operations that left incomplete files
            <br />
            • Manual file uploads not linked to any product
          </div>
        </div>
        <Toggle label="Dry Run (preview only — nothing will be deleted)" checked={dryRun} onChange={v => { setDryRun(v); setResult(null); }} />
        <Btn loading={loading}
          label={loading ? "Scanning…" : dryRun ? "Preview Orphaned Files" : "Delete Orphaned Files"}
          icon={dryRun ? "fa-magnifying-glass" : "fa-trash"}
          variant={dryRun ? "primary" : "danger"} onClick={handleRun} />

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STORAGE_BUCKETS.map(bucket => {
              const scanned    = result.scanned[bucket]  ?? 0;
              const deleted    = (result.deleted[bucket] ?? []).length;
              const failed     = (result.failed[bucket]  ?? []).length;
              const kept       = result.kept[bucket]     ?? 0;
              const orphanList = result.deleted[bucket]  ?? [];
              return (
                <div key={bucket} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "14px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="fa-solid fa-bucket" style={{ color: "var(--brand)" }} />{bucket}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: orphanList.length ? 12 : 0 }}>
                    {[
                      { label: "Scanned", value: scanned, color: "var(--text-2)" },
                      { label: "Kept",    value: kept,    color: "#22c55e" },
                      { label: result.dryRun ? "Would Delete" : "Deleted", value: deleted, color: deleted > 0 ? "#e6a817" : "var(--text-3)" },
                      { label: "Failed",  value: failed,  color: failed > 0 ? "var(--danger)" : "var(--text-3)" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: "center", background: "var(--surface)", borderRadius: "var(--r-sm)", padding: "8px 4px" }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 700, color }}>{value}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {orphanList.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginBottom: 8, fontWeight: 600 }}>
                        {result.dryRun ? "Would be deleted:" : "Deleted files:"} ({orphanList.length})
                      </div>
                      {/* Image preview for product-images bucket */}
                      {bucket === "product-images" && orphanList.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginBottom: 10 }}>
                            {orphanList.map((f, i) => {
                              const { data } = supabase.storage.from(bucket).getPublicUrl(f);
                              const imageUrl = data?.publicUrl || f;
                              return (
                                <div key={i} style={{
                                  position: "relative",
                                  aspectRatio: "1",
                                  borderRadius: "var(--r-sm)",
                                  overflow: "hidden",
                                  border: "1px solid var(--border)",
                                  background: "var(--surface)",
                                }}>
                                  <img src={imageUrl} alt={f} style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }} onError={(e) => {
                                    e.target.style.display = "none";
                                  }} />
                                  <div style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "var(--surface-2)",
                                    fontSize: "0.5rem",
                                    color: "var(--text-3)",
                                    textAlign: "center",
                                    padding: "4px",
                                  }} title={f}>
                                    <span style={{ wordBreak: "break-word" }}>{f.split("/").pop()}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div style={{ maxHeight: bucket === "product-images" ? 80 : 130, overflowY: "auto", background: "var(--surface)", borderRadius: "var(--r-sm)", padding: "6px 10px", fontFamily: "monospace", fontSize: "0.7rem", color: "var(--text-2)", lineHeight: 1.8 }}>
                        {orphanList.map((f, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <i className={`fa-solid ${result.dryRun ? (bucket === "product-images" ? "fa-image" : "fa-file-pdf") : "fa-circle-check"}`}
                              style={{ color: result.dryRun ? "var(--text-3)" : "#22c55e", fontSize: "0.65rem", flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {failed > 0 && (
                    <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--danger-bg, #fef2f2)", borderRadius: "var(--r-sm)", fontSize: "0.75rem", color: "var(--danger)", lineHeight: 1.5 }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 5 }} />
                      <strong>{failed} file(s) could not be deleted.</strong> Add a DELETE policy for the <code>anon</code> role in Supabase → Storage → {bucket} → Policies.
                    </div>
                  )}
                  {scanned > 0 && orphanList.length === 0 && failed === 0 && (
                    <div style={{ fontSize: "0.78rem", color: "#22c55e", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <i className="fa-solid fa-circle-check" /> All {scanned} file(s) are referenced — nothing to clean.
                    </div>
                  )}
                  {scanned === 0 && <div style={{ fontSize: "0.78rem", color: "var(--text-3)", fontStyle: "italic" }}>Bucket is empty.</div>}
                </div>
              );
            })}
            {result.errors.length > 0 && (
              <div style={{ background: "var(--danger-bg, #fef2f2)", border: "1px solid var(--danger)", borderRadius: "var(--r)", padding: "10px 14px", fontSize: "0.75rem", color: "var(--danger)", lineHeight: 1.7 }}>
                <strong>Warnings / Errors:</strong>
                {result.errors.map((e, i) => <div key={i} style={{ marginTop: 4 }}>• {e}</div>)}
              </div>
            )}
            {result.dryRun && totalOrphans > 0 && (
              <div style={{ background: "var(--surface-2)", border: "1px dashed #e6a817", borderRadius: "var(--r)", padding: "10px 14px", fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.6 }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: 6, color: "#e6a817" }} />
                Found <strong>{totalOrphans} orphaned file(s)</strong>. Uncheck <strong>Dry Run</strong> and click <strong>Delete Orphaned Files</strong> to remove them.
              </div>
            )}
            {!result.dryRun && totalOrphans === 0 && totalFailed === 0 && (
              <div style={{ textAlign: "center", padding: "16px", fontSize: "0.88rem", color: "#22c55e", fontWeight: 600 }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }} />All storage is clean.
              </div>
            )}
          </div>
        )}
        <div className="modal-footer" style={{ paddingTop: 4 }}>
          <Btn label="Close" variant="ghost" onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
}

// ─── Product audit trail strip (shown inside the edit form) ──────────────────
function ProductAuditStrip({ product }) {
  const fmt = d => d
    ? new Date(d).toLocaleString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const created   = fmt(product?.created_at);
  const updated   = fmt(product?.updated_at);
  const createdBy = product?.created_by_username;
  const updatedBy = product?.updated_by_username;

  if (!created && !updated) return null;

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 20,
      padding: "13px 16px",
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      fontSize: "0.76rem",
      color: "var(--text-3)",
      lineHeight: 1.7,
    }}>
      {created && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className="fa-solid fa-circle-plus" style={{ color: "#22c55e", fontSize: "0.82rem" }} />
          <span>
            <span style={{ fontWeight: 600, color: "var(--text-2)" }}>Created</span>
            {createdBy && <> by <span style={{ fontWeight: 700, color: "var(--text)" }}>@{createdBy}</span></>}
            <span style={{ marginLeft: 5, color: "var(--text-3)" }}>· {created}</span>
          </span>
        </div>
      )}
      {updated && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className="fa-solid fa-pen-to-square" style={{ color: "var(--brand)", fontSize: "0.82rem" }} />
          <span>
            <span style={{ fontWeight: 600, color: "var(--text-2)" }}>Last updated</span>
            {updatedBy && <> by <span style={{ fontWeight: 700, color: "var(--text)" }}>@{updatedBy}</span></>}
            <span style={{ marginLeft: 5, color: "var(--text-3)" }}>· {updated}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Product Preview Modal ────────────────────────────────────────────────────

function previewResolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (String(pathOrUrl).includes("://")) return pathOrUrl;
  return `${PREVIEW_GITHUB_RAW}${pathOrUrl}`;
}

function previewGetField(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function previewGetImgsArr(product, field) {
  const val = previewGetField(product, field);
  if (!val || !Array.isArray(val)) return [];
  return val.map(previewResolveUrl).filter(Boolean);
}

function previewGetFiles(product) {
  const local = product?.local_files;
  const remote = product?.files;
  if (local?.length) return local.map(f => ({ name: f.name, url: previewResolveUrl(f.path || f.url) }));
  return (remote || []).map(f => ({ name: f.name, url: f.url }));
}

function cleanPreviewHTML(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  temp.querySelectorAll("*").forEach(el => el.removeAttribute("style"));
  return temp.innerHTML;
}

function PreviewSectionLabel({ text }) {
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

function PreviewLightbox({ images, startIndex, onClose }) {
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

function PreviewCarousel({ images, thumbnail, onImageClick }) {
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

function PreviewCompactSpecImages({ images, onImageClick }) {
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

function PreviewResourcesPanel({ files }) {
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

function ProductPreviewModal({ product, onClose }) {
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

  const thumb      = previewResolveUrl(previewGetField(product, 'thumbnail'));
  const images     = previewGetImgsArr(product, 'images');
  const specImages = previewGetImgsArr(product, 'spec_images');
  const files      = previewGetFiles(product);

  const hasShortDesc = !!product.short_description;
  const hasDesc      = !!product.description;
  const hasFeatures  = (product.features || []).length > 0;
  const hasSpec      = specImages.length > 0;
  const hasResources = files.length > 0;
  const cats         = product.categories || [];
  const tags         = product.tags || [];
  const hasMeta      = cats.length > 0 || tags.length > 0;

  const openLightbox = (imgs, i) => setLightbox({ images: imgs, index: i });

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 10002, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px 60px" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes ppPreviewFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pp-preview-modal { animation: ppPreviewFade 0.2s ease; }
        @media(max-width:720px) { .pp-preview-s1 { grid-template-columns: 1fr !important; gap: 20px !important; } }
      `}</style>

      <div
        className="pp-preview-modal"
        style={{ background: "#fff", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.28)", width: "100%", maxWidth: 1060, position: "relative", fontFamily: "'Montserrat',sans-serif", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#faf7f4", borderBottom: "1px solid #edddd0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <i className="fa-solid fa-eye" style={{ color: "#a67853", fontSize: "0.85rem", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</span>
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
          <div className="pp-preview-s1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

            {/* Left: Carousel + Resources (only when Diagram also exists) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <PreviewCarousel images={images} thumbnail={thumb} onImageClick={openLightbox} />
              {hasResources && hasSpec && (
                <div>
                  <PreviewSectionLabel text="Resources" />
                  <PreviewResourcesPanel files={files} />
                </div>
              )}
            </div>

            {/* Right: Brand, Name, Short Desc, Features, Diagram, Resources (if no Diagram) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {(product.brand || product.type) && (
                <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a67853", margin: 0 }}>
                  {[product.brand, product.type].filter(Boolean).join(" · ")}
                </p>
              )}
              <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "clamp(1.1rem,2vw,1.5rem)", color: "#2c1a0e", margin: 0, lineHeight: 1.2 }}>
                {product.name}
              </h2>
              {hasShortDesc && (
                <div style={{ paddingBottom: 16, borderBottom: "1px solid #edddd0" }}>
                  <div style={{ fontSize: "0.82rem", color: "#7a5c45", lineHeight: 1.6, whiteSpace: "pre-wrap", wordWrap: "break-word" }} dangerouslySetInnerHTML={{ __html: cleanPreviewHTML(product.short_description) }} />
                </div>
              )}
              {hasFeatures && (
                <div>
                  <PreviewSectionLabel text="Features" />
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                    {product.features.map((f, i) => (
                      <li key={i} style={{ color: "#5a4030", fontSize: "0.78rem", lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: 7 }}>
                        <i className="fa-solid fa-check" style={{ color: "#a67853", fontSize: "0.68rem", marginTop: 4, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!hasShortDesc && !hasFeatures && (
                <p style={{ color: "#a67853", fontStyle: "italic", fontSize: "0.86rem", margin: 0 }}>More details coming soon.</p>
              )}
              {hasSpec && (
                <div>
                  <PreviewSectionLabel text="Diagram" />
                  <PreviewCompactSpecImages images={specImages} onImageClick={openLightbox} />
                </div>
              )}
              {hasResources && !hasSpec && (
                <div>
                  <PreviewSectionLabel text="Resources" />
                  <PreviewResourcesPanel files={files} />
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
              <PreviewSectionLabel text="Specifications" />
              <div style={{ color: "#5a4030", lineHeight: 1.7, fontSize: "0.82rem", whiteSpace: "pre-wrap", wordWrap: "break-word" }} dangerouslySetInnerHTML={{ __html: cleanPreviewHTML(product.description) }} />
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
                  <PreviewSectionLabel text="Categories" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cats.map(c => (
                      <span key={c} style={{ padding: "4px 12px", background: "rgba(166,120,83,0.12)", color: "#7a5234", borderRadius: 20, fontSize: "0.73rem", fontWeight: 600, border: "1px solid rgba(166,120,83,0.25)" }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {tags.length > 0 && (
                <div>
                  <PreviewSectionLabel text="Tags" />
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
      </div>

      {lightbox && (
        <PreviewLightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function ProductCard({ p, onEdit, onDelete, onDuplicate, onPreview, perms, dataSource = "live" }) {
  const [hovered,  setHovered]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const productUrl = `${FRONT_URL || window.location.origin}/products/${p.slug}`;
  const showMenu = hovered && (dataSource === "local" || perms.can("products.edit") || perms.can("products.duplicate") || perms.can("products.delete"));

  return (
    <a href={dataSource === "local" ? undefined : productUrl} target={dataSource === "local" ? undefined : "_blank"} rel="noopener noreferrer"
      className="product-grid-card"
      style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", cursor: dataSource === "local" ? "default" : "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}>
      <div className="product-grid-thumb">
        {getImageUrl(p, 'thumbnail', dataSource)
          ? <img src={getImageUrl(p, 'thumbnail', dataSource)} alt={p.name} />
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
                {dataSource === "local" && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onPreview(p); }}>
                    <i className="fa-solid fa-eye" /> View
                  </button>
                )}
                {perms.can("products.edit") && dataSource === "live" && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onEdit(p); }}>
                    <i className="fa-solid fa-pen" /> Edit
                  </button>
                )}
                {perms.can("products.duplicate") && dataSource === "live" && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDuplicate(p); }}>
                    <i className="fa-solid fa-copy" /> Duplicate
                  </button>
                )}
                {perms.can("products.delete") && dataSource === "live" && (
                  <button type="button" className="danger" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDelete(p); }}>
                    <i className="fa-solid fa-trash" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="product-grid-info">
        <div className="product-grid-name product-name-link" style={{ textDecoration: "none", color: "inherit" }}>
          {p.name}
        </div>
        {(p.categories || []).length > 0 && (
          <div className="product-grid-pills">
            {(p.categories || []).slice(0, 2).map(c => <span key={c} className="tbl-pill tbl-pill-cat">{c}</span>)}
          </div>
        )}
        {(p.tags || []).length > 0 && (
          <div className="product-grid-pills">
            {(p.tags || []).slice(0, 3).map(t => <span key={t} className="tbl-pill tbl-pill-tag">{t}</span>)}
            {(p.tags || []).length > 3 && <span className="tbl-pill tbl-pill-more">+{p.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </a>
  );
}

// ─── Variant Manager Component ────────────────────────────────────────────────
function VariantManager({ variants, onChange, addToast }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newVariant, setNewVariant] = useState({
    sku: "", label: "", color_key: "", image: "", capacity_liters: "", is_default: false, status: "active"
  });
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const colorOptions = ["pine", "aspen", "cedar", "black", "white", "red"];

  const handleImageUpload = async (file, idx) => {
    setUploadingIdx(idx);
    try {
      const url = await uploadFileToSupabase(file, "product-images");
      // Convert Supabase URL to relative path for local storage
      const relativePath = supabaseUrlToRelativePath(url);
      if (idx === -1) {
        setNewVariant(v => ({ ...v, image: relativePath }));
      } else {
        onChange(variants.map((v, i) => i === idx ? { ...v, image: relativePath } : v));
      }
      addToast("✓ Image uploaded and synced to local data.", "success");
    } catch (err) {
      addToast("❌ Upload failed: " + err.message, "error");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.sku.trim()) {
      addToast("⚠️ SKU is required", "warning");
      return;
    }
    const variant = {
      ...newVariant,
      id: `new-${Date.now()}`,
      capacity_liters: parseFloat(newVariant.capacity_liters) || null,
    };
    onChange([...variants, variant]);
    setNewVariant({ sku: "", label: "", color_key: "", image: "", capacity_liters: "", is_default: false, status: "active" });
    setIsAdding(false);
    addToast("✓ Variant added.", "success");
  };

  const handleDeleteVariant = (idx) => {
    onChange(variants.filter((_, i) => i !== idx));
    addToast("✓ Variant removed.", "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {variants.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {variants.map((v, idx) => (
            <div key={v.id || idx} style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)", padding: 12, display: "grid",
              gridTemplateColumns: "80px 1fr 1fr 1fr 1fr 80px", gap: 10, alignItems: "center"
            }}>
              {/* Image */}
              <div style={{ position: "relative" }}>
                {v.image ? (
                  <div style={{ position: "relative", width: 60, height: 60, borderRadius: "var(--r-sm)", overflow: "hidden", background: "var(--surface)" }}>
                    <img src={v.image} alt="variant" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                    <label style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, hover: { opacity: 1 }, cursor: "pointer", fontSize: "0.7rem", color: "white" }}>
                      <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingIdx === idx} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], idx)} />
                      Change
                    </label>
                  </div>
                ) : (
                  <label style={{ width: 60, height: 60, border: "1px dashed var(--border)", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.7rem", color: "var(--text-3)" }}>
                    <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingIdx === idx} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], idx)} />
                    Upload
                  </label>
                )}
              </div>

              {/* SKU */}
              <input type="text" value={v.sku} onChange={e => onChange(variants.map((x, i) => i === idx ? { ...x, sku: e.target.value } : x))} placeholder="SKU (e.g., 347-PC)" className="form-input" style={{ fontSize: "0.8rem" }} />

              {/* Label */}
              <input type="text" value={v.label || ""} onChange={e => onChange(variants.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))} placeholder="Label (e.g., Pine)" className="form-input" style={{ fontSize: "0.8rem" }} />

              {/* Color */}
              <select value={v.color_key || ""} onChange={e => onChange(variants.map((x, i) => i === idx ? { ...x, color_key: e.target.value || null } : x))} className="form-select" style={{ fontSize: "0.8rem" }}>
                <option value="">Color</option>
                {colorOptions.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>

              {/* Capacity & Default */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="number" value={v.capacity_liters || ""} onChange={e => onChange(variants.map((x, i) => i === idx ? { ...x, capacity_liters: parseFloat(e.target.value) || null } : x))} placeholder="Cap" className="form-input" style={{ fontSize: "0.8rem", flex: 1 }} />
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={v.is_default} onChange={e => onChange(variants.map((x, i) => i === idx ? { ...x, is_default: e.target.checked } : x))} />
                  Default
                </label>
              </div>

              {/* Delete */}
              <button type="button" onClick={() => handleDeleteVariant(idx)} style={{ background: "var(--danger)", color: "white", border: "none", borderRadius: "var(--r-sm)", padding: "6px 8px", cursor: "pointer", fontSize: "0.8rem" }}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Variant Form */}
      {isAdding ? (
        <div style={{
          background: "var(--surface-2)", border: "2px dashed var(--border)",
          borderRadius: "var(--r-sm)", padding: 12, display: "grid",
          gridTemplateColumns: "80px 1fr 1fr 1fr 1fr 80px", gap: 10, alignItems: "center"
        }}>
          {/* Image upload */}
          <label style={{ width: 60, height: 60, border: "1px dashed var(--border)", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.7rem", color: "var(--text-3)" }}>
            <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingIdx === -1} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], -1)} />
            {uploadingIdx === -1 ? "Uploading..." : "Image"}
          </label>

          <input type="text" value={newVariant.sku} onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))} placeholder="SKU" className="form-input" style={{ fontSize: "0.8rem" }} />
          <input type="text" value={newVariant.label} onChange={e => setNewVariant(v => ({ ...v, label: e.target.value }))} placeholder="Label" className="form-input" style={{ fontSize: "0.8rem" }} />
          <select value={newVariant.color_key} onChange={e => setNewVariant(v => ({ ...v, color_key: e.target.value || "" }))} className="form-select" style={{ fontSize: "0.8rem" }}>
            <option value="">Color</option>
            {colorOptions.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <input type="number" value={newVariant.capacity_liters} onChange={e => setNewVariant(v => ({ ...v, capacity_liters: e.target.value }))} placeholder="Capacity" className="form-input" style={{ fontSize: "0.8rem" }} />

          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={handleAddVariant} style={{ background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--r-sm)", padding: "6px 8px", cursor: "pointer", fontSize: "0.8rem", flex: 1 }}>Save</button>
            <button type="button" onClick={() => setIsAdding(false)} style={{ background: "var(--text-3)", color: "white", border: "none", borderRadius: "var(--r-sm)", padding: "6px 8px", cursor: "pointer", fontSize: "0.8rem" }}>×</button>
          </div>
        </div>
      ) : (
        <Btn label="+ Add Variant" variant="secondary" size="sm" onClick={() => setIsAdding(true)} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Products({ currentUser }) {
  const perms = getPerms(currentUser);
  const { toasts, add, remove } = useToast();
  const { products: localProds, categories: localCats, tags: localTags, loading: localLoading } = useLocalProducts();

  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [allCats,    setAllCats]    = useState([]);
  const [allTags,    setAllTags]    = useState([]);
  const [allModels,  setAllModels]  = useState([]);

  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortDir,      setSortDir]      = useState("desc");
  const [viewMode,     setViewMode]     = useState("list");
  const [dataSource,   setDataSource]   = useState("live"); // "live" or "local"

  const [selected,              setSelected]              = useState(new Set());
  const [bulkConfirm,           setBulkConfirm]           = useState(false);
  const [bulkStatusValue,       setBulkStatusValue]       = useState("");

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  // editingFull: the complete DB row, kept for the audit trail strip
  const [editingFull, setEditingFull] = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [savedForm,   setSavedForm]   = useState(EMPTY_FORM);
  const [slugEdited,  setSlugEdited]  = useState(false);
  const [saving,      setSaving]      = useState(false);

  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const pendingClose = useRef(null);

  const [confirmDel, setConfirmDel] = useState(null);

  const [upThumb, setUpThumb] = useState(false);
  const [upImgs,  setUpImgs]  = useState(false);
  const [upSpec,  setUpSpec]  = useState(false);
  const [upFile,  setUpFile]  = useState(false);

  const [cleanupOpen, setCleanupOpen] = useState(false);

  const [modalMenuOpen, setModalMenuOpen] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [previewProduct, setPreviewProduct] = useState(null);

  const [checkSyncOpen, setCheckSyncOpen] = useState(false);
  const [syncCheckLoading, setSyncCheckLoading] = useState(false);
  const [syncCheckReport, setSyncCheckReport] = useState(null);
  const [syncCheckEvents, setSyncCheckEvents] = useState([]);
  const [syncCheckApplying, setSyncCheckApplying] = useState(false);

  const [variants, setVariants] = useState([]);
  const [loadedVariants, setLoadedVariants] = useState([]);

  const isDirty = !formsEqual(form, savedForm) || JSON.stringify(variants) !== JSON.stringify(loadedVariants);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let data = dataSource === "live" ? await getAllProductsLive() : localProds;
      if (filterStatus) data = data.filter(p => p.status === filterStatus);
      data.sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return sortDir === "asc" ? aTime - bTime : bTime - aTime;
      });
      setProducts(data || []);
      setSelected(new Set());
    } catch (err) { add(err.message, "error"); }
    finally { setLoading(false); }
  }, [filterStatus, sortDir, dataSource, localProds]); // eslint-disable-line

  const fetchMeta = useCallback(async () => {
    try {
      if (dataSource === "live") {
        const cats = await getAllCategoriesLive();
        const tags = await getAllTagsLive();
        const prods = await getAllProductsLive();
        setAllCats(cats.map(c => c.name));
        setAllTags(tags.map(t => t.name));
        const models = [...new Set(prods.map(p => p.type).filter(Boolean))].sort();
        setAllModels(models);
      } else {
        setAllCats(localCats);
        setAllTags(localTags);
        const models = [...new Set(localProds.map(p => p.type).filter(Boolean))].sort();
        setAllModels(models);
      }
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
    }
  }, [dataSource, localCats, localTags, localProds]); // eslint-disable-line

  useEffect(() => {
    if (dataSource === "live" || (dataSource === "local" && !localLoading)) {
      fetchProducts();
      fetchMeta();
    }
  }, [fetchProducts, fetchMeta, dataSource, localLoading]); // eslint-disable-line

  // ── Set default view for read-only users ────────────────────────────────────
  useEffect(() => {
    if (!perms.can("products.edit")) setViewMode("grid");
  }, []); // eslint-disable-line

  // ── Fetch revision history (logs) ───────────────────────────────────────────
  const fetchRevisions = async (productId) => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("entity_id", productId)
        .eq("entity", "product")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRevisions(data || []);
    } catch (err) {
      console.error("Failed to fetch revisions:", err);
      setRevisions([]);
    }
  };

  const upsertTaxonomy = async (items, table) => {
    if (!items.length) return;
    const rows = items.map(name => ({ name, slug: slugify(name) }));
    await supabase.from(table).upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
  };

  // ── Image / file uploads ───────────────────────────────────────────────────
  const handleThumbUpload = async file => {
    setUpThumb(true);
    try {
      const url = await uploadFileToSupabase(file, "product-images");
      // Delete old thumbnail if exists
      if (form.thumbnail && form.thumbnail !== url) {
        await deleteStorageUrls([form.thumbnail]).catch(err => {
          console.warn("[Products] Failed to delete old thumbnail:", err);
          // Don't fail the whole operation if deletion fails
        });
      }
      setForm(f => ({ ...f, thumbnail: url }));
      add("Thumbnail converted to WebP and uploaded.", "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpThumb(false); }
  };

  const uploadMoreImages = async files => {
    setUpImgs(true);
    try {
      const arr  = Array.isArray(files) ? files : [files];
      const urls = await Promise.all(arr.map(f => uploadFileToSupabase(f, "product-images")));
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      add(`${urls.length} image(s) converted to WebP and uploaded.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpImgs(false); }
  };

  const uploadSpecImages = async files => {
    setUpSpec(true);
    try {
      const arr  = Array.isArray(files) ? files : [files];
      const urls = await Promise.all(arr.map(f => uploadFileToSupabase(f, "product-images")));
      setForm(f => ({ ...f, spec_images: [...f.spec_images, ...urls] }));
      add(`${urls.length} spec image(s) converted to WebP and uploaded.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setUpSpec(false); }
  };

  const handleFileUpload = async file => {
    setUpFile(true);
    try {
      const url         = await uploadFileToSupabase(file, "product-pdf");
      const rawName     = file.name.replace(/\.pdf$/i, "");
      const displayName = rawName.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      setForm(f => ({ ...f, files: [...f.files, { name: displayName, url }] }));
      add("PDF uploaded.", "success");
    } catch (err) { add("PDF upload failed: " + err.message, "error"); }
    finally { setUpFile(false); }
  };

  const handleAddPdfUrl = async url => {
    setUpFile(true);
    try {
      const fileName    = url.split("/").pop().replace(/\.pdf$/i, "");
      const displayName = fileName.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      setForm(f => ({ ...f, files: [...f.files, { name: displayName, url }] }));
      add("PDF link added.", "success");
    } catch (err) { add("Error adding PDF link: " + err.message, "error"); }
    finally { setUpFile(false); }
  };

  const renameFile = (i, name) => setForm(f => ({ ...f, files: f.files.map((fi, idx) => idx === i ? { ...fi, name } : fi) }));

  // Remove file and delete from storage
  const removeFile = (i) => {
    const file = form.files[i];
    if (file?.url) {
      deleteStorageUrls([file.url]).catch(err => {
        console.warn("[Products] Failed to delete PDF from storage:", err);
        add("⚠️ Failed to delete PDF from storage. It may need manual cleanup.", "warning");
      });
    }
    setForm(f => ({ ...f, files: f.files.filter((_, idx) => idx !== i) }));
  };

  // Remove image and delete from storage
  const removeImageFile = (type, index) => {
    const array = form[type];
    const url = array[index];
    if (url) {
      deleteStorageUrls([url]).catch(err => {
        console.warn(`[Products] Failed to delete ${type} from storage:`, err);
        add(`⚠️ Failed to delete image from storage. It may need manual cleanup.`, "warning");
      });
    }
    setForm(f => ({ ...f, [type]: f[type].filter((_, idx) => idx !== index) }));
  };

  // ── Modal guard ────────────────────────────────────────────────────────────
  const actualClose = () => {
    setModalOpen(false); setEditing(null); setEditingFull(null);
    setShowRevisions(false); setModalMenuOpen(false);
    setUnsavedOpen(false); pendingClose.current = null;
    setVariants([]); setLoadedVariants([]);
  };
  const handleModalClose = () => { if (isDirty) { pendingClose.current = actualClose; setUnsavedOpen(true); } else actualClose(); };
  const handleUnsavedStay    = () => { setUnsavedOpen(false); pendingClose.current = null; };
  const handleUnsavedDiscard = () => { actualClose(); };

  // ── Open add / edit ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null); setEditingFull(null);
    setForm({ ...EMPTY_FORM }); setSavedForm({ ...EMPTY_FORM });
    setSlugEdited(false); setModalOpen(true);
  };

  const openEdit = async row => {
    try {
      const data = await getProductByIdLive(row.id);
      if (!data) throw new Error("Product not found");
      const loaded = {
        name:              data.name              || "",
        slug:              data.slug              || "",
        short_description: data.short_description || "",
        description:       data.description       || "",
        thumbnail:         data.thumbnail         || "",
        images:            data.images            || [],
        spec_images:       data.spec_images       || [],
        files:             data.files             || [],
        categories:        data.categories        || [],
        tags:              data.tags              || [],
        features:          data.features          || [],
        brand:             data.brand             || "SAWO",
        type:              data.type              || "",
        capacity_liters:   data.capacity_liters ? String(data.capacity_liters) : "",
        variant_type:      data.variant_type      || "",
        product_family:    data.product_family    || "",
        parent_product_id: data.parent_product_id || "",
        status:            data.status            || "published",
        visible:           data.visible           !== false,
        featured:          data.featured          || false,
        sort_order:        data.sort_order        || 0,
      };
      setForm(loaded);
      setSavedForm(loaded);
      setSlugEdited(true);
      setEditing(row);
      setEditingFull(data);   // full row → audit strip
      setShowRevisions(false);
      setModalMenuOpen(false);
      // Load variants for this product
      const { data: vData } = await supabase.from("product_variants").select("*").eq("product_id", row.id).order("sort_order");
      setVariants(vData || []);
      setLoadedVariants(JSON.parse(JSON.stringify(vData || [])));
      setModalOpen(true);
    } catch (err) { add(err.message, "error"); }
  };

  const openDuplicate = async row => {
    try {
      const data = await getProductByIdLive(row.id);
      if (!data) throw new Error("Product not found");

      // Generate new slug with "-copy" suffix
      const newSlug = `${data.slug}-copy`;

      const loaded = {
        name:              `${data.name || ""} (Copy)`,
        slug:              newSlug,
        short_description: data.short_description || "",
        description:       data.description       || "",
        thumbnail:         data.thumbnail         || "",
        images:            data.images            || [],
        spec_images:       data.spec_images       || [],
        files:             data.files             || [],
        categories:        data.categories        || [],
        tags:              data.tags              || [],
        features:          data.features          || [],
        brand:             data.brand             || "SAWO",
        type:              data.type              || "",
        capacity_liters:   data.capacity_liters ? String(data.capacity_liters) : "",
        variant_type:      data.variant_type      || "",
        product_family:    data.product_family    || "",
        parent_product_id: data.parent_product_id || "",
        status:            "draft",  // Set to draft for review
        visible:           true,
        featured:          false,
        sort_order:        0,
      };
      setForm(loaded);
      setSavedForm(EMPTY_FORM); // Not saved yet
      setSlugEdited(false);
      setEditing(null); // New product, not editing
      setEditingFull(null);
      setShowRevisions(false);
      setModalMenuOpen(false);
      setModalOpen(true);
      add("Duplicated! Remember to change the slug before saving.", "info");
    } catch (err) { add(err.message, "error"); }
  };

  // ── Sync from Supabase ─────────────────────────────────────────────────────
  const handleCheckSync = async () => {
    setSyncCheckLoading(true);
    setSyncCheckReport(null);
    setSyncCheckEvents([{ phase: "start", message: "Comparing Supabase with local files..." }]);
    try {
      const report = await checkSupabaseSync((event) => {
        setSyncCheckEvents(prev => [...prev, event]);
      });
      setSyncCheckReport(report);
      if (report.totalChanges === 0) {
        add("✓ Local files are in sync with Supabase!", "success");
      } else {
        add(`Found ${report.totalChanges} changes to review.`, "info");
      }
    } catch (err) {
      const errorMsg = `Sync check failed: ${err.message}`;
      setSyncCheckEvents(prev => [...prev, { phase: "error", message: errorMsg }]);
      add(errorMsg, "error");
    } finally {
      setSyncCheckLoading(false);
    }
  };

  const handleApplySyncChanges = async () => {
    if (!syncCheckReport) return;
    setSyncCheckApplying(true);
    try {
      const result = await applyLocalChanges(syncCheckReport, (event) => {
        setSyncCheckEvents(prev => [...prev, event]);
      });
      if (result.success && result.changes) {
        // Update local data - this will trigger a re-render
        add("✓ Local files updated successfully!", "success");
        // Refresh the products list
        setTimeout(() => fetchProducts(), 500);
      } else {
        add("Changes prepared but not yet saved to files.", "info");
      }
    } catch (err) {
      add(`Failed to apply changes: ${err.message}`, "error");
    } finally {
      setSyncCheckApplying(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async e => {
    e.preventDefault();
    if (!form.name) return add("Product name is required.", "error");
    if (!form.slug) return add("Slug is required.", "error");
    setSaving(true);
    try {
      const { kwTags, modelTags } = extractTagsFromDescription(form.description);
      const mergedTags = mergeAutoTags(form.tags, kwTags, modelTags);
      const newAutoTags = mergedTags.filter(t => !form.tags.includes(t));
      if (newAutoTags.length > 0) {
        add(`Auto-tagged: ${newAutoTags.join(", ")}`, "info");
        setForm(f => ({ ...f, tags: mergedTags }));
      }

      await upsertTaxonomy(form.categories, "categories");
      await upsertTaxonomy(mergedTags, "tags");
      fetchMeta();

      const now = new Date().toISOString();

      const payload = {
        name:              form.name.trim(),
        slug:              form.slug.trim(),
        short_description: form.short_description.trim() || null,
        description:       form.description.trim() || null,
        thumbnail:         form.thumbnail || null,
        images:            form.images,
        spec_images:       form.spec_images,
        files:             form.files,
        categories:        form.categories,
        tags:              mergedTags,
        features:          form.features,
        brand:             form.brand.trim()  || null,
        type:              form.type.trim()   || null,
        capacity_liters:   form.capacity_liters ? parseFloat(form.capacity_liters) : null,
        variant_type:      form.variant_type.trim() || null,
        product_family:    form.product_family.trim() || null,
        parent_product_id: form.parent_product_id.trim() || null,
        status:            form.status,
        visible:           form.visible,
        featured:          form.featured,
        sort_order:        form.sort_order,
        updated_at:              now,
        updated_by_username:     currentUser?.username || null,
        ...(currentUser && !editing ? { created_by_username: currentUser.username } : {}),
      };

      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;

        await logActivity({
          action:      "update",
          entity:      "product",
          entity_id:   editing.id,
          entity_name: form.name.trim(),
          username:    currentUser?.username,
          user_id:     currentUser?.id,
        });

        const orphans = findOrphanedUrls(savedForm, form);
        if (orphans.length) {
          try {
            await deleteStorageUrls(orphans);
            console.info(`[Products] Removed ${orphans.length} orphaned file(s).`);
            add(`Cleaned up ${orphans.length} removed file(s) from storage.`, "success");
          } catch (deleteErr) {
            console.error("[Products] Failed to delete orphaned files:", deleteErr);
            add(`⚠️ Failed to delete ${orphans.length} file(s) from storage. They may need manual cleanup.`, "warning");
          }
        }
      } else {
        // For new products, include local_variants in initial payload
        const newPayload = {
          ...payload,
          local_variants: variants.filter(v => v.sku).map(v => ({
            sku: v.sku?.trim(),
            label: v.label?.trim() || null,
            color_key: v.color_key || null,
            image: v.image || null,
            capacity_liters: v.capacity_liters ? parseFloat(v.capacity_liters) : null,
            is_default: !!v.is_default,
            sort_order: v.sort_order || 0,
            status: v.status || "active"
          }))
        };

        const { data: inserted, error } = await supabase
          .from("products").insert([newPayload]).select("id").single();
        if (error) throw error;

        await logActivity({
          action:      "create",
          entity:      "product",
          entity_id:   inserted?.id,
          entity_name: form.name.trim(),
          username:    currentUser?.username,
          user_id:     currentUser?.id,
        });

        // Add variants for new product
        const productId = inserted?.id;
        for (const v of variants) {
          if (v.sku) {
            const variantRow = {
              product_id: productId,
              sku: v.sku.trim(),
              label: v.label?.trim() || null,
              color_key: v.color_key || null,
              image: v.image || null,
              capacity_liters: v.capacity_liters ? parseFloat(v.capacity_liters) : null,
              is_default: !!v.is_default,
              sort_order: v.sort_order || 0,
              status: v.status || "active"
            };
            await supabase.from("product_variants").insert([variantRow]);
          }
        }
        setLoadedVariants(JSON.parse(JSON.stringify(variants)));
      }

      // Update variants for edited product
      if (editing && variants.length > 0) {
        const removedIds = loadedVariants.filter(v => !variants.find(nv => nv.id === v.id)).map(v => v.id).filter(id => !id.startsWith("new-"));
        if (removedIds.length) {
          await supabase.from("product_variants").delete().in("id", removedIds);
        }

        for (const v of variants) {
          if (!v.sku) continue;
          const variantRow = {
            product_id: editing.id,
            sku: v.sku.trim(),
            label: v.label?.trim() || null,
            color_key: v.color_key || null,
            image: v.image || null,
            capacity_liters: v.capacity_liters ? parseFloat(v.capacity_liters) : null,
            is_default: !!v.is_default,
            sort_order: v.sort_order || 0,
            status: v.status || "active"
          };

          if (v.id && !v.id.startsWith("new-")) {
            await supabase.from("product_variants").update(variantRow).eq("id", v.id);
          } else {
            await supabase.from("product_variants").insert([variantRow]);
          }
        }
        setLoadedVariants(JSON.parse(JSON.stringify(variants)));
      }

      // Sync local_variants to product for frontend access (no Supabase egress needed)
      if (variants.length > 0) {
        const localVariants = variants.map(v => ({
          id: v.id,
          sku: v.sku?.trim(),
          label: v.label?.trim() || null,
          color_key: v.color_key || null,
          image: v.image || null, // Already a relative path from upload conversion
          capacity_liters: v.capacity_liters ? parseFloat(v.capacity_liters) : null,
          is_default: !!v.is_default,
          sort_order: v.sort_order || 0,
          status: v.status || "active"
        }));
        const productId = editing?.id;
        if (productId) {
          await supabase.from("products").update({ local_variants: localVariants }).eq("id", productId);
        }
      }

      add(editing ? "Product saved." : "Product created.", "success");
      actualClose();
      fetchProducts();
    } catch (err) { add(err.message, "error"); }
    finally { setSaving(false); }
  };

  // ── Delete single ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const target = confirmDel;
    setConfirmDel(null);
    try {
      const fullProduct = await getProductByIdLive(target.id);
      if (!fullProduct) throw new Error("Product not found");
      const { error: delErr } = await supabase.from("products").delete().eq("id", target.id);
      if (delErr) throw delErr;
      await deleteProductStorageFiles(fullProduct);

      const deletedBy = currentUser?.username || "unknown";
      const deletedById = currentUser?.id || null;

      await logActivity({
        action:      "delete",
        entity:      "product",
        entity_id:   target.id,
        entity_name: target.name,
        username:    deletedBy,
        user_id:     deletedById,
        meta:        {
          deleted_files: (fullProduct?.files || []).length,
          had_images: (fullProduct?.images || []).length > 0,
        }
      });

      add("Product and associated files deleted.", "success");
    } catch (err) { add(err.message, "error"); }
    finally { fetchProducts(); }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    setBulkConfirm(false);
    try {
      const fullProducts = await Promise.all(ids.map(id => getProductByIdLive(id))).then(products => products.filter(p => p));
      const { error: delErr } = await supabase.from("products").delete().in("id", ids);
      if (delErr) throw delErr;
      await Promise.allSettled((fullProducts || []).map(p => deleteProductStorageFiles(p)));

      const deletedBy = currentUser?.username || "unknown";
      const deletedById = currentUser?.id || null;

      await Promise.allSettled((fullProducts || []).map(p =>
        logActivity({
          action: "delete", entity: "product",
          entity_id: p.id, entity_name: p.name,
          username: deletedBy, user_id: deletedById,
          meta: {
            bulk: true,
            deleted_files: (p.files || []).length,
            had_images: (p.images || []).length > 0,
          },
        })
      ));
      add(`${ids.length} product(s) and their files deleted.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setSelected(new Set()); fetchProducts(); }
  };

  // ── Bulk status change ─────────────────────────────────────────────────────────
  const handleBulkStatusChange = async () => {
    const ids = Array.from(selected);
    try {
      const { error } = await supabase
        .from("products")
        .update({ status: bulkStatusValue })
        .in("id", ids);
      if (error) throw error;

      const changedBy = currentUser?.username || "unknown";
      const changedById = currentUser?.id || null;

      await Promise.allSettled(ids.map(id => {
        const prod = products.find(p => p.id === id);
        return logActivity({
          action: "update", entity: "product",
          entity_id: id, entity_name: prod?.name || "Unknown",
          username: changedBy, user_id: changedById,
          meta: {
            bulk: true,
            field: "status",
            old_value: prod?.status,
            new_value: bulkStatusValue,
          },
        });
      }));

      add(`${ids.length} product(s) status changed to ${bulkStatusValue}.`, "success");
    } catch (err) { add(err.message, "error"); }
    finally { setSelected(new Set()); setBulkStatusValue(""); fetchProducts(); }
  };

  const toggleSelect = id => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      (p.categories || []).some(c => c.toLowerCase().includes(q)) ||
      (p.tags       || []).some(t => t.toLowerCase().includes(q))
    );
  });

  const handleNameChange = e => {
    const name = e.target.value;
    setForm(f => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }));
  };

  const productUrl = slug => `${FRONT_URL || window.location.origin}/products/${slug}`;

  const formatDate = d => d
    ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "-";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="products-page">
      <Toast toasts={toasts} remove={remove} />
      <UnsavedConfirm open={unsavedOpen} onStay={handleUnsavedStay} onDiscard={handleUnsavedDiscard} />

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-box" style={{ marginRight: "0.5rem", color: "var(--brand)" }} />
            Products
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
            <div style={{ display: "flex", gap: 0, borderRadius: 4, border: "1px solid var(--border)" }}>
              {[
                { id: "live", label: "Live", icon: "fa-cloud" },
                { id: "local", label: "Local", icon: "fa-folder" }
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
                    gap: 6
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
                title="Syncs products from Supabase to local — compares added, updated, and deleted items, then lets you apply the changes"
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
              {(loading || (dataSource === "local" && localLoading)) ? "Loading..." : `${filtered.length} of ${products.length} products`}
            </p>
          </div>
        </div>
      </div>

      {/* Local Mode Notice */}
      {dataSource === "local" && (
        <>
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
            gap: 8
          }}>
            <i className="fa-solid fa-circle-info" style={{ fontSize: "1em" }} />
            <span>Viewing <strong>locally saved products</strong> — this is read-only. Switch to Live to edit.</span>
          </div>

        </>
      )}

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, brand, tag..." />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
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
        {perms.can("products.bulk_delete") && dataSource === "live" && selected.size > 0 && (
          <>
            <select className="filter-select" value={bulkStatusValue} onChange={e => {
              setBulkStatusValue(e.target.value);
              handleBulkStatusChange();
            }}>
              <option value="" disabled>Change Status ({selected.size})</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button type="button" className="btn btn-sm"
              style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)", gap: 5 }}
              onClick={() => setBulkConfirm(true)}>
              <i className="fa-solid fa-trash" /> Delete {selected.size}
            </button>
          </>
        )}
        {perms.can("products.storage_cleanup") && (
          <button
            type="button"
            onClick={() => setCleanupOpen(true)}
            title="Storage Cleanup — Remove orphaned files. Scans both image and PDF storage buckets to find and delete files that aren't attached to any product. Safe to run anytime."
            className="icon-btn"
            style={{ marginLeft: 4 }}
          >
            <i className="fa-solid fa-broom" style={{ fontSize: "0.85em" }} />
          </button>
        )}
        {perms.can("products.create") && dataSource === "live" && (
          <Btn icon="fa-plus" label="New Product" onClick={openCreate} style={{ marginLeft: "auto" }} />
        )}
      </div>

      {/* Grid View */}
      {!loading && viewMode === "grid" && (
        <div className="product-grid">
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text-3)", fontStyle: "italic", fontSize: "0.82rem" }}>
              {search ? `No products match "${search}"` : "No products yet — click New Product to create one."}
            </div>
          )}
          {filtered.map(p => <ProductCard key={p.id} p={p} onEdit={openEdit} onDuplicate={openDuplicate} onDelete={setConfirmDel} onPreview={setPreviewProduct} perms={perms} dataSource={dataSource} />)}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="products-table-wrap">
          {loading ? (
            <div className="table-loading">
              <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading...
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  {perms.can("products.bulk_delete") && dataSource === "live" && (
                    <th style={{ width: 36, paddingRight: 0 }}>
                      <input type="checkbox" className="tbl-checkbox"
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        onChange={toggleSelectAll} />
                    </th>
                  )}
                  <th style={{ width: 44 }}></th>
                  <th>Product</th>
                  <th>Categories</th>
                  <th>Tags</th>
                  <th>Status</th>
                  <th style={{ width: 100 }}>Created Date</th>
                  <th style={{ width: 110 }}>Created By</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={perms.can("products.bulk_delete") && dataSource === "live" ? 9 : 8} className="table-empty">
                    {search ? `No products match "${search}"` : "No products yet — click New Product to create one."}
                  </td></tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id} className={selected.has(p.id) ? "row-selected" : ""}>
                    {perms.can("products.bulk_delete") && dataSource === "live" && (
                      <td style={{ paddingRight: 0 }}>
                        <input type="checkbox" className="tbl-checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                      </td>
                    )}
                    <td style={{ width: 44 }}>
                      {getImageUrl(p, 'thumbnail', dataSource)
                        ? <img src={getImageUrl(p, 'thumbnail', dataSource)} alt="" className="product-thumb" />
                        : <div className="product-thumb-placeholder"><i className="fa-regular fa-image" /></div>
                      }
                    </td>
                    <td>
                      <a href={productUrl(p.slug)} target="_blank" rel="noopener noreferrer" className="product-name-link">
                        {p.name}
                      </a>
                      <div className="product-meta">
                        {p.featured && <span className="product-meta-tag featured"><i className="fa-solid fa-star" style={{ marginRight: 3 }} />Featured</span>}
                        {(p.files || []).length > 0 && <span className="product-meta-tag files"><i className="fa-solid fa-file-pdf" style={{ marginRight: 3 }} />{p.files.length} file(s)</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {(p.categories || []).slice(0, 2).map(c => <span key={c} className="tbl-pill tbl-pill-cat">{c}</span>)}
                        {(p.categories || []).length > 2 && <span className="tbl-pill tbl-pill-more">+{p.categories.length - 2}</span>}
                        {!(p.categories || []).length && <span style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>-</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {(p.tags || []).slice(0, 3).map(t => <span key={t} className="tbl-pill tbl-pill-tag">{t}</span>)}
                        {(p.tags || []).length > 3 && <span className="tbl-pill tbl-pill-more">+{p.tags.length - 3}</span>}
                        {!(p.tags || []).length && <span style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>-</span>}
                      </div>
                    </td>
                    <td>
                      <span className="tbl-status">{!p.visible ? "Hidden" : p.status === "published" ? "Published" : "Draft"}</span>
                    </td>
                    <td className="tbl-date" style={{ fontSize: "0.75rem" }}>
                      {formatDate(p.created_at)}
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
                      {p.created_by_username ? `@${p.created_by_username}` : "-"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions">
                        {dataSource === "local" && (
                          <IconBtn icon="fa-eye" title="Preview" onClick={() => setPreviewProduct(p)} />
                        )}
                        {perms.can("products.edit") && dataSource === "live" && (
                          <IconBtn icon="fa-pen" title="Edit" onClick={() => openEdit(p)} />
                        )}
                        {perms.can("products.duplicate") && dataSource === "live" && (
                          <IconBtn icon="fa-copy" title="Duplicate" onClick={() => openDuplicate(p)} />
                        )}
                        {perms.can("products.delete") && dataSource === "live" && (
                          <IconBtn icon="fa-trash" title="Delete" onClick={() => setConfirmDel(p)} danger />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Product Form Modal ── */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        title={editing ? `Edit: ${editing.name}` : "New Product"}
        wide
        actions={(
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="submit"
              form="product-form"
              disabled={saving}
              style={{
                padding: "6px 12px",
                fontSize: "0.8rem",
                fontWeight: 500,
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
                transition: "opacity 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={e => !saving && (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => !saving && (e.currentTarget.style.opacity = "1")}
            >
              <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`} />
              {editing ? "Save Changes" : "Create Product"}
            </button>
            {editing && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setModalMenuOpen(m => !m); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "4px 8px", fontSize: "1rem", color: "var(--text-2)",
                    borderRadius: "var(--r-sm)", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <i className="fa-solid fa-ellipsis-vertical" />
                </button>

                {modalMenuOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", right: 0,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--r-sm)", padding: "4px 0",
                    minWidth: 150, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    zIndex: 1100,
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRevisions(true);
                        setModalMenuOpen(false);
                        fetchRevisions(editing.id);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        width: "100%", padding: "9px 14px",
                        background: "none", border: "none",
                        textAlign: "left", cursor: "pointer",
                        fontSize: "0.8rem", color: "var(--text)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <i className="fa-solid fa-clock-rotate-left" style={{ color: "var(--brand)", fontSize: "0.75rem" }} />
                      Revisions
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalMenuOpen(false);
                        setConfirmDel(editing);
                        handleModalClose();
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        width: "100%", padding: "9px 14px",
                        background: "none", border: "none",
                        textAlign: "left", cursor: "pointer",
                        fontSize: "0.8rem", color: "var(--danger)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <i className="fa-solid fa-trash" style={{ fontSize: "0.75rem" }} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      >

        {/* Show either revision history or form */}
        {showRevisions && editing ? (
          <div>
            <button
              type="button"
              onClick={() => setShowRevisions(false)}
              style={{
                marginBottom: 16,
                padding: "8px 12px",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.78rem",
                color: "var(--text-2)",
              }}
            >
              <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
              Back
            </button>
            <div>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>Revisions</h3>
              {revisions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px", color: "var(--text-3)", fontSize: "0.75rem" }}>
                  No revisions recorded yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {revisions.map(rev => (
                    <div
                      key={rev.id}
                      style={{
                        padding: "10px 12px",
                        background: "var(--surface-2)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {rev.action === "create" && <i className="fa-solid fa-plus" style={{ color: "#22c55e", fontSize: "0.7rem" }} />}
                          {rev.action === "update" && <i className="fa-solid fa-pen" style={{ color: "var(--brand)", fontSize: "0.7rem" }} />}
                          {rev.action === "delete" && <i className="fa-solid fa-trash" style={{ color: "#ef4444", fontSize: "0.7rem" }} />}
                          <span style={{ fontWeight: 500, color: "var(--text)" }}>
                            {rev.action === "create" ? "Created" : rev.action === "update" ? "Updated" : "Deleted"}
                          </span>
                        </div>
                        <span style={{ color: "var(--text-3)" }}>
                          {new Date(rev.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-2)", fontSize: "0.7rem" }}>
                        @{rev.username || "unknown"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {isDirty && (
              <div className="dirty-banner">
                <i className="fa-solid fa-circle-dot" style={{ fontSize: "0.6rem" }} />
                You have unsaved changes
              </div>
            )}

            <form id="product-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Featured Image & Gallery */}
          <div className="responsive-grid-2">
            {/* Featured Image — Left */}
            <div>
              <SectionLabel label="Featured Image" />
              {form.thumbnail ? (
                <ThumbnailPreview
                  url={form.thumbnail}
                  onRemove={() => {
                    if (form.thumbnail) {
                      deleteStorageUrls([form.thumbnail]).catch(err => {
                        console.warn("[Products] Failed to delete thumbnail from storage:", err);
                        add("⚠️ Failed to delete thumbnail from storage. It may need manual cleanup.", "warning");
                      });
                    }
                    setForm(f => ({ ...f, thumbnail: "" }));
                  }}
                  onReplace={handleThumbUpload}
                  uploading={upThumb}
                />
              ) : (
                <ThumbnailUploader onUpload={handleThumbUpload} uploading={upThumb} />
              )}
            </div>

            {/* Gallery Images — Right */}
            <div>
              <SectionLabel label="Gallery Images" />
              {form.images.length > 0 ? (
                <>
                  <SmartImageGallery images={form.images} isSingle onRemove={i => removeImageFile("images", i)} />
                  <AddMoreImagesButton label="Add More Images" uploading={upImgs}
                    onChange={e => e.target.files?.length && uploadMoreImages(Array.from(e.target.files))} />
                </>
              ) : (
                <ImageUploader onUpload={uploadMoreImages} label="Add Gallery Images" multiple uploading={upImgs} />
              )}
            </div>
          </div>

          {/* Basic Info */}
          <SectionLabel label="Basic Info" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Product Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Nordex 9kW" required />
            <Field label="Slug" value={form.slug}
              onChange={e => { setSlugEdited(true); setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })); }}
              placeholder="nordex-9kw" required helper="Auto-generated and editable" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Brand" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="SAWO" />
            <ModelSelect label="Type / Model" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} placeholder="Premium Series" suggestions={allModels} />
          </div>

          {/* Variant fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Capacity (liters)" type="number" value={form.capacity_liters} onChange={e => setForm(f => ({ ...f, capacity_liters: e.target.value }))} placeholder="e.g. 4, 9, 18" />
            <Field label="Variant Type" value={form.variant_type} onChange={e => setForm(f => ({ ...f, variant_type: e.target.value }))} placeholder="e.g. material, color, size" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Product Family" value={form.product_family} onChange={e => setForm(f => ({ ...f, product_family: e.target.value }))} placeholder="e.g. dragon-pail, wooden-pail-381" helper="Group related product variants" />
            <Field label="Parent Product ID" value={form.parent_product_id} onChange={e => setForm(f => ({ ...f, parent_product_id: e.target.value }))} placeholder="UUID of parent product" helper="For accessories linked to parent product" />
          </div>

          {/* Variants */}
          <SectionLabel label="Variants" />
          <VariantManager variants={variants} onChange={setVariants} addToast={add} />

          {/* Features ← above Short Description */}
          <SectionLabel label="Features" />
          <PillInput label="Features" value={form.features}
            onChange={v => setForm(f => ({ ...f, features: v }))} placeholder="e.g. Auto shutoff, Stainless steel" />

          {/* Product Description */}
          <SectionLabel label="Product Description" />
          <RichField label="Product Description" value={form.short_description}
            onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} rows={4} onNotify={add} />

          {/* Categories & Tags */}
          <SectionLabel label="Categories & Tags" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <PillInput label="Categories" value={form.categories}
              onChange={v => setForm(f => ({ ...f, categories: v }))} placeholder="e.g. Wall-Mounted" suggestions={allCats} />
            <PillInput label="Tags" value={form.tags}
              onChange={v => setForm(f => ({ ...f, tags: v }))}
              placeholder="e.g. electric, 9kW" suggestions={allTags} />
          </div>

          {/* Tag Suggestions from Name */}
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

          {/* Specifications */}
          <RichField label="Specifications" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} onNotify={add} />
          <AutoTagPreview description={form.description} currentTags={form.tags} />

          {/* Spec Diagram Images & Resources (PDFs) */}
          <div className="responsive-grid-2">
            {/* Spec / Diagram Images — Left */}
            <div>
              <SectionLabel label="Spec / Diagram Images" />
              {form.spec_images.length > 0 ? (
                <>
                  <SmartImageGallery images={form.spec_images} isSingle onRemove={i => removeImageFile("spec_images", i)} />
                  <AddMoreImagesButton label="Add More Spec Images" uploading={upSpec}
                    onChange={e => e.target.files?.length && uploadSpecImages(Array.from(e.target.files))} />
                </>
              ) : (
                <ImageUploader onUpload={uploadSpecImages} label="Add Spec Images" multiple uploading={upSpec} />
              )}
            </div>

            {/* Resources (PDFs) — Right */}
            <div>
              <SectionLabel label="Resources (PDFs)" />
              {form.files.length > 0 ? (
                <>
                  <SmartFileDisplay files={form.files} isSingle onRemove={removeFile} onRename={renameFile} />
                  <AddMorePdfsButton label="Add More PDFs" uploading={upFile}
                    onUploadFile={handleFileUpload} onAddUrl={handleAddPdfUrl} />
                </>
              ) : (
                <PdfUploader onUploadFile={handleFileUpload} onAddUrl={handleAddPdfUrl} uploading={upFile} />
              )}
            </div>
          </div>

          {/* Status & Visibility */}
          <SectionLabel label="Status & Visibility" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "start" }}>
            <SelectField label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }]} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 20 }}>
              <Toggle label="Visible"  checked={form.visible}  onChange={v => setForm(f => ({ ...f, visible: v }))} helper="Show on website" />
              <Toggle label="Featured" checked={form.featured} onChange={v => setForm(f => ({ ...f, featured: v }))} />
            </div>
            <Field label="Sort Order" type="number" value={String(form.sort_order)}
              onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} helper="Lower = shown first" />
          </div>

          {/* ── Record Info (audit trail) — only shown when editing ── */}
          {editing && editingFull && (
            <>
              <SectionLabel label="Record Info" />
              <ProductAuditStrip product={editingFull} />
            </>
          )}

          {/* New product author notice */}
          {!editing && currentUser && (
            <div className="created-by-notice">
              <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6 }} />
              Will be created by <strong>@{currentUser.username}</strong>
            </div>
          )}

            </form>
          </>
        )}
      </Modal>

      {/* Storage Cleanup */}
      <StorageCleanupModal open={cleanupOpen} onClose={() => setCleanupOpen(false)} addToast={add} />

      {/* Bulk delete confirm */}
      <Confirm open={bulkConfirm} onClose={() => setBulkConfirm(false)} onConfirm={handleBulkDelete}
        title="Delete Selected?"
        message={`Delete ${selected.size} selected product(s)? This cannot be undone. All associated images and files will also be removed.`}
        confirmLabel="Delete All" />

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete Product?"
        message={`Delete "${confirmDel?.name}"? This cannot be undone. All associated images and files will also be removed.`}
        confirmLabel="Delete" />

      {previewProduct && (
        <ProductPreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />
      )}

      <CheckSyncModal
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

function CheckSyncModal({ open, loading, report, events, onClose, onApply, applying }) {
  const [expandedId, setExpandedId] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  // Auto-close modal after successful sync
  useEffect(() => {
    const hasChanges = report && report.totalChanges > 0;
    const lastEvent = events[events.length - 1];
    const wasApplied = !applying && !loading && hasChanges && events.some(e => e.phase === "applying") && lastEvent?.phase === "complete";

    if (wasApplied) {
      const timer = setTimeout(() => {
        onClose();
      }, 1800); // 1.8 seconds to show success message
      return () => clearTimeout(timer);
    }
  }, [applying, loading, report, events, onClose]);

  if (!open) return null;

  const hasChanges = report && report.totalChanges > 0;
  const lastEvent = events[events.length - 1];
  const isError = lastEvent?.phase === "error";

  // ── Check phase steps ─────────────────────────────────────────────────────
  const checkSteps = [
    { key: "fetching",  label: "Fetch Supabase data",  icon: "fa-cloud-arrow-down" },
    { key: "loading",   label: "Load local files",      icon: "fa-folder-open" },
    { key: "cmp_prods", label: "Compare products",      icon: "fa-box" },
    { key: "cmp_cats",  label: "Compare categories",    icon: "fa-folder" },
    { key: "cmp_tags",  label: "Compare tags",          icon: "fa-tag" },
    { key: "complete",  label: "Analysis complete",     icon: "fa-circle-check" },
  ];
  const checkOrder = ["fetching", "loading", "cmp_prods", "cmp_cats", "cmp_tags", "complete"];
  const checkPct   = { fetching: 15, loading: 35, cmp_prods: 58, cmp_cats: 75, cmp_tags: 90, complete: 100 };

  const normCheckEvts = events.map(ev => {
    if (ev.phase === "comparing") {
      if (/product/i.test(ev.message))  return "cmp_prods";
      if (/categor/i.test(ev.message))  return "cmp_cats";
      if (/tag/i.test(ev.message))      return "cmp_tags";
    }
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

  // ── Apply phase steps ─────────────────────────────────────────────────────
  const applySteps = [
    { key: "applying",  label: "Process changes",        icon: "fa-gears" },
    { key: "writing",   label: "Send to backend",         icon: "fa-upload" },
    { key: "start",     label: "Initialize",              icon: "fa-play" },
    { key: "clone",     label: "Clone repository",        icon: "fa-code-branch" },
    { key: "write",     label: "Write files",             icon: "fa-file-pen" },
    { key: "git",       label: "Commit & push",           icon: "fa-code-commit" },
    { key: "complete",  label: "Complete",                icon: "fa-circle-check" },
  ];
  const applyOrder = ["applying", "writing", "start", "clone", "write", "git", "complete"];
  const applyPct   = { applying: 10, writing: 26, start: 38, clone: 55, write: 73, git: 88, complete: 100 };

  const applyStartIdx = events.findIndex(e => e.phase === "applying");
  const applyEvts     = applyStartIdx >= 0 ? events.slice(applyStartIdx) : [];
  const applyPhasesSeen = applyEvts.map(e => e.phase);
  let curApplyKey = "";
  for (const k of applyOrder.slice().reverse()) {
    if (applyPhasesSeen.includes(k)) { curApplyKey = k; break; }
  }
  if (isError && applyEvts.length > 0) curApplyKey = "error";
  const applyProgress = applyPct[curApplyKey] || 5;

  const applyStepStatus = key => {
    const ki = applyOrder.indexOf(key), ci = applyOrder.indexOf(curApplyKey);
    if (isError && applyEvts.some(e => e.phase === "error") && ki === ci) return "error";
    if (ki < ci) return "done";
    if (ki === ci) return "active";
    return "pending";
  };

  // Detect successful apply (for success banner after applying=false)
  const wasApplied = !applying && !loading && applyEvts.length > 0 && lastEvent?.phase === "complete";

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderProgressBar = (pct, err) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>Progress</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: err ? "var(--danger)" : "var(--brand)", transition: "color 0.3s" }}>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: err ? "var(--danger)" : "var(--brand)",
          borderRadius: 4,
          transition: "width 0.65s cubic-bezier(0.4,0,0.2,1)",
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
              boxShadow: active ? "0 0 0 3px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.3s ease",
            }}>
              {done  ? <i className="fa-solid fa-check" /> :
               active ? <i className="fa-solid fa-spinner" style={{ animation: "spin 1s linear infinite" }} /> :
               err   ? <i className="fa-solid fa-xmark" /> :
               <i className={`fa-solid ${step.icon}`} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: active ? 600 : 400, color: done ? "var(--text)" : err ? "var(--danger)" : active ? "var(--brand)" : "var(--text-3)", lineHeight: 1.3 }}>
                {step.label}
              </div>
              {active && activeMsg && (
                <div style={{ fontSize: "0.67rem", color: "var(--text-3)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeMsg}
                </div>
              )}
            </div>
            {done && <i className="fa-solid fa-check" style={{ fontSize: "0.65rem", color: "var(--brand)", flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
  );

  const renderLog = (evs) => (
    <div>
      <div style={{ fontSize: "0.67rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: 5 }}>
        Activity log
      </div>
      <div ref={logRef} style={{ maxHeight: 150, overflowY: "auto", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
        {evs.length === 0 && <span style={{ fontSize: "0.72rem", color: "var(--text-3)", fontStyle: "italic" }}>Waiting…</span>}
        {evs.map((ev, i) => {
          const evErr  = ev.phase === "error";
          const evDone = ev.phase === "complete";
          const evWarn = ev.warning;
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "0.72rem", lineHeight: 1.45 }}>
              <i className={`fa-solid ${evErr ? "fa-circle-xmark" : evDone ? "fa-circle-check" : evWarn ? "fa-triangle-exclamation" : "fa-circle-dot"}`}
                style={{ color: evErr ? "var(--danger)" : evDone ? "var(--success,#22c55e)" : evWarn ? "var(--warning,#f59e0b)" : "var(--text-3)", fontSize: "0.65em", marginTop: 3, flexShrink: 0 }} />
              <span style={{ color: evErr ? "var(--danger)" : evWarn ? "var(--warning,#f59e0b)" : "var(--text-2)", wordBreak: "break-word", flex: 1 }}>
                {ev.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const DiffRow = ({ field, diff }) => {
    const isExpanded = expandedId === field;
    return (
      <div style={{ marginBottom: 8, borderLeft: "2px solid var(--border)", paddingLeft: 8 }}>
        <button
          type="button"
          onClick={() => setExpandedId(isExpanded ? null : field)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-2)",
            cursor: "pointer",
            fontSize: "0.8rem",
            padding: "4px 0",
            textAlign: "left",
            width: "100%",
          }}
        >
          <i className={`fa-solid fa-${isExpanded ? "chevron-down" : "chevron-right"}`} style={{ marginRight: 6, fontSize: "0.7em" }} />
          {field}: {typeof diff[field].local === "string" && diff[field].local.length > 40 ? `${diff[field].local.substring(0, 40)}...` : String(diff[field].local).substring(0, 40)}
        </button>
        {isExpanded && (
          <div style={{ padding: "8px", background: "var(--surface-3)", borderRadius: 4, marginTop: 4, fontSize: "0.75rem", fontFamily: "monospace" }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: "var(--text-3)" }}>Current (Local):</span>
              <div style={{ color: "#ff6b6b", marginTop: 2, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 100, overflow: "auto" }}>
                {typeof diff[field].local === "object" ? JSON.stringify(diff[field].local, null, 2) : String(diff[field].local)}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--text-3)" }}>New (Supabase):</span>
              <div style={{ color: "#51cf66", marginTop: 2, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 100, overflow: "auto" }}>
                {typeof diff[field].supabase === "object" ? JSON.stringify(diff[field].supabase, null, 2) : String(diff[field].supabase)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001 }}>
      <style>{`@keyframes csmShimmer{from{transform:translateX(-100%)}to{transform:translateX(250%)}}`}</style>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          maxWidth: "720px",
          width: "92%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: "1.3rem" }}>
              {(loading || applying)
                ? <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "var(--brand)" }} />
                : isError ? "❌" : (hasChanges ? "⚠️" : "✅")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                {loading ? "Checking Sync…" : applying ? "Applying Changes…" : isError ? "Error" : (hasChanges ? "Changes Found" : "In Sync")}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {(loading || applying)
                  ? (lastEvent?.message || "Processing…")
                  : (report?.summary || "")}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", overflow: "auto", flex: 1, fontSize: "0.85rem" }}>
          {loading ? (
            <div>
              {renderProgressBar(checkProgress, isError)}
              {renderSteps(checkSteps, checkStepStatus, lastEvent?.message)}
              {renderLog(events)}
            </div>
          ) : applying ? (
            <div>
              {renderProgressBar(applyProgress, isError)}
              {renderSteps(applySteps, applyStepStatus, applyEvts[applyEvts.length - 1]?.message)}
              {renderLog(events)}
            </div>
          ) : report ? (
            <div>
              {wasApplied && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, marginBottom: 16 }}>
                  <i className="fa-solid fa-circle-check" style={{ color: "#22c55e", fontSize: "1rem" }} />
                  <span style={{ fontSize: "0.82rem", color: "var(--text)", fontWeight: 500 }}>Changes applied successfully — local files are now up to date.</span>
                </div>
              )}
              {report.products?.added?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, color: "var(--brand)", marginBottom: 8 }}>✨ Added Products ({report.products.added.length})</div>
                  {report.products.added.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ padding: "4px 12px", fontSize: "0.8rem", color: "var(--text-2)" }}>• {item.item.name}</div>
                  ))}
                  {report.products.added.length > 5 && <div style={{ padding: "4px 12px", fontSize: "0.8rem", color: "var(--text-3)" }}>... and {report.products.added.length - 5} more</div>}
                </div>
              )}
              {report.products?.updated?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, color: "var(--warning,#b8860b)", marginBottom: 8 }}>🔄 Updated Products ({report.products.updated.length})</div>
                  {report.products.updated.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ padding: "8px 12px", backgroundColor: "var(--surface-3)", borderRadius: 4, marginBottom: 6 }}>
                      <div style={{ fontWeight: 500, marginBottom: 6, color: "var(--text)" }}>{item.item.name}</div>
                      {item.diff && Object.keys(item.diff).length > 0
                        ? Object.keys(item.diff).map(field => <DiffRow key={field} field={field} diff={item.diff} />)
                        : <div style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>No visible differences</div>}
                    </div>
                  ))}
                  {report.products.updated.length > 5 && <div style={{ padding: "4px 12px", fontSize: "0.8rem", color: "var(--text-3)" }}>... and {report.products.updated.length - 5} more</div>}
                </div>
              )}
              {report.products?.deleted?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, color: "var(--error,#e74c3c)", marginBottom: 8 }}>🗑️ Deleted from Supabase ({report.products.deleted.length}) — Will be removed</div>
                  {report.products.deleted.slice(0, 5).map((item, i) => (
                    <div key={i} style={{ padding: "4px 12px", fontSize: "0.8rem", color: "var(--text-2)" }}>• {item.item.name}</div>
                  ))}
                  {report.products.deleted.length > 5 && <div style={{ padding: "4px 12px", fontSize: "0.8rem", color: "var(--text-3)" }}>... and {report.products.deleted.length - 5} more</div>}
                </div>
              )}
              {(report.categories?.added?.length > 0 || report.categories?.updated?.length > 0) && (
                <div style={{ marginBottom: 14, paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
                  <div style={{ fontWeight: 600, color: "var(--brand)", marginBottom: 8, fontSize: "0.9rem" }}>📁 Categories</div>
                  {report.categories?.added?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--brand)", marginBottom: 4 }}>✨ Added ({report.categories.added.length})</div>
                      {report.categories.added.slice(0, 5).map((c, i) => (
                        <div key={i} style={{ fontSize: "0.8rem", color: "var(--text-2)", padding: "2px 12px" }}>• {c.item.name}</div>
                      ))}
                    </div>
                  )}
                  {report.categories?.updated?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "var(--warning,#b8860b)", marginBottom: 4 }}>🔄 Updated ({report.categories.updated.length})</div>
                      {report.categories.updated.slice(0, 5).map((item, i) => (
                        <div key={i} style={{ padding: "6px 12px", backgroundColor: "var(--surface-3)", borderRadius: 4, marginBottom: 4, fontSize: "0.8rem" }}>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.item.name}</div>
                          {item.diff && Object.keys(item.diff).length > 0
                            ? Object.keys(item.diff).slice(0, 3).map(field => <div key={field} style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Changed: {field}</div>)
                            : <div style={{ fontSize: "0.75rem", color: "var(--text-3)", fontStyle: "italic" }}>Minor metadata changes</div>}
                          {item.diff && Object.keys(item.diff).length > 3 && <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>... and {Object.keys(item.diff).length - 3} more</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {(report.tags?.added?.length > 0 || report.tags?.updated?.length > 0) && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, color: "var(--brand)", marginBottom: 8, fontSize: "0.9rem" }}>
                    🏷️ Tags ({(report.tags?.added?.length || 0) + (report.tags?.updated?.length || 0)})
                  </div>
                  {report.tags?.added?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--brand)", marginBottom: 4 }}>✨ Added ({report.tags.added.length})</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-2)", padding: "4px 12px", wordBreak: "break-word" }}>{report.tags.added.map(t => t.item.name).join(", ")}</div>
                    </div>
                  )}
                  {report.tags?.updated?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "var(--warning,#b8860b)", marginBottom: 4 }}>
                        🔄 Updated ({report.tags.updated.length}) — {report.tags.updated.every(t => !t.diff || Object.keys(t.diff).length === 0) ? "metadata only" : "has meaningful changes"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-2)", padding: "4px 12px", wordBreak: "break-word" }}>{report.tags.updated.map(t => t.item.name).join(", ")}</div>
                    </div>
                  )}
                </div>
              )}
              {!hasChanges && (
                <div style={{ padding: "12px", textAlign: "center", color: "var(--text-3)", fontStyle: "italic" }}>✓ All local files match Supabase perfectly!</div>
              )}
            </div>
          ) : (
            <div style={{ color: "var(--text-3)", textAlign: "center", padding: "20px" }}>No data yet</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} disabled={applying}
            style={{ padding: "7px 16px", background: "var(--surface-3)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--r)", cursor: applying ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: 500, opacity: applying ? 0.6 : 1 }}
          >
            Close
          </button>
          {hasChanges && !loading && !applying && !wasApplied && (
            <button type="button" onClick={onApply}
              style={{ padding: "7px 16px", background: "var(--brand)", color: "#fff", border: "1px solid var(--brand)", borderRadius: "var(--r)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}
            >
              <i className="fa-solid fa-check" style={{ fontSize: "0.85em" }} />
              Apply Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}