import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Star, Eye, Package, AlertCircle, Save } from 'lucide-react';

const FeaturedProducts = ({ onDataChange }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchAllProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/featured-products/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('/api/v1/products/products/?is_active=true', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllProducts(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddFeatured = async (productIds) => {
    try {
      const promises = productIds.map(productId => 
        fetch('/api/v1/admin/featured-products/', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product: productId }),
        })
      );

      await Promise.all(promises);
      await fetchFeaturedProducts();
      setShowAddModal(false);
      setSelectedProducts([]);
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error adding featured products:', error);
    }
  };

  const handleRemoveFeatured = async (featuredId) => {
    if (!window.confirm('Remove this product from featured?')) return;

    try {
      const response = await fetch(`/api/v1/admin/featured-products/${featuredId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        await fetchFeaturedProducts();
        if (onDataChange) onDataChange();
      }
    } catch (error) {
      console.error('Error removing featured product:', error);
    }
  };

  const handleReorder = async (reorderedItems) => {
    try {
      const orderData = reorderedItems.map((item, index) => ({
        id: item.id,
        order: index
      }));

      const response = await fetch('/api/v1/admin/featured-products/reorder/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured_orders: orderData }),
      });

      if (response.ok) {
        setFeaturedProducts(reorderedItems);
        if (onDataChange) onDataChange();
      }
    } catch (error) {
      console.error('Error reordering featured products:', error);
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const draggedIndex = featuredProducts.findIndex(item => item.id === draggedItem.id);
    const targetIndex = featuredProducts.findIndex(item => item.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...featuredProducts];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    handleReorder(newOrder);
    setDraggedItem(null);
  };

  const availableProducts = allProducts.filter(product => 
    !featuredProducts.some(featured => featured.product?.id === product.id) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProductSelector = ({ onClose, onAdd }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900">Add Featured Products</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableProducts.map(product => (
                <div
                  key={product.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <img
                      src={product.image_url || '/api/placeholder/60/60'}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{product.name}</h4>
                      <p className="text-sm text-slate-600">{product.category?.name}</p>
                      <p className="text-sm font-semibold text-blue-600">
                        UGX {product.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {availableProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No products available to feature</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-slate-600">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onAdd(selectedProducts)}
                disabled={selectedProducts.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Featured ({selectedProducts.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Featured Products
          </h3>
          <p className="text-slate-600 mt-1">Manage products displayed on homepage</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Featured
        </button>
      </div>

      {featuredProducts.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-slate-900 mb-2">No Featured Products</h4>
          <p className="text-slate-600 mb-4">Add products to showcase on your homepage</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add First Featured Product
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {featuredProducts.map((featured, index) => (
            <div
              key={featured.id}
              draggable
              onDragStart={(e) => handleDragStart(e, featured)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, featured)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-move"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg font-semibold text-sm">
                    {index + 1}
                  </div>
                  <img
                    src={featured.product_details?.image_url || '/api/placeholder/60/60'}
                    alt={featured.product_details?.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {featured.product_details?.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{featured.product_details?.category?.name}</span>
                      <span className="font-semibold text-blue-600">
                        UGX {featured.product_details?.price?.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {featured.product_details?.stock_quantity} in stock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(`/products/${featured.product_details?.slug}`, '_blank')}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    title="View Product"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveFeatured(featured.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove from Featured"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {featured.featured_until && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="w-4 h-4" />
                    Featured until: {new Date(featured.featured_until).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {featuredProducts.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Save className="w-4 h-4" />
            <span>Drag and drop to reorder featured products. Changes are saved automatically.</span>
          </div>
        </div>
      )}

      {showAddModal && (
        <ProductSelector
          onClose={() => {
            setShowAddModal(false);
            setSelectedProducts([]);
            setSearchTerm('');
          }}
          onAdd={handleAddFeatured}
        />
      )}
    </div>
  );
};

export default FeaturedProducts;