#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables. Check .env file.");
  console.error("   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const DATA_DIR = path.join(__dirname, "..", "data");
const IMAGES_DIR = path.join(__dirname, "../../../../../../", "saworepo2", "images");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

let statsDownloaded = 0;

// ── Download one image ────────────────────────────────────────────────────────
async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buf = Buffer.from(await response.arrayBuffer());
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buf);
    if (fs.statSync(outputPath).size === 0) throw new Error("File written but size is 0");
    return true;
  } catch (err) {
    console.warn(`  ⚠️  Failed to download ${url}: ${err.message}`);
    return false;
  }
}

// ── Process a single image URL → download + return relative path ──────────────
async function processImageUrl(url, slug) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("://")) return url; // already a relative path

  const filename = path.basename(new URL(url).pathname);
  const relPath = `images/${slug}/${filename}`;
  const outputPath = path.join(IMAGES_DIR, slug, filename);

  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
    return relPath; // already downloaded
  }

  const success = await downloadImage(url, outputPath);
  if (success) {
    statsDownloaded++;
    return relPath;
  }
  return url; // keep original on failure
}

// ── Fetch sauna rooms from Supabase ───────────────────────────────────────────
async function fetchRooms() {
  console.log("🛁 Fetching sauna rooms...");
  const { data, error } = await supabase
    .from("sauna_rooms")
    .select("*")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching sauna rooms:", error.message);
    process.exit(1);
  }
  return data || [];
}

// ── Main sync ─────────────────────────────────────────────────────────────────
async function sync() {
  try {
    console.log("🚀 Starting sauna rooms sync...\n");

    const rooms = await fetchRooms();
    console.log(`🎨 Processing images for ${rooms.length} rooms...`);

    const processed = [];
    for (const room of rooms) {
      const slug = room.slug;
      process.stdout.write(`  ${room.name}... `);

      // thumbnail
      if (room.thumbnail) {
        room.thumbnail = await processImageUrl(room.thumbnail, slug);
      }

      // configurations JSONB: { KEY: { images: [], panel_image: "" } }
      if (room.configurations && typeof room.configurations === "object") {
        for (const key of Object.keys(room.configurations)) {
          const cfg = room.configurations[key];

          if (Array.isArray(cfg.images)) {
            cfg.images = await Promise.all(
              cfg.images.map(url => processImageUrl(url, slug))
            );
          }

          if (cfg.panel_image) {
            cfg.panel_image = await processImageUrl(cfg.panel_image, slug);
          }
        }
      }

      processed.push(room);
      console.log("✓");
    }

    const timestamp = new Date().toISOString();
    fs.writeFileSync(
      path.join(DATA_DIR, "saunaroom-data.json"),
      JSON.stringify(processed, null, 2)
    );
    fs.writeFileSync(
      path.join(DATA_DIR, "saunaroom-meta.json"),
      JSON.stringify({ last_synced: timestamp, total_rooms: rooms.length, total_images_downloaded: statsDownloaded }, null, 2)
    );

    console.log("\n✅ Sync complete!");
    console.log(`🛁 Rooms synced: ${rooms.length}`);
    console.log(`🖼️  Images downloaded: ${statsDownloaded}`);
    console.log(`⏱️  Last synced: ${timestamp}\n`);
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    process.exit(1);
  }
}

sync();
