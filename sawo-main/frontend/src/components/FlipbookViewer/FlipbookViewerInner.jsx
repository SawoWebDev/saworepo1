// FlipbookViewerInner.jsx
//
// The actual heavy lifting: react-pdf (pdf.js) renders each PDF page to a
// canvas, react-pageflip arranges those canvases into a draggable, page-
// turning book. Only ever loaded via FlipbookModal's React.lazy() — never
// imported statically anywhere, so none of this (or pdf.js's worker) is in
// the main bundle or any page's own chunk.
import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";

// Webpack 5's static-asset `new URL(..., import.meta.url)` form self-hosts
// the worker from our own bundle — no reliance on a third-party CDN for a
// file the viewer can't run without.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function computeDims() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;
  const maxHeight = vh - (isMobile ? 170 : 150);
  const maxWidthTotal = Math.min(vw - 32, 1000);
  // Two pages on-screen side by side on desktop, one on mobile. A4-ish
  // portrait ratio (~1 : 1.414) so pages don't look stretched/squashed.
  let width = isMobile ? maxWidthTotal : maxWidthTotal / 2;
  let height = width * 1.414;
  if (height > maxHeight) {
    height = maxHeight;
    width = height / 1.414;
  }
  return { width: Math.floor(width), height: Math.floor(height) };
}

// react-pageflip clones its children and attaches a DOM ref to each one
// directly, so every page has to be a forwardRef wrapping a real element —
// this is what makes react-pdf's <Page> usable as a flipbook page.
const FlipPage = forwardRef(({ pageNumber, width }, ref) => (
  <div className="flipbook-page" ref={ref}>
    <Page
      pageNumber={pageNumber}
      width={width}
      renderAnnotationLayer={false}
      renderTextLayer={false}
      loading={<div className="flipbook-page-placeholder" />}
    />
    <span className="flipbook-page-number">{pageNumber}</span>
  </div>
));

export default function FlipbookViewerInner({ fileUrl, title }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [dims, setDims] = useState(computeDims);
  const bookRef = useRef(null);

  useEffect(() => {
    const onResize = () => setDims(computeDims());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLoadSuccess = useCallback((doc) => {
    setNumPages(doc.numPages);
  }, []);

  const handleLoadError = useCallback((err) => {
    // Most likely cause in practice: the PDF's host doesn't send
    // Access-Control-Allow-Origin, so the browser blocks the fetch pdf.js
    // needs to render pages. A plain <a href download> link doesn't hit
    // this wall (it's a navigation, not a fetch), which is why the old
    // "download the PDF" button always worked even for the same file.
    setLoadError(err);
  }, []);

  const goPrev = () => bookRef.current?.pageFlip()?.flipPrev();
  const goNext = () => bookRef.current?.pageFlip()?.flipNext();

  if (loadError) {
    return (
      <div className="flipbook-fallback">
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        <p>We couldn't open the flipbook preview for this file.</p>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flipbook-fallback-link">
          Open the PDF instead <i className="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
        <style>{`
          .flipbook-fallback {
            display: flex; flex-direction: column; align-items: center; gap: 14px;
            color: #fff; font-family: 'Montserrat', sans-serif; text-align: center; max-width: 360px;
          }
          .flipbook-fallback i.fa-triangle-exclamation { font-size: 2rem; color: #e0a458; }
          .flipbook-fallback p { margin: 0; font-size: 0.95rem; opacity: 0.9; }
          .flipbook-fallback-link {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 22px; border-radius: 4px; background: #af8564; color: #fff;
            text-decoration: none; font-weight: 600; font-size: 0.85rem; letter-spacing: 0.4px;
            transition: background 0.2s ease;
          }
          .flipbook-fallback-link:hover { background: #9e7456; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flipbook-shell" onMouseDown={(e) => e.stopPropagation()}>
      <Document
        file={fileUrl}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={handleLoadError}
        loading={
          <div className="flipbook-doc-loading">
            <div className="flipbook-spinner" />
          </div>
        }
      >
        {numPages && (
          <HTMLFlipBook
            ref={bookRef}
            width={dims.width}
            height={dims.height}
            size="stretch"
            minWidth={200}
            maxWidth={700}
            minHeight={280}
            maxHeight={1000}
            showCover
            mobileScrollSupport
            drawShadow
            maxShadowOpacity={0.5}
            onFlip={(e) => setCurrentPage(e.data)}
            className="flipbook-book"
          >
            {Array.from({ length: numPages }, (_, i) => (
              <FlipPage key={i} pageNumber={i + 1} width={dims.width} />
            ))}
          </HTMLFlipBook>
        )}
      </Document>

      {numPages && (
        <div className="flipbook-controls">
          <button type="button" onClick={goPrev} aria-label="Previous page" className="flipbook-nav-btn">
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>
          <span className="flipbook-page-count">
            {title} — Page {currentPage + 1} of {numPages}
          </span>
          <button type="button" onClick={goNext} aria-label="Next page" className="flipbook-nav-btn">
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      )}

      <style>{`
        .flipbook-shell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .flipbook-doc-loading {
          width: 300px; height: 400px;
          display: flex; align-items: center; justify-content: center;
        }
        .flipbook-spinner {
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.25); border-top-color: #af8564;
          animation: flipbook-spin 0.8s linear infinite;
        }
        @keyframes flipbook-spin { to { transform: rotate(360deg); } }
        .flipbook-book {
          box-shadow: 0 30px 80px rgba(0,0,0,0.5);
        }
        .flipbook-page {
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .flipbook-page-placeholder {
          width: 100%; height: 100%;
          background: linear-gradient(90deg, #f0f0f0 25%, #fafafa 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: flipbook-shimmer 1.4s infinite;
        }
        @keyframes flipbook-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .flipbook-page-number {
          position: absolute;
          bottom: 6px;
          right: 10px;
          font-family: 'Montserrat', sans-serif;
          font-size: 10px;
          color: #999;
        }
        .flipbook-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
        }
        .flipbook-nav-btn {
          width: 40px; height: 40px; border-radius: 50%;
          border: none; background: rgba(255,255,255,0.12); color: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s ease;
        }
        .flipbook-nav-btn:hover { background: #af8564; }
        .flipbook-page-count {
          font-size: 0.85rem;
          opacity: 0.85;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .flipbook-page-count { font-size: 0.75rem; }
          .flipbook-controls { gap: 12px; }
        }
      `}</style>
    </div>
  );
}
