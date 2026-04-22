import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { syncMerge } from "./syncApi.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
  console.log(`\n✅ SAWO Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Sync endpoint: POST http://localhost:${PORT}/api/sync\n`);
});
