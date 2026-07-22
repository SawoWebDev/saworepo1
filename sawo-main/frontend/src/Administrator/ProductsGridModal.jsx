// src/Administrator/ProductsGridModal.jsx
//
// Shared "products in a grid, inside a modal" view — used by Taxonomy
// (clicking a category/tag card) and Models (clicking a model folder).
// One component so both stay visually identical and neither reimplements
// the grid/card styling.
import React from "react";
import { isAccessoryProduct } from "../pages/IndividualDisplay/DispAccessories";

const FRONT_URL = process.env.REACT_APP_FRONT_URL || "";

function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function productUrl(p) {
  const base = FRONT_URL || window.location.origin;
  return isAccessoryProduct(p) ? `${base}/accessories/${p.slug}` : `${base}/products/${p.slug}`;
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
                  <div className="products-grid-modal-thumb">
                    {localOrRemote(p, "thumbnail")
                      ? <img src={localOrRemote(p, "thumbnail")} alt={p.name} loading="lazy" decoding="async" />
                      : <i className="fa-regular fa-image" />
                    }
                  </div>
                  <span className="products-grid-modal-name">{p.name}</span>
                  <span className="tbl-status">{p.status}</span>
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
