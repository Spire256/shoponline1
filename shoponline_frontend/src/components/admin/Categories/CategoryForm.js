// src/components/admin/Categories/CategoryForm.js

import React, { useState, useEffect } from 'react';
import { Upload, X, FolderTree, Star, Eye } from 'lucide-react';
import { categoriesAPI } from '../../../services/api/categoriesAPI';
import { useNotifications } from '../../../hooks/useNotifications';

const CategoryForm = ({ mode = 'create', initialData = null, onSubmit, onCancel }) => {
  const { showNotification } = useNotifications();

  // Form state
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data for edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        parent: initialData.parent || '',
        is_active: initialData.is_active ?? true,
        featured: initialData.featured ?? false,
        sort_order: initialData.sort_order || 0,
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        image: null, // Will be handled separately for existing images
      });

      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [mode, initialData]);

  // Fetch parent categories
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories({ parent: 'root' });
        let categories = response.results || [];

        // If editing, exclude the current category and its descendants
        if (mode === 'edit' && initialData) {
          categories = categories.filter(
            cat =>
              cat.id !== initialData.id &&
              !cat.breadcrumb_trail.some(breadcrumb => breadcrumb.id === initialData.id)
          );
        }

        setParentCategories(categories);
      } catch (error) {
        console.error('Error fetching parent categories:', error);
      }
    };

    fetchParentCategories();
  }, [mode, initialData]);

  // Handle input changes
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image upload
  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('Only JPEG, PNG, and WebP images are allowed', 'error');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);

    // Reset file input
    const fileInput = document.getElementById('category-image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Auto-generate meta title when name changes
  useEffect(() => {
    if (formData.name && !formData.meta_title) {
      setFormData(prev => ({
        ...prev,
        meta_title: prev.name,
      }));
    }
  }, [formData.name]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (formData.sort_order < 0) {
      newErrors.sort_order = 'Sort order cannot be negative';
    }

    if (formData.meta_title && formData.meta_title.length > 200) {
      newErrors.meta_title = 'Meta title cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare form data for submission
      const submitData = new FormData();

      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key === 'image') return; // Handle separately

        let value = formData[key];
        if (typeof value === 'boolean') {
          value = value.toString();
        }

        submitData.append(key, value);
      });

      // Add image if present
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await onSubmit(submitData);
    } catch (error) {
      showNotification(error.message || 'Failed to save category', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      {/* Basic Information */}
      <div className="form-section">
        <h3>Basic Information</h3>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name" className="required">
              Category Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter category name"
              className={errors.name ? 'error' : ''}
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="parent">Parent Category</label>
            <select id="parent" name="parent" value={formData.parent} onChange={handleInputChange}>
              <option value="">No Parent (Root Category)</option>
              {parentCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
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
          />
        </div>
      </div>

      {/* Category Image */}
      <div className="form-section">
        <h3>Category Image</h3>

        <div className="image-upload-section">
          {imagePreview ? (
            <div className="image-preview">
              <img src={imagePreview} alt="Category preview" />
              <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>
                <X className="icon" />
              </button>
            </div>
          ) : (
            <div className="image-upload-placeholder">
              <Upload className="upload-icon" />
              <p>Click to upload category image</p>
              <span className="upload-hint">JPEG, PNG, WebP (Max 5MB)</span>
            </div>
          )}

          <input
            type="file"
            id="category-image"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageUpload}
            className="file-input"
          />

          <label htmlFor="category-image" className="file-input-label">
            Choose Image
          </label>
        </div>
      </div>

      {/* Settings */}
      <div className="form-section">
        <h3>Settings</h3>

        <div className="form-row">
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
            />
            {errors.sort_order && <span className="error-message">{errors.sort_order}</span>}
            <span className="field-hint">Lower numbers appear first</span>
          </div>
        </div>

        <div className="form-row">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <span className="checkbox-text">
                <Eye className="icon" />
                Active (visible to customers)
              </span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
              />
              <span className="checkbox-text">
                <Star className="icon" />
                Featured (show on homepage)
              </span>
            </label>
          </div>
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
            placeholder="SEO meta title (auto-generated from name if empty)"
            maxLength="200"
            className={errors.meta_title ? 'error' : ''}
          />
          {errors.meta_title && <span className="error-message">{errors.meta_title}</span>}
          <span className="field-hint">{formData.meta_title.length}/200 characters</span>
        </div>

        <div className="form-group">
          <label htmlFor="meta_description">Meta Description</label>
          <textarea
            id="meta_description"
            name="meta_description"
            value={formData.meta_description}
            onChange={handleInputChange}
            placeholder="SEO meta description"
            rows="3"
            maxLength="300"
          />
          <span className="field-hint">{formData.meta_description.length}/300 characters</span>
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
          Cancel
        </button>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <div className="loading-spinner small" />
          ) : (
            <>{mode === 'create' ? 'Create Category' : 'Update Category'}</>
          )}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
