// src/pages/Contact/Contact.jsx
// Redesigned contact page: hero, 3-step request form (Your Request → About You →
// Request Details), representative offices with photos, and internal CTAs to
// FAQ and User Manuals.

import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import menuPaths from "../../menuPaths";
import HeroWave from "../../components/HeroWave";
import SEO from "../../components/SEO";
import woodBg from "../../assets/SaunaCalculator-bg.webp";
import officeSawoInc from "../../assets/Contact/offices/sawo-inc-plant.webp";
import officeSawoNordic from "../../assets/Contact/offices/sawo-nordic.webp";
import officeFem from "../../assets/Contact/offices/fem-cable-tower.webp";
import officeEuropeHub from "../../assets/Contact/offices/sawo-europe-hub.webp";
import { SEND_EMAIL_URL, ODOO_TICKET_URL } from "../../config/contactFormApi";
import { useLocale, useLocaleT, useLocalizedPath } from "../../i18n/LocaleContext";

// ─── Office data ──────────────────────────────────────────────────────────────
// `name`/address/tel/email are real-world data (company names, addresses,
// phone numbers) and stay as-is in every locale — only `roleKey` (looked up
// via t(`offices.list.${roleKey}.role`)) is translated.
const OFFICES = [
  {
    roleKey: "sawoInc",
    name: "SAWO Inc.",
    image: officeSawoInc,
    address: ["Mactan Economic Zone 2, Mactan,", "Cebu 6015, Philippines"],
    mapUrl: "https://www.google.com/maps/place/SAWO+Inc./@10.2908545,123.9474748,20678m/data=!3m1!1e3!4m6!3m5!1s0x33a999f9aaaaaaab:0x638e93b7abe9d209!8m2!3d10.3065109!4d123.9662661!16s%2Fg%2F11xbg6w1q",
    tel: "+63 32 341 2233",
    telHref: "+63323412233",
    email: "info@sawo.com",
  },
  {
    roleKey: "sawoNordic",
    name: "SAWO Nordic Oy",
    image: officeSawoNordic,
    address: ["Hampuntie 18, 36220 Kangasala,", "Finland"],
    mapUrl: "https://www.google.com/maps/place/Sawo+Nordic+Oy/@61.4682459,23.8889861,40152m/data=!3m1!1e3!4m6!3m5!1s0x468f1ff184c90c83:0xe1681d5d0909096b!8m2!3d61.4996934!4d23.7501876!16s%2Fg%2F1q675ymsx",
    tel: "+358 40 038 3265",
    telHref: "+358400383265",
    email: "finland@sawo.com",
  },
  {
    roleKey: "fem",
    name: "F.E.M. Ltd",
    image: officeFem,
    address: ["2302, 23rd Floor, Cable TV Tower 9", "Hoi Shing Road, Tsuen Wan, Hong Kong"],
    mapUrl: "https://www.google.com/maps/place/Cable+T+V+Tower,+9+Hoi+Shing+Rd,+Chai+Wan+Kok,+Hong+Kong/@22.3720256,114.1051012,1215m/data=!3m1!1e3!4m6!3m5!1s0x3403f8e56f3381c9:0xbdbb69dc3fa013e4!8m2!3d22.3727747!4d114.1073972!16s%2Fg%2F12j799c55",
    tel: "+852 2417 1188",
    telHref: "+85224171188",
    email: "hongkong@sawo.com",
  },
  {
    roleKey: "europeHub",
    name: "SAWO Sauna Europe Hub B.V.",
    image: officeEuropeHub,
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

// `value` is the literal string sent to the backend (email/Odoo ticket
// payload) and must stay in English regardless of locale — only
// `labelKey` (looked up in the matching t() namespace) is translated.
const CATEGORIES = [
  { value: "technical", labelKey: "technical", icon: "fa-solid fa-wrench" },
  { value: "customer",  labelKey: "customer",  icon: "fa-solid fa-headphones" },
  { value: "general",   labelKey: "general",   icon: "fa-regular fa-comment" },
];

// Technical "Request Repair" and "Request Spare Parts" intentionally share the same
// underlying subject value — mirrors the original WordPress form's field logic.
const TECHNICAL_SUBJECTS = [
  { labelKey: "requestRepair", value: "Repair Inquiry" },
  { labelKey: "requestSpareParts", value: "Repair Inquiry" },
  { labelKey: "requestReplacement", value: "Replacement Request" },
];
const CUSTOMER_SUBJECTS = [
  { labelKey: "customerSupport", value: "Customer Support" },
  { labelKey: "feedback", value: "Feedback" },
  { labelKey: "orderStatus", value: "Order Status" },
  { labelKey: "warrantyClaims", value: "Purchase Inquiry" },
  { labelKey: "other", value: "Other" },
];
const PRODUCT_CATEGORIES = [
  { value: "Heater", labelKey: "heater" },
  { value: "Steam Generator", labelKey: "steamGenerator" },
  { value: "Accessory", labelKey: "accessory" },
  { value: "Kivistone Item", labelKey: "kivistoneItem" },
];
const ISSUE_OPTIONS = [
  { value: "An Error is Displayed", labelKey: "errorDisplayed" },
  { value: "Display is Blank or Only Dashline", labelKey: "blankDisplay" },
  { value: "Does Not Turn On", labelKey: "notTurnOn" },
  { value: "Flashing LED Light", labelKey: "flashingLed" },
  { value: "Heater Does Not Heat Up", labelKey: "notHeat" },
  { value: "Other", labelKey: "other" },
];

// Standalone react_helpdeskapi backend (React's own — see src/config/contactFormApi.js).
// The WordPress form still uses a separate, untouched helpdeskapi backend.

const EMPTY_FORM = {
  fname: "", lname: "", email: "", country: "", phone: "",
  subject: "", message: "",
  productCategory: "", productName: "", productCode: "",
  serialNumber: "", purchaseInvoice: "", issue: "", addProductInfo: "",
  orderNumber: "", width: "", depth: "", height: "",
  website_url: "", // honeypot — must stay empty
};

// ─── Component ────────────────────────────────────────────────────────────────
const Contact = () => {
  const locale = useLocale();
  const t = useLocaleT("contact");
  const localize = useLocalizedPath();
  const countries = t("countries", { returnObjects: true });
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [toast, setToast] = useState({ show: false, title: "", details: "" });

  // Warn on tab close/reload while a submission is in flight — the fetches
  // below use keepalive so the request itself still completes, but the user
  // should know leaving means they won't see the result.
  useEffect(() => {
    if (!submitting) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [submitting]);

  // Bot protection — mirrors the WordPress form's honeypot + timing + interaction-count check.
  const formStartTimeRef = useRef(Date.now());
  const interactionCountRef = useRef(0);
  const bumpInteraction = () => { interactionCountRef.current += 1; };

  useEffect(() => {
    if (step === 1) {
      formStartTimeRef.current = Date.now();
      interactionCountRef.current = 0;
    }
  }, [step]);

  // Pre-fill from the sauna room configurator's "Customize My Sauna" link and show the add-on toast.
  // Trigger on `subject` alone — `subject` is only ever set by the configurator
  // link in the first place, so requiring a separate `addon_saved=1` flag on
  // top of it was redundant, and meant the toast silently never fired for any
  // link that only carried `subject` (e.g. one copied/shared without the
  // second param).
  useEffect(() => {
    const urlSubject = searchParams.get("subject");
    if (!urlSubject) return;

    setCategory("general");
    setForm(prev => ({ ...prev, subject: urlSubject }));
    setStep(2);

    const details = urlSubject
      .split(" | ")
      .map(p => p.trim())
      .filter(p => /^Heater:/i.test(p) || /^Accessories:/i.test(p));
    const showTimer = setTimeout(() => {
      setToast({
        show: true,
        title: t("toast.addonSaved"),
        details: details.join(" · "),
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    }, 600);
    return () => clearTimeout(showTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (name, value) => {
    bumpInteraction();
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const pickCategory = (value) => {
    bumpInteraction();
    setCategory(value);
    // Subject and dynamic fields differ per category — clear when switching
    setForm(prev => ({
      ...EMPTY_FORM,
      fname: prev.fname, lname: prev.lname, email: prev.email,
      country: prev.country, phone: prev.phone,
    }));
    setStep(2);
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.fname.trim()) e.fname = t("validation.required");
    if (!form.lname.trim()) e.lname = t("validation.required");
    if (!form.email.trim()) e.email = t("validation.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t("validation.invalidEmail");
    if (!form.country) e.country = t("validation.selectCountry");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const showsSaunaSize = form.productCategory === "Heater" || form.productCategory === "Steam Generator";

  const validateStep3 = () => {
    const e = {};

    if (category === "general") {
      if (!form.subject.trim()) e.subject = t("validation.required");
      if (!form.message.trim()) e.message = t("validation.required");
      setErrors(e);
      return Object.keys(e).length === 0;
    }

    if (!form.subject) e.subject = t("validation.selectOption");

    if (category === "technical" && form.subject) {
      if (!form.productCategory) e.productCategory = t("validation.selectOption");
      if (!form.productName.trim()) e.productName = t("validation.required");
      if (!form.productCode.trim()) e.productCode = t("validation.required");
      if (form.subject === "Replacement Request") {
        if (!/^\d{6}$/.test(form.serialNumber.trim())) e.serialNumber = t("validation.serialDigits");
        if (!form.purchaseInvoice.trim()) e.purchaseInvoice = t("validation.required");
        if (!form.issue) e.issue = t("validation.selectOption");
      }
    }

    if (category === "customer") {
      if (form.subject === "Order Status") {
        if (!form.orderNumber.trim()) e.orderNumber = t("validation.required");
      } else if (form.subject === "Purchase Inquiry") {
        if (!form.productCategory) e.productCategory = t("validation.selectOption");
        if (form.productCategory) {
          if (!form.productName.trim()) e.productName = t("validation.required");
          if (!/^\d{6}$/.test(form.serialNumber.trim())) e.serialNumber = t("validation.serialDigits");
          if (!form.productCode.trim()) e.productCode = t("validation.required");
          if (!form.purchaseInvoice.trim()) e.purchaseInvoice = t("validation.required");
          if (!form.issue) e.issue = t("validation.selectOption");
        }
      } else if (form.subject && form.productCategory) {
        if (!form.productName.trim()) e.productName = t("validation.required");
        if (!form.productCode.trim()) e.productCode = t("validation.required");
        if (form.subject === "Customer Support") {
          if (!/^\d{6}$/.test(form.serialNumber.trim())) e.serialNumber = t("validation.serialDigits");
          if (!form.purchaseInvoice.trim()) e.purchaseInvoice = t("validation.required");
          if (!form.issue) e.issue = t("validation.selectOption");
        }
      }
    }

    if (category !== "general" && !form.message.trim()) e.message = t("validation.required");

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const checkForBot = () => {
    if (form.website_url) return "honeypot";
    const timeSpent = (Date.now() - formStartTimeRef.current) / 1000;
    if (timeSpent < 5) return "too_fast";
    if (interactionCountRef.current < 8) return "no_interaction";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    const botResult = checkForBot();
    if (botResult === "honeypot") {
      // Silently pretend success — don't tip off the bot
      setSubmitted(true);
      return;
    }
    if (botResult) {
      setSubmitError(
        botResult === "too_fast"
          ? t("validation.tooFast")
          : t("validation.incomplete")
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    // Shared field set both PHP endpoints (and the Supabase log) expect —
    // field names match what indxe.php/send.php were already built against.
    const sharedPayload = {
      fname: form.fname,
      lname: form.lname,
      email: form.email,
      phone: form.phone,
      country: form.country,
      category,
      subject: form.subject,
      message: form.message,
      describeIssue: form.message, // indxe.php requires this exact key for its ticket description
      productCategory: form.productCategory,
      productName: form.productName,
      productCode: form.productCode,
      serialNumber: form.serialNumber,
      purchaseInvoice: form.purchaseInvoice,
      issue: form.issue,
      addProductInfo: form.addProductInfo,
      orderNumber: form.orderNumber,
      width: form.width,
      depth: form.depth,
      height: form.height,
    };

    // keepalive lets these requests finish server-side even if the tab closes
    // or reloads mid-flight — same reasoning as the sendBeacon call in
    // src/local-storage/track.js. The UI obviously can't update after the
    // page is gone, but the email/ticket won't be silently dropped.
    const postJson = (url, payload) =>
      fetch(url, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

    const [emailResult, odooResult] = await Promise.allSettled([
      postJson(SEND_EMAIL_URL, sharedPayload),
      postJson(ODOO_TICKET_URL, sharedPayload),
    ]);

    const emailSuccess = emailResult.status === "fulfilled" && emailResult.value?.success === true;
    const odooSuccess = odooResult.status === "fulfilled" && odooResult.value?.success === true;
    const odooTicketId = odooSuccess ? odooResult.value?.ticket?.result ?? null : null;
    const odooError = odooResult.status === "fulfilled"
      ? odooResult.value?.error ?? null
      : odooResult.reason?.message ?? "Request failed";

    // Best-effort inbox log — never let a Supabase hiccup block the user-facing result.
    try {
      const { getSupabase } = await import("../../local-storage/supabaseClient");
      const supabase = await getSupabase();
      await supabase.from("contact_submissions").insert({
        category,
        subject: form.subject,
        fname: form.fname,
        lname: form.lname,
        email: form.email,
        phone: form.phone,
        country: form.country,
        message: form.message,
        product_category: form.productCategory,
        product_name: form.productName,
        product_code: form.productCode,
        serial_number: form.serialNumber,
        purchase_invoice: form.purchaseInvoice,
        issue: form.issue,
        add_product_info: form.addProductInfo,
        order_number: form.orderNumber,
        room_width: form.width,
        room_depth: form.depth,
        room_height: form.height,
        email_sent: emailSuccess,
        odoo_success: odooSuccess,
        odoo_ticket_id: odooTicketId ? String(odooTicketId) : null,
        odoo_error: odooSuccess ? null : odooError,
      });
    } catch (logErr) {
      // Non-fatal — the email/Odoo outcome still governs what the user sees.
    }

    if (emailSuccess) {
      setSubmitted(true);
      setToast({ show: true, title: t("toast.submitted"), details: "" });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    } else {
      setSubmitError(t("validation.submitError"));
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setCategory("");
    setErrors({});
    setStep(1);
    setSubmitted(false);
    setSubmitError("");
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
      <SEO
        title="Contact Us"
        rawTitle={locale === "en" ? undefined : t("meta.title")}
        description={t("meta.description")}
        path="/contact"
      />
      <div id="sawoContactToast" className={toast.show ? "show" : ""} role="status" aria-live="polite">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>
          <span className="toast-title">{toast.title}</span>
          {toast.details && <span className="toast-details">{toast.details}</span>}
        </span>
      </div>
      <style>{`

        /* Shared fine-grain texture that gives the cards a subtle material feel */
        :root {
          --ct-grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='ctn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23ctn)' opacity='0.05'/%3E%3C/svg%3E");
        }

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
          position: relative;
          background-color: #faf8f6;
          background-image: var(--ct-grain);
          border-radius: 10px;
          padding: 45px 40px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.95),
            inset 0 -1px 0 rgba(120,90,66,0.09),
            0 12px 40px rgba(0,0,0,0.35);
        }
        .ct-form-fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
        .ct-form-fieldset:disabled { opacity: 0.55; pointer-events: none; }

        .ct-submit-overlay {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
          background: rgba(250, 248, 246, 0.94);
          backdrop-filter: blur(2px);
          border-radius: 10px;
          animation: ctFadeIn 0.25s ease;
        }
        .ct-submit-spinner {
          width: 46px;
          height: 46px;
          border: 4px solid rgba(175,133,100,0.25);
          border-top-color: #af8564;
          border-radius: 50%;
          margin-bottom: 18px;
          animation: ctSpin 0.8s linear infinite;
        }
        .ct-submit-overlay-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #333;
          margin: 0 0 8px;
        }
        .ct-submit-overlay-sub {
          font-family: 'Montserrat', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #777;
          margin: 0;
          max-width: 320px;
          line-height: 1.5;
        }
        @keyframes ctSpin { to { transform: rotate(360deg); } }
        .ct-back-link-disabled { color: #bbb; cursor: not-allowed; }

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
          background-color: #ffffff;
          background-image: var(--ct-grain);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -2px 3px rgba(120,90,66,0.07),
            0 2px 3px rgba(90,63,42,0.07);
        }
        .ct-category-card:hover {
          border-color: #af8564;
          transform: translateY(-2px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -2px 3px rgba(120,90,66,0.08),
            0 6px 12px rgba(175,133,100,0.2);
        }
        .ct-category-card.selected {
          border-color: #af8564;
          background-color: #af8564;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.28),
            inset 0 -2px 4px rgba(80,52,32,0.22),
            0 3px 6px rgba(139,94,60,0.22);
        }
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
        .ct-dimensions-group {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .ct-honeypot {
          position: absolute;
          left: -9999px;
          top: -9999px;
          opacity: 0;
          pointer-events: none;
        }
        .ct-form-error-msg {
          margin-top: 20px;
          padding: 14px;
          border-radius: 6px;
          text-align: center;
          font-size: 14px;
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #f87171;
        }

        /* Add-on toast (fired from the sauna room configurator) */
        #sawoContactToast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: linear-gradient(135deg, #af8564 0%, #8b6b52 100%);
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 14px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.22);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s ease, transform 0.35s ease;
          z-index: 99999;
          max-width: 420px;
        }
        #sawoContactToast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        #sawoContactToast svg { flex-shrink: 0; width: 18px; height: 18px; margin-top: 2px; }
        #sawoContactToast .toast-title { display: block; margin-bottom: 4px; }
        #sawoContactToast .toast-details {
          display: block;
          font-size: 12px;
          font-weight: 400;
          opacity: 0.88;
          line-height: 1.5;
        }
        @media (max-width: 480px) {
          #sawoContactToast { font-size: 13px; padding: 12px 16px; max-width: 92vw; }
        }

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
          background-color: #fff;
          background-image: var(--ct-grain);
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid rgba(175,133,100,0.18);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -2px 4px rgba(120,90,66,0.06),
            0 3px 6px rgba(90,63,42,0.08);
        }
        .ct-office-card:hover {
          transform: translateY(-6px);
          border-color: #af8564;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -2px 4px rgba(120,90,66,0.07),
            0 18px 44px rgba(139,94,60,0.2);
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
          background-color: rgba(255,255,255,0.06);
          background-image: var(--ct-grain);
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
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.2),
            inset 0 -2px 4px rgba(0,0,0,0.16),
            0 4px 10px rgba(0,0,0,0.14);
        }
        .ct-support-card:hover {
          background-color: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.5);
          transform: translateY(-5px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.26),
            inset 0 -2px 4px rgba(0,0,0,0.16),
            0 12px 26px rgba(0,0,0,0.2);
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
        <h2 className="ct-form-section-title">{t("hero.title")}</h2>
        <p className="ct-form-section-desc">{t("hero.desc")}</p>

        <div className="ct-form-wrapper">
          <div className="ct-form-card">
            {submitted ? (
              <div className="ct-success">
                <div className="ct-success-icon"><i className="fa-solid fa-check" /></div>
                <h3 className="ct-success-title">{t("success.title")}</h3>
                <p className="ct-success-msg">{t("success.message")}</p>
                <div className="ct-success-actions">
                  <button className="ct-success-btn ct-success-btn--primary" onClick={resetForm}>
                    {t("success.another")}
                  </button>
                  <Link to={localize(menuPaths.home)} className="ct-success-btn ct-success-btn--secondary">
                    {t("success.backHome")}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {submitting && (
                  <div className="ct-submit-overlay" role="status" aria-live="polite">
                    <div className="ct-submit-spinner" />
                    <p className="ct-submit-overlay-title">{t("submittingOverlay.title")}</p>
                    <p className="ct-submit-overlay-sub">{t("submittingOverlay.sub")}</p>
                  </div>
                )}
                {/* Progress */}
                <div className="ct-progress">
                  {[{ n: 1, label: t("steps.1") }, { n: 2, label: t("steps.2") }, { n: 3, label: t("steps.3") }].map((s, i) => (
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
                <fieldset className="ct-form-fieldset" disabled={submitting}>
                  <div className="ct-honeypot">
                    <label htmlFor="ct-website">Website</label>
                    <input
                      type="text"
                      id="ct-website"
                      tabIndex="-1"
                      autoComplete="off"
                      value={form.website_url}
                      onChange={e => setForm(prev => ({ ...prev, website_url: e.target.value }))}
                    />
                  </div>
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
                            <div className="ct-category-title">{t(`categories.${c.labelKey}`)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2 — personal details */}
                  {step === 2 && (
                    <div className="ct-fade">
                      <div className="ct-section-heading">{t("step2.heading")}</div>
                      <div className="ct-form-row">
                        <div className={`ct-form-group${errors.fname ? " error" : ""}`}>
                          <label htmlFor="ct-fname">{t("step2.firstName")}<span className="ct-req">*</span></label>
                          <input id="ct-fname" type="text" placeholder={t("step2.firstNamePlaceholder")} value={form.fname} onChange={e => setField("fname", e.target.value)} />
                          {fieldError("fname")}
                        </div>
                        <div className={`ct-form-group${errors.lname ? " error" : ""}`}>
                          <label htmlFor="ct-lname">{t("step2.lastName")}<span className="ct-req">*</span></label>
                          <input id="ct-lname" type="text" placeholder={t("step2.lastNamePlaceholder")} value={form.lname} onChange={e => setField("lname", e.target.value)} />
                          {fieldError("lname")}
                        </div>
                      </div>
                      <div className="ct-form-row">
                        <div className={`ct-form-group${errors.email ? " error" : ""}`}>
                          <label htmlFor="ct-email">{t("step2.email")}<span className="ct-req">*</span></label>
                          <input id="ct-email" type="email" placeholder={t("step2.emailPlaceholder")} value={form.email} onChange={e => setField("email", e.target.value)} />
                          {fieldError("email")}
                        </div>
                        <div className={`ct-form-group${errors.country ? " error" : ""}`}>
                          <label htmlFor="ct-country">{t("step2.country")}<span className="ct-req">*</span></label>
                          <select id="ct-country" value={form.country} onChange={e => setField("country", e.target.value)}>
                            <option value="" disabled>{t("step2.selectCountry")}</option>
                            {COUNTRIES.map((c, i) => <option key={c} value={c}>{countries[i] || c}</option>)}
                          </select>
                          {fieldError("country")}
                        </div>
                      </div>
                      <div className="ct-form-group">
                        <label htmlFor="ct-phone">{t("step2.phone")} <span className="ct-optional">{t("step2.optional")}</span></label>
                        <input id="ct-phone" type="tel" value={form.phone} onChange={e => setField("phone", e.target.value)} />
                        <div className="ct-helper-text">{t("step2.phoneHelp")}</div>
                      </div>
                      <div className="ct-btn-group">
                        <button type="button" className="ct-btn" onClick={() => setStep(1)}>{t("step2.goBack")}</button>
                        <button type="button" className="ct-btn" onClick={goNext}>{t("step2.nextStep")}</button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — request details */}
                  {step === 3 && (
                    <div className="ct-fade">
                      <div className="ct-section-heading">{t("step3.heading")}</div>

                      {category === "general" && (
                        <>
                          <div className={`ct-form-group${errors.subject ? " error" : ""}`}>
                            <label htmlFor="ct-subject">{t("step3.subject")}<span className="ct-req">*</span></label>
                            <input id="ct-subject" type="text" placeholder={t("step3.subjectPlaceholder")} value={form.subject} onChange={e => setField("subject", e.target.value)} />
                            {fieldError("subject")}
                          </div>
                          <div className={`ct-form-group${errors.message ? " error" : ""}`}>
                            <label htmlFor="ct-message">{t("step3.message")}<span className="ct-req">*</span></label>
                            <textarea id="ct-message" value={form.message} onChange={e => setField("message", e.target.value)} />
                            <div className="ct-helper-text">{t("step3.moreInfoLong")}</div>
                            {fieldError("message")}
                          </div>
                        </>
                      )}

                      {category === "technical" && (
                        <>
                          <div className={`ct-form-group${errors.subject ? " error" : ""}`}>
                            <label htmlFor="ct-subject">{t("step3.subject")}<span className="ct-req">*</span></label>
                            <select id="ct-subject" value={form.subject} onChange={e => setField("subject", e.target.value)}>
                              <option value="" disabled>{t("step3.selectOption")}</option>
                              {TECHNICAL_SUBJECTS.map((s, i) => <option key={i} value={s.value}>{t(`technicalSubjects.${s.labelKey}`)}</option>)}
                            </select>
                            {fieldError("subject")}
                          </div>

                          {form.subject && (
                            <>
                              <div className={`ct-form-group${errors.productCategory ? " error" : ""}`}>
                                <label htmlFor="ct-product-category">{t("step3.productCategory")}<span className="ct-req">*</span></label>
                                <select id="ct-product-category" value={form.productCategory} onChange={e => setField("productCategory", e.target.value)}>
                                  <option value="" disabled>{t("step3.selectOption")}</option>
                                  {PRODUCT_CATEGORIES.map(p => <option key={p.value} value={p.value}>{t(`productCategories.${p.labelKey}`)}</option>)}
                                </select>
                                {fieldError("productCategory")}
                              </div>

                              <div className="ct-form-row">
                                <div className={`ct-form-group${errors.productName ? " error" : ""}`}>
                                  <label htmlFor="ct-product-name">{t("step3.productName")}<span className="ct-req">*</span></label>
                                  <input id="ct-product-name" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productName} onChange={e => setField("productName", e.target.value)} />
                                  {form.subject === "Replacement Request" && <div className="ct-helper-text">{t("step3.stickerHelp")}</div>}
                                  {fieldError("productName")}
                                </div>
                                {form.subject === "Replacement Request" ? (
                                  <div className={`ct-form-group${errors.serialNumber ? " error" : ""}`}>
                                    <label htmlFor="ct-serial">{t("step3.serialNumber")}<span className="ct-req">*</span></label>
                                    <input id="ct-serial" type="text" maxLength={6} placeholder={t("step3.serialPlaceholder")} value={form.serialNumber} onChange={e => setField("serialNumber", e.target.value)} />
                                    <div className="ct-helper-text">{t("step3.serialHelp")}</div>
                                    {fieldError("serialNumber")}
                                  </div>
                                ) : (
                                  <div className={`ct-form-group${errors.productCode ? " error" : ""}`}>
                                    <label htmlFor="ct-product-code">{t("step3.productCode")}<span className="ct-req">*</span></label>
                                    <input id="ct-product-code" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productCode} onChange={e => setField("productCode", e.target.value)} />
                                    {fieldError("productCode")}
                                  </div>
                                )}
                              </div>

                              {form.subject === "Replacement Request" && (
                                <>
                                  <div className="ct-form-row">
                                    <div className={`ct-form-group${errors.productCode ? " error" : ""}`}>
                                      <label htmlFor="ct-product-code-2">{t("step3.productCode")}<span className="ct-req">*</span></label>
                                      <input id="ct-product-code-2" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productCode} onChange={e => setField("productCode", e.target.value)} />
                                      {fieldError("productCode")}
                                    </div>
                                    <div className={`ct-form-group${errors.purchaseInvoice ? " error" : ""}`}>
                                      <label htmlFor="ct-invoice">{t("step3.purchaseInvoice")}<span className="ct-req">*</span></label>
                                      <input id="ct-invoice" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.purchaseInvoice} onChange={e => setField("purchaseInvoice", e.target.value)} />
                                      {fieldError("purchaseInvoice")}
                                    </div>
                                  </div>

                                  <div className={`ct-form-group${errors.issue ? " error" : ""}`}>
                                    <label htmlFor="ct-issue">{t("step3.issue")}<span className="ct-req">*</span></label>
                                    <select id="ct-issue" value={form.issue} onChange={e => setField("issue", e.target.value)}>
                                      <option value="" disabled>{t("step3.selectOption")}</option>
                                      {ISSUE_OPTIONS.map(i => <option key={i.value} value={i.value}>{t(`issues.${i.labelKey}`)}</option>)}
                                    </select>
                                    {fieldError("issue")}
                                  </div>

                                  {showsSaunaSize && (
                                    <div className="ct-form-group">
                                      <label>{t("step3.saunaRoomSize")} <span className="ct-optional">{t("step2.optional")}</span></label>
                                      <div className="ct-dimensions-group">
                                        <input type="number" step="0.01" placeholder={t("step3.width")} value={form.width} onChange={e => setField("width", e.target.value)} />
                                        <input type="number" step="0.01" placeholder={t("step3.depth")} value={form.depth} onChange={e => setField("depth", e.target.value)} />
                                        <input type="number" step="0.01" placeholder={t("step3.height")} value={form.height} onChange={e => setField("height", e.target.value)} />
                                      </div>
                                    </div>
                                  )}

                                  <div className="ct-form-group">
                                    <label htmlFor="ct-addinfo">{t("step3.addlInfo")} <span className="ct-optional">{t("step2.optional")}</span></label>
                                    <input id="ct-addinfo" type="text" placeholder={t("step3.addlInfoPlaceholder")} value={form.addProductInfo} onChange={e => setField("addProductInfo", e.target.value)} />
                                  </div>
                                </>
                              )}

                              <div className={`ct-form-group${errors.message ? " error" : ""}`}>
                                <label htmlFor="ct-message">
                                  {form.subject === "Replacement Request" ? t("step3.describeIssueInDetail") : t("step3.description")}
                                  <span className="ct-req">*</span>
                                </label>
                                <textarea id="ct-message" value={form.message} onChange={e => setField("message", e.target.value)} />
                                {form.subject !== "Replacement Request" && <div className="ct-helper-text">{t("step3.moreInfoShort")}</div>}
                                {fieldError("message")}
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {category === "customer" && (
                        <>
                          <div className={`ct-form-group${errors.subject ? " error" : ""}`}>
                            <label htmlFor="ct-subject">{t("step3.subject")}<span className="ct-req">*</span></label>
                            <select id="ct-subject" value={form.subject} onChange={e => setField("subject", e.target.value)}>
                              <option value="" disabled>{t("step3.selectOption")}</option>
                              {CUSTOMER_SUBJECTS.map(s => <option key={s.labelKey} value={s.value}>{t(`customerSubjects.${s.labelKey}`)}</option>)}
                            </select>
                            {fieldError("subject")}
                          </div>

                          {form.subject === "Order Status" && (
                            <>
                              <div className={`ct-form-group${errors.orderNumber ? " error" : ""}`}>
                                <label htmlFor="ct-order">{t("step3.orderNumber")}<span className="ct-req">*</span></label>
                                <input id="ct-order" type="text" placeholder={t("step3.orderNumberPlaceholder")} value={form.orderNumber} onChange={e => setField("orderNumber", e.target.value)} />
                                {fieldError("orderNumber")}
                              </div>
                              <div className={`ct-form-group${errors.message ? " error" : ""}`}>
                                <label htmlFor="ct-message">{t("step3.message")}<span className="ct-req">*</span></label>
                                <textarea id="ct-message" placeholder={t("step3.describeOrderInquiry")} value={form.message} onChange={e => setField("message", e.target.value)} />
                                <div className="ct-helper-text">{t("step3.moreInfoLong")}</div>
                                {fieldError("message")}
                              </div>
                            </>
                          )}

                          {form.subject === "Purchase Inquiry" && (
                            <>
                              <div className={`ct-form-group${errors.productCategory ? " error" : ""}`}>
                                <label htmlFor="ct-product-category">{t("step3.productCategory")}<span className="ct-req">*</span></label>
                                <select id="ct-product-category" value={form.productCategory} onChange={e => setField("productCategory", e.target.value)}>
                                  <option value="" disabled>{t("step3.selectOption")}</option>
                                  {PRODUCT_CATEGORIES.map(p => <option key={p.value} value={p.value}>{t(`productCategories.${p.labelKey}`)}</option>)}
                                </select>
                                {fieldError("productCategory")}
                              </div>

                              {form.productCategory && (
                                <>
                                  <div className="ct-form-row">
                                    <div className={`ct-form-group${errors.productName ? " error" : ""}`}>
                                      <label htmlFor="ct-product-name">{t("step3.productName")}<span className="ct-req">*</span></label>
                                      <input id="ct-product-name" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productName} onChange={e => setField("productName", e.target.value)} />
                                      <div className="ct-helper-text">{t("step3.stickerHelp")}</div>
                                      {fieldError("productName")}
                                    </div>
                                    <div className={`ct-form-group${errors.serialNumber ? " error" : ""}`}>
                                      <label htmlFor="ct-serial">{t("step3.serialNumber")}<span className="ct-req">*</span></label>
                                      <input id="ct-serial" type="text" maxLength={6} placeholder={t("step3.serialPlaceholder")} value={form.serialNumber} onChange={e => setField("serialNumber", e.target.value)} />
                                      <div className="ct-helper-text">{t("step3.serialHelp")}</div>
                                      {fieldError("serialNumber")}
                                    </div>
                                  </div>
                                  <div className="ct-form-row">
                                    <div className={`ct-form-group${errors.productCode ? " error" : ""}`}>
                                      <label htmlFor="ct-product-code">{t("step3.productCode")}<span className="ct-req">*</span></label>
                                      <input id="ct-product-code" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productCode} onChange={e => setField("productCode", e.target.value)} />
                                      {fieldError("productCode")}
                                    </div>
                                    <div className={`ct-form-group${errors.purchaseInvoice ? " error" : ""}`}>
                                      <label htmlFor="ct-invoice">{t("step3.purchaseInvoice")}<span className="ct-req">*</span></label>
                                      <input id="ct-invoice" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.purchaseInvoice} onChange={e => setField("purchaseInvoice", e.target.value)} />
                                      {fieldError("purchaseInvoice")}
                                    </div>
                                  </div>
                                  <div className={`ct-form-group${errors.issue ? " error" : ""}`}>
                                    <label htmlFor="ct-issue">{t("step3.issue")}<span className="ct-req">*</span></label>
                                    <select id="ct-issue" value={form.issue} onChange={e => setField("issue", e.target.value)}>
                                      <option value="" disabled>{t("step3.selectOption")}</option>
                                      {ISSUE_OPTIONS.map(i => <option key={i.value} value={i.value}>{t(`issues.${i.labelKey}`)}</option>)}
                                    </select>
                                    {fieldError("issue")}
                                  </div>
                                  {showsSaunaSize && (
                                    <div className="ct-form-group">
                                      <label>{t("step3.saunaRoomSize")} <span className="ct-optional">{t("step2.optional")}</span></label>
                                      <div className="ct-dimensions-group">
                                        <input type="number" step="0.01" placeholder={t("step3.width")} value={form.width} onChange={e => setField("width", e.target.value)} />
                                        <input type="number" step="0.01" placeholder={t("step3.depth")} value={form.depth} onChange={e => setField("depth", e.target.value)} />
                                        <input type="number" step="0.01" placeholder={t("step3.height")} value={form.height} onChange={e => setField("height", e.target.value)} />
                                      </div>
                                    </div>
                                  )}
                                  <div className="ct-form-group">
                                    <label htmlFor="ct-addinfo">{t("step3.addlInfo")} <span className="ct-optional">{t("step2.optional")}</span></label>
                                    <input id="ct-addinfo" type="text" placeholder={t("step3.addlInfoPlaceholderGeneric")} value={form.addProductInfo} onChange={e => setField("addProductInfo", e.target.value)} />
                                  </div>
                                </>
                              )}

                              <div className={`ct-form-group${errors.message ? " error" : ""}`}>
                                <label htmlFor="ct-message">{t("step3.message")}<span className="ct-req">*</span></label>
                                <textarea id="ct-message" placeholder={t("step3.describeWarrantyInquiry")} value={form.message} onChange={e => setField("message", e.target.value)} />
                                <div className="ct-helper-text">{t("step3.moreInfoLong")}</div>
                                {fieldError("message")}
                              </div>
                            </>
                          )}

                          {form.subject && form.subject !== "Order Status" && form.subject !== "Purchase Inquiry" && (
                            <>
                              <div className="ct-form-group">
                                <label htmlFor="ct-product-category">{t("step3.productCategory")} <span className="ct-optional">{t("step2.optional")}</span></label>
                                <select id="ct-product-category" value={form.productCategory} onChange={e => setField("productCategory", e.target.value)}>
                                  <option value="">{t("step3.notProductRelated")}</option>
                                  {PRODUCT_CATEGORIES.map(p => <option key={p.value} value={p.value}>{t(`productCategories.${p.labelKey}`)}</option>)}
                                </select>
                              </div>

                              {form.productCategory && (
                                (form.subject === "Feedback" || form.subject === "Other") ? (
                                  <div className="ct-form-row">
                                    <div className={`ct-form-group${errors.productName ? " error" : ""}`}>
                                      <label htmlFor="ct-product-name">{t("step3.productName")}<span className="ct-req">*</span></label>
                                      <input id="ct-product-name" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productName} onChange={e => setField("productName", e.target.value)} />
                                      {fieldError("productName")}
                                    </div>
                                    <div className={`ct-form-group${errors.productCode ? " error" : ""}`}>
                                      <label htmlFor="ct-product-code">{t("step3.productCode")}<span className="ct-req">*</span></label>
                                      <input id="ct-product-code" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productCode} onChange={e => setField("productCode", e.target.value)} />
                                      {fieldError("productCode")}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="ct-form-row">
                                      <div className={`ct-form-group${errors.productName ? " error" : ""}`}>
                                        <label htmlFor="ct-product-name">{t("step3.productName")}<span className="ct-req">*</span></label>
                                        <input id="ct-product-name" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productName} onChange={e => setField("productName", e.target.value)} />
                                        <div className="ct-helper-text">{t("step3.stickerHelp")}</div>
                                        {fieldError("productName")}
                                      </div>
                                      <div className={`ct-form-group${errors.serialNumber ? " error" : ""}`}>
                                        <label htmlFor="ct-serial">{t("step3.serialNumber")}<span className="ct-req">*</span></label>
                                        <input id="ct-serial" type="text" maxLength={6} placeholder={t("step3.serialPlaceholder")} value={form.serialNumber} onChange={e => setField("serialNumber", e.target.value)} />
                                        <div className="ct-helper-text">{t("step3.serialHelp")}</div>
                                        {fieldError("serialNumber")}
                                      </div>
                                    </div>
                                    <div className="ct-form-row">
                                      <div className={`ct-form-group${errors.productCode ? " error" : ""}`}>
                                        <label htmlFor="ct-product-code">{t("step3.productCode")}<span className="ct-req">*</span></label>
                                        <input id="ct-product-code" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.productCode} onChange={e => setField("productCode", e.target.value)} />
                                        {fieldError("productCode")}
                                      </div>
                                      <div className={`ct-form-group${errors.purchaseInvoice ? " error" : ""}`}>
                                        <label htmlFor="ct-invoice">{t("step3.purchaseInvoice")}<span className="ct-req">*</span></label>
                                        <input id="ct-invoice" type="text" placeholder={t("step3.productNamePlaceholder")} value={form.purchaseInvoice} onChange={e => setField("purchaseInvoice", e.target.value)} />
                                        {fieldError("purchaseInvoice")}
                                      </div>
                                    </div>
                                    <div className={`ct-form-group${errors.issue ? " error" : ""}`}>
                                      <label htmlFor="ct-issue">{t("step3.issue")}<span className="ct-req">*</span></label>
                                      <select id="ct-issue" value={form.issue} onChange={e => setField("issue", e.target.value)}>
                                        <option value="" disabled>{t("step3.selectOption")}</option>
                                        {ISSUE_OPTIONS.map(i => <option key={i.value} value={i.value}>{t(`issues.${i.labelKey}`)}</option>)}
                                      </select>
                                      {fieldError("issue")}
                                    </div>
                                    {showsSaunaSize && (
                                      <div className="ct-form-group">
                                        <label>{t("step3.saunaRoomSize")} <span className="ct-optional">{t("step2.optional")}</span></label>
                                        <div className="ct-dimensions-group">
                                          <input type="number" step="0.01" placeholder={t("step3.width")} value={form.width} onChange={e => setField("width", e.target.value)} />
                                          <input type="number" step="0.01" placeholder={t("step3.depth")} value={form.depth} onChange={e => setField("depth", e.target.value)} />
                                          <input type="number" step="0.01" placeholder={t("step3.height")} value={form.height} onChange={e => setField("height", e.target.value)} />
                                        </div>
                                      </div>
                                    )}
                                    <div className="ct-form-group">
                                      <label htmlFor="ct-addinfo">{t("step3.addlInfo")} <span className="ct-optional">{t("step2.optional")}</span></label>
                                      <input id="ct-addinfo" type="text" placeholder={t("step3.addlInfoPlaceholderGeneric")} value={form.addProductInfo} onChange={e => setField("addProductInfo", e.target.value)} />
                                    </div>
                                  </>
                                )
                              )}

                              <div className={`ct-form-group${errors.message ? " error" : ""}`}>
                                <label htmlFor="ct-message">{t("step3.message")}<span className="ct-req">*</span></label>
                                <textarea
                                  id="ct-message"
                                  placeholder={form.subject === "Feedback" ? t("step3.shareFeedback") : form.subject === "Other" ? t("step3.describeRequest") : t("step3.describeInquiry")}
                                  value={form.message}
                                  onChange={e => setField("message", e.target.value)}
                                />
                                <div className="ct-helper-text">{t("step3.moreInfoLong")}</div>
                                {fieldError("message")}
                              </div>
                            </>
                          )}
                        </>
                      )}

                      <div className="ct-btn-group">
                        <button type="button" className="ct-btn" onClick={() => setStep(2)}>{t("buttons.goBack")}</button>
                        <button type="submit" className="ct-btn" disabled={submitting}>{submitting ? t("buttons.sending") : t("buttons.submitRequest")}</button>
                      </div>
                      {submitError && <div className="ct-form-error-msg">{submitError}</div>}
                    </div>
                  )}
                </fieldset>
                </form>

                <div className="ct-back-link">
                  {submitting ? (
                    <span className="ct-back-link-disabled">{t("finishedHere")}{t("backToHome")}</span>
                  ) : (
                    <>{t("finishedHere")}<Link to={localize(menuPaths.home)}>{t("backToHome")}</Link></>
                  )}
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
          <div className="ct-quick-eyebrow">{t("quick.eyebrow")}</div>
          <h2 className="ct-quick-title">{t("quick.title")}</h2>
        </div>
        <div className="ct-quick-grid">
          <div className="ct-quick-card">
            <div className="ct-quick-icon"><i className="fa-brands fa-whatsapp" /></div>
            <h3>{t("quick.whatsapp.title")}</h3>
            <p>{t("quick.whatsapp.desc")}</p>
            <a href="https://wa.me/63949759450" target="_blank" rel="noopener noreferrer">
              +63 949 759 4450 <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }} />
            </a>
          </div>
          <div className="ct-quick-card">
            <div className="ct-quick-icon"><i className="fa-solid fa-envelope" /></div>
            <h3>{t("quick.email.title")}</h3>
            <p>{t("quick.email.desc")}</p>
            <a href="mailto:info@sawo.com">
              info@sawo.com <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }} />
            </a>
          </div>
          <div className="ct-quick-card">
            <div className="ct-quick-icon"><i className="fa-solid fa-headset" /></div>
            <h3>{t("quick.helpdesk.title")}</h3>
            <p>{t("quick.helpdesk.desc")}</p>
            <a href="mailto:help@sawo.com">
              help@sawo.com <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }} />
            </a>
          </div>
        </div>
      </section>

      {/* ══ OFFICES ══ */}
      <section className="ct-offices-section">
        <div className="ct-offices-header">
          <div className="ct-offices-eyebrow">{t("offices.eyebrow")}</div>
          <h2 className="ct-offices-title">{t("offices.title")}</h2>
        </div>
        <div className="ct-offices-grid">
          {OFFICES.map(office => (
            <div className="ct-office-card" key={office.name}>
              <div className="ct-office-img">
                <img src={office.image} alt={office.name} loading="lazy" />
              </div>
              <div className="ct-office-body">
                <h3 className="ct-office-name">{office.name}</h3>
                <p className="ct-office-role">{t(`offices.list.${office.roleKey}.role`)}</p>
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
                  <a href={`tel:${office.telHref}`}>{t("offices.tel")}{office.tel}</a>
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
          <h2 className="ct-support-title">{t("supportCta.title")}</h2>
          <p className="ct-support-desc">{t("supportCta.desc")}</p>
        </div>
        <div className="ct-support-grid">
          <Link to={localize(menuPaths.support.faq)} className="ct-support-card">
            <i className="fa-regular fa-circle-question" />
            <h3>{t("supportCta.faq.title")}</h3>
            <p>{t("supportCta.faq.desc")}</p>
            <span className="ct-support-card-btn">
              {t("supportCta.faq.btn")} <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.65rem", margin: 0 }} />
            </span>
          </Link>
          <Link to={localize(menuPaths.support.manuals)} className="ct-support-card">
            <i className="fa-solid fa-book-open" />
            <h3>{t("supportCta.manuals.title")}</h3>
            <p>{t("supportCta.manuals.desc")}</p>
            <span className="ct-support-card-btn">
              {t("supportCta.manuals.btn")} <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.65rem", margin: 0 }} />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Contact;
