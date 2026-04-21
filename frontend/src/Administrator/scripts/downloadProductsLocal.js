/**
 * downloadProductsLocal.js
 *
 * Syncs products from live source (products.json) and downloads all images locally.
 * Updates image URLs to point to local saworepo2 folder.
 *
 * Usage from command line:
 *   node downloadProductsLocal.js
 *
 * Or from code:
 *   const { syncProductsLocally } = require('./downloadProductsLocal');
 *   await syncProductsLocally();
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createWriteStream } = require('fs');
const { mkdir } = require('fs').promises;

// ─── Configuration ───────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'frontend/public');
const SAWOREPO2_DIR = path.join(PROJECT_ROOT, 'frontend/saworepo2');
const IMAGES_DIR = path.join(SAWOREPO2_DIR, 'images');
const PRODUCTS_JSON_SOURCE = path.join(PUBLIC_DIR, 'products.json');
const PRODUCTS_JSON_LOCAL = path.join(PUBLIC_DIR, 'products.json');
const SAWOREPO2_IMAGE_PREFIX = 'saworepo2/images/';

// ─── Utilities ───────────────────────────────────────────────────────────────
function log(msg, type = 'info') {
  const prefix = {
    info: '🔹',
    success: '✅',
    warn: '⚠️',
    error: '❌',
    step: '➡️',
  }[type] || '•';
  console.log(`${prefix} ${msg}`);
}

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const file = createWriteStream(outputPath);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(outputPath);
      });

      file.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

function extractFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename || `image-${Date.now()}.webp`;
  } catch {
    return `image-${Date.now()}.webp`;
  }
}

function isExternalUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

async function downloadAndLocalizeImage(url, imageDir) {
  if (!isExternalUrl(url)) {
    return url; // Already local or not a URL
  }

  try {
    const filename = extractFilenameFromUrl(url);
    const outputPath = path.join(imageDir, filename);

    // Don't redownload if file exists
    if (fs.existsSync(outputPath)) {
      log(`  ↳ File exists: ${filename}`, 'info');
      return `${SAWOREPO2_IMAGE_PREFIX}${filename}`;
    }

    log(`  Downloading: ${filename}...`, 'step');
    await downloadFile(url, outputPath);
    return `${SAWOREPO2_IMAGE_PREFIX}${filename}`;
  } catch (err) {
    log(`  Failed to download ${url}: ${err.message}`, 'error');
    return url; // Return original URL if download fails
  }
}

async function syncProductsLocally() {
  try {
    log('Starting local products sync...', 'step');

    // ─── Step 1: Read source products.json ───────────────────────────────────
    log('Reading products from live source...', 'step');
    if (!fs.existsSync(PRODUCTS_JSON_SOURCE)) {
      throw new Error(`Source products.json not found at ${PRODUCTS_JSON_SOURCE}`);
    }

    const sourceData = JSON.parse(fs.readFileSync(PRODUCTS_JSON_SOURCE, 'utf-8'));
    const products = sourceData.products || [];

    if (!Array.isArray(products)) {
      throw new Error('Invalid products format in source');
    }

    log(`Found ${products.length} products to sync`, 'info');

    // ─── Step 2: Create images directory ─────────────────────────────────────
    log('Ensuring images directory exists...', 'step');
    await mkdir(IMAGES_DIR, { recursive: true });
    log(`Images directory ready: ${IMAGES_DIR}`, 'success');

    // ─── Step 3: Process each product ────────────────────────────────────────
    const localizedProducts = [];
    let downloadedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = { ...products[i] };
      log(`[${i + 1}/${products.length}] Processing: ${product.name}`, 'step');

      // Download thumbnail
      if (product.thumbnail && isExternalUrl(product.thumbnail)) {
        product.thumbnail = await downloadAndLocalizeImage(product.thumbnail, IMAGES_DIR);
        downloadedCount++;
      }

      // Download images array
      if (Array.isArray(product.images)) {
        product.images = await Promise.all(
          product.images.map(url => downloadAndLocalizeImage(url, IMAGES_DIR))
        );
        downloadedCount += product.images.filter(url => url.includes(SAWOREPO2_IMAGE_PREFIX)).length;
      }

      // Download spec_images array
      if (Array.isArray(product.spec_images)) {
        product.spec_images = await Promise.all(
          product.spec_images.map(url => downloadAndLocalizeImage(url, IMAGES_DIR))
        );
        downloadedCount += product.spec_images.filter(url => url.includes(SAWOREPO2_IMAGE_PREFIX)).length;
      }

      // Note: file.url fields (PDFs) are not downloaded - kept as remote URLs
      // They reference external PDF storage (e.g., secret-newsite.sawo.com)

      localizedProducts.push(product);
    }

    // ─── Step 4: Save localized products.json ────────────────────────────────
    log('Saving localized products.json...', 'step');
    const outputData = {
      updatedAt: new Date().toISOString(),
      products: localizedProducts,
    };

    fs.writeFileSync(PRODUCTS_JSON_LOCAL, JSON.stringify(outputData, null, 2), 'utf-8');
    log(`Saved to: ${PRODUCTS_JSON_LOCAL}`, 'success');

    // ─── Summary ─────────────────────────────────────────────────────────────
    log('', 'info');
    log('=== SYNC COMPLETE ===', 'success');
    log(`Products: ${products.length}`, 'info');
    log(`Images downloaded: ${downloadedCount}`, 'success');
    log(`Images skipped (already exist): ${skippedCount}`, 'info');
    log(`All images available at: ${IMAGES_DIR}`, 'info');
    log(`All products updated in: ${PRODUCTS_JSON_LOCAL}`, 'info');
    log('', 'info');
    log('Next steps:', 'info');
    log('1. Review saworepo2/images/ folder to verify downloads', 'info');
    log('2. Start the app - ProductPage and frontend will now use local images', 'info');
    log('3. Create "Products (Local)" CMS page to manage local products', 'info');

    return {
      success: true,
      productCount: products.length,
      downloadedImages: downloadedCount,
      outputPath: PRODUCTS_JSON_LOCAL,
    };
  } catch (err) {
    log(`Sync failed: ${err.message}`, 'error');
    throw err;
  }
}

// ─── CLI Execution ───────────────────────────────────────────────────────────
if (require.main === module) {
  syncProductsLocally()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { syncProductsLocally, downloadFile, log };
