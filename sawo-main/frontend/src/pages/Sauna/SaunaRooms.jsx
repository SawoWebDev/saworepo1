import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SaunaRooms.css";
import "./heaters/heaters.css";
import BrochureDropdownButton from "../../components/Buttons/BrochureDropdownButton";
import HeroWave from "../../components/HeroWave";
import SEO from "../../components/SEO";
import menuPaths from "../../menuPaths";
import SaunaRoomViewer from "./rooms/SaunaRoomViewer";
import SaunaCalculatorCTA from "../../components/SaunaCalculatorCTA";
import SaunaFeatures from "./rooms/SaunaFeatures";
import SaunaProductDetails from "./rooms/SaunaProductDetails";
import SaunaRoomDetails from "./rooms/SaunaRoomDetails";
import { SRD_PANELS } from "./rooms/SaunaRoomData";
import Sauna3DTeaser from "./rooms/Sauna3DTeaser";
import SaunaWoodMaterials from "./rooms/SaunaWoodMaterials";
import SaunaCallToAction from "./rooms/SaunaCallToAction";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import { useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";
import img_1214RS_LATEST_NEW_SAUNA_ROOM from "../../assets/1214RS_LATEST-NEW-SAUNA-ROOM.webp";
import img_1419RS_LATEST_NEW_SAUNA_ROOM from "../../assets/1419RS_LATEST-NEW-SAUNA-ROOM.webp";
import img_1922RL_LATEST_NEW_SAUNA_ROOM from "../../assets/1922RL_LATEST-NEW-SAUNA-ROOM.webp";
import img_1414RS_GLASS_FRONT_CEDAR_PERSPECTIVE_VIEW_V2 from "../../assets/1414RS_GLASS-FRONT-CEDAR_PERSPECTIVE-VIEW-V2.webp";
import img_1420RS_GLASS_FRONT_CEDAR_PERSPECTIVE_VIEW_V2 from "../../assets/1420RS_GLASS-FRONT-CEDAR_PERSPECTIVE-VIEW-V2.webp";
import img_1922RS_GLASS_FRONT_CEDAR_PERSPECTIVE_VIEW_V2 from "../../assets/1922RS_GLASS-FRONT-CEDAR_PERSPECTIVE-VIEW-V2.webp";
import img_SAWO_sauna_heaters_floor_TRD_NS from "../../assets/SAWO_sauna_heaters_floor_TRD_NS.webp";
import img_SAWO_sauna_heaters_tower_SW3_Round_Ni2 from "../../assets/SAWO_sauna_heaters_tower_SW3_Round_Ni2.webp";
import img_SAWO_sauna_heaters_floor_Nordex_Pro_NS from "../../assets/SAWO_sauna_heaters_floor_Nordex_Pro_NS.webp";
import img_SAWO_sauna_heaters_wall_KRI_Ni2 from "../../assets/SAWO_sauna_heaters_wall_KRI_Ni2.webp";
import img_SAWO_sauna_series_tower_ARI_Round_Black_Ni2 from "../../assets/SAWO_sauna_series_tower_ARI_Round_Black_Ni2.webp";
import img_SAWO_sauna_heaters_wall_SCA_NS from "../../assets/SAWO_sauna_heaters_wall_SCA_NS.webp";
import img_Traditional from "../../assets/Traditional.webp";
import img_Essential_v3 from "../../assets/Essential-v3.webp";
import img_Signature_BL_v4_copy from "../../assets/Signature-BL-v4-copy.webp";
import img_Dragon_BL_v3 from "../../assets/Dragon-BL-v3.webp";

// ── DATA ──────────────────────────────────────────────────────────────────────

// Was a 2000x2000, 232KB image served straight from the WordPress media
// library with no resizing/compression for a full-bleed CSS background —
// resized to 1920x1920 and re-encoded at WebP q75 (down to ~95KB, ~59%
// smaller) and hosted on R2 instead, since the hero sits under a dark
// overlay + text scrim that already hides most fine detail loss.
const SAUNA_ROOMS_HERO_IMG = "https://saworepo1.pages.dev/media/site-assets/sauna-rooms-hero-93a47116.webp";
const SAUNA_ROOMS_BROCHURE_URL = "https://heyzine.com/flip-book/576de453b2.html";

// Infrared moved to its own page (/infrared/saunas) on 2026-08-20, so the
// "About This Room" carousel here no longer offers its pill — same reasoning
// as DEFAULT_ROOMS in SaunaRoomViewer.jsx.
const ROOM_DETAIL_PANELS = SRD_PANELS.filter((p) => p.pill !== "Infrared");

const ROOM_IMGS = [img_1214RS_LATEST_NEW_SAUNA_ROOM, img_1419RS_LATEST_NEW_SAUNA_ROOM, img_1922RL_LATEST_NEW_SAUNA_ROOM, img_1414RS_GLASS_FRONT_CEDAR_PERSPECTIVE_VIEW_V2, img_1420RS_GLASS_FRONT_CEDAR_PERSPECTIVE_VIEW_V2, img_1922RS_GLASS_FRONT_CEDAR_PERSPECTIVE_VIEW_V2];
const HEATER_IMGS = [img_SAWO_sauna_heaters_floor_TRD_NS, img_SAWO_sauna_heaters_tower_SW3_Round_Ni2, img_SAWO_sauna_heaters_floor_Nordex_Pro_NS, img_SAWO_sauna_heaters_wall_KRI_Ni2, img_SAWO_sauna_series_tower_ARI_Round_Black_Ni2, img_SAWO_sauna_heaters_wall_SCA_NS];
const ACCESSORY_IMGS = [img_Traditional, img_Essential_v3, img_Signature_BL_v4_copy, img_Dragon_BL_v3];

// Copy (name/tag/desc) comes from sauna.json's roomsPage.configurator.* — this
// just pairs each translated item back up with its static image import,
// which can't live in JSON.
function buildConfiguratorSteps(t) {
  const withImgs = (items, imgs) => items.map((item, i) => ({ ...item, img: imgs[i] }));
  return [
    {
      key: 'room', title: t("roomsPage.configurator.stepLabels.room"), heading: t("roomsPage.configurator.stepHeadings.room"), multi: false,
      items: withImgs(['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].map(id => ({ id, ...t(`roomsPage.configurator.rooms.${id}`, { returnObjects: true }) })), ROOM_IMGS),
    },
    {
      key: 'heater', title: t("roomsPage.configurator.stepLabels.heater"), heading: t("roomsPage.configurator.stepHeadings.heater"), multi: false,
      items: withImgs(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(id => ({ id, ...t(`roomsPage.configurator.heaters.${id}`, { returnObjects: true }) })), HEATER_IMGS),
    },
    {
      key: 'accessory', title: t("roomsPage.configurator.stepLabels.accessory"), heading: t("roomsPage.configurator.stepHeadings.accessory"), multi: true,
      items: withImgs(['a1', 'a2', 'a3', 'a4'].map(id => ({ id, ...t(`roomsPage.configurator.accessories.${id}`, { returnObjects: true }) })), ACCESSORY_IMGS),
    },
  ];
}

const SaunaConfigurator = () => {
  const t = useLocaleT("sauna");
  const localize = useLocalizedPath();
  const CONFIGURATOR_STEPS = useMemo(() => buildConfiguratorSteps(t), [t]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({ room: null, heater: null, accessory: [] });
  const productsRef = useRef(null);

  const goToStep = (idx) => {
    if (idx < 0 || idx >= CONFIGURATOR_STEPS.length) return;
    setCurrentStep(idx);
  };

  const selectItem = (key, id, multi) => {
    setSelections((prev) => {
      if (multi) {
        const arr = prev[key];
        const newArr = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
        return { ...prev, [key]: newArr };
      }
      return { ...prev, [key]: prev[key] === id ? null : id };
    });
  };

  const handleSidebarItemClick = (stepIdx) => {
    goToStep(stepIdx);
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const step = CONFIGURATOR_STEPS[currentStep];
  const roomSel = selections.room ? CONFIGURATOR_STEPS[0].items.find((x) => x.id === selections.room) : null;
  const heaterSel = selections.heater ? CONFIGURATOR_STEPS[1].items.find((x) => x.id === selections.heater) : null;
  const accessoryNames = selections.accessory.map((id) => CONFIGURATOR_STEPS[2].items.find((x) => x.id === id)?.name).filter(Boolean);

  const ctaHref = (() => {
    if (!selections.room) return '#';
    const parts = [];
    parts.push('Room: ' + roomSel.name);
    if (selections.heater) parts.push('Heater: ' + heaterSel.name);
    if (accessoryNames.length > 0) parts.push('Accessories: ' + accessoryNames.join(', '));
    const subject = 'Customize My Sauna, ' + parts.join(' | ');
    return localize(menuPaths.contact) + '?subject=' + encodeURIComponent(subject);
  })();

  return (
    <div className="sawo-configurator">
      <div className="sawo-cfg-header">
        <div className="cfg-title">{t("roomsPage.configurator.title")}</div>
        <p className="cfg-desc">{t("roomsPage.configurator.desc")}</p>
      </div>

      <div className="sawo-steps">
        {CONFIGURATOR_STEPS.map((s, i) => {
          const hasSel = s.multi ? selections[s.key].length > 0 : selections[s.key] !== null;
          const isActive = i === currentStep;
          const isCompleted = hasSel && !isActive;
          const label = s.key === 'room' ? t("roomsPage.configurator.steps.room") : s.key === 'heater' ? t("roomsPage.configurator.steps.heater") : t("roomsPage.configurator.steps.accessories");
          return (
            <button
              key={s.key}
              className={`sawo-step-tab${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
              onClick={() => goToStep(i)}
            >
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="sawo-cfg-body">
        <div className="sawo-cfg-products" ref={productsRef}>
          <div className="sawo-cfg-step-title">{step.title}</div>
          <div className="sawo-cfg-step-heading">{step.heading}</div>
          {step.multi && <div className="sawo-multi-note">{t("roomsPage.configurator.multiNote")}</div>}

          <div className="sawo-cfg-grid" style={{ animation: 'sawoCfgFadeUp 0.45s ease both' }}>
            {step.items.map((item) => {
              const isSelected = step.multi ? selections[step.key].includes(item.id) : selections[step.key] === item.id;
              return (
                <div
                  key={item.id}
                  className={`sawo-prod-card${isSelected ? ' selected' : ''}`}
                  onClick={() => selectItem(step.key, item.id, step.multi)}
                >
                  <div className="prod-img"><img src={item.img} alt={item.name} loading="lazy" /></div>
                  <div className="prod-info">
                    <span className="prod-tag">{item.tag}</span>
                    <div className="prod-name">{item.name}</div>
                    <div className="prod-desc">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sawo-cfg-nav">
            {currentStep > 0 ? (
              <button className="sawo-cfg-nav-btn prev" onClick={() => goToStep(currentStep - 1)}>&larr; {t("roomsPage.configurator.back")}</button>
            ) : (
              <button className="sawo-cfg-nav-btn hidden">&larr;</button>
            )}
            {currentStep < CONFIGURATOR_STEPS.length - 1 ? (
              <button className="sawo-cfg-nav-btn next" onClick={() => goToStep(currentStep + 1)}>{t("roomsPage.configurator.next")} &rarr;</button>
            ) : (
              <span />
            )}
          </div>
        </div>

        <div className="sawo-cfg-sidebar">
          <div className="sidebar-title">{t("roomsPage.configurator.yourSelection")}</div>

          <div className={`sawo-sidebar-item${roomSel ? ' has-selection' : ''}`} onClick={() => handleSidebarItemClick(0)}>
            <div className="sb-icon">
              {roomSel ? (
                <img src={roomSel.img} alt={roomSel.name} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 14h18"/><path d="M7 6V4m10 2V4"/></svg>
              )}
            </div>
            <div className="sb-text">
              <div className="sb-label">{t("roomsPage.configurator.steps.room")}</div>
              <div className="sb-value">{roomSel ? roomSel.name : t("roomsPage.configurator.notSelected")}</div>
            </div>
          </div>

          <div className={`sawo-sidebar-item${heaterSel ? ' has-selection' : ''}`} onClick={() => handleSidebarItemClick(1)}>
            <div className="sb-icon">
              {heaterSel ? (
                <img src={heaterSel.img} alt={heaterSel.name} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5"><path d="M12 2c1 3 4 5 4 9a4 4 0 1 1-8 0c0-4 3-6 4-9z"/><path d="M12 22v-4"/></svg>
              )}
            </div>
            <div className="sb-text">
              <div className="sb-label">{t("roomsPage.configurator.steps.heater")}</div>
              <div className="sb-value">{heaterSel ? heaterSel.name : t("roomsPage.configurator.notSelected")}</div>
            </div>
          </div>

          <div className={`sawo-sidebar-item${accessoryNames.length > 0 ? ' has-selection' : ''}`} onClick={() => handleSidebarItemClick(2)}>
            <div className="sb-icon">
              {selections.accessory.length > 0 ? (
                <img src={CONFIGURATOR_STEPS[2].items.find((x) => x.id === selections.accessory[0])?.img} alt="Accessories" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5"><path d="M8 2v4m8-4v4"/><rect x="3" y="6" width="18" height="5" rx="1"/><path d="M5 11v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9"/></svg>
              )}
            </div>
            <div className="sb-text">
              <div className="sb-label">{t("roomsPage.configurator.steps.accessories")}</div>
              <div className="sb-value">
                {accessoryNames.length === 0
                  ? t("roomsPage.configurator.notSelected")
                  : accessoryNames.length <= 2
                  ? accessoryNames.join(', ')
                  : t("roomsPage.configurator.itemsSelected", { count: accessoryNames.length })}
              </div>
            </div>
          </div>

          <a
            href={ctaHref}
            className={`sawo-cfg-cta${!selections.room ? ' disabled' : ''}`}
            target={selections.room ? '_blank' : undefined}
            rel={selections.room ? 'noopener noreferrer' : undefined}
          >
            {t("roomsPage.configurator.cta")}
          </a>
          <div className="sawo-cfg-cta-hint">
            {selections.room
              ? t("roomsPage.configurator.ctaHintReady")
              : t("roomsPage.configurator.ctaHintEmpty")}
          </div>
        </div>
      </div>
    </div>
  );
};


const SaunaRooms = () => {
  const heroLoaded = useHeroLoaded(SAUNA_ROOMS_HERO_IMG);
  const navigate = useNavigate();
  const { hash } = useLocation();
  const t = useLocaleT("sauna");
  const tc = useLocaleT("common");
  const localize = useLocalizedPath();

  // Infrared left this page for /infrared/saunas on 2026-08-20. A hash never
  // reaches the router's path matching, so the old deep link can only be
  // caught here — without this it would land on /sauna/rooms with no
  // infrared tab to select, which reads as a broken link. replace:true keeps
  // the dead URL out of history so Back doesn't bounce through it.
  useEffect(() => {
    if (hash === "#infrared-sauna-room") {
      navigate(localize(menuPaths.infrared.saunas), { replace: true });
    }
  }, [hash, navigate, localize]);

  return (
    <div>
      <SEO
        title={t("roomsPage.meta.title")}
        description={t("roomsPage.meta.description")}
        path={localize("/sauna/rooms")}
        hreflangAlternates={{ en: "/sauna/rooms", zh: "/zh/sauna/rooms" }}
      />
      {/* HERO */}
      <section
        className="wm-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{ backgroundColor: "#241c17" }}
      >
        {/* Hero photo — faded in only once fully loaded, instead of popping in abruptly */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${SAUNA_ROOMS_HERO_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: heroLoaded ? 1 : 0,
            transition: "opacity 0.6s ease",
            zIndex: 0,
          }}
        />
        <div className="wm-hero-overlay" />
        <div className="wm-hero-content">
          <h1 className="wm-hero-title">{t("roomsPage.hero.title")}</h1>
          <p className="wm-hero-subtitle">{t("roomsPage.hero.subtitle")}</p>
          <div style={{ marginTop: "32px" }}>
            <BrochureDropdownButton
              text={tc("viewBrochure")}
              items={[{ label: t("roomsPage.hero.catalogueButton"), href: SAUNA_ROOMS_BROCHURE_URL }]}
            />
          </div>
        </div>
        <HeroWave />
      </section>

      <SaunaRoomViewer />
      <SaunaCalculatorCTA />
      <SaunaFeatures />
      <SaunaProductDetails />
      <SaunaRoomDetails panels={ROOM_DETAIL_PANELS} />
      <Sauna3DTeaser />
      <SaunaWoodMaterials />
      <SaunaConfigurator />
      <SaunaCallToAction />
    </div>
  );
};

export default SaunaRooms;
