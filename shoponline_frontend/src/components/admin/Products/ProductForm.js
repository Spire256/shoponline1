import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import './ProductManagement.css';

const ProductForm = ({
  product = null,
  categories = [],
  onSave,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    category: '',
    tags: '',
    price: '',
    original_price: '',
    cost_price: '',
    sku: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    brand: '',
    model: '',
    color: '',
    size: '',
    material: '',
    weight: '',
    dimensions: '',
    condition: 'new',
    status: 'draft',
    is_active: true,
    is_featured: false,
    is_digital: false,
    requires_shipping: true,
    track_inventory: true,
    allow_backorders: false,
    meta_title: '',
    meta_description: '',
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        category: product.category?.id || product.category || '',
        tags: product.tags || '',
        price: product.price || '',
        original_price: product.original_price || '',
        cost_price: product.cost_price || '',
        sku: product.sku || '',
        stock_quantity: product.stock_quantity || '',
        low_stock_threshold: product.low_stock_threshold || '10',
        brand: product.brand || '',
        model: product.model || '',
        color: product.color || '',
        size: product.size || '',
        material: product.material || '',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        condition: product.condition || 'new',
        status: product.status || 'draft',
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_featured: product.is_featured || false,
        is_digital: product.is_digital || false,
        requires_shipping:
          product.requires_shipping !== undefined ? product.requires_shipping : true,
        track_inventory: product.track_inventory !== undefined ? product.track_inventory : true,
        allow_backorders: product.allow_backorders || false,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        images: product.images || [],
      });
    }
  }, [product]);

  // Handle form field changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    // Price validation
    if (
      formData.original_price &&
      parseFloat(formData.original_price) < parseFloat(formData.price)
    ) {
      newErrors.original_price = 'Original price cannot be less than current price';
    }

    if (formData.cost_price && parseFloat(formData.cost_price) > parseFloat(formData.price)) {
      newErrors.cost_price = 'Cost price cannot be greater than selling price';
    }

    // Stock validation
    if (
      formData.track_inventory &&
      (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0)
    ) {
      newErrors.stock_quantity = 'Valid stock quantity is required when tracking inventory';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare form data for submission
    const submitData = { ...formData };

    // Convert string numbers to proper types
    if (submitData.price) submitData.price = parseFloat(submitData.price);
    if (submitData.original_price)
      submitData.original_price = parseFloat(submitData.original_price);
    if (submitData.cost_price) submitData.cost_price = parseFloat(submitData.cost_price);
    if (submitData.stock_quantity) submitData.stock_quantity = parseInt(submitData.stock_quantity);
    if (submitData.low_stock_threshold)
      submitData.low_stock_threshold = parseInt(submitData.low_stock_threshold);
    if (submitData.weight) submitData.weight = parseFloat(submitData.weight);

    onSave(submitData);
  };

  // Handle image upload
  const handleImageUpload = images => {
    setFormData(prev => ({
      ...prev,
      images: images,
    }));
  };

  // Tab navigation
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'details', label: 'Details', icon: '🔧' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
  ];

  return (
    <div className="product-form-container">
      <form onSubmit={handleSubmit} className="product-form">
        {/* Tab Navigation */}
        <div className="form-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="tab-content">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label htmlFor="name" className="required">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-control ${errors.name ? 'error' : ''}`}
                placeholder="Enter product name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="short_description">Short Description</label>
              <textarea
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                className="form-control"
                rows="2"
                maxLength="500"
                placeholder="Brief product description (max 500 characters)"
              />
              <small className="form-text">
                {formData.short_description.length}/500 characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="required">
                Full Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`form-control ${errors.description ? 'error' : ''}`}
                rows="6"
                placeholder="Detailed product description"
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="required">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`form-control ${errors.category ? 'error' : ''}`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter tags separated by commas"
              />
              <small className="form-text">
                Separate multiple tags with commas (e.g., electronics, smartphone, mobile)
              </small>
            </div>

            <div className="form-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span className="checkmark" />
                Active (visible to customers)
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                />
                <span className="checkmark" />
                Featured Product
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_digital"
                  checked={formData.is_digital}
                  onChange={handleChange}
                />
                <span className="checkmark" />
                Digital Product
              </label>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="tab-content">
            <h3>Pricing Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price" className="required">
                  Selling Price (UGX)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`form-control ${errors.price ? 'error' : ''}`}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="original_price">Original Price (UGX)</label>
                <input
                  type="number"
                  id="original_price"
                  name="original_price"
                  value={formData.original_price}
                  onChange={handleChange}
                  className={`form-control ${errors.original_price ? 'error' : ''}`}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {errors.original_price && (
                  <span className="error-message">{errors.original_price}</span>
                )}
                <small className="form-text">
                  Used to show discounts. Leave empty if no discount.
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cost_price">Cost Price (UGX)</label>
              <input
                type="number"
                id="cost_price"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                className={`form-control ${errors.cost_price ? 'error' : ''}`}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              {errors.cost_price && <span className="error-message">{errors.cost_price}</span>}
              <small className="form-text">
                Internal cost for profit calculations. Not visible to customers.
              </small>
            </div>

            {/* Pricing Summary */}
            {formData.price && formData.cost_price && (
              <div className="pricing-summary">
                <h4>Pricing Summary</h4>
                <div className="summary-item">
                  <span>Profit Margin:</span>
                  <span className="profit-margin">
                    {(
                      ((parseFloat(formData.price) - parseFloat(formData.cost_price)) /
                        parseFloat(formData.price)) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </div>
                <div className="summary-item">
                  <span>Profit Amount:</span>
                  <span className="profit-amount">
                    UGX {(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="tab-content">
            <h3>Inventory Management</h3>

            <div className="form-group">
              <label htmlFor="sku">SKU (Stock Keeping Unit)</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="form-control"
                placeholder="Auto-generated if left empty"
                readOnly={isEdit}
              />
              {isEdit && (
                <small className="form-text">SKU cannot be changed after product creation</small>
              )}
            </div>

            <div className="form-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="track_inventory"
                  checked={formData.track_inventory}
                  onChange={handleChange}
                />
                <span className="checkmark" />
                Track inventory for this product
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="allow_backorders"
                  checked={formData.allow_backorders}
                  onChange={handleChange}
                />
                <span className="checkmark" />
                Allow backorders when out of stock
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requires_shipping"
                  checked={formData.requires_shipping}
                  onChange={handleChange}
                />
                <span className="checkmark" />
                This product requires shipping
              </label>
            </div>

            {formData.track_inventory && (
              <div className="inventory-fields">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="stock_quantity" className="required">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      id="stock_quantity"
                      name="stock_quantity"
                      value={formData.stock_quantity}
                      onChange={handleChange}
                      className={`form-control ${errors.stock_quantity ? 'error' : ''}`}
                      min="0"
                      placeholder="0"
                    />
                    {errors.stock_quantity && (
                      <span className="error-message">{errors.stock_quantity}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="low_stock_threshold">Low Stock Threshold</label>
                    <input
                      type="number"
                      id="low_stock_threshold"
                      name="low_stock_threshold"
                      value={formData.low_stock_threshold}
                      onChange={handleChange}
                      className="form-control"
                      min="0"
                      placeholder="10"
                    />
                    <small className="form-text">
                      Get notified when stock falls below this level
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Details Tab */}
        {activeTab === 'details' && (
          <div className="tab-content">
            <h3>Product Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Product brand"
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">Model</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Product model"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="color">Color</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Product color"
                />
              </div>

              <div className="form-group">
                <label htmlFor="size">Size</label>
                <input
                  type="text"
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Product size"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="material">Material</label>
              <input
                type="text"
                id="material"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="form-control"
                placeholder="Product material"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions">Dimensions (L x W x H)</label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., 25 x 15 x 10 cm"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="form-control"
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="tab-content">
            <h3>Product Images</h3>
            <ImageUpload
              images={formData.images}
              onImagesChange={handleImageUpload}
              maxImages={10}
            />
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="tab-content">
            <h3>SEO Settings</h3>

            <div className="form-group">
              <label htmlFor="meta_title">Meta Title</label>
              <input
                type="text"
                id="meta_title"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleChange}
                className="form-control"
                maxLength="150"
                placeholder="SEO title for search engines"
              />
              <small className="form-text">
                {formData.meta_title.length}/150 characters. If empty, product name will be used.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="meta_description">Meta Description</label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                className="form-control"
                rows="3"
                maxLength="300"
                placeholder="SEO description for search engines"
              />
              <small className="form-text">
                {formData.meta_description.length}/300 characters. If empty, short description will
                be used.
              </small>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <div className="action-buttons">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <span className="loading-spinner small" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : isEdit ? (
                'Update Product'
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
