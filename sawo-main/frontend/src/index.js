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

// The build prerenders the homepage into index.html (scripts/prerender.js);
// when that markup is present, hydrate it instead of re-rendering from
// scratch. Empty root (all other routes, or a build without prerender)
// keeps the classic client render.
if (container.hasChildNodes()) {
  ReactDOM.hydrateRoot(container, app);
} else {
  ReactDOM.createRoot(container).render(app);
}
