// src/components/admin/Categories/EditCategory.js
import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import categoriesAPI from '../../../services/api/categoriesAPI';
import { useNotifications } from '../../../hooks/useNotifications';
import './CategoryManagement.css';

const EditCategory = ({ category, onClose, onSuccess }) => {
  const { showNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
    is_active: true,
    featured: false,
    sort_order: 0,
    meta_title: '',
    meta_description: '',
    image: null,
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when category prop changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        parent: category.parent?.id || '',
        is_active: category.is_active ?? true,
        featured: category.featured ?? false,
        sort_order: category.sort_order || 0,
        meta_title: category.meta_title || '',
        meta_description: category.meta_description || '',
        image: null, // File input, not the URL
      });
      
      if (category.image) {
        setImagePreview(category.image);
      }
    }
  }, [category]);

  // Fetch parent categories (excluding current category and its children)
  useEffect(() => {
    fetchParentCategories();
  }, [category]);

  const fetchParentCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories({ parent: 'root' });
      const categories = response.results || response;
      
      // Filter out the current category and its potential children
      const filteredCategories = categories.filter(cat => {
        if (!category) return true;
        return cat.id !== category.id;
      });
      
      setParentCategories(filteredCategories);
    } catch (error) {
      console.error('Error fetching parent categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
          return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
          return;
        }
        
        setFormData(prev => ({ ...prev, [name]: file }));
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        
        // Clear image error
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: '' }));
        }
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-generate slug from name
      if (name === 'name' && (!formData.slug || formData.slug === generateSlug(formData.name))) {
        setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
      }
      
      // Auto-generate meta title from name
      if (name === 'name' && (!formData.meta_title || formData.meta_title === formData.name)) {
        setFormData(prev => ({ ...prev, meta_title: value }));
      }
      
      // Clear field-specific error
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Category name must be less than 100 characters';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    // Optional field validations
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (formData.meta_title && formData.meta_title.length > 200) {
      newErrors.meta_title = 'Meta title must be less than 200 characters';
    }
    
    if (formData.meta_description && formData.meta_description.length > 300) {
      newErrors.meta_description = 'Meta description must be less than 300 characters';
    }
    
    if (formData.sort_order < 0) {
      newErrors.sort_order = 'Sort order cannot be negative';
    }
    
    // Check if parent is not self (preventing circular reference)
    if (formData.parent === category?.id) {
      newErrors.parent = 'Category cannot be its own parent';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix the errors before submitting', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // Prepare form data for API
      const submitData = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'image' && formData[key] !== null && formData[key] !== '') {
          if (key === 'parent' && !formData[key]) {
            // Don't include empty parent
            return;
          }
          submitData.append(key, formData[key]);
        }
      });
      
      // Add image if selected
      if (formData.image instanceof File) {
        submitData.append('image', formData.image);
      }
      
      // Update category
      const response = await categoriesAPI.updateCategory(category.id, submitData);
      
      showNotification('Category updated successfully!', 'success');
      
      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }
      
    } catch (error) {
      console.error('Error updating category:', error);
      
      if (error.response?.data) {
        const serverErrors = error.response.data;
        
        if (typeof serverErrors === 'object') {
          setErrors(serverErrors);
        } else if (serverErrors.detail || serverErrors.message) {
          showNotification(serverErrors.detail || serverErrors.message, 'error');
        } else {
          showNotification('Failed to update category. Please try again.', 'error');
        }
      } else {
        showNotification('Network error. Please check your connection.', 'error');
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(category?.image || null);
    
    // Clear file input
    const fileInput = document.getElementById('category-image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!category) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content category-modal">
        <div className="modal-header">
          <h2>Edit Category</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="category-form">
          <div className="modal-body">
            <div className="form-grid">
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label htmlFor="name">
                    Category Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                    className={errors.name ? 'error' : ''}
                    disabled={isSubmitting}
                    maxLength={100}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="slug">
                    URL Slug <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="category-slug"
                    className={errors.slug ? 'error' : ''}
                    disabled={isSubmitting}
                    maxLength={120}
                  />
                  {errors.slug && <span className="error-message">{errors.slug}</span>}
                  <small className="field-help">URL-friendly version of the name</small>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description"
                    rows="4"
                    className={errors.description ? 'error' : ''}
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                  {errors.description && <span className="error-message">{errors.description}</span>}
                  <small className="field-help">{formData.description.length}/500 characters</small>
                </div>
              </div>

              {/* Hierarchy & Settings */}
              <div className="form-section">
                <h3>Settings</h3>
                
                <div className="form-group">
                  <label htmlFor="parent">Parent Category</label>
                  <select
                    id="parent"
                    name="parent"
                    value={formData.parent}
                    onChange={handleInputChange}
                    className={errors.parent ? 'error' : ''}
                    disabled={isSubmitting}
                  >
                    <option value="">No Parent (Root Category)</option>
                    {parentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.parent && <span className="error-message">{errors.parent}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="sort_order">Sort Order</label>
                  <input
                    type="number"
                    id="sort_order"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    min="0"
                    className={errors.sort_order ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.sort_order && <span className="error-message">{errors.sort_order}</span>}
                  <small className="field-help">Lower numbers appear first</small>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-text">
                        <Eye size={16} />
                        Active Category
                      </span>
                    </label>
                    <small className="field-help">Inactive categories won't be visible to customers</small>
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-text">
                        <Star size={16} />
                        Featured Category
                      </span>
                    </label>
                    <small className="field-help">Featured categories appear on homepage</small>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-section">
                <h3>Category Image</h3>
                
                <div className="form-group">
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Category" />
                        <div className="image-actions">
                          <button
                            type="button"
                            onClick={removeImage}
                            className="btn-icon danger"
                            disabled={isSubmitting}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <Upload size={32} />
                        <p>Upload Category Image</p>
                        <small>PNG, JPG up to 5MB</small>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      id="category-image"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="file-input"
                      disabled={isSubmitting}
                    />
                    
                    <label htmlFor="category-image" className="file-input-label">
                      {imagePreview ? 'Change Image' : 'Choose Image'}
                    </label>
                  </div>
                  {errors.image && <span className="error-message">{errors.image}</span>}
                </div>
              </div>

              {/* SEO Settings */}
              <div className="form-section">
                <h3>SEO Settings</h3>
                
                <div className="form-group">
                  <label htmlFor="meta_title">Meta Title</label>
                  <input
                    type="text"
                    id="meta_title"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleInputChange}
                    placeholder="SEO title for search engines"
                    className={errors.meta_title ? 'error' : ''}
                    disabled={isSubmitting}
                    maxLength={200}
                  />
                  {errors.meta_title && <span className="error-message">{errors.meta_title}</span>}
                  <small className="field-help">{formData.meta_title.length}/200 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="meta_description">Meta Description</label>
                  <textarea
                    id="meta_description"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleInputChange}
                    placeholder="SEO description for search engines"
                    rows="3"
                    className={errors.meta_description ? 'error' : ''}
                    disabled={isSubmitting}
                    maxLength={300}
                  />
                  {errors.meta_description && <span className="error-message">{errors.meta_description}</span>}
                  <small className="field-help">{formData.meta_description.length}/300 characters</small>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategory;