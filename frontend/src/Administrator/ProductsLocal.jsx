/**
 * ProductsLocal.jsx
 *
 * Displays products from the local products.json file.
 * UI matches Products.jsx with grid/list view, search, filters.
 * Read-only view - to update products, run: node src/Administrator/scripts/downloadProductsLocal.js
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getLocalProducts, getLocalCategories, getLocalImageUrl } from '../local-storage/localProductsLoader';
import '../Administrator/admin.css';

const FRONT_URL = process.env.REACT_APP_FRONT_URL || '';

function Toast({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map((t, i) => (
        <div key={i} className={`toast toast-${t.type}`} onClick={() => remove(i)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info') => {
    const id = toasts.length;
    setToasts(t => [...t, { message, type, id }]);
    setTimeout(() => remove(id), 4000);
  }, [toasts.length]);
  const remove = useCallback(id => setToasts(t => t.filter((_, i) => i !== id)), []);
  return { toasts, add, remove };
}

function ProductCard({ p }) {
  const [hovered, setHovered] = useState(false);
  const productUrl = `${FRONT_URL || window.location.origin}/products/${p.slug}`;
  const thumbnail = p.thumbnail?.startsWith('saworepo2/')
    ? '/' + p.thumbnail
    : p.thumbnail;

  return (
    <a
      href={productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="product-grid-card"
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="product-grid-thumb">
        {thumbnail ? (
          <img src={thumbnail} alt={p.name} onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <i className="fa-regular fa-image" style={{ fontSize: '1.5rem', color: 'var(--border)' }} />
        )}
      </div>
      <div className="product-grid-info">
        <div className="product-grid-name product-name-link" style={{ textDecoration: 'none', color: 'inherit' }}>
          {p.name}
        </div>
        {(p.categories || []).length > 0 && (
          <div className="product-grid-pills">
            {(p.categories || []).slice(0, 2).map(c => (
              <span key={c} className="tbl-pill tbl-pill-cat">{c}</span>
            ))}
          </div>
        )}
        {(p.tags || []).length > 0 && (
          <div className="product-grid-pills">
            {(p.tags || []).slice(0, 3).map(t => (
              <span key={t} className="tbl-pill tbl-pill-tag">{t}</span>
            ))}
            {(p.tags || []).length > 3 && <span className="tbl-pill tbl-pill-more">+{p.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </a>
  );
}

export default function ProductsLocal() {
  const { toasts, add, remove } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const prods = await getLocalProducts();
      setProducts(prods);
      add(`Loaded ${prods.length} local products`, 'success');
    } catch (err) {
      console.error('Failed to load local products:', err);
      add('Failed to load local products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate refresh
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort products
  const filtered = products
    .filter(p => {
      if (filterStatus && p.status !== filterStatus) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q) ||
        (p.categories || []).some(c => c.toLowerCase().includes(q)) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortDir === 'desc' ? cmp : -cmp;
    });

  return (
    <div className="products-page">
      <Toast toasts={toasts} remove={remove} />

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-download" style={{ marginRight: '0.5rem', color: 'var(--brand)' }} />
            Products (Local)
          </h1>
          <p className="products-subtitle">
            {loading ? 'Loading...' : `${filtered.length} of ${products.length} products from local storage`}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, brand, tag..."
            disabled={loading}
          />
        </div>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          disabled={loading}
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          className="filter-select"
          value={sortDir}
          onChange={e => setSortDir(e.target.value)}
          disabled={loading}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <div className="view-toggle">
          {[
            { mode: 'list', icon: 'fa-list' },
            { mode: 'grid', icon: 'fa-grip' }
          ].map(({ mode, icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`view-toggle-btn${viewMode === mode ? ' active' : ''}`}
              disabled={loading}
            >
              <i className={`fa-solid ${icon}`} />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          style={{ marginLeft: 'auto' }}
        >
          <i className={`fa-solid fa-sync${refreshing ? ' fa-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div style={{
          gridColumn: '1/-1',
          textAlign: 'center',
          padding: 60,
          color: 'var(--text-3)',
          fontStyle: 'italic',
          fontSize: '0.82rem'
        }}>
          <i className="fa-solid fa-folder-open" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block', color: 'var(--border)' }} />
          <p>No local products found.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Run: <code style={{ background: 'var(--surface-2)', padding: '2px 4px', borderRadius: 3 }}>node src/Administrator/scripts/downloadProductsLocal.js</code>
          </p>
        </div>
      )}

      {/* Grid view */}
      {!loading && viewMode === 'grid' && filtered.length > 0 && (
        <div className="product-grid">
          {filtered.length === 0 && (
            <div style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: 40,
              color: 'var(--text-3)',
              fontStyle: 'italic',
              fontSize: '0.82rem'
            }}>
              {search ? `No products match "${search}"` : 'No products'}
            </div>
          )}
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      {/* List view */}
      {!loading && viewMode === 'list' && filtered.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 20 }}>
          <table className="products-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '25%' }}>Name</th>
                <th style={{ width: '15%' }}>Brand</th>
                <th style={{ width: '15%' }}>Type</th>
                <th style={{ width: '20%' }}>Categories</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '10%' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => window.open(`${FRONT_URL || window.location.origin}/products/${p.slug}`, '_blank')}
                >
                  <td style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td style={{ color: 'var(--text-2)' }}>{p.brand || '-'}</td>
                  <td style={{ color: 'var(--text-2)' }}>{p.type || '-'}</td>
                  <td>
                    {(p.categories || []).slice(0, 2).map(c => (
                      <span key={c} className="tbl-pill tbl-pill-cat" style={{ marginRight: 4 }}>
                        {c}
                      </span>
                    ))}
                    {(p.categories || []).length > 2 && (
                      <span className="tbl-pill tbl-pill-more">
                        +{p.categories.length - 2}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`tbl-badge ${p.status === 'published' ? 'tbl-badge-success' : 'tbl-badge-warning'}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
                    {new Date(p.created_at).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          color: 'var(--text-3)'
        }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.75rem', fontSize: '1.2rem' }} />
          Loading local products...
        </div>
      )}
    </div>
  );
}
