import React, { useEffect, useState } from "react";
import { logActivity, supabase } from "./supabase";
import { getGDPRBannerEnabled, setGDPRBannerEnabled as saveGDPRBannerEnabled } from "../local-storage/gdprSettings";
import {
  getLanguageSwitcherEnabled, setLanguageSwitcherEnabled as saveLanguageSwitcherEnabled,
  getEnabledLanguages, setEnabledLanguages as saveEnabledLanguages,
  BUILT_LOCALES,
} from "../local-storage/languageSettings";
import { setHeaderLayout as saveHeaderLayout } from "../local-storage/headerLayout";
import { setHeaderNavStyle as saveHeaderNavStyle } from "../local-storage/headerNavStyle";
import { getCache, setCache } from "./adminCache";
import HeaderPreview from "./HeaderPreview";

// Header Layout / Header Nav Style: the public header is fixed in code at
// Layout 1 + Style 2 (components/Header/Header.jsx) — it does NOT read these
// settings, so switching them here has no live effect on the public site.
// That's deliberate: an earlier version had the public header read this pair
// on every visit, which cost every visitor an extra async round trip before
// the header could settle on its final look. Not worth it for a toggle that's
// rarely touched.
//
// The choice is still saved (so it's not lost, and the option to wire it back
// into the live header stays open later) and previewed live below via
// HeaderPreview — a self-contained mock-up that only loads in this
// lazy-loaded Settings chunk, so it never reaches the public homepage bundle.
//
// Also note: these two keys are deliberately absent from appSettings.js's
// PUBLIC_KEYS, so we read them here with a small direct Supabase query
// instead of the public getHeaderLayout()/getHeaderNavStyle() helpers — those
// now always return their hardcoded default, since the public batched fetch
// no longer includes these keys.
const HEADER_PREF_KEYS = ["header_layout", "header_nav_style"];

async function fetchHeaderPrefs() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", HEADER_PREF_KEYS);
  if (error) throw new Error(error.message);
  const byKey = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return {
    headerLayout: byKey.header_layout === "layout1" ? "layout1" : "layout2",
    navStyle: byKey.header_nav_style === "style2" ? "style2" : "style1",
  };
}

const LAYOUT_OPTIONS = [
  { value: "layout1", label: "Layout 1", description: "Sauna, Steam, Infrared, Support, Contact Us, About Us and Careers as separate top-level items. Sauna and Steam each have their own dropdown." },
  { value: "layout2", label: "Layout 2", description: "Single \"Products\" mega-menu covers Sauna/Steam/Infrared, plus Support and About Us (Careers nested under About Us)." },
];

const NAV_STYLE_OPTIONS = [
  { value: "style1", label: "Style 1: Underline", description: "Top-level nav items get a growing underline on hover/active." },
  { value: "style2", label: "Style 2: Brown Background", description: "Top-level nav items get a solid brand-brown pill (beveled like the CMS's primary buttons) on hover/active instead of an underline." },
];

// Kept in sync by hand with frontend-next/src/translation/routing.js's
// `localeNames` and frontend/src/i18n/translatedRoutes.js's LOCALES —
// only cosmetic (label shown per locale row), not a source of truth.
const LOCALE_LABELS = { en: "English", fi: "Suomi", de: "Deutsch" };

const SETTINGS_CACHE_KEY = "admin:settings";

// Recipient for the public Contact form's email notification — read server-side
// by helpdeskapi/send.php on sawo.com (not passed from the client) so this is
// the only place that controls where inquiries land.
const CONTACT_NOTIFY_EMAIL_KEY = "contact_notify_email";

async function fetchContactNotifyEmail() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", CONTACT_NOTIFY_EMAIL_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value || "info@sawo.com";
}

async function saveContactNotifyEmail(email, username) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: CONTACT_NOTIFY_EMAIL_KEY, value: email, updated_by: username || null });
  if (error) throw new Error(error.message);
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "info") => {
    const id = Date.now();
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

export default function Settings({ currentUser }) {
  const { toasts, add, remove } = useToast();
  const cachedSettings = getCache(SETTINGS_CACHE_KEY);
  const [gdprEnabled, setGdprEnabled] = useState(() => cachedSettings ? cachedSettings.gdprEnabled : false);
  const [gdprSaving, setGdprSaving] = useState(false);
  const [langEnabled, setLangEnabled] = useState(() => cachedSettings ? cachedSettings.langEnabled : null);
  const [languages, setLanguages] = useState(() => cachedSettings ? cachedSettings.languages : BUILT_LOCALES);
  const [langSaving, setLangSaving] = useState(false);
  const [headerLayout, setHeaderLayoutState] = useState(() => cachedSettings ? cachedSettings.headerLayout : "layout2");
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [navStyle, setNavStyleState] = useState(() => cachedSettings ? cachedSettings.navStyle : "style1");
  const [navStyleSaving, setNavStyleSaving] = useState(false);
  const [notifyEmail, setNotifyEmailState] = useState(() => cachedSettings ? cachedSettings.notifyEmail : "");
  const [notifyEmailInput, setNotifyEmailInput] = useState(() => cachedSettings ? cachedSettings.notifyEmail : "");
  const [notifySaving, setNotifySaving] = useState(false);
  const [loading, setLoading] = useState(() => !cachedSettings);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getGDPRBannerEnabled(),
      getLanguageSwitcherEnabled(), getEnabledLanguages(), fetchHeaderPrefs(),
      fetchContactNotifyEmail(),
    ])
      .then(([gdpr, langEn, langs, headerPrefs, notifyEmailVal]) => {
        setGdprEnabled(gdpr);
        setLangEnabled(langEn); setLanguages(langs);
        setHeaderLayoutState(headerPrefs.headerLayout);
        setNavStyleState(headerPrefs.navStyle);
        setNotifyEmailState(notifyEmailVal);
        setNotifyEmailInput(notifyEmailVal);
        setCache(SETTINGS_CACHE_KEY, {
          gdprEnabled: gdpr, langEnabled: langEn, languages: langs,
          headerLayout: headerPrefs.headerLayout, navStyle: headerPrefs.navStyle,
          notifyEmail: notifyEmailVal,
        });
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
      add(`GDPR Consent Banner ${next ? "enabled" : "disabled"}`, "success");
    } catch (err) {
      setError("Failed to toggle GDPR banner: " + err.message);
      add("Failed to toggle GDPR banner", "error");
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
      add(`Language Switcher ${next ? "enabled" : "disabled"}`, "success");
    } catch (err) {
      setError("Failed to toggle language switcher: " + err.message);
      add("Failed to toggle language switcher", "error");
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
      add("Enabled languages updated", "success");
    } catch (err) {
      setError("Failed to update enabled languages: " + err.message);
      add("Failed to update enabled languages", "error");
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
      add(`Header Layout saved as ${next === "layout1" ? "Layout 1" : "Layout 2"} (preview only, see note below)`, "success");
    } catch (err) {
      setError("Failed to save header layout: " + err.message);
      add("Failed to save header layout", "error");
    } finally {
      setLayoutSaving(false);
    }
  };

  const handleSwitchNavStyle = async (next) => {
    setNavStyleSaving(true);
    setError(null);
    try {
      await saveHeaderNavStyle(next, currentUser?.username);
      setNavStyleState(next);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "header_nav_style",
        entity_name: `Header Nav Style → ${next}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
      add(`Header Nav Style saved as ${next === "style1" ? "Style 1: Underline" : "Style 2: Brown Background"} (preview only, see note below)`, "success");
    } catch (err) {
      setError("Failed to save header nav style: " + err.message);
      add("Failed to save header nav style", "error");
    } finally {
      setNavStyleSaving(false);
    }
  };

  const handleSaveNotifyEmail = async () => {
    const trimmed = notifyEmailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      add("Enter a valid email address", "error");
      return;
    }
    setNotifySaving(true);
    setError(null);
    try {
      await saveContactNotifyEmail(trimmed, currentUser?.username);
      setNotifyEmailState(trimmed);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "contact_notify_email",
        entity_name: `Contact Form Recipient → ${trimmed}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
      add("Contact form recipient saved", "success");
    } catch (err) {
      setError("Failed to save contact form recipient: " + err.message);
      add("Failed to save contact form recipient", "error");
    } finally {
      setNotifySaving(false);
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
      <Toast toasts={toasts} remove={remove} />
      {error && (
        <div className="mb-6 bg-[var(--danger-bg)] border border-[var(--danger)] rounded p-4 text-[var(--danger)]">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          in the site's codebase, so it cannot be added from here.
        </p>
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
        <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
          <i className="fa-solid fa-inbox text-[var(--brand)]"></i>
          Contact Form Recipient
        </h3>
        <p className="text-sm text-[var(--text-3)] mb-4">
          Where the public Contact form's email notification is sent. Every submission is
          also logged in the Inbox regardless of this setting, and (for all categories) creates
          an Odoo helpdesk ticket. Read server-side by helpdeskapi/send.php — changes apply to
          the very next submission, no redeploy needed.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="email"
            value={notifyEmailInput}
            onChange={(e) => setNotifyEmailInput(e.target.value)}
            disabled={notifySaving}
            placeholder="info@sawo.com"
            className="flex-1 min-w-[220px] px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm"
          />
          <button
            type="button"
            onClick={handleSaveNotifyEmail}
            disabled={notifySaving || notifyEmailInput.trim() === notifyEmail}
            className="btn btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {notifySaving ? "Saving..." : "Save"}
          </button>
        </div>
        <p className="text-xs text-[var(--text-3)] mt-3">Currently: {notifyEmail || "info@sawo.com"}</p>
      </div>

      <div className="card card-body lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
              <i className="fa-solid fa-eye text-[var(--brand)]"></i>
              Header Preview
            </h3>
            <p className="text-sm text-[var(--text-3)]">
              Not live yet. The public header is fixed in code for page-speed reasons.
              These picks are saved and shown below; hover the nav to see the
              dropdown/mega-menu and hover style. Static look-alike, not the real header.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-3)] mb-1">Layout</p>
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.description}
                    disabled={layoutSaving}
                    onClick={() => handleSwitchHeaderLayout(opt.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      headerLayout === opt.value
                        ? "bg-[var(--brand)] text-white"
                        : "text-[var(--text-2)] hover:bg-[var(--surface)]"
                    } ${layoutSaving ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--text-3)] mb-1">Nav Style</p>
              <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
                {NAV_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.description}
                    disabled={navStyleSaving}
                    onClick={() => handleSwitchNavStyle(opt.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      navStyle === opt.value
                        ? "bg-[var(--brand)] text-white"
                        : "text-[var(--text-2)] hover:bg-[var(--surface)]"
                    } ${navStyleSaving ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <HeaderPreview layout={headerLayout} navStyle={navStyle} />
      </div>
      </div>
    </div>
  );
}
