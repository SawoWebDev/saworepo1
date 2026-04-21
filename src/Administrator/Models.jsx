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

// ─── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status, visible, featured }) {
  const colors = {
    published: { label: "Published", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    draft:     { label: "Draft",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  };
  const cfg = colors[status] || { label: status, color: "var(--text-2)", bg: "var(--surface-2)" };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap",
    }}>
      <span style={{
        padding: "2px 8px", borderRadius: 12, fontSize: "0.65rem", fontWeight: 700,
        color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40`,
      }}>
        {cfg.label}
      </span>
      {!visible && (
        <span style={{
          padding: "2px 8px", borderRadius: 12, fontSize: "0.65rem", fontWeight: 700,
          color: "#9ca3af", background: "rgba(156,163,175,0.1)", border: "1px solid rgba(156,163,175,0.3)",
        }}>
          Hidden
        </span>
      )}
      {featured && (
        <i className="fa-solid fa-star" style={{ fontSize: "0.75rem", color: "#f59e0b" }} title="Featured" />
      )}
    </div>
  );
}

// ─── Product Card (within a model group) ──────────────────────────────────
function ProductCard({ product }) {
  const FRONT_URL = process.env.REACT_APP_FRONT_URL || "";
  const productUrl = `${FRONT_URL || window.location.origin}/products/${product.slug}`;

  return (
    <a
      href={productUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", flexDirection: "column", gap: 8,
        padding: "12px", borderRadius: "var(--r)", background: "var(--surface)",
        border: "1px solid var(--border)", textDecoration: "none",
        cursor: "pointer", transition: "all 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--surface-2)";
        e.currentTarget.style.borderColor = "var(--brand)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "var(--surface)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: "100%", aspectRatio: "1", background: "var(--surface-2)",
        borderRadius: "var(--r-sm)", overflow: "hidden", display: "flex",
        alignItems: "center", justifyContent: "center",
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
            }}
          />
        ) : (
          <i className="fa-solid fa-image" style={{ fontSize: "1.5rem", color: "var(--text-3)" }} />
        )}
      </div>

      {/* Product Name */}
      <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text)", lineHeight: 1.3 }}>
        {product.name}
      </div>

      {/* Status + Badges */}
      <StatusBadge status={product.status} visible={product.visible} featured={product.featured} />
    </a>
  );
}

// ─── Model Group (folder section) ─────────────────────────────────────────
function ModelGroup({ modelName, products, expanded, onToggle }) {
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

      {/* Expanded Content */}
      {expanded && (
        <div style={{
          padding: "16px", borderTop: "1px solid var(--border)",
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 12,
        }}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
