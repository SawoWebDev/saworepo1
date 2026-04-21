import React from "react";

const CDN_BASE = "https://raw.githubusercontent.com/jmesrafael/saworepo2/main/";

export function ProductDetailView({ product, onClose }) {
  if (!product) return null;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.includes("://")) return imagePath;
    return CDN_BASE + imagePath;
  };

  const getCategoryNames = () => {
    if (!product.categories || !Array.isArray(product.categories)) return [];
    return product.categories.map(cat => (typeof cat === 'string' ? cat : cat.name));
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r)",
          maxWidth: "1000px",
          maxHeight: "90vh",
          overflow: "auto",
          width: "100%",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.5rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-2)",
            position: "sticky",
            top: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>{product.name}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--text-3)",
              padding: "0",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Left Column: Images & Basic Info */}
          <div>
            {product.thumbnail && (
              <img
                src={getImageUrl(product.thumbnail)}
                alt={product.name}
                onError={(e) => { e.target.style.display = "none"; }}
                style={{
                  width: "100%",
                  borderRadius: "var(--r)",
                  marginBottom: "1rem",
                  border: "1px solid var(--border)",
                }}
              />
            )}

            {/* Basic Info */}
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Slug</label>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>{product.slug}</p>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Brand</label>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>{product.brand}</p>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Type</label>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>{product.type}</p>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Status</label>
                <div style={{ marginTop: "0.25rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: product.status === "published" ? "var(--success-bg)" : "var(--warning-bg)",
                      color: product.status === "published" ? "var(--success)" : "var(--warning)",
                    }}
                  >
                    {product.status}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Visible</label>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>{product.visible ? "Yes" : "No"}</p>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Featured</label>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>{product.featured ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Description & Details */}
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {product.short_description && (
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Short Description</label>
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "var(--text-2)",
                  }}
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
              </div>
            )}

            {product.description && (
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Description</label>
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "var(--text-2)",
                    maxHeight: "300px",
                    overflow: "auto",
                  }}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {product.categories && product.categories.length > 0 && (
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Categories</label>
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {getCategoryNames().map((cat) => (
                    <span
                      key={cat}
                      style={{
                        padding: "0.35rem 0.65rem",
                        background: "var(--brand-muted)",
                        color: "var(--brand-dark)",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Tags</label>
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "0.25rem 0.6rem",
                        background: "var(--surface-2)",
                        color: "var(--text-2)",
                        borderRadius: "3px",
                        fontSize: "0.75rem",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>Features</label>
                <ul
                  style={{
                    marginTop: "0.5rem",
                    paddingLeft: "1.25rem",
                    fontSize: "0.9rem",
                    color: "var(--text-2)",
                    listStyle: "disc",
                  }}
                >
                  {product.features.map((feature, i) => (
                    <li key={i} style={{ marginBottom: "0.35rem" }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Additional Images */}
        {product.images && product.images.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 600 }}>Product Images</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
              {product.images.map((imgPath, i) => (
                <img
                  key={i}
                  src={getImageUrl(imgPath)}
                  alt={`Product ${i + 1}`}
                  onError={(e) => { e.target.style.display = "none"; }}
                  style={{
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
