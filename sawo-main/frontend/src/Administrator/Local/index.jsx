import React, { useState, useMemo } from "react";
import { useLocalProducts } from "./useLocalProducts";
import { ProductModal } from "./ProductModal";
import "./LocalProductsPage.css";

export default function LocalProductsPage() {
  const { products, categories, tags, meta, loading, error } = useLocalProducts();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    featured: "",
    visible: "",
  });

  // Filtering logic
  const filtered = useMemo(() => {
    return products.filter((product) => {
      // Search by name, slug, brand
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.slug.toLowerCase().includes(searchLower) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower));

      // Category filter
      let matchesCategory = true;
      if (filters.category) {
        const productCats = product.categories || [];
        matchesCategory = productCats.some((cat) => {
          const catId = typeof cat === "string" ? cat : cat.id;
          return catId === filters.category;
        });
      }

      // Status filter
      const matchesStatus = !filters.status || product.status === filters.status;

      // Featured filter
      const matchesFeatured =
        filters.featured === "" ||
        String(product.featured) === String(filters.featured === "yes");

      // Visible filter
      const matchesVisible =
        filters.visible === "" ||
        String(product.visible) === String(filters.visible === "yes");

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesFeatured &&
        matchesVisible
      );
    });
  }, [products, searchTerm, filters]);

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--text-3)",
        }}
      >
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          background: "var(--danger-bg)",
          color: "var(--danger)",
          borderRadius: "var(--r)",
          margin: "2rem",
        }}
      >
        Error loading products: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", flex: 1, overflow: "auto" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "var(--info-bg)",
          color: "var(--info)",
          padding: "1rem",
          borderRadius: "var(--r)",
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
          fontWeight: 500,
        }}
      >
        📦 Last synced: <strong>{meta.last_synced}</strong> | ✅ Total products:{" "}
        <strong>{meta.total_products}</strong>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search by name, slug, or brand..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            fontSize: "0.9rem",
            background: "var(--surface)",
            color: "var(--text)",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Category Filter */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.25rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.85rem",
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

        {/* Status Filter */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.25rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Featured Filter */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>
            Featured
          </label>
          <select
            value={filters.featured}
            onChange={(e) => setFilters({ ...filters, featured: e.target.value })}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.25rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <option value="">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Visible Filter */}
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>
            Visible
          </label>
          <select
            value={filters.visible}
            onChange={(e) => setFilters({ ...filters, visible: e.target.value })}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.25rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <option value="">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div
        style={{
          overflowX: "auto",
          background: "var(--surface)",
          borderRadius: "var(--r)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Thumb
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Name
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Slug
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Brand
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Type
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Status
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Visible
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Featured
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Categories
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: 600, color: "var(--text-2)" }}>
                Updated At
              </th>
              <th style={{ padding: "0.75rem", textAlign: "center", fontWeight: 600, color: "var(--text-2)" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan="11"
                  style={{
                    padding: "1.5rem",
                    textAlign: "center",
                    color: "var(--text-3)",
                  }}
                >
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background var(--t)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.75rem" }}>
                    {product.thumbnail && (
                      <img
                        src={
                          product.thumbnail.includes("://")
                            ? product.thumbnail
                            : `https://cdn.jsdelivr.net/gh/jmesrafael/saworepo2@main/${product.thumbnail}`
                        }
                        alt={product.name}
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
                  <td style={{ padding: "0.75rem" }}>{product.name}</td>
                  <td style={{ padding: "0.75rem", color: "var(--text-2)" }}>
                    <code style={{ fontSize: "0.8rem" }}>{product.slug}</code>
                  </td>
                  <td style={{ padding: "0.75rem" }}>{product.brand || "—"}</td>
                  <td style={{ padding: "0.75rem" }}>{product.type || "—"}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "var(--r-sm)",
                        background:
                          product.status === "published"
                            ? "var(--success-bg)"
                            : "var(--warning-bg)",
                        color:
                          product.status === "published"
                            ? "var(--success)"
                            : "var(--warning)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {product.status || "draft"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {product.visible ? "✓" : "✗"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {product.featured ? "⭐" : "—"}
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                    {product.categories && product.categories.length > 0
                      ? product.categories
                          .map((cat) =>
                            typeof cat === "string" ? cat : cat.name
                          )
                          .join(", ")
                      : "—"}
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.8rem", color: "var(--text-2)" }}>
                    {product.updated_at
                      ? new Date(product.updated_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        background: "var(--brand)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "var(--r-sm)",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        transition: "background var(--t)",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "var(--brand-dark)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "var(--brand)")
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div
        style={{
          marginTop: "1rem",
          fontSize: "0.9rem",
          color: "var(--text-2)",
        }}
      >
        Showing {filtered.length} of {products.length} products
      </div>

      {/* Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          categories={categories}
          tags={tags}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
