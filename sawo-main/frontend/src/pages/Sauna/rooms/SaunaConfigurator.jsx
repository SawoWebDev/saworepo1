import React, { useState, useMemo, useRef, useCallback } from "react";
import { CONFIGURATOR_STEPS } from "./SaunaRoomData";
import menuPaths from "../../../menuPaths";
import { useLocaleT, useLocalizedPath } from "../../../i18n/LocaleContext";

// CONFIGURATOR_STEPS' item ids (r1-r6/h1-h6/a1-a4, defined in
// SaunaRoomData.jsx) are stable and match roomsPage.configurator.{rooms,
// heaters,accessories} in the sauna.json locales 1:1 — translate by id, not
// by matching the English string, so this can't silently break the way
// cfg.desc's literal-matching did (see SaunaRoomViewer.jsx's ROOM_DESC_KEYS
// comment for that incident).
const STEP_GROUP = { room: "rooms", heater: "heaters", accessory: "accessories" };
// steps.* (tab labels) uses "accessories" (plural) for the 3rd tab while
// step.key/stepLabels/stepHeadings use "accessory" (singular) — mirrors the
// English data's own inconsistency, kept explicit here rather than papered
// over.
const TAB_LABEL_KEY = { room: "room", heater: "heater", accessory: "accessories" };

const SaunaConfigurator = () => {
  const t = useLocaleT("sauna");
  const localize = useLocalizedPath();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({ room: null, heater: null, accessory: [] });
  const productsRef = useRef(null);

  const trName = useCallback((stepKey, id) => t(`roomsPage.configurator.${STEP_GROUP[stepKey]}.${id}.name`), [t]);
  const trTag = useCallback((stepKey, id) => t(`roomsPage.configurator.${STEP_GROUP[stepKey]}.${id}.tag`), [t]);
  const trDesc = useCallback((stepKey, id) => t(`roomsPage.configurator.${STEP_GROUP[stepKey]}.${id}.desc`), [t]);

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
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const step = CONFIGURATOR_STEPS[currentStep];
  const roomSel      = selections.room    ? CONFIGURATOR_STEPS[0].items.find((x) => x.id === selections.room)    : null;
  const heaterSel    = selections.heater  ? CONFIGURATOR_STEPS[1].items.find((x) => x.id === selections.heater)  : null;
  const accessorySel = selections.accessory.map((id) => CONFIGURATOR_STEPS[2].items.find((x) => x.id === id)).filter(Boolean);
  const accessoryNames = accessorySel.map((x) => trName("accessory", x.id));

  // The inquiry subject line is submitted to the contact form / backend, not
  // rendered as page copy — kept in English intentionally so support staff
  // reading it don't need every language, unlike everything else here.
  const ctaHref = useMemo(() => {
    if (!selections.room) return "#";
    const parts = ["Room: " + roomSel.name];
    if (selections.heater) parts.push("Heater: " + heaterSel.name);
    if (accessorySel.length > 0) parts.push("Accessories: " + accessorySel.map((x) => x.name).join(", "));
    return localize(menuPaths.contact) + "?addon_saved=1&subject=" + encodeURIComponent("Customize My Sauna, " + parts.join(" | "));
  }, [selections.room, selections.heater, accessorySel, roomSel, heaterSel, localize]);

  const firstAccessoryImg = selections.accessory.length > 0
    ? CONFIGURATOR_STEPS[2].items.find((x) => x.id === selections.accessory[0])?.img
    : null;

  const notSelected = t("roomsPage.configurator.notSelected");
  const sidebarItems = [
    {
      key: "room",
      label: t(`roomsPage.configurator.steps.${TAB_LABEL_KEY.room}`),
      stepIdx: 0,
      hasSelection: !!roomSel,
      imgSrc: roomSel?.img,
      imgAlt: roomSel ? trName("room", roomSel.id) : undefined,
      value: roomSel ? trName("room", roomSel.id) : notSelected,
      emptyIcon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5">
          <rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 14h18"/><path d="M7 6V4m10 2V4"/>
        </svg>
      ),
    },
    {
      key: "heater",
      label: t(`roomsPage.configurator.steps.${TAB_LABEL_KEY.heater}`),
      stepIdx: 1,
      hasSelection: !!heaterSel,
      imgSrc: heaterSel?.img,
      imgAlt: heaterSel ? trName("heater", heaterSel.id) : undefined,
      value: heaterSel ? trName("heater", heaterSel.id) : notSelected,
      emptyIcon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5">
          <path d="M12 2c1 3 4 5 4 9a4 4 0 1 1-8 0c0-4 3-6 4-9z"/><path d="M12 22v-4"/>
        </svg>
      ),
    },
    {
      key: "accessory",
      label: t(`roomsPage.configurator.steps.${TAB_LABEL_KEY.accessory}`),
      stepIdx: 2,
      hasSelection: accessoryNames.length > 0,
      imgSrc: firstAccessoryImg,
      imgAlt: t(`roomsPage.configurator.steps.${TAB_LABEL_KEY.accessory}`),
      value:
        accessoryNames.length === 0
          ? notSelected
          : accessoryNames.length <= 2
          ? accessoryNames.join(", ")
          : t("roomsPage.configurator.itemsSelected", { count: accessoryNames.length }),
      emptyIcon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5">
          <path d="M8 2v4m8-4v4"/><rect x="3" y="6" width="18" height="5" rx="1"/>
          <path d="M5 11v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9"/>
        </svg>
      ),
    },
  ];

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
          return (
            <button
              key={s.key}
              className={`sawo-step-tab${isActive ? " active" : ""}${isCompleted ? " completed" : ""}`}
              onClick={() => goToStep(i)}
            >
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{t(`roomsPage.configurator.steps.${TAB_LABEL_KEY[s.key]}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="sawo-cfg-body">
        <div className="sawo-cfg-products" ref={productsRef}>
          <div className="sawo-cfg-step-title">{t(`roomsPage.configurator.stepLabels.${step.key}`)}</div>
          <div className="sawo-cfg-step-heading">{t(`roomsPage.configurator.stepHeadings.${step.key}`)}</div>
          {step.multi && <div className="sawo-multi-note">{t("roomsPage.configurator.multiNote")}</div>}

          <div className="sawo-cfg-grid" style={{ animation: "sawoCfgFadeUp 0.45s ease both" }}>
            {step.items.map((item) => {
              const isSelected = step.multi ? selections[step.key].includes(item.id) : selections[step.key] === item.id;
              return (
                <div
                  key={item.id}
                  className={`sawo-prod-card${isSelected ? " selected" : ""}`}
                  onClick={() => selectItem(step.key, item.id, step.multi)}
                >
                  <div className="prod-img"><img src={item.img} alt={trName(step.key, item.id)} loading="lazy" /></div>
                  <div className="prod-info">
                    <span className="prod-tag">{trTag(step.key, item.id)}</span>
                    <div className="prod-name">{trName(step.key, item.id)}</div>
                    <div className="prod-desc">{trDesc(step.key, item.id)}</div>
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

          {sidebarItems.map((item) => (
            <div
              key={item.key}
              className={`sawo-sidebar-item${item.hasSelection ? " has-selection" : ""}`}
              onClick={() => handleSidebarItemClick(item.stepIdx)}
            >
              <div className="sb-icon">
                {item.imgSrc ? (
                  <img src={item.imgSrc} alt={item.imgAlt} />
                ) : (
                  item.emptyIcon
                )}
              </div>
              <div className="sb-text">
                <div className="sb-label">{item.label}</div>
                <div className="sb-value">{item.value}</div>
              </div>
            </div>
          ))}

          <a
            href={ctaHref}
            className={`sawo-cfg-cta${!selections.room ? " disabled" : ""}`}
            target={selections.room ? "_blank" : undefined}
            rel={selections.room ? "noopener noreferrer" : undefined}
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

export default SaunaConfigurator;
