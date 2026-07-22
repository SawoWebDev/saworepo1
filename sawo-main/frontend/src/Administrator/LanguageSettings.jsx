import React, { useEffect, useState } from "react";
import { logActivity } from "./supabase";
import {
  getLanguageSwitcherEnabled, setLanguageSwitcherEnabled as saveLanguageSwitcherEnabled,
  getEnabledLanguages, setEnabledLanguages as saveEnabledLanguages,
  BUILT_LOCALES,
} from "../local-storage/languageSettings";
import { getCache, setCache } from "./adminCache";

const LANGUAGE_SETTINGS_CACHE_KEY = "admin:language-settings";

// Kept in sync by hand with frontend-next/src/translation/routing.js's
// `localeNames` and frontend/src/i18n/translatedRoutes.js's LOCALES —
// only cosmetic (label shown per locale row), not a source of truth.
const LOCALE_LABELS = { en: "English", fi: "Suomi", de: "Deutsch" };

export default function LanguageSettings({ currentUser }) {
  const cachedSettings = getCache(LANGUAGE_SETTINGS_CACHE_KEY);
  const [enabled,   setEnabled]   = useState(() => cachedSettings ? cachedSettings.enabled : null);
  const [languages, setLanguages] = useState(() => cachedSettings ? cachedSettings.languages : BUILT_LOCALES);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(() => !cachedSettings);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    Promise.all([getLanguageSwitcherEnabled(), getEnabledLanguages()])
      .then(([e, l]) => {
        setEnabled(e);
        setLanguages(l);
        setCache(LANGUAGE_SETTINGS_CACHE_KEY, { enabled: e, languages: l });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleEnabled = async (next) => {
    setSaving(true);
    setError(null);
    try {
      await saveLanguageSwitcherEnabled(next, currentUser?.username);
      setEnabled(next);
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
      setSaving(false);
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

    setSaving(true);
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-[var(--brand)] mb-4"></i>
          <p className="text-[var(--text-2)]">Loading language settings...</p>
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

      {/* Switcher visibility */}
      <div className="card card-body mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i
              className={`fas fa-language text-2xl ${enabled ? "text-[var(--brand)]" : "text-[var(--text-3)]"}`}
            ></i>
            <div>
              <h3 className="text-lg font-bold text-[var(--text)]">Language Switcher</h3>
              <p className="text-sm text-[var(--text-2)]">
                {enabled ? "Visible on every page of the public site." : "Hidden from visitors right now."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              disabled={saving}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-[var(--border)] peer-checked:bg-[var(--brand)] rounded-full peer transition-colors relative">
              <div
                className={`absolute top-0.5 left-0.5 bg-[var(--surface)] w-5 h-5 rounded-full shadow transition-transform ${
                  enabled ? "translate-x-5" : ""
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Per-language visibility */}
      <div className="card card-body mb-6">
        <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2">
          <i className="fas fa-globe text-[var(--brand)]"></i>
          Languages Shown in the Switcher
        </h3>
        <p className="text-sm text-[var(--text-3)] mb-4">
          Only affects the switcher itself. A hidden language's pages still exist, stay indexable, and remain in the sitemap.
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
                    disabled={saving || !enabled}
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
      </div>

      {/* Info Box */}
      <div className="bg-[var(--info-bg)] border border-[var(--info)] rounded p-4">
        <p className="text-[var(--info)] text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          <strong>Note:</strong> this page only controls visibility of already-built languages
          (English, Finnish, German). Adding a brand-new language still requires a build-time
          change in the site's codebase. It cannot be added from here.
        </p>
      </div>
    </div>
  );
}
