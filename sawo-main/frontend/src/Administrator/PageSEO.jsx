// src/Administrator/PageSEO.jsx
//
// "Page Performance" — a grid of the ~42 static hub/category pages (Home,
// /sauna/heaters, /contact, /about, etc.), sorted by traffic, with a
// drill-down per page (visitor profile: sources/locations/devices/entry-exit,
// reusing the same computation as Analytics.jsx) and, inside that drill-down,
// the SEO override form this page used to be entirely made of.
//
// Product/sauna-room/accessory detail pages aren't listed — they already have
// their own meta_title/meta_description/og_image columns directly on the
// `products`/`sauna_rooms` tables (see setup-seo-fields.sql, edited from
// Products.jsx / SaunaRoomsCMS.jsx).
//
// SEO overrides are backed by the `page_seo` table (setup-page-seo.sql) and
// read on the public site via local-storage/pageSeo.js + components/SEO.jsx —
// saving here goes live within seconds, no redeploy. Traffic data comes from
// the same `analytics_page_views`/`analytics_events` tables Analytics.jsx
// reads (setup-analytics.sql).
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { logActivity, supabase } from "./supabase";
import { primePageSeo } from "../local-storage/pageSeo";
import { getCache, setCache } from "./adminCache";
import { computeAllPagesSummary, computePageDetail } from "./analytics/computePagePerformance";
import { DATE_RANGE_OPTIONS, resolveRange } from "./analytics/dateRange";
import Sparkline from "./analytics/Sparkline";
import DailyTrafficChart from "./DailyTrafficChart";
import { MetricCard, BreakdownCard, BreakdownList, Modal } from "./analytics/StatPrimitives";

// One row per static route this admin covers. `label` is just this list's
// own display name — it does NOT change what ships if left blank;
// `defaultTitle`/`defaultDescription` aren't tracked here since the SEO
// editor already shows "leave blank to keep the built-in default".
// defaultTitle/defaultDescription are the literal props each page's own
// hard-coded <SEO title=... description=.../> call currently renders (see
// each page's own JSX) — shown in the SEO Override tab as "what's live right
// now" so an editor isn't overriding blind. Home ("/") intentionally has
// neither — SEO.jsx's own DEFAULT_TITLE/DEFAULT_DESCRIPTION apply there.
const STATIC_PAGES = [
  { path: "/", label: "Home", defaultTitle: null, defaultDescription: null },
  { path: "/infrared", label: "Infrared Sauna", defaultTitle: "Infrared Sauna", defaultDescription: "Discover SAWO infrared saunas — cedar-crafted rooms with gentle, therapeutic infrared heat panels and controls for deep relaxation and wellness." },
  { path: "/about", label: "About Us", defaultTitle: "About Us", defaultDescription: "Over 30 years designing and manufacturing premium Finnish sauna heaters, steam generators, and sauna rooms — trusted by customers in 90+ countries." },
  { path: "/about/sustainability", label: "Sustainability", defaultTitle: "Sustainability", defaultDescription: "How SAWO builds sustainably — responsibly sourced wood, waste-reduction practices, and energy-efficient manufacturing behind every sauna heater and room." },
  { path: "/about/news", label: "Latest News", defaultTitle: "Latest News", defaultDescription: "News, trade shows, and updates from SAWO — the latest on our Finnish sauna heaters, steam generators, and sauna room innovations." },
  { path: "/careers", label: "Careers", defaultTitle: "Careers", defaultDescription: "Join the SAWO team — explore current job openings in engineering, manufacturing, and sales at a global leader in Finnish sauna heaters." },
  { path: "/contact", label: "Contact Us", defaultTitle: "Contact Us", defaultDescription: "Get in touch with SAWO — technical support, sales inquiries, and distributor contacts for our global network of representative offices." },
  { path: "/sauna", label: "Sauna (hub)", defaultTitle: "Finnish Sauna Heaters, Controls & Accessories", defaultDescription: "Explore SAWO's full Finnish sauna range — heaters, controls, and accessories engineered for over 30 years of authentic sauna warmth and comfort." },
  { path: "/sauna/heaters", label: "Sauna Heaters (hub)", defaultTitle: "Sauna Heaters", defaultDescription: "Browse SAWO's full Finnish sauna heater lineup — Tower, Wall-Mounted, Floor, Combi, Stone, and Dragonfire series for every sauna size and style." },
  { path: "/sauna/heaters/wall-mounted", label: "Wall-Mounted Sauna Heaters", defaultTitle: "Wall-Mounted Sauna Heaters", defaultDescription: "Browse SAWO wall-mounted sauna heaters — Nordex, Mini, Scandia, Krios and Scandifire series in robust, space-saving designs for small and medium saunas." },
  { path: "/sauna/heaters/tower", label: "Tower Sauna Heaters", defaultTitle: "Tower Sauna Heaters", defaultDescription: "Explore SAWO Tower Series sauna heaters — energy-efficient, sleek vertical designs with superior heat distribution for a modern wellness sauna experience." },
  { path: "/sauna/heaters/stone", label: "Stone Sauna Heaters", defaultTitle: "Stone Sauna Heaters", defaultDescription: "SAWO Stone Series heaters combine durable stainless steel with heat-conducting Finnish soapstone for efficient heating and quick drying after use." },
  { path: "/sauna/heaters/floor", label: "Floor Sauna Heaters", defaultTitle: "Floor Sauna Heaters", defaultDescription: "SAWO Floor Series — powerful, movable stand-alone sauna heaters delivering optimal heat distribution and lasting comfort for commercial and home saunas." },
  { path: "/sauna/heaters/combi", label: "Combi Sauna Heaters", defaultTitle: "Combi Sauna Heaters", defaultDescription: "SAWO Combi heaters combine sauna and steam in one powerful unit — versatile, energy-efficient warmth with an integrated steamer." },
  { path: "/sauna/heaters/dragonfire", label: "Dragonfire Sauna Heaters", defaultTitle: "Dragonfire Sauna Heaters", defaultDescription: "SAWO Dragonfire Series — artistic sauna heaters designed by Stefan Lindfors, blending striking design with cutting-edge heating technology." },
  { path: "/sauna/controls", label: "Sauna Controls", defaultTitle: "Sauna Controls", defaultDescription: "Precise temperature, time, and lighting control for your sauna — explore SAWO's Innova and Saunova control series for total comfort." },
  { path: "/sauna/accessories", label: "Sauna Accessories (hub)", defaultTitle: "Sauna Accessories", defaultDescription: "Enhance your sauna with SAWO accessories — buckets, ladles, thermometers, headrests, lighting, and more, thoughtfully designed for every sauna." },
  { path: "/sauna/accessories/pails-ladles", label: "Sauna Pails & Ladles", defaultTitle: "Sauna Pails & Ladles", defaultDescription: "Shop SAWO sauna pails and ladles — durable, elegant water accessories for the perfect löyly steam experience." },
  { path: "/sauna/accessories/thermometers", label: "Sauna Thermometers & Hygrometers", defaultTitle: "Sauna Thermometers & Hygrometers", defaultDescription: "SAWO sauna thermometers and hygrometers — precise temperature and humidity readings to help you dial in the perfect sauna session." },
  { path: "/sauna/accessories/clocks-sandtimers", label: "Sauna Clocks & Sand Timers", defaultTitle: "Sauna Clocks & Sand Timers", defaultDescription: "SAWO sauna clocks and sand timers — classic timekeeping accessories to help you track your sauna sessions with ease." },
  { path: "/sauna/accessories/lights-covers", label: "Sauna Lights & Covers", defaultTitle: "Sauna Lights & Covers", defaultDescription: "SAWO sauna lights and light covers — safe, ambient lighting solutions designed to withstand high heat and humidity." },
  { path: "/sauna/accessories/headrests-backrests", label: "Sauna Headrests & Backrests", defaultTitle: "Sauna Headrests & Backrests", defaultDescription: "SAWO sauna headrests and backrests — comfortable, heat-safe wood accessories that make longer sauna sessions more relaxing." },
  { path: "/sauna/accessories/doors-handles", label: "Sauna Doors & Handles", defaultTitle: "Sauna Doors & Handles", defaultDescription: "SAWO sauna doors and handles — quality glass and wood doors with ergonomic handles, built for durability in high-heat environments." },
  { path: "/sauna/accessories/benches-floor-tiles", label: "Sauna Benches & Floor Tiles", defaultTitle: "Sauna Benches & Floor Tiles", defaultDescription: "SAWO sauna benches and floor tiles — durable, heat-treated wood surfaces designed for comfort and longevity inside your sauna." },
  { path: "/sauna/accessories/kivistone", label: "Kivistone Soapstone Collection", defaultTitle: "Kivistone Soapstone Collection", defaultDescription: "SAWO Kivistone — a soapstone accessory collection combining natural Finnish stone with heat-retaining design for a refined sauna experience." },
  { path: "/sauna/accessories/ventilations-add-ons", label: "Sauna Ventilation & Add-Ons", defaultTitle: "Sauna Ventilation & Add-Ons", defaultDescription: "SAWO sauna ventilation and add-on accessories — improve airflow and comfort in your sauna with our range of ventilation solutions." },
  { path: "/sauna/accessories/accessory-sets", label: "Sauna Accessory Sets", defaultTitle: "Sauna Accessory Sets", defaultDescription: "SAWO sauna accessory sets — curated collections pairing pails, ladles, thermometers, and more for a complete, coordinated sauna look." },
  { path: "/sauna/rooms", label: "Sauna Rooms (hub)", defaultTitle: "Sauna Rooms", defaultDescription: "Explore SAWO sauna rooms — Standard, Glass Front, Outdoor, and Infrared designs crafted for a complete, therapeutic sauna experience." },
  { path: "/sauna/rooms/interior-designs", label: "Sauna Interior Designs", defaultTitle: "Sauna Interior Designs", defaultDescription: "Explore SAWO sauna interior design options — wood finishes, layouts, and styling choices to personalize your sauna room." },
  { path: "/sauna/rooms/wood-panels-timbers", label: "Wood Panels & Timbers", defaultTitle: "Wood Panels & Timbers", defaultDescription: "SAWO wood panel and timber options — cedar, aspen, and spruce choices to craft the natural look and feel of your sauna room." },
  { path: "/steam", label: "Steam Sauna (hub)", defaultTitle: "Steam Sauna", defaultDescription: "Discover SAWO steam sauna solutions — generators, controls, and accessories delivering the luxury of tailored steam for a spa-like experience." },
  { path: "/steam/generators", label: "Steam Generators", defaultTitle: "Steam Generators", defaultDescription: "SAWO steam generators — the luxury of tailored steam from advanced generators with customized settings for exceptional spa-like performance." },
  { path: "/steam/controls", label: "Steam Controls", defaultTitle: "Steam Controls", defaultDescription: "Precision steam control from SAWO — Saunova and Innova control series for effortless operation and a personalized sauna experience." },
  { path: "/steam/accessories", label: "Steam Accessories", defaultTitle: "Steam Accessories", defaultDescription: "Premium SAWO steam accessories designed to enhance functionality and comfort for a consistently exceptional steam sauna experience." },
  { path: "/support", label: "Support Center (hub)", defaultTitle: "Support Center", defaultDescription: "Get help with your SAWO products — FAQs, sauna calculator, user manuals, and product catalogue all in one place." },
  { path: "/support/faq", label: "Frequently Asked Questions", defaultTitle: "Frequently Asked Questions", defaultDescription: "Answers to common questions about SAWO Finnish saunas, heaters, steam generators, and sauna care — from heat sources to wood types." },
  { path: "/support/sauna-calculator", label: "Sauna Calculator", defaultTitle: "Sauna Calculator", defaultDescription: "Find the right SAWO heater for your sauna — use our calculator to match room size and volume to the ideal heater power output." },
  { path: "/support/manuals", label: "User Manuals", defaultTitle: "User Manuals", defaultDescription: "Download SAWO user manuals — installation guides and operating instructions for our sauna heaters, controls, and steam generators." },
  { path: "/support/catalogue", label: "Product Catalogue", defaultTitle: "Product Catalogue", defaultDescription: "Browse the full SAWO product catalogue — sauna heaters, sauna rooms, and accessories in one searchable listing." },
  { path: "/products", label: "All Products", defaultTitle: "All Products", defaultDescription: "Browse SAWO's complete product range — sauna heaters, sauna rooms, and accessories, all in one searchable catalogue." },
  { path: "/privacy-policy", label: "Privacy Policy", defaultTitle: "Privacy Policy", defaultDescription: "SAWO's privacy policy — how we collect, use, and protect your personal data across our website and services." },
  { path: "/sitemap", label: "Sitemap", defaultTitle: "Sitemap", defaultDescription: "A complete guide to every page and section of the SAWO website — sauna heaters, steam generators, sauna rooms, and more." },
  { path: "/sauna-accessories", label: "Sauna Accessories (catalog)", defaultTitle: "Sauna Accessories", defaultDescription: "Browse the full SAWO accessories catalog — pails, ladles, thermometers, benches, lighting, and more for every sauna." },
];

const cacheKey = (range, customStart, customEnd) =>
  range === "custom" ? `admin:pagePerf:v2:custom:${customStart}:${customEnd}` : `admin:pagePerf:v2:${range}`;

function formatTime(seconds) {
  if (!seconds) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

// ── Toast (same pattern as Analytics.jsx) ───────────────────────────────────
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

// ── Grid card ────────────────────────────────────────────────────────────
function PageCard({ page, onOpen }) {
  const noTraffic = page.views === 0;
  const openProps = {
    role: "button",
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } },
  };
  return (
    <div
      {...openProps}
      className="card card-body card-lift hover:shadow-md transition-shadow"
      style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p className="text-sm font-semibold text-[var(--text)] truncate" style={{ margin: 0 }}>{page.label}</p>
          <a
            href={page.path}
            target="_blank"
            rel="noopener noreferrer"
            title="Visit page"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="text-xs text-[var(--text-3)] hover:text-[var(--brand)] transition-colors truncate"
            style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "monospace", marginTop: 2 }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7em", flexShrink: 0 }} />
            <span className="truncate">{page.path}</span>
          </a>
        </div>
        {noTraffic && (
          <span
            className="text-xs"
            style={{ color: "var(--danger)", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}
          >
            No traffic
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p className="text-2xl font-bold text-[var(--text)]" style={{ margin: 0, lineHeight: 1.1 }}>
            {page.views.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--text-3)]" style={{ margin: "2px 0 0" }}>
            view{page.views === 1 ? "" : "s"} · {page.uniqueVisitors} visitor{page.uniqueVisitors === 1 ? "" : "s"}
          </p>
        </div>
        {!noTraffic && <Sparkline data={page.dailyStats} />}
      </div>
    </div>
  );
}

// ── SEO editor (the old PageRow's form, minus the accordion chrome) ────────
function SeoEditor({ page, row, currentUser, onSaved, onError }) {
  const existing = row || {};
  const [title, setTitle] = useState(existing.meta_title || "");
  const [description, setDescription] = useState(existing.meta_description || "");
  const [ogImage, setOgImage] = useState(existing.og_image || "");
  const [saving, setSaving] = useState(false);

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
          ? "The page_seo table doesn't exist yet — run Administrator/Local/scripts/setup-page-seo.sql in the Supabase SQL editor first."
          : `Failed to save ${page.label}: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setTitle("");
    setDescription("");
    setOgImage("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {hasOverride && (
        <p className="text-xs" style={{ color: "var(--brand)", fontWeight: 600, margin: 0 }}>
          <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />
          Override active
        </p>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Meta Title</label>
        <input
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={page.defaultTitle || "Leave blank to keep the page's built-in default"}
        />
        <p className="form-helper">
          {title.length}/60{title.length > 60 && " — longer titles may get truncated in search results"}
        </p>
        <p className="text-xs text-[var(--text-3)]" style={{ margin: "2px 0 0" }}>
          {existing.meta_title ? "Live override shown above. " : ""}
          Falls back to: <span style={{ fontStyle: page.defaultTitle ? "normal" : "italic" }}>{page.defaultTitle || "site default (“SAWO Inc. | Premium Sauna Heaters, Rooms and Accessories”)"}</span>
        </p>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Meta Description</label>
        <textarea
          className="form-input"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={page.defaultDescription || "Leave blank to keep the page's built-in default"}
        />
        <p className="form-helper">
          {description.length}/155{description.length > 155 && " — longer descriptions may get truncated in search results"}
        </p>
        <p className="text-xs text-[var(--text-3)]" style={{ margin: "2px 0 0" }}>
          {existing.meta_description ? "Live override shown above. " : ""}
          Falls back to: <span style={{ fontStyle: page.defaultDescription ? "normal" : "italic" }}>{page.defaultDescription || "site default description"}</span>
        </p>
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
        <button className="btn btn-primary" disabled={saving || !dirty} onClick={handleSave}>
          {saving ? "Saving..." : "Save"}
        </button>
        {hasOverride && (
          <button className="btn btn-secondary" disabled={saving} onClick={handleClear}>
            Clear fields
          </button>
        )}
      </div>
    </div>
  );
}

// ── Detail modal: performance drill-down + SEO editor, tabbed ──────────────
function PageDetailModal({ page, pageViews, events, startDate, seoRow, currentUser, onClose, onSeoSaved, onSeoError }) {
  const [tab, setTab] = useState("overview"); // overview | seo
  const [cardTabs, setCardTabs] = useState({ sources: "sources", locations: "countries", devices: "browser" });
  const [expandedList, setExpandedList] = useState(null);
  const setCardTab = (card, t) => setCardTabs((prev) => ({ ...prev, [card]: t }));

  const detail = useMemo(
    () => computePageDetail(pageViews, events, page.path, startDate),
    [pageViews, events, page.path, startDate]
  );

  const sourcesTabs = {
    sources:   { label: "Sources",   rows: detail.sources,   valueLabel: "Visitors", showPct: true },
    channels:  { label: "Channels",  rows: detail.channels,  valueLabel: "Visitors", showPct: true },
    campaigns: { label: "Campaigns", rows: detail.campaigns, valueLabel: "Visitors", showPct: false },
  };
  const locationsTabs = {
    countries: { label: "Countries", rows: detail.countries, valueLabel: "Visitors", showPct: false },
    regions:   { label: "Regions",   rows: detail.regions,   valueLabel: "Visitors", showPct: false },
    cities:    { label: "Cities",    rows: detail.cities,    valueLabel: "Visitors", showPct: false },
  };
  const devicesTabs = {
    browser: { label: "Browser", rows: detail.browsers,    valueLabel: "Visitors", showPct: true },
    os:      { label: "OS",      rows: detail.os,          valueLabel: "Visitors", showPct: true },
    size:    { label: "Size",    rows: detail.screenSizes, valueLabel: "Visitors", showPct: true },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-wide modal-fixed-height"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "95vw", maxWidth: 1500 }}
      >
        <div className="modal-header">
          <h2 className="modal-title" style={{ minWidth: 0, overflow: "hidden" }}>
            <span style={{ marginRight: 8 }}>{page.label}</span>
            <span
              className="truncate"
              style={{ display: "inline-block", maxWidth: "100%", fontWeight: 400, color: "var(--text-3)", fontFamily: "monospace", fontSize: "0.85em", verticalAlign: "bottom" }}
            >
              {page.path}
            </span>
            <a
              href={page.path}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit page"
              onClick={(e) => e.stopPropagation()}
              style={{ marginLeft: 10, color: "var(--text-3)" }}
              className="hover:text-[var(--brand)] transition-colors"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.75em" }} />
            </a>
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div className="tax-tabs" style={{ marginBottom: 0 }}>
            <button type="button" className={`tax-tab-btn${tab === "overview" ? " active" : ""}`} onClick={() => setTab("overview")}>
              Performance
            </button>
            <button type="button" className={`tax-tab-btn${tab === "seo" ? " active" : ""}`} onClick={() => setTab("seo")}>
              SEO Override
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
          {tab === "overview" ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <MetricCard icon="fa-eye" title="Views" value={detail.views.toLocaleString()} subtitle="Total" />
                <MetricCard icon="fa-users" title="Visitors" value={detail.uniqueVisitors.toLocaleString()} subtitle="Sessions" />
                <MetricCard icon="fa-clock" title="Avg. Time" value={formatTime(detail.avgTime)} subtitle="On this page" />
                <MetricCard icon="fa-door-open" title="Bounce Rate" value={`${detail.bounceRate}%`} subtitle="Of these visitors" />
                <MetricCard icon="fa-right-to-bracket" title="Entries" value={detail.entryCount.toLocaleString()} subtitle={`${detail.entryPct}% of visits`} />
                <MetricCard icon="fa-right-from-bracket" title="Exits" value={detail.exitCount.toLocaleString()} subtitle={`${detail.exitPct}% of visits`} />
              </div>

              <div className="card card-body mb-6">
                <h3 className="text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2">
                  <i className="fas fa-chart-column text-[var(--brand)]"></i>
                  Views over time
                </h3>
                <DailyTrafficChart data={detail.dailyStats} />
              </div>

              {detail.views === 0 ? (
                <p className="text-[var(--text-3)] text-sm">
                  No visits recorded for this page in the selected range — sources, locations, and device
                  breakdowns need at least one visit to show anything.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <BreakdownCard
                    id="page-detail-sources"
                    title="Sources"
                    icon="fa-arrow-right-to-bracket"
                    tabs={sourcesTabs}
                    activeTab={cardTabs.sources}
                    onTab={(t) => setCardTab("sources", t)}
                    onShowAll={setExpandedList}
                  />
                  <BreakdownCard
                    id="page-detail-locations"
                    title="Locations"
                    icon="fa-globe"
                    tabs={locationsTabs}
                    activeTab={cardTabs.locations}
                    onTab={(t) => setCardTab("locations", t)}
                    onShowAll={setExpandedList}
                  />
                  <BreakdownCard
                    id="page-detail-devices"
                    title="Devices"
                    icon="fa-mobile-alt"
                    tabs={devicesTabs}
                    activeTab={cardTabs.devices}
                    onTab={(t) => setCardTab("devices", t)}
                    onShowAll={setExpandedList}
                  />
                </div>
              )}

              {expandedList && (
                <Modal title={expandedList.title} icon={expandedList.icon} onClose={() => setExpandedList(null)}>
                  <BreakdownList rows={expandedList.rows} valueLabel={expandedList.valueLabel} showPct={expandedList.showPct} />
                </Modal>
              )}
            </>
          ) : (
            <SeoEditor page={page} row={seoRow} currentUser={currentUser} onSaved={onSeoSaved} onError={onSeoError} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PageSEO({ currentUser }) {
  const { toasts, add, remove } = useToast();
  const [dateRange, setDateRange] = useState("30days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [raw, setRaw] = useState(() => getCache(cacheKey("30days")) || null); // { pageViews, events, startDate, endDate }
  const [loading, setLoading] = useState(() => !getCache(cacheKey("30days")));
  const [seoRows, setSeoRows] = useState(null); // { [path]: row } | null while loading
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedPath, setSelectedPath] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-link from Analytics' "Top pages" list (?open=/some/path) — open that
  // page's modal once, then strip the param so it doesn't reopen on
  // back/forward navigation or a later refresh.
  useEffect(() => {
    const open = searchParams.get("open");
    if (!open) return;
    setSelectedPath(open);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("open");
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Custom range with either date not picked yet — nothing to fetch.
  const range = resolveRange(dateRange, customStart, customEnd);

  const fetchAnalytics = useCallback(async () => {
    if (!range) return;
    const { startDate, endDate } = range;
    const key = cacheKey(dateRange, customStart, customEnd);
    const cached = getCache(key);
    if (cached) setRaw(cached); else setLoading(true);
    try {
      const { data: pageViews, error: pvError } = await supabase
        .from("analytics_page_views")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());
      if (pvError) throw pvError;

      const { data: events, error: evError } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString())
        .limit(500);
      if (evError) throw evError;

      const next = { pageViews: pageViews || [], events: events || [], startDate, endDate };
      setRaw(next);
      setCache(key, next);
      setError(null);
    } catch (err) {
      console.error("Page performance fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, customStart, customEnd]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  useEffect(() => {
    supabase
      .from("page_seo")
      .select("path,meta_title,meta_description,og_image")
      .then(({ data, error: err }) => {
        if (err) {
          setError((prev) => prev ||
            (/relation .* does not exist/i.test(err.message)
              ? "The page_seo table doesn't exist yet — run Administrator/Local/scripts/setup-page-seo.sql in the Supabase SQL editor, then reload this page."
              : `Failed to load page SEO overrides: ${err.message}`)
          );
          setSeoRows({});
          return;
        }
        setSeoRows(Object.fromEntries((data || []).map((r) => [r.path, r])));
      });
  }, []);

  const summary = useMemo(() => {
    if (!raw) return [];
    return computeAllPagesSummary(raw.pageViews, STATIC_PAGES, raw.startDate, raw.endDate);
  }, [raw]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summary;
    return summary.filter((p) => p.label.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
  }, [summary, search]);

  const selected = selectedPath ? summary.find((p) => p.path === selectedPath) : null;

  if ((loading && range) || seoRows === null) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-[var(--brand)] mb-4"></i>
          <p className="text-[var(--text-2)]">Loading page performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Toast toasts={toasts} remove={remove} />

      {error && (
        <div className="mb-6 bg-[var(--danger-bg)] border border-[var(--danger)] rounded p-4 text-[var(--danger)]">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6" style={{ gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="tax-tabs" style={{ marginBottom: 0 }}>
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDateRange(opt.key)}
                className={`tax-tab-btn${dateRange === opt.key ? " active" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {dateRange === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <input
                type="date"
                className="form-input"
                style={{ width: "auto" }}
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className="text-xs text-[var(--text-3)]">to</span>
              <input
                type="date"
                className="form-input"
                style={{ width: "auto" }}
                value={customEnd}
                min={customStart || undefined}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>

        <input
          type="text"
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!range ? (
        <p className="text-[var(--text-3)] text-sm">Pick a start and end date to load page performance for that range.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((page) => (
            <PageCard key={page.path} page={page} onOpen={() => setSelectedPath(page.path)} />
          ))}
        </div>
      )}

      {selected && raw && (
        <PageDetailModal
          page={selected}
          pageViews={raw.pageViews}
          events={raw.events}
          startDate={raw.startDate}
          seoRow={seoRows[selected.path]}
          currentUser={currentUser}
          onClose={() => setSelectedPath(null)}
          onSeoSaved={(path, payload) => {
            setSeoRows((r) => ({ ...r, [path]: payload }));
            add(`Saved SEO for ${selected.label}`, "success");
          }}
          onSeoError={(message) => add(message, "error")}
        />
      )}
    </div>
  );
}
