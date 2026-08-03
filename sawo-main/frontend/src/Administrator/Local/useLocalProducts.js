import { useState, useEffect } from "react";
import { getDataSource, getJsonSourceScope } from "../../local-storage/dataSource";
import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from "../../local-storage/supabaseReader";
import { getJsonFileAccessories } from "../../local-storage/jsonFileProducts";
import { OWNED_CATEGORIES } from "../../local-storage/accessoriesTransform";
import { getCache, setCache } from "../adminCache";

// Every public page (product lists, category pages, individual product
// displays) reads through this one hook, so caching it here caches the
// whole site. Deliberately session-cache-and-skip rather than the admin
// CMS's cache-then-revalidate: once a visitor has loaded the catalog once,
// later page visits reuse it with zero Supabase/GitHub requests instead of
// refetching in the background every time. The cache lives only in this JS
// module's memory, so any real page reload (including a hard Ctrl+Shift+R)
// clears it and the next visit fetches fresh again.
const PRODUCTS_CACHE_KEY = "public:products:data";

export function useLocalProducts() {
  const cached = getCache(PRODUCTS_CACHE_KEY);
  const [products, setProducts] = useState(() => cached?.products || []);
  const [categories, setCategories] = useState(() => cached?.categories || []);
  const [tags, setTags] = useState(() => cached?.tags || []);
  const [meta, setMeta] = useState(() => cached?.meta || {});
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (getCache(PRODUCTS_CACHE_KEY)) return;

    const loadData = async () => {
      try {
        setLoading(true);
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
        setCache(PRODUCTS_CACHE_KEY, result);
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
