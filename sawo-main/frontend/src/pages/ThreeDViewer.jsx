// ThreeDViewer.jsx — /3d-viewer
//
// Data-driven: any publicly visible sauna_rooms row with a non-null
// model_3d_url shows up here automatically (see sauna_rooms.model_3d_url,
// added specifically for this page). No hardcoded model list — adding a
// new 3D model is a CMS/DB change (set the field on the room), not a code
// change. Today that's exactly one room (Glass Front Sauna Room 1414); the
// selector row and layout scale to any number without modification.
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "@google/model-viewer";
import { useLocalSaunaRooms } from "../Administrator/Local/useLocalSaunaRooms";
import { isPubliclyVisible } from "../local-storage/visibility";
import menuPaths from "../menuPaths";
import SEO from "../components/SEO";
import "./ThreeDViewer.css";

const ROOM_TYPE_LABELS = {
  traditional: "Traditional",
  standard:    "Standard",
  infrared:    "Infrared",
  steam:       "Steam",
  combo:       "Combo",
  glassfront:  "Glass Front",
  compact:     "Compact",
};

function roomTypeLabel(room) {
  return ROOM_TYPE_LABELS[room.room_type] || room.room_type || null;
}

function dimensionsLabel(room) {
  if (!room.width_m || !room.depth_m || !room.height_m) return null;
  return `${room.width_m} × ${room.depth_m} × ${room.height_m} m`;
}

function ThreeDViewer() {
  const { rooms, loading } = useLocalSaunaRooms();

  const modelRooms = useMemo(
    () => rooms.filter((r) => isPubliclyVisible(r) && r.model_3d_url),
    [rooms]
  );

  const [activeSlug, setActiveSlug] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [fading, setFading] = useState(false);

  // Pick the room from the URL hash (shareable deep link, e.g. #glass-front-
  // sauna-room-1414), falling back to the first available model.
  useEffect(() => {
    if (!modelRooms.length || activeSlug) return;
    const hash = (window.location.hash || "").replace("#", "");
    const found = modelRooms.find((r) => r.slug === hash);
    setActiveSlug((found || modelRooms[0]).slug);
  }, [modelRooms, activeSlug]);

  const active = modelRooms.find((r) => r.slug === activeSlug) || null;

  const selectRoom = (slug) => {
    if (slug === activeSlug) return;
    setFading(true);
    setViewerLoading(true);
    window.setTimeout(() => setFading(false), 250);
    setActiveSlug(slug);
    if (window.history.replaceState) {
      window.history.replaceState(null, "", `#${slug}`);
    }
  };

  return (
    <div className="tdv-page">
      <SEO
        title="Interactive 3D Room Viewer"
        description="Rotate, zoom, and inspect SAWO sauna rooms in interactive 3D before they arrive at your door."
        path={menuPaths.threeDViewer}
      />

      <div className="tdv-header">
        <div className="tdv-eyebrow">Interactive 3D Model</div>
        <h1 className="tdv-title">Explore Every Detail</h1>
        <p className="tdv-subtitle">
          Rotate, zoom, and inspect every angle of our sauna rooms before they ever arrive at your door.
        </p>
      </div>

      {!loading && modelRooms.length === 0 && (
        <div className="tdv-empty">
          <div className="tdv-empty-icon">
            <i className="fa-solid fa-cube" aria-hidden="true" />
          </div>
          <p className="tdv-empty-text">
            No interactive 3D models are available right now — check back soon, or browse the full room
            range below.
          </p>
          <Link className="tdv-empty-link" to="/sauna/rooms">Browse Sauna Rooms →</Link>
        </div>
      )}

      {(loading || modelRooms.length > 0) && (
        <>
          {modelRooms.length > 1 && (
            <div className="tdv-selector">
              {modelRooms.map((r) => (
                <button
                  key={r.slug}
                  type="button"
                  className={`tdv-selector-btn${r.slug === activeSlug ? " is-active" : ""}`}
                  onClick={() => selectRoom(r.slug)}
                >
                  <span className="tdv-selector-model">{r.model_code || r.name}</span>
                  <span className="tdv-selector-variant">{roomTypeLabel(r) || ""}</span>
                </button>
              ))}
            </div>
          )}

          <div className="tdv-main">
            <div>
              <div className="tdv-frame">
                {active && (
                  // eslint-disable-next-line react/no-unknown-property
                  <model-viewer
                    key={active.slug}
                    src={active.model_3d_url}
                    poster={active.thumbnail || undefined}
                    alt={active.name}
                    camera-controls
                    auto-rotate
                    auto-rotate-delay="2500"
                    shadow-intensity="1"
                    exposure="1"
                    loading="eager"
                    onLoad={() => setViewerLoading(false)}
                  />
                )}
                <div className={`tdv-loader${viewerLoading ? " is-visible" : ""}`}>
                  <div className="tdv-spinner" />
                </div>
              </div>

              <div className="tdv-hint-bar">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
                  </svg>
                  Drag to Rotate
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  Scroll to Zoom
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
                  </svg>
                  Double-tap to Focus
                </span>
              </div>
            </div>

            <div className={`tdv-info${fading ? " tdv-fading" : ""}`}>
              {loading || !active ? (
                <>
                  <div className="tdv-info-name">Loading…</div>
                </>
              ) : (
                <>
                  <div className="tdv-info-name">{active.name}</div>
                  {active.short_description && (
                    <p className="tdv-info-desc">{active.short_description}</p>
                  )}

                  {active.capacity_label && (
                    <div className="tdv-spec">
                      <div className="tdv-spec-label">Capacity</div>
                      <div className="tdv-spec-value">{active.capacity_label}</div>
                    </div>
                  )}
                  {dimensionsLabel(active) && (
                    <div className="tdv-spec">
                      <div className="tdv-spec-label">Dimensions (W × D × Ext. Height)</div>
                      <div className="tdv-spec-value">{dimensionsLabel(active)}</div>
                    </div>
                  )}
                  {roomTypeLabel(active) && (
                    <div className="tdv-spec">
                      <div className="tdv-spec-label">Room Type</div>
                      <div className="tdv-spec-value">{roomTypeLabel(active)}</div>
                    </div>
                  )}
                  {active.model_code && (
                    <div className="tdv-spec">
                      <div className="tdv-spec-label">Model</div>
                      <div className="tdv-spec-value">{active.model_code}</div>
                    </div>
                  )}

                  <Link className="tdv-view-room" to={`/sauna/rooms/${active.slug}`}>
                    View Full Room Details
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ThreeDViewer;
