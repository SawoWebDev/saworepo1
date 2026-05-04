// src/pages/AccessoriesPage.jsx
// Dedicated page for products with variants (pails, accessories, etc.)
// Uses local product data with variant images synced from Supabase to GitHub

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLocalProducts } from "../Administrator/Local/useLocalProducts";
import { supabase } from "../Administrator/supabase";
import { ImageWithLoader } from "../components/ImageWithLoader";

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

// Helper: prefer local data over remote, with fallback
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

// Convert path to full URL (GitHub raw or direct URL)
function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (String(pathOrUrl).includes("://")) return pathOrUrl;
  return `${GITHUB_RAW}${pathOrUrl}`;
}

// Get image URL from product field, preferring local data
function getImageUrl(product, field) {
  const url = localOrRemote(product, field);
  return resolveUrl(url);
}

function getFilesArray(product) {
  const local = product?.local_files;
  const remote = product?.files;
  if (local?.length) return local.map(f => ({ name: f.name, url: resolveUrl(f.path || f.url) }));
  return (remote || []).map(f => ({ name: f.name, url: f.url }));
}

// Get variants from local product data
function getVariantsArray(product) {
  const local = product?.local_variants;
  const remote = product?.variants;
  const arr = (local?.length ? local : remote) || [];
  return arr.map(v => ({
    ...v,
    image: v.image ? resolveUrl(v.image) : null
  }));
}

/* ── Video Modal ─────────────────────────────────────────────────────── */
function VideoModal({ videoUrl, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <button onClick={onClose} style={{
        position: "absolute", top: 18, right: 18,
        background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
        width: 40, height: 40, cursor: "pointer", color: "#fff", fontSize: "1rem",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s", zIndex: 10,
      }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
      >
        <i className="fa-solid fa-xmark" />
      </button>

      <video
        onClick={e => e.stopPropagation()}
        src={videoUrl}
        controls
        autoPlay
        style={{
          maxWidth: "90vw", maxHeight: "85vh",
          objectFit: "contain", borderRadius: 10,
        }}
      />
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function AccessoriesPage() {
  const { slug } = useParams();
  const { products: localProds, loading: productsLoading } = useLocalProducts();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [videoModal, setVideoModal] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [supabaseVariants, setSupabaseVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const product = useMemo(() => {
    if (!localProds.length) return null;
    return localProds.find(p => p.slug === slug && p.status === "published" && p.visible !== false) || null;
  }, [localProds, slug]);

  // Fetch variants from Supabase as fallback if not in local data
  useEffect(() => {
    if (!product?.id) return;

    const loadVariants = async () => {
      setLoadingVariants(true);
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", product.id)
          .order("sort_order");

        if (!error && data) {
          // Convert Supabase URLs to GitHub URLs
          setSupabaseVariants(data.map(v => ({
            ...v,
            image: v.image ? resolveUrl(supabaseUrlToRelativePath(v.image)) : null
          })));
        }
      } catch (err) {
        console.error("Error loading variants:", err);
      } finally {
        setLoadingVariants(false);
      }
    };

    loadVariants();
  }, [product?.id]);

  // Get variants from local product data first, fallback to Supabase
  const variants = useMemo(() => {
    if (!product) return [];
    const localVariants = getVariantsArray(product);
    // If local variants exist, use them; otherwise use Supabase fallback
    return localVariants.length > 0 ? localVariants : supabaseVariants;
  }, [product, supabaseVariants]);

  // Helper to convert Supabase URLs to relative paths
  function supabaseUrlToRelativePath(url) {
    if (!url || !url.includes("/object/public/")) return url;
    const match = url.match(/\/object\/public\/product-images\/(.+)$/);
    return match ? match[1] : url;
  }

  // Select first variant on mount, with thumbnail as fallback
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (productsLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: "'Montserrat',sans-serif" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#a67853" }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        minHeight: "70vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#fff",
        fontFamily: "'Montserrat',sans-serif", textAlign: "center", padding: "100px 24px 60px",
      }}>
        <h1 style={{ fontSize: "1.5rem", color: "#2c1a0e", marginBottom: 10 }}>Product not found</h1>
        <p style={{ color: "#666", fontSize: "0.95rem" }}>The product you're looking for doesn't exist or is not available.</p>
      </div>
    );
  }

  const productThumbnail = getImageUrl(product, "thumbnail");
  const videoResource = product?.resources?.video;
  // Use selected variant image, or fall back to thumbnail
  const displayImage = selectedVariant?.image || productThumbnail;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingTop: 80 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 32px 60px" }}>
        <style>{`
          .accessories-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
          .accessories-image-container { display: flex; flexDirection: column; gap: 10px; }
          .accessories-main-image { aspectRatio: "1/1"; borderRadius: 14; overflow: hidden; background: #faf7f4; display: flex; alignItems: center; justifyContent: center; cursor: zoom-in; }
          .accessories-variants { display: flex; gap: 12px; flexWrap: wrap; }
          .accessories-variant-swatch { width: 60px; height: 60px; borderRadius: 8; border: 2px solid #edddd0; overflow: hidden; cursor: pointer; transition: all 0.2s; flexShrink: 0; }
          .accessories-variant-swatch.active { borderColor: #a67853; }
          .accessories-variant-swatch:hover { borderColor: #a67853; }
          .accessories-variant-info { display: flex; flexDirection: column; gap: 16px; }
          .accessories-title { fontSize: 28px; fontWeight: 700; color: #2c1a0e; margin: 0; fontFamily: "'Montserrat',sans-serif"; }
          .accessories-codes { fontSize: 13px; color: #666; fontFamily: "'Montserrat',sans-serif"; lineHeight: 1.6; }
          .accessories-capacity { fontSize: 14px; color: #333; fontFamily: "'Montserrat',sans-serif"; margin: 8px 0; }
          .accessories-options { fontSize: 13px; color: #666; fontFamily: "'Montserrat',sans-serif"; }
          .accessories-description { fontSize: 14px; lineHeight: 1.6; color: #333; }
          .accessories-video-btn { background: #a67853; color: #fff; border: none; padding: 12px 24px; borderRadius: 6px; cursor: pointer; fontSize: 14px; fontFamily: "'Montserrat',sans-serif"; fontWeight: 600; transition: background 0.2s; }
          .accessories-video-btn:hover { background: #8b5e3c; }
          @media (max-width: 768px) { .accessories-grid { gridTemplateColumns: 1fr; gap: 24px; } }
        `}</style>

        {/* Image and Variants Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          {/* Left: Product Image */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              aspectRatio: "1/1", borderRadius: 14, overflow: "hidden",
              background: "#faf7f4", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: videoResource ? "pointer" : "default",
              position: "relative"
            }}
              onClick={() => videoResource && setVideoModal(videoResource)}
            >
              {/* Display variant image or product thumbnail */}
              {displayImage && !imageErrors[selectedVariant?.id] ? (
                <ImageWithLoader
                  src={displayImage}
                  alt={selectedVariant?.label || selectedVariant?.sku || product.name}
                  onError={() => selectedVariant && setImageErrors(e => ({ ...e, [selectedVariant.id]: true }))}
                  style={{
                    maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
                    animation: "ppFadeIn 0.25s ease",
                  }}
                />
              ) : (
                <i className="fa-regular fa-image" style={{ fontSize: "3.5rem", color: "#d5b99a" }} />
              )}

              {videoResource && (
                <div style={{
                  position: "absolute", display: "flex", alignItems: "center",
                  justifyContent: "center", width: 60, height: 60,
                  background: "rgba(166,120,83,0.9)", borderRadius: "50%",
                }}>
                  <i className="fa-solid fa-play" style={{ color: "#fff", fontSize: "1.5rem", marginLeft: "4px" }} />
                </div>
              )}
            </div>

            {/* Variant Swatches */}
            {variants.length > 0 && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setImageErrors(e => {
                        const updated = { ...e };
                        delete updated[variant.id];
                        return updated;
                      });
                    }}
                    title={variant.label || variant.sku}
                    style={{
                      width: 60, height: 60, borderRadius: 8,
                      border: `2px solid ${selectedVariant?.id === variant.id ? "#a67853" : "#edddd0"}`,
                      overflow: "hidden", cursor: "pointer", padding: 0,
                      background: "#faf7f4", transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    {variant.image && !imageErrors[variant.id] ? (
                      <ImageWithLoader
                        src={variant.image}
                        alt={variant.label || variant.sku}
                        onError={() => setImageErrors(e => ({ ...e, [variant.id]: true }))}
                        style={{
                          width: "100%", height: "100%", objectFit: "contain",
                          padding: 2,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "#edddd0",
                      }}>
                        <i className="fa-regular fa-image" style={{ fontSize: "1rem", color: "#a67853" }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "flex-start" }}>
            <h1 style={{
              fontSize: 28, fontWeight: 700, color: "#2c1a0e", margin: 0,
              fontFamily: "'Montserrat',sans-serif",
            }}>
              {product.name}
            </h1>

            {/* SKU Codes */}
            {variants.length > 0 && (
              <div style={{
                fontSize: 13, color: "#666",
                fontFamily: "'Montserrat',sans-serif", lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 600, color: "#2c1a0e", marginBottom: 4 }}>Available Codes:</div>
                <div>{variants.map(v => v.sku || v.label).filter(Boolean).join(" | ")}</div>
              </div>
            )}

            {/* Capacity */}
            {selectedVariant?.capacity_liters && (
              <div style={{
                fontSize: 14, color: "#333",
                fontFamily: "'Montserrat',sans-serif", margin: "8px 0",
              }}>
                <strong>Capacity:</strong> {selectedVariant.capacity_liters}L
              </div>
            )}

            {/* Material/Color Options */}
            {selectedVariant?.color_key && (
              <div style={{
                fontSize: 13, color: "#666",
                fontFamily: "'Montserrat',sans-serif",
              }}>
                <strong style={{ color: "#2c1a0e" }}>Material:</strong> {selectedVariant.color_key}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div style={{
                fontSize: 14, lineHeight: 1.6, color: "#333",
                fontFamily: "'Montserrat',sans-serif",
              }}>
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}

            {/* Video Button */}
            {videoResource && (
              <div>
                <button
                  onClick={() => setVideoModal(videoResource)}
                  style={{
                    background: "#a67853", color: "#fff", border: "none",
                    padding: "12px 24px", borderRadius: 6, cursor: "pointer",
                    fontSize: 14, fontFamily: "'Montserrat',sans-serif",
                    fontWeight: 600, transition: "background 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#8b5e3c"}
                  onMouseLeave={e => e.currentTarget.style.background = "#a67853"}
                >
                  <i className="fa-solid fa-play" style={{ marginRight: 8 }} />
                  Watch Video
                </button>
              </div>
            )}

            {/* Resources/Files */}
            {getFilesArray(product).length > 0 && (
              <div style={{
                paddingTop: 16, borderTop: "1px solid #edddd0",
              }}>
                <h3 style={{
                  fontSize: 13, fontWeight: 600, color: "#2c1a0e",
                  margin: "0 0 8px", fontFamily: "'Montserrat',sans-serif",
                }}>Resources</h3>
                {getFilesArray(product).map((file, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#a67853", textDecoration: "none",
                        fontSize: 13, fontFamily: "'Montserrat',sans-serif",
                      }}
                    >
                      <i className="fa-solid fa-download" style={{ marginRight: 6 }} />
                      {file.name}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoModal && (
        <VideoModal
          videoUrl={videoModal}
          onClose={() => setVideoModal(null)}
        />
      )}
    </div>
  );
}
