// src/Administrator/Models.jsx
//
// Models page — displays all products grouped by their "type" field,
// with folder-style collapsible sections. Click a model folder to expand
// and see all products within that model.
//
import React, { useEffect, useState } from "react";
import { getAllProductsLive } from "../local-storage/supabaseReader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

// ─── Product Card (floating style with just image + name) ────────────────────
function ProductCard({ product, onClick }) {
  return (
    <div
      onClick={() => onClick?.(product)}
      style={{
        display: "flex", flexDirection: "column", gap: 8,
        cursor: "pointer", transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = "0.85";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Thumbnail - Floating, no background */}
      <div style={{
        width: "100%", aspectRatio: "1",
        borderRadius: "var(--r-sm)", overflow: "hidden", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "transparent", border: "none",
      }}>
        {localOrRemote(product, 'thumbnail') ? (
          <img
            src={localOrRemote(product, 'thumbnail')}
            alt={product.name}
            width="300"
            height="300"
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "var(--r-sm)",
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--surface-2)", borderRadius: "var(--r-sm)",
          }}>
            <i className="fa-solid fa-image" style={{ fontSize: "1.5rem", color: "var(--text-3)" }} />
          </div>
        )}
      </div>

      {/* Product Name - Centered */}
      <div style={{
        fontWeight: 600, fontSize: "0.82rem", color: "var(--text)",
        lineHeight: 1.3, textAlign: "center",
      }}>
        {product.name}
      </div>
    </div>
  );
}

// ─── Model Group (folder section) ─────────────────────────────────────────
function ModelGroup({ modelName, products, expanded, onToggle, onProductClick }) {
  return (
    <div style={{
      borderRadius: "var(--r)", border: "1px solid var(--border)",
      overflow: "hidden", background: "var(--surface-2)",
      marginBottom: 12,
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%", padding: "14px 16px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          gap: 12, background: "var(--surface-2)", border: "none",
          cursor: "pointer", transition: "background 0.2s",
          fontSize: "0.95rem", fontWeight: 700, color: "var(--text)",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-3)"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--surface-2)"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className={`fa-solid fa-folder${expanded ? "-open" : ""}`}
            style={{ fontSize: "1rem", color: "var(--brand)" }} />
          <span>{modelName || "Uncategorized"}</span>
          <span style={{
            padding: "2px 8px", borderRadius: 12, fontSize: "0.7rem",
            background: "var(--brand)", color: "#fff", fontWeight: 700,
          }}>
            {products.length}
          </span>
        </div>
        <i className={`fa-solid fa-chevron-${expanded ? "up" : "down"}`}
          style={{ fontSize: "0.8rem", color: "var(--text-3)" }} />
      </button>

      {/* Expanded Content - Grid Layout */}
      {expanded && (
        <div style={{
          padding: "20px 16px", borderTop: "1px solid var(--border)",
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 16,
        }}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} onClick={onProductClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Detail Modal (Grid view) ─────────────────────────────────────
function ProductDetailModal({ open, onClose, product }) {
  if (!open || !product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{product.name}</h2>
          <button className="modal-close-btn" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 12,
          }}>
            {/* Main product card */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 8,
              gridColumn: "span 1",
            }}>
              <div style={{
                width: "100%", aspectRatio: "1",
                borderRadius: "var(--r-sm)", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {localOrRemote(product, 'thumbnail') ? (
                  <img
                    src={localOrRemote(product, 'thumbnail')}
                    alt={product.name}
                    style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      borderRadius: "var(--r-sm)",
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--surface-2)", borderRadius: "var(--r-sm)",
                  }}>
                    <i className="fa-solid fa-image" style={{ fontSize: "1.5rem", color: "var(--text-3)" }} />
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text)", textAlign: "center" }}>
                {product.name}
              </div>
            </div>

            {/* Gallery images if available */}
            {Array.isArray(localOrRemote(product, 'images')) && localOrRemote(product, 'images').map((img, idx) => (
              <div key={idx} style={{
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <div style={{
                  width: "100%", aspectRatio: "1",
                  borderRadius: "var(--r-sm)", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      borderRadius: "var(--r-sm)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Product Details */}
          <div style={{ marginTop: 24, padding: 16, background: "var(--surface-2)", borderRadius: "var(--r)", fontSize: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {product.slug && <div><strong>Slug:</strong> {product.slug}</div>}
              {product.status && <div><strong>Status:</strong> {product.status}</div>}
              {product.type && <div><strong>Model:</strong> {product.type}</div>}
              {product.visible !== undefined && <div><strong>Visible:</strong> {product.visible ? "Yes" : "No"}</div>}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function Models() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [expanded, setExpanded]   = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await getAllProductsLive();
      // Sort by type then by name
      data.sort((a, b) => {
        const typeCompare = (a.type || "").localeCompare(b.type || "");
        if (typeCompare !== 0) return typeCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
      setProducts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Group products by type
  const groups = {};
  for (const product of products) {
    const modelType = product.type || "Uncategorized";
    if (!groups[modelType]) groups[modelType] = [];
    groups[modelType].push(product);
  }

  // Filter groups by search term
  const filteredGroups = Object.entries(groups).filter(([modelName]) => {
    if (!search) return true;
    return modelName.toLowerCase().includes(search.toLowerCase());
  });

  const toggleExpanded = (modelName) => {
    const next = new Set(expanded);
    if (next.has(modelName)) {
      next.delete(modelName);
    } else {
      next.add(modelName);
    }
    setExpanded(next);
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="products-page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-folder-open" style={{ marginRight: "0.5rem", color: "var(--brand)" }} />
            Models
          </h1>
          <p className="products-subtitle">
            {loading ? "Loading…" : `${filteredGroups.length} model${filteredGroups.length !== 1 ? "s" : ""} · ${products.length} product${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={fetchProducts}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}
        >
          <i className="fa-solid fa-rotate" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="products-toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search models…"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: "12px 0", padding: "12px 16px",
          background: "var(--danger-bg, #fef2f2)",
          border: "1px solid var(--danger)",
          borderRadius: "var(--r)",
          fontSize: "0.82rem", color: "var(--danger)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <i className="fa-solid fa-triangle-exclamation" />
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="table-loading">
          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading models…
        </div>
      ) : filteredGroups.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px", color: "var(--text-3)",
          fontStyle: "italic", fontSize: "0.82rem",
        }}>
          {search ? "No models match your search." : "No products found. Create products in the Products page to see them grouped here."}
        </div>
      ) : (
        <div>
          {filteredGroups.map(([modelName, modelProducts]) => (
            <ModelGroup
              key={modelName}
              modelName={modelName}
              products={modelProducts}
              expanded={expanded.has(modelName)}
              onToggle={() => toggleExpanded(modelName)}
              onProductClick={setSelectedProduct}
            />
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
      />
    </div>
  );
}
