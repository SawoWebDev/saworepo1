import React, { useEffect, useState } from "react";
import { logActivity, supabase } from "./supabase";
import { getGDPRBannerEnabled, setGDPRBannerEnabled as saveGDPRBannerEnabled } from "../local-storage/gdprSettings";
import {
  getLanguageSwitcherEnabled, setLanguageSwitcherEnabled as saveLanguageSwitcherEnabled,
  getEnabledLanguages, setEnabledLanguages as saveEnabledLanguages,
  BUILT_LOCALES,
} from "../local-storage/languageSettings";
import { getDashboardTrafficWindow, setDashboardTrafficWindow as saveDashboardTrafficWindow, VALID_WINDOWS } from "../local-storage/dashboardSettings";
import { getDataSource, setDataSource as saveDataSource } from "../local-storage/dataSource";
import { getCache, setCache } from "./adminCache";
import { getPerms } from "./permissions";

const TRAFFIC_WINDOW_OPTIONS = VALID_WINDOWS.map((days) => ({
  value: days,
  label: `${days}d`,
  description: `Dashboard traffic tiles and chart cover the last ${days} days.`,
}));

const DATA_SOURCE_OPTIONS = [
  { value: "supabase", label: "Supabase", description: "Live Supabase rows — the real, always-current data." },
  { value: "neon", label: "Neon (test)", description: "Neon's mirror of Supabase, kept current by a database trigger. For verifying the Neon backup is working, not a resilience feature yet." },
];

// Kept in sync by hand with frontend-next/src/translation/routing.js's
// `localeNames` and frontend/src/i18n/translatedRoutes.js's LOCALES —
// only cosmetic (label shown per locale row), not a source of truth.
const LOCALE_LABELS = { en: "English", fi: "Suomi", de: "Deutsch" };

const SETTINGS_CACHE_KEY = "admin:settings";

// Recipient for the public Contact form's email notification — read server-side
// by react_helpdeskapi/send.php (the React contact form's own PHP backend,
// not passed from the client) so this is the only place that controls where
// inquiries land. Overrides that backend's Europe-hub/info@sawo.com region
// routing when set; falls back to that routing when empty.
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
  const [notifyEmail, setNotifyEmailState] = useState(() => cachedSettings ? cachedSettings.notifyEmail : "");
  const [notifyEmailInput, setNotifyEmailInput] = useState(() => cachedSettings ? cachedSettings.notifyEmail : "");
  const [notifySaving, setNotifySaving] = useState(false);
  const [trafficWindow, setTrafficWindowState] = useState(() => cachedSettings ? cachedSettings.trafficWindow : 30);
  const [trafficWindowSaving, setTrafficWindowSaving] = useState(false);
  const [dataSource, setDataSourceState] = useState(() => cachedSettings ? cachedSettings.dataSource : "supabase");
  const [dataSourceSaving, setDataSourceSaving] = useState(false);
  const [loading, setLoading] = useState(() => !cachedSettings);
  const [error, setError] = useState(null);

  const canChangeDataSource = getPerms(currentUser).can("settings.data_source");

  useEffect(() => {
    Promise.all([
      getGDPRBannerEnabled(),
      getLanguageSwitcherEnabled(), getEnabledLanguages(),
      fetchContactNotifyEmail(),
      getDashboardTrafficWindow(),
      getDataSource(),
    ])
      .then(([gdpr, langEn, langs, notifyEmailVal, trafficWindowVal, dataSourceVal]) => {
        setGdprEnabled(gdpr);
        setLangEnabled(langEn); setLanguages(langs);
        setNotifyEmailState(notifyEmailVal);
        setNotifyEmailInput(notifyEmailVal);
        setTrafficWindowState(trafficWindowVal);
        setDataSourceState(dataSourceVal);
        setCache(SETTINGS_CACHE_KEY, {
          gdprEnabled: gdpr, langEnabled: langEn, languages: langs,
          notifyEmail: notifyEmailVal, trafficWindow: trafficWindowVal, dataSource: dataSourceVal,
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

  const handleSwitchTrafficWindow = async (days) => {
    setTrafficWindowSaving(true);
    setError(null);
    try {
      await saveDashboardTrafficWindow(days, currentUser?.username);
      setTrafficWindowState(days);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "dashboard_traffic_window_days",
        entity_name: `Dashboard Traffic Window → ${days} days`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
      add(`Dashboard now shows the last ${days} days`, "success");
    } catch (err) {
      setError("Failed to save dashboard traffic window: " + err.message);
      add("Failed to save dashboard traffic window", "error");
    } finally {
      setTrafficWindowSaving(false);
    }
  };

  const handleSwitchDataSource = async (value) => {
    if (!canChangeDataSource || value === dataSource) return;
    setDataSourceSaving(true);
    setError(null);
    try {
      await saveDataSource(value, currentUser?.username);
      setDataSourceState(value);
      await logActivity({
        action: "update",
        entity: "app_settings",
        entity_id: "data_source",
        entity_name: `Data Source → ${value}`,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
      add(`Data source switched to ${value === "neon" ? "Neon" : "Supabase"}`, "success");
    } catch (err) {
      setError("Failed to switch data source: " + err.message);
      add("Failed to switch data source", "error");
    } finally {
      setDataSourceSaving(false);
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
          an Odoo helpdesk ticket. Read server-side by react_helpdeskapi/send.php, changes
          apply to the very next submission, no redeploy needed. Leave blank to use the
          default Europe-hub / info@sawo.com region routing.
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

      <div className="card card-body">
        <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
          <i className="fa-solid fa-chart-column text-[var(--brand)]"></i>
          Dashboard Traffic Window
        </h3>
        <p className="text-sm text-[var(--text-3)] mb-4">
          How many days of analytics the Dashboard's traffic tiles and chart cover. Takes effect
          next time the Dashboard loads, no redeploy needed.
        </p>
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          {TRAFFIC_WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.description}
              disabled={trafficWindowSaving}
              onClick={() => handleSwitchTrafficWindow(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                trafficWindow === opt.value
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--text-2)] hover:bg-[var(--surface)]"
              } ${trafficWindowSaving ? "opacity-60 pointer-events-none" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {canChangeDataSource && (
      <div className="card card-body">
        <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
          <i className="fa-solid fa-database text-[var(--brand)]"></i>
          Data Source
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--warning-bg,#fef3c7)] text-[var(--warning,#92400e)]">Superadmin</span>
        </h3>
        <p className="text-sm text-[var(--text-3)] mb-4">
          Where Products, Sauna Rooms, Categories, and Tags are read from across the CMS and public
          site. Neon is a standing mirror of Supabase kept current by a database trigger — this
          switch exists to verify that mirror is working, not as a resilience/failover feature yet.
          Takes effect within seconds, no redeploy needed.
        </p>
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          {DATA_SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.description}
              disabled={dataSourceSaving}
              onClick={() => handleSwitchDataSource(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                dataSource === opt.value
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--text-2)] hover:bg-[var(--surface)]"
              } ${dataSourceSaving ? "opacity-60 pointer-events-none" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {dataSource === "neon" && (
          <p className="text-xs text-[var(--warning,#92400e)] mt-3">
            <i className="fa-solid fa-triangle-exclamation mr-1"></i>
            Currently reading from Neon — this affects the live public site too, not just the CMS.
          </p>
        )}
      </div>
      )}

      </div>
    </div>
  );
}
