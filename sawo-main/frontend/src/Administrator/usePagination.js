// src/Administrator/usePagination.js
//
// Client-side pagination for a page that already has its full (filtered)
// array in memory — slices it into pages instead of rendering everything at
// once. Page auto-clamps back into range when the array shrinks (e.g. a
// search/filter reduces the result count), so callers don't need to wire up
// their own "reset page on filter change" effect.
import { useState, useEffect, useMemo } from "react";

export function usePagination(items, { initialPageSize = 25 } = {}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [totalPages, page]);

  const pageItems = useMemo(
    () => items.slice(page * pageSize, (page + 1) * pageSize),
    [items, page, pageSize]
  );

  return {
    page,
    setPage,
    pageSize,
    setPageSize: (size) => { setPageSize(size); setPage(0); },
    totalPages,
    totalCount,
    pageItems,
  };
}
