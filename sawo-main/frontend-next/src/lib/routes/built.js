// Static routes that actually have a page.jsx under src/app/[locale]/ today.
// sitemap.js reads this so it never emits a URL for a declared-but-unbuilt
// route (routing.js `pathnames` lists ~40 routes for the whole eventual
// site; most aren't built yet). frontend/src/i18n/translatedRoutes.js's
// TRANSLATED_PATHS is hand-synced to this list — append to both together.
export const BUILT_ROUTES = ['/'];
