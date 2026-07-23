// src/Administrator/ProductsGridModal.jsx
//
// Shared "products in a grid, inside a modal" view — used by Taxonomy
// (clicking a category/tag card) and Models (clicking a model folder).
// One component so both stay visually identical and neither reimplements
// the grid/card styling.
import React from "react";
import { isAccessoryProduct } from "../pages/IndividualDisplay/DispAccessories";

const FRONT_URL = process.env.REACT_APP_FRONT_URL || "";
// Local/GitHub-sourced products (see useLocalProducts — this modal is fed by
// Taxonomy and Models, both local-only) store image fields as paths relative
// to the images repo, not full URLs, same as Products.jsx's own local-mode
// getImageUrl(). Without this prefix the <img> tag resolves against the
// current page URL and just breaks.
const PREVIEW_GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function resolveImageUrl(product, field) {
  const imgPath = localOrRemote(product, field);
  if (!imgPath) return null;
  if (imgPath.includes("://")) return imgPath;
  return `${PREVIEW_GITHUB_RAW}${imgPath}`;
}

function productUrl(p) {
  const base = FRONT_URL || window.location.origin;
  return isAccessoryProduct(p) ? `${base}/accessories/${p.slug}` : `${base}/products/${p.slug}`;
}

function isUnpublished(p) {
  return p?.status !== "published" || p?.visible === false;
}

export default function ProductsGridModal({ open, onClose, title, products, loading, emptyMessage }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="table-loading"><i className="fa-solid fa-circle-notch fa-spin" /> Loading...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">{emptyMessage || "No products found."}</div>
          ) : (
            <div className="products-grid-modal">
              {products.map(p => (
                <a
                  key={p.id}
                  href={productUrl(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="products-grid-modal-card"
                  title={`Open "${p.name}" on the live site`}
                >
                  <div className="products-grid-modal-thumb" style={{ position: "relative" }}>
                    {resolveImageUrl(p, "thumbnail")
                      ? <img src={resolveImageUrl(p, "thumbnail")} alt={p.name} loading="lazy" decoding="async"
                          style={isUnpublished(p) ? { filter: "grayscale(1)", opacity: 0.55 } : undefined} />
                      : <i className="fa-regular fa-image" />
                    }
                    {isUnpublished(p) && (
                      <div
                        title="Not published / not visible on the live site"
                        style={{
                          position: "absolute", inset: 0,
                          background: "rgba(0,0,0,0.12)",
                          borderRadius: "inherit",
                        }}
                      />
                    )}
                  </div>
                  <span className="products-grid-modal-name">{p.name}</span>
                </a>
              ))}
            </div>
          )}
          <div className="modal-footer" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
