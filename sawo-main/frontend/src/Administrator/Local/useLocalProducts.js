import { useState, useEffect } from "react";
import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from "../../local-storage/supabaseReader";
import { readPublicCache, writePublicCache } from "./publicDataCache";

// Every public page (product lists, category pages, individual product
// displays) reads through this one hook, so caching it here caches the
// whole site. A repeat visit within CACHE_TTL_MS paints the cached list
// instantly with zero Supabase requests — persisted to localStorage (see
// publicDataCache.js), so this now actually survives a full page reload or
// a new tab, not just same-session SPA navigation; past CACHE_TTL_MS it
// still paints instantly from cache but quietly refetches in the
// background, so a CMS edit eventually reaches a tab that's been left
// open. To see an edit immediately, hard-reload (Ctrl+Shift+R): that
// clears the in-memory cache, but the localStorage copy is still read on
// the next load unless it too has aged past CACHE_TTL_MS.
const PRODUCTS_CACHE_KEY = "public:products:data";
const PRODUCTS_STORAGE_KEY = "sawo_public_products_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export function useLocalProducts() {
  const cached = readPublicCache(PRODUCTS_CACHE_KEY, PRODUCTS_STORAGE_KEY);
  const [products, setProducts] = useState(() => cached?.data.products || []);
  const [categories, setCategories] = useState(() => cached?.data.categories || []);
  const [tags, setTags] = useState(() => cached?.data.tags || []);
  const [meta, setMeta] = useState(() => cached?.data.meta || {});
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = readPublicCache(PRODUCTS_CACHE_KEY, PRODUCTS_STORAGE_KEY);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) return;

    const loadData = async () => {
      try {
        if (!cached) setLoading(true);

        const [productsRes, categoriesRes, tagsRes] = await Promise.all([
          getAllProductsLive(),
          getAllCategoriesLive(),
          getAllTagsLive(),
        ]);
        const result = {
          products: productsRes,
          categories: categoriesRes,
          tags: tagsRes,
          meta: { last_synced: new Date().toISOString(), total_products: productsRes.length, source: "supabase" },
        };

        setProducts(result.products);
        setCategories(result.categories);
        setTags(result.tags);
        setMeta(result.meta);
        writePublicCache(PRODUCTS_CACHE_KEY, PRODUCTS_STORAGE_KEY, { data: result, time: Date.now() });
      } catch (err) {
        setError(err.message);
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { products, categories, tags, meta, loading, error };
}
