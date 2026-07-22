import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const container = document.getElementById("root");
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// The build prerenders the homepage into index.html (scripts/prerender.js)
// purely so it PAINTS instantly — it is a headless-browser DOM snapshot
// (element.innerHTML), not real server-rendered markup, so it is NOT safe to
// hydrate against. Reading innerHTML re-serializes attributes through the
// browser's own CSSOM (e.g. `background:#af8564` becomes
// `background: rgb(175, 133, 100)`, `fetchPriority` becomes `fetchpriority`)
// in ways that differ from what React itself writes on a fresh render, so
// hydrateRoot reliably throws "Hydration failed" / "Prop did not match"
// errors here — confirmed with a dev-mode React build, unrelated to any
// app bug. createRoot() intentionally discards the snapshot and mounts
// fresh instead; by the time this script runs (gated on the hero image's
// own load event — see prerender.js), the snapshot has already delivered
// its FCP/LCP benefit, so the remount is visually seamless.
ReactDOM.createRoot(container).render(app);
