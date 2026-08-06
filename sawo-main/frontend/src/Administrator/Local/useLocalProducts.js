import { useState, useEffect } from "react";
import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from "../../local-storage/supabaseReader";
import { getCache, setCache } from "../adminCache";

// Every public page (product lists, category pages, individual product
// displays) reads through this one hook, so caching it here caches the
// whole site. A repeat visit within CACHE_TTL_MS paints the cached list
// instantly with zero Supabase requests; past that age it still
// paints instantly from cache but quietly refetches in the background, so a
// CMS edit eventually reaches a tab that's been left open. To see an edit
// immediately, hard-reload (Ctrl+Shift+R): that clears this in-memory cache
// outright and the next load always fetches fresh, regardless of TTL.
const PRODUCTS_CACHE_KEY = "public:products:data";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export function useLocalProducts() {
  const cached = getCache(PRODUCTS_CACHE_KEY);
  const [products, setProducts] = useState(() => cached?.data.products || []);
  const [categories, setCategories] = useState(() => cached?.data.categories || []);
  const [tags, setTags] = useState(() => cached?.data.tags || []);
  const [meta, setMeta] = useState(() => cached?.data.meta || {});
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = getCache(PRODUCTS_CACHE_KEY);
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
        setCache(PRODUCTS_CACHE_KEY, { data: result, time: Date.now() });
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
