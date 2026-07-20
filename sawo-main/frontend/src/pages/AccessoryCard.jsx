// Shared accessory product card — visual design ported from the WordPress
// reference snippets in /IndividualPages (pails.html's ".sawo-av-card" style),
// so every accessory category in the React catalog renders identically to
// the site's original per-category display pages.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const GITHUB_RAW = `https://raw.githubusercontent.com/${process.env.REACT_APP_GITHUB_OWNER || "jmesrafael"}/${process.env.REACT_APP_IMAGES_REPO || "saworepo2"}/main/`;

export function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (String(pathOrUrl).includes("://")) return pathOrUrl;
  return `${GITHUB_RAW}${pathOrUrl}`;
}

// Ported from IndividualPages/allaccs-display.html's colorToClass — order
// matters (compound names like "Black Metal" must be checked before the
// generic "black" substring they contain).
function colorToClass(label) {
  const l = (label || "").toLowerCase();
  if (l.includes("hemlock") || l.includes("pinaceae") || l === "pine") return "pine";
  if (l.includes("aspen")) return "aspen";
  if (l.includes("cedar")) return "cedar";
  if (l.includes("black metal")) return "blackmetal";
  if (l.includes("metallic brown")) return "metalbrown";
  if (l.includes("aluminum") || l.includes("aluminium")) return "aluminum";
  if (l.includes("black")) return "black";
  if (l.includes("white")) return "white";
  if (l.includes("spruce")) return "spruce";
  return "default";
}

// Ported verbatim from IndividualPages/pails.html's <style> block (the
// "sawo-av-*" design shared by every per-category WP display page), plus the
// category-tab styles from the same file. One deliberate deviation: the
// source pages are static (non-linking) displays, so their card/image rules
// use cursor:default — here cards navigate to the product page, so those are
// cursor:pointer instead. Everything else (colors, sizing, spacing, ribbon,
// breakpoints) is unchanged.
export const ACCESSORY_CARD_CSS = `
.sawo-av-category-buttons{display:flex;gap:10px;justify-content:center;align-items:center;margin:10px 0 30px;flex-wrap:wrap}
.sawo-av-btn{padding:12px 18px;font-size:12px;font-family:'Montserrat',sans-serif;font-weight:500;text-decoration:none;border:1px solid #af8564;border-radius:5px;transition:all 0.3s ease;cursor:pointer;text-align:center;color:#af8564;background-color:transparent;user-select:none}
.sawo-av-btn.sawo-av-active{background-color:#af8564!important;color:#ffffff!important;border:1px solid #af8564!important}
.sawo-av-btn.sawo-av-active:hover{background-color:#af8564!important;color:#ffffff!important}
.sawo-av-btn:hover{background-color:#af8564;color:#ffffff}
.sawo-av-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;width:100%}
.sawo-av-card{background-color:#ffffff;border:1px solid #e8e8e8;border-radius:12px;padding:16px;display:flex;flex-direction:column;align-items:flex-start;box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:box-shadow 0.3s ease;cursor:pointer;position:relative;overflow:hidden}
.sawo-av-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.12)}
.sawo-av-image-container{position:relative;width:100%;text-align:center;margin-bottom:10px;cursor:pointer}
.sawo-av-main-image{width:100%;height:auto;border-radius:8px;transition:transform 0.5s ease;cursor:pointer;pointer-events:none}
.sawo-av-image-container:hover .sawo-av-main-image{transform:scale(1.05)}
.sawo-av-overlay-text{position:absolute;top:8px;right:8px;background-color:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;font-size:12px;border-radius:4px;font-family:'Montserrat',sans-serif;pointer-events:none}
.sawo-av-choices{display:flex;justify-content:center;gap:8px;margin-bottom:8px;align-items:center;width:100%;user-select:none}
.sawo-av-arrow{user-select:none;cursor:default;font-size:16px;line-height:1;pointer-events:none;color:#af8564}
.sawo-av-choice{cursor:pointer;width:20px;height:20px;border:2px solid transparent;transition:border-color 0.3s ease,transform 0.3s ease;border-radius:50%;user-select:none;padding:0}
.sawo-av-choice:hover{border-color:#af8564;transform:scale(1.3)}
.sawo-av-choice.pine,.sawo-av-choice.hemlock{background-color:#d9ad73}
.sawo-av-choice.aspen{background-color:#c6c3bf}
.sawo-av-choice.cedar{background-color:#8b5a2b}
.sawo-av-choice.black{background-color:#1a1a1a}
.sawo-av-choice.white{background-color:#F5F5F5;border:1px solid #ccc}
.sawo-av-choice.spruce{background-color:#c8bea0}
.sawo-av-choice.aluminum{background:linear-gradient(135deg,#d4d4d4,#a8a8a8)}
.sawo-av-choice.metalbrown{background-color:#7a5c3c}
.sawo-av-choice.blackmetal{background-color:#2c2c2c}
.sawo-av-choice.default{background-color:#bbb}
.sawo-av-headtext{font-size:22px;line-height:35px;font-family:'Montserrat',sans-serif;text-align:center;width:100%;color:#af8564;font-weight:400}
.sawo-av-code{font-size:15px;line-height:27px;font-family:'Montserrat',sans-serif;text-align:left;color:#333}
.sawo-av-subtext{font-size:15px;line-height:27px;font-family:'Montserrat',sans-serif;text-align:left;color:#5a4030}
.sawo-av-subtext strong,.sawo-av-code strong{font-weight:500}
.sawo-av-best-seller-badge{position:absolute;top:18px;left:-30px;width:130px;background-color:#af8564;color:#fff;text-align:center;font-size:11px;font-weight:700;font-family:'Montserrat',sans-serif;letter-spacing:0.5px;padding:6px 0;transform:rotate(-45deg);z-index:10;text-transform:uppercase;box-shadow:0 2px 4px rgba(0,0,0,0.2)}
.sawo-av-video-modal{display:flex;position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,0.6);z-index:10;justify-content:center;align-items:center}
.sawo-av-popup-video{width:100%;height:100%;object-fit:cover;background:#000;z-index:11}
.sawo-av-close-video{position:absolute;top:10px;right:10px;background:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:16px;cursor:pointer;z-index:12}
.sawo-av-video-btn{background:none;border:none;cursor:pointer;margin-left:8px;padding:0;display:flex;align-items:center}
@media(max-width:1024px){.sawo-av-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){.sawo-av-grid{grid-template-columns:repeat(2,1fr)}.sawo-av-btn{font-size:8px;padding:10px 13px}.sawo-av-choice{width:16px;height:16px}.sawo-av-choices{gap:6px}.sawo-av-headtext{font-size:14px;line-height:24px}.sawo-av-code,.sawo-av-subtext{font-size:10px;line-height:20px}.sawo-av-overlay-text{font-size:9px;top:0;right:0;padding:2px 4px}}
@media(max-width:480px){.sawo-av-grid{grid-template-columns:1fr}}
`;

export function AccessoryCard({ product }) {
  const navigate = useNavigate();
  const variants = product.variants || [];
  const hasSwatches = variants.length > 1;
  const [selected, setSelected] = useState(null); // null = grouped/default thumbnail
  const [videoOpen, setVideoOpen] = useState(false);

  const activeVariant = selected != null ? variants[selected] : null;
  const mainImage = resolveUrl(activeVariant?.image) || resolveUrl(product.thumbnail);
  const codes = variants.map(v => v.code).filter(Boolean);
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
  const specRows = product.spec_table?.rows || [];
  const video = product.resources?.video;

  const goToProduct = () => navigate(`/accessories/${product.slug}`);

  return (
    <div
      className="sawo-av-card"
      role="link"
      tabIndex={0}
      onClick={goToProduct}
      onKeyDown={e => { if (e.key === "Enter") goToProduct(); }}
    >
      {product.featured && <div className="sawo-av-best-seller-badge">Best Seller</div>}

      <div className="sawo-av-image-container">
        {mainImage ? (
          <img className="sawo-av-main-image" src={mainImage} alt={product.name} loading="lazy" />
        ) : (
          <div style={{ aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fa-regular fa-image" style={{ fontSize: "2.5rem", color: "#d5b99a" }} />
          </div>
        )}
        {activeVariant?.code && <div className="sawo-av-overlay-text">{activeVariant.code}</div>}

        {video && videoOpen && (
          <div className="sawo-av-video-modal">
            <video className="sawo-av-popup-video" loop autoPlay controls onClick={e => e.stopPropagation()}>
              <source src={video} type="video/mp4" />
            </video>
            <button
              className="sawo-av-close-video"
              title="Close"
              onClick={e => { e.stopPropagation(); setVideoOpen(false); }}
            >
              &#10006;
            </button>
          </div>
        )}
      </div>

      {(hasSwatches || video) && (
        <div className="sawo-av-choices">
          <span className="sawo-av-arrow">&#8249;</span>
          {hasSwatches && variants.map((v, i) => (
            <button
              key={v.code || i}
              type="button"
              className={`sawo-av-choice ${colorToClass(v.color)}`}
              title={v.color}
              onClick={e => { e.stopPropagation(); setSelected(i); }}
            />
          ))}
          {video && (
            <button
              type="button"
              className="sawo-av-video-btn"
              title="Watch Video"
              onClick={e => { e.stopPropagation(); setVideoOpen(true); }}
            >
              <i className="fa-solid fa-circle-play" style={{ fontSize: 22, color: "#af8564" }} />
            </button>
          )}
          <span className="sawo-av-arrow">&#8250;</span>
        </div>
      )}

      <div className="sawo-av-headtext">{product.name}</div>
      {codes.length > 0 && <div className="sawo-av-code">Code: {codes.join(" | ")}</div>}
      {specRows.map(([label, value]) => (
        <div className="sawo-av-subtext" key={label}><strong>{label}:</strong> {value}</div>
      ))}
      {colors.length > 1 && <div className="sawo-av-subtext"><strong>Option:</strong> {colors.join(" | ")}</div>}
    </div>
  );
}
