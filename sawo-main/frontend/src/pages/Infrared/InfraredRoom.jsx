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
import SaunaFeatures from "../Sauna/rooms/SaunaFeatures";
import SaunaProductDetails from "../Sauna/rooms/SaunaProductDetails";
import SaunaRoomDetails from "../Sauna/rooms/SaunaRoomDetails";
import SaunaWoodMaterials from "../Sauna/rooms/SaunaWoodMaterials";
import SaunaCallToAction from "../Sauna/rooms/SaunaCallToAction";
import {
  IR_SFW_ITEMS, IR_SPD_SLIDES, IR_SPD_STORY_SECTIONS, IR_SPD_FEATURE_TEXT,
  IR_SPD_PERF_CARDS, IR_SPD_ACCORDION_ITEMS, IR_MATS_ITEMS, SRD_PANELS,
} from "../Sauna/rooms/SaunaRoomData";
import { useHeroLoaded } from "../../utils/useHeroLoaded";
import heroBg from "../../assets/Infrared/hero.webp";

// The About This Room carousel on /sauna/rooms rotates through all four room
// types. Here it is pinned to the infrared panel: on a page about one room, a
// carousel that wanders off to the Compact Sauna Room is a way out of the
// page, not a feature. Selected by pill rather than index so reordering
// SRD_PANELS cannot silently point this at the wrong room.
const IR_ROOM_PANEL = SRD_PANELS.filter((p) => p.pill === "Infrared");

const INFRARED_BROCHURE_URL =
  "https://www.sawo.com/wp-content/uploads/2026/07/SAWO-Infrared-Brochure-2026-1.pdf";

// Same wellness-benefits copy the Infrared hub page shows — kept as its own
// array here rather than imported, matching how Home/Sauna/Infrared each
// hold their own copy of this widget (see Section3.jsx's note on the same
// pattern).
const BENEFITS = [
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
 * InfraredRoom — the infrared range's own page.
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
const InfraredRoom = () => {
  const heroLoaded = useHeroLoaded(heroBg);

  return (
    <div>
      <SEO
        title="Infrared Room"
        description="SAWO infrared rooms in one- and two-person sizes. Fiber-coated far infrared panels, cedar and hemlock finishes, and plug-and-play 230V installation."
        path="/infrared/room"
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
          <h1 className="wm-hero-title">INFRARED ROOM</h1>
          <p className="wm-hero-subtitle">
            Gentle, therapeutic infrared warmth in a compact cabin — available for one or two people.
          </p>
          <div style={{ marginTop: "32px" }}>
            <BrochureDropdownButton
              text="VIEW BROCHURE"
              items={[{ label: "Infrared Brochure", href: INFRARED_BROCHURE_URL }]}
            />
          </div>
        </div>
        <HeroWave />
      </section>

      <SaunaRoomViewer rooms={["infrared"]} showTabs={false} />

      <SaunaFeatures
        items={IR_SFW_ITEMS}
        heading="What Makes Our Infrared Room Different"
      />

      <SaunaProductDetails
        slides={IR_SPD_SLIDES}
        storySections={IR_SPD_STORY_SECTIONS}
        featureText={IR_SPD_FEATURE_TEXT}
        perfCards={IR_SPD_PERF_CARDS}
        accordionItems={IR_SPD_ACCORDION_ITEMS}
        title="The Infrared Sauna You'll Actually Use Every Day"
      />

      <SaunaRoomDetails panels={IR_ROOM_PANEL} />

      <SaunaWoodMaterials
        items={IR_MATS_ITEMS}
        subtitle="Infrared rooms are built in cedar or hemlock — each brings its own character, scent, and warmth to your sessions."
      />

      {/* WELLNESS BENEFITS */}
      <section className="ir-benefits-section">
        <div className="ir-benefits-inner">
          <div className="ir-benefits-viewport">
            {/* Rendered twice so the marquee loop is seamless */}
            <div className="ir-benefits-track">
              {[...BENEFITS, ...BENEFITS].map((b, i) => (
                <div className="ir-benefit-card" key={`${b.label}-${i}`}>
                  <div className="ir-benefit-icon">
                    <i className={b.icon} />
                  </div>
                  <div className="ir-benefit-label">{b.label}</div>
                  <div className="ir-benefit-desc">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SaunaCallToAction />

      <style jsx>{`
        .ir-benefits-section {
          background: #af8564;
          padding: 42px 0;
          margin-top: 40px;
        }
        .ir-benefits-inner { max-width: 100%; margin: 0 auto; overflow: hidden; }
        .ir-benefits-viewport { position: relative; overflow: hidden; }
        .ir-benefits-track {
          display: flex;
          align-items: stretch;
          gap: 24px;
          width: max-content;
          animation: ir-benefits-scroll 60s linear infinite;
        }
        .ir-benefits-viewport:hover .ir-benefits-track { animation-play-state: paused; }
        @keyframes ir-benefits-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        /* Reduced-motion users get a plain horizontally scrollable strip
           rather than a marquee they cannot stop. */
        @media (prefers-reduced-motion: reduce) {
          .ir-benefits-track { animation: none; }
          .ir-benefits-viewport { overflow-x: auto; }
        }
        .ir-benefit-card {
          background: #fff;
          border-radius: 20px;
          width: 250px;
          min-width: 250px;
          flex-shrink: 0;
          padding: 22px 18px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #af8564;
        }
        .ir-benefit-icon {
          width: 66px; height: 66px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, #e4c3a8 0%, #c79a77 35%, #af8564 65%, #9e7456 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .ir-benefit-icon i { font-size: 1.7rem; color: #fff; }
        .ir-benefit-label {
          font-family: "Montserrat", sans-serif;
          font-weight: 700;
          font-size: 1.02rem;
        }
        .ir-benefit-desc {
          font-family: "Montserrat", sans-serif;
          font-size: 0.86rem;
          line-height: 1.45;
          color: #2f2f2f;
        }
        @media (max-width: 768px) {
          .ir-benefit-card { width: 220px; min-width: 220px; }
          .ir-benefit-label { font-size: 0.92rem; }
          .ir-benefit-desc { font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
};

export default InfraredRoom;
