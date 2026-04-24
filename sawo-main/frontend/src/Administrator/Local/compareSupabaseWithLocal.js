/**
 * compareSupabaseWithLocal.js
 *
 * Compares Supabase data with local JSON files and reports differences.
 * Does NOT re-download or recode JSON files - just detects and applies changes.
 */

import { supabase } from "../supabase";

/**
 * Fetch all data from Supabase
 */
async function fetchSupabaseData() {
  try {
    const [productsRes, categoriesRes, tagsRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name", { ascending: true }),
      supabase.from("tags").select("*").order("name", { ascending: true }),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;
    if (tagsRes.error) throw tagsRes.error;

    return {
      products: productsRes.data || [],
      categories: categoriesRes.data || [],
      tags: tagsRes.data || [],
    };
  } catch (err) {
    console.error("[compareSupabaseWithLocal] Failed to fetch Supabase data:", err);
    throw err;
  }
}

/**
 * Load local JSON data
 */
async function loadLocalData() {
  try {
    const [productsRes, categoriesRes, tagsRes] = await Promise.all([
      import("./data/products.json"),
      import("./data/categories.json"),
      import("./data/tags.json"),
    ]);

    return {
      products: productsRes.default || [],
      categories: categoriesRes.default || [],
      tags: tagsRes.default || [],
    };
  } catch (err) {
    console.error("[compareSupabaseWithLocal] Failed to load local data:", err);
    throw err;
  }
}

/**
 * Normalize URLs for comparison
 * Extracts the meaningful part (filename/path) from both local paths and Supabase URLs
 */
function normalizeUrl(url) {
  if (!url || typeof url !== "string") return url;

  // If it's a Supabase URL, extract just the file path part
  if (url.includes("supabase.co") || url.includes("storage/v1/object")) {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename;
  }

  // If it's a GitHub raw URL
  if (url.includes("raw.githubusercontent.com")) {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename;
  }

  // If it's a relative path like "images/xxx.webp", extract just the filename
  const pathParts = url.split("/");
  return pathParts[pathParts.length - 1];
}

/**
 * Compare two values, normalizing URLs
 */
function valueEqual(val1, val2) {
  if (val1 === val2) return true;
  if (val1 == null || val2 == null) return val1 === val2;

  // If both are strings that look like URLs/paths, normalize and compare
  if (typeof val1 === "string" && typeof val2 === "string") {
    if (val1.includes("/") || val2.includes("/") || val1.includes(".") || val2.includes(".")) {
      return normalizeUrl(val1) === normalizeUrl(val2);
    }
  }

  return val1 === val2;
}

/**
 * Deep equality check for objects
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    const v1 = obj1[key];
    const v2 = obj2[key];

    // Special handling for URL fields (thumbnail, images, spec_images, files)
    if (key === "thumbnail" || key === "images" || key === "spec_images" || key === "files") {
      if (Array.isArray(v1) && Array.isArray(v2)) {
        if (v1.length !== v2.length) return false;
        for (let i = 0; i < v1.length; i++) {
          // For file objects, compare normalized URLs
          if (typeof v1[i] === "object" && typeof v2[i] === "object") {
            const f1 = v1[i];
            const f2 = v2[i];
            if (f1.url && f2.url && !valueEqual(f1.url, f2.url)) return false;
            if (f1.name && f2.name && f1.name !== f2.name) return false;
          } else if (!valueEqual(v1[i], v2[i])) {
            return false;
          }
        }
      } else if (typeof v1 === "string" && typeof v2 === "string") {
        if (!valueEqual(v1, v2)) return false;
      } else if (v1 !== v2) {
        return false;
      }
    } else if (Array.isArray(v1) && Array.isArray(v2)) {
      if (v1.length !== v2.length) return false;
      for (let i = 0; i < v1.length; i++) {
        if (!deepEqual(v1[i], v2[i])) return false;
      }
    } else if (typeof v1 === "object" && typeof v2 === "object") {
      if (!deepEqual(v1, v2)) return false;
    } else if (!valueEqual(v1, v2)) {
      return false;
    }
  }

  return true;
}

/**
 * Compare items and return differences
 */
function compareItems(supabaseItems, localItems, itemType) {
  const changes = {
    added: [],
    updated: [],
    deleted: [],
  };

  // Create maps for quick lookup
  const localMap = new Map(localItems.map(item => [item.id || item.slug, item]));
  const supabaseMap = new Map(supabaseItems.map(item => [item.id || item.slug, item]));

  // Find added and updated items
  for (const supabaseItem of supabaseItems) {
    const key = supabaseItem.id || supabaseItem.slug;
    const localItem = localMap.get(key);

    if (!localItem) {
      changes.added.push({
        type: itemType,
        item: supabaseItem,
      });
    } else if (!deepEqual(supabaseItem, localItem)) {
      // Detailed comparison
      const diff = {};
      for (const field in supabaseItem) {
        if (!deepEqual(supabaseItem[field], localItem[field])) {
          diff[field] = {
            supabase: supabaseItem[field],
            local: localItem[field],
          };
        }
      }
      changes.updated.push({
        type: itemType,
        id: key,
        item: supabaseItem,
        diff,
      });
    }
  }

  // Find deleted items
  for (const localItem of localItems) {
    const key = localItem.id || localItem.slug;
    if (!supabaseMap.has(key)) {
      changes.deleted.push({
        type: itemType,
        item: localItem,
      });
    }
  }

  return changes;
}

/**
 * Main sync check function
 * onEvent: callback function to report progress
 */
export async function checkSupabaseSync(onEvent = () => {}) {
  const report = {
    timestamp: new Date().toISOString(),
    products: { added: [], updated: [], deleted: [] },
    categories: { added: [], updated: [], deleted: [] },
    tags: { added: [], updated: [], deleted: [] },
    summary: "",
    totalChanges: 0,
  };

  try {
    onEvent({ phase: "fetching", message: "Fetching Supabase data..." });
    const supabaseData = await fetchSupabaseData();

    onEvent({ phase: "loading", message: "Loading local JSON data..." });
    const localData = await loadLocalData();

    onEvent({ phase: "comparing", message: "Comparing products..." });
    report.products = compareItems(supabaseData.products, localData.products, "product");

    onEvent({ phase: "comparing", message: "Comparing categories..." });
    report.categories = compareItems(supabaseData.categories, localData.categories, "category");

    onEvent({ phase: "comparing", message: "Comparing tags..." });
    report.tags = compareItems(supabaseData.tags, localData.tags, "tag");

    // Calculate totals
    const totalAdded = report.products.added.length + report.categories.added.length + report.tags.added.length;
    const totalUpdated = report.products.updated.length + report.categories.updated.length + report.tags.updated.length;
    const totalDeleted = report.products.deleted.length + report.categories.deleted.length + report.tags.deleted.length;

    report.totalChanges = totalAdded + totalUpdated + totalDeleted;
    report.summary = `Found ${totalAdded} added, ${totalUpdated} updated, ${totalDeleted} deleted items.`;

    onEvent({
      phase: "complete",
      message: report.summary,
      report,
    });

    return report;
  } catch (err) {
    const errorMsg = `Sync check failed: ${err.message}`;
    onEvent({
      phase: "error",
      message: errorMsg,
      error: err.message,
    });
    throw err;
  }
}

/**
 * Apply changes to local JSON files via backend
 */
export async function applyLocalChanges(report, onEvent = () => {}) {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

  try {
    if (report.totalChanges === 0) {
      onEvent({ phase: "complete", message: "No changes to apply." });
      return { success: true, message: "No changes needed." };
    }

    onEvent({ phase: "applying", message: "Applying changes to local files..." });

    // Load current local data
    const localData = await loadLocalData();

    // Apply product changes
    let updatedProducts = [...localData.products];

    // Remove deleted products
    report.products.deleted.forEach(({ item }) => {
      updatedProducts = updatedProducts.filter(p => p.id !== item.id);
    });

    // Add new products
    report.products.added.forEach(({ item }) => {
      updatedProducts.push(item);
    });

    // Update existing products
    report.products.updated.forEach(({ item }) => {
      const idx = updatedProducts.findIndex(p => p.id === item.id);
      if (idx !== -1) {
        updatedProducts[idx] = item;
      }
    });

    // Apply category changes
    let updatedCategories = [...localData.categories];
    report.categories.deleted.forEach(({ item }) => {
      updatedCategories = updatedCategories.filter(c => c.slug !== item.slug);
    });
    report.categories.added.forEach(({ item }) => {
      updatedCategories.push(item);
    });
    report.categories.updated.forEach(({ item }) => {
      const idx = updatedCategories.findIndex(c => c.slug === item.slug);
      if (idx !== -1) {
        updatedCategories[idx] = item;
      }
    });

    // Apply tag changes
    let updatedTags = [...localData.tags];
    report.tags.deleted.forEach(({ item }) => {
      updatedTags = updatedTags.filter(t => t.slug !== item.slug);
    });
    report.tags.added.forEach(({ item }) => {
      updatedTags.push(item);
    });
    report.tags.updated.forEach(({ item }) => {
      const idx = updatedTags.findIndex(t => t.slug === item.slug);
      if (idx !== -1) {
        updatedTags[idx] = item;
      }
    });

    onEvent({ phase: "writing", message: "Writing changes to backend..." });

    // Call backend to persist the changes
    const response = await fetch(`${BACKEND_URL}/api/update-local-files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: updatedProducts,
        categories: updatedCategories,
        tags: updatedTags,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    onEvent({
      phase: "complete",
      message: "Changes applied successfully to local files.",
    });

    return {
      success: true,
      message: "Local files updated successfully.",
      changes: {
        products: updatedProducts,
        categories: updatedCategories,
        tags: updatedTags,
      },
    };
  } catch (err) {
    const errorMsg = `Failed to apply changes: ${err.message}`;
    onEvent({ phase: "error", message: errorMsg, error: err.message });
    throw err;
  }
}
