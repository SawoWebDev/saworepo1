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
  IR_SPD_SLIDES, IR_SPD_STORY_SECTIONS, IR_SPD_FEATURE_TEXT,
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
        title="Infrared Saunas"
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
          <h1 className="wm-hero-title">INFRARED SAUNAS</h1>
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

      <SaunaCalculatorCTA />

      <SaunaProductDetails
        slides={IR_SPD_SLIDES}
        storySections={IR_SPD_STORY_SECTIONS}
        featureText={IR_SPD_FEATURE_TEXT}
        perfCards={IR_SPD_PERF_CARDS}
        accordionItems={IR_SPD_ACCORDION_ITEMS}
        title="The Infrared Sauna You'll Actually Use Every Day"
      />

      <WellnessBenefits fullBleed={false} />

      <SaunaRoomDetails panels={IR_ROOM_PANEL} showNav={false} />

      <SaunaWoodMaterials
        items={IR_MATS_ITEMS}
        subtitle="Infrared rooms are built in cedar or hemlock — each brings its own character, scent, and warmth to your sessions."
      />

      <SaunaCallToAction />
    </div>
  );
};

export default InfraredRoom;
