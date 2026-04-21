// ProductCatalogue.jsx

import React from "react";
import ButtonClear from "../../components/Buttons/ButtonClear";

const ProductCatalogue = () => {
  return (
    <div className="relative">
      <style>{`
        .pc-hero {
          min-height: 95vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 48px 24px;
          background: linear-gradient(135deg, #1a1410 0%, #3d2a1f 50%, #1a1410 100%);
          color: white;
        }
        .pc-hero h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; font-family: 'Montserrat', sans-serif; }
        .pc-hero p { font-size: 20px; opacity: 0.9; margin-bottom: 32px; max-width: 700px; }
        .pc-section { padding: 64px 24px; max-width: 1200px; margin: 0 auto; }
        .pc-section h2 { font-size: 32px; font-weight: 700; margin-bottom: 24px; color: #2c1f13; }
        .pc-section p { font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 16px; }
        .pc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin: 32px 0; }
        .pc-item { padding: 24px; border: 2px solid #e0d5c7; border-radius: 8px; text-align: center; transition: all 0.3s; cursor: pointer; background: #fafaf8; }
        .pc-item:hover { border-color: #a67853; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .pc-item h3 { font-size: 18px; font-weight: 600; color: #2c1f13; margin: 12px 0; }
        .pc-item i { font-size: 40px; color: #a67853; margin-bottom: 12px; }
        .pc-btn {
          display: inline-block;
          margin-top: 12px;
          padding: 10px 20px;
          background: #a67853;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
        }
        .pc-btn:hover { background: #8b5e3c; }
        @media (max-width: 640px) { .pc-hero h1 { font-size: 32px; } }
      `}</style>

      {/* HERO */}
      <section className="pc-hero">
        <div>
          <h1>PRODUCT CATALOGUE</h1>
          <p>Download our complete product catalogs and find the perfect sauna solution for your needs</p>
        </div>
      </section>

      {/* MAIN CATALOGUE */}
      <section className="pc-section" style={{ backgroundColor: "#f9f7f5" }}>
        <h2>Complete Product Catalogues</h2>
        <p>
          Explore our full range of sauna heaters, rooms, accessories, and wellness solutions.
          All catalogues are updated for 2025-2026.
        </p>

        <div className="pc-grid" style={{ marginTop: "48px" }}>
          <div className="pc-item">
            <i className="fas fa-fire" />
            <h3>Complete Product Catalogue</h3>
            <p>Full lineup of heaters, rooms, and accessories</p>
            <a
              href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="pc-btn"
            >
              DOWNLOAD PDF
            </a>
          </div>

          <div className="pc-item">
            <i className="fas fa-gem" />
            <h3>Stone Series Catalogue</h3>
            <p>Premium stone heaters with Finnish soapstone</p>
            <a
              href="https://www.sawo.com/wp-content/uploads/2025/12/Stone-SeriesRV1_compressed.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="pc-btn"
            >
              DOWNLOAD PDF
            </a>
          </div>

          <div className="pc-item">
            <i className="fas fa-mountain" />
            <h3>Wall-Mounted Heaters</h3>
            <p>Space-saving modern designs</p>
            <a
              href="https://www.sawo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pc-btn"
            >
              EXPLORE
            </a>
          </div>
        </div>
      </section>

      {/* BY CATEGORY */}
      <section className="pc-section">
        <h2>Browse by Category</h2>
        <p>Find products by type, size, and application</p>

        <div className="pc-grid">
          {[
            { icon: "fa-square", title: "Floor Heaters", desc: "Ground-level installation heaters" },
            { icon: "fa-rectangle-tall", title: "Tower Heaters", desc: "Vertical space-efficient models" },
            { icon: "fa-heart", title: "Combi Heaters", desc: "Sauna & steam combination units" },
            { icon: "fa-palette", title: "Dragonfire", desc: "Artistic designer heater collection" },
            { icon: "fa-door-open", title: "Wall-Mounted", desc: "Sleek wall installation options" },
            { icon: "fa-home", title: "Sauna Rooms", desc: "Complete pre-built sauna solutions" },
          ].map((cat, i) => (
            <div className="pc-item" key={i}>
              <i className={`fas ${cat.icon}`} />
              <h3>{cat.title}</h3>
              <p>{cat.desc}</p>
              <a href="https://www.sawo.com" target="_blank" rel="noopener noreferrer" className="pc-btn">
                BROWSE
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* HELP */}
      <section className="pc-section" style={{ backgroundColor: "#f9f7f5" }}>
        <h2>Need Help Finding the Right Product?</h2>
        <p>
          Our product specialists are here to help you choose the perfect sauna solution for your space and budget.
        </p>
        <div style={{
          background: "white",
          padding: "32px",
          borderRadius: "8px",
          marginTop: "32px",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#2c1f13", marginBottom: "12px" }}>Contact Our Product Team</h3>
          <p style={{ marginBottom: "24px" }}>
            Get expert guidance on product selection, specifications, and installation options
          </p>
          <ButtonClear
            text="CONTACT US"
            href="https://www.sawo.com/contact/"
          />
        </div>
      </section>
    </div>
  );
};

export default ProductCatalogue;
