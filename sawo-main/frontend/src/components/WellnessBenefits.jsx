import React, { useEffect, useRef } from "react";

// Wellness benefits carousel — the seamless auto-scrolling strip of cards
// that expand on hover (desktop) or tap (touch).
//
// This markup, copy and CSS used to be pasted into every page that wanted
// it — Home Section3, the Infrared hub, the Infrared Room page — which is
// three places to edit for one change and three chances to drift. It lives
// here now; pages just render <WellnessBenefits />.
//
// Card interaction is DOM listeners rather than React state because the
// track is duplicated for the marquee loop: the same card appears twice,
// so keying "which card is open" by index would open both copies. Scoping
// the listeners to this instance root (not document) also means two
// carousels on one page cannot fight over each other.

export const BENEFIT_CARDS = [
  { icon: "fas fa-spa", label: "Stress Relief", desc: "Reduces stress, promotes relaxation, and alleviates anxiety" },
  { icon: "fas fa-heartbeat", label: "Heart Health", desc: "Enhances blood circulation, reduces arterial stiffness, and supports healthy blood pressure" },
  { icon: "fas fa-lungs", label: "Respiratory Relief", desc: "Relieves nasal, sinus, and chest congestion" },
  { icon: "fas fa-dumbbell", label: "Muscle Recovery", desc: "Accelerates muscle recovery following exercise" },
  { icon: "fas fa-bed", label: "Better Sleep", desc: "Promotes deeper, more restorative sleep by extending REM sleep duration" },
  { icon: "fas fa-heart", label: "Disease Prevention", desc: "Lowers risk of cardiovascular diseases, including stroke, hypertension, dementia, and Alzheimer's disease" },
  { icon: "fas fa-droplet", label: "Skin Detox", desc: "Opens pores, reduces blackheads, eliminates toxins, and improves skin" },
  { icon: "fas fa-wand-magic-sparkles", label: "Collagen Boost", desc: "Stimulates fibroblast activity to boost collagen production and enhance skin texture" },
  { icon: "fas fa-hand-holding-droplet", label: "Skin Hydration", desc: "Improves skin hydration, stabilizes pH balance, and strengthens the skin's natural barrier" },
  { icon: "fas fa-shield-alt", label: "Immune Support", desc: "Supports the body's natural immune defenses and aids recovery after illness" },
  { icon: "fas fa-fire", label: "Metabolism Boost", desc: "Stimulates protein repair, improves insulin sensitivity, and enhances metabolic rate" },
  { icon: "fas fa-smile", label: "Mental Wellness", desc: "Significantly reduces symptoms of depression with consistent use" },
];

/**
 * @param {Array}   cards      benefit cards to show
 * @param {boolean} fullBleed  break out of a max-width page wrapper to span
 *                             the viewport. Home needs this; pages whose
 *                             sections are already full-width do not.
 */
const WellnessBenefits = ({ cards = BENEFIT_CARDS, fullBleed = true }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cardEls = root.querySelectorAll(".sauna-card-unique");
    if (!cardEls.length) return;

    const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const clearOthers = (keep) => cardEls.forEach((c) => c !== keep && c.classList.remove("active"));
    const cleanups = [];

    if (isDesktop) {
      cardEls.forEach((card) => {
        const enter = () => { clearOthers(card); card.classList.add("active"); };
        const leave = () => card.classList.remove("active");
        card.addEventListener("mouseenter", enter);
        card.addEventListener("mouseleave", leave);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", enter);
          card.removeEventListener("mouseleave", leave);
        });
      });
    } else {
      cardEls.forEach((card) => {
        const closeBtn = card.querySelector(".sauna-card-unique-close");
        const onClick = (e) => {
          if (e.target.closest(".sauna-card-unique-close")) return;
          clearOthers(card);
          card.classList.toggle("active");
        };
        card.addEventListener("click", onClick);
        cleanups.push(() => card.removeEventListener("click", onClick));
        if (closeBtn) {
          const onClose = (e) => { e.stopPropagation(); card.classList.remove("active"); };
          closeBtn.addEventListener("click", onClose);
          cleanups.push(() => closeBtn.removeEventListener("click", onClose));
        }
      });
      const onDocClick = (e) => {
        if (!e.target.closest(".sauna-card-unique")) clearOthers(null);
      };
      document.addEventListener("click", onDocClick);
      cleanups.push(() => document.removeEventListener("click", onDocClick));
    }

    return () => cleanups.forEach((fn) => fn());
  }, [cards]);

  return (
    <section
      ref={rootRef}
      className={`sauna-benefits-section${fullBleed ? " full-bleed" : ""}`}
      style={{ background: "#af8564" }}
    >
      <div className="sauna-card-unique-section">
        <div className="home-benefits-carousel-wrapper">
          <div className="sauna-card-unique-grid">
            {/* Rendered twice so the marquee loop is seamless */}
            {[...cards, ...cards].map((card, i) => (
              <div className="sauna-card-unique" key={`${card.label}-${i}`}>
                <div className="sauna-card-unique-close">
                  <i className="fa-solid fa-times"></i>
                </div>
                <div className="sauna-card-unique-content">
                  <div className="sauna-card-unique-icon">
                    <i className={card.icon}></i>
                  </div>
                  <div className="sauna-card-unique-label">{card.label}</div>
                  <div className="sauna-card-unique-description">{card.desc}</div>
                </div>
                <div className="sauna-card-unique-click"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ── Sauna wellness benefits carousel ── */
        .sauna-benefits-section {
          margin-top: 80px;
          padding: 28px 0;
        }
        /* Break out of Home.jsx's max-w-[2000px] + px-4/6/8 wrapper so this
           carousel spans the full viewport width instead of being boxed in
           like the sections above/below it. */
        .full-bleed {
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
        }
        .sauna-card-unique-section { max-width: 100%; margin: 0 auto; overflow: hidden; padding: 14px 0; }
        .home-benefits-carousel-wrapper { position: relative; overflow: hidden; }
        .sauna-card-unique-grid {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          animation: sawo-benefits-scroll 60s linear infinite;
          width: max-content;
        }
        .home-benefits-carousel-wrapper:hover .sauna-card-unique-grid { animation-play-state: paused; }

        @keyframes sawo-benefits-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .sauna-card-unique {
          background: #fff;
          border-radius: 20px;
          width: 250px;
          min-width: 250px;
          height: 250px;
          aspect-ratio: 1/1;
          flex-shrink: 0;
          text-align: center;
          transition: height .4s ease, box-shadow .4s ease, border-color .4s ease, color .4s ease;
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px 16px;
          border: 2px solid transparent;
          overflow: hidden;
          color: #af8564;
        }
        /* Grow to fit the description instead of clamping/truncating it —
           .sauna-card-unique-grid uses align-items:flex-start so this
           doesn't stretch the other cards in the row. */
        .sauna-card-unique.active {
          height: auto;
          min-height: 250px;
          aspect-ratio: auto;
          padding-bottom: 26px;
          box-shadow: 0 22px 50px rgba(139,94,60,.28);
          border-color: #c79a77;
          color: #9e7456;
        }
        .sauna-card-unique-content { display: flex; flex-direction: column; align-items: center; }
        .sauna-card-unique-icon {
          width: 76px; height: 76px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, #e4c3a8 0%, #c79a77 35%, #af8564 65%, #9e7456 100%);
          display: flex; align-items: center; justify-content: center;
          transition: .45s cubic-bezier(.68,-.55,.265,1.55), width .3s ease, height .3s ease;
        }
        .sauna-card-unique-icon i { font-size: 2rem; color: #fff; transition: .4s ease; }
        .sauna-card-unique:hover .sauna-card-unique-icon { transform: rotate(10deg) scale(1.06); }
        .sauna-card-unique.active .sauna-card-unique-icon {
          width: 44px; height: 44px;
          background: radial-gradient(circle at 30% 25%, #f1d7c2 0%, #c79a77 40%, #af8564 70%, #9e7456 100%);
        }
        .sauna-card-unique.active .sauna-card-unique-icon i { font-size: 1.3rem; }
        .sauna-card-unique-label {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700; font-size: 1.05rem;
          margin-top: 8px; transition: .3s ease;
        }
        .sauna-card-unique.active .sauna-card-unique-label { color: #9e7456; }
        .sauna-card-unique-description {
          font-family: 'Montserrat', sans-serif;
          font-size: .9rem; line-height: 1.45;
          max-height: 0; opacity: 0; overflow: hidden;
          transition: .45s ease;
          text-align: center; padding: 4px 6px; color: #fff;
        }
        .sauna-card-unique.active .sauna-card-unique-description {
          max-height: 300px; opacity: 1; color: #2f2f2f;
        }
        .sauna-card-unique-click { position: absolute; inset: 0; }
        .sauna-card-unique-close {
          position: absolute; top: 12px; right: 12px;
          width: 26px; height: 26px; border-radius: 50%;
          background: rgba(255,255,255,.15);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: .25s ease;
        }
        .sauna-card-unique.active .sauna-card-unique-close { opacity: 1; }
        .sauna-card-unique-close i { color: #fff; font-size: .8rem; }

        @media (max-width: 768px) {
          .sauna-card-unique { width: 220px; min-width: 220px; height: 220px; }
          .sauna-card-unique.active { min-height: 220px; }
          .sauna-card-unique-label { font-size: 0.9rem; }
          .sauna-card-unique-description { font-size: 0.8rem; line-height: 1.35; }
          .sauna-card-unique-icon i { font-size: 1.8rem; }
        }
`}</style>
    </section>
  );
};

export default WellnessBenefits;
