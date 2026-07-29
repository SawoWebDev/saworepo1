// FlipbookModal.jsx
//
// The reusable trigger-and-shell for the flipbook PDF viewer. This file is
// meant to be statically imported anywhere a "View Catalogue"/"View
// Brochure" link exists — it is deliberately tiny (no react-pdf, no
// react-pageflip) so importing it costs nothing on pages that never open it.
//
// The actual viewer (FlipbookViewerInner) pulls in react-pdf + pdfjs + the
// page-flip library — real weight. It's loaded via React.lazy() and that
// lazy() call only triggers a network fetch the first time it's rendered,
// which only happens once `isOpen` goes true. Closed = the chunk is never
// requested, so it can't cost anything on Lighthouse's initial-load pass.
import React, { Suspense, lazy, useEffect } from "react";
import { createPortal } from "react-dom";

const FlipbookViewerInner = lazy(() => import("./FlipbookViewerInner"));

function LoadingState() {
  return (
    <div className="flipbook-loading">
      <div className="flipbook-spinner" />
      <p>Opening catalogue…</p>
      <style>{`
        .flipbook-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
        }
        .flipbook-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.25);
          border-top-color: #af8564;
          animation: flipbook-spin 0.8s linear infinite;
        }
        @keyframes flipbook-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function FlipbookModal({ isOpen, onClose, fileUrl, title = "Catalogue" }) {
  // Lock page scroll + close on Escape while open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portaled straight to <body>: a position:fixed element still obeys any
  // ancestor with transform/filter/perspective/contain (each of those
  // creates a new containing block for fixed descendants), which silently
  // shrinks or mispositions it to that ancestor's box instead of the real
  // viewport — the near-opaque backdrop can end up not actually covering
  // the page, letting whatever's underneath (e.g. the hero text) show
  // through and visually collide with the modal's own text. A portal
  // sidesteps that class of bug entirely by not being a descendant of any
  // of this page's markup in the first place. Same pattern already used by
  // BrochureDropdownButton.jsx in this codebase.
  return createPortal(
    <div
      className="flipbook-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="flipbook-close-btn"
        aria-label="Close catalogue viewer"
        onClick={onClose}
      >
        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

      <Suspense fallback={<LoadingState />}>
        <FlipbookViewerInner fileUrl={fileUrl} title={title} onClose={onClose} />
      </Suspense>

      <style>{`
        .flipbook-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: #14100d;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: auto;
        }
        .flipbook-close-btn {
          position: fixed;
          top: 20px;
          right: 24px;
          z-index: 10001;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.12);
          color: #fff;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .flipbook-close-btn:hover {
          background: rgba(255,255,255,0.24);
          transform: scale(1.06);
        }
        @media (max-width: 640px) {
          .flipbook-overlay { padding: 12px; }
          .flipbook-close-btn { top: 12px; right: 12px; width: 38px; height: 38px; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
