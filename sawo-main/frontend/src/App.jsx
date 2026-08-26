// src/App.jsx ThemeProvider wraps everything so CSS vars are available on ALL pages
import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Components (always needed — small, no lazy needed)
import ScrollToTop from "./components/ScrollToTop";
// GDPRConsent itself is lazy-loaded inside the gate, only when the CMS
// toggle (Settings page) is on — see components/GDPRConsentGate.jsx.
// Mounted inside the public route below (not here at Router level) so it
// never runs — no settings fetch, no banner — on /admin/* or /login.
import GDPRConsentGate from "./components/GDPRConsentGate";

// Small non-component admin helpers — imported eagerly (not lazily) because
// AdminLanding below needs them synchronously to resolve a redirect target.
import { getSession } from "./Administrator/supabase";
import { getLandingPath } from "./Administrator/permissions";
import { getEffectiveRole } from "./Administrator/previewRole";

// Layouts
import MainLayout  from "./layouts/MainLayout";
import menuPaths   from "./menuPaths";

// i18n — /fi/* and /de/* mirror the whole public route tree below (see
// LOCALE_PREFIXES), each route wrapped in LocaleRoute so it renders with the
// matching i18next language active.
import { LOCALE_PREFIXES } from "./i18n/translatedRoutes";
import LocaleRoute from "./i18n/LocaleRoute";
import { LocaleContext } from "./i18n/LocaleContext";

// Home is the landing page — keep it in the main bundle so it paints
// immediately (no chunk round-trip → fast, detectable LCP, no layout swap).
import Home from "./pages/Home/Home";

// Every OTHER route is lazy-loaded so it gets its own chunk and stays out
// of the initial download.
const Infrared         = lazy(() => import("./pages/Infrared/Infrared"));
const InfraredSaunas   = lazy(() => import("./pages/Infrared/InfraredSaunas"));
const InfraredPanels   = lazy(() => import("./pages/Infrared/InfraredPanels"));
const InfraredControls = lazy(() => import("./pages/Infrared/InfraredControls"));
const About            = lazy(() => import("./pages/AboutUs/About"));
const Sustainability   = lazy(() => import("./pages/AboutUs/Sustainability"));
const LatestNews       = lazy(() => import("./pages/AboutUs/LatestNews"));
const Careers          = lazy(() => import("./pages/Careers/Careers"));
const Contact          = lazy(() => import("./pages/Contact/Contact"));
const Sauna            = lazy(() => import("./pages/Sauna/Sauna"));
const SaunaHeaters     = lazy(() => import("./pages/Sauna/SaunaHeaters"));
const WallMounted      = lazy(() => import("./pages/Sauna/heaters/WallMounted"));
const Tower            = lazy(() => import("./pages/Sauna/heaters/Tower"));
const Stone            = lazy(() => import("./pages/Sauna/heaters/Stone"));
const Floor            = lazy(() => import("./pages/Sauna/heaters/Floor"));
const Combi            = lazy(() => import("./pages/Sauna/heaters/Combi"));
const Dragonfire       = lazy(() => import("./pages/Sauna/heaters/Dragonfire"));
const SaunaControls    = lazy(() => import("./pages/Sauna/SaunaControls"));
const SaunaAccessories = lazy(() => import("./pages/Sauna/SaunaAccessories"));
const SaunaRooms       = lazy(() => import("./pages/Sauna/SaunaRooms"));
const InteriorDesign   = lazy(() => import("./pages/Sauna/rooms/InteriorDesign"));
const WoodPanelAndTimbers = lazy(() => import("./pages/Sauna/rooms/WoodPanelandTimbers"));
const Steam            = lazy(() => import("./pages/Steam/Steam"));
const SteamGenerators  = lazy(() => import("./pages/Steam/SteamGenerators"));
const SteamControls    = lazy(() => import("./pages/Steam/SteamControls"));
const SteamAccessories = lazy(() => import("./pages/Steam/SteamAccessories"));
const Support          = lazy(() => import("./pages/Support/Support"));
const SaunaCalculator  = lazy(() => import("./pages/Support/SaunaCalculator"));
const FAQ              = lazy(() => import("./pages/Support/FAQ"));
const UserManuals      = lazy(() => import("./pages/Support/UserManuals"));
const ProductCatalogue = lazy(() => import("./pages/Support/ProductCatalogue"));
const AllProducts      = lazy(() => import("./pages/AllProducts"));
const PrivacyPolicy    = lazy(() => import("./pages/PrivacyPolicy"));
const Sitemap          = lazy(() => import("./pages/Sitemap"));
const NotFound         = lazy(() => import("./pages/NotFound"));
const PailsLadles        = lazy(() => import("./pages/Sauna/accessories/PailsLadles"));
const Thermometers       = lazy(() => import("./pages/Sauna/accessories/Thermometers"));
const ClocksSandtimers   = lazy(() => import("./pages/Sauna/accessories/ClocksSandtimers"));
const SaunaLights        = lazy(() => import("./pages/Sauna/accessories/SaunaLights"));
const HeadrestsBackrests = lazy(() => import("./pages/Sauna/accessories/HeadrestsBackrests"));
const DoorsHandles       = lazy(() => import("./pages/Sauna/accessories/DoorsHandles"));
const BenchesFloorTiles  = lazy(() => import("./pages/Sauna/accessories/BenchesFloorTiles"));
const Kivistone          = lazy(() => import("./pages/Sauna/accessories/Kivistone"));
const VentilationsAddOns = lazy(() => import("./pages/Sauna/accessories/VentilationsAddOns"));
const AccessorySets      = lazy(() => import("./pages/Sauna/accessories/AccessorySets"));
const ProductPageRouter  = lazy(() => import("./pages/ProductPageRouter"));
const DispAccessories    = lazy(() => import("./pages/IndividualDisplay/DispAccessories"));
const AccessoriesCatalog = lazy(() => import("./pages/AccessoriesCatalog"));
const HeatersCatalog = lazy(() => import("./pages/HeatersCatalog"));
const DispSaunaRoom      = lazy(() => import("./pages/IndividualDisplay/DispSaunaRoom"));

// Admin pages — separate chunks, only loaded when authenticated users visit /admin/*
// AdminLayout included: a static import would drag Administrator/supabase (the
// whole supabase-js SDK) plus admin.css into the main bundle every visitor downloads.
const AdminLayout    = lazy(() => import("./Administrator/AdminLayout"));
const Login          = lazy(() => import("./Administrator/Login"));
const ResetPassword  = lazy(() => import("./Administrator/ResetPassword"));
const Dashboard      = lazy(() => import("./Administrator/Dashboard"));
const Profile        = lazy(() => import("./Administrator/Profile"));
const Users          = lazy(() => import("./Administrator/Users"));
const Products       = lazy(() => import("./Administrator/Products"));
const Translations   = lazy(() => import("./Administrator/Translations/Translations"));
const TranslationProductDetail = lazy(() => import("./Administrator/Translations/TranslationProductDetail"));
const SaunaRoomsAdmin = lazy(() => import("./Administrator/SaunaRoomsCMS"));
const Models         = lazy(() => import("./Administrator/Models"));
const Taxonomy       = lazy(() => import("./Administrator/Taxonomy"));
const Logs           = lazy(() => import("./Administrator/Logs"));
const Inbox          = lazy(() => import("./Administrator/Inbox"));
const Analytics      = lazy(() => import("./Administrator/Analytics"));
const PageSEO        = lazy(() => import("./Administrator/PageSEO"));
const SeoKeywordIntelligence = lazy(() => import("./Administrator/SeoKeywordIntelligence"));
const CIStatus       = lazy(() => import("./Administrator/CIStatus"));
const WebsiteHealth  = lazy(() => import("./Administrator/WebsiteHealth"));
const Settings        = lazy(() => import("./Administrator/Settings"));
const Trash           = lazy(() => import("./Administrator/Trash"));
const RolesPermissions = lazy(() => import("./Administrator/RolesPermissions"));
const ProtectedRoute = lazy(() => import("./Administrator/ProtectedRoute"));

// Resolves /admin to whichever page this role can actually see — Dashboard
// for most roles, Products for a viewer (who has no page.dashboard). Kept as
// a tiny component rather than a static <Navigate> so the target is computed
// from the live session/preview role at render time.
function AdminLanding() {
  const session = getSession();
  const role = getEffectiveRole(session?.user?.role);
  return <Navigate to={getLandingPath(role)} replace />;
}

// Prefixes a route path with a locale segment ("" = English, unprefixed).
// "/" + "fi" -> "/fi" (not "/fi/"); "/sauna" + "fi" -> "/fi/sauna".
function withLocale(prefix, routePath) {
  if (!prefix) return routePath;
  return routePath === "/" ? `/${prefix}` : `/${prefix}${routePath}`;
}

// The public route table — every entry here is mounted once per locale
// prefix in LOCALE_PREFIXES (English unprefixed, plus /fi and /de), each
// wrapped in LocaleRoute so the right i18next language is active. Only Home
// has real fi/de copy today (see i18n/translatedRoutes.js's
// TRANSLATED_PATHS); every other page renders its existing English content
// under the locale prefix too, so a visitor never hits a 404 — it just
// isn't advertised as translated yet.
const PUBLIC_ROUTES = [
  { path: menuPaths.home,                    element: <Home /> },
  { path: menuPaths.infrared.parent,         element: <Infrared /> },
  { path: menuPaths.infrared.saunas,         element: <InfraredSaunas /> },
  // /infrared/room was this page's path until 2026-08-20 and went out on
  // main, so it redirects rather than 404s.
  { path: "/infrared/room",                  element: <Navigate to={menuPaths.infrared.saunas} replace /> },
  { path: menuPaths.infrared.panels,         element: <InfraredPanels /> },
  { path: menuPaths.infrared.controls,       element: <InfraredControls /> },
  { path: menuPaths.about.parent,            element: <About /> },
  { path: menuPaths.about.sustainability,    element: <Sustainability /> },
  { path: menuPaths.about.news,              element: <LatestNews /> },
  { path: menuPaths.sauna.parent,            element: <Sauna /> },
  { path: menuPaths.steam.parent,            element: <Steam /> },
  { path: menuPaths.support.parent,          element: <Support /> },
  { path: menuPaths.careers,                 element: <Careers /> },
  { path: menuPaths.contact,                 element: <Contact /> },
  { path: menuPaths.sauna.heaters.parent,    element: <SaunaHeaters /> },
  { path: menuPaths.sauna.heaters.wallMounted, element: <WallMounted /> },
  { path: menuPaths.sauna.heaters.tower,     element: <Tower /> },
  { path: menuPaths.sauna.heaters.stone,     element: <Stone /> },
  { path: menuPaths.sauna.heaters.floor,     element: <Floor /> },
  { path: menuPaths.sauna.heaters.combi,     element: <Combi /> },
  { path: menuPaths.sauna.heaters.dragonfire, element: <Dragonfire /> },
  { path: menuPaths.sauna.controls,          element: <SaunaControls /> },
  { path: menuPaths.sauna.accessories.parent, element: <SaunaAccessories /> },
  { path: menuPaths.sauna.accessories.pailsLadles,        element: <PailsLadles /> },
  { path: menuPaths.sauna.accessories.thermometers,       element: <Thermometers /> },
  { path: menuPaths.sauna.accessories.clocksSandtimers,   element: <ClocksSandtimers /> },
  { path: menuPaths.sauna.accessories.lightsCovers,       element: <SaunaLights /> },
  { path: menuPaths.sauna.accessories.headrestsBackrests, element: <HeadrestsBackrests /> },
  { path: menuPaths.sauna.accessories.doorsHandles,       element: <DoorsHandles /> },
  { path: menuPaths.sauna.accessories.benches,            element: <BenchesFloorTiles /> },
  { path: menuPaths.sauna.accessories.kivistone,          element: <Kivistone /> },
  { path: menuPaths.sauna.accessories.ventilations,       element: <VentilationsAddOns /> },
  { path: menuPaths.sauna.accessories.accessorySets,      element: <AccessorySets /> },
  { path: menuPaths.sauna.rooms,             element: <SaunaRooms /> },
  { path: menuPaths.sauna.interiorDesigns,   element: <InteriorDesign /> },
  { path: menuPaths.sauna.woodPanels,        element: <WoodPanelAndTimbers /> },
  { path: menuPaths.steam.generators,        element: <SteamGenerators /> },
  { path: menuPaths.steam.controls,          element: <SteamControls /> },
  { path: menuPaths.steam.accessories,       element: <SteamAccessories /> },
  { path: menuPaths.support.faq,             element: <FAQ /> },
  { path: menuPaths.support.saunaCalculator, element: <SaunaCalculator /> },
  { path: menuPaths.support.manuals,         element: <UserManuals /> },
  { path: menuPaths.support.catalogue,       element: <ProductCatalogue /> },
  { path: "/products",                       element: <AllProducts /> },
  { path: menuPaths.privacy,                 element: <PrivacyPolicy /> },
  { path: menuPaths.sitemap,                 element: <Sitemap /> },
  { path: "/products/:slug",                 element: <ProductPageRouter /> },
  { path: menuPaths.accessories,             element: <AccessoriesCatalog /> },
  { path: menuPaths.heaters,                 element: <HeatersCatalog /> },
  { path: "/accessories/:slug",              element: <DispAccessories /> },
  { path: "/sauna/rooms/:slug",              element: <DispSaunaRoom /> },
];

// MainLayout's Header/Footer render as siblings of the routed page content,
// not descendants of it — so the per-route <LocaleRoute> provider (which
// only wraps the matched page element) never reaches them, and any
// useLocaleT() call inside Header/Footer silently falls back to the
// LocaleContext default ("en") no matter what /fi or /de page is showing.
// This derives the locale straight from the URL and provides it one level
// up, wrapping MainLayout (Header + page + Footer) as a whole.
function localeFromPathname(pathname) {
  const seg = pathname.split("/")[1] || "";
  return LOCALE_PREFIXES.includes(seg) ? seg || "en" : "en";
}

function RouteLocale({ children }) {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export default function App() {
  return (
      <Router>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>

            {/*  Public  */}
            <Route path="*" element={
              <RouteLocale>
                {/* Controlled by the "GDPR Consent Banner" toggle on
                    /admin/settings. Sibling of MainLayout (not inside its
                    <main>) so this fixed-position banner never mounts (no
                    settings fetch, no banner code) on /admin/* or /login. */}
                <GDPRConsentGate />
                <MainLayout>
                <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
                  <Routes>
                    {LOCALE_PREFIXES.flatMap((prefix) => {
                      const locale = prefix || "en";
                      return PUBLIC_ROUTES.map(({ path, element }) => (
                        <Route
                          key={`${locale}:${path}`}
                          path={withLocale(prefix, path)}
                          element={<LocaleRoute locale={locale}>{element}</LocaleRoute>}
                        />
                      ));
                    })}

                    {/* 404 Not Found page - must be last */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                </MainLayout>
              </RouteLocale>
            } />

            {/*  Admin  */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredCap="page.dashboard"><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute requiredCap="page.profile"><AdminLayout><Profile /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredCap="page.users"><AdminLayout><Users /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/permissions" element={
              <ProtectedRoute requiredCap="page.permissions"><AdminLayout><RolesPermissions /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute><AdminLayout><Products /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/translations" element={
              <ProtectedRoute requiredCap="page.translations"><AdminLayout><Translations /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/translations/products/:productId" element={
              <ProtectedRoute requiredCap="page.translations"><AdminLayout><TranslationProductDetail /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/sauna-rooms" element={
              <ProtectedRoute requiredCap="sauna_rooms.view"><AdminLayout><SaunaRoomsAdmin /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/taxonomy" element={
              <ProtectedRoute requiredCap="page.taxonomy"><AdminLayout><Taxonomy /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute requiredCap="page.logs"><AdminLayout><Logs /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/inbox" element={
              <ProtectedRoute requiredCap="page.inbox"><AdminLayout><Inbox /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/models" element={
              <ProtectedRoute requiredCap="page.models"><AdminLayout><Models /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requiredCap="page.analytics"><AdminLayout><Analytics /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/seo" element={
              <ProtectedRoute requiredCap="page.seo"><AdminLayout><PageSEO /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/seo-keywords" element={
              <ProtectedRoute requiredCap="page.seo_keyword_intel"><AdminLayout><SeoKeywordIntelligence /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/ci-status" element={
              <ProtectedRoute requiredCap="page.ci_status"><AdminLayout><CIStatus /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/website-health" element={
              <ProtectedRoute requiredCap="page.website_health"><AdminLayout><WebsiteHealth /></AdminLayout></ProtectedRoute>
            } />
            {/* Language settings merged into Settings (below) */}
            <Route path="/admin/language" element={<Navigate to="/admin/settings" replace />} />
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredCap="page.settings"><AdminLayout><Settings /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/trash" element={
              <ProtectedRoute requiredCap="page.trash"><AdminLayout><Trash /></AdminLayout></ProtectedRoute>
            } />

            {/* Legacy editor products route — redirect to unified products page */}
            <Route path="/admin/editor/products" element={
              <Navigate to="/admin/products" replace />
            } />

            {/* Root /admin — lands on whatever page this role actually has.
                Dashboard for most, Products for a viewer (no page.dashboard).
                Wrapped in ProtectedRoute so unauthenticated visitors still go
                to /login rather than resolving a landing path for nobody. */}
            <Route path="/admin" element={
              <ProtectedRoute><AdminLanding /></ProtectedRoute>
            } />

          </Routes>
        </Suspense>
      </Router>
  );
}
