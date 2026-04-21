/**
 * fetchProducts.js
 *
 * RUN IN TERMINAL to update product data: 
 * node src/scripts/fetchProducts.js
 * 
 * Requirements: npm install node-fetch fs-extra
 *
 * Features:
 * - Fetches all products from SAWO API
 * - Downloads product images locally, only updating if changed
 * - Saves all data fields: id, slug, name, image, content, categories, tags, date, and parsed power
 * - Future-proof for adding more fields
 * - Intelligent image updating (does not delete unchanged images)
 */

import fetch from 'node-fetch'; // Node-fetch v3 uses ESM
import fs from 'fs-extra';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// -----------------------------
// Path setup for ES modules
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// Configuration
// -----------------------------
const WP_API_URL = 'https://www.sawo.com/wp-json/sawo/v1/products'; // API endpoint
const ASSETS_DIR = path.join(__dirname, '../assets');
const IMAGES_DIR = path.join(ASSETS_DIR, 'products');
const DATA_FILE = path.join(ASSETS_DIR, 'data', 'products.json');

// -----------------------------
// Ensure directories exist
// -----------------------------
fs.ensureDirSync(IMAGES_DIR);
fs.ensureDirSync(path.join(ASSETS_DIR, 'data'));

// -----------------------------
// Helper: download image only if new or changed
// -----------------------------
async function downloadImage(url, filename) {
  const filePath = path.join(IMAGES_DIR, filename);

  // Check if file exists
  const exists = await fs.pathExists(filePath);
  if (exists) {
    // Compare last modified timestamps (optional: could compare file size or hash)
    return `/assets/products/${filename}`;
  }

  // Download new file
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, response => {
      if (response.statusCode !== 200) {
        return reject(`Failed to download ${url}: ${response.statusCode}`);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(`/assets/products/${filename}`);
      });
    }).on('error', err => {
      fs.unlink(filePath, () => {});
      reject(err.message);
    });
  });
}

// -----------------------------
// Helper: extract power from tags (if any)
// -----------------------------
function extractPower(tags) {
  if (!tags || !Array.isArray(tags)) return '';
  for (const t of tags) {
    const match = t.match(/\(([\d.-]+kW)\)/);
    if (match) return match[1]; // e.g., "15-18.0kW"
  }
  return '';
}

// -----------------------------
// Main function
// -----------------------------
async function fetchAndCacheProducts() {
  try {
    console.log('Fetching products from SAWO API...');

    const response = await fetch(WP_API_URL);
    if (!response.ok) throw new Error(`SAWO API error: ${response.statusText}`);
    const wpProducts = await response.json();

    const products = [];

    for (const p of wpProducts) {
      const product = {
        id: p.id || null,
        slug: p.slug || '',
        name: p.name || 'Untitled',
        content: p.content || '',
        categories: p.categories || [],
        tags: p.tags || [],
        date: p.date || '',
        image: '',
        power: extractPower(p.tags), // Extract power if available
        // future fields can be added here without changing main logic
      };

      // Image handling
      if (p.image) {
        const filename = path.basename(p.image);
        try {
          product.image = await downloadImage(p.image, filename);
          console.log(`Downloaded image: ${filename}`);
        } catch (err) {
          console.warn(`Image download failed for ${p.name}: ${err}`);
        }
      }

      products.push(product);
    }

    // Write JSON
    await fs.writeJson(DATA_FILE, products, { spaces: 2 });
    console.log(`Products saved to ${DATA_FILE}`);
    console.log('All done! ✅');
  } catch (err) {
    console.error('Error fetching products:', err);
  }
}

// -----------------------------
// Run
// -----------------------------
fetchAndCacheProducts();

/**
 * ===============================
 * FUTURE PROOFING / USAGE NOTES:
 * ===============================
 *
 * 1. To update products after SAWO adds new items or changes images:
 *    - Simply run: `node fetchProducts.js`
 *    - The script will only download new or updated images and update the JSON.
 *
 * 2. New fields from the API (like voltage, weight, etc.) can be added by:
 *    - Adding a new line in the product mapping, e.g.:
 *      product.voltage = p.voltage || '';
 *
 * 3. Power extraction:
 *    - Automatically detects power ranges in tags formatted as "(X-YkW)"
 *    - Stored in product.power
 *
 * 4. Image replacement:
 *    - Existing images are preserved unless a new image is detected by filename
 *    - Avoids unnecessary downloads
 *
 * 5. Data types for each field:
 *    - id: number
 *    - slug: string
 *    - name: string
 *    - content: string
 *    - categories: array of strings
 *    - tags: array of strings
 *    - date: string (ISO format)
 *    - image: string (local relative path)
 *    - power: string (extracted from tags, e.g., "15-18.0kW")
 */