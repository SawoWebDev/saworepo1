// src/Administrator/ProductsGridModal.jsx
//
// Shared "products in a grid, inside a modal" view — used by Taxonomy
// (clicking a category/tag card) and Models (clicking a model folder).
// One component so both stay visually identical and neither reimplements
// the grid/card styling.
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAccessoryProduct, VARIANT_COLOR_DOT } from "../pages/IndividualDisplay/DispAccessories";

const FRONT_URL = process.env.REACT_APP_FRONT_URL || "";

function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function resolveImageUrl(product, field) {
  return localOrRemote(product, field);
}

function resolveImgsArr(product, field) {
  const val = localOrRemote(product, field);
  if (!val || !Array.isArray(val)) return [];
  return val.filter(Boolean);
}

function cleanHTML(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  temp.querySelectorAll("*").forEach(el => el.removeAttribute("style"));
  return temp.innerHTML;
}

function productUrl(p) {
  const base = FRONT_URL || window.location.origin;
  return isAccessoryProduct(p) ? `${base}/accessories/${p.slug}` : `${base}/products/${p.slug}`;
}

function isUnpublished(p) {
  return p?.status !== "published" || p?.visible === false;
}

// ─── Quick Preview Modal ─────────────────────────────────────────────────
// Lighter than Products.jsx's own ProductPreviewModal (no video/variant-
// color interactivity — that's the full editor's job), but same idea: a
// read-only look at the product plus Visit URL + Edit, so browsing
// Taxonomy/Models doesn't force a trip to the live site just to check a
// product's details.
function QuickPreviewModal({ product, onClose, onEdit }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const thumb = resolveImageUrl(product, "thumbnail");
  const gallery = resolveImgsArr(product, "images");
  const variantColors = (product.variants || []).filter(v => v.color || v.code);
  const variantImages = variantColors
    .map(v => (v.image || null))
    .filter(Boolean);
  const all = [...new Set([...(thumb ? [thumb] : []), ...gallery, ...variantImages])].filter(Boolean);

  const hasShortDesc = !!product.short_description;
  const hasDesc = !!product.description;
  const hasFeatures = (product.features || []).length > 0;
  const hasVariantColors = variantColors.length > 0;
  const cats = product.categories || [];
  const tags = product.tags || [];
  const hasMeta = cats.length > 0 || tags.length > 0;
  const specHeaders = product.spec_table?.headers || [];
  const specRows = product.spec_table?.rows || [];
  const hasSpecTable = specHeaders.length > 0 && specRows.length > 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 10003, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px 60px" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes pgmPreviewFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pgm-preview-modal { animation: pgmPreviewFade 0.2s ease; }
        @media(max-width:720px) { .pgm-preview-s1 { grid-template-columns: 1fr !important; gap: 20px !important; } }
      `}</style>

      <div
        className="pgm-preview-modal"
        style={{ background: "#fff", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.28)", width: "100%", maxWidth: 960, position: "relative", fontFamily: "'Montserrat',sans-serif", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#faf7f4", borderBottom: "1px solid #edddd0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <i className="fa-solid fa-eye" style={{ color: "#a67853", fontSize: "0.85rem", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8b5e3c", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div style={{ padding: "24px 28px 20px" }}>
          <div className="pgm-preview-s1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ position: "relative", aspectRatio: "1/1", width: "100%", overflow: "hidden", borderRadius: 14, background: "#faf7f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {all.length ? (
                  <img src={all[idx]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <i className="fa-regular fa-image" style={{ fontSize: "3rem", color: "#d5b99a" }} />
                )}
              </div>
              {all.length > 1 && (
                <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
                  {all.map((url, i) => (
                    <button key={i} onClick={() => setIdx(i)} style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: `2px solid ${i === idx ? "#a67853" : "#edddd0"}`, background: "#faf7f4", cursor: "pointer", padding: 0 }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(product.brand || product.type) && (
                <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a67853", margin: 0 }}>
                  {[product.brand, product.type].filter(Boolean).join(" · ")}
                </p>
              )}
              <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: "clamp(1.05rem,2vw,1.4rem)", color: "#2c1a0e", margin: 0, lineHeight: 1.2 }}>
                {product.name}
              </h2>
              {hasVariantColors && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "#faf7f4", borderRadius: 10, border: "1px solid #edddd0" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {variantColors.map((v, i) => {
                      const vImg = v.image || null;
                      const active = vImg && vImg === all[idx];
                      return (
                        <button key={i} type="button" title={v.color}
                          onClick={() => {
                            if (!vImg) return;
                            const target = all.indexOf(vImg);
                            if (target !== -1) setIdx(target);
                          }}
                          style={{
                            width: 22, height: 22, borderRadius: "50%", padding: 0,
                            cursor: vImg ? "pointer" : "default",
                            background: VARIANT_COLOR_DOT[(v.color || "").toLowerCase()] || "#d5b99a",
                            border: (v.color || "").toLowerCase() === "white" ? "1px solid #d5b99a" : "1px solid rgba(0,0,0,0.1)",
                            boxShadow: "0 1px 3px rgba(90,64,48,0.18)",
                            outline: active ? "2px solid #a67853" : "2px solid transparent",
                            outlineOffset: 2,
                          }} />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: "0.72rem" }}>
                    <span style={{ color: "#a67853", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 46 }}>Code</span>
                    <span style={{ color: "#5a4030" }}>{variantColors.map(v => v.code).filter(Boolean).join(" | ")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: "0.72rem" }}>
                    <span style={{ color: "#a67853", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 46 }}>Option</span>
                    <span style={{ color: "#5a4030" }}>{variantColors.map(v => v.color).filter(Boolean).join(" | ")}</span>
                  </div>
                </div>
              )}
              {hasShortDesc && (
                <div style={{ fontSize: "0.82rem", color: "#7a5c45", lineHeight: 1.6, whiteSpace: "pre-wrap", wordWrap: "break-word" }} dangerouslySetInnerHTML={{ __html: cleanHTML(product.short_description) }} />
              )}
              {hasFeatures && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                  {product.features.map((f, i) => (
                    <li key={i} style={{ color: "#5a4030", fontSize: "0.78rem", lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: 7 }}>
                      <i className="fa-solid fa-check" style={{ color: "#a67853", fontSize: "0.68rem", marginTop: 4, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {hasDesc && (
          <>
            <div style={{ height: 1, background: "linear-gradient(to right,transparent,#edddd0,transparent)", margin: "0 28px" }} />
            <div style={{ padding: "18px 28px", color: "#5a4030", lineHeight: 1.7, fontSize: "0.82rem", whiteSpace: "pre-wrap", wordWrap: "break-word" }} dangerouslySetInnerHTML={{ __html: cleanHTML(product.description) }} />
          </>
        )}

        {hasSpecTable && (
          <>
            <div style={{ height: 1, background: "linear-gradient(to right,transparent,#edddd0,transparent)", margin: "0 28px" }} />
            <div style={{ padding: "18px 28px" }}>
              <h4 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#8b5e3c", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Technical Data</h4>
              <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #d5b99a", background: "#fafaf8" }}>
                <table style={{ width: "100%", minWidth: Math.max(360, specHeaders.length * 160), borderCollapse: "collapse", fontFamily: "'Montserrat',sans-serif", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "#faf7f4" }}>
                      {specHeaders.map((h, i) => (
                        <th key={i} style={{ padding: "9px 14px", textAlign: "left", color: "#8b5e3c", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid #edddd0", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {specRows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: ri < specRows.length - 1 ? "1px solid #f5ede3" : "none" }}>
                        {specHeaders.map((h, ci) => (
                          <td key={ci} style={{ padding: "8px 14px", color: "#5a4030", fontSize: "0.8rem" }}>{row[ci] || "–"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {hasMeta && (
          <>
            <div style={{ height: 1, background: "linear-gradient(to right,transparent,#edddd0,transparent)", margin: "0 28px" }} />
            <div style={{ padding: "18px 28px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cats.map(c => (
                <span key={c} style={{ padding: "4px 12px", background: "rgba(166,120,83,0.12)", color: "#7a5234", borderRadius: 20, fontSize: "0.73rem", fontWeight: 600, border: "1px solid rgba(166,120,83,0.25)" }}>{c}</span>
              ))}
              {tags.map(t => (
                <span key={t} style={{ padding: "3px 10px", background: "rgba(139,94,60,0.08)", color: "#6b4c30", borderRadius: 20, fontSize: "0.70rem", border: "1px solid rgba(139,94,60,0.18)" }}>{t}</span>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 28px", borderTop: "1px solid #edddd0", background: "#faf7f4" }}>
          <a href={productUrl(product)} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, color: "#7a5234", background: "transparent", border: "1px solid rgba(166,120,83,0.35)", borderRadius: 6, textDecoration: "none" }}>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.75rem" }} /> Visit URL
          </a>
          <button type="button" onClick={onEdit}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, color: "#fff", background: "#a67853", border: "none", borderRadius: 6, cursor: "pointer" }}>
            <i className="fa-solid fa-pen" style={{ fontSize: "0.75rem" }} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsGridModal({ open, onClose, title, products, loading, emptyMessage }) {
  const [previewProduct, setPreviewProduct] = useState(null);
  const navigate = useNavigate();

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
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreviewProduct(p)}
                  className="products-grid-modal-card"
                  title={`View "${p.name}" details`}
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
                </button>
              ))}
            </div>
          )}
          <div className="modal-footer" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {previewProduct && (
        <QuickPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onEdit={() => navigate(`/admin/products?edit=${previewProduct.id}`)}
        />
      )}
    </div>
  );
}
