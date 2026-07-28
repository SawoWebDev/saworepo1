# Missing Pages Checklist

## Pages Referenced in Footer/App but NOT YET Created

### ✅ LEGAL & POLICY PAGES (Need to Create)

- [x] **Privacy Policy** (`/privacy-policy`) ✅ COMPLETED
  - Referenced in: Footer.jsx
  - Status: Routed & Functional
  - Component: src/pages/PrivacyPolicy.jsx

- [ ] **Sitemap** (`/sitemap`)
  - Referenced in: Footer.jsx
  - Status: Not routed
  - Current link: `href="#"` (placeholder)

---

### ✅ INFRARED PRODUCT DETAIL PAGES (Need to Create)

- [ ] **Infrared Backrest** (`/infrared/backrest`)
  - Referenced in: Footer.jsx - INFRARED SAUNA column
  - Status: Not routed
  - Current link: `href="#"` (placeholder)

- [ ] **Infrared Panels** (`/infrared/panels`)
  - Referenced in: Footer.jsx - INFRARED SAUNA column
  - Status: Not routed
  - Current link: `href="#"` (placeholder)

---

### ⚠️ SOCIAL MEDIA LINKS (External - Not Pages)

- [ ] Facebook
  - Referenced in: Footer.jsx
  - Status: External link needed
  - Current link: `href="#"` (placeholder)

- [ ] Instagram
  - Referenced in: Footer.jsx
  - Status: External link needed
  - Current link: `href="#"` (placeholder)

- [ ] LinkedIn
  - Referenced in: Footer.jsx
  - Status: External link needed
  - Current link: `href="#"` (placeholder)

- [ ] YouTube
  - Referenced in: Footer.jsx
  - Status: External link needed
  - Current link: `href="#"` (placeholder)

- [ ] TikTok
  - Referenced in: Footer.jsx
  - Status: External link needed
  - Current link: `href="#"` (placeholder)

- [ ] Email Contact
  - Referenced in: Footer.jsx (envelope icon)
  - Status: External link needed (mailto:)
  - Current link: `href="#"` (placeholder)

- [ ] Phone Contact
  - Referenced in: Footer.jsx (phone icon)
  - Status: External link needed (tel:)
  - Current link: `href="#"` (placeholder)

---

## Pages with External Links Still Pointing to sawo.com

### Product Category Detail Pages (Should become internal routes)

These pages currently have links to external sawo.com product pages. Consider creating detail pages for:

- [ ] Pails & Ladles (`/sauna/accessories/pails-ladles`)
  - Currently: `https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/pails-ladles/`
  - Referenced in: Sauna.jsx, SaunaAccessories.jsx

- [ ] Thermometers & Combined Meters (`/sauna/accessories/thermometers`)
  - Currently: `https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/thermometers-combined-meters/`
  - Referenced in: Sauna.jsx, SaunaAccessories.jsx

- [ ] Clocks & Sand Timers (`/sauna/accessories/clocks-sandtimers`)
  - Currently: `https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/clocks-sandtimers/`
  - Referenced in: SaunaAccessories.jsx

- [ ] Sauna Lights & Covers (`/sauna/accessories/lights-covers`)
  - Currently: `https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/sauna-light/`
  - Referenced in: Sauna.jsx, SaunaAccessories.jsx

- [ ] Headrests & Backrests (`/sauna/accessories/headrests-backrests`)
  - Currently: `https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/headrests-backrests/`
  - Referenced in: Sauna.jsx, SaunaAccessories.jsx

- [ ] Doors & Handles (`/sauna/accessories/doors-handles`)
  - Currently: `https://www.sawo.com/sawo-products/finnish-sauna/sauna-accessories/doors-handles/`
  - Referenced in: Sauna.jsx, SaunaAccessories.jsx

- [ ] Benches & Floor Tiles (`/sauna/accessories/benches-floortiles`)
  - Currently: `https://www.sawo.com/benches-and-floor-tiles/` or `https://www.sawo.com/benches-cloth-hangers-and-floor-mat-tiles/`
  - Referenced in: Sauna.jsx, SaunaAccessories.jsx

- [ ] Kivistone (`/sauna/accessories/kivistone`)
  - Currently: `https://www.sawo.com/kivistone/`
  - Referenced in: Sauna.jsx, SaunaAccessories.jsx

- [ ] Ventilation & Add-ons (`/sauna/accessories/ventilation-addons`)
  - Currently: `https://www.sawo.com/ventilations-and-add-ons/` or `https://www.sawo.com/ventilations-miscellaneous-items/`
  - Referenced in: Sauna.jsx, SaunaAccessories.jsx

- [ ] Accessory Sets (`/sauna/accessories/sets`)
  - Currently: `https://www.sawo.com/accessorysets/`
  - Referenced in: SaunaAccessories.jsx

---

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| **Immediate Missing Pages** | 4 | Need to create |
| **Social Media Links** | 7 | Need external URLs |
| **Product Category Detail Pages** | 10 | Optional/Nice to have |
| **Total** | 21 | Various |

---

## Priority Levels

### 🔴 HIGH PRIORITY (Create These First)
- Privacy Policy - Legal requirement
- Sitemap - SEO & navigation
- Infrared Backrest - Footer link expected to work
- Infrared Panels - Footer link expected to work

### 🟡 MEDIUM PRIORITY (Add These Next)
- Social media links - Update with actual URLs
- Product category detail pages - Improve user experience & SEO

### 🟢 LOW PRIORITY (Nice to Have)
- Additional product filters/subcategories

---

## Files to Update

Once new pages are created, update:
1. `src/menuPaths.js` - Add new route paths
2. `src/App.jsx` - Add new Route components
3. `src/components/Footer/Footer.jsx` - Update placeholder links
4. Individual product pages - Update external links to internal routes

---

## 🎯 NEXT PAGE TO CREATE: **Sitemap** (`/sitemap`)

**Why Sitemap first?**
- ✅ Simple to build (just list all routes from menuPaths.js)
- ✅ SEO best practice - helps search engines crawl the site
- ✅ Improves navigation for users
- ✅ No product data needed
- ✅ Quick win before tackling product-detail pages

**After Sitemap:**
1. Social media links in Footer (just update URLs, no new pages)
2. Infrared Backrest detail page
3. Infrared Panels detail page

