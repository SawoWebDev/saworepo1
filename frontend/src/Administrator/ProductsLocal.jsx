/**
 * ProductsLocal.jsx
 *
 * Displays products from the local products.json file.
 * These are downloaded products with images stored in saworepo2/images/
 *
 * This is a read-only view of local products. To update products:
 * 1. Run the download script: node src/Administrator/scripts/downloadProductsLocal.js
 * 2. Refresh this page to see updates
 */

import React, { useEffect, useState } from 'react';
import { getLocalProducts, getLocalCategories, getLocalImageUrl } from '../local-storage/localProductsLoader';
import '../Administrator/admin.css';

export default function ProductsLocal() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        getLocalProducts(),
        getLocalCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load local products:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchStatus = filter === 'all' || (filter === 'published' ? p.status === 'published' : p.status !== 'published');
    const matchSearch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading local products...</p>
      </div>
    );
  }

  return (
    <div className="products-container" style={{ padding: '20px' }}>
      <style>{`
        .local-products-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .local-controls { display: flex; gap: 10px; flex-wrap: wrap; }
        .local-search { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; width: 250px; }
        .local-filter { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
        .local-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .local-product-card { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s; cursor: pointer; }
        .local-product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .local-product-image { width: 100%; aspect-ratio: 1; object-fit: cover; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
        .local-product-info { padding: 12px; }
        .local-product-name { font-weight: 600; margin: 0 0 4px; font-size: 14px; }
        .local-product-slug { color: #666; font-size: 12px; margin: 0 0 8px; font-family: monospace; }
        .local-product-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .local-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .local-badge-published { background: #e8f5e9; color: #2e7d32; }
        .local-badge-draft { background: #fff3e0; color: #e65100; }
        .local-badge-hidden { background: #ffebee; color: #c62828; }
        .local-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .local-modal-content { background: white; border-radius: 8px; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .local-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .local-modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
        .local-sync-info { background: #e3f2fd; border-left: 4px solid #1976d2; padding: 16px; border-radius: 4px; margin-bottom: 20px; }
        .local-sync-info p { margin: 4px 0; font-size: 14px; }
        .local-sync-code { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; overflow-x: auto; }
      `}</style>

      <div className="local-products-header">
        <div>
          <h1 style={{ margin: 0 }}>Products (Local)</h1>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>
            Displays products from local products.json with images from saworepo2/
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {products.length === 0 ? (
        <div className="local-sync-info">
          <p><strong>No local products found.</strong></p>
          <p>To sync products from the live source:</p>
          <div className="local-sync-code">
            cd frontend<br />
            node src/Administrator/scripts/downloadProductsLocal.js
          </div>
          <p style={{ marginTop: '12px', fontSize: '13px' }}>This will:</p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Download all products from products.json</li>
            <li>Download images to saworepo2/images/</li>
            <li>Update image URLs to point to local files</li>
            <li>Save updated products.json</li>
          </ul>
        </div>
      ) : (
        <>
          <div className="local-controls">
            <input
              type="text"
              className="local-search"
              placeholder="Search by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="local-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <span style={{ color: '#666', fontSize: '14px', alignSelf: 'center' }}>
              {filteredProducts.length} of {products.length} products
            </span>
          </div>

          <div className="local-products-grid" style={{ marginTop: '20px' }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="local-product-card"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="local-product-image">
                  {product.thumbnail ? (
                    <img
                      src={getLocalImageUrl(product.thumbnail)}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span style="color:#999;">No image</span>';
                      }}
                    />
                  ) : (
                    <span style={{ color: '#999' }}>No image</span>
                  )}
                </div>
                <div className="local-product-info">
                  <h3 className="local-product-name">{product.name}</h3>
                  <p className="local-product-slug">{product.slug}</p>
                  <div className="local-product-meta">
                    <span
                      className={`local-badge local-badge-${product.status === 'published' ? 'published' : 'draft'}`}
                    >
                      {product.status}
                    </span>
                    {product.visible === false && <span className="local-badge local-badge-hidden">Hidden</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="local-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="local-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="local-modal-header">
              <h2 style={{ margin: 0 }}>{selectedProduct.name}</h2>
              <button className="local-modal-close" onClick={() => setSelectedProduct(null)}>
                ✕
              </button>
            </div>

            {/* Product Details */}
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Images */}
              {selectedProduct.thumbnail && (
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>Thumbnail</h4>
                  <img
                    src={getLocalImageUrl(selectedProduct.thumbnail)}
                    alt="Thumbnail"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                    {selectedProduct.thumbnail}
                  </p>
                </div>
              )}

              {selectedProduct.images?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>Images ({selectedProduct.images.length})</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {selectedProduct.images.map((img, i) => (
                      <div key={i}>
                        <img
                          src={getLocalImageUrl(img)}
                          alt={`Product ${i}`}
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => {
                            e.target.style.background = '#f0f0f0';
                            e.target.style.opacity = '0.5';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h4 style={{ margin: '0 0 8px' }}>Basic Information</h4>
                <dl style={{ margin: 0, fontSize: '14px' }}>
                  <dt style={{ fontWeight: 600, margin: '4px 0 2px' }}>Slug</dt>
                  <dd style={{ margin: '0 0 8px', color: '#666', fontFamily: 'monospace' }}>
                    {selectedProduct.slug}
                  </dd>
                  <dt style={{ fontWeight: 600, margin: '4px 0 2px' }}>Brand</dt>
                  <dd style={{ margin: '0 0 8px', color: '#666' }}>{selectedProduct.brand || 'N/A'}</dd>
                  <dt style={{ fontWeight: 600, margin: '4px 0 2px' }}>Type</dt>
                  <dd style={{ margin: '0 0 8px', color: '#666' }}>{selectedProduct.type || 'N/A'}</dd>
                  <dt style={{ fontWeight: 600, margin: '4px 0 2px' }}>Status</dt>
                  <dd style={{ margin: '0 0 8px', color: '#666' }}>
                    {selectedProduct.status} {selectedProduct.visible === false && '(Hidden)'}
                  </dd>
                </dl>
              </div>

              {/* Categories & Tags */}
              {(selectedProduct.categories?.length > 0 || selectedProduct.tags?.length > 0) && (
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>Categories & Tags</h4>
                  {selectedProduct.categories?.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>Categories:</p>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {selectedProduct.categories.map((cat) => (
                          <span
                            key={cat}
                            style={{
                              background: '#e3f2fd',
                              color: '#1565c0',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProduct.tags?.length > 0 && (
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>Tags:</p>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {selectedProduct.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              background: '#f3e5f5',
                              color: '#6a1b9a',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Features */}
              {selectedProduct.features?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>Features</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                    {selectedProduct.features.map((feat, i) => (
                      <li key={i} style={{ margin: '4px 0' }}>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Descriptions */}
              {selectedProduct.short_description && (
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>Short Description</h4>
                  <div
                    style={{ fontSize: '14px', lineHeight: '1.5', color: '#333' }}
                    dangerouslySetInnerHTML={{ __html: selectedProduct.short_description }}
                  />
                </div>
              )}

              {selectedProduct.description && (
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>Full Description</h4>
                  <div
                    style={{ fontSize: '14px', lineHeight: '1.5', color: '#333', maxHeight: '300px', overflow: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                  />
                </div>
              )}

              {/* Files */}
              {selectedProduct.files?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px' }}>Resources</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                    {selectedProduct.files.map((file, i) => (
                      <li key={i} style={{ margin: '4px 0' }}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metadata */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: '#999' }}>Metadata</h4>
                <dl style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  <dt style={{ fontWeight: 600, margin: '4px 0 2px' }}>ID</dt>
                  <dd style={{ margin: '0 0 8px', fontFamily: 'monospace' }}>{selectedProduct.id}</dd>
                  <dt style={{ fontWeight: 600, margin: '4px 0 2px' }}>Created</dt>
                  <dd style={{ margin: '0 0 8px' }}>
                    {new Date(selectedProduct.created_at).toLocaleString()}
                  </dd>
                  <dt style={{ fontWeight: 600, margin: '4px 0 2px' }}>Updated</dt>
                  <dd style={{ margin: 0 }}>
                    {new Date(selectedProduct.updated_at).toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
