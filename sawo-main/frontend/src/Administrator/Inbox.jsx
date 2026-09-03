// src/Administrator/Inbox.jsx
//
// Contact form submissions — every General Inquiry / Technical Support /
// Customer Support request from the public Contact page, logged here
// regardless of whether the email notification or Odoo ticket succeeded.
//
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { getCache, setCache } from "./adminCache";
import ScrollArea from "./ScrollArea";
import Pagination from "./Pagination";

const INBOX_CACHE_KEY = "admin:inbox:default";

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const CATEGORY_CONFIG = {
  general:   { label: "General Inquiry",     color: "#6366f1", icon: "fa-comment" },
  technical: { label: "Technical Support",   color: "#f59e0b", icon: "fa-wrench" },
  customer:  { label: "Customer Support",    color: "#22c55e", icon: "fa-headset" },
};

function CategoryBadge({ category }) {
  const cfg = CATEGORY_CONFIG[category] || { label: category, color: "var(--text-3)", icon: "fa-circle" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      fontSize: "0.72rem", fontWeight: 700,
      color: cfg.color, background: `${cfg.color}1a`,
      border: `1px solid ${cfg.color}30`,
    }}>
      <i className={`fa-solid ${cfg.icon}`} style={{ fontSize: "0.65rem" }} />
      {cfg.label}
    </span>
  );
}

function StatusDot({ ok, title }) {
  return (
    <span
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 20, height: 20, borderRadius: "50%",
        color: ok ? "#22c55e" : "#ef4444",
        background: ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
        fontSize: "0.62rem",
      }}
    >
      <i className={`fa-solid ${ok ? "fa-check" : "fa-xmark"}`} />
    </span>
  );
}

function DetailField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--text)", whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  );
}

export default function Inbox() {
  const cached = getCache(INBOX_CACHE_KEY);
  const [rows, setRows] = useState(() => cached?.data || []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [pageSize, setPageSize] = useState(30);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(() => cached?.count || 0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchRows = useCallback(async () => {
    const isDefaultView = page === 0 && pageSize === 30 && !filterCategory && !filterUnread && !search;
    if (!(isDefaultView && getCache(INBOX_CACHE_KEY))) setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("contact_submissions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filterCategory) q = q.eq("category", filterCategory);
      if (filterUnread) q = q.eq("is_read", false);
      if (search) q = q.or(`fname.ilike.%${search}%,lname.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);

      const { data, error: qErr, count } = await q;
      if (qErr) throw qErr;
      setRows(data || []);
      setTotalCount(count || 0);
      if (isDefaultView) setCache(INBOX_CACHE_KEY, { data: data || [], count: count || 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterCategory, filterUnread, search]);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { setPage(0); }, [filterCategory, filterUnread, search]);

  useEffect(() => {
    supabase
      .from("contact_submissions")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, [rows]);

  const toggleExpand = async (row) => {
    const opening = expandedId !== row.id;
    setExpandedId(opening ? row.id : null);
    if (opening && !row.is_read) {
      await supabase.from("contact_submissions").update({ is_read: true }).eq("id", row.id);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_read: true } : r)));
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="products-page cms-scroll-page">
      <div className="logs-toolbar-row">
        <p className="products-subtitle" style={{ margin: 0 }}>
          {loading ? "Loading…" : `${totalCount.toLocaleString()} submissions${unreadCount ? ` · ${unreadCount} unread` : ""}`}
        </p>

        <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="general">General Inquiry</option>
          <option value="technical">Technical Support</option>
          <option value="customer">Customer Support</option>
        </select>

        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={filterUnread} onChange={(e) => setFilterUnread(e.target.checked)} />
          Unread only
        </label>

        <button type="button" className="btn btn-ghost btn-sm" onClick={fetchRows}>
          <i className="fa-solid fa-rotate" /> <span className="btn-label-full">Refresh</span>
        </button>
      </div>

      <div className="products-toolbar" style={{ flexWrap: "wrap" }}>
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or subject…"
          />
        </div>
      </div>

      {error && (
        <div style={{
          margin: "12px 0", padding: "12px 16px",
          background: "var(--danger-bg, #fef2f2)", border: "1px solid var(--danger)",
          borderRadius: "var(--r)", fontSize: "0.82rem", color: "var(--danger)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <i className="fa-solid fa-triangle-exclamation" />
          {error}
        </div>
      )}

      <ScrollArea>
      <div className="products-table-wrap">
        {loading ? (
          <div className="table-loading">
            <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.5rem" }} /> Loading inbox…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-3)", fontStyle: "italic", fontSize: "0.82rem" }}>
            {search || filterCategory || filterUnread
              ? "No submissions match the current filters."
              : "No contact form submissions yet."}
          </div>
        ) : (
          <table className="products-table" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "14%" }}>When</th>
                <th style={{ width: "16%" }}>Category</th>
                <th style={{ width: "22%" }}>From</th>
                <th style={{ width: "26%" }}>Subject</th>
                <th style={{ width: "12%", textAlign: "center" }}>Email</th>
                <th style={{ width: "10%", textAlign: "center" }}>Odoo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    onClick={() => toggleExpand(row)}
                    style={{
                      cursor: "pointer",
                      fontWeight: row.is_read ? 400 : 700,
                      background: expandedId === row.id ? "var(--surface-2)" : undefined,
                    }}
                  >
                    <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{formatDate(row.created_at)}</td>
                    <td><CategoryBadge category={row.category} /></td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {row.fname} {row.lname}
                      <div style={{ fontSize: "0.72rem", color: "var(--text-3)", fontWeight: 400 }}>{row.email}</div>
                    </td>
                    <td style={{ fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.subject || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>(no subject)</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <StatusDot ok={row.email_sent} title={row.email_sent ? "Email sent" : "Email failed"} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <StatusDot ok={row.odoo_success} title={row.odoo_success ? `Odoo ticket ${row.odoo_ticket_id || ""}` : (row.odoo_error || "Odoo ticket failed")} />
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr>
                      <td colSpan={6} style={{ background: "var(--surface-2)", padding: "20px 24px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px 24px" }}>
                          <DetailField label="Phone" value={row.phone} />
                          <DetailField label="Country" value={row.country} />
                          <DetailField label="Product Category" value={row.product_category} />
                          <DetailField label="Product Name" value={row.product_name} />
                          <DetailField label="Product Code" value={row.product_code} />
                          <DetailField label="Serial Number" value={row.serial_number} />
                          <DetailField label="Purchase Invoice" value={row.purchase_invoice} />
                          <DetailField label="Issue" value={row.issue} />
                          <DetailField label="Order Number" value={row.order_number} />
                          <DetailField label="Additional Info" value={row.add_product_info} />
                          {(row.room_width || row.room_depth || row.room_height) && (
                            <DetailField
                              label="Sauna Room Size"
                              value={`${row.room_width || "?"}m × ${row.room_depth || "?"}m × ${row.room_height || "?"}m`}
                            />
                          )}
                        </div>
                        <DetailField label="Message" value={row.message} />
                        {row.odoo_error && !row.odoo_success && (
                          <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: 6 }}>
                            Odoo ticket error: {row.odoo_error}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </ScrollArea>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(0); }}
        itemLabel="submissions"
      />
    </div>
  );
}
