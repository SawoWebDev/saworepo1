import React, { useState, useMemo } from "react";
import { useLocalProducts } from "./useLocalProducts";
import { ProductDetailView } from "./ProductDetailView";
import "../admin.css";

export default function LocalProductsPage() {
  const { products, categories, tags, meta, loading, error } = useLocalProducts();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Filtering logic
  const filtered = useMemo(() => {
    return products.filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.slug.toLowerCase().includes(searchLower) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower));

      const matchesStatus = !filterStatus || product.status === filterStatus;

      let matchesCategory = true;
      if (filterCategory) {
        const productCats = product.categories || [];
        matchesCategory = productCats.some((cat) => {
          const catId = typeof cat === "string" ? cat : cat.id;
          return catId === filterCategory;
        });
      }

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchTerm, filterStatus, filterCategory]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-3)" }}>
        <p>Loading local products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "1.5rem",
          background: "var(--danger-bg)",
          color: "var(--danger)",
          borderRadius: "var(--r)",
          border: "1px solid var(--danger)",
        }}
      >
        <strong>Error loading products:</strong> {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 1rem 0", fontSize: "1.8rem", fontWeight: 600 }}>Local Products</h1>
        <div
          style={{
            background: "var(--info-bg)",
            color: "var(--info)",
            padding: "0.9rem 1.25rem",
            borderRadius: "var(--r)",
            fontSize: "0.9rem",
            fontWeight: 500,
            border: "1px solid rgba(26,111,168,0.2)",
          }}
        >
          📦 Last synced: <strong>{meta?.last_synced || "Never"}</strong> | ✅ Total: <strong>{meta?.total_products || products.length}</strong> products
        </div>
      </div>

      {/* Search & Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
          alignItems: "flex-end",
        }}
      >
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>
            Search
          </label>
          <input
            type="text"
            placeholder="Name, slug, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              fontSize: "0.9rem",
              background: "var(--surface)",
              color: "var(--text)",
              fontFamily: "var(--font)",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              fontSize: "0.9rem",
              background: "var(--surface)",
              color: "var(--text)",
              fontFamily: "var(--font)",
              cursor: "pointer",
            }}
          >
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>
            Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              fontSize: "0.9rem",
              background: "var(--surface)",
              color: "var(--text)",
              fontFamily: "var(--font)",
              cursor: "pointer",
            }}
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Results</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--brand)", marginTop: "0.35rem" }}>
            {filtered.length}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-3)" }}>
            <p style={{ fontSize: "1rem", margin: 0 }}>No products found</p>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)", width: "50px" }}>
                  Thumb
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                  Name
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                  Brand
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                  Type
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                  Status
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                  Visible
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: 600, color: "var(--text-2)" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background var(--t)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.75rem 1rem", verticalAlign: "middle" }}>
                    {product.thumbnail && (
                      <img
                        src={
                          product.thumbnail.includes("://")
                            ? product.thumbnail
                            : `https://raw.githubusercontent.com/jmesrafael/saworepo2/main/${product.thumbnail}`
                        }
                        alt={product.name}
                        onError={(e) => { e.target.style.display = "none"; }}
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          borderRadius: "var(--r-sm)",
                          border: "1px solid var(--border)",
                        }}
                      />
                    )}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 500, color: "var(--text)" }}>
                    {product.name}
                  </td>
                  <td style={{ padding: "1rem", color: "var(--text-2)", fontSize: "0.9rem" }}>
                    {product.brand}
                  </td>
                  <td style={{ padding: "1rem", color: "var(--text-2)", fontSize: "0.9rem" }}>
                    {product.type}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background: product.status === "published" ? "var(--success-bg)" : "var(--warning-bg)",
                        color: product.status === "published" ? "var(--success)" : "var(--warning)",
                      }}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center", fontSize: "0.9rem", color: "var(--text-2)" }}>
                    {product.visible ? "✓" : "—"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--brand)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        padding: "0.4rem 0.8rem",
                        borderRadius: "4px",
                        transition: "all var(--t)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--brand-muted)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail View Modal */}
      <ProductDetailView product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
