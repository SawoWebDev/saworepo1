//syncApi.js - Syncs product data from Supabase, downloads images/files, updates local JSON, and commits to GitHub repos.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GITHUB_PAT = process.env.GITHUB_PAT;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "jmesrafael";
const GITHUB_MAIN_REPO = process.env.GITHUB_MAIN_REPO || "saworepo1";
const GITHUB_IMAGES_REPO = process.env.GITHUB_IMAGES_REPO || "saworepo2";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error("   Required: SUPABASE_URL, SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WORK_DIR = path.join("/tmp", "sawo-sync-" + Date.now());
const DATA_DIR = path.join(__dirname, "../frontend/src/Administrator/Local/data");
const PRODUCTS_JSON = path.join(DATA_DIR, "products.json");
const CATEGORIES_JSON = path.join(DATA_DIR, "categories.json");
const TAGS_JSON = path.join(DATA_DIR, "tags.json");
const META_JSON = path.join(DATA_DIR, "meta.json");
const SAWOREPO1_DIR = path.join(WORK_DIR, GITHUB_MAIN_REPO);
const SAWOREPO2_DIR = path.join(WORK_DIR, GITHUB_IMAGES_REPO);
const IMAGES_DIR = path.join(SAWOREPO2_DIR, "images");
const FILES_DIR = path.join(SAWOREPO2_DIR, "files");

// ── Progress-aware sync ──────────────────────────────────────────────────────
// emit(event) is called at each phase so the frontend can show live progress.
export async function syncMerge(emit = () => {}) {
  const stats = { images: 0, files: 0, added: 0, total: 0 };

  try {
    emit({ phase: "start", message: "Starting sync..." });

    // Clone repos from GitHub
    emit({ phase: "start", message: "Cloning repositories from GitHub..." });
    if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });

    if (!GITHUB_PAT) throw new Error("GITHUB_PAT environment variable is not set");

    const gitUrl1 = `https://${GITHUB_PAT}@github.com/${GITHUB_OWNER}/${GITHUB_MAIN_REPO}.git`;
    const gitUrl2 = `https://${GITHUB_PAT}@github.com/${GITHUB_OWNER}/${GITHUB_IMAGES_REPO}.git`;

    try {
      const output1 = execSync(`git clone ${gitUrl1} "${SAWOREPO1_DIR}"`, { encoding: "utf-8" });
      console.log(`✅ Cloned ${GITHUB_MAIN_REPO}`);
      emit({ phase: "start", message: `Cloned ${GITHUB_MAIN_REPO}` });
    } catch (e) {
      console.error(`❌ Clone failed for ${GITHUB_MAIN_REPO}:`, e.message);
      emit({ phase: "start", message: `⚠️  Clone failed: ${e.message}` });
      fs.mkdirSync(SAWOREPO1_DIR, { recursive: true });
    }

    try {
      const output2 = execSync(`git clone ${gitUrl2} "${SAWOREPO2_DIR}"`, { encoding: "utf-8" });
      console.log(`✅ Cloned ${GITHUB_IMAGES_REPO}`);
      emit({ phase: "start", message: `Cloned ${GITHUB_IMAGES_REPO}` });
    } catch (e) {
      console.error(`❌ Clone failed for ${GITHUB_IMAGES_REPO}:`, e.message);
      emit({ phase: "start", message: `⚠️  Clone failed: ${e.message}` });
      fs.mkdirSync(SAWOREPO2_DIR, { recursive: true });
    }

    // Configure git
    configureGit(SAWOREPO1_DIR);
    configureGit(SAWOREPO2_DIR);

    // 1. Fetch from Supabase
    emit({ phase: "fetch", message: "Connecting to Supabase..." });
    const { products: supabaseProducts, categories, tags } = await fetchSupabaseData();
    emit({ phase: "fetch", message: `Fetched ${supabaseProducts.length} products from Supabase` });

    // 2. Diff against local
    const existingProducts = fs.existsSync(PRODUCTS_JSON)
      ? JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf-8"))
      : [];
    const existingIds = new Set(existingProducts.map(p => p.id));
    const newProducts = supabaseProducts.filter(p => !existingIds.has(p.id));
    stats.total = supabaseProducts.length;
    stats.added = newProducts.length;

    // 3. Download images & files for new products
    if (newProducts.length === 0) {
      emit({ phase: "images", message: "No new products — skipping downloads" });
    } else {
      emit({ phase: "images", message: `Downloading images for ${newProducts.length} new product(s)...` });
      for (let i = 0; i < newProducts.length; i++) {
        const p = newProducts[i];
        if (p.thumbnail) p.thumbnail = await processImageField(p.thumbnail, "product-images", stats);
        if (Array.isArray(p.images)) p.images = await processImageField(p.images, "product-images", stats);
        if (Array.isArray(p.spec_images)) p.spec_images = await processImageField(p.spec_images, "product-images", stats);
        if (Array.isArray(p.files)) p.files = await processFiles(p.files, stats);
        emit({ phase: "images", message: `Processed ${i + 1}/${newProducts.length}: ${p.name || p.id}` });
      }
      emit({ phase: "images", message: `Downloaded ${stats.images} image(s), ${stats.files} file(s)` });
    }

    // 4. Prepare merged data
    emit({ phase: "write", message: "Writing JSON files..." });
    const merged = [...existingProducts, ...newProducts].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    const timestamp = new Date().toISOString();
    const meta = {
      last_synced: timestamp,
      total_products: merged.length,
      new_products_added: newProducts.length,
      total_images_downloaded: stats.images,
      total_files_downloaded: stats.files,
    };

    // Write ONLY to cloned saworepo1 for git commit (inside sawo-main folder)
    const saworepo1DataDir = path.join(SAWOREPO1_DIR, "sawo-main/frontend/src/Administrator/Local/data");
    fs.mkdirSync(saworepo1DataDir, { recursive: true });
    console.log(`📝 Writing data files to saworepo1: ${saworepo1DataDir}`);
    fs.writeFileSync(path.join(saworepo1DataDir, "products.json"), JSON.stringify(merged, null, 2));
    fs.writeFileSync(path.join(saworepo1DataDir, "categories.json"), JSON.stringify(categories, null, 2));
    fs.writeFileSync(path.join(saworepo1DataDir, "tags.json"), JSON.stringify(tags, null, 2));
    fs.writeFileSync(path.join(saworepo1DataDir, "meta.json"), JSON.stringify(meta, null, 2));
    console.log(`✅ Wrote ${newProducts.length} products to saworepo1 data directory`);

    // 5. Mirror products.json into saworepo2 for git commit
    emit({ phase: "write", message: "Mirroring products.json to saworepo2..." });
    fs.writeFileSync(path.join(SAWOREPO2_DIR, "products.json"), JSON.stringify(merged, null, 2));

    // 6. Commit and push saworepo1 (local data files)
    emit({ phase: "git", message: "Committing changes in saworepo1..." });
    const saworepo1Result = commitAndPushRepo(SAWOREPO1_DIR, timestamp, stats, GITHUB_PAT);
    if (saworepo1Result.nothing) {
      emit({ phase: "git", message: "saworepo1: Nothing to commit" });
    } else if (saworepo1Result.committed) {
      emit({ phase: "git", message: `saworepo1: ${saworepo1Result.commitMsg}` });
      if (saworepo1Result.pushed) {
        emit({ phase: "git", message: "saworepo1: Pushed to GitHub ✓" });
      } else {
        emit({ phase: "git", message: `saworepo1: ❌ Push failed: ${saworepo1Result.pushError}`, warning: true });
      }
    } else {
      emit({ phase: "git", message: `saworepo1: ❌ Commit failed: ${saworepo1Result.error}`, warning: true });
    }

    // 7. Commit and push saworepo2
    emit({ phase: "git", message: "Committing changes in saworepo2..." });
    const gitResult = commitAndPushRepo(SAWOREPO2_DIR, timestamp, stats, GITHUB_PAT);
    if (gitResult.nothing) {
      emit({ phase: "git", message: "saworepo2: Nothing to commit" });
    } else if (gitResult.committed) {
      emit({ phase: "git", message: `saworepo2: ${gitResult.commitMsg}` });
      if (gitResult.pushed) {
        emit({ phase: "git", message: "saworepo2: Pushed to GitHub ✓" });
      } else {
        emit({ phase: "git", message: `saworepo2: ❌ Push failed: ${gitResult.pushError}`, warning: true });
      }
    } else {
      emit({ phase: "git", message: `saworepo2: ❌ Commit failed: ${gitResult.error}`, warning: true });
    }

    // Clean up temp directory
    try {
      execSync(`rm -rf "${WORK_DIR}"`, { stdio: "pipe" });
    } catch (e) {
      console.warn("⚠️  Failed to clean up temp directory:", e.message);
    }

    emit({
      phase: "complete",
      success: true,
      message: newProducts.length === 0
        ? "Already up to date"
        : `Added ${newProducts.length} product(s), ${stats.images} image(s), ${stats.files} file(s)`,
      stats,
      timestamp,
      pushed: gitResult.pushed || saworepo1Result.pushed,
    });

    return { success: true, ...stats, timestamp, pushed: gitResult.pushed || saworepo1Result.pushed, commits: { saworepo1: saworepo1Result, saworepo2: gitResult } };
  } catch (err) {
    console.error("❌ Sync failed:", err);
    emit({ phase: "error", success: false, message: err.message, stack: err.stack });
    return { success: false, message: err.message, error: err.message };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function fetchSupabaseData() {
  const [products, categories, tags] = await Promise.all([
    supabase.from("products").select("*").eq("is_deleted", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, slug, description"),
    supabase.from("tags").select("id, name, slug"),
  ]);
  if (products.error) throw new Error(`Products fetch failed: ${products.error.message}`);
  if (categories.error) throw new Error(`Categories fetch failed: ${categories.error.message}`);
  if (tags.error) throw new Error(`Tags fetch failed: ${tags.error.message}`);
  return { products: products.data || [], categories: categories.data || [], tags: tags.data || [] };
}

async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    return fs.statSync(outputPath).size > 0;
  } catch (err) {
    console.warn(`⚠️  Failed to download ${url}: ${err.message}`);
    return false;
  }
}

async function processImageField(value, bucket, stats, imagesDir = IMAGES_DIR) {
  if (!value) return value;
  if (Array.isArray(value)) {
    const results = [];
    for (const item of value) results.push(await processImageField(item, bucket, stats, imagesDir));
    return results;
  }
  if (!value.includes("http") && !value.includes("://")) return value;

  const filename = path.basename(value);
  const downloadUrl = value.includes(SUPABASE_URL)
    ? value
    : `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${value}`;
  const outputPath = path.join(imagesDir, filename);
  const ok = await downloadImage(downloadUrl, outputPath);
  if (ok) { stats.images++; return `images/${filename}`; }
  return value;
}

async function processFiles(filesArray, stats, filesDir = FILES_DIR) {
  if (!filesArray || !Array.isArray(filesArray)) return filesArray;
  const out = [];
  for (const f of filesArray) {
    if (typeof f === "object" && f.path) {
      const filename = path.basename(f.path);
      const url = `${SUPABASE_URL}/storage/v1/object/public/product-pdf/${f.path}`;
      const ok = await downloadImage(url, path.join(filesDir, filename));
      if (ok) { stats.files++; out.push({ ...f, path: `files/${filename}` }); }
      else out.push(f);
    } else out.push(f);
  }
  return out;
}

function ensureDirs() {
  for (const d of [DATA_DIR, IMAGES_DIR, FILES_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function configureGit(dir) {
  const run = (cmd) => execSync(cmd, { cwd: dir, encoding: "utf-8", stdio: "pipe" });
  try {
    run('git config user.name "SAWO Auto-Sync"');
    run('git config user.email "sync@sawo.local"');
  } catch (e) {
    console.warn("⚠️  Failed to configure git in", dir, e.message);
  }
}

function commitAndPushRepo(repoDir, timestamp, stats, githubPat) {
  const run = (cmd) => execSync(cmd, { cwd: repoDir, encoding: "utf-8", stdio: "pipe" });
  try {
    // Check if git repo exists
    if (!fs.existsSync(path.join(repoDir, ".git"))) {
      console.error(`❌ Not a git repo: ${repoDir}`);
      return { committed: false, pushed: false, error: "Not a git repository" };
    }

    const status = run("git status --porcelain").trim();
    if (!status) return { nothing: true };

    run("git add -A");
    const ts = timestamp.replace("T", " ").split(".")[0];
    const commitMsg = `Auto-sync: Product images and data [${ts}]`;
    run(`git commit -m "${commitMsg}"`);

    try {
      const branch = run("git rev-parse --abbrev-ref HEAD").trim();
      if (!githubPat) throw new Error("GITHUB_PAT is not set");

      const pushUrl = `https://${githubPat}@github.com/${GITHUB_OWNER}/${path.basename(repoDir)}.git`;
      run(`git push ${pushUrl} ${branch}`);
      console.log(`✅ Pushed ${path.basename(repoDir)} to ${branch}`);
      return { committed: true, pushed: true, commitMsg };
    } catch (e) {
      console.error(`❌ Push failed for ${path.basename(repoDir)}:`, e.message);
      return { committed: true, pushed: false, commitMsg, pushError: e.message.split("\n")[0] };
    }
  } catch (err) {
    console.error(`❌ Commit failed for ${path.basename(repoDir)}:`, err.message);
    return { committed: false, pushed: false, error: err.message };
  }
}

// ── Update local files from frontend changes ─────────────────────────────────
// Receives updated products, categories, tags, downloads images, and commits to GitHub
export async function updateLocalFiles(products, categories, tags, emit = () => {}) {
  const timestamp = new Date().toISOString();
  const workDir = path.join("/tmp", "sawo-update-" + Date.now());

  try {
    emit({ phase: "start", message: "Starting local file update..." });

    if (!GITHUB_PAT) throw new Error("GITHUB_PAT environment variable is not set");

    // Clone both repos
    emit({ phase: "clone", message: "Cloning repositories from GitHub..." });
    if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

    const gitUrl1 = `https://${GITHUB_PAT}@github.com/${GITHUB_OWNER}/${GITHUB_MAIN_REPO}.git`;
    const gitUrl2 = `https://${GITHUB_PAT}@github.com/${GITHUB_OWNER}/${GITHUB_IMAGES_REPO}.git`;
    const saworepo1Dir = path.join(workDir, GITHUB_MAIN_REPO);
    const saworepo2Dir = path.join(workDir, GITHUB_IMAGES_REPO);
    const imagesDir = path.join(saworepo2Dir, "images");
    const filesDir = path.join(saworepo2Dir, "files");

    try {
      execSync(`git clone ${gitUrl1} "${saworepo1Dir}"`, { encoding: "utf-8", stdio: "pipe" });
      console.log(`✅ Cloned ${GITHUB_MAIN_REPO}`);
      emit({ phase: "clone", message: `Cloned ${GITHUB_MAIN_REPO}` });
    } catch (e) {
      console.error(`❌ Clone failed for ${GITHUB_MAIN_REPO}:`, e.message);
      emit({ phase: "clone", message: `⚠️  Clone failed: ${e.message}` });
      fs.mkdirSync(saworepo1Dir, { recursive: true });
    }

    try {
      execSync(`git clone ${gitUrl2} "${saworepo2Dir}"`, { encoding: "utf-8", stdio: "pipe" });
      console.log(`✅ Cloned ${GITHUB_IMAGES_REPO}`);
      emit({ phase: "clone", message: `Cloned ${GITHUB_IMAGES_REPO}` });
    } catch (e) {
      console.error(`❌ Clone failed for ${GITHUB_IMAGES_REPO}:`, e.message);
      emit({ phase: "clone", message: `⚠️  Clone failed for images repo: ${e.message}`, warning: true });
      fs.mkdirSync(imagesDir, { recursive: true });
      fs.mkdirSync(filesDir, { recursive: true });
    }

    configureGit(saworepo1Dir);
    configureGit(saworepo2Dir);

    // Download images for any products that still have Supabase URLs
    const stats = { images: 0, files: 0 };
    emit({ phase: "write", message: `Downloading images for ${products.length} products...` });

    const processedProducts = [];
    for (let i = 0; i < products.length; i++) {
      const p = { ...products[i] };
      if (p.thumbnail) p.thumbnail = await processImageField(p.thumbnail, "product-images", stats, imagesDir);
      if (Array.isArray(p.images)) p.images = await processImageField(p.images, "product-images", stats, imagesDir);
      if (Array.isArray(p.spec_images)) p.spec_images = await processImageField(p.spec_images, "product-images", stats, imagesDir);
      if (Array.isArray(p.files)) p.files = await processFiles(p.files, stats, filesDir);
      processedProducts.push(p);
      if ((i + 1) % 20 === 0 || i === products.length - 1) {
        emit({ phase: "write", message: `Processed ${i + 1}/${products.length} products (${stats.images} images downloaded)` });
      }
    }
    emit({ phase: "write", message: `Images done: ${stats.images} downloaded, ${stats.files} files` });

    // Write JSON files to saworepo1
    emit({ phase: "write", message: "Writing JSON files..." });
    const dataDir = path.join(saworepo1Dir, "sawo-main/frontend/src/Administrator/Local/data");
    fs.mkdirSync(dataDir, { recursive: true });

    const meta = {
      last_synced: timestamp,
      total_products: processedProducts.length,
      total_categories: categories.length,
      total_tags: tags.length,
    };

    fs.writeFileSync(path.join(dataDir, "products.json"), JSON.stringify(processedProducts, null, 2));
    fs.writeFileSync(path.join(dataDir, "categories.json"), JSON.stringify(categories, null, 2));
    fs.writeFileSync(path.join(dataDir, "tags.json"), JSON.stringify(tags, null, 2));
    fs.writeFileSync(path.join(dataDir, "meta.json"), JSON.stringify(meta, null, 2));
    console.log(`✅ Wrote files to ${dataDir}`);
    emit({ phase: "write", message: "JSON files written successfully" });

    // Mirror products.json to saworepo2
    fs.writeFileSync(path.join(saworepo2Dir, "products.json"), JSON.stringify(processedProducts, null, 2));

    // Commit and push saworepo1 (data files)
    emit({ phase: "git", message: "Committing changes to saworepo1..." });
    const gitResult1 = commitAndPushRepo(saworepo1Dir, timestamp, stats, GITHUB_PAT);

    if (gitResult1.nothing) {
      emit({ phase: "git", message: "saworepo1: No changes to commit" });
    } else if (gitResult1.committed) {
      emit({ phase: "git", message: `saworepo1: ${gitResult1.commitMsg}` });
      if (gitResult1.pushed) {
        emit({ phase: "git", message: "saworepo1: Pushed to GitHub ✓" });
      } else {
        emit({ phase: "git", message: `saworepo1: ❌ Push failed: ${gitResult1.pushError}`, warning: true });
      }
    } else {
      emit({ phase: "git", message: `saworepo1: ❌ Commit failed: ${gitResult1.error}`, warning: true });
    }

    // Commit and push saworepo2 (images)
    emit({ phase: "git", message: "Committing changes to saworepo2..." });
    const gitResult2 = commitAndPushRepo(saworepo2Dir, timestamp, stats, GITHUB_PAT);

    if (gitResult2.nothing) {
      emit({ phase: "git", message: "saworepo2: No changes to commit" });
    } else if (gitResult2.committed) {
      emit({ phase: "git", message: `saworepo2: ${gitResult2.commitMsg}` });
      if (gitResult2.pushed) {
        emit({ phase: "git", message: "saworepo2: Pushed to GitHub ✓" });
      } else {
        emit({ phase: "git", message: `saworepo2: ❌ Push failed: ${gitResult2.pushError}`, warning: true });
      }
    } else {
      emit({ phase: "git", message: `saworepo2: ❌ Commit failed: ${gitResult2.error}`, warning: true });
    }

    // Auto-pull only when saworepo1 had actual data file changes (products.json / meta.json)
    if (gitResult1.pushed) {
      try {
        emit({ phase: "git", message: "Pulling changes to local development repo..." });
        const devRepoDir = path.join(__dirname, "../..");
        execSync("git pull origin HEAD", { cwd: devRepoDir, encoding: "utf-8", stdio: "pipe" });
        emit({ phase: "git", message: "Pulled latest changes to local repo ✓" });
      } catch (pullErr) {
        console.warn("⚠️  Auto-pull failed:", pullErr.message);
        emit({ phase: "git", message: `⚠️  Auto-pull failed: ${pullErr.message.split("\n")[0]}`, warning: true });
      }
    }

    // Clean up
    try {
      execSync(`rm -rf "${workDir}"`, { stdio: "pipe" });
    } catch (e) {
      console.warn("⚠️  Failed to clean up temp directory:", e.message);
    }

    emit({
      phase: "complete",
      success: true,
      message: `Local files updated — ${stats.images} images downloaded, pushed to GitHub`,
      timestamp,
      pushed: gitResult1.pushed || gitResult2.pushed,
    });

    return { success: true, timestamp, pushed: gitResult1.pushed || gitResult2.pushed };
  } catch (err) {
    console.error("❌ Update failed:", err);
    emit({ phase: "error", success: false, message: err.message });
    try {
      execSync(`rm -rf "${workDir}"`, { stdio: "pipe" });
    } catch (e) {}
    return { success: false, message: err.message };
  }
}
