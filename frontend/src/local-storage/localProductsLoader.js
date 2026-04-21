/**
 * localProductsLoader.js
 *
 * Loads products from the local products.json file.
 * Used for the "Products (Local)" CMS page to display and manage local products.
 *
 * Image paths: saworepo2/images/* (served as static assets)
 */

const PRODUCTS_JSON_URL = '/products.json';

/**
 * Load products from local products.json
 */
export async function getLocalProducts() {
  try {
    const res = await fetch(PRODUCTS_JSON_URL + '?t=' + Date.now());
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error('[localProductsLoader] Failed to load local products:', err);
    return [];
  }
}

/**
 * Get a single product by ID from local products.json
 */
export async function getLocalProductById(id) {
  const products = await getLocalProducts();
  return products.find(p => p.id === id) || null;
}

/**
 * Get a single product by slug from local products.json
 */
export async function getLocalProductBySlug(slug) {
  const products = await getLocalProducts();
  return products.find(p => p.slug === slug) || null;
}

/**
 * Get categories from local products
 */
export async function getLocalCategories() {
  const products = await getLocalProducts();
  const cats = new Set();
  products.forEach(p => {
    (p.categories || []).forEach(c => cats.add(c));
  });
  return [...cats].map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get tags from local products
 */
export async function getLocalTags() {
  const products = await getLocalProducts();
  const tags = new Set();
  products.forEach(p => {
    (p.tags || []).forEach(t => tags.add(t));
  });
  return [...tags].map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get visible (published & visible) products from local products.json
 */
export async function getLocalVisibleProducts() {
  const products = await getLocalProducts();
  return products.filter(p => p.status === 'published' && p.visible !== false);
}

/**
 * Convert local image path to full URL
 * e.g., 'saworepo2/images/file.webp' → '/saworepo2/images/file.webp'
 */
export function getLocalImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('/') || imagePath.startsWith('http')) {
    return imagePath; // Already a full URL
  }
  if (imagePath.startsWith('saworepo2/')) {
    return '/' + imagePath; // Make it absolute
  }
  return imagePath;
}
