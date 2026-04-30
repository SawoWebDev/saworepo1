import React from "react";
import "./SaunaRooms.css";
import ButtonClear from "../../components/Buttons/ButtonClear";
import SaunaRoomViewer from "./rooms/SaunaRoomViewer";
import SaunaFeatures from "./rooms/SaunaFeatures";
import SaunaProductDetails from "./rooms/SaunaProductDetails";
import SaunaRoomDetails from "./rooms/SaunaRoomDetails";
import Sauna3DTeaser from "./rooms/Sauna3DTeaser";
import SaunaWoodMaterials from "./rooms/SaunaWoodMaterials";
import SaunaConfigurator from "./rooms/SaunaConfigurator";
import SaunaCallToAction from "./rooms/SaunaCallToAction";

const CATALOGUE_URL = "https://heyzine.com/flip-book/524075b3c1.html";
const HERO_IMAGE = "https://www.sawo.com/wp-content/uploads/2025/11/1620ML_scene1.webp";

const SaunaRooms = () => (
  <div>
    <section className="relative w-full min-h-[95vh] flex flex-col justify-center px-5 md:px-10 overflow-hidden">
      <a
        href={CATALOGUE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: "#3a3a3a" }}
        aria-label="View Sauna Rooms Catalogue"
      >
        <img
          src={HERO_IMAGE}
          alt="SAWO Sauna Room - 1620ML"
          className="w-full h-full object-cover"
          fetchPriority="high"
          decoding="async"
          loading="eager"
          style={{ display: "block" }}
        />
      </a>

      <div className="flex flex-col items-center text-center">
        <h1
          className="font-bold text-white text-2xl sm:text-4xl md:text-5xl lg:text-[60px] leading-tight mb-4"
          style={{
            fontFamily: "Montserrat, sans-serif",
            textShadow: "4px 6px 7px rgba(0,0,0,0.5)",
            textTransform: "uppercase",
          }}
        >
          Sauna Rooms
        </h1>

        <ButtonClear
          text="VIEW CATALOGUE"
          href={CATALOGUE_URL}
          target="_blank"
        />
      </div>
    </section>

    <SaunaRoomViewer />
    <SaunaFeatures />
    <SaunaProductDetails />
    <SaunaRoomDetails />
    <Sauna3DTeaser />
    <SaunaWoodMaterials />
    <SaunaConfigurator />
    <SaunaCallToAction />
  </div>
);

export default SaunaRooms;
