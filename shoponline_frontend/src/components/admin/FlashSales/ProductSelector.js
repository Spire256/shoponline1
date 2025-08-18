import React, { useState, useEffect } from 'react';
import { X, Search, Package, Plus, Check, AlertCircle, Filter } from 'lucide-react';
import { productsAPI } from '../../services/api/productsAPI';
import { flashSalesAPI } from '../../services/api/flashSalesAPI';
import './FlashSaleManagement.css';

const ProductSelector = ({ flashSaleId, existingProducts = [], onProductsAdded, onCancel }) => {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [productSettings, setProductSettings] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchTerm, categoryFilter, currentPage]);

  const fetchProducts = async (page = 1, append = false) => {
    try {
      setLoading(!append);

      const params = {
        page,
        search: searchTerm,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        is_active: true,
        page_size: 20,
      };

      const response = await productsAPI.getProducts(params);
      const products = response.results || response;

      // Filter out products already in flash sale
      const existingProductIds = existingProducts.map(p => p.product);
      const filteredProducts = products.filter(product => !existingProductIds.includes(product.id));

      if (append) {
        setAvailableProducts(prev => [...prev, ...filteredProducts]);
      } else {
        setAvailableProducts(filteredProducts);
      }

      setHasMore(response.next !== null);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.results || response);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleProductSelect = product => {
    const isSelected = selectedProducts.find(p => p.id === product.id);

    if (isSelected) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
      setProductSettings(prev => {
        const { [product.id]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedProducts(prev => [...prev, product]);
      setProductSettings(prev => ({
        ...prev,
        [product.id]: {
          custom_discount_percentage: null,
          stock_limit: null,
          is_active: true,
        },
      }));
    }
  };

  const handleProductSettingChange = (productId, field, value) => {
    setProductSettings(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value === '' ? null : value,
      },
    }));
  };

  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const productsData = selectedProducts.map(product => ({
        product: product.id,
        custom_discount_percentage: productSettings[product.id]?.custom_discount_percentage || null,
        stock_limit: productSettings[product.id]?.stock_limit || null,
        is_active: productSettings[product.id]?.is_active !== false,
      }));

      await flashSalesAPI.addProductsToFlashSale(flashSaleId, { products: productsData });
      onProductsAdded();
    } catch (err) {
      console.error('Error adding products:', err);
      setError(err.response?.data?.message || 'Failed to add products to flash sale');
    } finally {
      setSaving(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchProducts(currentPage + 1, true);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
    }).format(amount);
  };

  const calculateFlashPrice = (product, customDiscount) => {
    const discount = customDiscount || 25; // Default discount if not set
    return product.price * (1 - discount / 100);
  };

  if (loading && availableProducts.length === 0) {
    return (
      <div className="modal-overlay">
        <div className="modal-content product-selector-modal">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content product-selector-modal">
        <div className="modal-header">
          <h2>Add Products to Flash Sale</h2>
          <button className="modal-close" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="selector-filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Filter size={16} />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="selection-summary">
            <span>{selectedProducts.length} products selected</span>
          </div>
        </div>

        {/* Selected Products Preview */}
        {selectedProducts.length > 0 && (
          <div className="selected-products-section">
            <h3>Selected Products ({selectedProducts.length})</h3>
            <div className="selected-products-list">
              {selectedProducts.map(product => (
                <div key={product.id} className="selected-product-card">
                  <div className="product-basic-info">
                    <img
                      src={product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="product-thumb"
                    />
                    <div className="product-details">
                      <h4>{product.name}</h4>
                      <div className="price-info">
                        <span className="original-price">{formatCurrency(product.price)}</span>
                        <span className="arrow">→</span>
                        <span className="flash-price">
                          {formatCurrency(
                            calculateFlashPrice(
                              product,
                              productSettings[product.id]?.custom_discount_percentage
                            )
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      className="remove-selected"
                      onClick={() => handleProductSelect(product)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Product Settings */}
                  <div className="product-settings">
                    <div className="setting-group">
                      <label>Custom Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Use flash sale default"
                        value={productSettings[product.id]?.custom_discount_percentage || ''}
                        onChange={e =>
                          handleProductSettingChange(
                            product.id,
                            'custom_discount_percentage',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="setting-group">
                      <label>Stock Limit</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="No limit"
                        value={productSettings[product.id]?.stock_limit || ''}
                        onChange={e =>
                          handleProductSettingChange(product.id, 'stock_limit', e.target.value)
                        }
                      />
                    </div>

                    <div className="setting-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={productSettings[product.id]?.is_active !== false}
                          onChange={e =>
                            handleProductSettingChange(product.id, 'is_active', e.target.checked)
                          }
                        />
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Products */}
        <div className="available-products-section">
          <h3>Available Products</h3>

          {availableProducts.length === 0 ? (
            <div className="no-products">
              <Package size={48} />
              <p>No products found matching your criteria</p>
            </div>
          ) : (
            <div className="products-grid">
              {availableProducts.map(product => {
                const isSelected = selectedProducts.find(p => p.id === product.id);

                return (
                  <div
                    key={product.id}
                    className={`product-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="product-image">
                      <img
                        src={product.images?.[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                      />
                      {isSelected && (
                        <div className="selection-overlay">
                          <Check size={24} />
                        </div>
                      )}
                    </div>

                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <div className="product-meta">
                        <span className="price">{formatCurrency(product.price)}</span>
                        <span className="stock">Stock: {product.stock_quantity}</span>
                      </div>
                      <div className="category-name">{product.category_name}</div>
                    </div>

                    <button
                      className={`select-btn ${isSelected ? 'selected' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        handleProductSelect(product);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check size={16} />
                          Selected
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Select
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="load-more-section">
              <button className="btn btn-secondary" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More Products'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddProducts}
            disabled={saving || selectedProducts.length === 0}
          >
            {saving ? (
              <>
                <div className="loading-spinner small" />
                Adding Products...
              </>
            ) : (
              <>
                <Plus size={20} />
                Add {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelector;
