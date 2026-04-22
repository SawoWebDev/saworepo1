# SAWO Backend API

Backend server for syncing Supabase products with local products.json and downloading images to saworepo2.

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

You should see:
```
✅ SAWO Backend API running on http://localhost:5000
📡 Sync endpoint: POST http://localhost:5000/api/sync
```

### 3. Verify It's Running
Open in browser: `http://localhost:5000/health`

Should return:
```json
{
  "status": "ok",
  "message": "SAWO Backend API running"
}
```

---

## 📋 Requirements

### `.env` File
The backend needs a `.env` file with Supabase credentials:

```env
SUPABASE_URL=https://qsdfdfuooeythaioucpx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=5000
```

✅ This file is already created in the backend folder.

---

## 🚀 How to Use with Frontend

### Keep Backend Running While Using Frontend

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

Leave this running. You should see:
```
✅ SAWO Backend API running on http://localhost:5000
📡 Sync endpoint: POST http://localhost:5000/api/sync
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

### Sync Products in Admin Panel

1. Open **Products** page
2. Go to **Local** tab
3. Click **Sync** button
4. Watch the status message:
   - ✅ Sync complete! Added X new product(s).
   - 🖼️ Images downloaded: X
   - 📄 Files downloaded: X

---

## 🔧 Running Backends

### Option 1: Manual (Recommended for Development)

**Terminal 1:**
```bash
npm start
```

Keep this terminal open. Backend runs on `http://localhost:5000`

---

### Option 2: Background (Windows PowerShell)

```powershell
cd sawo-main\backend
Start-Process npm -ArgumentList "start" -NoNewWindow
```

---

### Option 3: PM2 (Keep Running After Close)

Install PM2 (one time):
```bash
npm install -g pm2
```

Start backend:
```bash
cd sawo-main/backend
pm2 start npm --name "sawo-backend" -- start
```

Monitor:
```bash
pm2 monit
```

Stop:
```bash
pm2 stop sawo-backend
```

---

## ❌ Troubleshooting

### Port 5000 Already in Use

**PowerShell (Windows):**
```powershell
Get-NetTCPConnection -LocalPort 5000 | ForEach-Object {Stop-Process -Id $_.OwningProcess -Force}
```

**Bash (Mac/Linux):**
```bash
lsof -i :5000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

Or use a different port in `.env`:
```env
PORT=5001
```

Then update frontend `.env.local`:
```env
REACT_APP_BACKEND_URL=http://localhost:5001
```

---

### SUPABASE_URL is Required Error

Check `.env` file exists with:
```bash
cat .env
```

Should show:
```
SUPABASE_URL=https://qsdfdfuooeythaioucpx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
PORT=5000
```

---

### Invalid API Key

The SUPABASE_ANON_KEY in `.env` must be correct. Check it matches the Supabase project settings.

---

### Connection Refused When Syncing

**Means backend is NOT running.**

Solution:
1. Open Terminal 1
2. Run `npm start` in backend folder
3. Wait for "✅ SAWO Backend API running..."
4. Try Sync button again

---

## 📊 What Sync Does

When you click "Sync" in the Products → Local tab:

1. **Fetches** latest products from Supabase
2. **Compares** with existing products.json
3. **Finds** NEW products (not in local)
4. **Downloads** images → `saworepo2/images/`
5. **Downloads** files → `saworepo2/files/`
6. **Updates** JSON files:
   - `products.json` (merged)
   - `categories.json`
   - `tags.json`
   - `meta.json`
7. **Shows** status message

### Example:
```
Before: 143 products
After:  145 products (added 2 new)
Images: 3 downloaded
Files:  0 downloaded
```

---

## 🔐 Environment Variables

### Backend `.env`
```env
# Supabase connection
SUPABASE_URL=https://qsdfdfuooeythaioucpx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Server port
PORT=5000
```

### Frontend `.env.local`
```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:5000
```

---

## 📁 File Structure

```
backend/
├── .env                 ← Supabase credentials (required)
├── package.json         ← Dependencies
├── server.js            ← Express API server
├── syncApi.js           ← Merge & sync logic
├── README.md            ← This file
└── node_modules/        ← Installed packages
```

---

## 🛠️ API Endpoints

### Health Check
```
GET http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "message": "SAWO Backend API running"
}
```

### Sync Products
```
POST http://localhost:5000/api/sync
```

Response:
```json
{
  "success": true,
  "message": "✅ Sync complete! Added 2 new product(s).",
  "added": 2,
  "total": 145,
  "imagesDownloaded": 3,
  "filesDownloaded": 0,
  "timestamp": "2026-04-22T00:09:43.659Z"
}
```

---

## 💡 Tips

✅ **Keep Terminal Open** - Backend must be running while you use Sync button

✅ **Check Port 5000** - Make sure nothing else is using it

✅ **Verify Connection** - Visit `http://localhost:5000/health` to test

✅ **Watch Console** - Backend terminal shows sync progress in real-time

✅ **Use PM2** - For keeping backend running permanently (production)

---

## 📞 Support

If sync fails:
1. Check backend is running (`http://localhost:5000/health`)
2. Check `.env` file has credentials
3. Check frontend `.env.local` has backend URL
4. Check browser console for error details
5. Check backend terminal for error logs
