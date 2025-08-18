import React, { useState, useMemo } from 'react';
import BulkActions from './BulkActions';
import './ProductManagement.css';

const ProductTable = ({
  products = [],
  loading = false,
  onEdit,
  onDelete,
  onBulkAction,
  onSort,
  sortField = '',
  sortDirection = 'asc',
  totalCount = 0,
  currentPage = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
}) => {
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Handle individual product selection
  const handleSelectProduct = productId => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  // Handle select all products
  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
      setShowBulkActions(true);
    }
  };

  // Handle bulk action completion
  const handleBulkActionComplete = (action, productIds) => {
    setSelectedProducts(new Set());
    setShowBulkActions(false);
    onBulkAction?.(action, productIds);
  };

  // Handle sort
  const handleSort = field => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort?.(field, direction);
  };

  // Format currency
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge class
  const getStatusClass = status => {
    const statusClasses = {
      published: 'status-published',
      draft: 'status-draft',
      archived: 'status-archived',
    };
    return statusClasses[status] || 'status-default';
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  if (loading) {
    return (
      <div className="product-table-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-table-container">
        <div className="empty-state">
          <h3>No Products Found</h3>
          <p>There are no products matching your current filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-table-container">
      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <BulkActions
          selectedCount={selectedProducts.size}
          onAction={handleBulkActionComplete}
          selectedIds={Array.from(selectedProducts)}
          onCancel={() => {
            setSelectedProducts(new Set());
            setShowBulkActions(false);
          }}
        />
      )}

      {/* Table Container */}
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th className="select-column">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === products.length && products.length > 0}
                  onChange={handleSelectAll}
                  className="checkbox"
                />
              </th>
              <th className="image-column">Image</th>
              <th
                className={`sortable ${sortField === 'name' ? `sorted-${sortDirection}` : ''}`}
                onClick={() => handleSort('name')}
              >
                Product Name
                <span className="sort-icon" />
              </th>
              <th>Category</th>
              <th>SKU</th>
              <th
                className={`sortable ${sortField === 'price' ? `sorted-${sortDirection}` : ''}`}
                onClick={() => handleSort('price')}
              >
                Price
                <span className="sort-icon" />
              </th>
              <th
                className={`sortable ${
                  sortField === 'stock_quantity' ? `sorted-${sortDirection}` : ''
                }`}
                onClick={() => handleSort('stock_quantity')}
              >
                Stock
                <span className="sort-icon" />
              </th>
              <th>Status</th>
              <th>Featured</th>
              <th
                className={`sortable ${
                  sortField === 'created_at' ? `sorted-${sortDirection}` : ''
                }`}
                onClick={() => handleSort('created_at')}
              >
                Created
                <span className="sort-icon" />
              </th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className={selectedProducts.has(product.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="checkbox"
                  />
                </td>
                <td>
                  <div className="product-image">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        onError={e => {
                          e.target.src = '/assets/placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="product-info">
                    <div className="product-name" title={product.name}>
                      {product.name}
                    </div>
                    {product.short_description && (
                      <div className="product-description" title={product.short_description}>
                        {product.short_description}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className="category-name">{product.category?.name || 'Uncategorized'}</span>
                </td>
                <td>
                  <code className="product-sku">{product.sku}</code>
                </td>
                <td>
                  <div className="price-info">
                    <div className="current-price">{formatCurrency(product.price)}</div>
                    {product.original_price && product.original_price > product.price && (
                      <div className="original-price">
                        <del>{formatCurrency(product.original_price)}</del>
                        <span className="discount-badge">
                          {Math.round(
                            ((product.original_price - product.price) / product.original_price) *
                              100
                          )}
                          % OFF
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="stock-info">
                    <span
                      className={`stock-quantity ${
                        product.is_in_stock ? 'in-stock' : 'out-of-stock'
                      }`}
                    >
                      {product.track_inventory ? product.stock_quantity : '∞'}
                    </span>
                    {product.track_inventory &&
                      product.stock_quantity <= product.low_stock_threshold &&
                      product.stock_quantity > 0 && (
                      <span className="low-stock-warning" title="Low Stock">
                          ⚠️
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(product.status)}`}>
                    {product.status}
                  </span>
                  {!product.is_active && <span className="inactive-badge">Inactive</span>}
                </td>
                <td>
                  <div className="featured-status">
                    {product.is_featured ? (
                      <span className="featured-badge">★ Featured</span>
                    ) : (
                      <span className="not-featured">-</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    {new Date(product.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit?.(product.id)}
                      className="btn btn-sm btn-primary"
                      title="Edit Product"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                          onDelete?.(product.id);
                        }
                      }}
                      className="btn btn-sm btn-danger"
                      title="Delete Product"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <div className="pagination-info">
          <span>
            Showing {startIndex} to {endIndex} of {totalCount} products
          </span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange?.(parseInt(e.target.value))}
            className="page-size-select"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="btn btn-sm btn-secondary"
          >
            Previous
          </button>

          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`btn btn-sm ${
                    currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="btn btn-sm btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
