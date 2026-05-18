// SaunaAccessories.jsx

import React from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../menuPaths";
import ButtonClear from "../../components/Buttons/ButtonClear";
import img_Signature_BL_v2_1_scaled from "../../assets/Signature-BL-v2-1-scaled.webp";
import img_Signature_D_v4_scaled from "../../assets/Signature-D-v4-scaled.webp";
import img_DRAGON_FIRE_PAIL_AND_LADDLE_SCENE_600x600_1 from "../../assets/DRAGON-FIRE-PAIL-AND-LADDLE-SCENE-600x600-1.webp";
import img_TR_LIGHT_COVER_SCENE1_copy from "../../assets/TR-LIGHT-COVER_SCENE1-copy.webp";
import img_siro_bench from "../../assets/siro-bench.webp";
import img_R_500_D_Scene2 from "../../assets/R-500-D_Scene2.webp";
import img_Ventilation from "../../assets/Ventilation.webp";
import img_BoxType2_copy_new from "../../assets/BoxType2-copy-new.jpg";
import img_sand_timer_copy_new from "../../assets/sand-timer-copy-new.jpg";
import img_506_2_D from "../../assets/506-2-D.jpg";
import img_DOORS_AND_HANDLES_copy from "../../assets/DOORS-AND-HANDLES-copy.jpg";

const SaunaAccessories = () => {
  return (
    <div className="relative">

      {/* ===================== */}
      {/* HERO SECTION          */}
      {/* ===================== */}
      <section
        className="sa-hero min-h-[95vh] flex flex-col justify-center items-center text-center px-6 relative"
        style={{
          backgroundImage: `url(${img_Signature_BL_v2_1_scaled})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="sa-hero-overlay" />
        <div className="sa-hero-content">
          <h1 className="sa-hero-title">SAUNA ACCESSORIES</h1>
          <p className="sa-hero-subtitle">Discover the Perfect Sauna Accessories</p>
          <div style={{ marginTop: "32px" }}>
            <ButtonClear
              text="VIEW BROCHURE"
              href="https://www.sawo.com/wp-content/uploads/2025/12/SAWO-Product-Catalogue-2025-2026-web.pdf"
              download
            />
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* SECTION 1: GRID       */}
      {/* ===================== */}
      <section className="sa-grid-section max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="sa-section-title">Discover the Perfect Sauna Accessories</h2>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

          .custom-product-grid,
          .custom-product-grid * {
            font-family: 'Montserrat', sans-serif !important;
          }
          .custom-product-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            margin: 25px auto;
            max-width: 1200px;
          }
          .custom-product-grid .product {
            display: block;
            text-align: left;
            border: 1px solid #eee;
            border-radius: 10px;
            padding: 20px;
            background: #fff;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            color: inherit;
            text-decoration: none;
            text-transform: none;
          }
          .custom-product-grid .product:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.12), 0 0 20px rgba(166,120,83,0.15);
          }
          .custom-product-grid img {
            width: 100%;
            height: 300px;
            object-fit: cover;
            border-radius: 6px;
            margin-bottom: 12px;
            transition: transform 0.3s ease;
          }
          .custom-product-grid .product:hover img {
            transform: scale(1.05);
          }
          .custom-product-grid h3 {
            font-size: 20px;
            font-weight: 700;
            margin: 8px 0 6px;
            transition: color 0.3s ease;
            color: #141617;
            text-transform: none;
          }
          .custom-product-grid .product:hover h3 {
            color: #af8564;
          }
          .custom-product-grid p {
            font-size: 14px;
            color: #333333;
            line-height: 1.5;
            transition: color 0.3s ease;
            text-transform: none;
          }
          @media (max-width: 1024px) {
            .custom-product-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 600px) {
            .custom-product-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="custom-product-grid">

          <Link to={menuPaths.sauna.accessories.accessorySets} className="product">
            <img src={img_Signature_D_v4_scaled} alt="Accessory Sets" />
            <h3>Accessory Sets</h3>
            <p>Our carefully curated accessory sets offer something for everyone. From natural, zero-waste options to bold & sophisticated designs, the sets enhance your sauna enjoyment in every possible way.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.pailsLadles} className="product">
            <img src={img_DRAGON_FIRE_PAIL_AND_LADDLE_SCENE_600x600_1} alt="Pails and Ladles" />
            <h3>Pails & Ladles</h3>
            <p>Essential to Finnish saunas, our SAWO selection offers pails ranging from 2 to 40 liters. Choose from traditional cedar, aspen, & pine or modern stainless steel options. Complete your set with ladles.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.thermometers} className="product">
            <img src={img_BoxType2_copy_new} alt="Thermometers and Combined meters" />
            <h3>Thermometers & Combined meters</h3>
            <p>Traditional Thermometers & Hygrometers signal sauna readiness. Explore diverse shapes & styles. Enhance your lounge with wooden clocks & try our 15-minute sand timers for socializing or newcomers.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.clocksSandtimers} className="product">
            <img src={img_sand_timer_copy_new} alt="Clocks and Sandtimers" />
            <h3>Clocks & Sandtimers</h3>
            <p>Want to see who lasts the longest in sauna? Our 15min sand timers are a great way to create conversation or perfect for those who are new to Finnish sauna.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.lightsCovers} className="product">
            <img src={img_TR_LIGHT_COVER_SCENE1_copy} alt="Sauna Lights and Light Covers" />
            <h3>Sauna Lights & Covers</h3>
            <p>Create the perfect ambience with a proper play of lighting. Our different light shades allow you to create the feel of soothing & warm.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.headrestsBackrests} className="product">
            <img src={img_506_2_D} alt="Headrests and Backrests" />
            <h3>Headrests & Backrests</h3>
            <p>Wooden headrests & backrests, along with lounge backrests, made from durable materials like wood, memory foam, or fabric, offer comfort in the sauna & lounge with moisture-resistant upholstery for durability.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.doorsHandles} className="product">
            <img src={img_DOORS_AND_HANDLES_copy} alt="Doors and Handles" />
            <h3>Doors & Handles</h3>
            <p>Elevate your sauna with SAWO's sauna doors. Crafted for durability, they feature rubber lining, magnetic lock, stainless hinges, & laminated jambs. Choose from glass options for a light-filled, spacious feel.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.benches} className="product">
            <img src={img_siro_bench} alt="Benches" />
            <h3>Benches & Floor Tiles</h3>
            <p>Upgrade your sauna experience with comfy, stylish benches that support & enhance relaxation. Choose from various high-quality designs to suit your taste & space, creating a wellness sanctuary for your body & mind.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.kivistone} className="product">
            <img src={img_R_500_D_Scene2} alt="Kivistone" />
            <h3>Kivistone</h3>
            <p>Kivistone offers a variety of unique soapstone products for homes, gifts, & corporate use, featuring a wide range of innovative designs.</p>
          </Link>

          <Link to={menuPaths.sauna.accessories.ventilations} className="product">
            <img src={img_Ventilation} alt="Ventilations and Miscellaneous Items" />
            <h3>Ventilations & Add-Ons</h3>
            <p>Explore your sauna experience with our range of ventilations & essential items. Elevate your time in the sauna with SAWO's complimentary items. Discover our fascinating selection today!</p>
          </Link>

        </div>
      </section>

      {/* ===================== */}
      {/* GLOBAL STYLES         */}
      {/* ===================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');

        .sa-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.38);
          z-index: 0;
        }
        .sa-hero-content {
          position: relative;
          z-index: 1;
        }
        .sa-hero-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 45px;
          line-height: 52px;
          font-weight: 700;
          color: #ffffff;
        }
        .sa-hero-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 400;
          color: #ffffff;
          margin-top: 12px;
          line-height: 38px;
        }
        .sa-section-title {
          font-family: 'Montserrat', sans-serif;
          font-style: normal;
          font-weight: 400;
          color: rgb(175, 133, 100);
          font-size: 36px;
          margin-bottom: 8px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .sa-hero-title {
            font-size: 28px;
            line-height: 36px;
          }
          .sa-hero-subtitle {
            font-size: 16px;
            line-height: 28px;
          }
          .sa-section-title {
            font-size: 26px;
          }
        }
      `}</style>

    </div>
  );
};

export default SaunaAccessories;