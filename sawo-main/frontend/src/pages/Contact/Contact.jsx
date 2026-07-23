// src/pages/Contact/Contact.jsx
// Redesigned contact page: hero, 3-step request form (Your Request → About You →
// Request Details), representative offices with photos, and internal CTAs to
// FAQ and User Manuals.

import React, { useState } from "react";
import { Link } from "react-router-dom";
import menuPaths from "../../menuPaths";
import HeroWave from "../../components/HeroWave";
import woodBg from "../../assets/SaunaCalculator-bg.webp";

// ─── Office data ──────────────────────────────────────────────────────────────
const OFFICES = [
  {
    name: "SAWO Inc.",
    role: "Global Sales & General Inquiries",
    image: "https://secret-newsite.sawo.com/wp-content/uploads/2021/03/sawobuilding_plant1.jpg",
    address: ["Mactan Economic Zone 2, Mactan,", "Cebu 6015, Philippines"],
    mapUrl: "https://www.google.com/maps/place/SAWO+Inc./@10.2908545,123.9474748,20678m/data=!3m1!1e3!4m6!3m5!1s0x33a999f9aaaaaaab:0x638e93b7abe9d209!8m2!3d10.3065109!4d123.9662661!16s%2Fg%2F11xbg6w1q",
    tel: "+63 32 341 2233",
    telHref: "+63323412233",
    email: "info@sawo.com",
  },
  {
    name: "SAWO Nordic Oy",
    role: "Sales & Warehouse for the Nordics",
    image: "https://secret-newsite.sawo.com/wp-content/uploads/2021/03/nordic3.jpg",
    address: ["Hampuntie 18, 36220 Kangasala,", "Finland"],
    mapUrl: "https://www.google.com/maps/place/Sawo+Nordic+Oy/@61.4682459,23.8889861,40152m/data=!3m1!1e3!4m6!3m5!1s0x468f1ff184c90c83:0xe1681d5d0909096b!8m2!3d61.4996934!4d23.7501876!16s%2Fg%2F1q675ymsx",
    tel: "+358 40 038 3265",
    telHref: "+358400383265",
    email: "finland@sawo.com",
  },
  {
    name: "F.E.M. Ltd",
    role: "Sales & Warehouse for Asia",
    image: "https://www.sawo.com/wp-content/uploads/2026/04/cable-tower.jpeg",
    address: ["2302, 23rd Floor, Cable TV Tower 9", "Hoi Shing Road, Tsuen Wan, Hong Kong"],
    mapUrl: "https://www.google.com/maps/place/Cable+T+V+Tower,+9+Hoi+Shing+Rd,+Chai+Wan+Kok,+Hong+Kong/@22.3720256,114.1051012,1215m/data=!3m1!1e3!4m6!3m5!1s0x3403f8e56f3381c9:0xbdbb69dc3fa013e4!8m2!3d22.3727747!4d114.1073972!16s%2Fg%2F12j799c55",
    tel: "+852 2417 1188",
    telHref: "+85224171188",
    email: "hongkong@sawo.com",
  },
  {
    name: "SAWO Sauna Europe Hub B.V.",
    role: "Sales & Warehouse for Europe",
    image: "https://www.sawo.com/wp-content/uploads/2026/02/De-Vest.png",
    address: ["De Vest 24, 5555 XL Valkenswaard", "Netherlands"],
    mapUrl: "https://www.google.com/maps/place/SAWO+Sauna+Europe+B.V./@51.347626,5.4851098,820m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47c6d7006fe0a9bb:0x95ddf180c98d0533!8m2!3d51.347626!4d5.4876847!16s%2Fg%2F11nbg5c2pp",
    tel: "+358 40 016 8269",
    telHref: "+358400168269",
    email: "europehub@sawo.com",
  },
];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi",
  "Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia",
  "Comoros","Congo","Costa Rica","Cote D'ivoire","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea",
  "Eritrea","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana",
  "Greece","Greenland","Grenada","Guatemala","Guinea","Guyana","Haiti","Honduras","Hong Kong","Hungary",
  "Iceland","India","Indonesia","Iran, Islamic Republic of","Iraq","Ireland","Israel","Italy","Jamaica",
  "Japan","Jordan","Kazakhstan","Kenya","Kiribati","Korea, Republic of","Kuwait","Kyrgyzstan",
  "Lao People's Democratic Republic","Latvia","Lebanon","Lesotho","Liberia","Libyan Arab Jamahiriya",
  "Liechtenstein","Lithuania","Luxembourg","Macao","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Mauritania","Mauritius","Mexico","Moldova, Republic of","Monaco","Mongolia","Montenegro","Morocco",
  "Mozambique","Myanmar","Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russian Federation","Rwanda","Saint Lucia","Samoa",
  "San Marino","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Solomon Islands","Somalia","South Africa","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syrian Arab Republic","Taiwan","Tajikistan","Tanzania, United Republic of","Thailand",
  "Timor-leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela",
  "Viet Nam","Yemen","Zambia","Zimbabwe",
];

const CATEGORIES = [
  { value: "technical", label: "Technical Support", icon: "fa-solid fa-wrench" },
  { value: "customer",  label: "Customer Support",  icon: "fa-solid fa-headphones" },
  { value: "general",   label: "General Inquiry",   icon: "fa-regular fa-comment" },
];

const CUSTOMER_SUBJECTS = ["Customer Support", "Feedback", "Order Status", "Warranty Claims", "Other"];
const TECHNICAL_SUBJECTS = ["Request Repair", "Request Spare Parts", "Request Replacement"];
const PRODUCT_CATEGORIES = ["Heater", "Steam Generator", "Accessory", "Kivistone Item"];

const EMPTY_FORM = {
  fname: "", lname: "", email: "", country: "", phone: "",
  subject: "", message: "",
  productCategory: "", productName: "", productCode: "",
};

// ─── Component ────────────────────────────────────────────────────────────────
const Contact = () => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const pickCategory = (value) => {
    setCategory(value);
    // Subject presets differ per category — clear when switching
    setForm(prev => ({ ...prev, subject: "" }));
    setStep(2);
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.fname.trim()) e.fname = "This field is required";
    if (!form.lname.trim()) e.lname = "This field is required";
    if (!form.email.trim()) e.email = "This field is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Please enter a valid email address";
    if (!form.country) e.country = "Please select a country";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = category === "general" ? "This field is required" : "Please select an option";
    if (!form.message.trim()) e.message = "This field is required";
    if (category === "technical") {
      if (!form.productCategory) e.productCategory = "Please select an option";
      if (!form.productName.trim()) e.productName = "This field is required";
      if (!form.productCode.trim()) e.productCode = "This field is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    console.log("Contact form submitted:", { category, ...form });
    setSubmitted(true);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setCategory("");
    setErrors({});
    setStep(1);
    setSubmitted(false);
  };

  const stepState = (n) => {
    if (n < step) return "completed";
    if (n === step) return "active";
    return "";
  };

  const fieldError = (name) =>
    errors[name] ? <div className="ct-error-message">{errors[name]}</div> : null;

  return (
    <div className="relative">
      <style>{`

        /* ══ FORM SECTION (dark wood) ══ */
        .ct-form-section {
          position: relative;
          background-color: #241c17;
          background-image: linear-gradient(rgba(18,12,7,0.72), rgba(18,12,7,0.72)), url('${woodBg}');
          background-size: cover;
          background-position: center;
          padding: 160px 24px 100px;
        }
        .ct-form-section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 34px;
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          margin: 0 0 18px;
        }
        .ct-form-section-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 15px;
          font-weight: 300;
          color: rgba(255,255,255,0.92);
          text-align: center;
          line-height: 1.7;
          max-width: 860px;
          margin: 0 auto 48px;
        }

        /* Form card */
        .ct-form-wrapper { max-width: 620px; margin: 0 auto; font-family: 'Montserrat', sans-serif; }
        .ct-form-card {
          background: #faf8f6;
          border-radius: 10px;
          padding: 45px 40px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }

        /* Progress */
        .ct-progress {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          margin-bottom: 40px;
        }
        .ct-progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .ct-step-circle {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          color: #999;
          transition: all 0.3s ease;
        }
        .ct-progress-step.active .ct-step-circle,
        .ct-progress-step.completed .ct-step-circle { background: #af8564; color: #fff; }
        .ct-step-label { font-size: 12px; color: #999; font-weight: 500; white-space: nowrap; }
        .ct-progress-step.active .ct-step-label { color: #af8564; font-weight: 600; }
        .ct-progress-line {
          width: 70px;
          height: 2px;
          background: #e0e0e0;
          margin-top: 22px;
        }
        .ct-progress-line.filled { background: #af8564; }

        /* Category cards */
        .ct-category-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .ct-category-card {
          border: 2px solid #d4c4b8;
          border-radius: 8px;
          padding: 35px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          background: #ffffff;
        }
        .ct-category-card:hover {
          border-color: #af8564;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(175,133,100,0.15);
        }
        .ct-category-card.selected { border-color: #af8564; background: #af8564; }
        .ct-category-card i {
          font-size: 38px;
          color: #af8564;
          margin-bottom: 14px;
          display: block;
        }
        .ct-category-card.selected i,
        .ct-category-card.selected .ct-category-title { color: #ffffff; }
        .ct-category-title { font-size: 15px; font-weight: 500; color: #333; }
        .ct-category-card--centered {
          grid-column: 1 / -1;
          max-width: calc(50% - 10px);
          justify-self: center;
          width: 100%;
        }

        /* Fields */
        .ct-section-heading {
          font-size: 20px;
          font-weight: 600;
          color: #af8564;
          margin-bottom: 30px;
          text-align: center;
        }
        .ct-form-group { margin-bottom: 22px; }
        .ct-form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .ct-form-card label {
          display: block;
          color: #333;
          font-weight: 500;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .ct-optional { color: #999; font-weight: 400; font-size: 13px; }
        .ct-req { color: #e53e3e; }
        .ct-form-card input[type="text"],
        .ct-form-card input[type="email"],
        .ct-form-card input[type="tel"],
        .ct-form-card select,
        .ct-form-card textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #d4c4b8;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.3s ease;
          background: #ffffff;
          color: #000;
          box-sizing: border-box;
        }
        .ct-form-card input::placeholder,
        .ct-form-card textarea::placeholder { color: #bbb; opacity: 0.7; }
        .ct-form-card input:focus,
        .ct-form-card select:focus,
        .ct-form-card textarea:focus {
          outline: none;
          border-color: #af8564;
          box-shadow: 0 0 0 3px rgba(175,133,100,0.1);
        }
        .ct-form-card select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%23af8564' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 18px;
          padding-right: 40px;
        }
        .ct-form-card textarea { min-height: 120px; resize: vertical; }
        .ct-helper-text { font-size: 12px; color: #999; margin-top: 5px; }
        .ct-error-message { color: #dc2626; font-size: 0.85rem; margin-top: 5px; }
        .ct-form-group.error input,
        .ct-form-group.error select,
        .ct-form-group.error textarea { border-color: #dc2626; }

        /* Buttons */
        .ct-btn-group { display: flex; gap: 15px; margin-top: 32px; }
        .ct-btn {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #af8564;
          color: #fff;
        }
        .ct-btn:hover { background: #9a7459; }

        /* Success */
        .ct-success { text-align: center; padding: 30px 10px; animation: ctFadeIn 0.5s ease; }
        .ct-success-icon {
          width: 80px;
          height: 80px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 25px;
          animation: ctScaleIn 0.5s ease;
        }
        .ct-success-icon i { color: #fff; font-size: 34px; }
        .ct-success-title { font-size: 26px; font-weight: 600; color: #333; margin: 0 0 12px; }
        .ct-success-msg { font-size: 15px; color: #666; margin: 0 0 30px; line-height: 1.6; }
        .ct-success-actions { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
        .ct-success-btn {
          padding: 12px 28px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          text-decoration: none;
          display: inline-block;
        }
        .ct-success-btn--primary { background: #af8564; color: #fff; }
        .ct-success-btn--primary:hover { background: #9a7459; transform: translateY(-2px); }
        .ct-success-btn--secondary { background: #faf8f6; color: #af8564; border: 2px solid #af8564; }
        .ct-success-btn--secondary:hover { background: #f3ede7; }

        .ct-back-link { text-align: center; margin-top: 28px; font-size: 13px; color: #666; }
        .ct-back-link a { color: #af8564; text-decoration: none; }
        .ct-back-link a:hover { text-decoration: underline; }

        @keyframes ctFadeIn  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ctScaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        .ct-fade { animation: ctFadeIn 0.4s ease; }

        /* ══ QUICK CONTACT STRIP ══ */
        .ct-quick-section { background: #ffffff; padding: 80px 24px 90px; }
        .ct-quick-header { text-align: center; margin-bottom: 46px; }
        .ct-quick-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: #af8564;
          font-weight: 700;
          margin-bottom: 14px;
        }
        .ct-quick-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .ct-quick-grid {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .ct-quick-card {
          position: relative;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          border-radius: 16px;
          padding: 26px 28px;
          text-align: center;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(139,94,60,0.22);
          transition: all 0.3s ease;
        }
        .ct-quick-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent 60%);
          pointer-events: none;
        }
        .ct-quick-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 44px rgba(139,94,60,0.32);
        }
        .ct-quick-icon {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.24);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 1.2rem;
          margin: 0 auto 14px;
        }
        .ct-quick-card h3 {
          position: relative;
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 10px;
          letter-spacing: 0.02em;
        }
        .ct-quick-card p {
          position: relative;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.86rem;
          color: rgba(255,255,255,0.92);
          font-weight: 300;
          margin: 0 0 18px;
          line-height: 1.55;
        }
        .ct-quick-card a {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Montserrat', sans-serif;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.85rem;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.3);
          white-space: nowrap;
          transition: all 0.25s ease;
        }
        .ct-quick-card a:hover {
          background: #af8564;
          border-color: #af8564;
        }

        /* ══ OFFICES ══ */
        .ct-offices-section { padding: 80px 24px 90px; background: #ffffff; }
        .ct-offices-header { text-align: center; margin-bottom: 50px; }
        .ct-offices-eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: #af8564;
          font-weight: 700;
          margin-bottom: 14px;
        }
        .ct-offices-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5e3c 0%, #a67853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .ct-offices-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 26px;
        }
        .ct-office-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid rgba(175,133,100,0.18);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .ct-office-card:hover {
          transform: translateY(-6px);
          border-color: #af8564;
          box-shadow: 0 18px 44px rgba(139,94,60,0.2);
        }
        .ct-office-img {
          width: 100%;
          aspect-ratio: 16/10;
          overflow: hidden;
          background: #f0e9df;
        }
        .ct-office-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s ease;
        }
        .ct-office-card:hover .ct-office-img img { transform: scale(1.06); }
        .ct-office-body { padding: 22px 22px 24px; flex: 1; display: flex; flex-direction: column; }
        .ct-office-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #2c1a0e;
          margin: 0 0 4px;
          line-height: 1.3;
        }
        .ct-office-role {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #af8564;
          margin: 0 0 14px;
        }
        .ct-office-body a.ct-office-address {
          font-family: 'Montserrat', sans-serif;
          display: block;
          font-size: 0.84rem;
          color: #555;
          font-weight: 300;
          line-height: 1.55;
          text-decoration: none;
          margin-bottom: 12px;
          transition: color 0.2s;
        }
        .ct-office-body a.ct-office-address:hover { color: #8b5e3c; }
        .ct-office-line {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.84rem;
          margin: 0 0 6px;
          color: #555;
        }
        .ct-office-line i { color: #af8564; width: 18px; }
        .ct-office-line a { color: #555; text-decoration: none; transition: color 0.2s; }
        .ct-office-line a:hover { color: #8b5e3c; }
        .ct-office-line a.ct-office-email { color: #a67853; font-weight: 600; }

        /* ══ SUPPORT CTA (dark wood) ══ */
        .ct-support-section {
          position: relative;
          background-color: #241c17;
          background-image: linear-gradient(rgba(18,12,7,0.78), rgba(18,12,7,0.78)), url('${woodBg}');
          background-size: cover;
          background-position: center bottom;
          padding: 90px 24px;
        }
        .ct-support-header { text-align: center; margin-bottom: 46px; }
        .ct-support-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 30px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 12px;
        }
        .ct-support-desc {
          font-family: 'Montserrat', sans-serif;
          font-size: 15px;
          font-weight: 300;
          color: rgba(255,255,255,0.88);
          margin: 0 auto;
          max-width: 640px;
          line-height: 1.7;
        }
        .ct-support-grid {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 26px;
        }
        .ct-support-card {
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.22);
          border-radius: 16px;
          padding: 40px 34px;
          text-align: center;
          text-decoration: none;
          backdrop-filter: blur(4px);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ct-support-card:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.5);
          transform: translateY(-5px);
        }
        .ct-support-card > i {
          font-size: 40px;
          color: #d8b894;
          margin-bottom: 18px;
        }
        .ct-support-card h3 {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 10px;
        }
        .ct-support-card p {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 300;
          color: rgba(255,255,255,0.85);
          margin: 0 0 22px;
          line-height: 1.6;
        }
        .ct-support-card-btn {
          font-family: 'Montserrat', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 28px;
          border: 2px solid #fff;
          border-radius: 6px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.3s ease;
          margin-top: auto;
        }
        .ct-support-card:hover .ct-support-card-btn { background: #fff; color: #8b5e3c; }

        /* ══ RESPONSIVE ══ */
        @media (max-width: 1080px) {
          .ct-offices-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .ct-quick-grid { grid-template-columns: 1fr; max-width: 480px; }
        }
        @media (max-width: 768px) {
          .ct-quick-title { font-size: 1.55rem; }
          .ct-form-section { padding: 120px 18px 72px; }
          .ct-form-section-title { font-size: 26px; }
          .ct-form-section-desc { font-size: 14px; margin-bottom: 36px; }
          .ct-form-card { padding: 32px 22px; }
          .ct-progress-line { width: 38px; }
          .ct-category-grid { grid-template-columns: 1fr; }
          .ct-category-card--centered { max-width: 100%; }
          .ct-form-row { grid-template-columns: 1fr; }
          .ct-support-grid { grid-template-columns: 1fr; max-width: 460px; }
          .ct-support-title { font-size: 24px; }
          .ct-offices-title { font-size: 1.55rem; }
        }
        @media (max-width: 560px) {
          .ct-offices-grid { grid-template-columns: 1fr; max-width: 400px; }
        }
      `}</style>

      {/* ══ MULTI-STEP FORM ══ */}
      <section className="ct-form-section">
        <h2 className="ct-form-section-title">Any Questions?</h2>
        <p className="ct-form-section-desc">
          Contact us today! With over 30 years of experience in the sauna industry, we are more than
          happy to assist you with any questions. Whether related to our products, finding your
          nearest SAWO distributor, or planning your custom sauna project, we have the answers you
          need. Please fill out the form below, and our team will get back to you shortly.
        </p>

        <div className="ct-form-wrapper">
          <div className="ct-form-card">
            {submitted ? (
              <div className="ct-success">
                <div className="ct-success-icon"><i className="fa-solid fa-check" /></div>
                <h3 className="ct-success-title">Request Submitted</h3>
                <p className="ct-success-msg">
                  Thank you for contacting us. We've received your request and our team will get
                  back to you shortly.
                </p>
                <div className="ct-success-actions">
                  <button className="ct-success-btn ct-success-btn--primary" onClick={resetForm}>
                    Submit Another Request
                  </button>
                  <Link to={menuPaths.home} className="ct-success-btn ct-success-btn--secondary">
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Progress */}
                <div className="ct-progress">
                  {[{ n: 1, label: "Your Request" }, { n: 2, label: "About You" }, { n: 3, label: "Request Details" }].map((s, i) => (
                    <React.Fragment key={s.n}>
                      {i > 0 && <div className={`ct-progress-line${step > i ? " filled" : ""}`} />}
                      <div className={`ct-progress-step ${stepState(s.n)}`}>
                        <div className="ct-step-circle">{s.n}</div>
                        <div className="ct-step-label">{s.label}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {/* Step 1 — category */}
                  {step === 1 && (
                    <div className="ct-fade">
                      <div className="ct-category-grid">
                        {CATEGORIES.map((c, i) => (
                          <div
                            key={c.value}
                            className={`ct-category-card${i === CATEGORIES.length - 1 ? " ct-category-card--centered" : ""}${category === c.value ? " selected" : ""}`}
                            onClick={() => pickCategory(c.value)}
                          >
                            <i className={c.icon} />
                            <div className="ct-category-title">{c.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2 — personal details */}
                  {step === 2 && (
                    <div className="ct-fade">
                      <div className="ct-section-heading">Personal Details</div>
                      <div className="ct-form-row">
                        <div className={`ct-form-group${errors.fname ? " error" : ""}`}>
                          <label htmlFor="ct-fname">First Name<span className="ct-req">*</span></label>
                          <input id="ct-fname" type="text" placeholder="John..." value={form.fname} onChange={e => setField("fname", e.target.value)} />
                          {fieldError("fname")}
                        </div>
                        <div className={`ct-form-group${errors.lname ? " error" : ""}`}>
                          <label htmlFor="ct-lname">Last Name<span className="ct-req">*</span></label>
                          <input id="ct-lname" type="text" placeholder="Doe..." value={form.lname} onChange={e => setField("lname", e.target.value)} />
                          {fieldError("lname")}
                        </div>
                      </div>
                      <div className="ct-form-row">
                        <div className={`ct-form-group${errors.email ? " error" : ""}`}>
                          <label htmlFor="ct-email">Email<span className="ct-req">*</span></label>
                          <input id="ct-email" type="email" placeholder="johndoe@gmail.com" value={form.email} onChange={e => setField("email", e.target.value)} />
                          {fieldError("email")}
                        </div>
                        <div className={`ct-form-group${errors.country ? " error" : ""}`}>
                          <label htmlFor="ct-country">Country<span className="ct-req">*</span></label>
                          <select id="ct-country" value={form.country} onChange={e => setField("country", e.target.value)}>
                            <option value="" disabled>Select a country</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          {fieldError("country")}
                        </div>
                      </div>
                      <div className="ct-form-group">
                        <label htmlFor="ct-phone">Phone Number <span className="ct-optional">(Optional)</span></label>
                        <input id="ct-phone" type="tel" value={form.phone} onChange={e => setField("phone", e.target.value)} />
                        <div className="ct-helper-text">
                          Providing a phone number is optional, but it can help us assist you more quickly.
                        </div>
                      </div>
                      <div className="ct-btn-group">
                        <button type="button" className="ct-btn" onClick={() => setStep(1)}>Go Back</button>
                        <button type="button" className="ct-btn" onClick={goNext}>Next Step</button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — request details */}
                  {step === 3 && (
                    <div className="ct-fade">
                      <div className="ct-section-heading">Request Details</div>

                      {/* Subject */}
                      {category === "general" ? (
                        <div className={`ct-form-group${errors.subject ? " error" : ""}`}>
                          <label htmlFor="ct-subject">Subject<span className="ct-req">*</span></label>
                          <input id="ct-subject" type="text" placeholder="Subject here..." value={form.subject} onChange={e => setField("subject", e.target.value)} />
                          {fieldError("subject")}
                        </div>
                      ) : (
                        <div className={`ct-form-group${errors.subject ? " error" : ""}`}>
                          <label htmlFor="ct-subject">Subject<span className="ct-req">*</span></label>
                          <select id="ct-subject" value={form.subject} onChange={e => setField("subject", e.target.value)}>
                            <option value="" disabled>Select an option</option>
                            {(category === "technical" ? TECHNICAL_SUBJECTS : CUSTOMER_SUBJECTS).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {fieldError("subject")}
                        </div>
                      )}

                      {/* Technical-only product fields */}
                      {category === "technical" && (
                        <>
                          <div className={`ct-form-group${errors.productCategory ? " error" : ""}`}>
                            <label htmlFor="ct-product-category">Product Category<span className="ct-req">*</span></label>
                            <select id="ct-product-category" value={form.productCategory} onChange={e => setField("productCategory", e.target.value)}>
                              <option value="" disabled>Select an option</option>
                              {PRODUCT_CATEGORIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            {fieldError("productCategory")}
                          </div>
                          <div className="ct-form-row">
                            <div className={`ct-form-group${errors.productName ? " error" : ""}`}>
                              <label htmlFor="ct-product-name">Product Name<span className="ct-req">*</span></label>
                              <input id="ct-product-name" type="text" placeholder="Nordex..." value={form.productName} onChange={e => setField("productName", e.target.value)} />
                              <div className="ct-helper-text">Sticker near the bottom of the heater</div>
                              {fieldError("productName")}
                            </div>
                            <div className={`ct-form-group${errors.productCode ? " error" : ""}`}>
                              <label htmlFor="ct-product-code">Product Code<span className="ct-req">*</span></label>
                              <input id="ct-product-code" type="text" placeholder="NRD-90NS..." value={form.productCode} onChange={e => setField("productCode", e.target.value)} />
                              {fieldError("productCode")}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Message */}
                      <div className={`ct-form-group${errors.message ? " error" : ""}`}>
                        <label htmlFor="ct-message">
                          {category === "technical" ? "Describe the issue in detail" : "Message"}
                          <span className="ct-req">*</span>
                        </label>
                        <textarea id="ct-message" value={form.message} onChange={e => setField("message", e.target.value)} />
                        <div className="ct-helper-text">The more information you share, the better we can help you</div>
                        {fieldError("message")}
                      </div>

                      <div className="ct-btn-group">
                        <button type="button" className="ct-btn" onClick={() => setStep(2)}>Go Back</button>
                        <button type="submit" className="ct-btn">Submit Request</button>
                      </div>
                    </div>
                  )}
                </form>

                <div className="ct-back-link">
                  Finished here? <Link to={menuPaths.home}>Back to Home</Link>
                </div>
              </>
            )}
          </div>
        </div>
        <HeroWave />
      </section>

      {/* ══ QUICK CONTACT STRIP ══ */}
      <section className="ct-quick-section">
        <div className="ct-quick-header">
          <div className="ct-quick-eyebrow">Reach Us Directly</div>
          <h2 className="ct-quick-title">Prefer a Faster Way?</h2>
        </div>
        <div className="ct-quick-grid">
          <div className="ct-quick-card">
            <div className="ct-quick-icon"><i className="fa-brands fa-whatsapp" /></div>
            <h3>Technical Support</h3>
            <p>For technical support and reclamations, message us on WhatsApp</p>
            <a href="https://wa.me/63949759450" target="_blank" rel="noopener noreferrer">
              +63 949 759 4450 <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }} />
            </a>
          </div>
          <div className="ct-quick-card">
            <div className="ct-quick-icon"><i className="fa-solid fa-envelope" /></div>
            <h3>Email Us</h3>
            <p>General inquiries and product questions</p>
            <a href="mailto:info@sawo.com">
              info@sawo.com <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }} />
            </a>
          </div>
          <div className="ct-quick-card">
            <div className="ct-quick-icon"><i className="fa-solid fa-headset" /></div>
            <h3>Help Desk</h3>
            <p>Need a hand with an existing product?</p>
            <a href="mailto:help@sawo.com">
              help@sawo.com <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }} />
            </a>
          </div>
        </div>
      </section>

      {/* ══ OFFICES ══ */}
      <section className="ct-offices-section">
        <div className="ct-offices-header">
          <div className="ct-offices-eyebrow">Around the World</div>
          <h2 className="ct-offices-title">Contact Representative Offices</h2>
        </div>
        <div className="ct-offices-grid">
          {OFFICES.map(office => (
            <div className="ct-office-card" key={office.name}>
              <div className="ct-office-img">
                <img src={office.image} alt={office.name} loading="lazy" />
              </div>
              <div className="ct-office-body">
                <h3 className="ct-office-name">{office.name}</h3>
                <p className="ct-office-role">{office.role}</p>
                <a
                  className="ct-office-address"
                  href={office.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {office.address[0]}<br />{office.address[1]}
                </a>
                <p className="ct-office-line">
                  <i className="fa-solid fa-phone" />{" "}
                  <a href={`tel:${office.telHref}`}>Tel: {office.tel}</a>
                </p>
                <p className="ct-office-line">
                  <i className="fa-solid fa-envelope" />{" "}
                  <a className="ct-office-email" href={`mailto:${office.email}`}>{office.email}</a>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SUPPORT CTAs ══ */}
      <section className="ct-support-section">
        <div className="ct-support-header">
          <h2 className="ct-support-title">Looking for Answers First?</h2>
          <p className="ct-support-desc">
            Many questions are already answered in our support resources — check them out before
            waiting for a reply.
          </p>
        </div>
        <div className="ct-support-grid">
          <Link to={menuPaths.support.faq} className="ct-support-card">
            <i className="fa-regular fa-circle-question" />
            <h3>Frequently Asked Questions</h3>
            <p>Browse answers to the most common questions about our heaters, controls, and sauna rooms.</p>
            <span className="ct-support-card-btn">
              See FAQ <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.65rem", margin: 0 }} />
            </span>
          </Link>
          <Link to={menuPaths.support.manuals} className="ct-support-card">
            <i className="fa-solid fa-book-open" />
            <h3>User Manuals</h3>
            <p>Installation guides, operating manuals, and technical documentation for every SAWO product.</p>
            <span className="ct-support-card-btn">
              View Manuals <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.65rem", margin: 0 }} />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Contact;
