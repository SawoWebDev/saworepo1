// src/Administrator/Taxonomy.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { getAllProductsLive } from "../local-storage/supabaseReader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localOrRemote(product, field) {
  return product?.[`local_${field}`] || product?.[field] || null;
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Shared Modal ──────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${wide ? " modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Products-for-term drawer ──────────────────────────────────────────────────
function TermProductsModal({ open, onClose, term, field }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!open || !term) return;
    setLoading(true);
    (async () => {
      try {
        const allProducts = await getAllProductsLive();
        // Filter products that contain the term in the specified field
        const filtered = allProducts.filter(p => {
          const fieldArray = p[field] || [];
          return Array.isArray(fieldArray) && fieldArray.includes(term);
        });
        setProducts(filtered);
      } catch (err) {
        console.error("Failed to fetch products for term:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, term, field]);

  return (
    <Modal open={open} onClose={onClose} title={`Products using "${term}"`} wide>
      {loading ? (
        <div className="table-loading"><i className="fa-solid fa-circle-notch fa-spin" /> Loading...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">No products use this {field === "categories" ? "category" : "tag"} yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", background: "var(--surface-2)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
              {localOrRemote(p, 'thumbnail')
                ? <img
                    src={localOrRemote(p, 'thumbnail')}
                    alt={p.name}
                    width="40"
                    height="40"
                    loading="lazy"
                    decoding="async"
                    style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                  />
                : <div style={{ width: 40, height: 40, borderRadius: 6, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><i className="fa-regular fa-image" style={{ color: "var(--text-3)" }} /></div>
              }
              <span style={{ fontFamily: "var(--font)", fontWeight: 600, fontSize: 14, color: "rgb(20,22,23)" }}>{p.name}</span>
              <span className="tbl-status" style={{ marginLeft: "auto" }}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
      <div className="modal-footer" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function TaxFormModal({ open, onClose, editItem, table, hasDescription, onSaved }) {
  const [form, setForm]       = useState({ name: "", slug: "", description: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editItem) {
      setForm({ name: editItem.name, slug: editItem.slug, description: editItem.description || "" });
    } else {
      setForm({ name: "", slug: "", description: "" });
    }
    setError("");
  }, [open, editItem]);

  const handleNameChange = val => {
    setForm(f => ({ ...f, name: val, slug: editItem ? f.slug : slugify(val) }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        ...(hasDescription && { description: form.description.trim() || null }),
      };
      if (editItem) {
        const { error: err } = await supabase.from(table).update(payload).eq("id", editItem.id);
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await supabase.from(table).insert([payload]);
        if (err) throw new Error(err.message);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const entityLabel = table === "categories" ? "Category" : "Tag";

  return (
    <Modal open={open} onClose={onClose} title={editItem ? `Edit ${entityLabel}` : `Add ${entityLabel}`}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Name <span style={{ color: "var(--danger)" }}>*</span></label>
          <input className="form-input" type="text" required value={form.name} onChange={e => handleNameChange(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Slug <span style={{ color: "var(--danger)" }}>*</span></label>
          <input className="form-input" type="text" required value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} />
          <p className="form-helper">Auto-generated and editable</p>
        </div>
        {hasDescription && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <i className="fa-solid fa-circle-exclamation" /> {error}
          </div>
        )}
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner" style={{ animation: "spin 1s linear infinite" }} /> {editItem ? "Saving..." : "Creating..."}</>
              : <><i className={editItem ? "fa-solid fa-floppy-disk" : "fa-solid fa-plus"} /> {editItem ? "Save Changes" : `Create ${entityLabel}`}</>
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Tax Card ──────────────────────────────────────────────────────────────────
function TaxCard({ item, isCategory, productCount, selectMode, selected, onToggleSelect, onEdit, onDelete, onViewProducts }) {
  const [hovered, setHovered] = useState(false);

  const createdDate = new Date(item.created_at).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });

  const handleCardClick = () => {
    if (selectMode) {
      onToggleSelect(item.id);
    } else {
      onViewProducts(item.name);
    }
  };

  return (
    <div
      className={[
        "tax-grid-card",
        isCategory ? "tax-grid-card--category" : "tax-grid-card--tag",
        selected ? "tax-grid-card--selected" : "",
        selectMode ? "tax-grid-card--selectable" : "",
      ].filter(Boolean).join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
      title={selectMode ? undefined : `View products using "${item.name}"`}
    >
      {/* Top-right corner: checkbox in select mode, action buttons on hover otherwise */}
      {selectMode ? (
        <div className="tax-card-corner" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            className="tbl-checkbox"
            checked={selected}
            onChange={() => onToggleSelect(item.id)}
          />
        </div>
      ) : hovered ? (
        <div className="tax-card-corner" onClick={e => e.stopPropagation()}>
          <button type="button" className="icon-btn" title="Edit" onClick={() => onEdit(item)}>
            <i className="fa-solid fa-pen" />
          </button>
          <button type="button" className="icon-btn danger" title="Delete" onClick={() => onDelete(item)}>
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      ) : null}

      {/* Icon */}
      <div className={`tax-card-icon${isCategory ? "" : " tax-card-icon--tag"}`}>
        <i className={`fa-solid ${isCategory ? "fa-folder" : "fa-tag"}`} />
      </div>

      {/* Name */}
      <div className="tax-card-name">{item.name}</div>

      {/* Footer: date + product count */}
      <div className="tax-card-meta">
        <span className="tax-card-date">
          <i className="fa-regular fa-calendar" style={{ fontSize: "0.7rem" }} /> {createdDate}
        </span>
        <span className="tax-card-count">
          <i className="fa-solid fa-box" style={{ fontSize: "0.7rem" }} /> {productCount} Product{productCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ── Tab section ───────────────────────────────────────────────────────────────
function TaxTab({ table, label, hasDescription }) {
  const [items, setItems]               = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [search, setSearch]             = useState("");
  const [selectMode, setSelectMode]     = useState(false);
  const [selected, setSelected]         = useState(new Set());
  const [formOpen, setFormOpen]         = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkConfirm, setBulkConfirm]   = useState(false);
  const [productsModal, setProductsModal] = useState(null);
  const [loading, setLoading]           = useState(false);

  const field = table === "categories" ? "categories" : "tags";

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: termData } = await supabase.from(table).select("*").order("name");
      const terms = termData || [];
      setItems(terms);

      // Build product counts using live data
      const products = await getAllProductsLive();
      const counts = {};
      terms.forEach(t => { counts[t.id] = 0; });
      (products || []).forEach(p => {
        (p[field] || []).forEach(termName => {
          const found = terms.find(t => t.name === termName);
          if (found) counts[found.id] = (counts[found.id] || 0) + 1;
        });
      });
      setProductCounts(counts);
      setSelected(new Set());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [table]); // eslint-disable-line

  const openAdd  = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = item => { setEditItem(item); setFormOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from(table).delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchData();
  };

  const handleBulkDelete = async () => {
    await supabase.from(table).delete().in("id", Array.from(selected));
    setBulkConfirm(false);
    setSelectMode(false);
    setSelected(new Set());
    fetchData();
  };

  const toggleSelect = id => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(i => i.id)));
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.slug.toLowerCase().includes(search.toLowerCase())
  );

  const entityLabel = table === "categories" ? "Category" : "Tag";
  const isCategory  = table === "categories";

  return (
    <div>
      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
          />
        </div>

        <div className="filter-group">
          {selectMode ? (
            <>
              {selected.size > 0 && (
                <>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={toggleSelectAll}>
                    {selected.size === filtered.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)", gap: 5 }}
                    onClick={() => setBulkConfirm(true)}
                  >
                    <i className="fa-solid fa-trash" /> Delete {selected.size}
                  </button>
                </>
              )}
              <button type="button" className="btn btn-ghost btn-sm" onClick={exitSelectMode}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectMode(true)}>
                <i className="fa-solid fa-check-square" /> Select
              </button>
            </>
          )}
        </div>

        <button type="button" className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={openAdd}>
          <i className="fa-solid fa-plus" /> Add {entityLabel}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="table-loading"><i className="fa-solid fa-circle-notch fa-spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No {label.toLowerCase()} yet.</div>
      ) : (
        <div className="tax-grid">
          {filtered.map(item => (
            <TaxCard
              key={item.id}
              item={item}
              isCategory={isCategory}
              productCount={productCounts[item.id] ?? 0}
              selectMode={selectMode}
              selected={selected.has(item.id)}
              onToggleSelect={toggleSelect}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onViewProducts={name => setProductsModal(name)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <TaxFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editItem={editItem}
        table={table}
        hasDescription={hasDescription}
        onSaved={fetchData}
      />

      {/* Products modal */}
      <TermProductsModal
        open={!!productsModal}
        onClose={() => setProductsModal(null)}
        term={productsModal}
        field={field}
      />

      {/* Single delete confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete {entityLabel}?</h2>
              <button className="modal-close-btn" onClick={() => setDeleteTarget(null)}></button>
            </div>
            <div className="modal-body">
              <p className="confirm-msg">
                Delete "<strong>{deleteTarget.name}</strong>"? This cannot be undone.
              </p>
              <div className="confirm-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {bulkConfirm && (
        <div className="modal-overlay" onClick={() => setBulkConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Selected?</h2>
              <button className="modal-close-btn" onClick={() => setBulkConfirm(false)}></button>
            </div>
            <div className="modal-body">
              <p className="confirm-msg">Delete {selected.size} selected {label.toLowerCase()}? This cannot be undone.</p>
              <div className="confirm-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setBulkConfirm(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleBulkDelete}>Delete All</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Taxonomy() {
  const [tab, setTab] = useState("categories");

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title">
          <i className="fa-solid fa-tags" style={{ marginRight: "0.5rem", color: "var(--brand)" }} />
          Taxonomy
        </h1>
      </div>

      <div className="tax-tabs">
        <button
          type="button"
          className={`tax-tab-btn${tab === "categories" ? " active" : ""}`}
          onClick={() => setTab("categories")}
        >
          <i className="fa-solid fa-folder" /> Categories
        </button>
        <button
          type="button"
          className={`tax-tab-btn${tab === "tags" ? " active" : ""}`}
          onClick={() => setTab("tags")}
        >
          <i className="fa-solid fa-tag" /> Tags
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === "categories" && (
          <TaxTab table="categories" label="Categories" hasDescription />
        )}
        {tab === "tags" && (
          <TaxTab table="tags" label="Tags" hasDescription={false} />
        )}
      </div>
    </div>
  );
}
