import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, Percent, Package, AlertCircle, Image } from 'lucide-react';
import flashSalesAPI from '../../../services/api/flashSalesAPI';
import './FlashSaleManagement.css';

const EditFlashSale = ({ flashSale, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: '',
    start_time: '',
    end_time: '',
    is_active: true,
    max_discount_amount: '',
    priority: 0,
    banner_image: null,
  });
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [productSearch, setProductSearch] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (flashSale) {
      setFormData({
        name: flashSale.name || '',
        description: flashSale.description || '',
        discount_percentage: flashSale.discount_percentage || '',
        start_time: flashSale.start_time ? formatDateTimeLocal(flashSale.start_time) : '',
        end_time: flashSale.end_time ? formatDateTimeLocal(flashSale.end_time) : '',
        is_active: flashSale.is_active !== undefined ? flashSale.is_active : true,
        max_discount_amount: flashSale.max_discount_amount || '',
        priority: flashSale.priority || 0,
        banner_image: null, // File input starts empty
      });
      
      // Set preview image if banner exists
      if (flashSale.banner_image) {
        setPreviewImage(flashSale.banner_image);
      }
      
      // Load existing products
      loadFlashSaleProducts();
    }
    loadAvailableProducts();
  }, [flashSale]);

  const formatDateTimeLocal = (dateString) => {
    const date = new Date(dateString);
    // Format for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const loadFlashSaleProducts = async () => {
    try {
      const data = await flashSalesAPI.getFlashSaleProducts(flashSale.id);
      setSelectedProducts(data.map(item => ({
        ...item.product,
        flash_sale_price: item.flash_sale_price,
        custom_discount_percentage: item.custom_discount_percentage,
        stock_limit: item.stock_limit,
      })));
    } catch (error) {
      console.error('Error loading flash sale products:', error);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const data = await flashSalesAPI.getAvailableProducts();
      setAvailableProducts(data.results || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files, checked } = e.target;

    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));

      // Create preview for image
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProductAdd = (product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      const discountPercentage = parseFloat(formData.discount_percentage) || 0;
      const originalPrice = parseFloat(product.price);
      const flashSalePrice = originalPrice * (1 - discountPercentage / 100);
      
      setSelectedProducts(prev => [...prev, {
        ...product,
        flash_sale_price: flashSalePrice.toFixed(2),
        custom_discount_percentage: '',
        stock_limit: '',
      }]);
    }
  };

  const handleProductRemove = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleProductUpdate = (productId, field, value) => {
    setSelectedProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updated = { ...product, [field]: value };
        
        // Recalculate flash sale price if discount percentage changes
        if (field === 'custom_discount_percentage') {
          const discountPercentage = parseFloat(value) || parseFloat(formData.discount_percentage) || 0;
          const originalPrice = parseFloat(product.price);
          updated.flash_sale_price = (originalPrice * (1 - discountPercentage / 100)).toFixed(2);
        }
        
        return updated;
      }
      return product;
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Flash sale name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be less than 200 characters';
    }

    if (!formData.discount_percentage) {
      newErrors.discount_percentage = 'Discount percentage is required';
    } else {
      const discount = parseFloat(formData.discount_percentage);
      if (isNaN(discount) || discount <= 0 || discount > 100) {
        newErrors.discount_percentage = 'Discount must be between 0 and 100';
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

      if (startDate >= endDate) {
        newErrors.end_time = 'End time must be after start time';
      }

      // Check minimum duration (1 hour)
      const durationHours = (endDate - startDate) / (1000 * 60 * 60);
      if (durationHours < 1) {
        newErrors.end_time = 'Flash sale must run for at least 1 hour';
      }

      // Check maximum duration (30 days)
      if (durationHours > 30 * 24) {
        newErrors.end_time = 'Flash sale cannot run for more than 30 days';
      }
    }

    // Max discount validation
    if (formData.max_discount_amount) {
      const maxDiscount = parseFloat(formData.max_discount_amount);
      if (isNaN(maxDiscount) || maxDiscount <= 0) {
        newErrors.max_discount_amount = 'Maximum discount amount must be positive';
      }
    }

    // Priority validation
    if (formData.priority < 0 || formData.priority > 999) {
      newErrors.priority = 'Priority must be between 0 and 999';
    }

    if (selectedProducts.length === 0) {
      newErrors.general = 'Please select at least one product for the flash sale';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare form data for API
      const submitData = new FormData();

      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          if (key === 'banner_image' && formData[key] instanceof File) {
            submitData.append(key, formData[key]);
          } else if (key !== 'banner_image') {
            submitData.append(key, formData[key].toString());
          }
        }
      });

      // Update flash sale using API service
      await flashSalesAPI.updateFlashSale(flashSale.id, submitData);

      // Update products using API service
      const productsData = selectedProducts.map(product => ({
        product: product.id,
        custom_discount_percentage: product.custom_discount_percentage ? parseFloat(product.custom_discount_percentage) : null,
        stock_limit: product.stock_limit ? parseInt(product.stock_limit) : null,
      }));

      await flashSalesAPI.updateFlashSaleProducts(flashSale.id, { products: productsData });

      onSuccess();
    } catch (err) {
      console.error('Update flash sale error:', err);
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Failed to update flash sale. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate duration for display
  const calculateDuration = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      const hours = Math.ceil((end - start) / (1000 * 60 * 60));
      return hours;
    }
    return 0;
  };

  const canEditTiming = () => {
    // Allow editing if flash sale hasn't started yet or is not running
    const now = new Date();
    const startTime = new Date(flashSale.start_time);
    return startTime > now;
  };

  const filteredAvailableProducts = availableProducts.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    !selectedProducts.find(p => p.id === product.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Flash Sale</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            {!canEditTiming() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={16} />
                <span className="text-yellow-700 text-sm">Timing cannot be changed for active flash sales</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="mr-2 text-blue-600" size={20} />
                  Flash Sale Details
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flash Sale Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Weekend Electronics Sale"
                    maxLength={200}
                    required
                  />
                  {errors.name && (
                    <div className="error-message flex items-center mt-1">
                      <AlertCircle size={16} className="mr-1" />
                      <span className="text-red-600 text-sm">{errors.name}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">{formData.name.length}/200</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Describe your flash sale..."
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1">{formData.description.length}/1000</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount % *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount_percentage"
                        value={formData.discount_percentage}
                        onChange={handleInputChange}
                        min="0.01"
                        max="100"
                        step="0.01"
                        className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.discount_percentage ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="25.00"
                        required
                      />
                      <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                    {errors.discount_percentage && (
                      <div className="error-message flex items-center mt-1">
                        <AlertCircle size={16} className="mr-1" />
                        <span className="text-red-600 text-sm">{errors.discount_percentage}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      min="0"
                      max="999"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.priority ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    {errors.priority && (
                      <div className="error-message flex items-center mt-1">
                        <AlertCircle size={16} className="mr-1" />
                        <span className="text-red-600 text-sm">{errors.priority}</span>
                      </div>
                    )}
                    <small className="text-xs text-gray-500">Higher numbers appear first (0-999)</small>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Discount Amount (UGX)
                  </label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">UGX</span>
                    <input
                      type="number"
                      name="max_discount_amount"
                      value={formData.max_discount_amount}
                      onChange={handleInputChange}
                      min="0"
                      step="1000"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.max_discount_amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="100000"
                    />
                  </div>
                  {errors.max_discount_amount && (
                    <div className="error-message flex items-center mt-1">
                      <AlertCircle size={16} className="mr-1" />
                      <span className="text-red-600 text-sm">{errors.max_discount_amount}</span>
                    </div>
                  )}
                  <small className="text-xs text-gray-500">Optional: Maximum discount amount per product</small>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="mr-2 text-blue-600" size={20} />
                  Schedule & Status
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    disabled={!canEditTiming()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.start_time ? 'border-red-300' : 'border-gray-300'
                    } ${!canEditTiming() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                  />
                  {errors.start_time && (
                    <div className="error-message flex items-center mt-1">
                      <AlertCircle size={16} className="mr-1" />
                      <span className="text-red-600 text-sm">{errors.start_time}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    min={formData.start_time}
                    disabled={!canEditTiming()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.end_time ? 'border-red-300' : 'border-gray-300'
                    } ${!canEditTiming() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                  />
                  {errors.end_time && (
                    <div className="error-message flex items-center mt-1">
                      <AlertCircle size={16} className="mr-1" />
                      <span className="text-red-600 text-sm">{errors.end_time}</span>
                    </div>
                  )}
                </div>

                {/* Duration Display */}
                {formData.start_time && formData.end_time && (
                  <div className="duration-display">
                    <small className="text-gray-600">Duration: {calculateDuration()} hours</small>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active Flash Sale
                  </label>
                </div>

                {/* Banner Image Section */}
                <div className="form-section">
                  <h4 className="text-md font-medium text-gray-800 flex items-center mb-3">
                    <Image className="mr-2 text-blue-600" size={16} />
                    Banner Image
                  </h4>

                  <div className="form-group">
                    <label htmlFor="banner_image" className="block text-sm font-medium text-gray-700 mb-2">Upload New Banner</label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        id="banner_image"
                        name="banner_image"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                      />

                      {previewImage ? (
                        <div className="image-preview relative">
                          <img src={previewImage} alt="Banner preview" className="w-full h-32 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImage(flashSale.banner_image || null);
                              setFormData(prev => ({ ...prev, banner_image: null }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="banner_image" className="upload-placeholder cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <Image size={48} className="mx-auto mb-3 text-gray-400" />
                          <p className="text-gray-600">Click to upload new banner image</p>
                          <small className="text-gray-500">Recommended: 1200x400px, JPG/PNG</small>
                        </label>
                      )}
                    </div>
                    <small className="text-xs text-gray-500">Leave empty to keep current banner</small>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Flash Sale Tips</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Set competitive discount percentages to attract customers</li>
                    <li>• Use max discount amount to control total savings</li>
                    <li>• Schedule during peak shopping hours for maximum impact</li>
                    <li>• Higher priority flash sales appear first in listings</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                <Package className="mr-2 text-blue-600" size={20} />
                Flash Sale Products ({selectedProducts.length})
              </h3>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Selected Products */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-4">Selected Products</h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedProducts.map(product => (
                      <div key={product.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{product.name}</h5>
                            <p className="text-sm text-gray-600">Original: UGX {parseFloat(product.price).toLocaleString()}</p>
                            <p className="text-sm font-medium text-green-600">
                              Flash Sale: UGX {parseFloat(product.flash_sale_price).toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleProductRemove(product.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Custom Discount %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={product.custom_discount_percentage}
                              onChange={(e) => handleProductUpdate(product.id, 'custom_discount_percentage', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={formData.discount_percentage}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Stock Limit</label>
                            <input
                              type="number"
                              min="1"
                              value={product.stock_limit}
                              onChange={(e) => handleProductUpdate(product.id, 'stock_limit', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="No limit"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedProducts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No products selected for this flash sale</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Products */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-800">Available Products</h4>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredAvailableProducts.map(product => (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-gray-900">{product.name}</h5>
                            <p className="text-xs text-gray-600">UGX {parseFloat(product.price).toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleProductAdd(product)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredAvailableProducts.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <p className="text-sm">No products found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Update Flash Sale
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFlashSale;