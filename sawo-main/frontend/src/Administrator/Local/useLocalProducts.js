import { useState, useEffect } from "react";
import { getDataSource } from "../../local-storage/dataSource";
import { getAllProductsLive, getAllCategoriesLive, getAllTagsLive } from "../../local-storage/supabaseReader";

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
          setProducts(productsRes.default || []);
          setCategories(categoriesRes.default || []);
          setTags(tagsRes.default || []);
          setMeta(metaRes.default || {});
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
