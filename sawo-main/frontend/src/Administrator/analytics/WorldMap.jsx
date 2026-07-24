// WorldMap.jsx
// Choropleth world map for the Locations card — each visited country gets
// its own distinct color, with a legend (swatch, country, visits) in the
// upper-left. Topojson ships from node_modules (world-atlas), so the admin
// panel makes no runtime CDN request for map data.
import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import worldTopo from "world-atlas/countries-110m.json";

// Our geo providers (ipapi.co / ip-api.com) return common English names;
// world-atlas uses Natural Earth names. Bridge the ones that differ.
const NAME_ALIASES = {
  "United States": "United States of America",
  "Czech Republic": "Czechia",
  "Czechia": "Czechia",
  "Russian Federation": "Russia",
  "Russia": "Russia",
  "South Korea": "South Korea",
  "Republic of Korea": "South Korea",
  "North Korea": "North Korea",
  "Dominican Republic": "Dominican Rep.",
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "Democratic Republic of the Congo": "Dem. Rep. Congo",
  "DR Congo": "Dem. Rep. Congo",
  "Republic of the Congo": "Congo",
  "Viet Nam": "Vietnam",
  "United Republic of Tanzania": "Tanzania",
  "Ivory Coast": "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Myanmar (Burma)": "Myanmar",
  "Central African Republic": "Central African Rep.",
  "South Sudan": "S. Sudan",
  "Equatorial Guinea": "Eq. Guinea",
  "Western Sahara": "W. Sahara",
  "Solomon Islands": "Solomon Is.",
  "The Netherlands": "Netherlands",
  "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
};

// Fixed-order categorical palette (8 slots) — validated with the dataviz
// skill's validator against this app's own light/dark card surfaces: passes
// lightness band, chroma floor, CVD separation and normal-vision floor on
// every adjacent pair. A choropleth technically risks any-pair adjacency
// (not just sequential-adjacent), which the same validation notes only the
// first 3 slots clear unaided — the legend + hover tooltip below are the
// required "secondary encoding" that makes the full 8 safe to use here.
const CATEGORICAL_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const CATEGORICAL_DARK  = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];

export default function WorldMap({ countries, height = 320 }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, label }

  const isDark = useMemo(() => document.documentElement.getAttribute("data-theme") === "dark", []);

  // --brand is the same hex in both themes (admin.css doesn't override it
  // under [data-theme="dark"]), so it's read once and used for the "no
  // visitors" land wash — a faint brand-brown tint reads as "a map" instead
  // of a neutral gray that blends into the card background.
  const brandColor = useMemo(
    () => getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#af8564",
    []
  );
  // Muted neutral for the "Other" bucket (countries past the 8-color cap) —
  // distinct from both the vivid palette and the faint zero-visit wash.
  const otherColor = useMemo(
    () => (isDark
      ? getComputedStyle(document.documentElement).getPropertyValue("--text-3").trim() || "rgba(255,255,255,0.68)"
      : getComputedStyle(document.documentElement).getPropertyValue("--text-3").trim() || "#9a918a"),
    [isDark]
  );

  const NO_DATA_OPACITY = 0.14;
  const NO_DATA_HOVER_OPACITY = 0.32;
  const OTHER_OPACITY = 0.55;

  // byTopoName: topojson country name → visitor count (for the tooltip,
  // always the real per-country number even when grouped into "Other").
  // colorByTopoName: topojson country name → { color, opacity } fill.
  // legend: up to 8 distinct countries + one grouped "Other" row.
  const { byTopoName, colorByTopoName, legend } = useMemo(() => {
    const aggregated = {}; // topoName -> { visitors, displayName }
    (countries || []).forEach(({ name, visitors }) => {
      if (!name || name === "Unknown") return;
      const topoName = NAME_ALIASES[name] || name;
      if (!aggregated[topoName]) aggregated[topoName] = { visitors: 0, displayName: name };
      aggregated[topoName].visitors += visitors;
    });
    const sorted = Object.entries(aggregated)
      .map(([topoName, v]) => ({ topoName, ...v }))
      .sort((a, b) => b.visitors - a.visitors);

    const palette = isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
    const byTopoName = {};
    const colorByTopoName = {};
    const legendRows = [];
    let otherVisitors = 0;
    let otherCount = 0;

    sorted.forEach((c, idx) => {
      byTopoName[c.topoName] = c.visitors;
      if (idx < palette.length) {
        colorByTopoName[c.topoName] = { color: palette[idx], opacity: 1 };
        legendRows.push({ color: palette[idx], name: c.displayName, visitors: c.visitors });
      } else {
        colorByTopoName[c.topoName] = { color: otherColor, opacity: OTHER_OPACITY };
        otherVisitors += c.visitors;
        otherCount += 1;
      }
    });
    if (otherCount > 0) {
      legendRows.push({ color: otherColor, name: `Other (${otherCount})`, visitors: otherVisitors });
    }

    return { byTopoName, colorByTopoName, legend: legendRows };
  }, [countries, isDark, otherColor]);

  return (
    // Fixed height (matches Analytics.jsx's CARD_CONTENT_HEIGHT by default,
    // or a taller value when rendered inside the fullscreen view) so the
    // Locations card is the same size on the Map tab as on the list tabs —
    // the SVG viewBox letterboxes to fit instead of driving the height off
    // its own aspect ratio.
    <div style={{ position: "relative", width: "100%", height }}>
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 150 }}
        width={800}
        height={400}
        style={{ width: "100%", height, display: "block" }}
      >
        <Geographies geography={worldTopo}>
          {({ geographies }) =>
            geographies
              // Antarctica: all map, no visitors — drop it for a tighter fit.
              .filter(geo => geo.properties.name !== "Antarctica")
              .map(geo => {
                const name = geo.properties.name;
                const visitors = byTopoName[name] || 0;
                const entry = colorByTopoName[name]; // undefined = zero visitors
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseMove={(e) => {
                      const bounds = e.currentTarget.closest("svg").parentNode.getBoundingClientRect();
                      setTooltip({
                        x: e.clientX - bounds.left,
                        y: e.clientY - bounds.top,
                        label: `${name} — ${visitors} visitor${visitors !== 1 ? "s" : ""}`,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: {
                        fill: entry ? entry.color : brandColor,
                        fillOpacity: entry ? entry.opacity : NO_DATA_OPACITY,
                        stroke: "var(--map-border)",
                        strokeWidth: 0.75,
                        outline: "none",
                      },
                      hover: {
                        fill: entry ? entry.color : brandColor,
                        fillOpacity: entry ? 1 : NO_DATA_HOVER_OPACITY,
                        stroke: "var(--brand)",
                        strokeWidth: 1.1,
                        outline: "none",
                        cursor: "default",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
          }
        </Geographies>
      </ComposableMap>

      {legend.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            maxWidth: 220,
            zIndex: 3,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)" }}>Country</span>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)" }}>Visits</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {legend.map((row, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                <span className="truncate" style={{ fontSize: "0.75rem", color: "var(--text)", flex: 1, minWidth: 0 }}>{row.name}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", flexShrink: 0 }}>{row.visitors}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y - 34,
            pointerEvents: "none",
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: "0.78rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            zIndex: 5,
          }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
