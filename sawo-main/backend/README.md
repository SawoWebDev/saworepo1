SAWO Backend API

Backend server for syncing Supabase products with a local products.json file and downloading assets to saworepo2.

------------------------------------------------

QUICK START

Install dependencies
npm install

Start the server
npm start

Expected output:
SAWO Backend API running on http://localhost:5000
Sync endpoint: POST http://localhost:5000/api/sync

Verify the server
Open in browser:
http://localhost:5000/health

Expected response:
{
  "status": "ok",
  "message": "SAWO Backend API running"
}

------------------------------------------------

REQUIREMENTS

Environment file (.env)

SUPABASE_URL=https://qsdfdfuooeythaioucpx.supabase.co
SUPABASE_ANON_KEY=your_key_here
PORT=5000

------------------------------------------------

USING WITH FRONTEND

Run backend and frontend simultaneously

Terminal 1 (backend):
cd backend
npm start

Terminal 2 (frontend):
cd frontend
npm start

Sync products from admin panel

1. Open Products page
2. Go to Local tab
3. Click Sync
4. Monitor status messages

------------------------------------------------

RUNNING THE BACKEND

Manual (recommended)
npm start

Server runs at:
http://localhost:5000

—

Background process (Windows PowerShell)
cd sawo-main\backend
Start-Process npm -ArgumentList "start" -NoNewWindow

—

Using PM2 (persistent process)

Install:
npm install -g pm2

Start:
cd sawo-main/backend
pm2 start npm --name "sawo-backend" -- start

Monitor:
pm2 monit

Stop:
pm2 stop sawo-backend

------------------------------------------------

TROUBLESHOOTING

Port 5000 already in use

Windows:
Get-NetTCPConnection -LocalPort 5000 | ForEach-Object {Stop-Process -Id $_.OwningProcess -Force}

Mac/Linux:
lsof -i :5000 | awk '{print $2}' | xargs kill -9

Or change port in .env:
PORT=5001

Update frontend:
REACT_APP_BACKEND_URL=http://localhost:5001

—

Missing SUPABASE_URL

Check .env:
cat .env

—

Invalid API key

Ensure SUPABASE_ANON_KEY matches your Supabase project.

—

Connection refused during sync

This indicates the backend is not running.

Solution:
1. Start backend with npm start
2. Wait for server confirmation
3. Retry sync

------------------------------------------------

SYNC PROCESS OVERVIEW

When Sync is triggered:

1. Fetch products from Supabase
2. Compare with local products.json
3. Identify new products
4. Download images to saworepo2/images/
5. Download files to saworepo2/files/
6. Update:
   - products.json
   - categories.json
   - tags.json
   - meta.json
7. Return sync summary

Example:
Before: 143 products
After: 145 products (added 2)
Images downloaded: 3
Files downloaded: 0

------------------------------------------------

ENVIRONMENT VARIABLES

Backend:
SUPABASE_URL=https://qsdfdfuooeythaioucpx.supabase.co
SUPABASE_ANON_KEY=your_key_here
PORT=5000

Frontend:
REACT_APP_BACKEND_URL=http://localhost:5000

------------------------------------------------

FILE STRUCTURE

backend/
├── .env
├── package.json
├── server.js
├── syncApi.js
├── README.md
└── node_modules/

------------------------------------------------

API ENDPOINTS

Health check
GET /health

Response:
{
  "status": "ok",
  "message": "SAWO Backend API running"
}

Sync products
POST /api/sync

Response:
{
  "success": true,
  "message": "Sync complete. Added 2 new products.",
  "added": 2,
  "total": 145,
  "imagesDownloaded": 3,
  "filesDownloaded": 0,
  "timestamp": "2026-04-22T00:09:43.659Z"
}

------------------------------------------------

OPERATIONAL TIPS

- Keep the backend running while using sync
- Ensure port is available
- Use /health to verify server
- Monitor backend logs
- Use PM2 for persistent environments

------------------------------------------------

SUPPORT CHECKLIST

1. Confirm backend is reachable via /health
2. Validate .env configuration
3. Verify frontend API URL
4. Check browser console logs
5. Inspect backend logs