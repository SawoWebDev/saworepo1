/**
 * Sync from Supabase to local products.json
 * Only adds NEW items (doesn't overwrite existing)
 * Used by the Products component's sync button
 */

import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from "../../local-storage/supabaseReader";

export async function syncSupabaseToLocal() {
  try {
    // Fetch current local data
    const localModule = await import("./data/products.json");
    const localProducts = localModule.default || [];
    const localIds = new Set(localProducts.map(p => p.id));

    // Fetch fresh from Supabase
    const supabaseProducts = await getAllProductsLive();
    const supabaseCategories = await getAllCategoriesLive();
    const supabaseTags = await getAllTagsLive();

    // Find new products (not in local)
    const newProducts = supabaseProducts.filter(p => !localIds.has(p.id));

    if (newProducts.length === 0) {
      return {
        success: true,
        message: "✅ Already up to date! No new products to sync.",
        added: 0,
        total: supabaseProducts.length,
      };
    }

    // Merge: add new products to local
    const mergedProducts = [...localProducts, ...newProducts].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime; // newest first
    });

    // Prepare merged data for localStorage
    const timestamp = new Date().toISOString();
    const meta = {
      last_synced: timestamp,
      total_products: mergedProducts.length,
      new_products_added: newProducts.length,
    };

    // Store in localStorage (simulating the JSON files)
    localStorage.setItem("sawo_local_products", JSON.stringify(mergedProducts));
    localStorage.setItem("sawo_local_categories", JSON.stringify(supabaseCategories));
    localStorage.setItem("sawo_local_tags", JSON.stringify(supabaseTags));
    localStorage.setItem("sawo_local_meta", JSON.stringify(meta));

    return {
      success: true,
      message: `✅ Sync complete! Added ${newProducts.length} new product(s).`,
      added: newProducts.length,
      total: mergedProducts.length,
      timestamp,
    };
  } catch (err) {
    return {
      success: false,
      message: `❌ Sync failed: ${err.message}`,
      error: err,
    };
  }
}
