import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import productsAPI from '../../../services/api/productsAPI';
import categoriesAPI from '../../../services/api/categoriesAPI';
import ImageUpload from './ImageUpload';
import './ProductManagement.css';

const EditProduct = ({ product, onClose, onSuccess, categories = [] }) => {
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    category: '',
    price: '',
    original_price: '',
    cost_price: '',
    sku: '',
    stock_quantity: '',
    low_stock_threshold: 10,
    track_inventory: true,
    allow_backorders: false,
    weight: '',
    dimensions: '',
    color: '',
    size: '',
    material: '',
    brand: '',
    model: '',
    condition: 'new',
    status: 'draft',
    is_active: true,
    is_featured: false,
    is_digital: false,
    requires_shipping: true,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    tags: ''
  });
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      // Populate form with product data - handle both nested and direct category references
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        category: product.category?.id || product.category || '',
        price: product.price || '',
        original_price: product.original_price || '',
        cost_price: product.cost_price || '',
        sku: product.sku || '',
        stock_quantity: product.stock_quantity || '',
        low_stock_threshold: product.low_stock_threshold || 10,
        track_inventory: product.track_inventory !== false,
        allow_backorders: product.allow_backorders || false,
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        color: product.color || '',
        size: product.size || '',
        material: product.material || '',
        brand: product.brand || '',
        model: product.model || '',
        condition: product.condition || 'new',
        status: product.status || 'draft',
        is_active: product.is_active !== false,
        is_featured: product.is_featured || false,
        is_digital: product.is_digital || false,
        requires_shipping: product.requires_shipping !== false,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || '',
        tags: product.tags || ''
      });

      // Set existing images - handle both formats
      if (product.images && Array.isArray(product.images)) {
        setImages(product.images);
      }

      // Set attributes - handle both formats
      if (product.attributes && Array.isArray(product.attributes)) {
        setAttributes(product.attributes.map((attr, index) => ({
          id: attr.id || null,
          name: attr.name || '',
          value: attr.value || '',
          position: attr.position !== undefined ? attr.position : index
        })));
      }

      // Set variants - handle both formats
      if (product.variants && Array.isArray(product.variants)) {
        setVariants(product.variants.map(variant => ({
          id: variant.id || null,
          name: variant.name || '',
          sku: variant.sku || '',
          price: variant.price || '',
          stock_quantity: variant.stock_quantity || 0,
          color: variant.color || '',
          size: variant.size || '',
          weight: variant.weight || '',
          is_active: variant.is_active !== false
        })));
      }
    }
  }, [product]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleImageUpload = (uploadedImages) => {
    const processedImages = uploadedImages.map(img => ({
      file: img.file || img,
      preview: img.preview || URL.createObjectURL(img.file || img),
      is_main: false,
      alt_text: img.alt_text || '',
      caption: img.caption || '',
      position: newImages.length + (img.position || 0)
    }));

    setNewImages(prev => [...prev, ...processedImages]);

    // If this is the first image overall, make it main
    if (images.length === 0 && newImages.length === 0 && processedImages.length > 0) {
      processedImages[0].is_main = true;
    }
  };

  const handleImageDelete = (imageId) => {
    // If it's an existing image, mark for deletion
    if (typeof imageId === 'string' || (typeof imageId === 'number' && imageId > 0)) {
      const imageToDelete = images.find(img => img.id === imageId);
      if (imageToDelete) {
        setImagesToDelete(prev => [...prev, imageId]);
        setImages(prev => prev.filter(img => img.id !== imageId));
        
        // If deleted image was main, make another image main
        if (imageToDelete.is_main) {
          const remainingImages = images.filter(img => img.id !== imageId);
          if (remainingImages.length > 0) {
            setImages(prev => prev.map((img, index) => 
              index === 0 ? { ...img, is_main: true } : { ...img, is_main: false }
            ));
          } else if (newImages.length > 0) {
            setNewImages(prev => prev.map((img, index) => 
              index === 0 ? { ...img, is_main: true } : { ...img, is_main: false }
            ));
          }
        }
      }
    } else {
      // It's a new image, remove from newImages
      const imageToDelete = newImages[imageId];
      setNewImages(prev => prev.filter((_, index) => index !== imageId));
      
      // If deleted image was main, make another image main
      if (imageToDelete?.is_main) {
        const remainingNewImages = newImages.filter((_, index) => index !== imageId);
        if (remainingNewImages.length > 0) {
          setNewImages(prev => prev.map((img, index) => 
            index === 0 ? { ...img, is_main: true } : { ...img, is_main: false }
          ));
        } else if (images.length > 0) {
          setImages(prev => prev.map((img, index) => 
            index === 0 ? { ...img, is_main: true } : { ...img, is_main: false }
          ));
        }
      }
    }
  };

  const handleSetMainImage = (imageId) => {
    if (typeof imageId === 'string' || (typeof imageId === 'number' && imageId > 0)) {
      // Existing image
      setImages(prev => prev.map(img => ({
        ...img,
        is_main: img.id === imageId
      })));
      // Also unset main from new images
      setNewImages(prev => prev.map(img => ({
        ...img,
        is_main: false
      })));
    } else {
      // New image
      setNewImages(prev => prev.map((img, index) => ({
        ...img,
        is_main: index === imageId
      })));
      // Also unset main from existing images
      setImages(prev => prev.map(img => ({
        ...img,
        is_main: false
      })));
    }
  };

  const addAttribute = () => {
    setAttributes(prev => [...prev, { 
      id: null,
      name: '', 
      value: '', 
      position: prev.length 
    }]);
  };

  const updateAttribute = (index, field, value) => {
    setAttributes(prev => prev.map((attr, i) => 
      i === index ? { ...attr, [field]: value } : attr
    ));
  };

  const removeAttribute = (index) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants(prev => [...prev, {
      id: null,
      name: '',
      sku: '',
      price: '',
      stock_quantity: 0,
      color: '',
      size: '',
      weight: '',
      is_active: true
    }]);
  };

  const updateVariant = (index, field, value) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const validationErrors = {};

    if (!formData.name.trim()) {
      validationErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      validationErrors.description = 'Product description is required';
    }

    if (!formData.category) {
      validationErrors.category = 'Category is required';
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      validationErrors.price = 'Valid price greater than 0 is required';
    }

    // Validate price relationships
    if (formData.original_price && formData.price) {
      const originalPrice = parseFloat(formData.original_price);
      const currentPrice = parseFloat(formData.price);
      if (originalPrice < currentPrice) {
        validationErrors.original_price = 'Original price cannot be less than current price';
      }
    }

    if (formData.cost_price && formData.price) {
      const costPrice = parseFloat(formData.cost_price);
      const currentPrice = parseFloat(formData.price);
      if (costPrice > currentPrice) {
        validationErrors.cost_price = 'Cost price cannot be greater than selling price';
      }
    }

    if (formData.track_inventory && (!formData.stock_quantity || isNaN(formData.stock_quantity) || parseInt(formData.stock_quantity) < 0)) {
      validationErrors.stock_quantity = 'Valid stock quantity is required when tracking inventory';
    }

    // Validate weight if provided
    if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) < 0)) {
      validationErrors.weight = 'Weight must be a positive number';
    }

    // Validate variants
    variants.forEach((variant, index) => {
      if (variant.name && (!variant.price || isNaN(variant.price) || parseFloat(variant.price) <= 0)) {
        validationErrors[`variant_${index}_price`] = `Variant ${index + 1} needs a valid price`;
      }
    });

    setErrors(validationErrors);
    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showNotification(Object.values(validationErrors)[0], 'error');
      return;
    }

    setLoading(true);

    try {
      // Prepare data using ProductCreateUpdateSerializer format
      const updateData = {
        // Basic product data
        ...formData,
        // Convert string numbers to proper types
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock_quantity: formData.track_inventory ? parseInt(formData.stock_quantity) || 0 : 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      // Handle attributes data
      if (attributes.length > 0) {
        updateData.attributes_data = attributes
          .filter(attr => attr.name.trim() && attr.value.trim())
          .map(attr => ({
            name: attr.name.trim(),
            value: attr.value.trim(),
            position: attr.position || 0
          }));
      }

      // Handle variants data
      if (variants.length > 0) {
        updateData.variants_data = variants
          .filter(variant => variant.name.trim())
          .map(variant => ({
            name: variant.name.trim(),
            price: parseFloat(variant.price) || 0,
            stock_quantity: parseInt(variant.stock_quantity) || 0,
            color: variant.color || '',
            size: variant.size || '',
            weight: variant.weight ? parseFloat(variant.weight) : null,
            is_active: variant.is_active !== false
          }));
      }

      // Handle images using FormData for file uploads
      const formDataToSend = new FormData();

      // Add basic fields
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'attributes_data' && key !== 'variants_data') {
          formDataToSend.append(key, value);
        }
      });

      // Add structured data as JSON
      if (updateData.attributes_data) {
        formDataToSend.append('attributes_data', JSON.stringify(updateData.attributes_data));
      }

      if (updateData.variants_data) {
        formDataToSend.append('variants_data', JSON.stringify(updateData.variants_data));
      }

      // Add new images
      if (newImages.length > 0) {
        newImages.forEach((image, index) => {
          formDataToSend.append('images_data', image.file);
        });
      }

      // Handle image deletions and updates
      const imageOperations = {
        delete_images: imagesToDelete,
        update_images: images.map(img => ({
          id: img.id,
          is_main: img.is_main,
          alt_text: img.alt_text || '',
          caption: img.caption || ''
        }))
      };

      if (imagesToDelete.length > 0 || images.some(img => img.is_main)) {
        formDataToSend.append('image_operations', JSON.stringify(imageOperations));
      }

      // Use the products API for the update
      const updatedProduct = await productsAPI.updateProduct(product.id, formDataToSend);
      
      showNotification('Product updated successfully!', 'success');
      
      if (onSuccess) {
        onSuccess(updatedProduct);
      }
      
      onClose();

    } catch (error) {
      console.error('Error updating product:', error);
      
      // Handle API errors
      if (error.errors && typeof error.errors === 'object') {
        setErrors(error.errors);
        const firstError = Object.values(error.errors)[0];
        showNotification(Array.isArray(firstError) ? firstError[0] : firstError, 'error');
      } else {
        showNotification(error.message || 'Failed to update product. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get discount percentage for display
  const getDiscountPercentage = () => {
    if (!formData.original_price || !formData.price) return 0;
    const original = parseFloat(formData.original_price);
    const current = parseFloat(formData.price);
    if (original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Product</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-sections">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'error' : ''}
                    required
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={errors.category ? 'error' : ''}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <span className="error-text">{errors.category}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  maxLength={500}
                  placeholder="Brief description for product listings"
                />
                <small>{formData.short_description.length}/500 characters</small>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={errors.description ? 'error' : ''}
                  placeholder="Detailed product description"
                  required
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
            </div>

            {/* Pricing */}
            <div className="form-section">
              <h3>Pricing</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Price (UGX) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    min="0"
                    step="1"
                    className={errors.price ? 'error' : ''}
                    required
                  />
                  {errors.price && <span className="error-text">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label>Original Price (UGX)</label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => handleInputChange('original_price', e.target.value)}
                    min="0"
                    step="1"
                    className={errors.original_price ? 'error' : ''}
                    placeholder="For showing discounts"
                  />
                  {errors.original_price && <span className="error-text">{errors.original_price}</span>}
                </div>

                <div className="form-group">
                  <label>Cost Price (UGX)</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => handleInputChange('cost_price', e.target.value)}
                    min="0"
                    step="1"
                    className={errors.cost_price ? 'error' : ''}
                    placeholder="Internal cost for profit calculation"
                  />
                  {errors.cost_price && <span className="error-text">{errors.cost_price}</span>}
                </div>
              </div>

              {/* Show discount percentage if applicable */}
              {getDiscountPercentage() > 0 && (
                <div className="discount-info">
                  <span className="discount-badge">{getDiscountPercentage()}% OFF</span>
                  <span>Customers save UGX {(parseFloat(formData.original_price) - parseFloat(formData.price)).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Inventory */}
            <div className="form-section">
              <h3>Inventory</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                  <small>Stock Keeping Unit - unique identifier</small>
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                    min="0"
                    disabled={!formData.track_inventory}
                    className={errors.stock_quantity ? 'error' : ''}
                  />
                  {errors.stock_quantity && <span className="error-text">{errors.stock_quantity}</span>}
                </div>

                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
                    min="0"
                    placeholder="Get notified when stock is low"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.track_inventory}
                      onChange={(e) => handleInputChange('track_inventory', e.target.checked)}
                    />
                    Track Inventory
                  </label>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.allow_backorders}
                      onChange={(e) => handleInputChange('allow_backorders', e.target.checked)}
                    />
                    Allow Backorders
                  </label>
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="form-section">
              <h3>Product Images</h3>
              
              <div className="image-management">
                {/* Existing Images */}
                {images.length > 0 && (
                  <div className="existing-images">
                    <h4>Current Images</h4>
                    <div className="image-grid">
                      {images.map((image) => (
                        <div key={image.id} className="image-item">
                          <img 
                            src={image.image || image.image_url} 
                            alt={image.alt_text || 'Product image'} 
                          />
                          <div className="image-actions">
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(image.id)}
                              className={`btn btn-sm ${image.is_main ? 'btn-primary' : 'btn-outline'}`}
                            >
                              {image.is_main ? 'Main' : 'Set Main'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleImageDelete(image.id)}
                              className="btn btn-sm btn-danger"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {newImages.length > 0 && (
                  <div className="new-images">
                    <h4>New Images</h4>
                    <div className="image-grid">
                      {newImages.map((image, index) => (
                        <div key={index} className="image-item">
                          <img src={image.preview} alt="New product image" />
                          <div className="image-actions">
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(index)}
                              className={`btn btn-sm ${image.is_main ? 'btn-primary' : 'btn-outline'}`}
                            >
                              {image.is_main ? 'Main' : 'Set Main'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleImageDelete(index)}
                              className="btn btn-sm btn-danger"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                <ImageUpload
                  onImagesUploaded={handleImageUpload}
                  maxImages={10 - images.length - newImages.length}
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="form-section">
              <h3>Product Details</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    min="0"
                    step="0.01"
                    className={errors.weight ? 'error' : ''}
                    placeholder="0.00"
                  />
                  {errors.weight && <span className="error-text">{errors.weight}</span>}
                </div>

                <div className="form-group">
                  <label>Dimensions (L x W x H cm)</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    placeholder="e.g. 20 x 15 x 10"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Material</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => handleInputChange('material', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => handleInputChange('condition', e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Attributes */}
            <div className="form-section">
              <h3>Product Attributes</h3>
              
              <div className="attributes-list">
                {attributes.map((attr, index) => (
                  <div key={index} className="attribute-row">
                    <input
                      type="text"
                      placeholder="Attribute name (e.g., Screen Size)"
                      value={attr.name}
                      onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Attribute value (e.g., 6.1 inches)"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addAttribute}
                className="btn btn-outline btn-sm"
              >
                <Plus size={16} />
                Add Attribute
              </button>
            </div>

            {/* Product Variants */}
            <div className="form-section">
              <h3>Product Variants</h3>
              
              <div className="variants-list">
                {variants.map((variant, index) => (
                  <div key={index} className="variant-row">
                    <div className="variant-fields">
                      <input
                        type="text"
                        placeholder="Variant name (e.g., 128GB Black)"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        min="0"
                        step="1"
                        className={errors[`variant_${index}_price`] ? 'error' : ''}
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={variant.stock_quantity}
                        onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                        min="0"
                      />
                      <input
                        type="text"
                        placeholder="Color"
                        value={variant.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Size"
                        value={variant.size}
                        onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      />
                      <div className="checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={variant.is_active}
                            onChange={(e) => updateVariant(index, 'is_active', e.target.checked)}
                          />
                          Active
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                    {errors[`variant_${index}_price`] && (
                      <span className="error-text">{errors[`variant_${index}_price`]}</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="btn btn-outline btn-sm"
              >
                <Plus size={16} />
                Add Variant
              </button>
            </div>

            {/* SEO Settings */}
            <div className="form-section">
              <h3>SEO Settings</h3>
              
              <div className="form-group">
                <label>Meta Title</label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  maxLength={150}
                  placeholder="SEO title for search engines"
                />
                <small>{formData.meta_title.length}/150 characters</small>
              </div>

              <div className="form-group">
                <label>Meta Description</label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="SEO description for search engines"
                />
                <small>{formData.meta_description.length}/300 characters</small>
              </div>

              <div className="form-group">
                <label>Meta Keywords</label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                  placeholder="Comma-separated keywords"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="electronics, smartphone, apple"
                />
                <small>Separate multiple tags with commas</small>
              </div>
            </div>

            {/* Product Status */}
            <div className="form-section">
              <h3>Product Status</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    />
                    Active Product
                  </label>
                  <small>Visible to customers when active</small>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    />
                    Featured Product
                  </label>
                  <small>Show in featured sections</small>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_digital}
                      onChange={(e) => handleInputChange('is_digital', e.target.checked)}
                    />
                    Digital Product
                  </label>
                  <small>No physical shipping required</small>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.requires_shipping}
                      onChange={(e) => handleInputChange('requires_shipping', e.target.checked)}
                    />
                    Requires Shipping
                  </label>
                  <small>Physical product needs delivery</small>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner small" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;