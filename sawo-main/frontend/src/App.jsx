// src/App.jsx ThemeProvider wraps everything so CSS vars are available on ALL pages
import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components (always needed — small, no lazy needed)
import ScrollToTop from "./components/ScrollToTop";
// import GDPRConsent from "./components/GDPRConsent"; // temporarily disabled

// Layouts
import MainLayout  from "./layouts/MainLayout";
import AdminLayout from "./Administrator/AdminLayout";
import menuPaths   from "./menuPaths";

// Home is the landing page — keep it in the main bundle so it paints
// immediately (no chunk round-trip → fast, detectable LCP, no layout swap).
import Home from "./pages/Home/Home";

// Every OTHER route is lazy-loaded so it gets its own chunk and stays out
// of the initial download.
const Infrared         = lazy(() => import("./pages/Infrared/Infrared"));
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
const DispSaunaRoom      = lazy(() => import("./pages/IndividualDisplay/DispSaunaRoom"));

// Admin pages — separate chunks, only loaded when authenticated users visit /admin/*
const Login          = lazy(() => import("./Administrator/Login"));
const ResetPassword  = lazy(() => import("./Administrator/ResetPassword"));
const Users          = lazy(() => import("./Administrator/Users"));
const Products       = lazy(() => import("./Administrator/Products"));
const SaunaRoomsAdmin = lazy(() => import("./Administrator/SaunaRoomsCMS"));
const ContentCMS     = lazy(() => import("./Administrator/ContentCMS"));
const Models         = lazy(() => import("./Administrator/Models"));
const Taxonomy       = lazy(() => import("./Administrator/Taxonomy"));
const Logs           = lazy(() => import("./Administrator/Logs"));
const Analytics      = lazy(() => import("./Administrator/Analytics"));
const ProtectedRoute = lazy(() => import("./Administrator/ProtectedRoute"));

export default function App() {
  return (
      <Router>
        <ScrollToTop />
        {/* Consent banner temporarily disabled — re-enable when ready */}
        {/* <GDPRConsent /> */}
        <Suspense fallback={null}>
          <Routes>

            {/*  Public  */}
            <Route path="*" element={
              <MainLayout>
                <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
                  <Routes>
                    <Route path={menuPaths.home}                    element={<Home />} />
                    <Route path={menuPaths.infrared}                element={<Infrared />} />
                    <Route path={menuPaths.about.parent}            element={<About />} />
                    <Route path={menuPaths.about.sustainability}    element={<Sustainability />} />
                    <Route path={menuPaths.about.news}              element={<LatestNews />} />
                    <Route path={menuPaths.sauna.parent}            element={<Sauna />} />
                    <Route path={menuPaths.steam.parent}            element={<Steam />} />
                    <Route path={menuPaths.support.parent}          element={<Support />} />
                    <Route path={menuPaths.careers}                 element={<Careers />} />
                    <Route path={menuPaths.contact}                 element={<Contact />} />
                    <Route path={menuPaths.sauna.heaters.parent}    element={<SaunaHeaters />} />
                    <Route path={menuPaths.sauna.heaters.wallMounted} element={<WallMounted />} />
                    <Route path={menuPaths.sauna.heaters.tower}     element={<Tower />} />
                    <Route path={menuPaths.sauna.heaters.stone}     element={<Stone />} />
                    <Route path={menuPaths.sauna.heaters.floor}     element={<Floor />} />
                    <Route path={menuPaths.sauna.heaters.combi}     element={<Combi />} />
                    <Route path={menuPaths.sauna.heaters.dragonfire} element={<Dragonfire />} />
                    <Route path={menuPaths.sauna.controls}          element={<SaunaControls />} />
                    <Route path={menuPaths.sauna.accessories.parent} element={<SaunaAccessories />} />
                    <Route path={menuPaths.sauna.accessories.pailsLadles}        element={<PailsLadles />} />
                    <Route path={menuPaths.sauna.accessories.thermometers}       element={<Thermometers />} />
                    <Route path={menuPaths.sauna.accessories.clocksSandtimers}   element={<ClocksSandtimers />} />
                    <Route path={menuPaths.sauna.accessories.lightsCovers}       element={<SaunaLights />} />
                    <Route path={menuPaths.sauna.accessories.headrestsBackrests} element={<HeadrestsBackrests />} />
                    <Route path={menuPaths.sauna.accessories.doorsHandles}       element={<DoorsHandles />} />
                    <Route path={menuPaths.sauna.accessories.benches}            element={<BenchesFloorTiles />} />
                    <Route path={menuPaths.sauna.accessories.kivistone}          element={<Kivistone />} />
                    <Route path={menuPaths.sauna.accessories.ventilations}       element={<VentilationsAddOns />} />
                    <Route path={menuPaths.sauna.accessories.accessorySets}      element={<AccessorySets />} />
                    <Route path={menuPaths.sauna.rooms}             element={<SaunaRooms />} />
                    <Route path={menuPaths.sauna.interiorDesigns}   element={<InteriorDesign />} />
                    <Route path={menuPaths.sauna.woodPanels}        element={<WoodPanelAndTimbers />} />
                    <Route path={menuPaths.steam.generators}        element={<SteamGenerators />} />
                    <Route path={menuPaths.steam.controls}          element={<SteamControls />} />
                    <Route path={menuPaths.steam.accessories}       element={<SteamAccessories />} />
                    <Route path={menuPaths.support.faq}             element={<FAQ />} />
                    <Route path={menuPaths.support.saunaCalculator} element={<SaunaCalculator />} />
                    <Route path={menuPaths.support.manuals}         element={<UserManuals />} />
                    <Route path={menuPaths.support.catalogue}       element={<ProductCatalogue />} />
                    <Route path="/products" element={<AllProducts />} />
                    <Route path={menuPaths.privacy}              element={<PrivacyPolicy />} />
                    <Route path={menuPaths.sitemap}              element={<Sitemap />} />

                    {/* Single product detail page */}
                    <Route path="/products/:slug" element={<ProductPageRouter />} />

                    {/* Accessories catalog (all accessories listing) */}
                    <Route path="/accessories" element={<AccessoriesCatalog />} />

                    {/* Single accessory product detail page */}
                    <Route path="/accessories/:slug" element={<DispAccessories />} />

                    {/* Single sauna room detail page */}
                    <Route path="/sauna/rooms/:slug" element={<DispSaunaRoom />} />

                    {/* 404 Not Found page - must be last in nested routes */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </MainLayout>
            } />

            {/*  Admin  */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />

            <Route path="/admin/users" element={
              <ProtectedRoute requiredCap="page.users"><AdminLayout><Users /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute><AdminLayout><Products /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/sauna-rooms" element={
              <ProtectedRoute requiredCap="sauna_rooms.view"><AdminLayout><SaunaRoomsAdmin /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/content" element={
              <ProtectedRoute requiredCap="page.content"><AdminLayout><ContentCMS /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/taxonomy" element={
              <ProtectedRoute requiredCap="page.taxonomy"><AdminLayout><Taxonomy /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute requiredCap="page.logs"><AdminLayout><Logs /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/models" element={
              <ProtectedRoute requiredCap="page.models"><AdminLayout><Models /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requiredCap="page.analytics"><AdminLayout><Analytics /></AdminLayout></ProtectedRoute>
            } />

            {/* Legacy editor products route — redirect to unified products page */}
            <Route path="/admin/editor/products" element={
              <Navigate to="/admin/products" replace />
            } />

            {/* Redirect root /admin login */}
            <Route path="/admin" element={<Navigate to="/login" replace />} />

          </Routes>
        </Suspense>
      </Router>
  );
}
