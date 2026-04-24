import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { syncMerge } from "./syncApi.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "https://sawogitsrc.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

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
  res.json({ status: "ok", message: "SAWO Backend API running" });
});

// ── Streaming sync (NDJSON) ─────────────────────────────────────────────────
// Emits one JSON object per line so the frontend can render live progress.
app.post("/api/sync", async (_req, res) => {
  console.log("\n📡 Sync request received at", new Date().toISOString());

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const emit = (event) => {
    try {
      res.write(JSON.stringify(event) + "\n");
    } catch (e) {
      console.warn("Failed to write stream event:", e.message);
    }
  };

  try {
    await syncMerge(emit);
  } catch (err) {
    console.error("❌ Sync endpoint error:", err);
    emit({ phase: "error", success: false, message: err.message });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = isProduction ? "https://sawo-backend.onrender.com" : `http://localhost:${PORT}`;
  console.log(`\n✅ SAWO Backend API running on ${baseUrl}`);
  console.log(`📡 Sync endpoint: POST ${baseUrl}/api/sync\n`);
});
