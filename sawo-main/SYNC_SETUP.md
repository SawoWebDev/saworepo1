# Sync Setup Guide

## Overview
The sync feature allows you to merge Supabase products with local products.json and download images to saworepo2.

✅ **Only adds NEW items** (no overwrites)  
✅ **Downloads images** to saworepo2/images  
✅ **Updates JSON files** with merged data  
✅ **One-click sync** from UI  

---

## Setup Instructions

### 1. **Start the Backend API Server**

```bash
cd sawo-main/backend
npm install
npm start
```

The server will run on `http://localhost:5000`

Expected output:
```
✅ SAWO Backend API running on http://localhost:5000
📡 Sync endpoint: POST http://localhost:5000/api/sync
```

### 2. **Configure Frontend**

In `frontend/.env.local`, add:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

### 3. **Verify Setup**

Visit `http://localhost:5000/health` - should return:
```json
{
  "status": "ok",
  "message": "SAWO Backend API running"
}
```

---

## How to Use

### In Products Admin Page:

1. **Switch to "Local" tab**
2. **Click "Sync" button** (appears only in Local tab)
3. **Watch the status message**:
   - ✅ Sync complete! Added X new product(s).
   - 📦 Downloaded images
   - 📄 Downloaded files

### What Happens:

1. **Backend fetches** from Supabase
2. **Compares IDs** with existing local products
3. **Finds NEW products** (not in products.json)
4. **Downloads images** to `saworepo2/images/`
5. **Downloads files** to `saworepo2/files/`
6. **Updates** products.json, categories.json, tags.json
7. **Refreshes** Local tab automatically
8. **Shows status** with counts

---

## Data Flow

```
Click "Sync" Button (UI)
         ↓
Backend API /api/sync
         ↓
Fetch from Supabase
         ↓
Load existing products.json
         ↓
Compare IDs (find new items)
         ↓
Download images → saworepo2/images/
Download files  → saworepo2/files/
         ↓
Merge products (existing + new)
         ↓
Write updated JSON files
         ↓
Return status → UI Toast Message
```

---

## Files Modified

**Backend (New):**
- `backend/package.json` - Dependencies
- `backend/server.js` - Express server
- `backend/syncApi.js` - Merge sync logic

**Frontend (Updated):**
- `frontend/src/Administrator/Products.jsx` - Added Sync button & status display
- `frontend/src/Administrator/Local/syncWithMerge.js` - Calls backend API
- `frontend/.env.local` - Add REACT_APP_BACKEND_URL

---

## Example Output

**Before Sync:**
- Local: 45 products
- Supabase: 48 products

**After Clicking Sync:**
```
✅ Sync complete! Added 3 new product(s).
📦 Total: 48 products
🖼️  Images downloaded: 5
📄 Files downloaded: 2
```

**Result:**
- `products.json` → 48 products (45 existing + 3 new)
- `categories.json` → Updated
- `tags.json` → Updated
- `meta.json` → Timestamp + stats
- `saworepo2/images/` → New images added
- `saworepo2/files/` → New files added

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Backend not running" | Start backend: `npm start` in backend folder |
| "Sync failed" | Check backend console for errors |
| "No new products" | All Supabase products already in local |
| Images not downloaded | Check `saworepo2/images/` folder exists |

---

## Production Setup

For production, set `REACT_APP_BACKEND_URL` to your backend server URL:

```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

The backend should be deployed on the same or different server with proper CORS configured.
