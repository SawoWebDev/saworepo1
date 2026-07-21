import { routing } from './routing';

/**
 * Reads the language-switcher visibility config that the old admin CMS
 * writes to Supabase's `app_settings` table (see the CRA app's
 * src/local-storage/languageSettings.js — same table, same two keys).
 *
 * This is a display-only toggle: it decides whether the switcher renders and
 * which of the *built* locales it shows. It never changes which locales
 * actually exist/build — that's still `routing.locales` above.
 *
 * Plain REST fetch (not the Supabase SDK) so this stays a couple of KB and
 * doesn't pull the SDK into a Server Component that runs on every request.
 * Revalidated every 30s so a CMS toggle takes effect quickly without hitting
 * Supabase on literally every request.
 */
export async function getLanguageSwitcherSettings() {
  const fallback = { enabled: true, languages: [...routing.locales] };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallback;

  try {
    const res = await fetch(
      `${url}/rest/v1/app_settings?key=in.(language_switcher_enabled,enabled_languages)&select=key,value`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const byKey = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));

    const enabled = typeof byKey.language_switcher_enabled === 'boolean'
      ? byKey.language_switcher_enabled
      : fallback.enabled;

    const rawLanguages = Array.isArray(byKey.enabled_languages) ? byKey.enabled_languages : null;
    const languages = rawLanguages
      ? routing.locales.filter((loc) => rawLanguages.includes(loc))
      : fallback.languages;

    return { enabled, languages: languages.length > 0 ? languages : fallback.languages };
  } catch (err) {
    console.warn('[translation/settings] Falling back to all-locales-enabled:', err.message);
    return fallback;
  }
}
