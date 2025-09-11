// src/components/admin/Categories/AddCategory.js

import React, { useState, useEffect } from 'react';
import { X, Upload, Save, AlertCircle, FolderPlus, FileImage, Loader2 } from 'lucide-react';
import categoriesAPI from '../../../services/api/categoriesAPI';
import { useNotifications } from '../../../hooks/useNotifications';
import './CategoryManagement.css';

const AddCategory = ({ onClose, onSuccess }) => {
  const { showNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    name: '',
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingParents, setLoadingParents] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load parent categories on mount
  useEffect(() => {
    const loadParentCategories = async () => {
      try {
        setLoadingParents(true);
        // Get root categories for parent selection - matching backend filter logic
        const response = await categoriesAPI.getCategories({ 
          parent: 'root',
          is_active: true,
          page_size: 100 // Get all active root categories
        });
        
        const categories = response.results || response || [];
        setParentCategories(categories);
      } catch (error) {
        console.error('Error loading parent categories:', error);
        showNotification('Failed to load parent categories', 'warning');
        setParentCategories([]);
      } finally {
        setLoadingParents(false);
      }
    };

    loadParentCategories();
  }, [showNotification]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific field errors when user starts typing/changing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Auto-generate meta_title from name if not manually set
    if (name === 'name' && value && !formData.meta_title) {
      setFormData(prev => ({
        ...prev,
        meta_title: value.slice(0, 200) // Respect backend max length
      }));
    }
  };

  // Handle image upload with validation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }

    // Validate file type - matching backend validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrors(prev => ({
        ...prev,
        image: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      }));
      e.target.value = ''; // Clear file input
      return;
    }

    // Validate file size (5MB limit - matching backend)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        image: 'Image must be less than 5MB'
      }));
      e.target.value = ''; // Clear file input
      return;
    }

    // Set the file and create preview
    setFormData(prev => ({
      ...prev,
      image: file
    }));

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Clear any existing image errors
    if (errors.image) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  // Remove image
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
    
    // Reset file input
    const fileInput = document.getElementById('image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Client-side validation matching backend model constraints
  const validateForm = () => {
    const newErrors = {};

    // Name validation - matching backend MinLengthValidator(2) and max_length=100
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Category name cannot exceed 100 characters';
    }

    // Description validation - optional field
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    // Meta fields validation - matching backend max lengths
    if (formData.meta_title && formData.meta_title.length > 200) {
      newErrors.meta_title = 'Meta title cannot exceed 200 characters';
    }

    if (formData.meta_description && formData.meta_description.length > 300) {
      newErrors.meta_description = 'Meta description cannot exceed 300 characters';
    }

    // Sort order validation
    const sortOrder = parseInt(formData.sort_order);
    if (isNaN(sortOrder) || sortOrder < 0) {
      newErrors.sort_order = 'Sort order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) {
      showNotification('Please fix the validation errors', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the buildCategoryFormData utility from categoriesAPI
      const submitData = categoriesAPI.buildCategoryFormData({
        name: formData.name.trim(),
        description: formData.description.trim(),
        parent: formData.parent || null, // Backend expects null for root categories
        is_active: formData.is_active,
        featured: formData.featured,
        sort_order: parseInt(formData.sort_order) || 0,
        meta_title: formData.meta_title.trim(),
        meta_description: formData.meta_description.trim(),
        image: formData.image
      });

      // Create category using API
      const response = await categoriesAPI.createCategory(submitData);
      
      showNotification('Category created successfully', 'success');
      
      // Clear cache and trigger success callback
      categoriesAPI.clearCategoriesCache();
      
      if (onSuccess) {
        onSuccess(response);
      }

    } catch (error) {
      console.error('Error creating category:', error);
      
      // Handle API errors
      if (error.response?.data) {
        const apiErrors = error.response.data;
        
        if (typeof apiErrors === 'object' && !Array.isArray(apiErrors)) {
          // Handle field-specific validation errors from backend
          const formattedErrors = {};
          Object.keys(apiErrors).forEach(key => {
            const errorValue = apiErrors[key];
            if (Array.isArray(errorValue)) {
              formattedErrors[key] = errorValue.join(', ');
            } else {
              formattedErrors[key] = String(errorValue);
            }
          });
          
          setErrors(formattedErrors);
          showNotification('Please fix the validation errors', 'error');
        } else if (typeof apiErrors === 'string') {
          showNotification(apiErrors, 'error');
        } else {
          showNotification('Failed to create category. Please try again.', 'error');
        }
      } else if (error.message) {
        showNotification(error.message, 'error');
      } else {
        showNotification('Failed to create category. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close with confirmation if changes exist
  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    
    // Check if form has unsaved changes
    const hasChanges = formData.name.trim() || 
                      formData.description.trim() || 
                      formData.parent || 
                      !formData.is_active || 
                      formData.featured || 
                      formData.sort_order !== 0 ||
                      formData.meta_title.trim() ||
                      formData.meta_description.trim() ||
                      formData.image;
    
    if (hasChanges) {
      if (window.confirm('Are you sure you want to close? Your changes will be lost.')) {
        onClose && onClose();
      }
    } else {
      onClose && onClose();
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => e.target.classList.contains('modal-overlay') && handleClose()}
    >
      <div className="modal-container large">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <FolderPlus className="icon" />
            <h2>Add New Category</h2>
          </div>
          <button 
            type="button" 
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X className="icon" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-grid">
              {/* Basic Information Section */}
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label htmlFor="name" className="form-label required">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter category name"
                    maxLength={100}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.name && (
                    <span className="error-message">
                      <AlertCircle className="icon" />
                      {errors.name}
                    </span>
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
                    className={`form-textarea ${errors.description ? 'error' : ''}`}
                    placeholder="Enter category description"
                    rows={4}
                    maxLength={1000}
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <span className="error-message">
                      <AlertCircle className="icon" />
                      {errors.description}
                    </span>
                  )}
                  <span className="char-count">{formData.description.length}/1000</span>
                </div>

                <div className="form-group">
                  <label htmlFor="parent" className="form-label">
                    Parent Category
                  </label>
                  {loadingParents ? (
                    <div className="form-loading">
                      <Loader2 className="icon spin" />
                      <span>Loading categories...</span>
                    </div>
                  ) : (
                    <select
                      id="parent"
                      name="parent"
                      value={formData.parent}
                      onChange={handleInputChange}
                      className="form-select"
                      disabled={isSubmitting}
                    >
                      <option value="">No Parent (Root Category)</option>
                      {parentCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                          {category.product_count !== undefined && 
                            ` (${category.product_count} products)`
                          }
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="form-section">
                <h3>Category Image</h3>
                
                <div className="image-upload-section">
                  {imagePreview ? (
                    <div className="image-preview-container">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="image-preview"
                      />
                      <div className="image-actions">
                        <button
                          type="button"
                          onClick={removeImage}
                          className="btn btn-danger btn-sm"
                          disabled={isSubmitting}
                        >
                          <X className="icon" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="image-upload-placeholder">
                      <FileImage className="upload-icon" />
                      <p>No image selected</p>
                      <span className="upload-hint">Choose an image to represent this category</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="image" className="form-label">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      onChange={handleImageChange}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className={`form-file ${errors.image ? 'error' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.image && (
                      <span className="error-message">
                        <AlertCircle className="icon" />
                        {errors.image}
                      </span>
                    )}
                    <span className="help-text">
                      Supported formats: JPEG, PNG, WebP. Maximum size: 5MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="form-section">
                <h3>Settings</h3>
                
                <div className="form-group">
                  <label htmlFor="sort_order" className="form-label">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    id="sort_order"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    className={`form-input ${errors.sort_order ? 'error' : ''}`}
                    min="0"
                    step="1"
                    disabled={isSubmitting}
                  />
                  {errors.sort_order && (
                    <span className="error-message">
                      <AlertCircle className="icon" />
                      {errors.sort_order}
                    </span>
                  )}
                  <span className="help-text">Lower numbers appear first in category listings</span>
                </div>

                <div className="form-checkboxes">
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
                    <span className="help-text">Category is visible to customers</span>
                  </div>

                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                        className="checkbox-input"
                        disabled={isSubmitting}
                      />
                      <span className="checkbox-text">Featured</span>
                    </label>
                    <span className="help-text">Display prominently on homepage</span>
                  </div>
                </div>
              </div>

              {/* SEO Settings Section */}
              <div className="form-section">
                <h3>SEO Settings</h3>
                
                <div className="form-group">
                  <label htmlFor="meta_title" className="form-label">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="meta_title"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleInputChange}
                    className={`form-input ${errors.meta_title ? 'error' : ''}`}
                    placeholder="SEO meta title (auto-generated from name if empty)"
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  {errors.meta_title && (
                    <span className="error-message">
                      <AlertCircle className="icon" />
                      {errors.meta_title}
                    </span>
                  )}
                  <span className="char-count">{formData.meta_title.length}/200</span>
                </div>

                <div className="form-group">
                  <label htmlFor="meta_description" className="form-label">
                    Meta Description
                  </label>
                  <textarea
                    id="meta_description"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleInputChange}
                    className={`form-textarea ${errors.meta_description ? 'error' : ''}`}
                    placeholder="SEO meta description for search engines"
                    rows={3}
                    maxLength={300}
                    disabled={isSubmitting}
                  />
                  {errors.meta_description && (
                    <span className="error-message">
                      <AlertCircle className="icon" />
                      {errors.meta_description}
                    </span>
                  )}
                  <span className="char-count">{formData.meta_description.length}/300</span>
                </div>
              </div>
            </div>

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
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || loadingParents}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="icon spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="icon" />
                    Create Category
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;