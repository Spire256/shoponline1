import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Upload, X, Plus, AlertCircle } from 'lucide-react';

const AddProduct = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    category: '',
    tags: '',
    price: '',
    original_price: '',
    cost_price: '',
    stock_quantity: '',
    low_stock_threshold: '10',
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
  });

  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/v1/categories/categories/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data.results || data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Handle form input changes
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear errors for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = e => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          setImages(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              file: file,
              preview: e.target.result,
              is_main: prev.length === 0,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Remove image
  const removeImage = imageId => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      // If we removed the main image, make the first remaining image main
      if (filtered.length > 0 && !filtered.some(img => img.is_main)) {
        filtered[0].is_main = true;
      }
      return filtered;
    });
  };

  // Set main image
  const setMainImage = imageId => {
    setImages(prev =>
      prev.map(img => ({
        ...img,
        is_main: img.id === imageId,
      }))
    );
  };

  // Add attribute
  const addAttribute = () => {
    setAttributes(prev => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        value: '',
        position: prev.length,
      },
    ]);
  };

  // Remove attribute
  const removeAttribute = id => {
    setAttributes(prev => prev.filter(attr => attr.id !== id));
  };

  // Update attribute
  const updateAttribute = (id, field, value) => {
    setAttributes(prev => prev.map(attr => (attr.id === id ? { ...attr, [field]: value } : attr)));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

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

    if (
      formData.original_price &&
      parseFloat(formData.original_price) < parseFloat(formData.price)
    ) {
      newErrors.original_price = 'Original price cannot be less than current price';
    }

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
  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add basic form data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add images
      images.forEach((img, index) => {
        formDataToSend.append('images_data', img.file);
      });

      // Add attributes
      if (attributes.length > 0) {
        formDataToSend.append(
          'attributes_data',
          JSON.stringify(
            attributes.map(attr => ({
              name: attr.name,
              value: attr.value,
              position: attr.position,
            }))
          )
        );
      }

      const response = await fetch('/api/v1/products/products/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess?.(data);
      } else {
        const errorData = await response.json();
        setErrors(errorData);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setErrors({ general: 'Failed to create product. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'details', label: 'Details' },
    { id: 'images', label: 'Images' },
    { id: 'attributes', label: 'Attributes' },
    { id: 'seo', label: 'SEO' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
            <p className="text-slate-600">Create a new product for your store</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{errors.general}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-slate-200'
                      }`}
                      placeholder="Enter product name"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Short Description
                    </label>
                    <input
                      type="text"
                      name="short_description"
                      value={formData.short_description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief product description"
                      maxLength={500}
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.short_description.length}/500 characters
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.description ? 'border-red-300' : 'border-slate-200'
                      }`}
                      placeholder="Detailed product description"
                    />
                    {errors.description && (
                      <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.category ? 'border-red-300' : 'border-slate-200'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Comma-separated tags"
                    />
                    <p className="text-sm text-slate-500 mt-1">Separate tags with commas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Condition
                    </label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">Active</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_featured"
                          checked={formData.is_featured}
                          onChange={handleInputChange}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">Featured</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_digital"
                          checked={formData.is_digital}
                          onChange={handleInputChange}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">Digital Product</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="requires_shipping"
                          checked={formData.requires_shipping}
                          onChange={handleInputChange}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">Requires Shipping</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Pricing Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price (UGX) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.price ? 'border-red-300' : 'border-slate-200'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Original Price (UGX)
                    </label>
                    <input
                      type="number"
                      name="original_price"
                      value={formData.original_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.original_price ? 'border-red-300' : 'border-slate-200'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.original_price && (
                      <p className="text-red-600 text-sm mt-1">{errors.original_price}</p>
                    )}
                    <p className="text-sm text-slate-500 mt-1">Used for showing discounts</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cost Price (UGX)
                    </label>
                    <input
                      type="number"
                      name="cost_price"
                      value={formData.cost_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      For profit calculations (admin only)
                    </p>
                  </div>

                  {formData.price && formData.original_price && (
                    <div className="flex items-center justify-center bg-blue-50 p-4 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-blue-600">Discount</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {Math.round(
                            ((formData.original_price - formData.price) / formData.original_price) *
                              100
                          )}
                          %
                        </p>
                        <p className="text-sm text-blue-600">
                          Save UGX {(formData.original_price - formData.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Inventory Management</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="track_inventory"
                        checked={formData.track_inventory}
                        onChange={handleInputChange}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-slate-700">
                        Track inventory for this product
                      </span>
                    </label>
                  </div>

                  {formData.track_inventory && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Stock Quantity *
                        </label>
                        <input
                          type="number"
                          name="stock_quantity"
                          value={formData.stock_quantity}
                          onChange={handleInputChange}
                          min="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.stock_quantity ? 'border-red-300' : 'border-slate-200'
                          }`}
                          placeholder="0"
                        />
                        {errors.stock_quantity && (
                          <p className="text-red-600 text-sm mt-1">{errors.stock_quantity}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                          name="low_stock_threshold"
                          value={formData.low_stock_threshold}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="10"
                        />
                        <p className="text-sm text-slate-500 mt-1">
                          Get notified when stock falls below this number
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="allow_backorders"
                            checked={formData.allow_backorders}
                            onChange={handleInputChange}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-slate-700">
                            Allow backorders when out of stock
                          </span>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Product Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Product brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Product model"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Product color"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Product size"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Material
                    </label>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Product material"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Dimensions
                    </label>
                    <input
                      type="text"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Length x Width x Height (cm)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Product Images</h3>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Images
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Click to upload images</p>
                      <p className="text-xs text-slate-500">PNG, JPG, WEBP up to 10MB each</p>
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {images.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">
                      Uploaded Images ({images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map(image => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview}
                            alt="Product"
                            className="w-full h-32 object-cover rounded-lg border border-slate-200"
                          />

                          {/* Main badge */}
                          {image.is_main && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              Main
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            {!image.is_main && (
                              <button
                                onClick={() => setMainImage(image.id)}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              onClick={() => removeImage(image.id)}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attributes Tab */}
            {activeTab === 'attributes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Product Attributes</h3>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Attribute
                  </button>
                </div>

                {attributes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No attributes added yet.</p>
                    <p className="text-sm">
                      Attributes help customers understand product specifications.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attributes.map(attribute => (
                      <div
                        key={attribute.id}
                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Attribute name (e.g., Material)"
                            value={attribute.name}
                            onChange={e => updateAttribute(attribute.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Attribute value (e.g., Cotton)"
                            value={attribute.value}
                            onChange={e => updateAttribute(attribute.id, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttribute(attribute.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">SEO Settings</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="meta_title"
                      value={formData.meta_title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO title for search engines"
                      maxLength={150}
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.meta_title.length}/150 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO description for search engines"
                      maxLength={300}
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.meta_description.length}/300 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      name="meta_keywords"
                      value={formData.meta_keywords}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Comma-separated keywords"
                    />
                    <p className="text-sm text-slate-500 mt-1">Separate keywords with commas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
