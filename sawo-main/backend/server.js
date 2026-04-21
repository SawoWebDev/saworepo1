/**
 * Backend API Server for SAWO Admin
 * Provides sync endpoint to merge Supabase data with local products
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { syncMerge } from "./syncApi.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "SAWO Backend API running" });
});

// ── Sync endpoint ───────────────────────────────────────────────────────────
app.post("/api/sync", async (req, res) => {
  console.log("\n📡 Sync request received at", new Date().toISOString());

  try {
    const result = await syncMerge();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (err) {
    console.error("❌ Sync endpoint error:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
      error: err.message,
    });
  }
});

// ── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ SAWO Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Sync endpoint: POST http://localhost:${PORT}/api/sync\n`);
});
