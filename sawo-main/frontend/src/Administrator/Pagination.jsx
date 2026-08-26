// src/Administrator/Pagination.jsx
//
// Shared pagination bar for CMS data pages: "Showing X-Y of Z" summary, a
// configurable rows-per-page dropdown, and prev/numbered-pill/next controls.
// Generalizes the pagination block that used to be hand-rolled in
// Logs.jsx — same 7-pill windowing behavior, now reusable and with a page
// size selector (which no page had before).
//
// `page` is 0-based. Pass `pageSizeOptions` to control the dropdown choices.
import React from "react";

export default function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = "items",
}) {
  if (totalCount === 0) return null;

  const rangeStart = page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, totalCount);

  return (
    <div className="cms-pagination-bar">
      <span className="cms-pagination-summary">
        Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of {totalCount.toLocaleString()} {itemLabel}
      </span>

      <div className="cms-pagination-controls">
        {onPageSizeChange && (
          <label className="cms-pagination-size">
            Rows per page
            <select
              className="filter-select"
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p;
              if (totalPages <= 7) p = i;
              else if (page < 4) p = i;
              else if (page > totalPages - 5) p = totalPages - 7 + i;
              else p = page - 3 + i;
              return (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${page === p ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => onPageChange(p)}
                  style={{ minWidth: 32 }}
                >
                  {p + 1}
                </button>
              );
            })}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
