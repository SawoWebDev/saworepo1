// ThreeDViewer.jsx — /3d-viewer
//
// Data-driven: any publicly visible sauna_rooms row with a non-null
// model_3d_url shows up here automatically (see sauna_rooms.model_3d_url,
// added specifically for this page). No hardcoded model list — adding a
// new 3D model is a CMS/DB change (set the field on the room), not a code
// change. Today that's exactly one room (Glass Front Sauna Room 1414).
//
// LOCAL_MODEL_OVERRIDES below lets specific rooms serve their GLB from this
// app's own build (src/assets/models/) instead of the DB-stored URL, so a
// known model doesn't depend on an external host surviving indefinitely.
// Any room not listed here still falls back to model_3d_url untouched —
// the data-driven design still holds for every future room added via CMS.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "@google/model-viewer";
import { useLocalSaunaRooms } from "../Administrator/Local/useLocalSaunaRooms";
import { isPubliclyVisible } from "../local-storage/visibility";
import menuPaths from "../menuPaths";
import SEO from "../components/SEO";
import { useLocaleT, useLocalizedPath } from "../i18n/LocaleContext";
import model1414RSGlassFront from "../assets/models/1414RSGLASSFRONT.glb";
import "./ThreeDViewer.css";

const LOCAL_MODEL_OVERRIDES = {
  "glass-front-sauna-room-1414": model1414RSGlassFront,
};

// Same helpers as DispSaunaRoom.jsx/AllProducts.jsx/Sitemap.jsx (per-file
// copy, matching this repo's established convention) — `product.json`'s
// `roomTypes` dictionary is the complete, canonical room-type wordlist (all
// 7 real room_type values), and `room.name` is English-only in Supabase (no
// room_translations table), so the display name is reconstructed from the
// already-translated type word + the untranslatable model code instead.
function roomTypeLabel(tp, key) {
  if (!key) return key;
  const label = tp(`roomTypes.${key}`);
  return label === `roomTypes.${key}` ? key : label;
}

function roomDisplayName(tp, room) {
  if (!room?.room_type || !room?.model_code) return room?.name;
  return tp("roomDisplayName", { type: roomTypeLabel(tp, room.room_type), code: room.model_code });
}

function dimensionsLabel(room) {
  if (!room.width_m || !room.depth_m || !room.height_m) return null;
  return `${room.width_m} × ${room.depth_m} × ${room.height_m} m`;
}

function buildSpecs(t, tp, room) {
  const specs = [];
  if (room.capacity_label) {
    specs.push({ label: t("roomsPage.viewer.capacity"), value: room.capacity_label });
  }
  if (dimensionsLabel(room)) {
    specs.push({
      label: t("roomsPage.viewer.dimensions"),
      value: dimensionsLabel(room),
      note: t("threeDViewerPage.dimensionsNote"),
    });
  }
  if (room.room_type) {
    specs.push({ label: t("threeDViewerPage.roomType"), value: roomTypeLabel(tp, room.room_type) });
  }
  if (room.model_code) {
    specs.push({ label: t("roomsPage.viewer.modelNumber"), value: room.model_code });
  }
  return specs;
}

function ThreeDViewer() {
  const t = useLocaleT("sauna");
  const tNav = useLocaleT("nav");
  const tp = useLocaleT("product");
  const localize = useLocalizedPath();
  const { rooms, loading } = useLocalSaunaRooms();

  const modelRooms = useMemo(
    () => rooms.filter((r) => isPubliclyVisible(r) && r.model_3d_url),
    [rooms]
  );

  const [activeSlug, setActiveSlug] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const viewerRef = useRef(null);
  const defaultCameraRef = useRef(null);

  // Pick the room from the URL hash (shareable deep link, e.g. #glass-front-
  // sauna-room-1414), falling back to the first available model.
  useEffect(() => {
    if (!modelRooms.length || activeSlug) return;
    const hash = (window.location.hash || "").replace("#", "");
    const found = modelRooms.find((r) => r.slug === hash);
    setActiveSlug((found || modelRooms[0]).slug);
  }, [modelRooms, activeSlug]);

  const active = modelRooms.find((r) => r.slug === activeSlug) || null;
  const activeSrc = active ? LOCAL_MODEL_OVERRIDES[active.slug] || active.model_3d_url : null;

  // <model-viewer> is a web component — React's JSX `onLoad` prop doesn't
  // reliably bind to its "load" event (custom elements don't get React's
  // synthetic event handling the way native tags do), so the load listener
  // has to be attached imperatively. Also checks `.loaded` immediately in
  // case the event already fired before this effect ran, and falls back to
  // clearing the loader after 6s so a slow/failed load never gets stuck.
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !activeSrc) return;

    // Captures the camera framing model-viewer settles on once the model has
    // actually loaded (not before — orbit/fov aren't meaningful until then),
    // so the reset button has something to return to.
    const captureDefaultCamera = () => {
      defaultCameraRef.current = {
        orbit: el.getCameraOrbit(),
        target: el.getCameraTarget(),
        fov: el.getFieldOfView(),
      };
    };

    if (el.loaded) {
      setViewerLoading(false);
      captureDefaultCamera();
      return;
    }

    const handleLoad = () => {
      setViewerLoading(false);
      captureDefaultCamera();
    };
    el.addEventListener("load", handleLoad);
    const fallback = window.setTimeout(() => setViewerLoading(false), 6000);

    return () => {
      el.removeEventListener("load", handleLoad);
      window.clearTimeout(fallback);
    };
  }, [activeSrc]);

  const resetView = () => {
    const el = viewerRef.current;
    const defaults = defaultCameraRef.current;
    if (!el || !defaults) return;
    const { orbit, target, fov } = defaults;
    el.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${orbit.radius}m`;
    el.cameraTarget = `${target.x}m ${target.y}m ${target.z}m`;
    el.fieldOfView = `${fov}deg`;
  };

  // Double-click/double-tap also resets the view. model-viewer's own pointer
  // handling for camera-controls doesn't reliably let the browser synthesize
  // a native "dblclick" (confirmed: plain "click" fires fine, "dblclick"
  // doesn't) — so this is detected manually by timing two "click" events
  // instead of relying on onDoubleClick.
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    let lastClickAt = 0;
    const handleClick = () => {
      const now = Date.now();
      if (now - lastClickAt < 350) {
        resetView();
        lastClickAt = 0;
      } else {
        lastClickAt = now;
      }
    };
    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, [activeSrc]);

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
        title={t("threeDViewerPage.meta.title")}
        description={t("threeDViewerPage.meta.description")}
        path={menuPaths.threeDViewer}
      />

      <div className="tdv-nav">
        <Link className="tdv-back" to={localize(menuPaths.sauna.rooms)}>
          <span className="tdv-back-arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </span>
          <span className="tdv-back-label">{tNav("items.saunaRooms")}</span>
        </Link>
      </div>

      <div className="tdv-header">
        <div className="tdv-eyebrow">{t("roomsPage.teaser3d.label")}</div>
        <h1 className="tdv-title">
          {t("threeDViewerPage.title")} <em>{t("threeDViewerPage.titleEm")}</em>
        </h1>
        <p className="tdv-subtitle">{t("roomsPage.teaser3d.subtitle")}</p>
      </div>

      <div className="tdv-rule" />

      {!loading && modelRooms.length === 0 && (
        <div className="tdv-empty">
          <div className="tdv-empty-icon">
            <i className="fa-solid fa-cube" aria-hidden="true" />
          </div>
          <p className="tdv-empty-text">{t("threeDViewerPage.emptyText")}</p>
          <Link className="tdv-empty-link" to={localize(menuPaths.sauna.rooms)}>
            {t("threeDViewerPage.emptyLink")}
          </Link>
        </div>
      )}

      {(loading || modelRooms.length > 0) && (
        <>
          {modelRooms.length > 1 && (
            <div className="tdv-selector-section">
              <div className="tdv-selector-label">{t("threeDViewerPage.selectModel")}</div>
              <div className="tdv-selector-wrap">
                <div className="tdv-selector">
                  {modelRooms.map((r) => (
                    <button
                      key={r.slug}
                      type="button"
                      className={`tdv-selector-btn${r.slug === activeSlug ? " is-active" : ""}`}
                      onClick={() => selectRoom(r.slug)}
                    >
                      <span className="tdv-selector-model">{r.model_code || roomDisplayName(tp, r)}</span>
                      <span className="tdv-selector-variant">{roomTypeLabel(tp, r.room_type) || ""}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="tdv-viewer-section">
            <div className="tdv-frame-outer">
              <div className="tdv-frame">
                {active && (
                  // eslint-disable-next-line react/no-unknown-property
                  <model-viewer
                    key={active.slug}
                    ref={viewerRef}
                    src={activeSrc}
                    poster={active.thumbnail || undefined}
                    alt={roomDisplayName(tp, active)}
                    camera-controls
                    touch-action="pan-y"
                    auto-rotate
                    rotation-per-second="15deg"
                    shadow-intensity="0.4"
                    exposure="1"
                    loading="eager"
                    max-camera-orbit="Infinity 100deg Infinity"
                  />
                )}
              </div>
              <div className={`tdv-loading-overlay${viewerLoading ? " is-visible" : ""}`}>
                <div className="tdv-spinner" />
                <div className="tdv-loading-text">{t("threeDViewerPage.loadingModel")}</div>
              </div>
              {!viewerLoading && (
                <button
                  type="button"
                  className="tdv-reset-btn"
                  onClick={resetView}
                  title={t("roomsPage.viewer.reset")}
                  aria-label={t("roomsPage.viewer.reset")}
                >
                  ↻
                </button>
              )}
            </div>

            <div className={`tdv-info-bar${fading ? " tdv-fading" : ""}`}>
              <div className="tdv-info-text">
                {loading || !active ? (
                  <div className="tdv-active-name">{t("threeDViewerPage.loading")}</div>
                ) : (
                  <>
                    <div className="tdv-active-name">{roomDisplayName(tp, active)}</div>
                    {active.short_description && (
                      <p className="tdv-active-desc">{active.short_description}</p>
                    )}
                  </>
                )}
              </div>
              <div className="tdv-hints">
                <div className="tdv-hint">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" /></svg>
                  {t("roomsPage.teaser3d.dragRotate")}
                </div>
                <div className="tdv-hint-sep" />
                <div className="tdv-hint">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#af8564" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" /></svg>
                  {t("roomsPage.teaser3d.scrollZoom")}
                </div>
              </div>
            </div>
          </div>

          {active && buildSpecs(t, tp, active).length > 0 && (
            <div className="tdv-specs-section">
              <div className="tdv-specs-header">
                <div className="tdv-specs-label">{t("threeDViewerPage.specifications")}</div>
                <div className="tdv-specs-line" />
              </div>
              <div className={`tdv-specs${fading ? " tdv-fading" : ""}`}>
                {buildSpecs(t, tp, active).map((s) => (
                  <div className="tdv-spec" key={s.label}>
                    <div className="tdv-spec-label">{s.label}</div>
                    <div className="tdv-spec-value">{s.value}</div>
                    {s.note && <div className="tdv-spec-note">{s.note}</div>}
                  </div>
                ))}
              </div>
              <Link className="tdv-view-room" to={localize(`/sauna/rooms/${active.slug}`)}>
                {t("threeDViewerPage.viewFullRoom")}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ThreeDViewer;
