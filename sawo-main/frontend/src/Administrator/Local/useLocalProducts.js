import { useState, useEffect } from "react";
import { getDataSource, getJsonSourceScope } from "../../local-storage/dataSource";
import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from "../../local-storage/supabaseReader";
import { getJsonFileAccessories } from "../../local-storage/jsonFileProducts";
import { OWNED_CATEGORIES } from "../../local-storage/accessoriesTransform";

export function useLocalProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const source = await getDataSource();

        if (source === "supabase") {
          const [productsRes, categoriesRes, tagsRes] = await Promise.all([
            getAllProductsLive(),
            getAllCategoriesLive(),
            getAllTagsLive(),
          ]);
          setProducts(productsRes);
          setCategories(categoriesRes);
          setTags(tagsRes);
          setMeta({ last_synced: new Date().toISOString(), total_products: productsRes.length, source: "supabase" });
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

          setProducts(products);
          setCategories(categoriesRes.default || []);
          setTags(tagsRes.default || []);
          setMeta({ ...(metaRes.default || {}), source: effectiveSource });
        }
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
