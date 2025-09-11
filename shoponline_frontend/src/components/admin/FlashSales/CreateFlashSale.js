import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Package, AlertCircle, Plus, Minus, Search, Calendar, Percent, Image } from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import flashSalesAPI from '../../../services/api/flashSalesAPI';
import './FlashSaleManagement.css';

const CreateFlashSale = ({ onSuccess, onCancel }) => {
  const { showNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: '',
    start_time: '',
    end_time: '',
    is_active: true,
    max_discount_amount: '',
    banner_image: null,
    priority: 0,
  });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Load available products
  useEffect(() => {
    loadAvailableProducts();
  }, []);

  const loadAvailableProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch('/api/v1/products/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableProducts(data.results || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('Failed to load products', 'error');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      handleImageChange(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle banner image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          banner_image: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          banner_image: 'Image must be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        banner_image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Clear image errors
      if (errors.banner_image) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.banner_image;
          return newErrors;
        });
      }
    }
  };

  // Remove banner image
  const removeBannerImage = () => {
    setFormData(prev => ({
      ...prev,
      banner_image: null
    }));
    setImagePreview(null);
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    const isSelected = selectedProducts.some(p => p.id === product.id);
    
    if (isSelected) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        stock_quantity: product.stock_quantity,
        custom_discount_percentage: formData.discount_percentage || '',
        stock_limit: ''
      }]);
    }
  };

  // Handle product discount change
  const handleProductDiscountChange = (productId, field, value) => {
    setSelectedProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, [field]: value }
          : product
      )
    );
  };

  // Remove selected product
  const removeSelectedProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Filter available products
  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    !selectedProducts.some(selected => selected.id === product.id)
  );

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Flash sale name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Flash sale name must be at least 3 characters';
    }

    if (!formData.discount_percentage) {
      newErrors.discount_percentage = 'Discount percentage is required';
    } else {
      const discount = parseFloat(formData.discount_percentage);
      if (isNaN(discount) || discount <= 0 || discount > 100) {
        newErrors.discount_percentage = 'Discount must be between 1 and 100';
      }
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    // Date validation
    if (formData.start_time && formData.end_time) {
      const startDate = new Date(formData.start_time);
      const endDate = new Date(formData.end_time);
      const now = new Date();

      if (startDate >= endDate) {
        newErrors.end_time = 'End time must be after start time';
      }
      
      if (endDate <= now) {
        newErrors.end_time = 'End time must be in the future';
      }

      if (startDate < now) {
        newErrors.start_time = 'Start time should be in the future';
      }
    }

    if (formData.max_discount_amount && parseFloat(formData.max_discount_amount) <= 0) {
      newErrors.max_discount_amount = 'Maximum discount amount must be greater than 0';
    }

    if (selectedProducts.length === 0) {
      newErrors.products = 'Please select at least one product for the flash sale';
    }

    // Validate selected products
    selectedProducts.forEach((product, index) => {
      if (product.custom_discount_percentage) {
        const discount = parseFloat(product.custom_discount_percentage);
        if (isNaN(discount) || discount <= 0 || discount > 100) {
          newErrors[`product_${product.id}_discount`] = 'Product discount must be between 1 and 100';
        }
      }

      if (product.stock_limit) {
        const limit = parseInt(product.stock_limit);
        if (isNaN(limit) || limit <= 0) {
          newErrors[`product_${product.id}_limit`] = 'Stock limit must be a positive number';
        } else if (limit > product.stock_quantity) {
          newErrors[`product_${product.id}_limit`] = 'Stock limit cannot exceed available stock';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix the validation errors', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add flash sale data
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('discount_percentage', formData.discount_percentage);
      submitData.append('start_time', formData.start_time);
      submitData.append('end_time', formData.end_time);
      submitData.append('is_active', formData.is_active);
      submitData.append('priority', formData.priority);

      if (formData.max_discount_amount) {
        submitData.append('max_discount_amount', formData.max_discount_amount);
      }

      if (formData.banner_image) {
        submitData.append('banner_image', formData.banner_image);
      }

      // Create flash sale using API service
      const flashSale = await flashSalesAPI.createFlashSale(submitData);

      // Add products to flash sale if any are selected
      if (selectedProducts.length > 0) {
        const productsData = selectedProducts.map(product => ({
          product: product.id,
          custom_discount_percentage: product.custom_discount_percentage || null,
          stock_limit: product.stock_limit ? parseInt(product.stock_limit) : null,
        }));

        const addProductsResponse = await fetch(`/api/v1/flash-sales/${flashSale.id}/add_products/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ products: productsData }),
        });

        if (!addProductsResponse.ok) {
          console.warn('Some products may not have been added to the flash sale');
        }
      }

      showNotification('Flash sale created successfully', 'success');
      onSuccess && onSuccess(flashSale);

    } catch (error) {
      console.error('Error creating flash sale:', error);
      
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        showNotification(error.message || 'Failed to create flash sale', 'error');
        setErrors({ general: error.message || 'Failed to create flash sale. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (isSubmitting) return;
    
    const hasChanges = Object.values(formData).some(value => 
      value && value !== '' && value !== false && value !== 0
    ) || selectedProducts.length > 0;

    if (hasChanges) {
      if (window.confirm('Are you sure you want to close? Your changes will be lost.')) {
        onCancel && onCancel();
      }
    } else {
      onCancel && onCancel();
    }
  };

  // Get minimum date for start time (current time)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // Calculate duration display
  const getDurationDisplay = () => {
    if (formData.start_time && formData.end_time) {
      const duration = Math.ceil(
        (new Date(formData.end_time) - new Date(formData.start_time)) / (1000 * 60 * 60)
      );
      return `Duration: ${duration} hours`;
    }
    return null;
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.classList.contains('modal-overlay') && handleClose()}>
      <div className="modal-container extra-large">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Clock className="icon" />
            <h2>Create New Flash Sale</h2>
          </div>
          <button 
            type="button" 
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="icon" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="flash-sale-form">
            <div className="form-grid">
              {/* Left Column - Basic Information */}
              <div className="form-column">
                <div className="form-section">
                  <h3>Basic Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="name" className="form-label required">
                      Flash Sale Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="e.g., Summer Electronics Sale"
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="Brief description of the flash sale..."
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="priority" className="form-label">
                      Priority
                    </label>
                    <input
                      type="number"
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                      placeholder="0"
                      disabled={isSubmitting}
                    />
                    <span className="help-text">Higher numbers appear first</span>
                  </div>

                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="checkbox-input"
                        disabled={isSubmitting}
                      />
                      <span className="checkbox-text">Active</span>
                    </label>
                    <span className="help-text">Flash sale is active and visible</span>
                  </div>
                </div>

                {/* Discount Settings */}
                <div className="form-section">
                  <h3>
                    <Percent size={20} />
                    Discount Settings
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="discount_percentage" className="form-label required">
                        Discount Percentage (%)
                      </label>
                      <div className="input-with-suffix">
                        <input
                          type="number"
                          id="discount_percentage"
                          name="discount_percentage"
                          value={formData.discount_percentage}
                          onChange={handleInputChange}
                          className={`form-input ${errors.discount_percentage ? 'error' : ''}`}
                          placeholder="25"
                          min="1"
                          max="100"
                          step="0.01"
                          disabled={isSubmitting}
                        />
                        <span className="input-suffix">%</span>
                      </div>
                      {errors.discount_percentage && (
                        <div className="error-message">
                          <AlertCircle size={16} />
                          {errors.discount_percentage}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="max_discount_amount" className="form-label">
                        Max Discount Amount
                      </label>
                      <div className="input-with-prefix">
                        <span className="input-prefix">UGX</span>
                        <input
                          type="number"
                          id="max_discount_amount"
                          name="max_discount_amount"
                          value={formData.max_discount_amount}
                          onChange={handleInputChange}
                          className={`form-input ${errors.max_discount_amount ? 'error' : ''}`}
                          placeholder="100000"
                          min="1"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.max_discount_amount && (
                        <div className="error-message">
                          <AlertCircle size={16} />
                          {errors.max_discount_amount}
                        </div>
                      )}
                      <span className="help-text">Optional: Maximum discount amount per product</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Timing and Banner */}
              <div className="form-column">
                {/* Timing Settings */}
                <div className="form-section">
                  <h3>
                    <Clock size={20} />
                    Timing Settings
                  </h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="start_time" className="form-label required">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="start_time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className={`form-input ${errors.start_time ? 'error' : ''}`}
                        min={getMinDateTime()}
                        disabled={isSubmitting}
                      />
                      {errors.start_time && (
                        <div className="error-message">
                          <AlertCircle size={16} />
                          {errors.start_time}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="end_time" className="form-label required">
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="end_time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className={`form-input ${errors.end_time ? 'error' : ''}`}
                        min={formData.start_time || getMinDateTime()}
                        disabled={isSubmitting}
                      />
                      {errors.end_time && (
                        <div className="error-message">
                          <AlertCircle size={16} />
                          {errors.end_time}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duration Display */}
                  {getDurationDisplay() && (
                    <div className="duration-display">
                      <small>{getDurationDisplay()}</small>
                    </div>
                  )}
                </div>

                {/* Banner Image */}
                <div className="form-section">
                  <h3>
                    <Image size={20} />
                    Banner Image
                  </h3>
                  
                  <div className="image-upload-section">
                    {imagePreview ? (
                      <div className="image-preview-container">
                        <img
                          src={imagePreview}
                          alt="Banner preview"
                          className="image-preview"
                        />
                        <div className="image-actions">
                          <button
                            type="button"
                            onClick={removeBannerImage}
                            className="btn btn-danger btn-sm"
                            disabled={isSubmitting}
                          >
                            <X size={16} />
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder">
                        <Image className="upload-icon" />
                        <p>No banner image selected</p>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="banner_image" className="form-label">
                        Upload Banner Image
                      </label>
                      <input
                        type="file"
                        id="banner_image"
                        name="banner_image"
                        onChange={handleInputChange}
                        accept="image/*"
                        className={`form-file ${errors.banner_image ? 'error' : ''}`}
                        disabled={isSubmitting}
                      />
                      {errors.banner_image && (
                        <div className="error-message">
                          <AlertCircle size={16} />
                          {errors.banner_image}
                        </div>
                      )}
                      <span className="help-text">
                        Recommended: 1200x400px, JPG/PNG. Max size: 5MB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="form-section full-width">
              <div className="section-header">
                <h3>Products</h3>
                <button
                  type="button"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                >
                  <Plus className="icon" />
                  Add Products
                </button>
              </div>

              {errors.products && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.products}
                </div>
              )}

              {/* Product Selector */}
              {showProductSelector && (
                <div className="product-selector">
                  <div className="search-box">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="product-grid">
                    {isLoadingProducts ? (
                      <div className="loading-state">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="empty-state">No products available</div>
                    ) : (
                      filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="product-item"
                          onClick={() => handleProductSelect(product)}
                        >
                          <img
                            src={product.image || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="product-image"
                          />
                          <div className="product-info">
                            <h4>{product.name}</h4>
                            <p>UGX {product.price?.toLocaleString()}</p>
                            <p>Stock: {product.stock_quantity}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="selected-products">
                  <h4>Selected Products ({selectedProducts.length})</h4>
                  <div className="selected-products-list">
                    {selectedProducts.map(product => (
                      <div key={product.id} className="selected-product-item">
                        <div className="product-info">
                          <h5>{product.name}</h5>
                          <p>Regular Price: UGX {product.price?.toLocaleString()}</p>
                          <p>Available Stock: {product.stock_quantity}</p>
                        </div>

                        <div className="product-settings">
                          <div className="form-group">
                            <label>Custom Discount (%)</label>
                            <input
                              type="number"
                              value={product.custom_discount_percentage}
                              onChange={(e) => handleProductDiscountChange(product.id, 'custom_discount_percentage', e.target.value)}
                              className={`form-input ${errors[`product_${product.id}_discount`] ? 'error' : ''}`}
                              placeholder={formData.discount_percentage}
                              min="1"
                              max="100"
                              step="0.1"
                            />
                            {errors[`product_${product.id}_discount`] && (
                              <span className="error-message">{errors[`product_${product.id}_discount`]}</span>
                            )}
                          </div>

                          <div className="form-group">
                            <label>Stock Limit</label>
                            <input
                              type="number"
                              value={product.stock_limit}
                              onChange={(e) => handleProductDiscountChange(product.id, 'stock_limit', e.target.value)}
                              className={`form-input ${errors[`product_${product.id}_limit`] ? 'error' : ''}`}
                              placeholder="No limit"
                              min="1"
                              max={product.stock_quantity}
                            />
                            {errors[`product_${product.id}_limit`] && (
                              <span className="error-message">{errors[`product_${product.id}_limit`]}</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSelectedProduct(product.id)}
                          className="btn btn-danger btn-sm"
                          disabled={isSubmitting}
                        >
                          <Minus className="icon" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="error-alert">
                <AlertCircle size={20} />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner small" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="icon" />
                    Create Flash Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashSale;