import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "./SaunaRooms.css";

// ── DATA ──────────────────────────────────────────────────────────────────────

const standardImageData = {
  1214: { RS: { bench: "RS1214", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1214RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS1214", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1214LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1215: { RS: { bench: "RS1215", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1215RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS1215", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1215LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1414: { RS: { bench: "RS1414", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1414RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS1414", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1414LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1415: { RS: { bench: "RS1415", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1415RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS1415", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1415LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1515: { RS: { bench: "RS1515", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1515RS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1515L": { RL: { bench: "RL1515", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1515RL_PERSPECTIVE-VIEW.webp"] }, LL: { bench: "LL1515", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1515LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1419: { RS: { bench: "RS1419", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1419RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS1419", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1419LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1420: { RS: { bench: "RS1420", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1420RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS1420", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1420LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1519: { RS: { bench: "RS1519", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1519RS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1519L": { RL: { bench: "RL1519", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1519RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL1519", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1519LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1520: { RS: { bench: "RS1520", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1520RS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1520L": { RL: { bench: "RL1520", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1520RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL1520", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1520LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1522: { RS: { bench: "RS1522", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1522RS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1522L": { RL: { bench: "RL1522", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1522RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL1522", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1522LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1919: { RS: { bench: "RS1919", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1919RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS1919", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1919LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1919L": { RL: { bench: "RL1919", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1919RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL1919", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1919LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  1920: { RS: { bench: "RS1920", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1920RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS1920", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1920LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1920L": { RL: { bench: "RL1920", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1920RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL1920", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1920LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1922L": { RL: { bench: "RL1922", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1922RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL1922", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1922LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1922MS": { MS: { bench: "MS1922", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1922MS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "1922MD": { MD: { bench: "MD1922", images: ["https://www.sawo.com/wp-content/uploads/2026/02/1922MD_LATEST-NEW-SAUNA-ROOM.webp"] } },
  2020: { RS: { bench: "RS2020", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2020RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS2020", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2020LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "2020L": { RL: { bench: "RL2020", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2020RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL2020", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2020LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  2022: { RS: { bench: "RS2022", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2022RS_LATEST-NEW-SAUNA-ROOM.webp"] }, LS: { bench: "LS2022", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2022LS_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "2022L": { RL: { bench: "RL2022", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2022RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL2022", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2022LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "2022MD": { MD: { bench: "MD2022", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2022MD_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "2222L": { RL: { bench: "RL2222", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2222RL_LATEST-NEW-SAUNA-ROOM.webp"] }, LL: { bench: "LL2222", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2222LL_LATEST-NEW-SAUNA-ROOM.webp"] } },
  "2222MD": { MD: { bench: "MD2222", images: ["https://www.sawo.com/wp-content/uploads/2026/02/2222-MD_LATEST-NEW-SAUNA-ROOM.webp"] } },
};

const standardSizeData = {
  1214: { w: "1.36m", d: "1.16m", h: "2.12m", c: "1-3 People" },
  1215: { w: "1.54m", d: "1.16m", h: "2.12m", c: "1-3 People" },
  1414: { w: "1.36m", d: "1.36m", h: "2.12m", c: "1-3 People" },
  1415: { w: "1.54m", d: "1.36m", h: "2.12m", c: "1-3 People" },
  1515: { w: "1.54m", d: "1.54m", h: "2.12m", c: "1-3 People" },
  "1515L": { w: "1.54m", d: "1.54m", h: "2.12m", c: "1-3 People" },
  1419: { w: "1.85m", d: "1.36m", h: "2.12m", c: "4-6 People" },
  1420: { w: "2.04m", d: "1.36m", h: "2.12m", c: "4-6 People" },
  1519: { w: "1.85m", d: "1.54m", h: "2.12m", c: "4-6 People" },
  "1519L": { w: "1.85m", d: "1.54m", h: "2.12m", c: "4-6 People" },
  1520: { w: "2.04m", d: "1.54m", h: "2.12m", c: "4-6 People" },
  "1520L": { w: "2.04m", d: "1.54m", h: "2.12m", c: "4-6 People" },
  1522: { w: "2.23m", d: "1.54m", h: "2.12m", c: "4-6 People" },
  "1522L": { w: "2.23m", d: "1.54m", h: "2.12m", c: "4-6 People" },
  1919: { w: "1.85m", d: "1.85m", h: "2.12m", c: "4-6 People" },
  "1919L": { w: "1.85m", d: "1.85m", h: "2.12m", c: "4-6 People" },
  1920: { w: "2.04m", d: "1.85m", h: "2.12m", c: "4-6 People" },
  "1920L": { w: "2.04m", d: "1.85m", h: "2.12m", c: "4-6 People" },
  "1922L": { w: "2.23m", d: "1.85m", h: "2.12m", c: "6+ People" },
  "1922MS": { w: "2.23m", d: "1.85m", h: "2.12m", c: "6+ People" },
  "1922MD": { w: "2.23m", d: "1.85m", h: "2.12m", c: "6+ People" },
  2020: { w: "2.04m", d: "2.04m", h: "2.12m", c: "6+ People" },
  "2020L": { w: "2.04m", d: "2.04m", h: "2.12m", c: "6+ People" },
  2022: { w: "2.23m", d: "2.04m", h: "2.12m", c: "6+ People" },
  "2022L": { w: "2.23m", d: "2.04m", h: "2.12m", c: "6+ People" },
  "2022MD": { w: "2.23m", d: "2.04m", h: "2.12m", c: "6+ People" },
  "2222L": { w: "2.23m", d: "2.23m", h: "2.12m", c: "6+ People" },
  "2222MD": { w: "2.21m", d: "2.21m", h: "2.12m", c: "6+ People" },
};

const standardBenchTypes = {
  RS1214: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1214RS.webp" },
  LS1214: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1214LS.webp" },
  RS1215: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1215RS.webp" },
  LS1215: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1215LS.webp" },
  RS1414: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1414RS.webp" },
  LS1414: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1414LS.webp" },
  RS1415: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1415RS.webp" },
  LS1415: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1415LS.webp" },
  RS1515: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1515RS.webp" },
  LS1515: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1515LS.webp" },
  RL1515: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1515RL.webp" },
  LL1515: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/03/Standard-Sauna-Room-Horizontal-Panel-1515LL.webp" },
  RS1419: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1419RS.webp" },
  LS1419: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1419LS.webp" },
  RS1420: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1420RS.webp" },
  LS1420: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1420LS.webp" },
  RS1519: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1519RS.webp" },
  LS1519: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1519LS.webp" },
  RL1519: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1519RL.webp" },
  LL1519: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1519LL.webp" },
  RS1520: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1520RS.webp" },
  LS1520: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1520LS.webp" },
  RL1520: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1520RL.webp" },
  LL1520: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1520LL.webp" },
  RS1522: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1522RS.webp" },
  LS1522: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1522LS.webp" },
  RL1522: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1522RL.webp" },
  LL1522: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1522LL.webp" },
  RS1919: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1919RS.webp" },
  LS1919: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1919LS.webp" },
  RL1919: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1919RL.webp" },
  LL1919: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1919LL.webp" },
  RS1920: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1920RS.webp" },
  LS1920: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1920LS.webp" },
  RL1920: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1920RL.webp" },
  LL1920: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1920LL.webp" },
  RL1922: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1922RL.webp" },
  LL1922: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1922LL.webp" },
  MS1922: { name: "Single Straight Bench", title: "Standard Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1922MS.webp" },
  MD1922: { name: "Double Straight Bench", title: "Standard Sauna Room", class: "double", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-1922MD.webp" },
  RS2020: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2020RS.webp" },
  LS2020: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2020LS.webp" },
  RL2020: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2020RL.webp" },
  LL2020: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2020LL.webp" },
  RS2022: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2022RS.webp" },
  LS2022: { name: "Straight Bench", title: "Standard Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2022LS.webp" },
  RL2022: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2022RL.webp" },
  LL2022: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2022LL.webp" },
  MD2022: { name: "Double Straight Bench", title: "Standard Sauna Room", class: "double", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2022MD.webp" },
  RL2222: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2222RL.webp" },
  LL2222: { name: "L-Type Bench", title: "Standard Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2222LL.webp" },
  MD2222: { name: "Double Straight Bench", title: "Standard Sauna Room", class: "double", image: "https://www.sawo.com/wp-content/uploads/2026/02/Standard-Sauna-Room-Horizontal-Panel-2222MD.webp" },
};

const standardSizeCategories = {
  small: ["1214", "1215", "1414", "1415", "1515", "1515L"],
  medium: ["1419", "1420", "1519", "1519L", "1520", "1520L", "1522", "1522L", "1919", "1919L", "1920", "1920L"],
  large: ["1922L", "1922MS", "1922MD", "2020", "2020L", "2022", "2022L", "2022MD", "2222L", "2222MD"],
};

const glassFrontImageData = {
  1414: { RS: { bench: "RS1414", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1414RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1414", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1414LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1415: { RS: { bench: "RS1415", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1415RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1415", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1415LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1419: { RS: { bench: "RS1419", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1419RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1419", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1419LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1419MS": { MS: { bench: "MS1419", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1419MS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1515: { RS: { bench: "RS1515", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1515RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1515", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1515LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1519: { RS: { bench: "RS1519", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1519RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1519", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1519LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1519MS": { MS: { bench: "MS1519", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1519MS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1420: { RS: { bench: "RS1420", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1420RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1420", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1420LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1420MS": { MS: { bench: "MS1420", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1420MS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1520: { RS: { bench: "RS1520", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1520RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1520", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1520LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1520MS": { MS: { bench: "MS1520", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1520MS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1522: { RS: { bench: "RS1522", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1522RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1522", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1522LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1522MS": { MS: { bench: "MS1522", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1522MS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1919: { RS: { bench: "RS1919", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1919RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1919", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1919LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1919MS": { MS: { bench: "MS1919", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1919MS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1919MRL": { MRL: { bench: "MRL1919", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1919MrL-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, MIL: { bench: "MIL1919", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1919MiL-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1920: { RS: { bench: "RS1920", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1920RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1920", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1920LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1920MS": { MS: { bench: "MS1920", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1920MS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1920MRL": { MRL: { bench: "MRL1920", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1920MrL-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, MIL: { bench: "MIL1920", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1920MiL-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  1922: { RS: { bench: "RS1922", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1922RS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS1922", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1922LS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1922MS": { MS: { bench: "MS1922", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1922MS-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "1922MRL": { MRL: { bench: "MRL1922", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1922MrL-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, MIL: { bench: "MIL1922", images: ["https://www.sawo.com/wp-content/uploads/2026/03/1922MiL-GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  2020: { RS: { bench: "RS2020", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2020RS_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LS: { bench: "LS2020", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2020LS_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "2020MS": { MS: { bench: "MS2020", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2020MS_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "2020MRL": { MRL: { bench: "MRL2020", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2020MRL_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, MIL: { bench: "MIL2020", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2020MiL_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "2022L": { RL: { bench: "RL2022", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2022RL_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LL: { bench: "LL2022", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2022LL_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "2022MD": { MD: { bench: "MD2022", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2022MD_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "2222L": { RL: { bench: "RL2222", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2222RL_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] }, LL: { bench: "LL2222", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2222LL_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
  "2222MD": { MD: { bench: "MD2222", images: ["https://www.sawo.com/wp-content/uploads/2026/03/2222MD_GLASS-FRONT-PERSPECTIVE-VIEW.webp"] } },
};

const glassFrontSizeData = {
  1414: { w: "1.36m", d: "1.37m", h: "2.12m", c: "1-3 People" },
  1415: { w: "1.54m", d: "1.37m", h: "2.12m", c: "1-3 People" },
  1419: { w: "1.85m", d: "1.37m", h: "2.12m", c: "1-3 People" },
  "1419MS": { w: "1.85m", d: "1.37m", h: "2.12m", c: "1-3 People" },
  1515: { w: "1.54m", d: "1.56m", h: "2.12m", c: "1-3 People" },
  1519: { w: "1.85m", d: "1.56m", h: "2.12m", c: "1-3 People" },
  "1519MS": { w: "1.85m", d: "1.56m", h: "2.12m", c: "1-3 People" },
  1420: { w: "2.04m", d: "1.37m", h: "2.12m", c: "4-6 People" },
  "1420MS": { w: "2.06m", d: "1.37m", h: "2.12m", c: "4-6 People" },
  1520: { w: "2.04m", d: "1.56m", h: "2.12m", c: "4-6 People" },
  "1520MS": { w: "2.06m", d: "1.56m", h: "2.12m", c: "4-6 People" },
  1522: { w: "2.23m", d: "1.56m", h: "2.12m", c: "4-6 People" },
  "1522MS": { w: "2.23m", d: "1.56m", h: "2.12m", c: "4-6 People" },
  1919: { w: "1.85m", d: "1.87m", h: "2.12m", c: "4-6 People" },
  "1919MS": { w: "1.85m", d: "1.87m", h: "2.12m", c: "4-6 People" },
  "1919MRL": { w: "1.85m", d: "1.87m", h: "2.12m", c: "4-6 People" },
  1920: { w: "2.04m", d: "1.87m", h: "2.12m", c: "4-6 People" },
  "1920MS": { w: "2.06m", d: "1.87m", h: "2.12m", c: "4-6 People" },
  "1920MRL": { w: "2.06m", d: "1.87m", h: "2.12m", c: "4-6 People" },
  1922: { w: "2.23m", d: "1.87m", h: "2.12m", c: "6+ People" },
  "1922MS": { w: "2.23m", d: "1.85m", h: "2.12m", c: "6+ People" },
  "1922MRL": { w: "2.23m", d: "1.85m", h: "2.12m", c: "6+ People" },
  2020: { w: "2.04m", d: "2.06m", h: "2.12m", c: "6+ People" },
  "2020MS": { w: "2.06m", d: "2.06m", h: "2.12m", c: "6+ People" },
  "2020MRL": { w: "2.06m", d: "2.06m", h: "2.12m", c: "6+ People" },
  "2022L": { w: "2.23m", d: "2.06m", h: "2.12m", c: "6+ People" },
  "2022MD": { w: "2.23m", d: "2.06m", h: "2.12m", c: "6+ People" },
  "2222L": { w: "2.23m", d: "2.25m", h: "2.12m", c: "6+ People" },
  "2222MD": { w: "2.23m", d: "2.25m", h: "2.12m", c: "6+ People" },
};

const glassFrontBenchTypes = {
  RS1414: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1414RS.webp" },
  LS1414: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1414LS.webp" },
  RS1415: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1415RS.webp" },
  LS1415: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1415LS.webp" },
  RS1419: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1419RS.webp" },
  LS1419: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1419LS.webp" },
  MS1419: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1419MS.png" },
  RS1515: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1515RS.webp" },
  LS1515: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1515LS.webp" },
  RS1519: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1519RS.webp" },
  LS1519: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1519LS.webp" },
  MS1519: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1519MS.png" },
  RS1420: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1420RS.png" },
  LS1420: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1420LS.webp" },
  MS1420: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1420MS.png" },
  RS1520: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1520RS.webp" },
  LS1520: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1520LS.webp" },
  MS1520: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1520MS.png" },
  RS1522: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1522RS.webp" },
  LS1522: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1522LS.webp" },
  MS1522: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1522MS.webp" },
  RS1919: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1919RS.webp" },
  LS1919: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1919LS.webp" },
  MS1919: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1919MS.webp" },
  MRL1919: { name: "Middle L-Type Bench", title: "Glass Front Sauna Room", class: "middle-l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1919MRL.webp" },
  MIL1919: { name: "Middle L-Type Bench", title: "Glass Front Sauna Room", class: "middle-l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1919MLL.webp" },
  RS1920: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1920RS.webp" },
  LS1920: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1920LS.webp" },
  MS1920: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-Horizontal-Panel-1920MS.png" },
  MRL1920: { name: "Middle L-Type Bench", title: "Glass Front Sauna Room", class: "middle-l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1920MRL.webp" },
  MIL1920: { name: "Middle L-Type Bench", title: "Glass Front Sauna Room", class: "middle-l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1920MLL.webp" },
  RS1922: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1922RS.webp" },
  LS1922: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1922LS.webp" },
  MS1922: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-Horizontal-Panel-1922MS.png" },
  MRL1922: { name: "Middle L-Type Bench", title: "Glass Front Sauna Room", class: "middle-l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1922MRL.webp" },
  MIL1922: { name: "Middle L-Type Bench", title: "Glass Front Sauna Room", class: "middle-l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-1922MLL.webp" },
  RS2020: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2020RS.webp" },
  LS2020: { name: "Straight Bench", title: "Glass Front Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2020LS.webp" },
  MS2020: { name: "Single Straight Bench", title: "Glass Front Sauna Room", class: "single", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2020MS.webp" },
  MRL2020: { name: "Middle L-Type Bench", title: "Glass Front Sauna Room", class: "middle-l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2020MRL.webp" },
  MIL2020: { name: "Middle L-Type Bench", title: "Glass Front Sauna Room", class: "middle-l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2020MLL.webp" },
  RL2022: { name: "L-Type Bench", title: "Glass Front Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2022RL.webp" },
  LL2022: { name: "L-Type Bench", title: "Glass Front Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2022LL.webp" },
  MD2022: { name: "Double Straight Bench", title: "Glass Front Sauna Room", class: "double", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2022MD.webp" },
  RL2222: { name: "L-Type Bench", title: "Glass Front Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2222RL.webp" },
  LL2222: { name: "L-Type Bench", title: "Glass Front Sauna Room", class: "l-type", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2222LL.webp" },
  MD2222: { name: "Double Straight Bench", title: "Glass Front Sauna Room", class: "double", image: "https://www.sawo.com/wp-content/uploads/2026/02/Glass-Front-Sauna-Room-2222MD.webp" },
};

const glassFrontSizeCategories = {
  small: ["1414", "1415", "1419", "1419MS", "1515", "1519", "1519MS"],
  medium: ["1420", "1420MS", "1520", "1520MS", "1522", "1522MS", "1919", "1919MS", "1919MRL", "1920", "1920MS", "1920MRL"],
  large: ["1922", "1922MS", "1922MRL", "2020", "2020MS", "2020MRL", "2022L", "2022MD", "2222L", "2222MD"],
};

const infraredImageData = {
  "0908-IR-D": { bench: "0908-IR-D", images: ["https://www.sawo.com/wp-content/uploads/2026/02/SR05-3433420_IR-0908MS-PERSPECTIVE-VIEW.webp"] },
  "1111-IR-D": { bench: "1111-IR-D", images: ["https://www.sawo.com/wp-content/uploads/2026/02/SR05-3303290_IR-1111RS-_PERSPECTIVE-VIEW.webp"] },
};

const infraredSizeData = {
  "0908-IR-D": { w: "0.80m", d: "0.90m", h: "2.05m", c: "1 Person" },
  "1111-IR-D": { w: "1.10m", d: "1.10m", h: "2.05m", c: "2 Person" },
};

const infraredBenchTypes = {
  "0908-IR-D": { name: "Straight Bench", title: "Infrared Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/0908MS-TOP-VIEW-with-DIMENSION.webp" },
  "1111-IR-D": { name: "Straight Bench", title: "Infrared Sauna Room", class: "straight", image: "https://www.sawo.com/wp-content/uploads/2026/02/1111RS-_TOP-VIEW-with-DIMENSION.webp" },
};

const SFW_ITEMS = [
  {
    tab: "Ventilation",
    image: "https://www.sawo.com/wp-content/uploads/2026/03/Ventilation-800x800-1.png",
    title: "Ventilation",
    paragraphs: [
      "Proper ventilation is essential for removing CO₂, pathogens and equalising the temperature inside your sauna. Most sauna kits lack this entirely.",
      "SAWO's built-in intake vent brings oxygen-rich air directly to the heater, mixing it into the rising airflow — allowing longer, more comfortable sessions without the sluggishness of CO₂ buildup.",
      "The integrated exhaust vent equalises temperatures throughout the room while actively drying your sauna after each use, extending its lifespan significantly.",
    ],
    specs: null,
  },
  {
    tab: "Lighting",
    image: "https://www.sawo.com/wp-content/uploads/2025/11/TR-LIGHT-COVER_SCENE1-copy.webp",
    title: "Lighting",
    paragraphs: [
      "The right lighting transforms a sauna session into a complete sensory experience. SAWO's integrated LED system is designed to complement the warmth of the wood and the heat of the room.",
      "Soft, low-glare positioning around the bench and ceiling creates a calm, immersive atmosphere — never harsh or clinical. Fully dimmable to suit any mood or time of day.",
      "All components are rated for the heat and humidity of a sauna environment, ensuring safe and reliable performance for years of daily use.",
    ],
    specs: null,
  },
  {
    tab: "Bench Height",
    image: "https://www.sawo.com/wp-content/uploads/2025/09/PREVENTIVE-MAINTENANCE.jpg",
    title: "Bench Height",
    paragraphs: [
      "Bench height plays a critical role in the quality of your sauna experience. Higher benches sit closer to the ceiling where temperatures are warmest, while lower benches offer a gentler, more relaxed heat.",
      "SAWO benches are crafted from premium kiln-dried timber and positioned to maximise heat exposure and comfort simultaneously. Available in straight and L-type configurations to suit any room layout.",
      "Every bench is finished to a smooth, splinter-free surface, designed for daily use without maintenance concerns.",
    ],
    specs: null,
  },
  {
    tab: "Excellent Heat",
    image: "https://www.sawo.com/wp-content/uploads/2025/10/SAWO_heater_accessories_Cozy_tank_on_th12_rnd.webp",
    title: "Excellent Heat",
    paragraphs: [
      "Even, consistent heat is what separates a great sauna from a good one. SAWO heaters are engineered to distribute warmth uniformly across the entire room — no cold corners, no hot spots.",
      "Reaching target temperatures quickly and holding them precisely, our heaters are designed for efficiency without sacrificing the deep, penetrating heat that defines the Finnish experience.",
      "Compatible with both wet and dry sauna sessions, giving you full control over the intensity and character of every session.",
    ],
    specs: null,
  },
  {
    tab: "Room Sizes",
    image: "https://www.sawo.com/wp-content/uploads/2024/10/2020ML-CD-G-SCENE.png",
    title: "Room Sizes",
    paragraphs: [
      "SAWO sauna rooms are available in three size categories, designed to fit any space — from a compact home bathroom to a dedicated wellness room.",
    ],
    specs: [
      { key: "Small Rooms",   val: "1.16m–1.54m wide", note: "/ 1–3 people" },
      { key: "Medium Rooms",  val: "1.36m–1.85m wide", note: "/ 4–6 people" },
      { key: "Large Rooms",   val: "1.85m–2.23m wide", note: "/ 6+ people" },
      { key: "Height",        val: "2.12m",             note: "(all models)" },
      { key: "Bench Types",   val: "Straight, L-Type, Double Straight, Double with Middle Door", note: null },
      { key: "Material",      val: "Cedar, Aspen or Pinaceae", note: null },
    ],
  },
  {
    tab: "Insulation",
    image: "https://www.sawo.com/wp-content/uploads/2026/03/Tower-heaters-round-scene_with-steam.jpg",
    title: "Insulation",
    paragraphs: [
      "Proper insulation is the foundation of an efficient sauna. SAWO rooms are built with high-performance insulation that retains heat inside the cabin and prevents energy loss through the walls, floor, and ceiling.",
      "This means faster heat-up times, lower running costs, and a more consistent temperature throughout your session — regardless of the ambient conditions outside.",
      "SAWO's insulation is also moisture-resistant, protecting the structural integrity of the room over years of daily use and steam exposure.",
    ],
    specs: null,
  },
];

const SFW_AUTO_DELAY   = 4000;
const SFW_RESUME_DELAY = 8000;

const SPD_SLIDES = [
  { src: "https://www.sawo.com/wp-content/uploads/2026/02/STANDARD-SAUNA-ROOM-COVER-scaled.webp",  alt: "Standard Sauna Room" },
  { src: "https://www.sawo.com/wp-content/uploads/2026/02/GLASS-FRONT-SAUNA-ROOM-V3-scaled.webp", alt: "Glass Front Sauna Room" },
  { src: "https://www.sawo.com/wp-content/uploads/2026/02/IR-1111RS-_SCENE-.webp",               alt: "IR Sauna Room" },
];

const SPD_STORY_SECTIONS = [
  {
    title: "Your Own Private Retreat",
    paragraphs: [
      "Imagine finishing a long day and stepping into your own sauna — heat rising, muscles unwinding, the world outside falling quiet. SAWO sauna rooms bring that experience home, available in sizes from compact 1–3 person rooms all the way up to spacious 6+ person suites, so there's a perfect fit for every space and every household.",
      "Whether you're looking for a solo sanctuary or a place to unwind with family and friends, our rooms are designed to make that luxury effortless and permanent — no gym membership, no booking ahead, just pure Finnish heat whenever you need it.",
    ],
  },
  {
    title: "Authentic Finnish Craftsmanship",
    paragraphs: [
      "SAWO has been building saunas in Finland for over 30 years, and every room reflects that heritage. Each sauna is available in cedar, aspen, or pinaceae — each wood bringing its own natural character, aroma, and feel to your sessions.",
      "Choose from straight bench or L-type bench configurations, with left and right-hand door options to suit your space. Every detail, from the bench layout to the panel joinery, is designed the way Finns have always done it — with simplicity, quality, and longevity in mind.",
    ],
  },
];

const SPD_FEATURE_TEXT = "Regular sauna use detoxifies naturally, improves circulation, and accelerates muscle recovery after exercise. The warmth eases stress, deepens sleep, and leaves you feeling restored — session after session. And beyond the wellness benefits, a SAWO sauna room is a lasting addition to your home that increases its value and sets it apart.";

const SPD_PERF_CARDS = [
  { label: "Cedar, Aspen or Pinaceae",    detail: "Naturally aromatic, sustainably sourced" },
  { label: "3 Size Categories",            detail: "1–3, 4–6, and 6+ person configurations" },
  { label: "Straight & L-Type Benches",   detail: "Left and right-hand door options available" },
  { label: "Finnish Made, 30+ Years",      detail: "Decades of sauna expertise in every room" },
];

const SPD_ACCORDION_ITEMS = [
  {
    title: "Product Specifications",
    specs: [
      { label: "Small Rooms",  value: "1.16m–1.54m wide", unit: "/ 1–3 people" },
      { label: "Medium Rooms", value: "1.36m–1.85m wide", unit: "/ 4–6 people" },
      { label: "Large Rooms",  value: "1.85m–2.23m wide", unit: "/ 6+ people" },
      { label: "Height",       value: "2.12m",             unit: "(all models)" },
      { label: "Bench Types",  value: "Straight, L-Type, Double Straight, Double with Middle Door", unit: null },
      { label: "Material",     value: "Cedar, Aspen or Pinaceae", unit: null },
    ],
  },
];

const SPD_SLIDE_DELAY    = 4000;
const SPD_LOADER_TIMEOUT = 6000;

const SRD_PANELS = [
  {
    pill: "Standard",
    label: "About This Room",
    title: "Standard Sauna Room",
    descriptions: [
      "The SAWO Standard Sauna Room brings the authentic Finnish sauna experience to your home. Designed with simplicity and elegance, it combines traditional craftsmanship with modern engineering.",
      "Each room is precision-built to maintain optimal heat circulation and energy efficiency, ensuring a consistent and comfortable sauna session every time.",
    ],
    features: [
      "Easy assembly with pre-built wall panels",
      "Premium heat-treated wood construction",
      "Tempered glass door with magnetic seal",
      "Available in all sizes and with multiple wood finishes",
    ],
    image: "https://www.sawo.com/wp-content/uploads/2025/11/2560x1920.webp",
    imageAlt: "Standard Sauna Room",
  },
  {
    pill: "Glass Front",
    label: "About This Room",
    title: "Glass Front Sauna Room",
    descriptions: [
      "The SAWO Glass Front Sauna Room combines contemporary design with traditional sauna benefits. Featuring a stunning full glass front panel, this modern sauna creates an open, airy atmosphere while maintaining exceptional heat retention.",
      "Perfect for those who appreciate both aesthetics and functionality, the glass front design brings natural light into your sauna space and creates a luxurious spa-like ambiance.",
    ],
    features: [
      "Full glass front panel for modern aesthetic",
      "Triple-layered tempered safety glass",
      "Enhanced heat insulation technology",
      "Available in all sizes and wood options",
    ],
    image: "https://www.sawo.com/wp-content/uploads/2026/02/1420-Glass-Front-Sauna-Room-scaled-1.webp",
    imageAlt: "Glass Front Sauna Room",
  },
  {
    pill: "Infrared",
    label: "About This Room",
    title: "Infrared Sauna Room",
    descriptions: [
      "SAWO's standard infrared sauna rooms come in two sizes, either for a single person or for two people. The far-infrared panels do not heat the room as much as a traditional sauna does, so the majority of the heat produced is heating the body directly.",
      "Featuring fiber-coated far infrared panels (170W per panel), these energy-efficient saunas offer 1-person (1200W) or 2-person (1400W) configurations with premium cedar construction and plug-and-play 230V installation.",
    ],
    features: [
      "Fiber-coated far infrared panels (170W/panel)",
      "230V plug-and-play installation",
      "Digital control for temperature, time, lights & fan",
      "Modern LED lights (12W) & pre-installed exhaust fan (18W)",
      "Adjustable base support & session time: 1–60 minutes",
      "Premium cedar construction",
    ],
    image: "https://www.sawo.com/wp-content/uploads/2026/02/IR-1111RS-_SCENE-.webp",
    imageAlt: "Infrared Sauna Room",
  },
];

const SRD_AUTO_DELAY = 8000;

const S3T_VIEWER_URL  = "https://www.sawo.com/3d-viewer/";
const S3T_MODEL_LABEL = "1414RS · Glass Front";

const MATS_ITEMS = [
  {
    name: "Cedar",
    image: "https://www.sawo.com/wp-content/uploads/2025/11/Cedar-Panels.webp",
    alt: "Cedar wood",
    description: "Rich, aromatic wood with natural resistance to moisture. Known for its warm reddish-brown tones and distinctive scent.",
    traits: ["Aromatic", "Moisture-Resistant", "Warm Tones"],
  },
  {
    name: "Aspen",
    image: "https://www.sawo.com/wp-content/uploads/2025/11/Aspen-Panels.webp",
    alt: "Aspen wood",
    description: "Light, hypoallergenic wood with a smooth finish. Cool to the touch and perfect for those with sensitivities.",
    traits: ["Hypoallergenic", "Cool Touch", "Light Grain"],
  },
  {
    name: "Pinaceae",
    image: "https://www.sawo.com/wp-content/uploads/2026/02/HEMLOCK-PANELS.webp",
    alt: "Pinaceae wood",
    description: "Traditional Nordic sauna wood with a clean, natural grain. Excellent heat properties and timeless aesthetic appeal.",
    traits: ["Traditional", "Heat-Efficient", "Natural Grain"],
  },
];

const HASH_MAP = {
  "standard-sauna-room": "standard",
  "glass-front-sauna-room": "glassfront",
  "infrared-sauna-room": "infrared",
};

const ROOM_CONFIGS = {
  standard: {
    label: "Standard Sauna Room",
    desc: "SAWO Classic Sauna Rooms offer a timeless sauna experience with high-quality Nordic wood and practical bench layouts.",
    imageData: standardImageData,
    sizeData: standardSizeData,
    benchTypes: standardBenchTypes,
    sizeCategories: standardSizeCategories,
    hasDoorFilter: true,
    isFlat: false,
    suffixRegex: /L$|MS$|MD$/,
    sideOrder: ["RS", "LS", "RL", "LL", "MS", "MD"],
    sizeOptions: [
      { value: "1214", label: "1214 (RS/LS)" }, { value: "1215", label: "1215 (RS/LS)" },
      { value: "1414", label: "1414 (RS/LS)" }, { value: "1415", label: "1415 (RS/LS)" },
      { value: "1419", label: "1419 (RS/LS)" }, { value: "1420", label: "1420 (RS/LS)" },
      { value: "1515", label: "1515 (RS/LS)" }, { value: "1515L", label: "1515 (RL/LL)" },
      { value: "1519", label: "1519 (RS/LS)" }, { value: "1519L", label: "1519 (RL/LL)" },
      { value: "1520", label: "1520 (RS/LS)" }, { value: "1520L", label: "1520 (RL/LL)" },
      { value: "1522", label: "1522 (RS/LS)" }, { value: "1522L", label: "1522 (RL/LL)" },
      { value: "1919", label: "1919 (RS/LS)" }, { value: "1919L", label: "1919 (RL/LL)" },
      { value: "1920", label: "1920 (RS/LS)" }, { value: "1920L", label: "1920 (RL/LL)" },
      { value: "1922L", label: "1922 (RL/LL)" }, { value: "1922MS", label: "1922 (MS)" },
      { value: "1922MD", label: "1922 (MD)" }, { value: "2020", label: "2020 (RS/LS)" },
      { value: "2020L", label: "2020 (RL/LL)" }, { value: "2022", label: "2022 (RS/LS)" },
      { value: "2022MD", label: "2022 (MD)" }, { value: "2022L", label: "2022 (RL/LL)" },
      { value: "2222L", label: "2222 (RL/LL)" }, { value: "2222MD", label: "2222 (MD)" },
    ],
    doorOptions: [
      { value: "RS", label: "Right Side" }, { value: "LS", label: "Left Side" },
      { value: "MS", label: "Middle" }, { value: "RL", label: "Right Side (L-Type)" },
      { value: "LL", label: "Left Side (L-Type)" }, { value: "MD", label: "Middle (Double)" },
    ],
    woodOptions: ["Cedar", "Aspen", "Pinaceae"],
    woodEnabled: [true, false, false],
    bestSellers: null,
  },
  glassfront: {
    label: "Glass Front Sauna Room",
    desc: "SAWO Glass Front Sauna Rooms offer a modern sauna experience with durable glass to overlook stunning views without compromising on practicality.",
    imageData: glassFrontImageData,
    sizeData: glassFrontSizeData,
    benchTypes: glassFrontBenchTypes,
    sizeCategories: glassFrontSizeCategories,
    hasDoorFilter: true,
    isFlat: false,
    suffixRegex: /MS$|MRL$|MIL$|MD$|RL$|LL$|LS$|L$/,
    sideOrder: ["RS", "LS", "MS", "MRL", "MIL", "MD", "RL", "LL"],
    sizeOptions: [
      { value: "1414", label: "1414 (RS/LS)" }, { value: "1415", label: "1415 (RS/LS)" },
      { value: "1419", label: "1419 (RS/LS)" }, { value: "1419MS", label: "1419 (MS)" },
      { value: "1515", label: "1515 (RS/LS)" }, { value: "1519", label: "1519 (RS/LS)" },
      { value: "1519MS", label: "1519 (MS)" }, { value: "1420", label: "1420 (RS/LS)" },
      { value: "1420MS", label: "1420 (MS)" }, { value: "1520", label: "1520 (RS/LS)" },
      { value: "1520MS", label: "1520 (MS)" }, { value: "1522", label: "1522 (RS/LS)" },
      { value: "1522MS", label: "1522 (MS)" }, { value: "1919", label: "1919 (RS/LS)" },
      { value: "1919MS", label: "1919 (MS)" }, { value: "1919MRL", label: "1919 (MRL/MIL)" },
      { value: "1920", label: "1920 (RS/LS)" }, { value: "1920MS", label: "1920 (MS)" },
      { value: "1920MRL", label: "1920 (MRL/MIL)" }, { value: "1922", label: "1922 (RS/LS)" },
      { value: "1922MS", label: "1922 (MS)" }, { value: "1922MRL", label: "1922 (MRL/MIL)" },
      { value: "2020", label: "2020 (RS/LS)" }, { value: "2020MS", label: "2020 (MS)" },
      { value: "2020MRL", label: "2020 (MRL/MIL)" }, { value: "2022L", label: "2022 (RL/LL)" },
      { value: "2022MD", label: "2022 (MD)" }, { value: "2222L", label: "2222 (RL/LL)" },
      { value: "2222MD", label: "2222 (MD)" },
    ],
    doorOptions: [
      { value: "RS", label: "Right Side" }, { value: "LS", label: "Left Side" },
      { value: "MS", label: "Middle" }, { value: "MRL", label: "Middle Right (L-Type)" },
      { value: "MIL", label: "Middle Left (L-Type)" }, { value: "MD", label: "Middle (Double)" },
      { value: "RL", label: "Right Side (L-Type)" }, { value: "LL", label: "Left Side (L-Type)" },
    ],
    woodOptions: ["Cedar", "Aspen", "Pinaceae"],
    woodEnabled: [true, false, false],
    bestSellers: new Set(["1414"]),
  },
  infrared: {
    label: "Infrared Sauna Room",
    desc: "SAWO Infrared Sauna Rooms provide gentle, therapeutic heat using advanced infrared technology for a relaxing and rejuvenating experience.",
    imageData: infraredImageData,
    sizeData: infraredSizeData,
    benchTypes: infraredBenchTypes,
    sizeCategories: null,
    hasDoorFilter: false,
    isFlat: true,
    suffixRegex: null,
    sideOrder: [],
    sizeOptions: [
      { value: "0908-IR-D", label: "0908-IR-D (1 Person)" },
      { value: "1111-IR-D", label: "1111-IR-D (2 Person)" },
    ],
    doorOptions: [],
    woodOptions: ["Cedar", "Hemlock"],
    woodEnabled: [true, false],
    bestSellers: null,
  },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function cleanModelNumber(modelSize, cfg) {
  return cfg.suffixRegex ? modelSize.replace(cfg.suffixRegex, "") : modelSize;
}

function getGalleryLabel(activeRoom, cfg, modelSize) {
  if (cfg.isFlat) return modelSize;
  if (activeRoom === "glassfront") {
    if (modelSize.endsWith("MRL")) return modelSize.replace(/MRL$/, "") + "-MRL";
    if (modelSize.endsWith("MIL")) return modelSize.replace(/MIL$/, "") + "-MIL";
    if (modelSize.endsWith("MD"))  return modelSize.replace(/MD$/, "")  + "-D";
    if (modelSize.endsWith("MS"))  return modelSize.replace(/MS$/, "");
    if (modelSize.endsWith("L"))   return modelSize.replace(/L$/, "")   + "-L";
    return modelSize;
  }
  let clean = modelSize.replace(/L$|MS$|MD$/, "");
  if (modelSize.endsWith("L") && !modelSize.endsWith("MS") && !modelSize.endsWith("MD")) clean += "-L";
  else if (modelSize.endsWith("MD")) clean += "-D";
  return clean;
}

function getCategoryForModel(cfg, modelSize) {
  if (!cfg.sizeCategories) return null;
  for (const [cat, models] of Object.entries(cfg.sizeCategories)) {
    if (models.includes(modelSize)) return cat;
  }
  return null;
}

function getAllModelsOrdered(cfg) {
  if (!cfg.sizeCategories) return Object.keys(cfg.imageData);
  return [...cfg.sizeCategories.small, ...cfg.sizeCategories.medium, ...cfg.sizeCategories.large];
}

function buildImages(cfg, activeRoom, selectedSize, selectedSide, activeSizeCategory) {
  const images = [];
  const side = cfg.hasDoorFilter ? selectedSide : "all";

  let modelsToShow;
  if (selectedSize !== "all") {
    modelsToShow = [selectedSize];
  } else if (activeSizeCategory && cfg.sizeCategories) {
    modelsToShow = cfg.sizeCategories[activeSizeCategory];
  } else {
    modelsToShow = getAllModelsOrdered(cfg);
  }

  modelsToShow.forEach((modelSize) => {
    const modelEntry = cfg.imageData[modelSize];
    if (!modelEntry) return;

    if (cfg.isFlat) {
      modelEntry.images.forEach((img) => {
        images.push({ size: modelSize, side: "", imageUrl: img, bench: modelEntry.bench });
      });
    } else if (side && side !== "all") {
      if (modelEntry[side]) {
        modelEntry[side].images.forEach((img) => {
          images.push({ size: modelSize, side, imageUrl: img, bench: modelEntry[side].bench });
        });
      }
    } else {
      const sortedSides = Object.keys(modelEntry).sort(
        (a, b) => cfg.sideOrder.indexOf(a) - cfg.sideOrder.indexOf(b)
      );
      sortedSides.forEach((doorSide) => {
        modelEntry[doorSide].images.forEach((img) => {
          images.push({ size: modelSize, side: doorSide, imageUrl: img, bench: modelEntry[doorSide].bench });
        });
      });
    }
  });

  return images;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: "standard",   label: "Standard Sauna Room" },
  { key: "glassfront", label: "Glass Front Sauna Room" },
  { key: "infrared",   label: "Infrared Sauna" },
];

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
      { id: 'h3', name: 'Nordex Pro NS', tag: 'Floor Heater', desc: 'The Nordex Pro NS is the newest heater in the trusted Nordex lineup. It is engineered for long-lasting performance, with a separate stone compartment to protect the heating elements and extend the unit\'s lifespan.', img: 'https://www.sawo.com/wp-content/uploads/2025/10/SAWO_sauna_heaters_floor_Nordex_Pro_NS.webp' },
      { id: 'h4', name: 'Krios Ni2', tag: 'Wall-Mounted Heater', desc: 'The Krios Ni2 delivers a richer, more humid Finnish sauna experience with its larger stone container. Housed in a sleek stainless steel casing featuring SAWO\'s signature pattern, it combines style and performance.', img: 'https://www.sawo.com/wp-content/uploads/2025/10/SAWO_sauna_heaters_wall_KRI_Ni2.webp' },
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

const SaunaRooms = () => {
  const [activeRoom, setActiveRoom] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return HASH_MAP[hash] || "standard";
  });
  const [activeSizeCategory, setActiveSizeCategory] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedSide, setSelectedSide] = useState("all");
  const [fadeOut, setFadeOut] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const fadeTimer = useRef(null);
  const videoRef = useRef(null);

  const cfg = ROOM_CONFIGS[activeRoom];

  const currentImages = useMemo(
    () => buildImages(cfg, activeRoom, selectedSize, selectedSide, activeSizeCategory),
    [cfg, activeRoom, selectedSize, selectedSide, activeSizeCategory]
  );

  useEffect(() => {
    setCurrentIndex(0);
  }, [currentImages]);

  const navigate = useCallback((idx) => {
    if (currentImages.length === 0) return;
    const clamped = Math.max(0, Math.min(idx, currentImages.length - 1));
    clearTimeout(fadeTimer.current);
    setFadeOut(true);
    fadeTimer.current = setTimeout(() => {
      setCurrentIndex(clamped);
      setFadeOut(false);
    }, 150);
  }, [currentImages.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") setCurrentIndex((i) => { const n = Math.max(0, i - 1); if (n !== i) navigate(n); return i; });
      if (e.key === "ArrowRight") setCurrentIndex((i) => { const n = Math.min(currentImages.length - 1, i + 1); if (n !== i) navigate(n); return i; });
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [currentImages.length, navigate]);

  useEffect(() => () => clearTimeout(fadeTimer.current), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onCanPlay  = () => setVideoLoading(false);
    const onWaiting  = () => setVideoLoading(true);
    const onPlaying  = () => setVideoLoading(false);
    const onStalled  = () => setVideoLoading(true);
    video.addEventListener("canplay",  onCanPlay);
    video.addEventListener("waiting",  onWaiting);
    video.addEventListener("playing",  onPlaying);
    video.addEventListener("stalled",  onStalled);
    return () => {
      video.removeEventListener("canplay",  onCanPlay);
      video.removeEventListener("waiting",  onWaiting);
      video.removeEventListener("playing",  onPlaying);
      video.removeEventListener("stalled",  onStalled);
    };
  }, []);

  // ── SFW state ─────────────────────────────────────────────────────────────
  const [sfwIndex, setSfwIndex] = useState(0);
  const sfwAutoRef   = useRef(null);
  const sfwResumeRef = useRef(null);

  const sfwStopAuto = useCallback(() => {
    if (sfwAutoRef.current) { clearInterval(sfwAutoRef.current); sfwAutoRef.current = null; }
  }, []);

  const sfwStartAuto = useCallback(() => {
    sfwStopAuto();
    sfwAutoRef.current = setInterval(
      () => setSfwIndex((i) => (i + 1) % SFW_ITEMS.length),
      SFW_AUTO_DELAY
    );
  }, [sfwStopAuto]);

  const sfwGoTo = useCallback((idx) => {
    setSfwIndex(((idx % SFW_ITEMS.length) + SFW_ITEMS.length) % SFW_ITEMS.length);
    sfwStopAuto();
    if (sfwResumeRef.current) clearTimeout(sfwResumeRef.current);
    sfwResumeRef.current = setTimeout(sfwStartAuto, SFW_RESUME_DELAY);
  }, [sfwStopAuto, sfwStartAuto]);

  useEffect(() => {
    sfwStartAuto();
    return () => {
      sfwStopAuto();
      if (sfwResumeRef.current) clearTimeout(sfwResumeRef.current);
    };
  }, [sfwStartAuto, sfwStopAuto]);

  // ── SPD state ─────────────────────────────────────────────────────────────
  const [spdIndex, setSpdIndex]               = useState(0);
  const [spdLoaderHidden, setSpdLoaderHidden] = useState(false);
  const [spdImagesLoaded, setSpdImagesLoaded] = useState(() => new Array(SPD_SLIDES.length).fill(false));
  const [spdAccordionOpen, setSpdAccordionOpen] = useState(
    () => new Array(SPD_ACCORDION_ITEMS.length).fill(false)
  );
  const spdTimerRef      = useRef(null);
  const spdLoadedRef     = useRef(0);
  const spdTimerStarted  = useRef(false);

  const spdStartTimer = useCallback(() => {
    if (spdTimerStarted.current) return;
    spdTimerStarted.current = true;
    spdTimerRef.current = setInterval(
      () => setSpdIndex((i) => (i + 1) % SPD_SLIDES.length),
      SPD_SLIDE_DELAY
    );
  }, []);

  const spdHandleImageLoad = useCallback((idx) => {
    setSpdImagesLoaded((prev) => { const n = [...prev]; n[idx] = true; return n; });
    spdLoadedRef.current += 1;
    if (spdLoadedRef.current === 1) {
      setSpdLoaderHidden(true);
      spdStartTimer();
    }
  }, [spdStartTimer]);

  const spdHandleDotClick = useCallback((idx) => {
    clearInterval(spdTimerRef.current);
    spdTimerRef.current = null;
    spdTimerStarted.current = false;
    setSpdIndex(idx);
    spdStartTimer();
  }, [spdStartTimer]);

  const spdToggleAccordion = useCallback((idx) => {
    setSpdAccordionOpen((prev) => { const n = [...prev]; n[idx] = !n[idx]; return n; });
  }, []);

  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!spdLoaderHidden) {
        setSpdLoaderHidden(true);
        spdStartTimer();
      }
    }, SPD_LOADER_TIMEOUT);
    return () => {
      clearTimeout(fallback);
      clearInterval(spdTimerRef.current);
    };
  }, [spdLoaderHidden, spdStartTimer]);

  // ── SRD state ─────────────────────────────────────────────────────────────
  const [srdIndex, setSrdIndex] = useState(0);
  const srdTimerRef = useRef(null);

  const srdStopTimer = useCallback(() => {
    clearInterval(srdTimerRef.current);
    srdTimerRef.current = null;
  }, []);

  const srdStartTimer = useCallback(() => {
    srdStopTimer();
    srdTimerRef.current = setInterval(
      () => setSrdIndex((i) => (i + 1) % SRD_PANELS.length),
      SRD_AUTO_DELAY
    );
  }, [srdStopTimer]);

  const srdGoTo = useCallback((idx) => {
    setSrdIndex(((idx % SRD_PANELS.length) + SRD_PANELS.length) % SRD_PANELS.length);
    srdStopTimer();
    srdStartTimer();
  }, [srdStopTimer, srdStartTimer]);

  useEffect(() => {
    srdStartTimer();
    return () => srdStopTimer();
  }, [srdStartTimer, srdStopTimer]);

  const switchRoom = useCallback((roomKey) => {
    setActiveRoom(roomKey);
    setActiveSizeCategory(null);
    setCurrentIndex(0);
    setSelectedSize("all");
    setSelectedSide("all");
    setFadeOut(false);
  }, []);

  const scrollToConfigurator = useCallback(() => {
    document.getElementById("sawo-configurator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSizeChange = (value) => {
    setSelectedSize(value);
    if (value !== "all") {
      const cat = getCategoryForModel(cfg, value);
      if (cat) setActiveSizeCategory(cat);
    }
  };

  const handleSideChange = (value) => setSelectedSide(value);

  const handleResetSize = () => {
    setSelectedSize("all");
    setActiveSizeCategory(null);
  };

  const handleResetSide = () => setSelectedSide("all");

  const handleSizeTag = (category) => {
    if (activeSizeCategory === category) {
      setActiveSizeCategory(null);
      setSelectedSize("all");
    } else {
      setActiveSizeCategory(category);
      setSelectedSize("all");
    }
  };

  const handleGalleryClick = (modelSize) => {
    if (modelSize === selectedSize) {
      setSelectedSize("all");
      setActiveSizeCategory(null);
    } else {
      setSelectedSize(modelSize);
      const cat = getCategoryForModel(cfg, modelSize);
      if (cat) setActiveSizeCategory(cat);
    }
  };

  // Derived values from the current image entry
  const current = currentImages[currentIndex] || null;
  const currentBench = current ? cfg.benchTypes[current.bench] : null;
  const currentSizeData = current ? cfg.sizeData[current.size] : null;

  const imageTag = current
    ? cfg.isFlat
      ? current.size
      : `${cleanModelNumber(current.size, cfg)} - ${current.side}`
    : "";

  const isBestSeller = current && cfg.bestSellers && cfg.bestSellers.has(current.size);

  const inquiryHref = current
    ? (() => {
        const model = cfg.isFlat ? current.size : cleanModelNumber(current.size, cfg);
        const benchType = cfg.benchTypes[current.bench]?.name || "Standard Bench";
        const sideStr = cfg.isFlat ? "" : current.side;
        const subject = `Customize My Sauna — Room: ${cfg.label} - ${model}${sideStr} - ${benchType}`;
        return `https://www.sawo.com/contact/?subject=${encodeURIComponent(subject)}`;
      })()
    : "https://www.sawo.com/contact/";

  // Gallery models
  const galleryModels = useMemo(() => {
    const side = cfg.hasDoorFilter ? selectedSide : "all";
    let models;
    if (selectedSize !== "all") {
      models = [selectedSize];
    } else if (activeSizeCategory && cfg.sizeCategories) {
      models = cfg.sizeCategories[activeSizeCategory];
    } else {
      models = getAllModelsOrdered(cfg);
    }
    if (!cfg.isFlat && side && side !== "all") {
      models = models.filter((m) => cfg.imageData[m] && cfg.imageData[m][side]);
    }
    return models;
  }, [cfg, selectedSize, selectedSide, activeSizeCategory]);

  // Allowed size options given active category filter
  const allowedSizeValues = useMemo(() => {
    if (!activeSizeCategory || !cfg.sizeCategories) return null;
    return new Set(cfg.sizeCategories[activeSizeCategory]);
  }, [cfg, activeSizeCategory]);

  // Pagination
  const total = currentImages.length;
  const midIdx = currentIndex === 0 || currentIndex === total - 1
    ? Math.floor(total / 2)
    : currentIndex;

  return (
    <div>
      {/* TABS */}
      <div className="sauna-tabs-wrapper">
        <div className="sauna-room-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`sauna-tab-btn${activeRoom === tab.key ? " active" : ""}`}
              onClick={() => switchRoom(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ROOM UI */}
      <div className="room-wrapper" key={activeRoom} id="sawo-configurator">
        {/* Header */}
        <div className="room-header-top">
          <div className="room-title">{currentBench ? currentBench.title : cfg.label}</div>
          <div className="room-desc">{cfg.desc}</div>
        </div>

        {/* LEFT — Image + Gallery */}
        <div className="room-image">
          <div className="carousel-container">
            <div className="image-tag">{imageTag}</div>

            {isBestSeller && (
              <div className="carousel-best-seller">Best Seller</div>
            )}

            {current && (
              <img
                src={current.imageUrl}
                alt="Sauna Room"
                className={fadeOut ? "fade-out" : ""}
              />
            )}

            <button
              className="carousel-nav carousel-prev"
              disabled={currentIndex === 0}
              onClick={() => navigate(currentIndex - 1)}
            >
              ‹
            </button>
            <button
              className="carousel-nav carousel-next"
              disabled={currentIndex === total - 1}
              onClick={() => navigate(currentIndex + 1)}
            >
              ›
            </button>

            {total > 1 && (
              <div className="carousel-pagination">
                <button
                  className={`page-number${currentIndex === 0 ? " active" : ""}`}
                  onClick={() => navigate(0)}
                >
                  1
                </button>
                {total > 2 && (
                  <>
                    <span className="page-separator">•</span>
                    <button
                      className={`page-number${currentIndex === midIdx ? " active" : ""}`}
                      onClick={() => navigate(midIdx)}
                    >
                      {midIdx + 1}
                    </button>
                    <span className="page-separator">•</span>
                  </>
                )}
                <button
                  className={`page-number${currentIndex === total - 1 ? " active" : ""}`}
                  onClick={() => navigate(total - 1)}
                >
                  {total}
                </button>
              </div>
            )}
          </div>

          <div className="gallery-section">
            <div className="gallery-grid">
              {galleryModels.map((modelSize) => {
                const modelEntry = cfg.imageData[modelSize];
                if (!modelEntry) return null;

                let firstImage;
                const side = cfg.hasDoorFilter ? selectedSide : "all";
                if (cfg.isFlat) {
                  firstImage = modelEntry.images[0];
                } else if (side !== "all" && modelEntry[side]) {
                  firstImage = modelEntry[side].images[0];
                } else {
                  const firstSide = Object.keys(modelEntry)[0];
                  firstImage = modelEntry[firstSide].images[0];
                }

                const isGalleryBestSeller = cfg.bestSellers && cfg.bestSellers.has(modelSize);

                return (
                  <div
                    key={modelSize}
                    className={`gallery-item${modelSize === selectedSize ? " active" : ""}`}
                    onClick={() => handleGalleryClick(modelSize)}
                  >
                    {isGalleryBestSeller && (
                      <div className="gallery-best-seller">Best Seller</div>
                    )}
                    <img src={firstImage} alt={modelSize} />
                    <div className="gallery-label">
                      {getGalleryLabel(activeRoom, cfg, modelSize)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — Details */}
        <div className="room-details">
          {/* Bench Design */}
          <div className="bench-design-section">
            <div className="bench-design-label">Bench Design</div>
            <div className="bench-design-visual">
              <div className="bench-design-name">
                {currentBench ? currentBench.name : "—"}
              </div>
              <div className={`bench-icon${currentBench ? " " + currentBench.class : ""}`}>
                {currentBench && (
                  <img src={currentBench.image} alt={currentBench.name} />
                )}
              </div>
            </div>
          </div>

          {/* Product Specs */}
          <div className="product-specs">
            <div className="spec-item">
              <div className="spec-label">Model Number</div>
              <div className="spec-value">
                {current
                  ? cfg.isFlat
                    ? current.size
                    : cleanModelNumber(current.size, cfg)
                  : "—"}
              </div>
            </div>
            <div className="spec-item">
              <div className="spec-label">Capacity</div>
              <div className="spec-value">{currentSizeData ? currentSizeData.c : "—"}</div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="dimensions-section">
            <div className="dimensions-title">Dimensions</div>
            <div className="dimension-grid">
              <div className="dimension-box">
                <div className="value">{currentSizeData ? currentSizeData.w : "—"}</div>
                <div className="label">Width</div>
              </div>
              <div className="dimension-box">
                <div className="value">{currentSizeData ? currentSizeData.d : "—"}</div>
                <div className="label">Depth</div>
              </div>
              <div className="dimension-box">
                <div className="value">{currentSizeData ? currentSizeData.h : "—"}</div>
                <div className="label">Height</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            {/* Size category tags */}
            {cfg.sizeCategories && (
              <div className="size-tags" style={{ gridColumn: "1 / -1" }}>
                {["small", "medium", "large"].map((cat) => (
                  <button
                    key={cat}
                    className={`size-tag${activeSizeCategory === cat ? " active" : ""}`}
                    data-category={cat}
                    onClick={() => handleSizeTag(cat)}
                  >
                    <div className="size-tag-name">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Size select */}
            <div className="filter-group">
              <label>
                Sauna Room Model
                <button className="reset-btn" onClick={handleResetSize} title="Reset">↻</button>
              </label>
              <select value={selectedSize} onChange={(e) => handleSizeChange(e.target.value)}>
                <option value="all">Show All</option>
                {cfg.sizeOptions.map((opt) => {
                  const hidden = allowedSizeValues && !allowedSizeValues.has(opt.value);
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={hidden}
                      style={{ display: hidden ? "none" : "" }}
                    >
                      {opt.label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Door select */}
            <div className="filter-group">
              <label>
                Door Location
                <button
                  className="reset-btn"
                  onClick={handleResetSide}
                  title="Reset"
                  disabled={!cfg.hasDoorFilter}
                  style={!cfg.hasDoorFilter ? { opacity: 0.3, cursor: "not-allowed" } : {}}
                >
                  ↻
                </button>
              </label>
              <select
                value={selectedSide}
                onChange={(e) => handleSideChange(e.target.value)}
                disabled={!cfg.hasDoorFilter}
                style={!cfg.hasDoorFilter ? { cursor: "not-allowed" } : {}}
              >
                <option value="all">Show All</option>
                {cfg.doorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Wood select */}
            <div className="filter-group full-width">
              <label>Wood Type</label>
              <select disabled style={{ cursor: "not-allowed" }}>
                {cfg.woodOptions.map((w, i) => (
                  <option key={w} disabled={!cfg.woodEnabled[i]}>{w}</option>
                ))}
              </select>
            </div>

            {/* Inquiry button */}
            <div className="filter-group full-width">
              <a
                href={inquiryHref}
                className="inquiry-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Inquire Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* VIDEO */}
      <div className="sawo-video">
        <div className="sawo-title">Find Your Dream Sauna</div>
        <div className="sawo-subtitle">
          Watch how our innovative configurator brings your perfect sauna to life
        </div>
        <div className={`sawo-video-wrap${videoLoading ? " loading" : ""}`}>
          <div className="sawo-video-loader">
            <div className="sawo-video-spinner"></div>
            <div className="sawo-video-loader-text">Loading video...</div>
          </div>
          <video ref={videoRef} autoPlay muted loop playsInline>
            <source src="https://www.sawo.com/wp-content/uploads/2026/02/SAWO-ROOM-NO-LOGO.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* SFW — What Makes Our Sauna Different */}
      <div
        className="sfw"
        onMouseEnter={sfwStopAuto}
        onMouseLeave={sfwStartAuto}
      >
        <div className="sfw-inner">
          <div className="sfw-heading">What Makes Our Sauna Different</div>

          {/* Tabs */}
          <div className="sfw-tabs">
            {SFW_ITEMS.map((item, i) => (
              <button
                key={item.tab}
                className={`sfw-tab${sfwIndex === i ? " active" : ""}`}
                onClick={() => sfwGoTo(i)}
              >
                <span className="sfw-chk">
                  <svg viewBox="0 0 12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                {item.tab}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="sfw-body">
            {/* Carousel */}
            <div className="sfw-carousel">
              <div className="sfw-slides">
                {SFW_ITEMS.map((item, i) => (
                  <div key={item.tab} className={`sfw-slide${sfwIndex === i ? " active" : ""}`}>
                    <img src={item.image} alt={item.tab} />
                  </div>
                ))}
              </div>

              <button className="sfw-arr sfw-arr-prev" onClick={() => sfwGoTo(sfwIndex - 1)} aria-label="Previous">
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M7 1L1 7L7 13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="sfw-arr sfw-arr-next" onClick={() => sfwGoTo(sfwIndex + 1)} aria-label="Next">
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1L7 7L1 13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="sfw-dots">
                {SFW_ITEMS.map((item, i) => (
                  <button
                    key={item.tab}
                    className={`sfw-dot${sfwIndex === i ? " active" : ""}`}
                    onClick={() => sfwGoTo(i)}
                    aria-label={item.tab}
                  />
                ))}
              </div>
            </div>

            {/* Content panes */}
            <div className="sfw-content">
              {SFW_ITEMS.map((item, i) => (
                <div key={item.tab} className={`sfw-pane${sfwIndex === i ? " active" : ""}`}>
                  <div className="sfw-pane-title">{item.title}</div>
                  {item.paragraphs.map((p, j) => (
                    <div key={j} className="sfw-pane-text">{p}</div>
                  ))}
                  {item.specs && (
                    <div className="sfw-specs">
                      {item.specs.map((s) => (
                        <div key={s.key} className="sfw-spec-row">
                          <div className="sfw-spec-key">{s.key}</div>
                          <div className="sfw-spec-val">
                            {s.val}
                            {s.note && <span className="sfw-spec-note"> {s.note}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SPD — Product Details */}
      <div className="sawo-product-details">

        {/* Main block */}
        <div className="sawo-product-main">
          <div className="sawo-product-title">The Sauna You'll Actually Use Every Day</div>
          <hr className="sawo-divider-subtle" />

          <div className="sawo-product-story">
            {/* Slideshow */}
            <div className="sawo-product-image">
              <div className="sawo-slideshow">
                <div className={`sawo-loader${spdLoaderHidden ? " hidden" : ""}`}>
                  <div className="sawo-loader-ring"></div>
                  <div className="sawo-loader-text">Loading</div>
                </div>
                {SPD_SLIDES.map((slide, i) => (
                  <div key={slide.alt} className={`sawo-slide${spdIndex === i ? " active" : ""}`}>
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className={spdImagesLoaded[i] ? "loaded" : ""}
                      onLoad={() => spdHandleImageLoad(i)}
                      onError={() => spdHandleImageLoad(i)}
                    />
                  </div>
                ))}
                <div className="sawo-slide-dots">
                  {SPD_SLIDES.map((slide, i) => (
                    <button
                      key={slide.alt}
                      className={`sawo-dot${spdIndex === i ? " active" : ""}`}
                      onClick={() => spdHandleDotClick(i)}
                      aria-label={slide.alt}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Story sections */}
            {SPD_STORY_SECTIONS.map((section) => (
              <div key={section.title} className="sawo-story-section">
                <div className="story-section-title">{section.title}</div>
                {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
              </div>
            ))}

            <div style={{ clear: "both" }} />

            <div className="sawo-product-features">
              <p>{SPD_FEATURE_TEXT}</p>
            </div>
          </div>

          <hr className="sawo-divider-subtle" />
        </div>

        {/* Performance grid */}
        <div className="sawo-performance-grid">
          <div className="performance-header">Crafted with Precision</div>
          <div className="performance-cards">
            {SPD_PERF_CARDS.map((card) => (
              <div key={card.label} className="perf-card">
                <div className="perf-label">{card.label}</div>
                <div className="perf-detail">{card.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Accordion */}
        <div className="sawo-accordion-section">
          {SPD_ACCORDION_ITEMS.map((item, i) => (
            <div key={item.title} className={`sawo-accordion-item${spdAccordionOpen[i] ? " active" : ""}`}>
              <button className="sawo-accordion-header" onClick={() => spdToggleAccordion(i)}>
                <span className="accordion-title-text">{item.title}</span>
                <span className="sawo-accordion-icon">+</span>
              </button>
              <div className="sawo-accordion-content">
                <table className="sawo-specs-table">
                  <tbody>
                    {item.specs.map((s) => (
                      <tr key={s.label}>
                        <td className="spec-label">{s.label}</td>
                        <td className="spec-value">
                          {s.value}
                          {s.unit && <span className="spec-unit"> {s.unit}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* SRD — Room Switcher */}
      <div className="srd">
        <div className="srd-inner">

          {/* Nav */}
          <div
            className="srd-nav"
            onMouseEnter={srdStopTimer}
            onMouseLeave={srdStartTimer}
          >
            <button className="srd-nav-arrow" onClick={() => srdGoTo(srdIndex - 1)} aria-label="Previous">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7L7 13" stroke="#af8564" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="srd-nav-pills">
              {SRD_PANELS.map((panel, i) => (
                <button
                  key={panel.pill}
                  className={`srd-nav-pill${srdIndex === i ? " active" : ""}`}
                  onClick={() => srdGoTo(i)}
                >
                  {panel.pill}
                </button>
              ))}
            </div>

            <button className="srd-nav-arrow" onClick={() => srdGoTo(srdIndex + 1)} aria-label="Next">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1L7 7L1 13" stroke="#af8564" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Panels */}
          <div className="srd-panels">
            {SRD_PANELS.map((panel, i) => (
              <div key={panel.pill} className={`srd-panel${srdIndex === i ? " active" : ""}`}>
                <div>
                  <div className="srd-label">{panel.label}</div>
                  <div className="srd-title">{panel.title}</div>
                  {panel.descriptions.map((d, j) => (
                    <p key={j} className="srd-desc">{d}</p>
                  ))}
                  <ul className="srd-features">
                    {panel.features.map((f) => (
                      <li key={f}>
                        <span className="ico">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" stroke="#fff" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="srd-img-wrap">
                  <img src={panel.image} alt={panel.imageAlt} />
                </div>
              </div>
            ))}
          </div>

          {/* Counter */}
          <div className="srd-counter">{srdIndex + 1} / {SRD_PANELS.length}</div>

        </div>
      </div>

      {/* S3T — 3D Teaser */}
      <section className="sawo-3d-teaser">
        <div className="s3t-label">Interactive 3D Model</div>
        <div className="s3t-title">Explore Every Detail</div>
        <p className="s3t-subtitle">
          Rotate, zoom, and inspect every angle of our sauna before it ever arrives at your door.
        </p>

        {/* Card */}
        <a className="sawo-3d-card" href={S3T_VIEWER_URL} target="_blank" rel="noopener noreferrer">
          <div className="s3t-preview">
            <div className="s3t-orbit s3t-orbit-1"></div>
            <div className="s3t-orbit s3t-orbit-2"></div>

            <div className="s3t-icon-wrap">
              <div className="s3t-icon-glow"></div>
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="40,8 68,22 40,36 12,22" fill="#d4a96a" stroke="#af8564" strokeWidth="1"/>
                <polygon points="12,22 40,36 40,68 12,54" fill="#c49458" stroke="#af8564" strokeWidth="1"/>
                <polygon points="40,36 68,22 68,54 40,68" fill="#b8854e" stroke="#af8564" strokeWidth="1"/>
                <line x1="52" y1="35" x2="52" y2="60" stroke="#af8564" strokeWidth="1.5" opacity="0.6"/>
                <circle cx="50" cy="48" r="1.5" fill="#af8564" opacity="0.8"/>
              </svg>
            </div>

            <div className="s3t-hover-overlay">
              <div className="s3t-hover-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                Launch 3D Viewer
              </div>
            </div>
          </div>

          <div className="s3t-card-footer">
            <div className="s3t-hints">
              <span className="s3t-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
                </svg>
                Drag to Rotate
              </span>
              <span className="s3t-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
                Scroll to Zoom
              </span>
              <span className="s3t-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3"/>
                </svg>
                Double-tap to Focus
              </span>
            </div>
            <div className="s3t-model-label">{S3T_MODEL_LABEL}</div>
          </div>
        </a>

        {/* CTA row */}
        <div className="s3t-cta-row">
          <a className="s3t-btn-primary" href={S3T_VIEWER_URL} target="_blank" rel="noopener noreferrer">
            Open 3D Viewer
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <button className="s3t-btn-secondary" onClick={scrollToConfigurator}>
            Build Your Own
          </button>
        </div>
      </section>

      {/* MATS — Choose Your Wood */}
      <div className="sawo-materials">
        <div className="sawo-materials-header">
          <div className="sawo-materials-title">Choose Your Wood</div>
          <p>Each wood type brings its own character, scent, and warmth to your sauna experience.</p>
        </div>
        <div className="sawo-materials-grid">
          {MATS_ITEMS.map((mat) => (
            <div key={mat.name} className="sawo-mat-card">
              <div className="sawo-mat-card-img">
                <img src={mat.image} alt={mat.alt} />
              </div>
              <div className="sawo-mat-card-body">
                <div className="sawo-mat-name">{mat.name}</div>
                <p>{mat.description}</p>
                <div className="wood-traits">
                  {mat.traits.map((t) => <span key={t}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIGURATOR — Customize Your Dream Sauna */}
      <SaunaConfigurator />

      {/* CTA */}
      <div className="sawo-cta">
        <div className="sawo-cta-container">
          <div className="sawo-cta-icon">
            <svg width="32" height="32" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="12" width="29" height="4" fill="white" rx="1" />
              <rect x="10" y="16" width="25" height="21" fill="white" rx="1" />
              <rect x="18" y="26" width="9" height="11" fill="#8b5e3c" rx="0.5" />
            </svg>
          </div>
          <div className="sawo-cta-label">Your Wellness Awaits</div>
          <div className="sawo-cta-title">Ready to Build Your Dream Sauna?</div>
          <div className="sawo-cta-description">
            Let our sauna specialists guide you through every step. From design consultation to installation support, we're here to bring the ultimate relaxation experience to your home.
          </div>
          <a href="https://www.sawo.com/contact/" className="sawo-cta-btn">
            <span className="sawo-cta-btn-content">
              Inquire Today
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SaunaRooms;
