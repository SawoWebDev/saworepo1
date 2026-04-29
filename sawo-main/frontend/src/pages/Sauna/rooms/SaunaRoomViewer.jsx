import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ROOM_CONFIGS, HASH_MAP } from "./SaunaRoomData";

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

const SaunaRoomViewer = () => {
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

  const switchRoom = useCallback((roomKey) => {
    setActiveRoom(roomKey);
    setActiveSizeCategory(null);
    setCurrentIndex(0);
    setSelectedSize("all");
    setSelectedSide("all");
    setFadeOut(false);
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

  return (
    <>
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
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </div>
                  </button>
                ))}
              </div>
            )}

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

            <div className="filter-group full-width">
              <label>Wood Type</label>
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
    </>
  );
};

export default SaunaRoomViewer;
