// src/Administrator/ContentCMS.jsx
/**
 * ContentCMS — Site Content Editor
 *
 * Allows admins to edit any page text and images through the admin panel.
 * Changes are saved to Supabase (site_content table).
 * "Sync to GitHub" calls the backend to download images and push JSON to GitHub,
 * which the frontend then reads from raw.githubusercontent.com.
 *
 * Data flow:
 *   Admin edits here → Supabase site_content → Sync → GitHub site_content.json → Frontend
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase, logActivity } from "./supabase";
import { getPerms } from "./permissions";
import { getSiteContent, refreshSiteContent } from "../local-storage/cacheReader";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const BUCKET      = "site-content-images";

// ── WebP conversion helper (same as Products/SaunaRooms CMS) ─────────────────
const WEBP_QUALITY = 0.85;
const WEBP_MAX_DIM = 1920;

function convertToWebP(file, maxDim = WEBP_MAX_DIM, quality = WEBP_QUALITY) {
  return new Promise((resolve, reject) => {
    const img       = new Image();
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

async function uploadImageToSupabase(file, folder = "") {
  const webpBlob = await convertToWebP(file);
  const filename = `${folder ? folder + "/" : ""}${Date.now()}-${file.name.replace(/\.[^.]+$/, "")}.webp`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(filename, webpBlob, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}

// ── Page definitions: which sections each page has ───────────────────────────
const PAGES = [
  { id: "home", label: "Home" },
  // Extend here as you add more pages
];

const SECTION_LABELS = {
  hero:     "Hero Banner",
  section1: "Section 1 — Product Carousel",
  section2: "Section 2 — Sauna Heaters",
  section3: "Section 3 — Steam / Rooms / Infrared",
  section4: "Section 4 — Accessories",
  section5: "Section 5 — Customized Solutions",
};

// ── Image Field component ─────────────────────────────────────────────────────
function ImageField({ label, value, onChange, folder = "home" }) {
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(value || null);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToSupabase(file, folder);
      setPreview(url);
      onChange(url);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="cms-field">
      <label className="cms-label">{label}</label>
      <div className="cms-image-row">
        {preview ? (
          <div className="cms-image-preview">
            <img src={preview} alt={label} />
            <button
              className="cms-image-remove"
              onClick={() => { setPreview(null); onChange(null); }}
              title="Remove image (restores local fallback)"
            >✕</button>
          </div>
        ) : (
          <div className="cms-image-placeholder">No image — using site default</div>
        )}
        <div className="cms-image-actions">
          <button
            className="cms-btn cms-btn-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : preview ? "Replace Image" : "Upload Image"}
          </button>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
      </div>
    </div>
  );
}

// ── Text Field ────────────────────────────────────────────────────────────────
function TextField({ label, value, onChange, multiline = false, placeholder = "" }) {
  return (
    <div className="cms-field">
      <label className="cms-label">{label}</label>
      {multiline ? (
        <textarea
          className="cms-input cms-textarea"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          className="cms-input"
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

// ── Sentences Field (typewriter lines) ────────────────────────────────────────
function SentencesField({ label, value = [], onChange }) {
  const add    = () => onChange([...value, ""]);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i, v) => onChange(value.map((s, idx) => idx === i ? v : s));

  return (
    <div className="cms-field">
      <label className="cms-label">{label}</label>
      {value.map((s, i) => (
        <div key={i} className="cms-sentence-row">
          <input
            className="cms-input"
            value={s}
            onChange={e => update(i, e.target.value)}
            placeholder={`Line ${i + 1}`}
          />
          <button className="cms-btn cms-btn-danger cms-btn-sm" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button className="cms-btn cms-btn-secondary cms-btn-sm" onClick={add}>+ Add line</button>
    </div>
  );
}

// ── Items Editor (for carousel arrays) ───────────────────────────────────────
function ItemsEditor({ items = [], onChange, showImage = true, showCaption = true, folder = "home" }) {
  const updateItem = (i, field, val) =>
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  return (
    <div className="cms-items">
      {items.map((item, i) => (
        <div key={i} className="cms-item">
          <div className="cms-item-header">Item {i + 1}: {item.title || "—"}</div>
          <TextField
            label="Title"
            value={item.title}
            onChange={v => updateItem(i, "title", v)}
          />
          {showCaption && item.caption !== undefined && (
            <TextField
              label="Caption"
              value={item.caption}
              onChange={v => updateItem(i, "caption", v)}
              multiline
            />
          )}
          {showImage && (
            <ImageField
              label="Image (null = use site default)"
              value={item.image_url}
              onChange={v => updateItem(i, "image_url", v)}
              folder={folder}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Section Editors ───────────────────────────────────────────────────────────
function HeroEditor({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div className="cms-section-body">
      <p className="cms-hint">
        The hero background images are shown at 3 breakpoints. Upload a new image or leave blank to use the default site images (<code>640.webp</code> / <code>1024.webp</code> / <code>1920.webp</code>).
      </p>
      <ImageField label="Mobile Image (≤640px)" value={data.image_640}  onChange={v => set("image_640",  v)} folder="home/hero" />
      <ImageField label="Tablet Image (≤1024px)" value={data.image_1024} onChange={v => set("image_1024", v)} folder="home/hero" />
      <ImageField label="Desktop Image (≥1025px)" value={data.image_1920} onChange={v => set("image_1920", v)} folder="home/hero" />
      <TextField  label="Image Alt Text" value={data.alt_text} onChange={v => set("alt_text", v)} />
      <SentencesField
        label="Typewriter Lines (animated text)"
        value={data.typewriter_sentences || []}
        onChange={v => set("typewriter_sentences", v)}
      />
      <TextField label="Button Text" value={data.button_text} onChange={v => set("button_text", v)} />
      <TextField label="Button URL"  value={data.button_url}  onChange={v => set("button_url",  v)} />
    </div>
  );
}

function Section1Editor({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div className="cms-section-body">
      <TextField label="Section Heading" value={data.heading} onChange={v => set("heading", v)} />
      <div className="cms-subsection-title">Carousel Items</div>
      <ItemsEditor
        items={data.items || []}
        onChange={v => set("items", v)}
        folder="home/section1"
      />
    </div>
  );
}

function Section2Editor({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div className="cms-section-body">
      <TextField label="Section Heading" value={data.heading} onChange={v => set("heading", v)} />
      <div className="cms-subsection-title">Heater Cards</div>
      <ItemsEditor
        items={data.items || []}
        onChange={v => set("items", v)}
        folder="home/section2"
      />
    </div>
  );
}

function Section3Editor({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div className="cms-section-body">
      {/* Steam */}
      <TextField label="Steam Section Heading" value={data.steam_heading} onChange={v => set("steam_heading", v)} />
      <div className="cms-subsection-title">Steam Cards</div>
      <ItemsEditor items={data.steam_items || []} onChange={v => set("steam_items", v)} folder="home/section3" />

      {/* Sauna Rooms */}
      <TextField label="Sauna Rooms Heading" value={data.sauna_rooms_heading} onChange={v => set("sauna_rooms_heading", v)} />
      <div className="cms-subsection-title">Sauna Room Cards</div>
      <ItemsEditor items={data.sauna_rooms_items || []} onChange={v => set("sauna_rooms_items", v)} folder="home/section3" />

      {/* Infrared */}
      <TextField label="Infrared Heading" value={data.infrared_heading} onChange={v => set("infrared_heading", v)} />
      <div className="cms-subsection-title">Infrared Cards</div>
      <ItemsEditor items={data.infrared_items || []} onChange={v => set("infrared_items", v)} showCaption={false} folder="home/section3" />

      {/* Sauna Control */}
      <TextField label="Sauna Control Heading" value={data.sauna_control_heading} onChange={v => set("sauna_control_heading", v)} />
      <div className="cms-subsection-title">Sauna Control Cards</div>
      <ItemsEditor items={data.sauna_control_items || []} onChange={v => set("sauna_control_items", v)} showCaption={false} folder="home/section3" />
    </div>
  );
}

function Section4Editor({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div className="cms-section-body">
      <TextField label="Section Heading" value={data.heading} onChange={v => set("heading", v)} />
      <div className="cms-subsection-title">Accessory Cards</div>
      <ItemsEditor items={data.items || []} onChange={v => set("items", v)} showCaption={false} folder="home/section4" />
    </div>
  );
}

function Section5Editor({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div className="cms-section-body">
      <TextField label="Main Heading"   value={data.heading}     onChange={v => set("heading",     v)} />
      <TextField label="Subtitle"       value={data.subtitle}    onChange={v => set("subtitle",    v)} />
      <TextField label="Body Text 1"    value={data.body1}       onChange={v => set("body1",       v)} multiline />
      <TextField label="Body Text 2"    value={data.body2}       onChange={v => set("body2",       v)} />
      <TextField label="Button Text"    value={data.button_text} onChange={v => set("button_text", v)} />
      <p className="cms-hint">The comparison slider below uses two images. Left image = foreground (draggable side), Right image = background.</p>
      <ImageField label="Left Image (foreground)"  value={data.image_left}  onChange={v => set("image_left",  v)} folder="home/section5" />
      <ImageField label="Right Image (background)" value={data.image_right} onChange={v => set("image_right", v)} folder="home/section5" />
    </div>
  );
}

const SECTION_EDITORS = {
  hero:     HeroEditor,
  section1: Section1Editor,
  section2: Section2Editor,
  section3: Section3Editor,
  section4: Section4Editor,
  section5: Section5Editor,
};

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ open, onClose, content }) {
  if (!open || !content) return null;
  return (
    <div className="cms-sync-overlay" onClick={onClose}>
      <div className="cms-sync-panel" onClick={e => e.stopPropagation()}>
        <div className="cms-sync-header">
          <span>👁️ Content Preview — What's on GitHub</span>
          <button className="cms-btn cms-btn-secondary" onClick={onClose} style={{ fontSize: "12px", padding: "6px 12px" }}>Close</button>
        </div>
        <div className="cms-sync-log" style={{ maxHeight: "calc(80vh - 120px)", paddingTop: 12 }}>
          <pre style={{ fontSize: "12px", lineHeight: 1.5, margin: 0, color: "#d4cfc9" }}>
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Sync Progress Panel ───────────────────────────────────────────────────────
function SyncPanel({ onClose }) {
  const [lines, setLines] = useState([]);
  const [done,  setDone]  = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/sync-site-content`, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const dec    = new TextDecoder();
        let buf = "";

        while (!cancelled) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split("\n");
          buf = parts.pop();
          for (const part of parts) {
            if (!part.trim()) continue;
            try {
              const ev = JSON.parse(part);
              if (!cancelled) setLines(prev => [...prev, ev]);
              if (ev.phase === "complete" || ev.phase === "error") setDone(true);
            } catch {}
          }
        }
        if (!cancelled) setDone(true);
      } catch (err) {
        if (!cancelled) {
          setLines(prev => [...prev, { phase: "error", message: err.message }]);
          setDone(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const phaseIcon = (phase) => {
    if (phase === "complete") return "✅";
    if (phase === "error")    return "❌";
    if (phase === "git")      return "📤";
    if (phase === "fetch")    return "📥";
    if (phase === "images")   return "🖼️";
    if (phase === "write")    return "📝";
    return "🔄";
  };

  return (
    <div className="cms-sync-overlay">
      <div className="cms-sync-panel">
        <div className="cms-sync-header">
          <span>🔄 Syncing to GitHub…</span>
          {done && <button className="cms-btn cms-btn-secondary" onClick={onClose}>Close</button>}
        </div>
        <div className="cms-sync-log" ref={scrollRef}>
          {lines.map((line, i) => (
            <div key={i} className={`cms-sync-line ${line.phase}`}>
              {phaseIcon(line.phase)} {line.message}
            </div>
          ))}
          {!done && <div className="cms-sync-line">⏳ Waiting for server…</div>}
        </div>
        {done && (
          <p className="cms-sync-hint">
            ✅ Sync complete. The frontend will pick up changes within 1 hour (localStorage cache TTL).
            To see changes immediately, open the site in a private window or clear localStorage.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main ContentCMS component ─────────────────────────────────────────────────
export default function ContentCMS({ currentUser }) {
  const perms = getPerms(currentUser);

  const [selectedPage,    setSelectedPage]    = useState("home");
  const [selectedSection, setSelectedSection] = useState("hero");
  const [contentMap,      setContentMap]      = useState({});
  const [dirty,           setDirty]           = useState({});
  const [saving,          setSaving]          = useState(false);
  const [saveMsg,         setSaveMsg]         = useState(null);
  const [showSync,        setShowSync]        = useState(false);
  const [showPreview,     setShowPreview]     = useState(false);
  const [previewContent,  setPreviewContent]  = useState(null);
  const [cacheRefreshing, setCacheRefreshing] = useState(false);
  const [loading,         setLoading]         = useState(true);

  // Known sections per page (mirrors seed SQL)
  const PAGE_SECTIONS = {
    home: ["hero", "section1", "section2", "section3", "section4", "section5"],
  };

  const sections = PAGE_SECTIONS[selectedPage] || [];

  // Load all site_content rows from Supabase
  const loadContent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_content")
      .select("page, section, data");
    if (error) {
      console.error("[ContentCMS] Failed to load site_content:", error.message);
      setLoading(false);
      return;
    }
    const map = {};
    for (const row of data || []) {
      map[`${row.page}/${row.section}`] = row.data;
    }
    setContentMap(map);
    setDirty({});
    setLoading(false);
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);

  const key       = `${selectedPage}/${selectedSection}`;
  const sectionData = contentMap[key] || {};

  const handleChange = (newData) => {
    setContentMap(prev => ({ ...prev, [key]: newData }));
    setDirty(prev => ({ ...prev, [key]: true }));
    setSaveMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const { error } = await supabase
        .from("site_content")
        .upsert(
          { page: selectedPage, section: selectedSection, data: sectionData, updated_by: currentUser?.username },
          { onConflict: "page,section" }
        );
      if (error) throw new Error(error.message);

      await logActivity({
        action:      "update",
        entity:      "site_content",
        entity_id:   `${selectedPage}/${selectedSection}`,
        entity_name: `${selectedPage} › ${selectedSection}`,
        username:    currentUser?.username,
        user_id:     currentUser?.id,
      });

      setDirty(prev => { const n = { ...prev }; delete n[key]; return n; });
      setSaveMsg("✅ Saved to Supabase. Click \"Sync to GitHub\" to publish to the live site.");
    } catch (err) {
      setSaveMsg("❌ Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShowPreview = async () => {
    try {
      const preview = await getSiteContent('home');
      setPreviewContent(preview);
      setShowPreview(true);
    } catch (err) {
      alert("Failed to load preview: " + err.message);
    }
  };

  const handleRefreshCache = async () => {
    setCacheRefreshing(true);
    try {
      await refreshSiteContent();
      setSaveMsg("✅ Frontend cache refreshed! Changes will appear immediately on the live site.");
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg("❌ Cache refresh failed: " + err.message);
    } finally {
      setCacheRefreshing(false);
    }
  };

  const hasDirty     = Object.keys(dirty).length > 0;
  const thisDirty    = !!dirty[key];
  const SectionEditor = SECTION_EDITORS[selectedSection] || null;

  return (
    <>
      {showSync && <SyncPanel onClose={() => setShowSync(false)} />}
      {showPreview && <PreviewModal open={showPreview} onClose={() => setShowPreview(false)} content={previewContent} />}

      {/* ── Page header — matches Products.jsx / admin.css .page-header ── */}
      <div className="page-header">
        <h1 className="page-title">Page Content Editor</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {hasDirty && (
            <span className="cms-unsaved-badge">● Unsaved changes</span>
          )}
          <button
            className="cms-btn cms-btn-secondary"
            onClick={handleShowPreview}
            title="See what's currently on GitHub (live site)"
            style={{ fontSize: "12px" }}
          >
            <i className="fa-solid fa-eye" style={{ marginRight: 6 }} />
            Preview
          </button>
          <button
            className="cms-btn cms-btn-secondary"
            onClick={handleRefreshCache}
            disabled={cacheRefreshing}
            title="Force refresh frontend cache (use after sync)"
            style={{ fontSize: "12px" }}
          >
            <i className={`fa-solid ${cacheRefreshing ? "fa-spinner fa-spin" : "fa-arrows-rotate"}`} style={{ marginRight: 6 }} />
            {cacheRefreshing ? "Refreshing…" : "Refresh Cache"}
          </button>
          <button
            className="cms-btn cms-btn-primary"
            onClick={() => setShowSync(true)}
            title="Push all saved content to GitHub so the live site picks up changes"
          >
            <i className="fa-solid fa-rotate" style={{ marginRight: 6 }} />
            Sync to GitHub
          </button>
        </div>
      </div>

      {/* ── Split pane: inner sidebar + editor ───────────────────────────── */}
      <div className="card cms-split">

        {/* ── Left: page + section nav — matches the outer admin sidebar ── */}
        <aside className="cms-inner-sidebar">
          {PAGES.map(p => (
            <div key={p.id}>
              <div className="cms-page-label">{p.label}</div>
              <div className="cms-section-nav">
                {(PAGE_SECTIONS[p.id] || []).map(s => (
                  <button
                    key={s}
                    className={`cms-section-btn${selectedSection === s && selectedPage === p.id ? " active" : ""}${dirty[`${p.id}/${s}`] ? " dirty" : ""}`}
                    onClick={() => { setSelectedPage(p.id); setSelectedSection(s); }}
                  >
                    {dirty[`${p.id}/${s}`] && <span className="cms-dirty-dot" title="Unsaved">●</span>}
                    {SECTION_LABELS[s] || s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* ── Right: section editor ────────────────────────────────────── */}
        <main className="cms-editor-main">
          <div className="cms-editor-inner">
            <div className="cms-section-header">
              <h2 className="cms-section-title">{SECTION_LABELS[selectedSection] || selectedSection}</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {thisDirty && (
                  <button
                    className="cms-btn cms-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} style={{ marginRight: 6 }} />
                    {saving ? "Saving…" : "Save Section"}
                  </button>
                )}
              </div>
            </div>

            {saveMsg && (
              <div className={`cms-save-msg${saveMsg.startsWith("❌") ? " error" : " success"}`}>
                {saveMsg}
              </div>
            )}

            {loading ? (
              <div className="cms-loading">
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
                Loading content…
              </div>
            ) : SectionEditor ? (
              <SectionEditor data={sectionData} onChange={handleChange} />
            ) : (
              <div className="cms-loading">No editor for this section yet.</div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        /* ── Unsaved badge ───────────────────────────────────────────────── */
        .cms-unsaved-badge {
          font-size: 13px;
          color: var(--warning, #b8860b);
          font-weight: 600;
          font-family: var(--font);
        }

        /* ── Split pane card ─────────────────────────────────────────────── */
        .cms-split {
          display: flex;
          overflow: hidden;
          min-height: calc(100vh - 160px);
          padding: 0;
        }

        /* ── Inner sidebar — mirrors outer admin sidebar ──────────────────
           Background:  var(--sidebar-bg)  = #141617 (dark)
           Hover/Active: same dark-brown highlight + brand-light text        */
        .cms-inner-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--sidebar-bg, #141617);
          border-right: 1px solid rgba(255,255,255,0.05);
          overflow-y: auto;
          padding: 20px 0 16px;
        }

        .cms-page-label {
          padding: 6px 20px 10px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          font-family: var(--font);
          user-select: none;
        }

        .cms-section-nav { padding-bottom: 8px; }

        .cms-section-btn {
          width: 100%;
          text-align: left;
          padding: 9px 20px 9px 24px;
          border: none;
          border-left: 3px solid transparent;
          background: none;
          cursor: pointer;
          font-size: 13px;
          font-family: var(--font);
          font-weight: 500;
          color: rgba(255,255,255,0.65);
          display: flex;
          align-items: center;
          gap: 7px;
          transition: background var(--t, 0.2s), color var(--t, 0.2s), border-color var(--t, 0.2s);
          line-height: 1.4;
        }
        /* Hover and Active use the same dark-brown brand highlight */
        .cms-section-btn:hover,
        .cms-section-btn.active {
          background: rgba(175, 133, 100, 0.15);
          color: var(--brand-light, #c9a882);
          border-left-color: var(--brand, #af8564);
        }
        .cms-section-btn.active { font-weight: 600; }
        .cms-section-btn.dirty  { color: var(--warning, #b8860b); }
        .cms-dirty-dot { font-size: 7px; flex-shrink: 0; }

        /* ── Editor main area ─────────────────────────────────────────────── */
        .cms-editor-main {
          flex: 1;
          overflow-y: auto;
          background: var(--bg, #f7f5f2);
          padding: 28px 32px;
        }
        .cms-editor-inner { max-width: 800px; }

        /* ── Section header ──────────────────────────────────────────────── */
        .cms-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 14px;
          border-bottom: 2px solid var(--border, #e3ddd6);
        }
        .cms-section-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text, #141617);
          font-family: var(--font);
          letter-spacing: -0.01em;
        }

        /* ── Save message ────────────────────────────────────────────────── */
        .cms-save-msg {
          padding: 10px 14px;
          border-radius: var(--r-sm, 6px);
          margin-bottom: 18px;
          font-size: 13px;
          font-family: var(--font);
          line-height: 1.5;
        }
        .cms-save-msg.success {
          background: var(--success-bg, #edf7f1);
          color: var(--success, #2e7d52);
          border: 1px solid rgba(46,125,82,0.25);
        }
        .cms-save-msg.error {
          background: var(--danger-bg, #fdf0ef);
          color: var(--danger, #c0392b);
          border: 1px solid rgba(192,57,43,0.25);
        }

        /* ── Loading state ───────────────────────────────────────────────── */
        .cms-loading {
          color: var(--text-3, #9a918a);
          padding: 48px 0;
          text-align: center;
          font-size: 14px;
          font-family: var(--font);
        }

        /* ── Section body ────────────────────────────────────────────────── */
        .cms-section-body { display: flex; flex-direction: column; gap: 22px; }

        /* ── Fields ──────────────────────────────────────────────────────── */
        .cms-field { display: flex; flex-direction: column; gap: 6px; }
        .cms-label {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-2, #5a5550);
          font-family: var(--font);
          letter-spacing: 0.01em;
        }
        .cms-input {
          padding: 9px 12px;
          border: 1px solid var(--border, #e3ddd6);
          border-radius: var(--r-sm, 6px);
          font-size: 14px;
          font-family: var(--font);
          background: var(--surface, #fff);
          color: var(--text, #141617);
          width: 100%;
          box-sizing: border-box;
          transition: border-color var(--t, 0.2s), box-shadow var(--t, 0.2s);
        }
        .cms-input:focus {
          outline: none;
          border-color: var(--brand, #af8564);
          box-shadow: 0 0 0 3px rgba(175,133,100,0.15);
        }
        .cms-textarea { resize: vertical; min-height: 80px; }
        .cms-hint {
          font-size: 11.5px;
          color: var(--text-3, #9a918a);
          margin: 0;
          font-style: italic;
          font-family: var(--font);
        }

        /* ── Image field ─────────────────────────────────────────────────── */
        .cms-image-row { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .cms-image-preview {
          position: relative;
          width: 150px;
          flex-shrink: 0;
          border-radius: var(--r-sm, 6px);
          overflow: hidden;
          border: 1px solid var(--border, #e3ddd6);
          background: var(--surface-2, #f0ece7);
        }
        .cms-image-preview img { width: 100%; height: 96px; object-fit: cover; display: block; }
        .cms-image-remove {
          position: absolute;
          top: 5px; right: 5px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 24px; height: 24px;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .cms-image-remove:hover { background: rgba(192,57,43,0.85); }
        .cms-image-placeholder {
          width: 150px;
          height: 96px;
          border: 1.5px dashed var(--border, #e3ddd6);
          border-radius: var(--r-sm, 6px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: var(--text-3, #9a918a);
          text-align: center;
          padding: 10px;
          font-family: var(--font);
        }
        .cms-image-actions { display: flex; flex-direction: column; gap: 8px; }

        /* ── Sentence rows ───────────────────────────────────────────────── */
        .cms-sentence-row { display: flex; gap: 8px; align-items: center; }
        .cms-sentence-row .cms-input { flex: 1; }

        /* ── Items editor ────────────────────────────────────────────────── */
        .cms-items { display: flex; flex-direction: column; gap: 14px; }
        .cms-item {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e3ddd6);
          border-radius: var(--r, 10px);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }
        .cms-item-header {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-3, #9a918a);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: var(--font);
        }
        .cms-subsection-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--brand, #af8564);
          margin-top: 6px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border, #e3ddd6);
          font-family: var(--font);
        }

        /* ── Buttons ─────────────────────────────────────────────────────── */
        .cms-btn {
          padding: 8px 16px;
          border: none;
          border-radius: var(--r-sm, 6px);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font);
          transition: background var(--t, 0.15s), opacity 0.15s, box-shadow 0.15s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
        }
        .cms-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cms-btn-primary {
          background: var(--brand, #af8564);
          color: #fff;
          box-shadow: 0 1px 3px rgba(175,133,100,0.3);
        }
        .cms-btn-primary:hover:not(:disabled) {
          background: var(--brand-dark, #8c6540);
          box-shadow: 0 2px 8px rgba(175,133,100,0.35);
        }
        .cms-btn-secondary {
          background: var(--surface-2, #f0ece7);
          color: var(--text, #141617);
          border: 1px solid var(--border, #e3ddd6);
        }
        .cms-btn-secondary:hover:not(:disabled) {
          background: var(--border, #e3ddd6);
        }
        .cms-btn-danger    { background: var(--danger-bg, #fdf0ef); color: var(--danger, #c0392b); border: 1px solid rgba(192,57,43,0.2); }
        .cms-btn-danger:hover:not(:disabled) { background: rgba(192,57,43,0.15); }
        .cms-btn-sm { padding: 5px 10px; font-size: 12px; }

        /* ── Sync overlay ────────────────────────────────────────────────── */
        .cms-sync-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(3px);
        }
        .cms-sync-panel {
          background: #1a1714;
          color: #d4cfc9;
          border-radius: var(--r, 10px);
          border: 1px solid rgba(175,133,100,0.2);
          width: min(640px, 96vw);
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        }
        .cms-sync-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          font-family: var(--font);
        }
        .cms-sync-log {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          font-family: "Courier New", monospace;
          font-size: 13px;
          line-height: 1.75;
        }
        .cms-sync-line { padding: 1px 0; }
        .cms-sync-line.complete { color: #68d391; }
        .cms-sync-line.error    { color: #fc8181; }
        .cms-sync-line.git      { color: #90cdf4; }
        .cms-sync-hint {
          padding: 12px 20px;
          font-size: 12px;
          color: rgba(175,133,100,0.75);
          border-top: 1px solid rgba(255,255,255,0.07);
          margin: 0;
          font-family: var(--font);
        }

        /* ── Responsive ──────────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .cms-split { flex-direction: column; min-height: auto; }
          .cms-inner-sidebar { width: 100%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 12px 0; }
          .cms-section-btn { padding: 8px 16px; }
          .cms-editor-main { padding: 20px 16px; }
        }
      `}</style>
    </>
  );
}
