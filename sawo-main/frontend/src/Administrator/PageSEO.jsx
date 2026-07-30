// src/Administrator/PageSEO.jsx
//
// CMS-editable title/meta description/social-share image for the ~42 static
// hub/category pages (Home, /sauna/heaters, /contact, /about, etc.) — the
// pages that AREN'T a product/room/accessory detail page. Those already have
// their own meta_title/meta_description/og_image columns directly on the
// `products`/`sauna_rooms` tables (see setup-seo-fields.sql, edited from
// Products.jsx / SaunaRoomsCMS.jsx). This page is the companion for
// everything else, backed by the `page_seo` table (setup-page-seo.sql) and
// read on the public site via local-storage/pageSeo.js + components/SEO.jsx.
//
// Requires the `page_seo` table to exist — run
// Administrator/Local/scripts/setup-page-seo.sql once in the Supabase SQL
// editor first. If the table doesn't exist yet, saves will fail with a clear
// error surfaced via the toast below (not a silent no-op).
import React, { useEffect, useMemo, useState } from "react";
import { logActivity, supabase } from "./supabase";
import { primePageSeo } from "../local-storage/pageSeo";

// One row per static route this admin can override. `label` is just this
// list's own display name — it does NOT change what ships if left blank;
// `defaultTitle`/`defaultDescription` are what the page already renders today
// (the hard-coded <SEO title=.../> in that page's own JSX) shown as a
// placeholder/reference so an editor knows what they're overriding.
const STATIC_PAGES = [
  { path: "/", label: "Home" },
  { path: "/infrared", label: "Infrared Sauna" },
  { path: "/about", label: "About Us" },
  { path: "/about/sustainability", label: "Sustainability" },
  { path: "/about/news", label: "Latest News" },
  { path: "/careers", label: "Careers" },
  { path: "/contact", label: "Contact Us" },
  { path: "/sauna", label: "Sauna (hub)" },
  { path: "/sauna/heaters", label: "Sauna Heaters (hub)" },
  { path: "/sauna/heaters/wall-mounted", label: "Wall-Mounted Sauna Heaters" },
  { path: "/sauna/heaters/tower", label: "Tower Sauna Heaters" },
  { path: "/sauna/heaters/stone", label: "Stone Sauna Heaters" },
  { path: "/sauna/heaters/floor", label: "Floor Sauna Heaters" },
  { path: "/sauna/heaters/combi", label: "Combi Sauna Heaters" },
  { path: "/sauna/heaters/dragonfire", label: "Dragonfire Sauna Heaters" },
  { path: "/sauna/controls", label: "Sauna Controls" },
  { path: "/sauna/accessories", label: "Sauna Accessories (hub)" },
  { path: "/sauna/accessories/pails-ladles", label: "Sauna Pails & Ladles" },
  { path: "/sauna/accessories/thermometers", label: "Sauna Thermometers & Hygrometers" },
  { path: "/sauna/accessories/clocks-sandtimers", label: "Sauna Clocks & Sand Timers" },
  { path: "/sauna/accessories/lights-covers", label: "Sauna Lights & Covers" },
  { path: "/sauna/accessories/headrests-backrests", label: "Sauna Headrests & Backrests" },
  { path: "/sauna/accessories/doors-handles", label: "Sauna Doors & Handles" },
  { path: "/sauna/accessories/benches-floor-tiles", label: "Sauna Benches & Floor Tiles" },
  { path: "/sauna/accessories/kivistone", label: "Kivistone Soapstone Collection" },
  { path: "/sauna/accessories/ventilations-add-ons", label: "Sauna Ventilation & Add-Ons" },
  { path: "/sauna/accessories/accessory-sets", label: "Sauna Accessory Sets" },
  { path: "/sauna/rooms", label: "Sauna Rooms (hub)" },
  { path: "/sauna/rooms/interior-designs", label: "Sauna Interior Designs" },
  { path: "/sauna/rooms/wood-panels-timbers", label: "Wood Panels & Timbers" },
  { path: "/steam", label: "Steam Sauna (hub)" },
  { path: "/steam/generators", label: "Steam Generators" },
  { path: "/steam/controls", label: "Steam Controls" },
  { path: "/steam/accessories", label: "Steam Accessories" },
  { path: "/support", label: "Support Center (hub)" },
  { path: "/support/faq", label: "Frequently Asked Questions" },
  { path: "/support/sauna-calculator", label: "Sauna Calculator" },
  { path: "/support/manuals", label: "User Manuals" },
  { path: "/support/catalogue", label: "Product Catalogue" },
  { path: "/products", label: "All Products" },
  { path: "/privacy-policy", label: "Privacy Policy" },
  { path: "/sitemap", label: "Sitemap" },
  { path: "/sauna-accessories", label: "Sauna Accessories (catalog)" },
];

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  };
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, add, remove };
}

function Toast({ toasts, remove }) {
  const icons = { error: "fa-circle-xmark", success: "fa-circle-check", info: "fa-circle-info", warning: "fa-triangle-exclamation" };
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`fa-solid ${icons[t.type]}`} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button className="toast-close" onClick={() => remove(t.id)}></button>
        </div>
      ))}
    </div>
  );
}

function PageRow({ page, row, onSaved, onError, currentUser }) {
  const existing = row || {};
  const [title, setTitle] = useState(existing.meta_title || "");
  const [description, setDescription] = useState(existing.meta_description || "");
  const [ogImage, setOgImage] = useState(existing.og_image || "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasOverride = !!(existing.meta_title || existing.meta_description || existing.og_image);
  const dirty =
    title !== (existing.meta_title || "") ||
    description !== (existing.meta_description || "") ||
    ogImage !== (existing.og_image || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        path: page.path,
        meta_title: title.trim() || null,
        meta_description: description.trim() || null,
        og_image: ogImage.trim() || null,
        updated_by: currentUser?.username || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("page_seo").upsert(payload, { onConflict: "path" });
      if (error) throw new Error(error.message);

      primePageSeo(page.path, payload);
      await logActivity({
        action: "update",
        entity: "page_seo",
        entity_id: page.path,
        entity_name: `Page SEO → ${page.label} (${page.path})`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
      onSaved(page.path, payload);
    } catch (err) {
      onError(
        /relation .* does not exist/i.test(err.message)
          ? `The page_seo table doesn't exist yet — run Administrator/Local/scripts/setup-page-seo.sql in the Supabase SQL editor first.`
          : `Failed to save ${page.label}: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setTitle("");
    setDescription("");
    setOgImage("");
  };

  return (
    <div className="card card-body" style={{ marginBottom: 12 }}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className={`fa-solid ${expanded ? "fa-chevron-down" : "fa-chevron-right"}`} style={{ fontSize: 12, color: "var(--text-3)" }} />
          <div>
            <p className="text-sm font-medium text-[var(--text)]">{page.label}</p>
            <p className="text-xs text-[var(--text-3)]" style={{ fontFamily: "monospace" }}>{page.path}</p>
          </div>
        </div>
        {hasOverride && (
          <span className="text-xs" style={{ color: "var(--brand)", fontWeight: 600 }}>
            <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />
            Override active
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Meta Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to keep the page's built-in default"
            />
            <p className="form-helper">{title.length}/60{title.length > 60 && " — longer titles may get truncated in search results"}</p>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Meta Description</label>
            <textarea
              className="form-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Leave blank to keep the page's built-in default"
            />
            <p className="form-helper">{description.length}/155{description.length > 155 && " — longer descriptions may get truncated in search results"}</p>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Social Share Image URL (og:image)</label>
            <input
              type="text"
              className="form-input"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="Leave blank to keep the homepage hero as the default"
            />
            <p className="form-helper">Shown when this page's link is shared on Slack, WhatsApp, Facebook, etc.</p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              disabled={saving || !dirty}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {hasOverride && (
              <button className="btn btn-secondary" disabled={saving} onClick={handleClear}>
                Clear fields
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PageSEO({ currentUser }) {
  const { toasts, add, remove } = useToast();
  const [rows, setRows] = useState(null); // { [path]: row } | null while loading
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("page_seo")
      .select("path,meta_title,meta_description,og_image")
      .then(({ data, error: err }) => {
        if (err) {
          setError(
            /relation .* does not exist/i.test(err.message)
              ? "The page_seo table doesn't exist yet — run Administrator/Local/scripts/setup-page-seo.sql in the Supabase SQL editor, then reload this page."
              : `Failed to load page SEO overrides: ${err.message}`
          );
          setRows({});
          return;
        }
        setRows(Object.fromEntries((data || []).map((r) => [r.path, r])));
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return STATIC_PAGES;
    return STATIC_PAGES.filter((p) => p.label.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
  }, [search]);

  const overrideCount = rows ? Object.values(rows).filter((r) => r.meta_title || r.meta_description || r.og_image).length : 0;

  if (rows === null) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-[var(--brand)] mb-4"></i>
          <p className="text-[var(--text-2)]">Loading page SEO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Toast toasts={toasts} remove={remove} />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text)] mb-1 flex items-center gap-2">
          <i className="fa-solid fa-magnifying-glass-chart text-[var(--brand)]"></i>
          Page SEO
        </h2>
        <p className="text-sm text-[var(--text-3)]">
          Override the title, meta description, and social-share image for any hub/category page — takes
          effect on the public site within seconds, no redeploy needed. Leave fields blank to keep using
          that page's built-in default. {overrideCount > 0 && `${overrideCount} page${overrideCount === 1 ? "" : "s"} currently overridden.`}
        </p>
        <p className="text-xs text-[var(--text-3)] mt-2">
          Product, sauna room, and accessory detail pages aren't listed here — they already have their own
          SEO fields directly on the Products / Sauna Rooms editors.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-[var(--danger-bg)] border border-[var(--danger)] rounded p-4 text-[var(--danger)]">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      <input
        type="text"
        className="form-input"
        style={{ marginBottom: 16, maxWidth: 360 }}
        placeholder="Search pages..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.map((page) => (
        <PageRow
          key={page.path}
          page={page}
          row={rows[page.path]}
          currentUser={currentUser}
          onSaved={(path, payload) => {
            setRows((r) => ({ ...r, [path]: payload }));
            add(`Saved SEO for ${page.label}`, "success");
          }}
          onError={(message) => add(message, "error")}
        />
      ))}
    </div>
  );
}
