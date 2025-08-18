import React, { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  Upload,
  Trash2,
  Edit,
  Plus,
  Image as ImageIcon,
  Star,
  Settings,
  Monitor,
  Smartphone,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';

const HomepageManagementPage = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [homepageContent, setHomepageContent] = useState(null);
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');

  useEffect(() => {
    loadHomepageData();
  }, []);

  const loadHomepageData = async () => {
    setIsLoading(true);
    try {
      // Mock API calls - replace with actual APIs
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Load homepage content
      setHomepageContent({
        id: 1,
        title: 'Welcome to ShopOnline Uganda',
        subtitle: 'Your trusted online shopping destination',
        heroText:
          'Discover amazing deals on electronics, fashion, and more. Free delivery in Kampala and Wakiso.',
        metaDescription:
          'Shop online in Uganda for electronics, smartphones, laptops, and more. Free delivery available.',
        metaKeywords: 'online shopping Uganda, electronics, smartphones, laptops, delivery Kampala',
        isActive: true,
        updatedAt: '2024-12-01T10:30:00Z',
      });

      // Load banners
      setBanners([
        {
          id: 1,
          title: 'Christmas Mega Sale',
          description: '50% off on selected electronics',
          bannerType: 'hero',
          image: '/api/placeholder/800/400',
          linkUrl: '/flash-sales/christmas',
          linkText: 'Shop Now',
          order: 1,
          isActive: true,
          startDate: '2024-12-01T00:00:00Z',
          endDate: '2024-12-25T23:59:59Z',
        },
        {
          id: 2,
          title: 'New iPhone 15 Available',
          description: 'Latest iPhone models now in stock',
          bannerType: 'promo',
          image: '/api/placeholder/800/200',
          linkUrl: '/products/iphone-15',
          linkText: 'View Details',
          order: 2,
          isActive: true,
          startDate: null,
          endDate: null,
        },
        {
          id: 3,
          title: 'Free Delivery Weekend',
          description: 'Free delivery on orders above UGX 500,000',
          bannerType: 'promo',
          image: '/api/placeholder/800/200',
          linkUrl: '',
          linkText: '',
          order: 3,
          isActive: false,
          startDate: '2024-12-07T00:00:00Z',
          endDate: '2024-12-08T23:59:59Z',
        },
      ]);

      // Load featured products
      setFeaturedProducts([
        {
          id: 1,
          product: {
            id: 'prod1',
            name: 'Samsung Galaxy S24 Ultra',
            price: 4500000,
            originalPrice: 5000000,
            image: '/api/placeholder/300/300',
            category: 'Smartphones',
          },
          order: 1,
          isActive: true,
          featuredUntil: '2024-12-31T23:59:59Z',
        },
        {
          id: 2,
          product: {
            id: 'prod2',
            name: 'MacBook Air M3',
            price: 6800000,
            originalPrice: 7200000,
            image: '/api/placeholder/300/300',
            category: 'Laptops',
          },
          order: 2,
          isActive: true,
          featuredUntil: '2024-12-31T23:59:59Z',
        },
        {
          id: 3,
          product: {
            id: 'prod3',
            name: 'Sony WH-1000XM5',
            price: 890000,
            originalPrice: 1200000,
            image: '/api/placeholder/300/300',
            category: 'Audio',
          },
          order: 3,
          isActive: true,
          featuredUntil: '2024-12-31T23:59:59Z',
        },
      ]);
    } catch (error) {
      console.error('Failed to load homepage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleContentSave = async () => {
    setIsSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving homepage content:', homepageContent);
      alert('Homepage content saved successfully!');
    } catch (error) {
      console.error('Failed to save content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerReorder = (fromIndex, toIndex) => {
    const newBanners = [...banners];
    const [movedItem] = newBanners.splice(fromIndex, 1);
    newBanners.splice(toIndex, 0, movedItem);

    // Update order values
    newBanners.forEach((banner, index) => {
      banner.order = index + 1;
    });

    setBanners(newBanners);
  };

  const handleFeaturedProductReorder = (fromIndex, toIndex) => {
    const newProducts = [...featuredProducts];
    const [movedItem] = newProducts.splice(fromIndex, 1);
    newProducts.splice(toIndex, 0, movedItem);

    // Update order values
    newProducts.forEach((item, index) => {
      item.order = index + 1;
    });

    setFeaturedProducts(newProducts);
  };

  const toggleBannerStatus = bannerId => {
    setBanners(
      banners.map(banner =>
        banner.id === bannerId ? { ...banner, isActive: !banner.isActive } : banner
      )
    );
  };

  const toggleFeaturedProductStatus = featuredId => {
    setFeaturedProducts(
      featuredProducts.map(item =>
        item.id === featuredId ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  const HomepageContentTab = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
            <input
              type="text"
              value={homepageContent?.title || ''}
              onChange={e => setHomepageContent({ ...homepageContent, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter main title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <input
              type="text"
              value={homepageContent?.subtitle || ''}
              onChange={e => setHomepageContent({ ...homepageContent, subtitle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter subtitle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hero Text</label>
            <textarea
              rows="4"
              value={homepageContent?.heroText || ''}
              onChange={e => setHomepageContent({ ...homepageContent, heroText: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter hero description text"
            />
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
            <textarea
              rows="3"
              value={homepageContent?.metaDescription || ''}
              onChange={e =>
                setHomepageContent({ ...homepageContent, metaDescription: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meta description (max 160 characters)"
              maxLength="160"
            />
            <p className="text-xs text-gray-500 mt-1">
              {homepageContent?.metaDescription?.length || 0}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
            <input
              type="text"
              value={homepageContent?.metaKeywords || ''}
              onChange={e =>
                setHomepageContent({ ...homepageContent, metaKeywords: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter keywords separated by commas"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleContentSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const BannersTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Manage Banners</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </button>
      </div>

      {/* Banner List */}
      <div className="space-y-4">
        {banners.map((banner, index) => (
          <div key={banner.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* Banner Preview */}
                <div className="h-24 w-40 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>

                {/* Banner Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{banner.title}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        banner.bannerType === 'hero'
                          ? 'bg-purple-100 text-purple-800'
                          : banner.bannerType === 'promo'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {banner.bannerType.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{banner.description}</p>
                  {banner.linkUrl && (
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {banner.linkText || banner.linkUrl}
                    </a>
                  )}
                  {(banner.startDate || banner.endDate) && (
                    <div className="text-sm text-gray-500 mt-2">
                      {banner.startDate &&
                        `Start: ${new Date(banner.startDate).toLocaleDateString()}`}
                      {banner.startDate && banner.endDate && ' • '}
                      {banner.endDate && `End: ${new Date(banner.endDate).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {/* Reorder buttons */}
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => index > 0 && handleBannerReorder(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      index < banners.length - 1 && handleBannerReorder(index, index + 1)
                    }
                    disabled={index === banners.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Action buttons */}
                <button
                  onClick={() => toggleBannerStatus(banner.id)}
                  className={`p-2 rounded ${
                    banner.isActive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={banner.isActive ? 'Deactivate' : 'Activate'}
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No banners</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first banner.</p>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const FeaturedProductsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Featured Products</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Featured Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredProducts.map((item, index) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="relative">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
              <div className="absolute top-2 right-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="absolute top-2 left-2 flex flex-col space-y-1">
                <button
                  onClick={() => index > 0 && handleFeaturedProductReorder(index, index - 1)}
                  disabled={index === 0}
                  className="p-1 bg-white rounded text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed shadow-sm"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() =>
                    index < featuredProducts.length - 1 &&
                    handleFeaturedProductReorder(index, index + 1)
                  }
                  disabled={index === featuredProducts.length - 1}
                  className="p-1 bg-white rounded text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed shadow-sm"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  {item.product.name}
                </h4>
              </div>

              <p className="text-xs text-gray-500 mb-2">{item.product.category}</p>

              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(item.product.price)}
                </span>
                {item.product.originalPrice > item.product.price && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(item.product.originalPrice)}
                  </span>
                )}
              </div>

              {item.featuredUntil && (
                <p className="text-xs text-gray-500 mb-3">
                  Featured until: {new Date(item.featuredUntil).toLocaleDateString()}
                </p>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFeaturedProductStatus(item.id)}
                  className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    item.isActive
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {item.isActive ? 'Remove' : 'Activate'}
                </button>
                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {featuredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Star className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No featured products</h3>
          <p className="mt-1 text-sm text-gray-500">Add products to feature on your homepage.</p>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Featured Product
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading homepage content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Homepage Management</h1>
              <p className="text-gray-600">Customize your homepage content and layout</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded ${
                    previewMode === 'desktop'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded ${
                    previewMode === 'mobile'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
              <button className="text-blue-600 hover:text-blue-700 border border-blue-600 hover:border-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Preview Homepage
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Homepage Content
              </button>
              <button
                onClick={() => setActiveTab('banners')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'banners'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Banners ({banners.length})
              </button>
              <button
                onClick={() => setActiveTab('featured')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'featured'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Featured Products ({featuredProducts.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'content' && <HomepageContentTab />}
            {activeTab === 'banners' && <BannersTab />}
            {activeTab === 'featured' && <FeaturedProductsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageManagementPage;
