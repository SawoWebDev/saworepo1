import React from "react";
// Same two stylesheets SaunaRooms.jsx pulls in, for the same reason: the
// room viewer's markup (.room-wrapper, .sauna-tabs-wrapper, …) is styled in
// SaunaRooms.css, and the .wm-hero-* hero treatment lives in heaters.css.
// This page deliberately reuses both rather than restyling, so it stays
// visually identical to /sauna/rooms as the two evolve.
import "../Sauna/SaunaRooms.css";
import "../Sauna/heaters/heaters.css";
import BrochureDropdownButton from "../../components/Buttons/BrochureDropdownButton";
import HeroWave from "../../components/HeroWave";
import SEO from "../../components/SEO";
import SaunaRoomViewer from "../Sauna/rooms/SaunaRoomViewer";
import SaunaProductDetails from "../Sauna/rooms/SaunaProductDetails";
import SaunaRoomDetails from "../Sauna/rooms/SaunaRoomDetails";
import SaunaWoodMaterials from "../Sauna/rooms/SaunaWoodMaterials";
import SaunaCallToAction from "../Sauna/rooms/SaunaCallToAction";
import WellnessBenefits from "../../components/WellnessBenefits";
import SaunaCalculatorCTA from "../../components/SaunaCalculatorCTA";
import {
  IR_SPD_SLIDES, IR_MATS_ITEMS, SRD_PANELS,
} from "../Sauna/rooms/SaunaRoomData";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import { useLocale, useLocaleT } from "../../i18n/LocaleContext";
import heroBg from "../../assets/Infrared/hero.webp";

// Same 12 cards as Home's Section3.jsx and the Infrared hub — see
// WellnessBenefits.jsx's file header. The component itself takes translated
// content as a prop rather than reading i18n directly, so every caller that
// wants non-default copy builds this the same way Section3 does.
const BENEFIT_KEYS = [
  ["stressRelief", "fas fa-spa"],
  ["heartHealth", "fas fa-heartbeat"],
  ["respiratoryRelief", "fas fa-lungs"],
  ["muscleRecovery", "fas fa-dumbbell"],
  ["betterSleep", "fas fa-bed"],
  ["diseasePrevention", "fas fa-heart"],
  ["skinDetox", "fas fa-droplet"],
  ["collagenBoost", "fas fa-wand-magic-sparkles"],
  ["skinHydration", "fas fa-hand-holding-droplet"],
  ["immuneSupport", "fas fa-shield-alt"],
  ["metabolismBoost", "fas fa-fire"],
  ["mentalWellness", "fas fa-smile"],
];

// The About This Room carousel on /sauna/rooms rotates through all four room
// types. Here it is pinned to the infrared panel: on a page about one room, a
// carousel that wanders off to the Compact Sauna Room is a way out of the
// page, not a feature. Selected by pill rather than index so reordering
// SRD_PANELS cannot silently point this at the wrong room.
const IR_ROOM_PANEL = SRD_PANELS.filter((p) => p.pill === "Infrared");

// Maps IR_MATS_ITEMS' English `name` (image/alt live only in the data file,
// not in translation JSON) to the matching key under infrared.json's
// saunas.woodMaterials.items, mirroring SaunaWoodMaterials.jsx's own
// WOOD_KEYS lookup pattern.
const IR_WOOD_KEYS = { Cedar: "cedar", Hemlock: "hemlock" };

const INFRARED_BROCHURE_URL =
  "https://www.sawo.com/wp-content/uploads/2026/07/SAWO-Infrared-Brochure-2026-1.pdf";

/**
 * InfraredSaunas — the infrared range's own page.
 *
 * Infrared used to be a fourth tab inside /sauna/rooms' viewer. It was split
 * out on 2026-08-20 so the infrared range lives in one place; that page's
 * tab is gone and its old #infrared-sauna-room hash redirects here (see SaunaRooms.jsx).
 *
 * Every section is the same component /sauna/rooms uses, driven by infrared
 * data rather than the traditional-sauna set — see the IR_* exports in
 * SaunaRoomData. Those components take their data as props precisely so this
 * page can exist without forking them.
 *
 * The viewer is pinned to the infrared room with its tab bar suppressed: a
 * one-button tab bar is noise. Two sections from /sauna/rooms are still not
 * reproduced — the 3D teaser (its model is a classic cabin) and the
 * configurator (its middle step picks a heater, which an infrared room does
 * not have).
 */
const InfraredSaunas = () => {
  const locale = useLocale();
  const t = useLocaleT("infrared");
  const tc = useLocaleT("common");
  const heroLoaded = useHeroLoaded(heroBg);

  const benefitCards = BENEFIT_KEYS.map(([key, icon]) => ({
    key, icon,
    label: tc(`wellnessBenefits.${key}.label`),
    desc: tc(`wellnessBenefits.${key}.desc`),
  }));

  const translatedMatsItems = IR_MATS_ITEMS.map((mat) => {
    const key = IR_WOOD_KEYS[mat.name];
    const tr = key ? t(`saunas.woodMaterials.items.${key}`, { returnObjects: true }) : null;
    return tr ? { ...mat, name: tr.name, description: tr.description, traits: tr.traits } : mat;
  });

  return (
    <div>
      <SEO
        title={t("saunas.meta.title")}
        description={t("saunas.meta.description")}
        path={locale === "en" ? "/infrared/saunas" : `/${locale}/infrared/saunas`}
        hreflangAlternates={{ en: "/infrared/saunas", fi: "/fi/infrared/saunas", zh: "/zh/infrared/saunas" }}
      />

      {/* HERO */}
      <section
        className="wm-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{ backgroundColor: "#241c17" }}
      >
        {/* Faded in only once loaded, so it doesn't pop in — same as /sauna/rooms */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
            zIndex: 0,
          }}
        />
        <div className="wm-hero-overlay" />
        <div className="wm-hero-content">
          <h1 className="wm-hero-title">{t("saunas.hero.title")}</h1>
          <p className="wm-hero-subtitle">
            {t("saunas.hero.subtitle")}
          </p>
          <div style={{ marginTop: "32px" }}>
            <BrochureDropdownButton
              text={t("saunas.hero.brochureBtn")}
              items={[{ label: t("saunas.hero.brochureItemLabel"), href: INFRARED_BROCHURE_URL }]}
            />
          </div>
        </div>
        <HeroWave />
      </section>

      <SaunaRoomViewer rooms={["infrared"]} showTabs={false} />

      <SaunaCalculatorCTA />

      <SaunaProductDetails
        slides={IR_SPD_SLIDES}
        storySections={t("saunas.productDetails.storySections", { returnObjects: true })}
        featureText={t("saunas.productDetails.featureText")}
        perfCards={t("saunas.productDetails.perfCards", { returnObjects: true })}
        accordionItems={t("saunas.productDetails.accordionItems", { returnObjects: true })}
        title={t("saunas.productDetails.title")}
      />

      <WellnessBenefits cards={benefitCards} fullBleed={false} />

      <SaunaRoomDetails panels={IR_ROOM_PANEL} showNav={false} />

      <SaunaWoodMaterials
        items={translatedMatsItems}
        subtitle={t("saunas.woodMaterials.subtitle")}
      />

      <SaunaCallToAction />
    </div>
  );
};

export default InfraredSaunas;
