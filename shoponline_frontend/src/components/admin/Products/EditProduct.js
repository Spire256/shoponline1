import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';
import './ProductManagement.css';

const EditProduct = ({ productId, onSave, onCancel, onDelete, user }) => {
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Simulate API calls - replace with actual API calls
        const mockProduct = {
          id: productId,
          name: 'Sample Product',
          description: 'This is a sample product description',
          short_description: 'Sample product',
          price: '25000.00',
          original_price: '30000.00',
          cost_price: '15000.00',
          category: 'electronics',
          sku: 'ELEC-001',
          stock_quantity: 50,
          low_stock_threshold: 10,
          brand: 'Samsung',
          model: 'Galaxy',
          color: 'Black',
          size: 'Medium',
          material: 'Plastic',
          weight: '0.5',
          dimensions: '15x10x2',
          condition: 'new',
          status: 'published',
          is_active: true,
          is_featured: false,
          is_digital: false,
          requires_shipping: true,
          track_inventory: true,
          allow_backorders: false,
          tags: 'electronics, smartphone, mobile',
          meta_title: 'Sample Product - Best Electronics',
          meta_description: 'Buy the best sample product online',
          view_count: 150,
          order_count: 12,
          rating_average: 4.5,
          review_count: 8,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-20T14:20:00Z',
          is_in_stock: true,
          images: [],
        };

        const mockCategories = [
          { id: '1', name: 'Electronics', slug: 'electronics' },
          { id: '2', name: 'Clothing', slug: 'clothing' },
          { id: '3', name: 'Home & Garden', slug: 'home-garden' },
          { id: '4', name: 'Books', slug: 'books' },
          { id: '5', name: 'Sports', slug: 'sports' },
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setProduct(mockProduct);
        setCategories(mockCategories);
      } catch (err) {
        console.error('Error fetching product data:', err);
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleSave = async formData => {
    try {
      setSaving(true);
      setError('');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call parent callback
      onSave?.(formData);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm('Are you sure you want to delete this product? This action cannot be undone.')
    ) {
      return;
    }

    try {
      setSaving(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onDelete?.(productId);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-product-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading product data...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="edit-product-container">
        <div className="error-container">
          <div className="error-message">
            <h3>Error Loading Product</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Retry
              </button>
              <button onClick={onCancel} className="btn btn-secondary">
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-product-container">
      <div className="edit-product-header">
        <div className="header-content">
          <h1>Edit Product</h1>
          <div className="product-info">
            <span className="product-sku">SKU: {product?.sku}</span>
            <span className={`product-status ${product?.status}`}>
              {product?.status?.charAt(0)?.toUpperCase() + product?.status?.slice(1)}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={onCancel} disabled={saving} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={saving} className="btn btn-danger">
            {saving ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="edit-product-content">
        <ProductForm
          product={product}
          categories={categories}
          onSave={handleSave}
          onCancel={onCancel}
          loading={saving}
          isEdit={true}
        />
      </div>

      {/* Product Statistics */}
      {product && (
        <div className="product-stats-section">
          <h3>Product Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <label>Views</label>
              <span>{product.view_count || 0}</span>
            </div>
            <div className="stat-item">
              <label>Orders</label>
              <span>{product.order_count || 0}</span>
            </div>
            <div className="stat-item">
              <label>Rating</label>
              <span>
                {product.rating_average || 0}/5 ({product.review_count || 0} reviews)
              </span>
            </div>
            <div className="stat-item">
              <label>Created</label>
              <span>{new Date(product.created_at).toLocaleDateString()}</span>
            </div>
            <div className="stat-item">
              <label>Updated</label>
              <span>{new Date(product.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="stat-item">
              <label>Stock Status</label>
              <span className={product.is_in_stock ? 'in-stock' : 'out-of-stock'}>
                {product.is_in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="recent-activity-section">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-time">{new Date(product?.updated_at).toLocaleString()}</span>
            <span className="activity-description">Product was last updated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
