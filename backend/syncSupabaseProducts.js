// Sync products from Supabase to products.json
// Merges data without removing existing products
// Downloads product images to saworepo2 and converts URLs to local paths
// Detects and removes unused images
// Run with: node syncSupabaseProducts.js

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const { Octokit } = require('@octokit/rest');
const { execSync } = require('child_process');

const PRODUCTS_FILE = path.join(__dirname, '..', 'products.json');
const IMAGES_DIR = path.join(__dirname, '..', 'frontend', 'saworepo2', 'images');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GITHUB_OWNER = process.env.REACT_APP_GITHUB_OWNER;
const GITHUB_PAT = process.env.REACT_APP_GITHUB_PAT;
const IMAGES_REPO = process.env.REACT_APP_IMAGES_REPO || 'saworepo2';

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

let octokit = null;
if (GITHUB_PAT && GITHUB_OWNER) {
  octokit = new Octokit({ auth: GITHUB_PAT });
}

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const filePath = path.join(IMAGES_DIR, filename);
    const fsSync = require('fs');
    const file = fsSync.createWriteStream(filePath);

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
    }).on('error', (err) => {
      fsSync.unlink(filePath, () => {});
      reject(err);
    });
  });
}

function extractImageFilename(url) {
  // Extract filename from Supabase URL like: ...1776156727881_b483atddk2v.webp
  const match = url.match(/([^/]+\.webp)$/i);
  return match ? match[1] : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
}

async function downloadProductImages(products) {
  const downloadStats = {
    downloaded: 0,
    skipped: 0,
    failed: 0,
    downloadedFiles: []
  };

  // Ensure images directory exists
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
  } catch (err) {
    console.warn('⚠️ Could not create images directory:', err.message);
  }

  for (const product of products) {
    const imageUrls = [];

    // Collect all image URLs
    if (product.thumbnail && typeof product.thumbnail === 'string' && product.thumbnail.startsWith('http')) {
      imageUrls.push({ url: product.thumbnail, type: 'thumbnail', id: product.id });
    }
    if (Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (typeof img === 'string' && img.startsWith('http')) {
          imageUrls.push({ url: img, type: 'image', id: product.id });
        }
      });
    }
    if (Array.isArray(product.spec_images)) {
      product.spec_images.forEach(img => {
        if (typeof img === 'string' && img.startsWith('http')) {
          imageUrls.push({ url: img, type: 'spec_image', id: product.id });
        }
      });
    }

    for (const imgData of imageUrls) {
      try {
        const filename = extractImageFilename(imgData.url);
        const localPath = path.join(IMAGES_DIR, filename);

        // Check if already exists
        try {
          require('fs').statSync(localPath);
          console.log(`⏭️  [SKIP] ${filename}`);
          downloadStats.skipped++;
        } catch {
          // File doesn't exist, download it
          await downloadImage(imgData.url, filename);
          console.log(`⬇️  [DOWNLOAD] ${filename}`);
          downloadStats.downloaded++;
          downloadStats.downloadedFiles.push(filename);
        }
      } catch (err) {
        console.error(`❌ [ERROR] Failed to download image for product ${product.id}:`, err.message);
        downloadStats.failed++;
      }
    }
  }

  return downloadStats;
}

async function uploadImageToGitHub(localFilePath, filename) {
  if (!octokit || !GITHUB_OWNER) {
    return null;
  }

  try {
    const imageBuffer = require('fs').readFileSync(localFilePath);
    const base64Content = imageBuffer.toString('base64');
    const gitPath = `images/${filename}`;

    // Check if file exists
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: IMAGES_REPO,
        path: gitPath
      });
      sha = data.sha;
    } catch (err) {
      // File doesn't exist
    }

    // Upload or update
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: IMAGES_REPO,
      path: gitPath,
      message: `chore: sync image ${filename}`,
      content: base64Content,
      ...(sha ? { sha } : {})
    });

    return `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${IMAGES_REPO}@main/${gitPath}`;
  } catch (err) {
    console.warn(`⚠️ Failed to upload ${filename} to GitHub:`, err.message);
    return null;
  }
}

async function convertImagesToGithubUrls(products, uploadedFilenames = new Set()) {
  // Convert all Supabase image URLs to GitHub CDN URLs for free egress
  // Upload images to GitHub first, then create URLs

  for (const product of products) {
    // Convert thumbnail
    if (product.thumbnail && product.thumbnail.startsWith('http')) {
      const filename = extractImageFilename(product.thumbnail);
      const localPath = path.join(IMAGES_DIR, filename);

      // Try to upload to GitHub if file exists locally
      if (octokit && GITHUB_OWNER && !uploadedFilenames.has(filename)) {
        try {
          if (require('fs').existsSync(localPath)) {
            const url = await uploadImageToGitHub(localPath, filename);
            if (url) {
              product.thumbnail = url;
              uploadedFilenames.add(filename);
            } else {
              product.thumbnail = `/product-images/${filename}`;
            }
          } else {
            product.thumbnail = `/product-images/${filename}`;
          }
        } catch (err) {
          product.thumbnail = `/product-images/${filename}`;
        }
      } else if (GITHUB_OWNER) {
        product.thumbnail = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${IMAGES_REPO}@main/images/${filename}`;
      } else {
        product.thumbnail = `/product-images/${filename}`;
      }
    }

    // Convert images array
    if (Array.isArray(product.images)) {
      product.images = await Promise.all(product.images.map(async img => {
        if (typeof img === 'string' && img.startsWith('http')) {
          const filename = extractImageFilename(img);
          const localPath = path.join(IMAGES_DIR, filename);

          if (octokit && GITHUB_OWNER && !uploadedFilenames.has(filename)) {
            try {
              if (require('fs').existsSync(localPath)) {
                const url = await uploadImageToGitHub(localPath, filename);
                if (url) {
                  uploadedFilenames.add(filename);
                  return url;
                }
              }
            } catch (err) {}
          }

          if (GITHUB_OWNER) {
            return `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${IMAGES_REPO}@main/images/${filename}`;
          }
          return `/product-images/${filename}`;
        }
        return img;
      }));
    }

    // Convert spec_images array
    if (Array.isArray(product.spec_images)) {
      product.spec_images = await Promise.all(product.spec_images.map(async img => {
        if (typeof img === 'string' && img.startsWith('http')) {
          const filename = extractImageFilename(img);
          const localPath = path.join(IMAGES_DIR, filename);

          if (octokit && GITHUB_OWNER && !uploadedFilenames.has(filename)) {
            try {
              if (require('fs').existsSync(localPath)) {
                const url = await uploadImageToGitHub(localPath, filename);
                if (url) {
                  uploadedFilenames.add(filename);
                  return url;
                }
              }
            } catch (err) {}
          }

          if (GITHUB_OWNER) {
            return `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${IMAGES_REPO}@main/images/${filename}`;
          }
          return `/product-images/${filename}`;
        }
        return img;
      }));
    }
  }
}

async function detectUnusedImages(products) {
  const usedImages = new Set();

  // Collect all image filenames currently in use
  for (const product of products) {
    const collect = (url) => {
      if (typeof url === 'string' && url.startsWith('/product-images/')) {
        usedImages.add(path.basename(url));
      }
    };

    if (product.thumbnail) collect(product.thumbnail);
    if (Array.isArray(product.images)) product.images.forEach(collect);
    if (Array.isArray(product.spec_images)) product.spec_images.forEach(collect);
  }

  // Find unused images in directory
  const unused = [];
  try {
    const files = await fs.readdir(IMAGES_DIR);
    for (const file of files) {
      if (file !== '.gitkeep' && !usedImages.has(file)) {
        unused.push(file);
      }
    }
  } catch (err) {
    console.error('⚠️ Could not scan images directory:', err.message);
  }

  return unused;
}

async function removeUnusedImages(unusedImages) {
  const removeStats = {
    removed: 0,
    failed: 0
  };

  for (const filename of unusedImages) {
    try {
      const filePath = path.join(IMAGES_DIR, filename);
      await fs.unlink(filePath);
      console.log(`🗑️  [REMOVED] ${filename}`);
      removeStats.removed++;
    } catch (err) {
      console.error(`❌ [ERROR] Could not remove ${filename}:`, err.message);
      removeStats.failed++;
    }
  }

  return removeStats;
}

async function commitChanges(downloadedFiles, removedFiles) {
  try {
    const saworepo2Path = path.join(__dirname, '..', 'frontend', 'saworepo2');

    if (downloadedFiles.length === 0 && removedFiles.length === 0) {
      console.log('📌 No image changes to commit');
      return { committed: false };
    }

    console.log('\n📤 Committing changes to saworepo2...');

    // Stage changes
    execSync('git add -A', { cwd: saworepo2Path });

    // Create commit message with summary
    const summary = [];
    if (downloadedFiles.length > 0) {
      summary.push(`Downloaded: ${downloadedFiles.length} image(s)`);
    }
    if (removedFiles.length > 0) {
      summary.push(`Removed: ${removedFiles.length} unused image(s)`);
    }

    const commitMsg = `chore: sync product images from supabase\n\n${summary.join('\n')}`;

    // Use git commit with message file to handle formatting properly
    const msgFile = path.join(saworepo2Path, '.git', 'COMMIT_EDITMSG');
    require('fs').writeFileSync(msgFile, commitMsg, 'utf8');
    execSync(`git commit -F "${msgFile}"`, { cwd: saworepo2Path });

    console.log('✅ Changes committed to saworepo2');
    return { committed: true };
  } catch (err) {
    const errMsg = err.message || err.toString();
    if (errMsg.includes('nothing to commit') || errMsg.includes('no changes added')) {
      console.log('📌 No changes to commit to saworepo2');
      return { committed: false };
    }
    console.error('⚠️ Could not commit to saworepo2:', errMsg);
    return { committed: false, error: errMsg };
  }
}

async function commitProductsJson(addedCount, updatedCount) {
  try {
    const mainRepoPath = path.join(__dirname, '..');

    console.log('\n📤 Committing products.json to GitHub...');

    // Stage products.json
    execSync('git add products.json', { cwd: mainRepoPath });

    // Create commit message
    const summary = [];
    if (addedCount > 0) {
      summary.push(`Added: ${addedCount} product(s)`);
    }
    if (updatedCount > 0) {
      summary.push(`Updated: ${updatedCount} product(s)`);
    }

    const commitMsg = `chore: sync products from supabase\n\n${summary.join('\n')}`;

    // Use git commit with message file
    const msgFile = path.join(mainRepoPath, '.git', 'COMMIT_EDITMSG');
    require('fs').writeFileSync(msgFile, commitMsg, 'utf8');
    execSync(`git commit -F "${msgFile}"`, { cwd: mainRepoPath });

    console.log('✅ products.json committed to GitHub');
    return { committed: true };
  } catch (err) {
    const errMsg = err.message || err.toString();
    if (errMsg.includes('nothing to commit') || errMsg.includes('no changes added')) {
      console.log('📌 No changes to commit');
      return { committed: false };
    }
    console.error('⚠️ Could not commit products.json:', errMsg);
    return { committed: false, error: errMsg };
  }
}

async function syncProducts() {
  const syncResult = {
    scanned: 0,
    added: 0,
    updated: 0,
    kept: 0,
    added_products: [],
    updated_products: [],
    kept_products: [],
    error: null
  };

  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.error('❌ Supabase not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
      syncResult.error = 'Supabase credentials not configured. Add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env';
      return syncResult;
    }

    console.log('📊 [SYNC] Starting product sync from Supabase...\n');

    // Step 1: Read current products.json
    console.log('📖 Reading current products.json...');
    let currentData;
    try {
      const content = await fs.readFile(PRODUCTS_FILE, 'utf8');
      currentData = JSON.parse(content);
    } catch (err) {
      console.warn('⚠️ products.json not found, starting with empty array');
      currentData = { updatedAt: new Date().toISOString(), products: [] };
    }
    const currentProducts = currentData.products || [];
    console.log(`✅ Loaded ${currentProducts.length} products from products.json\n`);

    // Step 2: Fetch products from Supabase
    console.log('🔄 Fetching products from Supabase...');
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('❌ Failed to fetch from Supabase:', error.message);
      syncResult.error = error.message;
      return syncResult;
    }

    syncResult.scanned = supabaseProducts.length;
    console.log(`✅ Loaded ${supabaseProducts.length} products from Supabase\n`);

    // Step 3: Merge products intelligently
    console.log('🔀 Merging products...\n');
    const { mergedProducts, stats } = mergeProducts(currentProducts, supabaseProducts);
    syncResult.added = stats.added;
    syncResult.updated = stats.updated;
    syncResult.kept = stats.kept;
    syncResult.added_products = stats.addedList;
    syncResult.updated_products = stats.updatedList;
    syncResult.kept_products = stats.keptList;

    // Step 4: Download product images from Supabase
    console.log('\n📥 Downloading product images...\n');
    const imageDownloadStats = await downloadProductImages(mergedProducts);
    console.log(`Downloaded: ${imageDownloadStats.downloaded}, Skipped: ${imageDownloadStats.skipped}, Failed: ${imageDownloadStats.failed}\n`);

    // Step 5: Convert image URLs to GitHub CDN (for free egress, no Supabase fees)
    console.log('🔗 Converting image URLs to GitHub CDN...\n');
    await convertImagesToGithubUrls(mergedProducts);
    console.log('✅ URLs converted to GitHub CDN URLs\n');

    // Step 6: Detect and remove unused images
    console.log('🔍 Detecting unused images...\n');
    const unusedImages = await detectUnusedImages(mergedProducts);
    if (unusedImages.length > 0) {
      console.log(`Found ${unusedImages.length} unused image(s):\n`);
      const removeStats = await removeUnusedImages(unusedImages);
      console.log(`Removed: ${removeStats.removed}, Failed: ${removeStats.failed}\n`);
    } else {
      console.log('No unused images found\n');
    }

    // Step 7: Save merged products with local image paths
    console.log(`💾 Saving ${mergedProducts.length} products to products.json...\n`);
    const newData = {
      updatedAt: new Date().toISOString(),
      products: mergedProducts,
      syncSource: 'supabase-merge',
      syncedAt: new Date().toISOString()
    };

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(newData, null, 2), 'utf8');
    console.log('✅ products.json updated with local image paths\n');

    // Step 8: Commit image changes to saworepo2
    const commitResult = await commitChanges(imageDownloadStats.downloadedFiles, unusedImages);
    if (commitResult.committed) {
      syncResult.images_downloaded = imageDownloadStats.downloaded;
      syncResult.images_removed = unusedImages.length;
    }

    // Step 9: Commit products.json to main repo
    const productsCommitResult = await commitProductsJson(stats.added, stats.updated);
    if (productsCommitResult.committed) {
      syncResult.products_committed = true;
    }

    // Step 10: Print summary
    printSummary(currentProducts, supabaseProducts, mergedProducts, stats, imageDownloadStats, unusedImages);
    return syncResult;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mergeProducts(currentProducts, supabaseProducts) {
  const merged = [...currentProducts];
  let addedCount = 0;
  const addedList = [];
  const skippedList = [];

  // Index existing products by ID
  const existingIds = new Set(currentProducts.map(p => p.id));

  for (const supProduct of supabaseProducts) {
    if (existingIds.has(supProduct.id)) {
      // Product exists in current → CHECK if it was from Supabase originally
      const existing = currentProducts.find(p => p.id === supProduct.id);

      // Only update if product came from Supabase (has source: 'supabase' or is from enrich scripts)
      // If created locally (no supabase source), skip it completely
      if (existing.source === 'supabase') {
        // Product was from Supabase before - check if data changed
        if (!productsAreEqual(existing, supProduct)) {
          const updated = enrichSupabaseProduct(existing, supProduct);
          const idx = merged.findIndex(p => p.id === supProduct.id);
          merged[idx] = updated;
          console.log(`🔄 [UPDATE] ${updated.slug || updated.name}`);
        } else {
          console.log(`⏭️  [SKIP] ${supProduct.slug || supProduct.name}: no changes`);
        }
      } else {
        // Product created locally - don't touch it
        console.log(`📌 [SKIP] ${supProduct.slug || supProduct.name}: locally created product`);
      }
      skippedList.push({ id: supProduct.id, name: supProduct.name, slug: supProduct.slug });
    } else {
      // Product is NEW in Supabase → ADD IT
      const newProduct = normalizeSupabaseProduct(supProduct);
      merged.push(newProduct);
      console.log(`✨ [ADD] ${newProduct.slug || newProduct.name}`);
      addedCount++;
      addedList.push({ id: newProduct.id, name: newProduct.name, slug: newProduct.slug });
    }
  }

  // Keep any products from currentProducts that aren't in Supabase at all
  const keptProducts = currentProducts.filter(p => !supabaseProducts.find(sp => sp.id === p.id));
  const keptList = keptProducts.map(p => ({ id: p.id, name: p.name, slug: p.slug }));
  if (keptProducts.length > 0) {
    console.log(`\n📌 Keeping ${keptProducts.length} products not in Supabase`);
  }

  return {
    mergedProducts: merged,
    stats: {
      added: addedCount,
      updated: 0,
      kept: keptProducts.length + skippedList.length,
      addedList,
      updatedList: [],
      keptList: [...keptList, ...skippedList]
    }
  };
}

function productsAreEqual(existing, supabase) {
  // Compare key fields to detect if there's actual change
  const fieldsToCompare = [
    'name', 'slug', 'description', 'short_description', 'brand',
    'type', 'spec_table', 'resources', 'status', 'visible', 'featured',
    'sort_order', 'is_deleted'
  ];

  for (const field of fieldsToCompare) {
    const existingVal = existing[field];
    const supabaseVal = supabase[field];
    if (existingVal !== supabaseVal) {
      return false;
    }
  }

  // Compare arrays
  const arrayFields = ['categories', 'tags', 'features'];
  for (const field of arrayFields) {
    const existingArr = toArray(existing[field]);
    const supabaseArr = toArray(supabase[field]);
    if (existingArr.length !== supabaseArr.length ||
        !existingArr.every((v, i) => v === supabaseArr[i])) {
      return false;
    }
  }

  return true;
}

function enrichSupabaseProduct(existing, supProduct) {
  // Update product from Supabase while preserving local customizations
  return {
    ...existing,
    name: supProduct.name || existing.name,
    slug: supProduct.slug || existing.slug,
    description: supProduct.description !== undefined ? supProduct.description : existing.description,
    short_description: supProduct.short_description || existing.short_description,
    brand: supProduct.brand || existing.brand,
    type: supProduct.type || existing.type,
    spec_table: supProduct.spec_table || existing.spec_table,
    resources: supProduct.resources || existing.resources,
    status: supProduct.status || existing.status,
    visible: supProduct.visible !== undefined ? supProduct.visible : existing.visible,
    featured: supProduct.featured !== undefined ? supProduct.featured : existing.featured,
    sort_order: supProduct.sort_order ?? existing.sort_order,
    categories: toArray(supProduct.categories) || existing.categories,
    tags: toArray(supProduct.tags) || existing.tags,
    features: toArray(supProduct.features) || existing.features,
    auto_tag_columns: supProduct.auto_tag_columns || existing.auto_tag_columns,
    thumbnail: supProduct.thumbnail || existing.thumbnail,
    images: supProduct.images || existing.images,
    spec_images: supProduct.spec_images || existing.spec_images,
    files: supProduct.files || existing.files,
    updated_by_username: existing.updated_by_username,
    updated_at: supProduct.updated_at || existing.updated_at,
    is_deleted: supProduct.is_deleted || existing.is_deleted,
    source: 'supabase'
  };
}

function normalizeSupabaseProduct(supProduct) {
  // Convert Supabase product to our standard format
  return {
    id: supProduct.id,
    name: supProduct.name || '',
    slug: supProduct.slug || '',
    description: supProduct.description || '',
    short_description: supProduct.short_description || '',
    brand: supProduct.brand || 'SAWO',
    type: supProduct.type || null,
    spec_table: supProduct.spec_table || null,
    resources: supProduct.resources || null,
    status: supProduct.status || 'draft',
    visible: supProduct.visible !== false,
    featured: supProduct.featured === true,
    sort_order: supProduct.sort_order || 0,
    categories: supProduct.categories || [],
    tags: supProduct.tags || [],
    features: supProduct.features || [],
    auto_tag_columns: supProduct.auto_tag_columns || null,
    thumbnail: supProduct.thumbnail || null,
    images: supProduct.images || [],
    spec_images: supProduct.spec_images || [],
    files: supProduct.files || [],
    created_by: supProduct.created_by || null,
    created_by_username: supProduct.created_by_username || null,
    updated_by_username: supProduct.updated_by_username || null,
    created_at: supProduct.created_at || new Date().toISOString(),
    updated_at: supProduct.updated_at || new Date().toISOString(),
    is_deleted: supProduct.is_deleted === true,
    source: 'supabase' // Mark as from Supabase
  };
}


function printSummary(before, supabase, after, stats, imageStats, unusedImages) {
  console.log('═══════════════════════════════════════');
  console.log('          SYNC SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Before: ${before.length} products`);
  console.log(`From Supabase: ${supabase.length} products`);
  console.log(`After: ${after.length} products`);
  console.log(`---`);
  console.log(`✨ Added: ${stats.added}`);
  console.log(`🔄 Updated: ${stats.updated}`);
  console.log(`📌 Protected: ${stats.kept}`);
  console.log(`---`);
  if (imageStats) {
    console.log(`⬇️  Images Downloaded: ${imageStats.downloaded}`);
    console.log(`⏭️  Images Skipped: ${imageStats.skipped}`);
    console.log(`🗑️  Images Removed: ${unusedImages ? unusedImages.length : 0}`);
  }
  console.log('═══════════════════════════════════════\n');
}

async function checkImageSetup() {
  try {
    const publicPath = path.join(__dirname, '..', 'frontend', 'public');
    const productImagesPath = path.join(publicPath, 'product-images');

    // Check if product-images link/folder exists
    try {
      require('fs').statSync(productImagesPath);
      console.log('✅ Image serving setup verified\n');
      return true;
    } catch {
      console.log('\n⚠️  Image serving not configured yet');
      console.log('📖 Read SETUP_IMAGES.md for configuration instructions');
      console.log('   Quick setup: ln -s ../saworepo2/images frontend/public/product-images\n');
      return false;
    }
  } catch (err) {
    console.warn('⚠️ Could not verify image setup:', err.message);
    return false;
  }
}

// Export for use as module
module.exports = { syncProducts };

// Run the sync if called directly
if (require.main === module) {
  syncProducts().then(result => {
    if (result.error) {
      console.error('Sync failed:', result.error);
      process.exit(1);
    }
    // Check if image serving is configured
    checkImageSetup();
    process.exit(0);
  }).catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}
