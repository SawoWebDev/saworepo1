// Administrator/Translations/TranslationProductsGrid.jsx
//
// Product x Locale status matrix — modeled directly on RolesPermissions.jsx's
// Permission x Role table (same products-table/products-table-wrap CSS,
// same row/column shape), swapping role columns for
// PRODUCT_TRANSLATION_LOCALES and checkbox cells for StatusIcon cells.
// Each cell links to the per-product detail sub-route
// (/admin/translations/products/:productId), landing on that locale's tab.
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCT_TRANSLATION_LOCALES } from "../../i18n/productTranslationLocales";
import StatusIcon from "./StatusIcon";
import ScrollArea from "../ScrollArea";
import Pagination from "../Pagination";
import { usePagination } from "../usePagination";

export default function TranslationProductsGrid({ grid }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | needs_update | missing

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return grid.filter(({ product, locales }) => {
      if (q && !product.name.toLowerCase().includes(q) && !(product.slug || "").toLowerCase().includes(q)) return false;
      if (statusFilter === "all") return true;
      return Object.values(locales).some((l) => l.rollup === statusFilter.toUpperCase());
    });
  }, [grid, search, statusFilter]);

  const goToProduct = (productId, localeCode) => {
    navigate(`/admin/translations/products/${productId}${localeCode ? `?locale=${localeCode}` : ""}`);
  };

  const { page, setPage, pageSize, setPageSize, totalPages, totalCount, pageItems } = usePagination(filtered, { initialPageSize: 25 });

  return (
    <div className="cms-scroll-page">
      <div className="products-toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="search-input"
            type="text"
            placeholder="Search product name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="needs_update">Has languages needing update</option>
            <option value="missing">Has languages missing</option>
          </select>
          <span style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{filtered.length} of {grid.length} products</span>
        </div>
      </div>

      <ScrollArea>
      <div className="products-table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product</th>
              {PRODUCT_TRANSLATION_LOCALES.map((l) => (
                <th key={l.code} style={{ textAlign: "center", width: 70 }} title={l.label}>{l.code.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map(({ product, locales }) => (
              <tr key={product.id}>
                <td style={{ fontSize: "0.85rem" }}>
                  <button
                    type="button"
                    onClick={() => goToProduct(product.id)}
                    style={{ background: "none", border: "none", padding: 0, color: "var(--text)", cursor: "pointer", textAlign: "left", font: "inherit" }}
                  >
                    {product.name}
                  </button>
                </td>
                {PRODUCT_TRANSLATION_LOCALES.map((l) => (
                  <td key={l.code} style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => goToProduct(product.id, l.code)}
                      title={`${product.name} — ${l.label}`}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    >
                      <StatusIcon status={locales[l.code].rollup} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={PRODUCT_TRANSLATION_LOCALES.length + 1} style={{ textAlign: "center", color: "var(--text-3)", padding: 24 }}>
                  No products match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </ScrollArea>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        itemLabel="products"
      />
    </div>
  );
}
