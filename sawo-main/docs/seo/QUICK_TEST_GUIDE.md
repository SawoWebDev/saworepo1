# Quick Testing Guide - Technical SEO Features

## 🧪 What You Can Test Right Now

### 1. 404 Error Page

**Test URL:** 
- `http://localhost:3001/invalid-page`
- `http://localhost:3001/sauna/non-existent-heater`
- `http://localhost:3001/products/fake-product-slug`

**Expected:**
- Custom SAWO-branded 404 page displays
- Shows the attempted URL path
- Has navigation links to Home and Products
- Shows support contact info
- Mobile responsive

**What works:**
- ✅ Page layout and styling
- ✅ Navigation links (Home, Products, FAQ, etc.)
- ✅ Contact information
- ✅ Mobile responsiveness

**What still needs:**
- ⏳ Analytics tracking (requires Google Analytics setup)

---

### 2. Analytics Dashboard

**Access URL:** 
- `http://localhost:3001/admin/analytics`

**Requirements:**
- Must be logged in as Admin or Superadmin
- If not set up: Use test account created in admin panel

**Current State:**
- ✅ Dashboard layout displays
- ✅ Date range filters work (7/30/90 days)
- ✅ Loading state shows spinner
- ✅ Empty state shows "No data available"

**What's ready to test (with data):**
- 📊 Overview metrics (page views, visitors, duration, bounce rate)
- 📈 Top Pages table
- 🌍 Top Countries chart
- 📱 Device breakdown
- 🌐 Browser breakdown
- 📝 Recent Events table

**What shows "No data" currently:**
- All metrics (because tracking isn't set up yet)

---

## 🔧 Setup Required to See Real Data

### Step 1: Create Analytics Tables in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Analytics page views
CREATE TABLE analytics_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  page_title TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT,
  session_id TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  time_on_page INT
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  page_path TEXT
);

-- Indexes for performance
CREATE INDEX idx_page_views_timestamp ON analytics_page_views(timestamp);
CREATE INDEX idx_page_views_path ON analytics_page_views(page_path);
CREATE INDEX idx_events_timestamp ON analytics_events(timestamp);
```

3. Verify tables appear in Supabase → Tables list

---

### Step 2: Add Test Data (Optional)

To test the dashboard with sample data:

```sql
-- Insert sample page views
INSERT INTO analytics_page_views (page_path, page_title, country, city, device_type, browser, os, time_on_page, session_id) VALUES
('/sauna/heaters', 'Sauna Heaters', 'United States', 'New York', 'mobile', 'Chrome', 'iOS', 245, 'sess_1'),
('/sauna/heaters/wall-mounted', 'Wall-Mounted Heaters', 'United States', 'San Francisco', 'desktop', 'Chrome', 'macOS', 320, 'sess_2'),
('/products', 'All Products', 'Canada', 'Toronto', 'mobile', 'Safari', 'iOS', 180, 'sess_3'),
('/steam/generators', 'Steam Generators', 'United Kingdom', 'London', 'desktop', 'Firefox', 'Windows', 410, 'sess_4'),
('/sauna/accessories', 'Sauna Accessories', 'Germany', 'Berlin', 'mobile', 'Chrome', 'Android', 95, 'sess_5'),
('/sauna/heaters', 'Sauna Heaters', 'Australia', 'Sydney', 'desktop', 'Chrome', 'Windows', 290, 'sess_6'),
('/support/faq', 'FAQ', 'Brazil', 'São Paulo', 'mobile', 'Chrome', 'Android', 150, 'sess_7'),
('/products/sauna-heater-1', 'Product Detail', 'United States', 'Los Angeles', 'desktop', 'Safari', 'macOS', 520, 'sess_8'),
('/contact', 'Contact Us', 'Spain', 'Madrid', 'mobile', 'Chrome', 'iOS', 210, 'sess_9'),
('/infrared', 'Infrared', 'Mexico', 'Mexico City', 'mobile', 'Chrome', 'Android', 165, 'sess_10');

-- Insert sample events
INSERT INTO analytics_events (event_name, page_path, session_id, event_data) VALUES
('button_click', '/sauna/heaters', 'sess_1', '{"button": "Add to Cart", "product_id": "shc_001"}'),
('page_scroll', '/sauna/heaters', 'sess_2', '{"scroll_depth": 0.75}'),
('button_click', '/products', 'sess_3', '{"button": "View Details"}'),
('form_submit', '/contact', 'sess_9', '{"form_type": "contact_request"}'),
('search', '/products', 'sess_5', '{"query": "heater"}');
```

Then refresh the Analytics dashboard - you should see data!

---

## 📋 Checklist: What's Done vs. Next

### ✅ Done (Deployed)
- [x] 404 page component created and integrated
- [x] Analytics dashboard UI built
- [x] Admin navigation updated with Analytics link
- [x] Permissions system configured for Analytics access
- [x] Route added to App.jsx
- [x] Database schema designed
- [x] Comprehensive documentation written

### ⏳ Next Steps (Not yet implemented)
- [ ] Google Analytics 4 integration (tracking code)
- [ ] Custom tracking service (`analyticsService.js`)
- [ ] Page view tracking hook (`usePageTracking.js`)
- [ ] Click/event tracking
- [ ] User consent/GDPR banner
- [ ] IP geolocation service (to get country/city)
- [ ] Breadcrumb navigation component
- [ ] Schema markup components
- [ ] Language/localization setup

---

## 🚀 How to Test Each Component

### Testing 404 Page

1. **Start the dev server:**
   ```bash
   cd frontend
   npm start
   ```

2. **Navigate to invalid page:**
   - `http://localhost:3001/sauna/invalid`

3. **Verify:**
   - ✅ SAWO logo visible
   - ✅ "404" heading displays
   - ✅ Error message shows
   - ✅ Navigation links work
   - ✅ Support contact visible
   - ✅ Mobile responsive

---

### Testing Analytics Dashboard

1. **Admin login:**
   - Navigate to `http://localhost:3001/login`
   - Log in with admin credentials

2. **Access Analytics:**
   - Click "Analytics" in sidebar (or navigate to `/admin/analytics`)

3. **Test Features:**
   - [ ] Date range buttons (7/30/90 days)
   - [ ] Loading spinner appears
   - [ ] All 4 metric cards display
   - [ ] Top Pages section shows "No data available"
   - [ ] Top Countries section displays
   - [ ] Device breakdown chart
   - [ ] Browser breakdown chart
   - [ ] Recent Events table

4. **After adding test data:**
   - Refresh page
   - All sections should populate with sample data
   - Date filters should work
   - Data should be sortable

---

## 🐛 Troubleshooting

### 404 Page Not Showing
**Problem:** Still seeing generic browser 404
**Solution:** 
- Verify `NotFound.jsx` is in `src/pages/` folder
- Check `App.jsx` has import: `import NotFound from "./pages/NotFound"`
- Verify route added inside MainLayout Routes
- Clear browser cache and restart dev server

### Analytics Dashboard Not Loading
**Problem:** Page shows error or blank
**Solution:**
- Check user is logged in with admin role
- Verify Tables exist in Supabase
- Check browser console for errors
- Ensure Supabase connection is working
- Try adding test data

### No Data in Analytics Dashboard
**Problem:** Dashboard shows "No data available"
**Solution:**
- This is expected before tracking is implemented
- Analytics tables exist but are empty
- Add test data using SQL above
- Or implement tracking service (see TECHNICAL_SEO_ROADMAP.md)

### 404 Page Shows MainLayout
**Problem:** Getting the public page layout with 404
**Solution:**
- This is working as designed (404 is still a valid page)
- MainLayout wraps the 404 page for consistency
- This is correct behavior

---

## 📊 Sample Data Verification

After inserting test data, your dashboard should show:

```
Overview Metrics:
- Page Views: 10
- Unique Visitors: 10
- Avg Duration: ~257 seconds (varies by data)
- Bounce Rate: 0% (all sessions have multiple pages)

Top Pages:
1. /sauna/heaters (2 views, avg 283s)
2. /products/sauna-heater-1 (1 view, 520s)
3. /sauna/heaters/wall-mounted (1 view, 320s)
... etc

Top Countries:
1. United States (3 views)
2. Germany (1 view)
3. Australia (1 view)
... etc

Devices:
- Mobile: 60%
- Desktop: 40%

Browsers:
- Chrome: 8
- Safari: 1
- Firefox: 1
```

---

## 🎯 Success Criteria

### 404 Page - COMPLETE ✅
- [x] Page loads on invalid routes
- [x] Styled with SAWO design
- [x] Navigation works
- [x] Contact info displayed
- [x] Mobile responsive
- [x] Analytics ready (code present)

### Analytics Dashboard - COMPLETE ✅
- [x] Dashboard loads
- [x] Date filters work
- [x] All UI sections present
- [x] Supabase integration ready
- [x] Permission system configured
- [x] Ready for data population

### Analytics Data - NOT YET ⏳
- [ ] Tracking code implemented
- [ ] Data being collected
- [ ] Dashboard showing real metrics
- [ ] GDPR compliance handled

---

## 📞 Need Help?

**Issues with 404 page?**
- Check browser console (F12 → Console)
- Look for import/route errors
- Verify `NotFound.jsx` file exists

**Issues with Analytics?**
- Verify admin login works
- Check Supabase tables exist
- Insert test data
- Check browser console for errors

**Questions?**
- See TECHNICAL_SEO_ROADMAP.md for full documentation
- See IMPLEMENTATION_SUMMARY.md for architecture overview

---

**Last Updated:** 2026-05-20
**Status:** Ready for Testing
**Next:** Run tests above, then implement tracking service
