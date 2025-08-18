import React, { useState, useEffect } from 'react';
import { Plus, Star, Package, Calendar, ArrowUp, ArrowDown, X, Search } from 'lucide-react';

const FeaturedProducts = ({ onDataChange }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [featuredUntil, setFeaturedUntil] = useState('');

  // Sample data for demonstration
  const sampleFeaturedProducts = [
    {
      id: 1,
      featured_until: '2024-12-31T23:59:59Z',
      product_details: {
        id: 101,
        name: 'Premium Wireless Headphones',
        price: 250000,
        original_price: 300000,
        image_url: 'https://via.placeholder.com/200x200?text=Headphones',
        category: { name: 'Electronics' },
        stock_quantity: 25
      }
    },
    {
      id: 2,
      featured_until: null,
      product_details: {
        id: 102,
        name: 'Smart Phone Case',
        price: 50000,
        original_price: null,
        image_url: 'https://via.placeholder.com/200x200?text=Phone+Case',
        category: { name: 'Accessories' },
        stock_quantity: 100
      }
    },
    {
      id: 3,
      featured_until: '2024-09-15T23:59:59Z',
      product_details: {
        id: 103,
        name: 'Running Shoes',
        price: 180000,
        original_price: 220000,
        image_url: 'https://via.placeholder.com/200x200?text=Shoes',
        category: { name: 'Sports' },
        stock_quantity: 15
      }
    }
  ];

  const sampleAvailableProducts = [
    {
      id: 104,
      name: 'Bluetooth Speaker',
      price: 120000,
      image_url: 'https://via.placeholder.com/200x200?text=Speaker',
      category: { name: 'Electronics' },
      is_on_sale: true
    },
    {
      id: 105,
      name: 'Gaming Mouse',
      price: 80000,
      image_url: 'https://via.placeholder.com/200x200?text=Mouse',
      category: { name: 'Gaming' },
      is_on_sale: false
    },
    {
      id: 106,
      name: 'Laptop Stand',
      price: 75000,
      image_url: 'https://via.placeholder.com/200x200?text=Stand',
      category: { name: 'Accessories' },
      is_on_sale: false
    }
  ];

  useEffect(() => {
    fetchFeaturedProducts();
    fetchAvailableProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setFeaturedProducts(sampleFeaturedProducts);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setLoading(false);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      // Simulate API call
      setAvailableProducts(sampleAvailableProducts);
    } catch (error) {
      console.error('Error fetching available products:', error);
    }
  };

  const handleAddFeaturedProduct = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      // Simulate API call
      const newFeatured = {
        id: Date.now(),
        featured_until: featuredUntil || null,
        product_details: selectedProduct
      };
      
      setFeaturedProducts(prev => [...prev, newFeatured]);
      setShowProductSelector(false);
      setSelectedProduct(null);
      setFeaturedUntil('');
      
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error adding featured product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeatured = async featuredId => {
    if (!window.confirm('Are you sure you want to remove this featured product?')) return;

    setLoading(true);
    try {
      setFeaturedProducts(prev => prev.filter(f => f.id !== featuredId));
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error removing featured product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (featuredId, direction) => {
    const featuredIndex = featuredProducts.findIndex(f => f.id === featuredId);
    const newFeatured = [...featuredProducts];

    if (direction === 'up' && featuredIndex > 0) {
      [newFeatured[featuredIndex], newFeatured[featuredIndex - 1]] = [
        newFeatured[featuredIndex - 1],
        newFeatured[featuredIndex]
      ];
    } else if (direction === 'down' && featuredIndex < featuredProducts.length - 1) {
      [newFeatured[featuredIndex], newFeatured[featuredIndex + 1]] = [
        newFeatured[featuredIndex + 1],
        newFeatured[featuredIndex]
      ];
    } else {
      return; // No change needed
    }

    // Update order values
    const featuredOrders = newFeatured.map((featured, index) => ({
      id: featured.id,
      order: index,
    }));

    try {
      setFeaturedProducts(newFeatured);
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error reordering featured products:', error);
    }
  };

  const filteredProducts = availableProducts.filter(
    product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !featuredProducts.some(featured => featured.product_details.id === product.id)
  );

  const formatPrice = price => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Products</h2>
          <p className="text-gray-600">Manage products featured on homepage</p>
        </div>

        <button
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => setShowProductSelector(true)}
        >
          <Plus size={20} />
          <span>Add Featured Product</span>
        </button>
      </div>

      {showProductSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowProductSelector(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Select Product to Feature</h3>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowProductSelector(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feature Until (Optional)</label>
                  <input
                    type="datetime-local"
                    value={featuredUntil}
                    onChange={e => setFeaturedUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No available products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedProduct?.id === product.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="mb-3">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-lg font-semibold text-blue-600">{formatPrice(product.price)}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{product.category?.name}</span>
                            {product.is_on_sale && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Sale</span>
                            )}
                          </div>
                        </div>

                        {selectedProduct?.id === product.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  onClick={() => setShowProductSelector(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  onClick={handleAddFeaturedProduct}
                  disabled={!selectedProduct || loading}
                >
                  Add to Featured
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        {loading && featuredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading featured products...</p>
          </div>
        ) : (
          <>
            {featuredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Star size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No featured products</h3>
                <p className="text-gray-600 mb-6">Add products to feature on your homepage</p>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  onClick={() => setShowProductSelector(true)}
                >
                  Add Featured Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((featured, index) => {
                  const product = featured.product_details;
                  const isExpired =
                    featured.featured_until && new Date(featured.featured_until) < new Date();

                  return (
                    <div key={featured.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="relative">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                            <Package size={32} className="text-gray-400" />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                          <Star size={14} />
                          <span>Featured</span>
                        </div>

                        <button
                          className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          onClick={() => handleRemoveFeatured(featured.id)}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.original_price)}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{product.category?.name}</span>
                          <span>Stock: {product.stock_quantity}</span>
                        </div>

                        {featured.featured_until && (
                          <div className={`flex items-center space-x-1 text-sm ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                            <Calendar size={14} />
                            <span>
                              {isExpired ? 'Expired: ' : 'Until: '}
                              {new Date(featured.featured_until).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="text-sm text-gray-600">Position: {index + 1}</span>
                          <div className="flex space-x-1">
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                              onClick={() => handleReorder(featured.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                              onClick={() => handleReorder(featured.id, 'down')}
                              disabled={index === featuredProducts.length - 1}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts;