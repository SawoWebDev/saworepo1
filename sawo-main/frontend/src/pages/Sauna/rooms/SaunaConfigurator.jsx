import React, { useState, useMemo, useRef } from "react";
import { CONFIGURATOR_STEPS } from "./SaunaRoomData";

const SaunaConfigurator = () => {
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
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const step = CONFIGURATOR_STEPS[currentStep];
  const roomSel      = selections.room    ? CONFIGURATOR_STEPS[0].items.find((x) => x.id === selections.room)    : null;
  const heaterSel    = selections.heater  ? CONFIGURATOR_STEPS[1].items.find((x) => x.id === selections.heater)  : null;
  const accessoryNames = selections.accessory.map((id) => CONFIGURATOR_STEPS[2].items.find((x) => x.id === id)?.name).filter(Boolean);

  const ctaHref = useMemo(() => {
    if (!selections.room) return "#";
    const parts = ["Room: " + roomSel.name];
    if (selections.heater) parts.push("Heater: " + heaterSel.name);
    if (accessoryNames.length > 0) parts.push("Accessories: " + accessoryNames.join(", "));
    return "https://www.sawo.com/contact/?subject=" + encodeURIComponent("Customize My Sauna — " + parts.join(" | "));
  }, [selections.room, selections.heater, accessoryNames, roomSel, heaterSel]);

  const firstAccessoryImg = selections.accessory.length > 0
    ? CONFIGURATOR_STEPS[2].items.find((x) => x.id === selections.accessory[0])?.img
    : null;

  const sidebarItems = [
    {
      key: "room",
      label: "Room",
      stepIdx: 0,
      hasSelection: !!roomSel,
      imgSrc: roomSel?.img,
      imgAlt: roomSel?.name,
      value: roomSel ? roomSel.name : "Not selected",
      emptyIcon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5">
          <rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 14h18"/><path d="M7 6V4m10 2V4"/>
        </svg>
      ),
    },
    {
      key: "heater",
      label: "Heater",
      stepIdx: 1,
      hasSelection: !!heaterSel,
      imgSrc: heaterSel?.img,
      imgAlt: heaterSel?.name,
      value: heaterSel ? heaterSel.name : "Not selected",
      emptyIcon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5">
          <path d="M12 2c1 3 4 5 4 9a4 4 0 1 1-8 0c0-4 3-6 4-9z"/><path d="M12 22v-4"/>
        </svg>
      ),
    },
    {
      key: "accessory",
      label: "Accessories",
      stepIdx: 2,
      hasSelection: accessoryNames.length > 0,
      imgSrc: firstAccessoryImg,
      imgAlt: "Accessories",
      value:
        accessoryNames.length === 0
          ? "Not selected"
          : accessoryNames.length <= 2
          ? accessoryNames.join(", ")
          : `${accessoryNames.length} items selected`,
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
        <div className="cfg-title">Customize Your Dream Sauna</div>
        <p className="cfg-desc">Select your ideal room, heater, and accessories — then send us your configuration for a personalized quote.</p>
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
              <span className="step-label">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="sawo-cfg-body">
        <div className="sawo-cfg-products" ref={productsRef}>
          <div className="sawo-cfg-step-title">{step.title}</div>
          <div className="sawo-cfg-step-heading">{step.heading}</div>
          {step.multi && <div className="sawo-multi-note">You can select multiple accessories</div>}

          <div className="sawo-cfg-grid" style={{ animation: "sawoCfgFadeUp 0.45s ease both" }}>
            {step.items.map((item) => {
              const isSelected = step.multi ? selections[step.key].includes(item.id) : selections[step.key] === item.id;
              return (
                <div
                  key={item.id}
                  className={`sawo-prod-card${isSelected ? " selected" : ""}`}
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
              <button className="sawo-cfg-nav-btn prev" onClick={() => goToStep(currentStep - 1)}>&larr; Back</button>
            ) : (
              <button className="sawo-cfg-nav-btn hidden">&larr;</button>
            )}
            {currentStep < CONFIGURATOR_STEPS.length - 1 ? (
              <button className="sawo-cfg-nav-btn next" onClick={() => goToStep(currentStep + 1)}>Next &rarr;</button>
            ) : (
              <span />
            )}
          </div>
        </div>

        <div className="sawo-cfg-sidebar">
          <div className="sidebar-title">Your Selection</div>

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
            Inquire About This Setup
          </a>
          <div className="sawo-cfg-cta-hint">
            {selections.room
              ? "Opens our contact form with your selections pre-filled"
              : "Select at least a room to continue"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaunaConfigurator;
