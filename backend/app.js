require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;
const PRODUCTS_FILE = path.join(__dirname, '..', 'products.json');
const SAWOREPO2_IMAGES = path.join(__dirname, '..', 'frontend', 'saworepo2', 'images');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static file serving for local image cache
app.use('/images', express.static(SAWOREPO2_IMAGES, { maxAge: '1d' }));

// Test route
app.get('/', (req, res) => {
  res.send('Hello from Express backend!');
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const json = JSON.parse(data);
    res.json(json.products || []);
  } catch (err) {
    console.error('Error reading products:', err);
    res.status(500).json({ error: 'Failed to read products' });
  }
});

// Save products (upsert)
app.post('/api/products/save', async (req, res) => {
  try {
    const { updatedAt, products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'products must be an array' });
    }

    const payload = {
      updatedAt: updatedAt || new Date().toISOString(),
      source: 'local-admin',
      products
    };

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(payload, null, 2), 'utf8');
    res.json({ success: true, count: products.length });
  } catch (err) {
    console.error('Error saving products:', err);
    res.status(500).json({ error: 'Failed to save products' });
  }
});

// Delete product by ID
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const json = JSON.parse(data);
    const filtered = (json.products || []).filter(p => p.id !== id);

    const payload = {
      updatedAt: new Date().toISOString(),
      source: 'local-admin',
      products: filtered
    };

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(payload, null, 2), 'utf8');
    res.json({ success: true, removed: id });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Seed products.json from GitHub (useful for fresh dev setups)
app.post('/api/products/seed-from-github', async (req, res) => {
  try {
    const GITHUB_OWNER = process.env.REACT_APP_GITHUB_OWNER;
    const MAIN_REPO = process.env.REACT_APP_MAIN_REPO || 'saworepo1';
    if (!GITHUB_OWNER) {
      return res.status(400).json({ error: 'REACT_APP_GITHUB_OWNER not set' });
    }

    const githubUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${MAIN_REPO}@main/products.json?t=${Date.now()}`;
    const response = await fetch(githubUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from GitHub: HTTP ${response.status}`);
    }

    const json = await response.json();
    const payload = {
      updatedAt: new Date().toISOString(),
      source: 'seeded-from-github',
      products: json.products || []
    };

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(payload, null, 2), 'utf8');
    res.json({ success: true, count: payload.products.length, message: 'Products seeded from GitHub' });
  } catch (err) {
    console.error('Error seeding from GitHub:', err);
    res.status(500).json({ error: `Failed to seed: ${err.message}` });
  }
});

// Sync local to GitHub (manual trigger)
app.post('/api/products/sync-github', async (req, res) => {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const json = JSON.parse(data);
    res.json({ synced: json.products.length, message: 'Ready to sync to GitHub' });
  } catch (err) {
    console.error('Error syncing:', err);
    res.status(500).json({ error: 'Failed to prepare sync' });
  }
});

// Sync product images from CDN to local cache
app.post('/api/products/sync-images', async (req, res) => {
  const { urls } = req.body;
  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: 'urls must be an array' });
  }

  // Ensure images directory exists
  try {
    if (!fsSync.existsSync(SAWOREPO2_IMAGES)) {
      await fs.mkdir(SAWOREPO2_IMAGES, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating images directory:', err);
  }

  const results = [];
  for (const url of urls) {
    if (!url || typeof url !== 'string') continue;

    try {
      const filename = url.split('/').pop();
      const dest = path.join(SAWOREPO2_IMAGES, filename);

      // Skip if already cached
      if (fsSync.existsSync(dest)) {
        results.push({ url, status: 'cached', filename });
        continue;
      }

      // Download and save
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = await response.buffer();
      await fs.writeFile(dest, buffer);
      results.push({ url, status: 'downloaded', filename });
    } catch (err) {
      results.push({ url, status: 'error', filename: url.split('/').pop(), message: err.message });
    }
  }

  res.json({ success: true, results });
});

// Auto-seed from GitHub if products.json is missing/empty
async function ensureProductsExist() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const json = JSON.parse(data);
    const count = (json.products || []).length;
    if (count > 0) {
      console.log(`✓ Loaded ${count} products from local ${PRODUCTS_FILE}`);
      return;
    }
  } catch (_) {}

  // File missing or empty — seed from GitHub
  try {
    console.log('📥 Local products.json empty/missing. Auto-seeding from GitHub...');
    const GITHUB_OWNER = process.env.REACT_APP_GITHUB_OWNER;
    const MAIN_REPO = process.env.REACT_APP_MAIN_REPO || 'saworepo1';
    if (!GITHUB_OWNER) {
      console.warn('⚠ REACT_APP_GITHUB_OWNER not set — skipping auto-seed');
      return;
    }

    const githubUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${MAIN_REPO}@main/products.json?t=${Date.now()}`;
    const response = await fetch(githubUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    const payload = {
      updatedAt: new Date().toISOString(),
      source: 'seeded-from-github',
      products: json.products || []
    };

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`✓ Auto-seeded ${payload.products.length} products from GitHub`);
  } catch (err) {
    console.error('✗ Auto-seed failed:', err.message);
  }
}

// Get backup history (list available backups)
app.get('/api/products/backups', async (req, res) => {
  try {
    const { Octokit } = require('@octokit/rest');
    require('dotenv').config();
    const octokit = new Octokit({ auth: process.env.REACT_APP_GITHUB_PAT });
    const OWNER = process.env.REACT_APP_GITHUB_OWNER;

    const { data: commits } = await octokit.repos.listCommits({
      owner: OWNER,
      repo: 'saworepo1',
      path: 'products.json',
      per_page: 10
    });

    const backups = commits.map(c => ({
      sha: c.sha.substring(0, 7),
      fullSha: c.sha,
      message: c.commit.message.split('\n')[0],
      date: c.commit.author.date,
      author: c.commit.author.name
    }));

    res.json({ backups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore from backup
app.post('/api/products/restore/:sha', async (req, res) => {
  try {
    const { sha } = req.params;
    const { Octokit } = require('@octokit/rest');
    require('dotenv').config();
    const octokit = new Octokit({ auth: process.env.REACT_APP_GITHUB_PAT });
    const OWNER = process.env.REACT_APP_GITHUB_OWNER;

    // Get the file at that commit
    const { data: file } = await octokit.repos.getContent({
      owner: OWNER,
      repo: 'saworepo1',
      path: 'products.json',
      ref: sha
    });

    // Get current SHA
    const { data: current } = await octokit.repos.getContent({
      owner: OWNER,
      repo: 'saworepo1',
      path: 'products.json'
    });

    // Restore
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: 'saworepo1',
      path: 'products.json',
      message: `fix: restore from backup ${sha}`,
      content: file.content,
      sha: current.sha
    });

    res.json({ success: true, message: `Restored from ${sha}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync products from Supabase with streaming progress
app.post('/api/products/sync-supabase-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { syncProductsWithProgress } = require('./syncSupabaseProducts');

    const progressHandler = (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const result = await syncProductsWithProgress(progressHandler);

    if (!result.error) {
      res.write(`data: ${JSON.stringify({ type: 'success', result })}\n\n`);
    }
    res.end();
  } catch (err) {
    console.error('[API] Sync stream error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

// Sync products from Supabase (manual trigger - legacy)
app.post('/api/products/sync-supabase', async (req, res) => {
  try {
    console.log('[API] Starting Supabase sync...');
    const { syncProducts } = require('./syncSupabaseProducts');
    const result = await syncProducts();

    if (result.error) {
      console.error('[API] Sync failed:', result.error);
      return res.status(400).json({
        error: 'Supabase sync failed',
        message: result.error
      });
    }

    console.log('[API] Sync completed successfully');
    res.json({
      success: true,
      message: 'Supabase sync completed',
      scanned: result.scanned,
      added: result.added,
      updated: result.updated,
      kept: result.kept,
      added_products: result.added_products,
      updated_products: result.updated_products,
      kept_products: result.kept_products
    });
  } catch (err) {
    console.error('[API] Sync error:', err.message);
    res.status(500).json({
      error: 'Supabase sync failed',
      message: err.message
    });
  }
});

// Full sync from Supabase (all 3 steps + auto-commit)
app.post('/api/products/sync-full', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
    const SCRIPTS_DIR = path.join(FRONTEND_DIR, 'src', 'Administrator', 'scripts');

    console.log('[API] Starting full Supabase sync...');

    const scripts = [
      { name: 'sync-supabase-to-github.mjs', desc: 'Syncing products' },
      { name: 'enrich-products-files.mjs', desc: 'Enriching files' },
      { name: 'enrich-products-metadata.mjs', desc: 'Enriching metadata' }
    ];

    let completed = 0;
    for (const { name, desc } of scripts) {
      try {
        console.log(`[API] Step ${completed + 1}/3: ${desc}...`);
        execSync(`node ${name}`, {
          cwd: SCRIPTS_DIR,
          stdio: 'inherit'
        });
        completed++;
      } catch (err) {
        console.warn(`[API] Warning in ${name}: ${err.message}`);
      }
    }

    // Auto-commit changes to main repo
    try {
      console.log('[API] Auto-committing changes...');
      const REPO_ROOT = path.join(__dirname, '..');
      const msg = `chore: sync products from supabase at ${new Date().toISOString()}`;

      execSync('git add -A', { cwd: REPO_ROOT, stdio: 'pipe' });
      execSync(`git commit -m "${msg}" --allow-empty`, { cwd: REPO_ROOT, stdio: 'pipe' });
      console.log('[API] Changes committed');
    } catch (err) {
      console.warn('[API] Auto-commit warning:', err.message);
    }

    console.log('[API] Full sync completed');
    res.json({
      success: true,
      message: 'Full sync completed with auto-commit',
      stepsCompleted: completed,
      totalSteps: scripts.length
    });
  } catch (err) {
    console.error('[API] Full sync error:', err.message);
    res.status(500).json({
      error: 'Full sync failed',
      message: err.message
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await ensureProductsExist();
});