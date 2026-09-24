import React, { useState, useEffect, useRef } from "react";

export const ImageWithLoader = ({ src, alt, className, style = {}, onError }) => {
  // Track WHICH src has loaded/failed rather than a bare boolean. A caller
  // that doesn't re-key this component per src (same carousel slot, new url)
  // must not keep showing a stale broken-image fallback, so loading/error
  // are derived from the CURRENT src.
  //
  // This deliberately does NOT reset state in a useEffect([src]): for an
  // already-cached image (e.g. related-product cards whose thumbnails were
  // just loaded on the listing page) the browser can fire `load` before
  // that effect runs, and the effect's setIsLoading(true) then overwrote the
  // load — leaving the shimmer forever until a hard refresh bypassed the
  // cache and made `load` fire late enough. Deriving from src has no such race.
  const [loadedSrc, setLoadedSrc] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);
  const imgRef = useRef(null);

  const isLoading = loadedSrc !== src;
  const hasError = failedSrc === src;

  // Covers an image that finished loading before React attached onLoad.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoadedSrc(src);
  }, [src]);

  const handleLoad = () => setLoadedSrc(src);
  const handleError = (e) => {
    setFailedSrc(src);
    if (onError) onError(e);
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", ...style }}>
      {/* Skeleton/Loading State */}
      {isLoading && !hasError && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #f5ede3 25%, #e0e0e0 50%, #f5ede3 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite",
            zIndex: 1,
          }}
        />
      )}

      {/* Image */}
      {!hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={className}
          style={{
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.3s ease",
            display: "block",
            position: "relative",
            zIndex: 2,
            ...style,
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error Fallback */}
      {hasError && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
            color: "#999",
            fontSize: "0.9rem",
          }}
        >
          <i className="fa-regular fa-image" style={{ fontSize: "2rem", color: "#d5b99a" }} />
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};
