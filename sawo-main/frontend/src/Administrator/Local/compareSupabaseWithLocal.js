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
    if (!deepEqual(obj1[key], obj2[key])) return false;
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
 * Apply changes to local JSON files
 * Only updates if changes are confirmed
 */
export async function applyLocalChanges(report, onEvent = () => {}) {
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

    // Store the updated data for the component to handle persistence
    onEvent({
      phase: "complete",
      message: "Changes prepared. Ready to update local files.",
      changes: {
        products: updatedProducts,
        categories: updatedCategories,
        tags: updatedTags,
      },
    });

    return {
      success: true,
      message: "Changes prepared successfully.",
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
