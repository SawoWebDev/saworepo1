import React, { useEffect, useState } from "react";
import { logActivity } from "./supabase";
import {
  getDataSource, setDataSource as saveDataSource,
  getJsonSourceScope, setJsonSourceScope as saveJsonSourceScope,
} from "../local-storage/dataSource";
import { getGDPRBannerEnabled, setGDPRBannerEnabled as saveGDPRBannerEnabled } from "../local-storage/gdprSettings";
import {
  getLanguageSwitcherEnabled, setLanguageSwitcherEnabled as saveLanguageSwitcherEnabled,
  getEnabledLanguages, setEnabledLanguages as saveEnabledLanguages,
  BUILT_LOCALES,
} from "../local-storage/languageSettings";
import { getHeaderLayout, setHeaderLayout as saveHeaderLayout } from "../local-storage/headerLayout";
import { getCache, setCache } from "./adminCache";

const LAYOUT_OPTIONS = [
  { value: "layout1", label: "Layout 1", description: "Sauna, Steam, Infrared, Support, Contact Us, About Us and Careers as separate top-level items — Sauna and Steam each have their own dropdown." },
  { value: "layout2", label: "Layout 2", description: "Current header: a single \"Products\" mega-menu covers Sauna/Steam/Infrared, plus Support and About Us (Careers nested under About Us). Default." },
];

// Kept in sync by hand with frontend-next/src/translation/routing.js's
// `localeNames` and frontend/src/i18n/translatedRoutes.js's LOCALES —
// only cosmetic (label shown per locale row), not a source of truth.
const LOCALE_LABELS = { en: "English", fi: "Suomi", de: "Deutsch" };

const SETTINGS_CACHE_KEY = "admin:settings";

// Moved out of the sidebar footer (was a bare <select> wedged next to
// logout/theme) — this is a high-stakes, rarely-changed control (it changes
// what the PUBLIC site serves), so it belongs on a dedicated page rather
// than one accidental click away at all times. See local-storage/dataSource.js.
const SOURCE_OPTIONS = [
  { value: "github", label: "GitHub", description: "The GitHub-synced JSON snapshot (bundled products.json). Current default." },
  { value: "supabase", label: "Supabase", description: "Live Supabase rows, direct and instant. No sync step needed." },
  { value: "jsonfile", label: "Json File", description: "A single hand-edited JSON file in the images repo, scoped below. Falls back to the GitHub snapshot outside that scope." },
];

const SCOPE_OPTIONS = [
  { value: "accessories", label: "Accessories" },
  { value: "all", label: "All (coming soon)", disabled: true },
  { value: "saunarooms", label: "Sauna Rooms (coming soon)", disabled: true },
  { value: "heaters", label: "Heaters (coming soon)", disabled: true },
];

export default function Settings({ currentUser }) {
  const cachedSettings = getCache(SETTINGS_CACHE_KEY);
  const [source, setSource] = useState(() => cachedSettings ? cachedSettings.source : null);
  const [scope, setScope] = useState(() => cachedSettings ? cachedSettings.scope : "accessories");
  const [switching, setSwitching] = useState(false);
  const [gdprEnabled, setGdprEnabled] = useState(() => cachedSettings ? cachedSettings.gdprEnabled : false);
  const [gdprSaving, setGdprSaving] = useState(false);
  const [langEnabled, setLangEnabled] = useState(() => cachedSettings ? cachedSettings.langEnabled : null);
  const [languages, setLanguages] = useState(() => cachedSettings ? cachedSettings.languages : BUILT_LOCALES);
  const [langSaving, setLangSaving] = useState(false);
  const [headerLayout, setHeaderLayoutState] = useState(() => cachedSettings ? cachedSettings.headerLayout : "layout2");
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [loading, setLoading] = useState(() => !cachedSettings);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getDataSource(), getJsonSourceScope(), getGDPRBannerEnabled(),
      getLanguageSwitcherEnabled(), getEnabledLanguages(), getHeaderLayout(),
    ])
      .then(([s, sc, gdpr, langEn, langs, hLayout]) => {
        setSource(s); setScope(sc); setGdprEnabled(gdpr);
        setLangEnabled(langEn); setLanguages(langs);
        setHeaderLayoutState(hLayout);
        setCache(SETTINGS_CACHE_KEY, { source: s, scope: sc, gdprEnabled: gdpr, langEnabled: langEn, languages: langs, headerLayout: hLayout });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleGDPR = async (next) => {
    setGdprSaving(true);
    setError(null);
    try {
      await saveGDPRBannerEnabled(next, currentUser?.username);
      setGdprEnabled(next);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "gdpr_banner_enabled",
        entity_name: `GDPR Consent Banner → ${next ? "enabled" : "disabled"}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
    } catch (err) {
      setError("Failed to toggle GDPR banner: " + err.message);
    } finally {
      setGdprSaving(false);
    }
  };

  const handleToggleLangEnabled = async (next) => {
    setLangSaving(true);
    setError(null);
    try {
      await saveLanguageSwitcherEnabled(next, currentUser?.username);
      setLangEnabled(next);
      await logActivity({
        action:      "update",
        entity:      "app_settings",
        entity_id:   "language_switcher_enabled",
        entity_name: `Language Switcher → ${next ? "enabled" : "disabled"}`,
        username:    currentUser?.username,
        user_id:     currentUser?.id,
      });
    } catch (err) {
      setError("Failed to toggle language switcher: " + err.message);
    } finally {
      setLangSaving(false);
    }
  };

  const handleToggleLanguage = async (locale, checked) => {
    const next = checked
      ? [...languages, locale]
      : languages.filter((loc) => loc !== locale);

    if (next.length === 0) {
      setError("At least one language must stay enabled.");
      return;
    }

    setLangSaving(true);
    setError(null);
    try {
      await saveEnabledLanguages(next, currentUser?.username);
      setLanguages(next);
      await logActivity({
        action:      "update",
        entity:      "app_settings",
        entity_id:   "enabled_languages",
        entity_name: `Enabled Languages → ${next.join(", ")}`,
        username:    currentUser?.username,
        user_id:     currentUser?.id,
      });
    } catch (err) {
      setError("Failed to update enabled languages: " + err.message);
    } finally {
      setLangSaving(false);
    }
  };

  const handleSwitchHeaderLayout = async (next) => {
    setLayoutSaving(true);
    setError(null);
    try {
      await saveHeaderLayout(next, currentUser?.username);
      setHeaderLayoutState(next);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "header_layout",
        entity_name: `Header Layout → ${next}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
    } catch (err) {
      setError("Failed to switch header layout: " + err.message);
    } finally {
      setLayoutSaving(false);
    }
  };

  const handleSwitchSource = async (next) => {
    setSwitching(true);
    setError(null);
    try {
      await saveDataSource(next, currentUser?.username);
      setSource(next);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "data_source",
        entity_name: `Live Data Source → ${next}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
    } catch (err) {
      setError("Failed to switch data source: " + err.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleSwitchScope = async (next) => {
    setSwitching(true);
    setError(null);
    try {
      await saveJsonSourceScope(next, currentUser?.username);
      setScope(next);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "json_source_scope",
        entity_name: `Json Source Scope → ${next}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
    } catch (err) {
      setError("Failed to switch json source scope: " + err.message);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-[var(--brand)] mb-4"></i>
          <p className="text-[var(--text-2)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 bg-[var(--danger-bg)] border border-[var(--danger)] rounded p-4 text-[var(--danger)]">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card card-body">
        <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
          <i className="fa-solid fa-satellite-dish text-[var(--brand)]"></i>
          Live Data Source
        </h3>
        <p className="text-sm text-[var(--text-3)] mb-4">
          Controls where the public site reads product / sauna room / site content
          data from. Takes effect for visitors within seconds, no redeploy needed.
        </p>

        <div className="space-y-2 mb-4">
          {SOURCE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                source === opt.value
                  ? "border-[var(--brand)] bg-[var(--brand-muted)]"
                  : "border-[var(--border)] hover:bg-[var(--surface-2)]"
              } ${switching ? "opacity-60 pointer-events-none" : ""}`}
            >
              <input
                type="radio"
                name="data-source"
                value={opt.value}
                checked={source === opt.value}
                onChange={() => handleSwitchSource(opt.value)}
                disabled={switching}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{opt.label}</p>
                <p className="text-xs text-[var(--text-3)]">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        {source === "jsonfile" && (
          <div className="pl-4 border-l-2 border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">
              Json File scope
            </label>
            <select
              value={scope}
              disabled={switching}
              onChange={(e) => handleSwitchScope(e.target.value)}
              title="Which product group the Json File source applies to. Only Accessories is available today; edits to it live in the images repo's allaccs-data.json, not in this admin."
              className="filter-select"
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card card-body">
        <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
          <i className="fa-solid fa-bars text-[var(--brand)]"></i>
          Header Layout
        </h3>
        <p className="text-sm text-[var(--text-3)] mb-4">
          Controls the public site's header nav structure. Takes effect for visitors
          within seconds, no redeploy needed.
        </p>

        <div className="space-y-2">
          {LAYOUT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                headerLayout === opt.value
                  ? "border-[var(--brand)] bg-[var(--brand-muted)]"
                  : "border-[var(--border)] hover:bg-[var(--surface-2)]"
              } ${layoutSaving ? "opacity-60 pointer-events-none" : ""}`}
            >
              <input
                type="radio"
                name="header-layout"
                value={opt.value}
                checked={headerLayout === opt.value}
                onChange={() => handleSwitchHeaderLayout(opt.value)}
                disabled={layoutSaving}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{opt.label}</p>
                <p className="text-xs text-[var(--text-3)]">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="card card-body">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
              <i className="fa-solid fa-cookie-bite text-[var(--brand)]"></i>
              GDPR Consent Banner
            </h3>
            <p className="text-sm text-[var(--text-3)]">
              Shows the cookie/data consent banner to public visitors. When off, the
              banner's code isn't even loaded on the public site, so there is zero page-speed cost.
            </p>
          </div>
          <label className={`relative inline-flex items-center flex-shrink-0 ${gdprSaving ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              checked={gdprEnabled}
              disabled={gdprSaving}
              onChange={(e) => handleToggleGDPR(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--surface-2)] border border-[var(--border)] rounded-full peer peer-checked:bg-[var(--brand)] transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>

      <div className="card card-body">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <i className="fas fa-language text-[var(--brand)]"></i>
            Language Switcher
          </h3>
          <label className={`relative inline-flex items-center flex-shrink-0 ${langSaving ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!langEnabled}
              disabled={langSaving}
              onChange={(e) => handleToggleLangEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-[var(--surface-2)] border border-[var(--border)] rounded-full peer peer-checked:bg-[var(--brand)] transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>
        <p className="text-sm text-[var(--text-3)] mb-4">
          {langEnabled ? "Visible on every page of the public site." : "Hidden from visitors right now."}
        </p>

        <div className="space-y-3">
          {BUILT_LOCALES.map((loc) => {
            const checked = languages.includes(loc);
            return (
              <div
                key={loc}
                className="flex items-center justify-between pb-3 border-b border-[var(--border-light)] last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{LOCALE_LABELS[loc] || loc}</p>
                  <p className="text-xs text-[var(--text-3)] uppercase tracking-wide">{loc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    disabled={langSaving || !langEnabled}
                    onChange={(e) => handleToggleLanguage(loc, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-checked:bg-[var(--brand)] rounded-full peer transition-colors relative opacity-100 peer-disabled:opacity-50">
                    <div
                      className={`absolute top-0.5 left-0.5 bg-[var(--surface)] w-5 h-5 rounded-full shadow transition-transform ${
                        checked ? "translate-x-5" : ""
                      }`}
                    />
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[var(--text-3)] mt-4">
          Only affects the switcher itself. A hidden language's pages still exist, stay indexable,
          and remain in the sitemap. Adding a brand-new language still requires a build-time change
          in the site's codebase — it cannot be added from here.
        </p>
      </div>
      </div>
    </div>
  );
}
