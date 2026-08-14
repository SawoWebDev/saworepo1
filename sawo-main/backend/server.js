import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { syncMerge, updateLocalFiles, syncSaunaRooms, updateLocalSaunaRooms } from "./syncApi.js";
import { handlePageView, handleDuration } from "./trackingApi.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Render sits behind a proxy — without this, req.ip is the proxy's IP, not
// the visitor's. Only other current use of req.ip in this file is two
// diagnostic console.log lines (see /api/sync, /api/update-local-files),
// so this is safe app-wide: it just makes those logs accurate too.
app.set("trust proxy", true);

// 2026-08-14: Vercel is fully discarded — the site now deploys on Cloudflare
// Pages. The previous allowlist named four *.vercel.app domains as
// "production"; none of them are deployed anywhere anymore, so they were
// removed rather than left as dead entries. If this backend service is
// still actually in use (its own package.json describes it as handling
// legacy sync/file operations — worth confirming it's not fully retired
// itself), the real Cloudflare Pages domain is listed below instead.
const allowedOrigins = [
  "https://saworepo1.pages.dev", // Cloudflare Pages production domain
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  // Extra origins can be added without a code change:
  // ALLOWED_ORIGINS="https://a.com,https://b.com"
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",").map(s => s.trim()).filter(Boolean),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
      callback(new Error("CORS not allowed for this origin"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Shared-secret auth for the write endpoints below. Without SYNC_API_KEY set,
// these endpoints were reachable by anyone who found the URL (CORS only
// checks the Origin header, which non-browser clients simply omit).
const SYNC_API_KEY = process.env.SYNC_API_KEY;
function requireApiKey(req, res, next) {
  if (!SYNC_API_KEY) {
    console.warn("⚠️ SYNC_API_KEY is not set — write endpoints are unauthenticated");
    return next();
  }
  if (req.get("x-api-key") !== SYNC_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Minimal in-memory rate limiter: N requests per IP per window.
// Fine for a single Render instance; would need a shared store if this
// backend ever scales to multiple instances.
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({ error: "Too many requests" });
    }
    next();
  };
}
const writeLimiter = rateLimit({ windowMs: 60_000, max: 10 });
const trackLimiter = rateLimit({ windowMs: 60_000, max: 60 });

app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SAWO Backend</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          h1 { color: #2c3e50; margin-top: 0; }
          .status { display: flex; align-items: center; gap: 10px; font-size: 18px; margin: 20px 0; }
          .status-dot { width: 12px; height: 12px; border-radius: 50%; background: #27ae60; animation: pulse 2s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          .endpoint { background: #ecf0f1; padding: 12px; border-radius: 4px; margin: 10px 0; font-family: monospace; font-size: 14px; }
          .info { color: #7f8c8d; font-size: 14px; margin-top: 20px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ SAWO Backend API</h1>
          <div class="status">
            <div class="status-dot"></div>
            <span>Service is <strong>live</strong> on Render</span>
          </div>
          <h2 style="margin-top: 30px; color: #34495e;">Endpoints</h2>
          <div class="endpoint">POST /api/sync</div>
          <p class="info">Syncs new products from Supabase to local storage. Streams progress as NDJSON.</p>
          <div class="endpoint">GET /health</div>
          <p class="info">Health check endpoint.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; color: #95a5a6; font-size: 13px;">
            Backend running on Render • No local setup required
          </div>
        </div>
      </body>
    </html>
  `);
});
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "SAWO Backend API running",
    corsEnabled: true
  });
});

app.get("/api/cors-test", (_req, res) => {
  res.json({
    success: true,
    message: "CORS is working!",
    origin: _req.get("origin"),
    timestamp: new Date().toISOString()
  });
});

app.options("/api/sync", cors());

app.post("/api/sync", writeLimiter, requireApiKey, async (_req, res) => {
  const clientOrigin = _req.get("origin");
  const startTime = new Date().toISOString();

  console.log("\n📡 Sync request received");
  console.log(`   ⏰ Time: ${startTime}`);
  console.log(`   🌐 Origin: ${clientOrigin}`);
  console.log(`   IP: ${_req.ip}`);

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Connection", "keep-alive");

  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const emit = (event) => {
    try {
      res.write(JSON.stringify(event) + "\n");
    } catch (e) {
      console.error("❌ Failed to write stream event:", e.message);
    }
  };

  try {
    await syncMerge(emit);
  } catch (err) {
    console.error("❌ Sync error:", err.message);
    emit({ phase: "error", success: false, message: err.message });
  } finally {
    res.end();
    const endTime = new Date().toISOString();
    console.log(`✅ Sync completed at ${endTime}\n`);
  }
});

app.options("/api/update-local-files", cors());

app.post("/api/update-local-files", writeLimiter, requireApiKey, async (_req, res) => {
  const clientOrigin = _req.get("origin");
  const startTime = new Date().toISOString();

  console.log("\n📝 Update local files request received");
  console.log(`   ⏰ Time: ${startTime}`);
  console.log(`   🌐 Origin: ${clientOrigin}`);
  console.log(`   IP: ${_req.ip}`);

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Connection", "keep-alive");

  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const emit = (event) => {
    try {
      res.write(JSON.stringify(event) + "\n");
    } catch (e) {
      console.error("❌ Failed to write stream event:", e.message);
    }
  };

  try {
    const { products, categories, tags } = _req.body;

    if (!products || !categories || !tags) {
      throw new Error("Missing required fields: products, categories, tags");
    }

    await updateLocalFiles(products, categories, tags, emit);
  } catch (err) {
    console.error("❌ Update error:", err.message);
    emit({ phase: "error", success: false, message: err.message });
  } finally {
    res.end();
    const endTime = new Date().toISOString();
    console.log(`✅ Update completed at ${endTime}\n`);
  }
});

app.options("/api/sync-sauna-rooms", cors());

app.post("/api/sync-sauna-rooms", writeLimiter, requireApiKey, async (_req, res) => {
  console.log("\n📡 Sauna rooms sync request received");
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") res.flushHeaders();
  const emit = (event) => { try { res.write(JSON.stringify(event) + "\n"); } catch {} };
  try {
    await syncSaunaRooms(emit);
  } catch (err) {
    emit({ phase: "error", success: false, message: err.message });
  } finally {
    res.end();
  }
});

app.options("/api/update-local-sauna-rooms", cors());

app.post("/api/update-local-sauna-rooms", writeLimiter, requireApiKey, async (_req, res) => {
  console.log("\n📝 Update local sauna rooms request received");
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") res.flushHeaders();
  const emit = (event) => { try { res.write(JSON.stringify(event) + "\n"); } catch {} };
  try {
    const { rooms } = _req.body;
    if (!rooms) throw new Error("Missing required field: rooms");
    await updateLocalSaunaRooms(rooms, emit);
  } catch (err) {
    emit({ phase: "error", success: false, message: err.message });
  } finally {
    res.end();
  }
});

app.options("/api/track/pageview", cors());
app.post("/api/track/pageview", trackLimiter, handlePageView);

// POST, not PATCH: navigator.sendBeacon (used by the browser for the
// page-leave duration update) can only issue POST requests.
app.options("/api/track/duration", cors());
app.post("/api/track/duration", trackLimiter, handleDuration);

app.listen(PORT, () => {
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = isProduction ? "https://sawo-backend.onrender.com" : `http://localhost:${PORT}`;
  console.log(`\n✅ SAWO Backend API running on ${baseUrl}`);
  console.log(`📡 Sync endpoint: POST ${baseUrl}/api/sync`);
  console.log(`📝 Update endpoint: POST ${baseUrl}/api/update-local-files\n`);
});
