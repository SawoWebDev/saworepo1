// src/Administrator/Models.jsx
//
// Models page — displays all products grouped by their "type" field, as a
// grid of folder cards (same visual language as Taxonomy). Clicking a
// folder opens ProductsGridModal (shared with Taxonomy) to show its
// products, rather than expanding in place — the grid never restructures.
//
import React, { useState } from "react";
import { useLocalProducts } from "./Local/useLocalProducts";
import ProductsGridModal from "./ProductsGridModal";

// ─── Model Group card ──────────────────────────────────────────────────────
function ModelGroup({ modelName, products, onOpen }) {
  return (
    <div className="model-grid-card">
      <button type="button" className="model-card-header" onClick={onOpen}>
        <div className="model-card-icon">
          <i className="fa-solid fa-folder" />
        </div>
        <div className="model-card-name">{modelName || "Uncategorized"}</div>
        <div className="model-card-meta">
          <span><i className="fa-solid fa-box" style={{ fontSize: "0.7rem", marginRight: 5 }} />{products.length} Product{products.length !== 1 ? "s" : ""}</span>
        </div>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function Models() {
  // Sourced locally (bundled/GitHub snapshot, or Supabase only if the
  // site's Live Data Source setting is explicitly "supabase") instead of
  // always hitting Supabase live — grouping by model doesn't need
  // real-time accuracy, so there's no reason it should cost egress.
  const { products: rawProducts, loading, error } = useLocalProducts();
  const [search, setSearch]       = useState("");
  const [openModel, setOpenModel] = useState(null);

  const products = [...rawProducts].sort((a, b) => {
    const typeCompare = (a.type || "").localeCompare(b.type || "");
    if (typeCompare !== 0) return typeCompare;
    return (a.name || "").localeCompare(b.name || "");
  });

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

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="products-page">
      <p className="products-subtitle" style={{ marginBottom: 14 }}>
        {loading ? "Loading…" : `${filteredGroups.length} model${filteredGroups.length !== 1 ? "s" : ""} · ${products.length} product${products.length !== 1 ? "s" : ""}`}
      </p>

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
        <div className="model-grid">
          {filteredGroups.map(([modelName, modelProducts]) => (
            <ModelGroup
              key={modelName}
              modelName={modelName}
              products={modelProducts}
              onOpen={() => setOpenModel(modelName)}
            />
          ))}
        </div>
      )}

      {/* Products-in-model modal — shared with Taxonomy's category/tag view */}
      <ProductsGridModal
        open={!!openModel}
        onClose={() => setOpenModel(null)}
        title={openModel || ""}
        products={openModel ? (groups[openModel] || []) : []}
        loading={false}
      />
    </div>
  );
}
