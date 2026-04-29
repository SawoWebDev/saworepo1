import React from "react";
import "./SaunaRooms.css";
import SaunaRoomViewer from "./rooms/SaunaRoomViewer";
import SaunaFeatures from "./rooms/SaunaFeatures";
import SaunaProductDetails from "./rooms/SaunaProductDetails";
import SaunaRoomDetails from "./rooms/SaunaRoomDetails";
import Sauna3DTeaser from "./rooms/Sauna3DTeaser";
import SaunaWoodMaterials from "./rooms/SaunaWoodMaterials";
import SaunaConfigurator from "./rooms/SaunaConfigurator";
import SaunaCallToAction from "./rooms/SaunaCallToAction";

const SaunaRooms = () => (
  <div>
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
