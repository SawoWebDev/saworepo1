import { useState, useEffect } from "react";
import { getDataSource, getJsonSourceScope } from "../../local-storage/dataSource";
import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from "../../local-storage/supabaseReader";
import { getJsonFileAccessories } from "../../local-storage/jsonFileProducts";
import { OWNED_CATEGORIES } from "../../local-storage/accessoriesTransform";
import { getCache, setCache } from "../adminCache";

// Every public page (product lists, category pages, individual product
// displays) reads through this one hook, so caching it here caches the
// whole site. A repeat visit within CACHE_TTL_MS paints the cached list
// instantly with zero Supabase/GitHub requests; past that age it still
// paints instantly from cache but quietly refetches in the background, so a
// CMS edit reaches visitors who already have a tab open within a bounded
// delay instead of only on their next hard reload. The cache lives only in
// this JS module's memory, so any real page reload (including a hard
// Ctrl+Shift+R) clears it and the next visit fetches fresh again.
const PRODUCTS_CACHE_KEY = "public:products:data";
const CACHE_TTL_MS = 5 * 60 * 1000;

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
        const source = await getDataSource();

        let result;
        if (source === "supabase") {
          const [productsRes, categoriesRes, tagsRes] = await Promise.all([
            getAllProductsLive(),
            getAllCategoriesLive(),
            getAllTagsLive(),
          ]);
          result = {
            products: productsRes,
            categories: categoriesRes,
            tags: tagsRes,
            meta: { last_synced: new Date().toISOString(), total_products: productsRes.length, source: "supabase" },
          };
        } else {
          const [productsRes, categoriesRes, tagsRes, metaRes] = await Promise.all([
            import("./data/products.json"),
            import("./data/categories.json"),
            import("./data/tags.json"),
            import("./data/meta.json"),
          ]);
          let products = productsRes.default || [];
          let effectiveSource = source; // "github" or "jsonfile"

          if (source === "jsonfile") {
            const scope = await getJsonSourceScope();
            if (scope === "accessories" || scope === "all") {
              try {
                const jsonAccessories = await getJsonFileAccessories();
                products = products
                  .filter(p => !(p.categories || []).some(c => OWNED_CATEGORIES.has(c)))
                  .concat(jsonAccessories);
              } catch (err) {
                console.warn("[useLocalProducts] Failed to load allaccs-data.json, using bundled snapshot:", err.message);
                effectiveSource = "github";
              }
            } else {
              effectiveSource = "github";
            }
          }

          result = {
            products,
            categories: categoriesRes.default || [],
            tags: tagsRes.default || [],
            meta: { ...(metaRes.default || {}), source: effectiveSource },
          };
        }

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
