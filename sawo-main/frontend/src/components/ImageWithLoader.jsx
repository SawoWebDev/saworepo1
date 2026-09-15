import React, { useState, useEffect } from "react";

export const ImageWithLoader = ({ src, alt, className, style = {}, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Without this, a caller that doesn't remount/re-key this component per
  // src (e.g. the same carousel slot re-rendering with a NEW url — a
  // replaced product thumbnail, or same-session cached data getting
  // corrected by a fresh fetch) keeps showing the broken-image fallback
  // forever once hasError flips true once, even after src points at a
  // perfectly valid image. hasError/isLoading need to track the CURRENT
  // src, not just "has this component instance ever failed."
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => setIsLoading(false);
  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
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
