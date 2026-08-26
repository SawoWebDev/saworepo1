import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ROOM_CONFIGS, HASH_MAP, SIDE_THUMBS, COMPACT_VIDEO_SRC } from "./SaunaRoomData";
import menuPaths from "../../../menuPaths";
import { useLocaleT, useLocalizedPath } from "../../../i18n/LocaleContext";

// SaunaRoomData.jsx's ROOM_CONFIGS/bench data is plain English JS data (it
// has no access to t()), and its "same 5 bench names / 4 room titles repeated
// on every one of 250+ model entries" shape is exactly why: translating each
// occurrence individually would mean re-translating the same handful of
// phrases hundreds of times. Instead of restructuring that data file, this
// component (which already has t()) maps each known English literal back to
// one shared translation key at render time.
const ROOM_TITLE_KEYS = {
  "Standard Sauna Room": "standard",
  "Glass Front Sauna Room": "glassfront",
  "Infrared Saunas": "infrared",
  "Compact Sauna Room": "compact",
};
const BENCH_NAME_KEYS = {
  "Straight Bench": "straight",
  "L-Type Bench": "lType",
  "Single Straight Bench": "singleStraight",
  "Double Straight Bench": "doubleStraight",
  "Middle L-Type Bench": "middleLType",
};
// cfg.desc (ROOM_CONFIGS in SaunaRoomData.jsx) is a SEPARATE hardcoded data
// source from SRD_PANELS (translated via translateSharedItems.js) — same
// page, different shape, and it was missed on the first translation pass
// because nothing enumerates every hardcoded-English source on a page
// automatically (see README-i18n.md's "Every hardcoded-string source on a
// page, not just its own .jsx" checklist item, added after this was caught).
// Same literal-to-key lookup pattern as ROOM_TITLE_KEYS/BENCH_NAME_KEYS above.
const ROOM_DESC_KEYS = {
  "SAWO Classic Sauna Rooms offer a timeless sauna experience with high-quality Nordic wood and practical bench layouts.": "standard",
  "SAWO Glass Front Sauna Rooms offer a modern sauna experience with durable glass to overlook stunning views without compromising on practicality.": "glassfront",
  "SAWO Infrared Saunas provide gentle, therapeutic heat using advanced infrared technology for a relaxing and rejuvenating experience.": "infrared",
  "SAWO Compact Sauna Rooms offer an instant, stable, plug-and-play sauna setup for urban spaces while a hidden heater ensures safety and maximized views.": "compact",
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
  { key: "infrared",   label: "Infrared Saunas" },
  { key: "compact",    label: "Compact Sauna Room" },
];

// Which rooms /sauna/rooms offers. Infrared is deliberately absent: it moved
// to its own page (/infrared/saunas) on 2026-08-20 so the infrared range lives
// in one place instead of being a tab inside the traditional-sauna page. The
// infrared entry stays in TABS above because this component still renders
// that room — just from the other page, via the `rooms` prop.
const DEFAULT_ROOMS = ["standard", "glassfront", "compact"];

// { standard: "standard-sauna-room", glassfront: "glass-front-sauna-room", ... }
// — the DOM id the tabs-wrapper below takes on, so a link to
// /sauna/rooms#glass-front-sauna-room lands on a real element (this is the
// other half of HASH_MAP's existing hash->tab lookup on mount).
const REVERSE_HASH_MAP = Object.fromEntries(Object.entries(HASH_MAP).map(([hash, key]) => [key, hash]));

/**
 * @param {string[]} rooms     which room keys this instance offers, in tab order
 * @param {boolean}  showTabs  false for a single-room page, where a one-button
 *                             tab bar would be noise
 */
const SaunaRoomViewer = ({ rooms = DEFAULT_ROOMS, showTabs = true }) => {
  const t = useLocaleT("sauna");
  const localize = useLocalizedPath();
  const trTitle = useCallback((title) => {
    const key = ROOM_TITLE_KEYS[title];
    return key ? t(`roomsPage.roomTitles.${key}`) : title;
  }, [t]);
  const trBench = useCallback((name) => {
    const key = BENCH_NAME_KEYS[name];
    return key ? t(`roomsPage.benchTypes.${key}`) : name;
  }, [t]);
  const trDesc = useCallback((desc) => {
    const key = ROOM_DESC_KEYS[desc];
    return key ? t(`roomsPage.roomDescriptions.${key}`) : desc;
  }, [t]);
  const visibleTabs = TABS.filter((tab) => rooms.includes(tab.key));
  const [activeRoom, setActiveRoom] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const fromHash = HASH_MAP[hash];
    // Ignore a hash pointing at a room this instance does not offer, rather
    // than rendering a room with no tab to switch away from.
    return fromHash && rooms.includes(fromHash) ? fromHash : rooms[0];
  });
  const [activeSizeCategory, setActiveSizeCategory] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedSide, setSelectedSide] = useState("all");
  const [fadeOut, setFadeOut] = useState(false);
  const fadeTimer = useRef(null);

  // Side-thumbnail "angle" preview — independent of the model/size carousel,
  // just swaps the displayed photo. Cleared whenever the carousel itself
  // changes (nav, gallery click, room switch), same as the WordPress version.
  const [preview, setPreview] = useState(null); // { src, zoom } | null
  // Compact Sauna Room — inline video swapped in for the main photo.
  const [videoOn, setVideoOn] = useState(false);
  const compactVideoRef = useRef(null);
  const videoReverseState = useRef({ raf: null, reversing: false, seekPending: false });

  const cfg = ROOM_CONFIGS[activeRoom];

  const currentImages = useMemo(
    () => buildImages(cfg, activeRoom, selectedSize, selectedSide, activeSizeCategory),
    [cfg, activeRoom, selectedSize, selectedSide, activeSizeCategory]
  );

  useEffect(() => {
    setCurrentIndex(0);
    // Any filter change (size/side/category) re-renders the carousel from
    // scratch, so drop the side-thumbnail preview and video override too.
    setPreview(null);
    setVideoOn(false);
  }, [currentImages]);

  const navigate = useCallback((idx) => {
    if (currentImages.length === 0) return;
    const clamped = Math.max(0, Math.min(idx, currentImages.length - 1));
    setPreview(null);
    setVideoOn(false);
    clearTimeout(fadeTimer.current);
    setFadeOut(true);
    fadeTimer.current = setTimeout(() => {
      setCurrentIndex(clamped);
      setFadeOut(false);
    }, 150);
  }, [currentImages.length]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowLeft" && currentIndex > 0) navigate(currentIndex - 1);
    if (e.key === "ArrowRight" && currentIndex < currentImages.length - 1) navigate(currentIndex + 1);
  }, [currentIndex, currentImages.length, navigate]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => clearTimeout(fadeTimer.current);
  }, []);

  // Compact Sauna Room video — play/pause as the trigger tile is toggled.
  useEffect(() => {
    const v = compactVideoRef.current;
    if (!v) return;
    if (videoOn) {
      v.currentTime = 0;
      if (v.readyState >= 3) {
        v.play().catch(() => {});
      } else {
        const onReady = () => { v.play().catch(() => {}); };
        v.addEventListener("canplay", onReady, { once: true });
        return () => v.removeEventListener("canplay", onReady);
      }
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [videoOn]);

  // Start buffering the compact video as soon as that tab opens, so it's
  // ready by the time the user clicks the trigger tile.
  useEffect(() => {
    const v = compactVideoRef.current;
    if (activeRoom === "compact" && v && v.readyState < 3) {
      v.load();
    }
  }, [activeRoom]);

  // On end, scrub backwards to the start (instead of a jump-cut) then play
  // forward again — the "Scene 3" reverse-rewind loop pattern. Scrubbing
  // currentTime is an async seek, so each frame waits for the previous
  // "seeked" event instead of queuing seeks faster than the decoder can
  // service them (which is what reads as stuck/laggy).
  useEffect(() => {
    const v = compactVideoRef.current;
    if (!v) return;
    const state = videoReverseState.current;

    const stopReverse = () => {
      state.reversing = false;
      if (state.raf !== null) cancelAnimationFrame(state.raf);
      state.raf = null;
    };

    const playReverse = () => {
      v.pause();
      state.reversing = true;
      let last = performance.now();

      const onSeeked = () => { state.seekPending = false; };
      v.addEventListener("seeked", onSeeked);

      const step = (now) => {
        if (!state.reversing) { v.removeEventListener("seeked", onSeeked); return; }
        const dt = (now - last) / 1000;
        last = now;
        if (!state.seekPending) {
          const next = v.currentTime - dt;
          if (next > 0.05) {
            state.seekPending = true;
            v.currentTime = next;
            state.raf = requestAnimationFrame(step);
          } else {
            v.removeEventListener("seeked", onSeeked);
            v.currentTime = 0;
            state.raf = null;
            state.reversing = false;
            v.play().catch(() => {});
          }
        } else {
          state.raf = requestAnimationFrame(step);
        }
      };
      state.raf = requestAnimationFrame(step);
    };

    v.addEventListener("ended", playReverse);
    return () => {
      v.removeEventListener("ended", playReverse);
      stopReverse();
    };
  }, []);

  const toggleCompactVideo = useCallback(() => {
    setVideoOn((v) => !v);
  }, []);

  const handleSideThumbClick = useCallback((thumb) => {
    setVideoOn(false);
    setPreview({ src: thumb.src, zoom: thumb.zoom || null });
  }, []);

  const switchRoom = useCallback((roomKey) => {
    setActiveRoom(roomKey);
    setActiveSizeCategory(null);
    setCurrentIndex(0);
    setSelectedSize("all");
    setSelectedSide("all");
    setFadeOut(false);
    setPreview(null);
    setVideoOn(false);
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
    setPreview(null);
    setVideoOn(false);
    if (modelSize === selectedSize) {
      setSelectedSize("all");
      setActiveSizeCategory(null);
    } else {
      setSelectedSize(modelSize);
      const cat = getCategoryForModel(cfg, modelSize);
      if (cat) setActiveSizeCategory(cat);
    }
  };

  const current = currentImages[currentIndex] || null;
  const currentBench = current ? cfg.benchTypes[current.bench] : null;
  const currentSizeData = current ? cfg.sizeData[current.size] : null;

  const imageTag = current
    ? cfg.isFlat
      ? current.size
      : `${cleanModelNumber(current.size, cfg)} - ${current.side}`
    : "";

  const isBestSeller = current && cfg.bestSellers && cfg.bestSellers.has(current.size);

  const inquiryHref = useMemo(() => {
    if (!current) return localize(menuPaths.contact);
    const model = cfg.isFlat ? current.size : cleanModelNumber(current.size, cfg);
    const benchType = cfg.benchTypes[current.bench]?.name || "Standard Bench";
    const sideStr = cfg.isFlat ? "" : current.side;
    const subject = `Customize My Sauna: Room: ${cfg.label} - ${model}${sideStr} - ${benchType}`;
    return `${localize(menuPaths.contact)}?subject=${encodeURIComponent(subject)}`;
  }, [current, cfg, localize]);

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

  const allowedSizeValues = useMemo(() => {
    if (!activeSizeCategory || !cfg.sizeCategories) return null;
    return new Set(cfg.sizeCategories[activeSizeCategory]);
  }, [cfg, activeSizeCategory]);

  const total = currentImages.length;
  const midIdx = currentIndex === 0 || currentIndex === total - 1
    ? Math.floor(total / 2)
    : currentIndex;

  const sideThumbs = SIDE_THUMBS[activeRoom] || null;
  const displayedSrc = preview ? preview.src : current?.imageUrl;
  const displayedTransform = preview?.zoom ? `scale(${preview.zoom})` : "";

  return (
    <>
      {/* TABS */}
      {/* Suppressed entirely when there are no tabs, rather than left as an
          empty .sauna-tabs-wrapper > .sauna-room-tabs pair — those still
          carry their own padding, so a single-room page got a band of dead
          space under the hero. */}
      {showTabs && (
      <div className="sauna-tabs-wrapper" id={REVERSE_HASH_MAP[activeRoom]}>
        <div className="sauna-room-tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              className={`sauna-tab-btn${activeRoom === tab.key ? " active" : ""}`}
              onClick={() => switchRoom(tab.key)}
            >
              {trTitle(tab.label)}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* ROOM UI */}
      <div className="room-wrapper" key={activeRoom} id="sawo-configurator">
        <div className="room-header-top">
          <div className="room-title">{currentBench ? trTitle(currentBench.title) : trTitle(cfg.label)}</div>
          <div className="room-desc">{trDesc(cfg.desc)}</div>
        </div>

        {/* LEFT — Image + Gallery */}
        <div className="room-image">
          <div className="carousel-row">
            {sideThumbs && (
              <div className="side-thumbnails">
                {sideThumbs.map((thumb, i) => (
                  <button
                    key={thumb.src}
                    type="button"
                    className={`side-thumb${(preview ? preview.src === thumb.src : i === 0) ? " active" : ""}`}
                    onClick={() => handleSideThumbClick(thumb)}
                  >
                    <img src={thumb.src} alt={thumb.alt} />
                  </button>
                ))}
              </div>
            )}

            <div className={`carousel-container${videoOn ? " video-on" : ""}`}>
              <div className="image-tag">{imageTag}</div>

              {isBestSeller && (
                <div className="carousel-best-seller">{t("roomsPage.viewer.bestSeller")}</div>
              )}

              {displayedSrc && (
                <img
                  src={displayedSrc}
                  alt="Sauna Room"
                  className={fadeOut ? "fade-out" : ""}
                  style={displayedTransform ? { transform: displayedTransform } : undefined}
                />
              )}

              {activeRoom === "compact" && (
                <video
                  ref={compactVideoRef}
                  className="compact-video"
                  playsInline
                  preload="none"
                  muted
                  src={COMPACT_VIDEO_SRC}
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
                      <div className="gallery-best-seller">{t("roomsPage.viewer.bestSeller")}</div>
                    )}
                    <img src={firstImage} alt={modelSize} />
                    <div className="gallery-label">
                      {getGalleryLabel(activeRoom, cfg, modelSize)}
                    </div>
                  </div>
                );
              })}
              {activeRoom === "compact" && (
                <div
                  className={`gallery-item video-trigger${videoOn ? " active" : ""}`}
                  onClick={toggleCompactVideo}
                >
                  <div className="video-trigger-icon">▶</div>
                  <div className="gallery-label">{t("roomsPage.viewer.video")}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Details */}
        <div className="room-details">
          <div className="bench-design-section">
            <div className="bench-design-label">{t("roomsPage.viewer.benchDesign")}</div>
            <div className="bench-design-visual">
              <div className="bench-design-name">
                {currentBench ? trBench(currentBench.name) : "-"}
              </div>
              <div className={`bench-icon${currentBench ? " " + currentBench.class : ""}`}>
                {currentBench && (
                  <img src={currentBench.image} alt={currentBench.name} />
                )}
              </div>
            </div>
          </div>

          <div className="product-specs">
            <div className="spec-item">
              <div className="spec-label">{t("roomsPage.viewer.modelNumber")}</div>
              <div className="spec-value">
                {current
                  ? cfg.isFlat
                    ? current.size
                    : cleanModelNumber(current.size, cfg)
                  : "-"}
              </div>
            </div>
            <div className="spec-item">
              <div className="spec-label">{t("roomsPage.viewer.capacity")}</div>
              <div className="spec-value">{currentSizeData ? currentSizeData.capacity : "-"}</div>
            </div>
          </div>

          <div className="dimensions-section">
            <div className="dimensions-title">{t("roomsPage.viewer.dimensions")}</div>
            <div className="dimension-grid">
              <div className="dimension-box">
                <div className="value">{currentSizeData ? currentSizeData.width : "-"}</div>
                <div className="label">{t("roomsPage.viewer.width")}</div>
              </div>
              <div className="dimension-box">
                <div className="value">{currentSizeData ? currentSizeData.depth : "-"}</div>
                <div className="label">{t("roomsPage.viewer.depth")}</div>
              </div>
              <div className="dimension-box">
                <div className="value">{currentSizeData ? currentSizeData.height : "-"}</div>
                <div className="label">{t("roomsPage.viewer.height")}</div>
              </div>
            </div>
          </div>

          <div className="filters-section">
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
                      {t(`roomsPage.viewer.sizeCategories.${cat}`)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="filter-group">
              <label>
                {t("roomsPage.viewer.saunaRoomModel")}
                <button className="reset-btn" onClick={handleResetSize} title={t("roomsPage.viewer.reset")}>↻</button>
              </label>
              <select value={selectedSize} onChange={(e) => handleSizeChange(e.target.value)}>
                <option value="all">{t("roomsPage.viewer.showAll")}</option>
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

            <div className="filter-group">
              <label>
                {t("roomsPage.viewer.doorLocation")}
                <button
                  className="reset-btn"
                  onClick={handleResetSide}
                  title={t("roomsPage.viewer.reset")}
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
                <option value="all">{t("roomsPage.viewer.showAll")}</option>
                {cfg.doorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group full-width">
              <label>{t("roomsPage.viewer.woodType")}</label>
              <select disabled style={{ cursor: "not-allowed" }}>
                {cfg.woodOptions.map((w, i) => (
                  <option key={w} disabled={!cfg.woodEnabled[i]}>{w}</option>
                ))}
              </select>
            </div>

            <div className="filter-group full-width">
              <a
                href={inquiryHref}
                className="inquiry-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{t("roomsPage.viewer.inquireNow")}</span>
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
    </>
  );
};

export default SaunaRoomViewer;
