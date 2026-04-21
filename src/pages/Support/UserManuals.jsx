// src/pages/Support/UserManuals.jsx

import React, { useState, useEffect, useMemo } from "react";
import { getVisibleProductsCached } from "../../local-storage/supabaseReader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

// ─── PDF Modal ────────────────────────────────────────────────────────────────
function PdfModal({ product, onClose }) {
  const files = (product.files || []).filter(f => f?.url);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(20,10,4,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
        animation: "umFadeIn 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 18,
          width: "100%",
          maxWidth: 520,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(44,26,14,0.28)",
          animation: "umSlideUp 0.25s ease",
        }}
      >
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid #edddd0",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: "linear-gradient(135deg,#8b5e3c,#a67853)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <i className="fa-solid fa-book-open" style={{ color: "#fff", fontSize: "0.9rem" }} />
            </div>
            <div>
              <p style={{
                fontFamily: "'Montserrat',sans-serif", fontSize: "0.6rem",
                fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "#a67853", margin: 0,
              }}>
                User Manuals
              </p>
              <h3 style={{
                fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
                fontSize: "0.95rem", color: "#2c1a0e", margin: 0, lineHeight: 1.3,
              }}>
                {product.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(139,94,60,0.08)", border: "none", borderRadius: "50%",
              width: 36, height: 36, cursor: "pointer", color: "#8b5e3c",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.9rem", transition: "background 0.2s", flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(139,94,60,0.16)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(139,94,60,0.08)"}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* File list */}
        <div style={{ overflowY: "auto", padding: "18px 24px 24px", flex: 1 }}>
          {files.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "40px 0", gap: 12,
              fontFamily: "'Montserrat',sans-serif",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#faf7f4", border: "1px dashed #e0cfc0",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className="fa-regular fa-folder-open" style={{ fontSize: "1.4rem", color: "#ddc9b4" }} />
              </div>
              <p style={{ color: "#a67853", margin: 0, fontSize: "0.84rem", fontStyle: "italic" }}>
                No manuals available for this product yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {files.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px",
                    background: "#faf7f4", borderRadius: 10, border: "1px solid #edddd0",
                    color: "#2c1a0e", textDecoration: "none",
                    fontFamily: "'Montserrat',sans-serif",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#f5ede3";
                    e.currentTarget.style.borderColor = "#d4b896";
                    e.currentTarget.style.transform = "translateX(3px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "#faf7f4";
                    e.currentTarget.style.borderColor = "#edddd0";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 9, flexShrink: 0,
                    background: "linear-gradient(135deg,#8b5e3c,#a67853)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <i className="fa-solid fa-file-pdf" style={{ color: "#fff", fontSize: "1rem" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: "0.82rem", color: "#2c1a0e",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {f.name || `Manual ${i + 1}`}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#a67853", marginTop: 2 }}>
                      PDF · Click to open
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: "#a67853", fontSize: "0.7rem", flexShrink: 0 }} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid #edddd0", overflow: "hidden",
    }}>
      <div style={{
        aspectRatio: "1/1",
        background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
        backgroundSize: "200% 100%",
        animation: "umShimmer 1.4s infinite",
      }} />
      <div style={{ padding: "14px 16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          height: 10, width: "40%", borderRadius: 4,
          background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
          backgroundSize: "200% 100%", animation: "umShimmer 1.4s infinite",
        }} />
        <div style={{
          height: 13, width: "75%", borderRadius: 4,
          background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
          backgroundSize: "200% 100%", animation: "umShimmer 1.4s infinite",
        }} />
        <div style={{
          height: 13, width: "55%", borderRadius: 4,
          background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
          backgroundSize: "200% 100%", animation: "umShimmer 1.4s infinite",
        }} />
        <div style={{
          height: 34, borderRadius: 8, marginTop: 6,
          background: "linear-gradient(90deg,#f5ede3 25%,#fdf8f4 50%,#f5ede3 75%)",
          backgroundSize: "200% 100%", animation: "umShimmer 1.4s infinite",
        }} />
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onOpenManuals }) {
  const fileCount = (product.files || []).filter(f => f?.url).length;

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1.5px solid rgba(175,133,100,0.18)",
      overflow: "hidden", display: "flex", flexDirection: "column",
      transition: "all 0.22s", textAlign: "center",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#af8564";
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 14px 36px rgba(175,133,100,0.18)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(175,133,100,0.18)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Image */}
      <div style={{
        aspectRatio: "4/3", background: "#f7f5f2",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 8, position: "relative", overflow: "hidden",
      }}>
        {localOrRemote(product, 'thumbnail') ? (
          <img
            src={localOrRemote(product, 'thumbnail')}
            alt={product.name}
            onError={e => { e.currentTarget.style.display = "none"; }}
            style={{
              width: "100%", height: "100%",
              objectFit: "contain", objectPosition: "center",
              display: "block",
              transition: "transform 0.35s ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          />
        ) : (
          <i className="fa-regular fa-image" style={{ fontSize: "3rem", color: "#d5b99a" }} />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{
          fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
          fontSize: "13px", color: "rgb(51,51,51)", margin: 0, lineHeight: 1.35,
          transition: "color 0.2s",
        }}>
          {product.name}
        </p>

        {/* User Manuals button */}
        <div>
          <button
            onClick={() => onOpenManuals(product)}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "9px 16px",
              background: fileCount > 0
                ? "linear-gradient(135deg,#8b5e3c,#b08560)"
                : "transparent",
              color: fileCount > 0 ? "#fff" : "#af8564",
              border: fileCount > 0 ? "none" : "1.5px solid rgba(175,133,100,0.3)",
              borderRadius: 8, cursor: "pointer",
              fontFamily: "'Montserrat',sans-serif",
              fontSize: "0.72rem", fontWeight: 700,
              letterSpacing: "0.04em",
              transition: "all 0.22s",
            }}
            onMouseEnter={e => {
              if (fileCount > 0) {
                e.currentTarget.style.opacity = "0.88";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(139,94,60,0.28)";
              } else {
                e.currentTarget.style.background = "rgba(175,133,100,0.06)";
                e.currentTarget.style.borderColor = "#af8564";
              }
            }}
            onMouseLeave={e => {
              if (fileCount > 0) {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              } else {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(175,133,100,0.3)";
              }
            }}
          >
            <i className="fa-solid fa-book-open" style={{ fontSize: "0.7rem" }} />
            User Manuals
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserManuals() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        let data = await getVisibleProductsCached();
        // Sort by sort_order first, then by created_at descending
        data.sort((a, b) => {
          const sortA = a.sort_order ?? 999;
          const sortB = b.sort_order ?? 999;
          if (sortA !== sortB) return sortA - sortB;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setAllProducts(data);
      } catch (err) {
        console.error("UserManuals: fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.short_description?.toLowerCase().includes(q) ||
      (p.categories || []).some(c => c.toLowerCase().includes(q))
    );
  }, [allProducts, search]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Montserrat',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;800&display=swap');
        @keyframes umFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes umSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes umShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .um-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1.5px solid #e0cfc0;
          border-radius: 40px;
          padding: 10px 20px;
          box-shadow: 0 2px 12px rgba(139,94,60,0.06);
          transition: border-color 0.2s, box-shadow 0.2s;
          max-width: 400px;
          width: 100%;
        }
        .um-search-wrap:focus-within {
          border-color: #a67853;
          box-shadow: 0 2px 18px rgba(139,94,60,0.12);
        }
        .um-search-input {
          border: none; outline: none; background: transparent;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.84rem; color: #2c1a0e; width: 100%;
        }
        .um-search-input::placeholder { color: #c4a882; }
        .um-search-clear {
          background: none; border: none; cursor: pointer;
          color: #c4a882; font-size: 0.75rem; padding: 0;
          line-height: 1; flex-shrink: 0; transition: color 0.15s;
        }
        .um-search-clear:hover { color: #8b5e3c; }

        @media (max-width: 900px) {
          .um-header-row { flex-direction: column !important; align-items: flex-start !important; }
        }
        @media (max-width: 600px) {
          .um-outer { padding: 80px 20px 60px !important; }
          .um-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 16px !important; }
        }
      `}</style>

      {selectedProduct && (
        <PdfModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* ── Intro ─────────────────────────────────────────────────────── */}
      <div style={{
        color: "rgb(51,51,51)",
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "140px 40px 40px",
        textAlign: "center",
      }}>
        <h2 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "32px",
          fontWeight: 700,
          fontStyle: "normal",
          color: "rgb(175,133,100)",
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}>
          User Manuals
        </h2>
        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "20px",
          fontWeight: 400,
          fontStyle: "normal",
          color: "rgb(51,51,51)",
          lineHeight: 1.55,
          maxWidth: 800,
          margin: "0 auto",
        }}>
          Find installation guides, operating manuals, and technical documentation for all SAWO products.
        </p>
      </div>

      {/* ── Main body ─────────────────────────────────────────────────────── */}
      <div
        className="um-outer"
        style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px 80px" }}
      >
        {/* Search bar */}
        {!loading && allProducts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
            <div className="um-search-wrap">
              <i className="fa-solid fa-magnifying-glass" style={{ color: "#a67853", fontSize: "0.82rem", flexShrink: 0 }} />
              <input
                className="um-search-input"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
              />
              {search && (
                <button className="um-search-clear" onClick={() => setSearch("")} title="Clear">
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div
            className="um-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && allProducts.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "80px 0",
            fontFamily: "'Montserrat',sans-serif", textAlign: "center", gap: 14,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#faf7f4", border: "1px dashed #e0cfc0",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="fa-regular fa-folder-open" style={{ fontSize: "1.6rem", color: "#ddc9b4" }} />
            </div>
            <p style={{ color: "#a67853", margin: 0, fontSize: "0.88rem", fontStyle: "italic" }}>
              No products available.
            </p>
          </div>
        )}

        {/* No search results */}
        {!loading && allProducts.length > 0 && displayed.length === 0 && search && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "64px 0",
            fontFamily: "'Montserrat',sans-serif", textAlign: "center", gap: 12,
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "1.8rem", color: "#ddc9b4" }} />
            <p style={{ color: "#a67853", margin: 0, fontSize: "0.88rem" }}>
              No products match "<strong>{search}</strong>"
            </p>
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#8b5e3c", fontFamily: "'Montserrat',sans-serif",
                fontSize: "0.78rem", fontWeight: 700, textDecoration: "underline",
              }}
            >
              Clear search
            </button>
          </div>
        )}

        {/* Product grid */}
        {!loading && displayed.length > 0 && (
          <div
            className="um-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            {displayed.map(p => (
              <ProductCard
                key={p.id || p.slug}
                product={p}
                onOpenManuals={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom banner ─────────────────────────────────────────────────── */}
      {!loading && (
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 32px 80px" }}>
          <div style={{
            background: "linear-gradient(135deg,#8b5e3c 0%,#a67853 100%)",
            borderRadius: 20, padding: "44px 56px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 30,
            boxShadow: "0 16px 48px rgba(139,94,60,0.24)",
            flexWrap: "wrap",
          }}>
            <div>
              <h3 style={{
                fontFamily: "'Montserrat',sans-serif", fontWeight: 700,
                fontSize: "1.4rem", color: "#fff", margin: "0 0 8px",
              }}>
                Can't find what you need?
              </h3>
              <p style={{
                fontFamily: "'Montserrat',sans-serif", fontWeight: 400,
                fontSize: "0.92rem", color: "rgba(255,255,255,0.82)",
                margin: 0, lineHeight: 1.6,
              }}>
                Our support team is ready to help you with documentation and technical guidance.
              </p>
            </div>
            <a
              href="/contact"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 30px", background: "#fff", color: "#a67853",
                fontFamily: "'Montserrat',sans-serif", fontSize: "0.82rem",
                fontWeight: 700, borderRadius: 8, textDecoration: "none",
                border: "2px solid transparent", transition: "all 0.3s ease",
                letterSpacing: "0.04em", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#a67853";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              CONTACT US <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7rem" }} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}