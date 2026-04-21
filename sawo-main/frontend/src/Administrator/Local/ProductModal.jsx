import React from "react";

const CDN_BASE = "https://raw.githubusercontent.com/jmesrafael/saworepo2/main/";

export function ProductModal({ product, onClose, categories, tags }) {
  if (!product) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getCategoryNames = () => {
    if (!product.categories || !Array.isArray(product.categories)) return [];
    return product.categories.map(cat => (typeof cat === 'string' ? cat : cat.name));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    // If it's already a full URL, return as-is
    if (imagePath.includes("://")) return imagePath;
    // Otherwise, build CDN URL (imagePath already includes "images/" prefix from sync)
    return CDN_BASE + imagePath;
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r)",
          maxWidth: "900px",
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
              padding: "0.25rem 0.5rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Left Column: Thumbnail & Basic Info */}
          <div>
            {product.thumbnail && (
              <img
                src={getImageUrl(product.thumbnail)}
                alt={product.name}
                style={{
                  width: "100%",
                  borderRadius: "var(--r)",
                  marginBottom: "1rem",
                  border: "1px solid var(--border)",
                }}
              />
            )}

            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Slug</label>
                <p style={{ margin: "0.25rem 0 0 0" }}>{product.slug}</p>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Brand</label>
                <p style={{ margin: "0.25rem 0 0 0" }}>{product.brand || "—"}</p>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Type</label>
                <p style={{ margin: "0.25rem 0 0 0" }}>{product.type || "—"}</p>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Status</label>
                <p style={{ margin: "0.25rem 0 0 0" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "var(--r-sm)",
                    background: product.status === "published" ? "var(--success-bg)" : "var(--warning-bg)",
                    color: product.status === "published" ? "var(--success)" : "var(--warning)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}>
                    {product.status || "draft"}
                  </span>
                </p>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Visible</label>
                <p style={{ margin: "0.25rem 0 0 0" }}>
                  {product.visible ? "✓ Yes" : "✗ No"}
                </p>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Featured</label>
                <p style={{ margin: "0.25rem 0 0 0" }}>
                  {product.featured ? "⭐ Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div>
            {product.short_description && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Short Description</label>
                <p style={{ margin: "0.5rem 0 0 0", lineHeight: 1.6 }}>{product.short_description}</p>
              </div>
            )}

            {product.description && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Description</label>
                <div
                  style={{
                    margin: "0.5rem 0 0 0",
                    padding: "0.75rem",
                    background: "var(--surface-2)",
                    borderRadius: "var(--r-sm)",
                    maxHeight: "150px",
                    overflow: "auto",
                    fontSize: "0.9rem",
                  }}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {getCategoryNames().length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Categories</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {getCategoryNames().map((cat, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "0.4rem 0.8rem",
                        background: "var(--brand-muted)",
                        color: "var(--brand-dark)",
                        borderRadius: "var(--r-sm)",
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
                <label style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600 }}>Tags</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {product.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "0.3rem 0.6rem",
                        background: "var(--info-bg)",
                        color: "var(--info)",
                        borderRadius: "var(--r-sm)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {typeof tag === "string" ? tag : tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        {product.images && product.images.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", marginTop: 0 }}>Image Gallery</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt={`Gallery ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--border)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Spec Images */}
        {product.spec_images && product.spec_images.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", marginTop: 0 }}>Specification Images</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
              {product.spec_images.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt={`Spec ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--border)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", marginTop: 0 }}>Features</h3>
            <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
              {product.features.map((feature, i) => (
                <li key={i} style={{ marginBottom: "0.5rem" }}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Specs Table */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", marginTop: 0 }}>Specifications</h3>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}>
              <tbody>
                {Object.entries(product.specs).map(([key, value], i) => (
                  <tr key={i}>
                    <td style={{
                      padding: "0.75rem",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 600,
                      width: "30%",
                      color: "var(--text-2)",
                    }}>
                      {key}
                    </td>
                    <td style={{
                      padding: "0.75rem",
                      borderBottom: "1px solid var(--border)",
                    }}>
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Files */}
        {product.files && product.files.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", marginTop: 0 }}>Files & Resources</h3>
            <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
              {product.files.map((file, i) => {
                const filename = typeof file === "string" ? file : (file.name || file.path);
                const filepath = typeof file === "string" ? file : file.path;
                const url = CDN_BASE + filepath;
                return (
                  <li key={i} style={{ marginBottom: "0.5rem" }}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--brand)", textDecoration: "none" }}
                      onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                      onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                    >
                      📄 {filename}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            background: "var(--surface-2)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              fontWeight: 500,
              color: "var(--text)",
              fontSize: "0.9rem",
              transition: "background var(--t), border-color var(--t)",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "var(--surface-2)";
              e.target.style.borderColor = "var(--border-light)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "var(--surface)";
              e.target.style.borderColor = "var(--border)";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
