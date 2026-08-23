import React from "react";
import { Link } from "react-router-dom";
import ChevronRight from "../../components/icons/ChevronRight";
import SEO from "../../components/SEO";
import Hero from "./Hero";
import Section1 from "./Section1";
import Section2 from "./Section2";
import Section3, { SteamSection, SaunaControlsSection } from "./Section3";
import Section4 from "./Section4";
import Section5 from "./Section5";
import menuPaths from "../../menuPaths";
import { useLocale, useLocaleT } from "../../i18n/LocaleContext";

const Home = () => {
  const locale = useLocale();
  const tc = useLocaleT("common");
  const t = useLocaleT("home");
  const path = locale === "en" ? "/" : `/${locale}`;
  return (
    <div>
      {/* English keeps no title/description override — falls back to
          SEO.jsx's DEFAULT_TITLE/DEFAULT_DESCRIPTION, which is also what's
          baked into public/index.html so both stay in sync. fi/de pass
          home.json's meta.* block explicitly, since they have no such
          fallback baked into index.html. Every page's meta lives alongside
          its own copy in one file — see README-i18n.md. */}
      <SEO
        path={path}
        rawTitle={locale === "en" ? undefined : t("meta.title")}
        description={locale === "en" ? undefined : t("meta.description")}
        hreflangAlternates={{ en: "/", fi: "/fi", de: "/de" }}
      />
      <Hero />

      {/* Section 1 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <Section1 />
      </div>

      {/* Section 3 (Sauna Rooms / Infrared / Benefits) — moved above Section 2 (Sauna Heaters) */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <Section3 />
      </div>

      {/* Section 2 (Sauna Heaters) */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <Section2 />

        {/* Explore More Button */}
        <div className="text-center mt-6">
          <Link
            to={menuPaths.sauna.heaters.parent}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              lineHeight: "27px",
              color: "#333333",
              textDecoration: "none",
              transition: "color 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#af8564")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#333333")}
          >
            {tc("exploreMore")}
            <ChevronRight />
          </Link>
        </div>
      </div>

      {/* Steam — placed under Sauna Heaters */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <SteamSection />
      </div>

      {/* Sauna Controls — placed under Steam */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <SaunaControlsSection />
      </div>

      {/* Section 4 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <Section4 />
      </div>
      {/* Section 5 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <Section5 />
      </div>
    </div>
  );
};

export default Home;
