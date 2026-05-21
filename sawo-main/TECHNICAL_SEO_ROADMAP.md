# Technical SEO Roadmap for SAWO

## Overview
This document outlines critical technical SEO improvements needed for the SAWO website to improve discoverability, user experience, and search engine performance.

---

## 1. 404 Error Page Implementation ✅ DONE

### Current Status
- ❌ No custom 404 page exists
- Generic browser 404 error shown

### Implementation Details
**File:** `src/pages/NotFound.jsx`

**Features:**
- Branded error page matching SAWO design
- Helpful navigation links to main sections
- Search bar integration
- Call-to-action to contact support
- Analytics tracking for 404 errors
- Automatic redirect suggestion based on close URL matches

**Route Configuration:**
- Catch-all route in App.jsx: `<Route path="*" element={<NotFound />} />`
- Should be the last route before closing Routes

**Impact:**
- Reduces bounce rate on broken links
- Improves user experience when accessing wrong URLs
- Helps identify broken internal/external links through analytics
- Maintains brand consistency

**SEO Value:** ⭐⭐⭐
- Keeps users on site instead of bouncing
- Prevents search engines from penalizing broken links
- Opportunity to redirect users to relevant content

---

## 2. Structured Data / Schema Markup

### Current Status
- ❌ No schema markup implemented
- Missing rich snippets in SERPs
- Lost SEO value on Google Rich Results

### Implementation Strategy

#### 2.1 Product Schema (High Priority)
**File:** `src/components/Schema/ProductSchema.jsx`

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "image": "product-image.jpg",
  "brand": {
    "@type": "Brand",
    "name": "SAWO"
  },
  "offers": {
    "@type": "Offer",
    "price": "999",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://sawo.com/products/product-slug"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "100"
  }
}
```

**Recommended for:**
- All product detail pages
- Category listing pages
- Featured products on home page

**Benefits:**
- Rich product snippets in search results
- Enhanced appearance in Google Shopping (when ready for e-commerce)
- Knowledge panel integration

#### 2.2 Organization Schema (Medium Priority)
**File:** `src/components/Schema/OrganizationSchema.jsx`

**Includes:**
- Company name, logo, description
- Contact information
- Office locations
- Social media profiles
- Business hours
- Customer service number

**Placement:** Global (once per page in HTML head)

**Benefits:**
- Knowledge panel for brand
- Correct contact info in SERPs
- Local search visibility

#### 2.3 Breadcrumb Schema (Medium Priority)
**File:** `src/components/Schema/BreadcrumbSchema.jsx`

```json
{
  "@context": "https://schema.org/",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://sawo.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://sawo.com/products"
    }
  ]
}
```

**Benefits:**
- Breadcrumb navigation in SERPs
- Better site structure visibility
- Improved CTR

#### 2.4 FAQ Schema (Low Priority - Future)
**For:** FAQ pages
**Benefits:** Rich result display with expandable Q&A

#### 2.5 FAQPage & HowTo Schema (Future)
**For:** Support and tutorial content
**Benefits:** Enhanced snippets in knowledge panels

### Implementation Approach
1. Create reusable schema components in `src/components/Schema/`
2. Use `react-helmet-async` or `react-helmet` for head management
3. Render as `<Helmet>` wrapped JSON-LD scripts
4. Test with Google Rich Results Test Tool
5. Monitor search console for indexing status

### Validation Tools
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org markup validator
- SEMrush SEO audit
- Ahrefs site audit

---

## 3. Analytics Integration ✅ DONE

### Current Status
- ❌ No analytics tracking implemented
- Unable to measure user behavior
- No insights on traffic sources, page performance

### Analytics Infrastructure

#### 3.1 Analytics Data Collection
**Tools to Implement:**
1. **Google Analytics 4 (GA4)** - Primary
   - Page views
   - User engagement
   - Conversion tracking
   - Event tracking
   
2. **Hotjar** (Optional) - User behavior
   - Heatmaps
   - Session recordings
   - Conversion funnels

3. **Custom Analytics Backend** (Supabase)
   - Page views with timestamps
   - Click tracking
   - User location (via IP)
   - Device info
   - Time on page

#### 3.2 Custom Analytics Database Schema
```sql
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
  referrer TEXT
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  page_path TEXT
);

CREATE TABLE analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INT,
  page_count INT,
  country TEXT,
  city TEXT,
  device_type TEXT
);
```

#### 3.3 Analytics CMS Dashboard Features
**File:** `src/Administrator/Analytics.jsx`

**Dashboard Metrics:**

1. **Overview Cards**
   - Total Page Views (this month/week/day)
   - Unique Visitors
   - Average Session Duration
   - Bounce Rate

2. **Top Pages**
   - Ranked by page views
   - Avg. time on page
   - Bounce rate per page
   - Conversion rate

3. **User Behavior**
   - Countries/Regions distribution (map)
   - Device types breakdown
   - Browser breakdown
   - Operating systems

4. **Traffic Analysis**
   - Traffic over time (line chart)
   - Referrer sources
   - Landing pages
   - Exit pages

5. **Click Tracking**
   - Most clicked buttons
   - Most interacted elements
   - Click heatmap per page
   - CTA performance

6. **User Flow**
   - Entry pages
   - Exit pages
   - Most common paths
   - Drop-off points

7. **Real-time Dashboard** (Optional)
   - Active users
   - Current page views
   - Live heatmap

**Filters:**
- Date range picker (Today, 7 days, 30 days, custom)
- Page/section filter
- Device type filter
- Country filter
- Browser filter

#### 3.4 Implementation Steps

**Step 1: Set up Google Analytics 4**
```javascript
// In index.jsx
import ReactGA from 'react-ga4';

ReactGA.initialize('GA_MEASUREMENT_ID');
```

**Step 2: Custom Tracking Hook**
```javascript
// src/hooks/useAnalytics.js
export const useAnalytics = () => {
  useEffect(() => {
    // Track page view
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
    
    // Custom event tracking
    const trackEvent = (category, action, label) => {
      ReactGA.event({
        category,
        action,
        label
      });
    };
    
    return trackEvent;
  }, [location]);
};
```

**Step 3: Analytics Service (Supabase)**
```javascript
// src/services/analyticsService.js
export const logPageView = async (pageData) => {
  await supabase
    .from('analytics_page_views')
    .insert([pageData]);
};

export const logEvent = async (eventData) => {
  await supabase
    .from('analytics_events')
    .insert([eventData]);
};

export const getPageStats = async (pagePath, days = 30) => {
  const response = await supabase
    .from('analytics_page_views')
    .select('*')
    .eq('page_path', pagePath)
    .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  
  return response.data;
};
```

**Step 4: CMS Analytics Page**
- File: `src/Administrator/Analytics.jsx`
- Charts library: `recharts` or `chart.js`
- Display key metrics and visualizations
- Enable filtering and date range selection

### Expected Data Points
```javascript
{
  page_path: '/products/sauna-heaters',
  country: 'United States',
  city: 'New York',
  device_type: 'mobile',
  browser: 'Chrome',
  time_on_page: 245,
  button_clicked: 'add-to-cart',
  referrer: 'google.com',
  timestamp: '2024-01-15T10:30:00Z'
}
```

### Privacy Considerations
- ⚠️ GDPR Compliance: Get user consent before tracking
- ⚠️ CCPA Compliance: Allow users to opt-out
- ⚠️ Privacy Policy: Update to disclose analytics
- ⚠️ Cookie Consent: Implement banner for non-essential cookies

---

## 4. Breadcrumb Navigation

### Current Status
- ❌ Not verified - needs implementation check
- No breadcrumb component visible on pages

### Implementation

#### 4.1 Breadcrumb Component
**File:** `src/components/Breadcrumb/Breadcrumb.jsx`

**Features:**
- Auto-generate from route path
- Manual override per page
- Schema.org markup integration
- Styled matching SAWO design
- Mobile-responsive (collapsed on small screens)

**Example:**
```
Home > Products > Sauna > Heaters > Wall-Mounted
```

#### 4.2 Integration Points
- All category pages (Sauna Heaters, Steam, etc.)
- Product detail pages
- Support pages
- Blog/Article pages (future)

#### 4.3 Routing Configuration
Create `breadcrumbMap.js` for URL-to-breadcrumb mapping:
```javascript
export const BREADCRUMB_MAP = {
  '/sauna/heaters': [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Sauna', path: '/sauna' },
    { label: 'Heaters', path: '/sauna/heaters' }
  ],
  '/products/:slug': [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: '{productName}', path: null } // Dynamic
  ]
};
```

**SEO Benefits:**
- ⭐⭐⭐ Improves site structure clarity
- Better internal link distribution
- Rich snippet in SERPs
- Improved navigation UX
- Reduced bounce rate

---

## 5. Language / Localization Support

### Current Status
- ❌ English only
- No localization infrastructure
- No multi-language support

### Strategy

#### 5.1 Priority Languages
1. **English** (Primary) - Current
2. **Spanish** (High) - Latin America + Spain
3. **Tagalog** (High) - Philippines
4. **Finnish** (Medium) - Brand origin
5. **Swedish** (Low) - Nordic region

#### 5.2 Implementation Approach

**Option A: i18next (Recommended)**
```bash
npm install i18next react-i18next
```

**File Structure:**
```
src/locales/
├── en/
│   ├── common.json
│   ├── products.json
│   ├── support.json
│   └── home.json
├── es/
├── tl/
└── fi/
```

**Usage:**
```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('common:welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('es')}>
        Español
      </button>
    </div>
  );
};
```

#### 5.3 Language Switcher
- Dropdown in header/footer
- Flag icons for visual identification
- Persist user preference in localStorage
- Redirect to translated page URL

#### 5.4 URL Structure
- **Option 1:** Path prefix `/es/products`, `/en/products`
- **Option 2:** Subdomain `es.sawo.com`, `en.sawo.com`
- **Recommended:** Path prefix (easier, better for SEO)

#### 5.5 SEO for Multi-language
```html
<!-- Add hreflang tags for each language variant -->
<link rel="alternate" hreflang="en" href="https://sawo.com/products" />
<link rel="alternate" hreflang="es" href="https://sawo.com/es/products" />
<link rel="alternate" hreflang="tl" href="https://sawo.com/tl/products" />
<link rel="alternate" hreflang="x-default" href="https://sawo.com" />
```

#### 5.6 Implementation Phases

**Phase 1 (Months 1-2):**
- Set up i18next infrastructure
- Translate navigation and common UI elements
- Implement language switcher
- Spanish translation (highest ROI)

**Phase 2 (Months 2-3):**
- Translate all product content
- Translate support pages
- Tagalog translation

**Phase 3 (Months 3+):**
- Additional languages
- Dynamic content translation
- RTL support (if needed)

**Effort Estimate:**
- Setup: 20 hours
- Translation per language: 40-60 hours
- Testing: 10 hours
- **Total:** ~200-250 hours for 5 languages

#### 5.7 Cost Considerations
- Professional translation: $0.10-0.25 per word
- Estimated 50,000 words of content
- Cost: $5,000-12,500 for professional translation
- Alternative: Community translation (lower cost, variable quality)

**SEO Benefits:**
- ⭐⭐⭐⭐ Massive traffic potential from Spanish/Tagalog markets
- Better local search rankings
- Improved user engagement in each market
- Reduced bounce rate for non-English users

---

## Implementation Priority

### Phase 1 (Immediate - Weeks 1-2)
1. ✅ **404 Page** - Quick win, improves UX
2. ✅ **Analytics Dashboard** - Critical for decision making
3. **Breadcrumb Navigation** - Improves UX and SEO

### Phase 2 (Short-term - Weeks 3-4)
1. **Schema Markup** - Product, Organization, Breadcrumb
2. **Google Analytics 4 Setup** - Baseline measurements
3. **Analytics Refinements** - Event tracking, heatmaps

### Phase 3 (Medium-term - Weeks 5-8)
1. **Spanish Localization** - Largest market opportunity
2. **Schema Optimization** - Add FAQ, HowTo schemas
3. **Structured Data Testing** - Validate with tools

### Phase 4 (Long-term - Weeks 9+)
1. **Additional Languages** - Tagalog, Finnish, Swedish
2. **Advanced Analytics** - Cohort analysis, funnel optimization
3. **SEO Monitoring** - Monthly performance reviews

---

## Success Metrics

### SEO Metrics
- Organic traffic increase (target: +50% YoY)
- Keyword ranking improvements (top 10 positions)
- Rich snippet impressions in SERPs
- Click-through rate (CTR) increase
- Indexed pages count

### Analytics Metrics
- Page views per visitor
- Average session duration
- Bounce rate by page
- Conversion rate (once e-commerce ready)
- Top 10 most visited pages

### User Experience Metrics
- Pages per session
- Scroll depth on key pages
- Click-through rate on CTAs
- 404 error frequency
- Search query usage

---

## Tools & Resources

### SEO Tools
- Google Search Console: https://search.google.com/search-console
- Google Analytics: https://analytics.google.com
- Google Rich Results Test: https://search.google.com/test/rich-results
- GTmetrix: https://gtmetrix.com
- Lighthouse: Built into Chrome DevTools
- SEMrush/Ahrefs: Competitive analysis

### Libraries
- `react-i18next`: Internationalization
- `recharts`: Analytics charts
- `react-helmet-async`: Head management for schema
- `react-ga4`: Google Analytics integration

### Documentation
- Schema.org: https://schema.org
- Google Search Central: https://developers.google.com/search
- i18next docs: https://www.i18next.com
- React Router docs: https://reactrouter.com

---

## Maintenance & Monitoring

### Monthly Tasks
- Review top pages and traffic sources
- Check search console for errors
- Monitor 404 error frequency
- Verify schema markup validity
- Analyze user behavior changes

### Quarterly Tasks
- SEO audit
- Competitive analysis
- Content gap analysis
- Technical performance review
- Traffic source optimization

### Annual Tasks
- Language expansion evaluation
- Localization strategy review
- Major feature implementation planning
- ROI analysis on SEO initiatives

---

## Questions & Next Steps

1. **What's the target market for localization?** Spanish? Tagalog? Others?
2. **Do you have Google Search Console & GA4 set up?**
3. **Any existing e-commerce plans** that affect analytics tracking?
4. **Privacy requirements?** GDPR? CCPA?
5. **Timeline for language expansion?**

For questions or clarifications, contact the development team.

---

**Last Updated:** 2026-05-20
**Status:** In Progress - Implementing 404 & Analytics first
