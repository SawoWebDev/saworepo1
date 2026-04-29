import React, { useState, useRef } from "react";

const CONFIGURATOR_STEPS = [
  {
    key: 'room', title: 'Step 1', heading: 'Choose Your Sauna Room', multi: false,
    items: [
      { id: 'r1', name: 'Small Classic Sauna Room - 1214RS', tag: 'Small', desc: 'A compact Finnish-style sauna designed for 1–3 people. Perfect for private relaxation and smaller spaces without sacrificing authentic sauna comfort.', img: 'https://www.sawo.com/wp-content/uploads/2026/02/1214RS_LATEST-NEW-SAUNA-ROOM.webp' },
      { id: 'r2', name: 'Medium Classic Sauna Room - 1419RS', tag: 'Medium', desc: 'A spacious and versatile sauna built for 4–6 people. Ideal for families or shared sessions, offering the perfect balance of comfort and functionality.', img: 'https://www.sawo.com/wp-content/uploads/2026/02/1419RS_LATEST-NEW-SAUNA-ROOM.webp' },
      { id: 'r3', name: 'Large Classic Sauna Room - 1922RL', tag: 'Large', desc: 'A generous sauna room designed for 6 or more people. Perfect for larger homes, wellness spaces, or commercial environments seeking a premium group experience.', img: 'https://www.sawo.com/wp-content/uploads/2026/02/1922RL_LATEST-NEW-SAUNA-ROOM.webp' },
      { id: 'r4', name: 'Small Glass Front Sauna Room - 1414RS', tag: 'Small', desc: 'A compact sauna for 1–3 people featuring a full glass front that enhances natural light and visual space. Ideal for modern interiors seeking a brighter, more open sauna experience.', img: 'https://www.sawo.com/wp-content/uploads/2026/02/1414RS_GLASS-FRONT-CEDAR_PERSPECTIVE-VIEW-V2.webp' },
      { id: 'r5', name: 'Medium Glass Front Sauna Room - 1420RS', tag: 'Medium', desc: 'Designed for 4–6 people, this glass-front sauna combines spacious comfort with contemporary elegance. The transparent façade creates an open, airy atmosphere while maintaining authentic sauna performance.', img: 'https://www.sawo.com/wp-content/uploads/2026/02/1420RS_GLASS-FRONT-CEDAR_PERSPECTIVE-VIEW-V2.webp' },
      { id: 'r6', name: 'Large Glass Front Sauna Room - 1922RS', tag: 'Large', desc: 'A premium 6+ person sauna featuring a striking full-glass front for a luxurious, open-concept feel. Perfect for statement wellness spaces that blend design and relaxation.', img: 'https://www.sawo.com/wp-content/uploads/2026/02/1922RS_GLASS-FRONT-CEDAR_PERSPECTIVE-VIEW-V2.webp' },
    ],
  },
  {
    key: 'heater', title: 'Step 2', heading: 'Pick Your Sauna Heater', multi: false,
    items: [
      { id: 'h1', name: 'Taurus D NS', tag: 'Floor Heater', desc: 'Taurus D revolutionizes the standard sauna heater by having two or more power options in the same heater. The heater is designed for industrial use, spas, and both public and private pools.', img: 'https://www.sawo.com/wp-content/uploads/2025/10/SAWO_sauna_heaters_floor_TRD_NS.webp' },
      { id: 'h2', name: 'SAWO30 Round Ni2', tag: 'Tower Heater', desc: 'The SAWO30 Round is a magnificent-looking heater that can be placed perfectly in the middle of the sauna or embedded into benches. The large amount of stones in the tall sleek body creates a rich, steam-infused atmosphere.', img: 'https://www.sawo.com/wp-content/uploads/2025/10/SAWO_sauna_heaters_tower_SW3_Round_Ni2.webp' },
      { id: 'h3', name: 'Nordex Pro NS', tag: 'Floor Heater', desc: "The Nordex Pro NS is the newest heater in the trusted Nordex lineup. It is engineered for long-lasting performance, with a separate stone compartment to protect the heating elements and extend the unit's lifespan.", img: 'https://www.sawo.com/wp-content/uploads/2025/10/SAWO_sauna_heaters_floor_Nordex_Pro_NS.webp' },
      { id: 'h4', name: 'Krios Ni2', tag: 'Wall-Mounted Heater', desc: "The Krios Ni2 delivers a richer, more humid Finnish sauna experience with its larger stone container. Housed in a sleek stainless steel casing featuring SAWO's signature pattern, it combines style and performance.", img: 'https://www.sawo.com/wp-content/uploads/2025/10/SAWO_sauna_heaters_wall_KRI_Ni2.webp' },
      { id: 'h5', name: 'Aries Round Black Ni2', tag: 'Tower Heater', desc: 'The Aries Round shares the minimalist elegance of all Tower heaters. Tall and space-saving, it distributes heat evenly and is ideal for installation in the center of the sauna or embedded into a bench.', img: 'https://www.sawo.com/wp-content/uploads/2025/10/SAWO_sauna_series_tower_ARI_Round_Black_Ni2.webp' },
      { id: 'h6', name: 'Scandia NS', tag: 'Wall-Mounted Heater', desc: 'The Scandia NS is a staple classic among sauna heaters, delivering a truly traditional Finnish sauna experience. Simple, reliable, and efficient, it is available with a cool-to-touch fiber coating.', img: 'https://www.sawo.com/wp-content/uploads/2025/10/SAWO_sauna_heaters_wall_SCA_NS.webp' },
    ],
  },
  {
    key: 'accessory', title: 'Step 3', heading: 'Add Accessories', multi: true,
    items: [
      { id: 'a1', name: 'Traditional Set', tag: 'Available in: Cedar', desc: 'The choice with a clean, timeless, and traditional finish. It delivers all the essential tools for everyday sauna use.', img: 'https://www.sawo.com/wp-content/uploads/2026/02/Traditional.jpg' },
      { id: 'a2', name: 'Essential Set', tag: 'Available in: Cedar', desc: 'The Essential set takes comfort and style to the next level, offering a wider collection of sauna items to enjoy.', img: 'https://www.sawo.com/wp-content/uploads/2026/01/Essential-v3.png' },
      { id: 'a3', name: 'Signature Set', tag: 'Available in: Black & Cedar', desc: 'The distinguished Signature set is for those seeking an elegant and sophisticated sauna experience.', img: 'https://www.sawo.com/wp-content/uploads/2026/02/Signature-BL-v4-copy.jpg' },
      { id: 'a4', name: 'Dragon Set', tag: 'Available in: Black & Cedar', desc: 'With unparalleled style and innovation, the Dragon set offers a unique, bold look with added flair. This set is part of the Dragonfire Series, designed by renowned Finnish designer Stefan Lindfors.', img: 'https://www.sawo.com/wp-content/uploads/2025/12/Dragon-BL-v3.png' },
    ],
  },
];

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
    const subject = 'Customize My Sauna — ' + parts.join(' | ');
    return 'https://www.sawo.com/contact/?subject=' + encodeURIComponent(subject);
  })();

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
          const label = s.key === 'room' ? 'Room' : s.key === 'heater' ? 'Heater' : 'Accessories';
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
          {step.multi && <div className="sawo-multi-note">You can select multiple accessories</div>}

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

          <div className={`sawo-sidebar-item${roomSel ? ' has-selection' : ''}`} onClick={() => handleSidebarItemClick(0)}>
            <div className="sb-icon">
              {roomSel ? (
                <img src={roomSel.img} alt={roomSel.name} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="1.5"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 14h18"/><path d="M7 6V4m10 2V4"/></svg>
              )}
            </div>
            <div className="sb-text">
              <div className="sb-label">Room</div>
              <div className="sb-value">{roomSel ? roomSel.name : 'Not selected'}</div>
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
              <div className="sb-label">Heater</div>
              <div className="sb-value">{heaterSel ? heaterSel.name : 'Not selected'}</div>
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
              <div className="sb-label">Accessories</div>
              <div className="sb-value">
                {accessoryNames.length === 0
                  ? 'Not selected'
                  : accessoryNames.length <= 2
                  ? accessoryNames.join(', ')
                  : `${accessoryNames.length} items selected`}
              </div>
            </div>
          </div>

          <a
            href={ctaHref}
            className={`sawo-cfg-cta${!selections.room ? ' disabled' : ''}`}
            target={selections.room ? '_blank' : undefined}
            rel={selections.room ? 'noopener noreferrer' : undefined}
          >
            Inquire About This Setup
          </a>
          <div className="sawo-cfg-cta-hint">
            {selections.room
              ? 'Opens our contact form with your selections pre-filled'
              : 'Select at least a room to continue'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaunaConfigurator;
