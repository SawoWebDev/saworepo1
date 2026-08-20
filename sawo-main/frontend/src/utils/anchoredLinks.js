// src/utils/anchoredLinks.js
//
// Centralized "which specific section does this category link jump to"
// mapping — kept in one place instead of scattering literal #hash / ?group=
// strings across Home/Footer/Sauna.jsx, so e.g. renaming a hash on the
// target page only breaks one file, not every place that links to it.
//
// Every hash here must correspond to a REAL element id (or a real ?group=
// value) on the destination page — do not add an entry for a section that
// doesn't exist. An anchor to nothing is worse than a plain link: it looks
// broken instead of just being unspecific. ScrollToTop.jsx does the actual
// scrolling once the URL contains the hash; SaunaControls.jsx does its own
// scroll-on-?group= (see its filterSectionRef).
import menuPaths from "../menuPaths";

// Room type -> the hash SaunaRoomViewer.jsx's HASH_MAP recognizes (see
// pages/Sauna/rooms/SaunaRoomData.jsx). "outdoor" is deliberately absent —
// no Outdoor tab exists in the room viewer, so it stays a plain link.
const ROOM_ANCHORS = {
  standard: "standard-sauna-room",
  glassFront: "glass-front-sauna-room",
  compact: "compact-sauna-room",
};

export function roomsPath(type) {
  // Infrared is no longer a tab on /sauna/rooms — it has its own page, so
  // "the infrared room" resolves there rather than to a hash that would
  // land on a tab that no longer exists.
  if (type === "infrared") return menuPaths.infrared.room;
  const anchor = ROOM_ANCHORS[type];
  return anchor ? `${menuPaths.sauna.rooms}#${anchor}` : menuPaths.sauna.rooms;
}

// Control card key -> the exact ?group= value SaunaControls.jsx's
// FIXED_ORDER/GROUP_KEYWORDS recognizes.
const CONTROL_GROUPS = {
  saunova: "Saunova Series",
  innova: "Innova Series",
  accessories: "Control Spare Parts",
};

export function controlsPath(type) {
  const group = CONTROL_GROUPS[type];
  return group ? `${menuPaths.sauna.controls}?group=${encodeURIComponent(group)}` : menuPaths.sauna.controls;
}

// Infrared card key -> the real section id in pages/Infrared/Infrared.jsx.
const INFRARED_ANCHORS = {
  panels: "infrared-accessories", // Infrared Panels are one product within this section, not their own section
  controls: "infrared-controls",
};

export function infraredPath(type) {
  // "rooms" resolves to the infrared room page rather than the hub page's
  // teaser section, so every route to the infrared range — nav, Home cards,
  // footer — lands on the same page.
  if (type === "rooms") return menuPaths.infrared.room;
  const anchor = INFRARED_ANCHORS[type];
  return anchor ? `${menuPaths.infrared.parent}#${anchor}` : menuPaths.infrared.parent;
}
