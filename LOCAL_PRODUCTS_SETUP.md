# Local Products Setup

This document describes the local products system where products data and images are stored locally instead of being fetched live from Supabase.

## Overview

The system has been migrated from **live Supabase data** to **local downloaded data**:

- **Products Data**: Stored in `frontend/public/products.json`
- **Product Images**: Stored in `frontend/saworepo2/images/`
- **Image URLs**: Updated to point to local `saworepo2/images/` paths
- **Frontend**: Uses local `products.json` (already supports this via `getProducts()`)
- **CMS**: Has a new "Products (Local)" page to view/manage local products

## Files Created / Modified

### New Files

1. **`frontend/src/Administrator/scripts/downloadProductsLocal.js`**
   - Script to download products and images locally
   - Updates image URLs in products.json to point to local paths
   - Run via: `node src/Administrator/scripts/downloadProductsLocal.js`

2. **`frontend/src/Administrator/ProductsLocal.jsx`**
   - New CMS page "Products (Local)"
   - Displays products from local products.json
   - Shows product details, images, categories, tags
   - Read-only view (to sync products, use the download script)

3. **`frontend/src/local-storage/localProductsLoader.js`**
   - Helper functions to load local products
   - Exports: `getLocalProducts()`, `getLocalProductById()`, `getLocalBySlug()`, etc.
   - Used by ProductsLocal.jsx and can be used by other components

### Modified Files

1. **`frontend/src/Administrator/permissions.js`**
   - Added capability: `products.view_local`
   - Added nav item: "Products (Local)" → `/admin/products-local`

2. **`frontend/src/App.jsx`**
   - Imported `ProductsLocal` component
   - Added route: `/admin/products-local`

3. **`frontend/public/products.json`** (auto-updated)
   - Image URLs changed from Supabase CDN to local paths
   - Example: `"saworepo2/images/1776156718614_nj3tfwnq6dh.webp"`

## How to Use

### Step 1: Download Products & Images (First Time)

From the `frontend` directory, run:

```bash
node src/Administrator/scripts/downloadProductsLocal.js
```

This will:
- Read all products from `public/products.json`
- Download all product images to `saworepo2/images/`
- Update image URLs to point to local files
- Save updated `products.json`

**Output:**
- ✅ 134 products synced
- ✅ 359 images downloaded
- ✅ `products.json` updated with local image paths

### Step 2: View Local Products in CMS

1. Navigate to the admin dashboard: `/admin/products`
2. You'll see a new sidebar link: **"Products (Local)"**
3. Click it to view products from local products.json

**Features:**
- 🔍 Search products by name or slug
- 🏷️ Filter by status (all, published, draft)
- 📊 View product count
- 🖼️ See thumbnail and product images
- 📋 View full product details (brand, type, features, categories, tags, etc.)
- 📄 Click any product card to see detailed modal

### Step 3: Frontend Usage

The frontend (product pages) automatically uses local images because:

1. `frontend/src/lib/getProducts.js` has a priority system:
   - ✅ Local backend (if running)
   - ✅ **Local `products.json` (ACTIVE)**
   - ✅ GitHub CDN fallback

2. Image URLs in `products.json` point to `saworepo2/images/*`
3. These are served as static assets from `frontend/public/`

**Result:** All product pages display local images with no external dependency on Supabase.

## Architecture

```
frontend/
├── public/
│   └── products.json               # Updated with local image paths
├── saworepo2/
│   └── images/                     # 359 downloaded product images
│       ├── 1776156718614_nj3tfwnq6dh.webp
│       ├── 1776156727881_b483atddk2v.webp
│       └── ... (357 more)
├── src/
│   ├── Administrator/
│   │   ├── ProductsLocal.jsx       # NEW: CMS page for local products
│   │   ├── permissions.js          # UPDATED: Added products.view_local cap
│   │   └── scripts/
│   │       └── downloadProductsLocal.js  # NEW: Download/sync script
│   ├── local-storage/
│   │   └── localProductsLoader.js  # NEW: Helper functions
│   ├── lib/
│   │   └── getProducts.js          # Uses local products.json (no changes)
│   └── App.jsx                     # UPDATED: Added /admin/products-local route
```

## Data Flow

### Before (Live Supabase)
```
ProductPage.jsx
    ↓
getProducts()
    ↓
Supabase REST API
    ↓
Remote Images (CDN)
```

### After (Local)
```
ProductPage.jsx
    ↓
getProducts()
    ↓
/public/products.json (local)
    ↓
saworepo2/images/* (local)
```

## To Sync Updates

Whenever you want to pull the latest products from the live source:

1. Update the live products in your CMS (if using Supabase)
2. Export/download to `frontend/public/products.json`
3. Run the sync script:
   ```bash
   node src/Administrator/scripts/downloadProductsLocal.js
   ```
4. Refresh the "Products (Local)" page in the admin dashboard

## Permissions

The "Products (Local)" page is visible to all roles that have `products.view_local` capability:
- ✅ viewer
- ✅ editor
- ✅ admin
- ✅ superadmin

To modify permissions, edit `frontend/src/Administrator/permissions.js`.

## Important Notes

1. **Image Paths**: All image URLs are relative (`saworepo2/images/...`) so they work both:
   - In development (served from `frontend/public/`)
   - In production (if bundled or deployed similarly)

2. **PDF Files**: Resource files (PDFs) are NOT downloaded - they remain as remote URLs pointing to your external PDF storage

3. **Products Data**: To update products, you need to:
   - Edit in your CMS (if using Supabase)
   - Export to `frontend/public/products.json`
   - Run the sync script

4. **No Editing via CMS (Local)**: The "Products (Local)" page is read-only. It shows what's currently in the local products.json

5. **saworepo2 is Local**: The `saworepo2` folder is stored in the project, not in a separate GitHub repo. This is perfect for local development but consider your deployment strategy for production.

## Troubleshooting

### Images not loading on ProductPage
- Check that `saworepo2/images/` folder exists with downloaded images
- Verify `products.json` has paths like `saworepo2/images/filename.webp`
- Clear browser cache and refresh

### Script fails to download images
- Check internet connection
- Verify source URLs in products.json are valid
- Ensure `saworepo2/images/` folder has write permissions

### ProductsLocal page shows "No local products"
- Run the sync script: `node src/Administrator/scripts/downloadProductsLocal.js`
- Verify `frontend/public/products.json` exists and has products
- Refresh the page

## Next Steps

1. ✅ Local products system is ready
2. Test the frontend with local images
3. Test the CMS "Products (Local)" page
4. Consider deployment strategy for `saworepo2/images/` folder
5. Optional: Integrate with your existing product sync workflow

## Support

For detailed code comments, see:
- `downloadProductsLocal.js` - Download/sync logic
- `ProductsLocal.jsx` - CMS page implementation
- `localProductsLoader.js` - Helper functions
