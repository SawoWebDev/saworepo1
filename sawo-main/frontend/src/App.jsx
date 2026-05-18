// src/App.jsx ThemeProvider wraps everything so CSS vars are available on ALL pages
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Components
import ScrollToTop from "./components/ScrollToTop";

// Layouts
import MainLayout  from "./layouts/MainLayout";
import AdminLayout from "./Administrator/AdminLayout";
import menuPaths   from "./menuPaths";

// Public pages
import Home             from "./pages/Home/Home";
import Infrared         from "./pages/Infrared/Infrared";
import About            from "./pages/AboutUs/About";
import Sustainability   from "./pages/AboutUs/Sustainability";
import LatestNews       from "./pages/AboutUs/LatestNews";
import Careers          from "./pages/Careers/Careers";
import Contact          from "./pages/Contact/Contact";
import Sauna            from "./pages/Sauna/Sauna";
import SaunaHeaters     from "./pages/Sauna/SaunaHeaters";
import WallMounted      from "./pages/Sauna/heaters/WallMounted";
import Tower            from "./pages/Sauna/heaters/Tower";
import Stone            from "./pages/Sauna/heaters/Stone";
import Floor            from "./pages/Sauna/heaters/Floor";
import Combi            from "./pages/Sauna/heaters/Combi";
import Dragonfire       from "./pages/Sauna/heaters/Dragonfire";
import SaunaControls    from "./pages/Sauna/SaunaControls";
import SaunaAccessories from "./pages/Sauna/SaunaAccessories";
import SaunaRooms       from "./pages/Sauna/SaunaRooms";
import InteriorDesign   from "./pages/Sauna/rooms/InteriorDesign";
import WoodPanelAndTimbers from "./pages/Sauna/rooms/WoodPanelandTimbers";
import Steam            from "./pages/Steam/Steam";
import SteamGenerators  from "./pages/Steam/SteamGenerators";
import SteamControls    from "./pages/Steam/SteamControls";
import SteamAccessories from "./pages/Steam/SteamAccessories";
import Support          from "./pages/Support/Support";
import SaunaCalculator  from "./pages/Support/SaunaCalculator";
import FAQ              from "./pages/Support/FAQ";
import UserManuals      from "./pages/Support/UserManuals";
import ProductCatalogue from "./pages/Support/ProductCatalogue";
import AllProducts      from "./pages/AllProducts";
import PrivacyPolicy   from "./pages/PrivacyPolicy";
import Sitemap         from "./pages/Sitemap";
import PailsLadles        from "./pages/Sauna/accessories/PailsLadles";
import Thermometers       from "./pages/Sauna/accessories/Thermometers";
import ClocksSandtimers   from "./pages/Sauna/accessories/ClocksSandtimers";
import SaunaLights        from "./pages/Sauna/accessories/SaunaLights";
import HeadrestsBackrests from "./pages/Sauna/accessories/HeadrestsBackrests";
import DoorsHandles       from "./pages/Sauna/accessories/DoorsHandles";
import BenchesFloorTiles  from "./pages/Sauna/accessories/BenchesFloorTiles";
import Kivistone          from "./pages/Sauna/accessories/Kivistone";
import VentilationsAddOns from "./pages/Sauna/accessories/VentilationsAddOns";
import AccessorySets from "./pages/Sauna/accessories/AccessorySets";

// Dynamic product detail pages
import ProductPageRouter from "./pages/ProductPageRouter";
import DispAccessories from "./pages/IndividualDisplay/DispAccessories";
import AccessoriesCatalog from "./pages/AccessoriesCatalog";
import DispSaunaRoom from "./pages/IndividualDisplay/DispSaunaRoom";

// Admin pages
import Login     from "./Administrator/Login";
import ResetPassword from "./Administrator/ResetPassword";
import Users     from "./Administrator/Users";
import Products  from "./Administrator/Products";
import SaunaRoomsAdmin from "./Administrator/SaunaRoomsCMS";
import Models    from "./Administrator/Models";
import Taxonomy  from "./Administrator/Taxonomy";
import Logs  from "./Administrator/Logs";
import ProtectedRoute from "./Administrator/ProtectedRoute";

export default function App() {
  return (
      <Router>
        <ScrollToTop />
        <Routes>

          {/*  Public  */}
          <Route path="*" element={
            <MainLayout>
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
              </Routes>
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
          <Route path="/admin/taxonomy" element={
            <ProtectedRoute requiredCap="page.taxonomy"><AdminLayout><Taxonomy /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute requiredCap="page.logs"><AdminLayout><Logs /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/models" element={
            <ProtectedRoute requiredCap="page.models"><AdminLayout><Models /></AdminLayout></ProtectedRoute>
          } />

          {/* Legacy editor products route — redirect to unified products page */}
          <Route path="/admin/editor/products" element={
            <Navigate to="/admin/products" replace />
          } />

          {/* Redirect root /admin login */}
          <Route path="/admin" element={<Navigate to="/login" replace />} />

        </Routes>
      </Router>
  );
}