// src/components/products/FlashSales/FlashSalesSection.js - FIXED VERSION
import React, { useState, useEffect, useContext } from 'react';
import { ChevronRight, Clock, Zap, ArrowRight } from 'lucide-react';
import FlashSaleCard from './FlashSaleCard';
import CountdownTimer from './CountdownTimer';
import Button from '../../common/UI/Button/Button';
import Loading from '../../common/UI/Loading/Spinner';
import { FlashSalesContext } from '../../../contexts/FlashSalesContext';
import flashSalesAPI from '../../../services/api/flashSalesAPI';
import './FlashSales.css';

const FlashSalesSection = ({
  title = 'Flash Sales',
  showTimer = true,
  showViewAll = true,
  limit = 8,
  className = '',
  layout = 'horizontal', // 'horizontal' or 'grid'
}) => {
  const [flashSales, setFlashSales] = useState([]);
  const [currentFlashSale, setCurrentFlashSale] = useState(null);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    activeSales,
    isProductInFlashSale,
    getFlashSalePrice,
    refreshSales
  } = useContext(FlashSalesContext) || {};

  useEffect(() => {
    fetchActiveFlashSales();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (refreshSales) refreshSales();
      fetchActiveFlashSales();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshSales]);

  // FIXED: Fetch active flash sales with better error handling
  const fetchActiveFlashSales = async () => {
    try {
      setLoading(true);
      setError(null);

      // FIXED: Use the corrected API method with proper error handling
      const response = await flashSalesAPI.getActiveSales();

      // Handle both direct array response and nested data response
      const salesData = response?.data || response || [];

      if (Array.isArray(salesData) && salesData.length > 0) {
        const activeSales = salesData;
        setFlashSales(activeSales);

        // Set the current flash sale (first active one)
        const firstSale = activeSales[0];
        setCurrentFlashSale(firstSale);

        // Fetch products for the current flash sale
        if (firstSale && firstSale.id) {
          await fetchFlashSaleProducts(firstSale.id);
        }
      } else {
        // No active sales found - show mock data for demonstration
        setFlashSales([]);
        setCurrentFlashSale(null);
        setFlashSaleProducts([]);
        
        // FIXED: Create better mock data structure
        const mockFlashSale = {
          id: 'mock-flash-sale-1',
          name: 'Weekend Super Sale',
          description: 'Up to 70% off on selected items',
          discount_percentage: 50,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          is_active: true,
          is_running: true,
          time_remaining: 7200, // 2 hours in seconds
          banner_image: null,
          products_count: 4,
        };

        setFlashSales([mockFlashSale]);
        setCurrentFlashSale(mockFlashSale);

        // Mock products with proper structure
        const mockProducts = [
          {
            id: 'mock-1',
            name: 'Samsung Galaxy Smartphone',
            price: 850000,
            original_price: 1200000,
            flash_sale_price: 850000,
            discount_percentage: 29,
            image: '/api/placeholder/250/250',
            images: [{ image: '/api/placeholder/250/250' }],
            category: { name: 'Electronics' },
            is_in_stock: true,
            stock_limit: 20,
            sold_quantity: 5,
            is_sold_out: false,
          },
          {
            id: 'mock-2',
            name: 'Nike Air Max Sneakers',
            price: 180000,
            original_price: 250000,
            flash_sale_price: 180000,
            discount_percentage: 28,
            image: '/api/placeholder/250/250',
            images: [{ image: '/api/placeholder/250/250' }],
            category: { name: 'Fashion' },
            is_in_stock: true,
            stock_limit: 15,
            sold_quantity: 8,
            is_sold_out: false,
          },
          {
            id: 'mock-3',
            name: 'Apple MacBook Air',
            price: 2800000,
            original_price: 3500000,
            flash_sale_price: 2800000,
            discount_percentage: 20,
            image: '/api/placeholder/250/250',
            images: [{ image: '/api/placeholder/250/250' }],
            category: { name: 'Electronics' },
            is_in_stock: true,
            stock_limit: 5,
            sold_quantity: 2,
            is_sold_out: false,
          },
          {
            id: 'mock-4',
            name: 'Sony Headphones',
            price: 120000,
            original_price: 180000,
            flash_sale_price: 120000,
            discount_percentage: 33,
            image: '/api/placeholder/250/250',
            images: [{ image: '/api/placeholder/250/250' }],
            category: { name: 'Electronics' },
            is_in_stock: false,
            stock_limit: 10,
            sold_quantity: 10,
            is_sold_out: true,
          },
        ];

        setFlashSaleProducts(mockProducts);
      }
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      setError('Failed to load flash sales');
      // Set empty states
      setFlashSales([]);
      setCurrentFlashSale(null);
      setFlashSaleProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Fetch flash sale products with better error handling
  const fetchFlashSaleProducts = async flashSaleId => {
    try {
      // FIXED: Use the corrected API method for getting flash sale products
      const response = await flashSalesAPI.getFlashSaleWithProducts(flashSaleId);

      const responseData = response?.data || response;

      // Handle different response structures
      let products = [];
      if (responseData && responseData.flash_sale_products) {
        // Transform the data to include flash sale pricing
        products = responseData.flash_sale_products.map(item => ({
          ...(item.product_detail || item.product || {}),
          id: item.product_detail?.id || item.product?.id || item.id,
          flash_sale_price: parseFloat(item.flash_sale_price || 0),
          original_price: parseFloat(item.original_price || 0),
          discount_percentage: parseFloat(item.discount_percentage || 0),
          stock_limit: item.stock_limit,
          sold_quantity: item.sold_quantity || 0,
          is_sold_out: item.is_sold_out || false,
          // Ensure image is available
          image: item.product_detail?.image || item.product?.image || '/api/placeholder/250/250',
          images: item.product_detail?.images || item.product?.images || [{ image: '/api/placeholder/250/250' }],
        }));
      }

      setFlashSaleProducts(products.slice(0, limit)); // Apply limit
    } catch (error) {
      console.error('Error fetching flash sale products:', error);
      // Keep existing mock data on error or set empty array
      if (flashSaleProducts.length === 0) {
        setFlashSaleProducts([]);
      }
    }
  };

  const handleFlashSaleChange = async flashSale => {
    setCurrentFlashSale(flashSale);
    if (flashSale && flashSale.id) {
      await fetchFlashSaleProducts(flashSale.id);
    }
  };

  const handleViewAll = () => {
    window.location.href = '/flash-sales';
  };

  const getVisibleProducts = () => {
    if (layout === 'grid') {
      return flashSaleProducts;
    }

    // For horizontal layout, show 4 products at a time
    const itemsPerView =
      window.innerWidth >= 1200 ? 4 :
      window.innerWidth >= 768 ? 3 :
      window.innerWidth >= 480 ? 2 : 1;

    return flashSaleProducts.slice(currentIndex, currentIndex + itemsPerView);
  };

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    const itemsPerView =
      window.innerWidth >= 1200 ? 4 :
      window.innerWidth >= 768 ? 3 :
      window.innerWidth >= 480 ? 2 : 1;
    const maxIndex = Math.max(0, flashSaleProducts.length - itemsPerView);
    setCurrentIndex(Math.min(maxIndex, currentIndex + 1));
  };

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = () => {
    const itemsPerView =
      window.innerWidth >= 1200 ? 4 :
      window.innerWidth >= 768 ? 3 :
      window.innerWidth >= 480 ? 2 : 1;
    return currentIndex < flashSaleProducts.length - itemsPerView;
  };

  if (loading) {
    return (
      <div className={`flash-sales-section loading ${className}`}>
        <div className="section-header">
          <div className="section-title">
            <Zap className="flash-icon" />
            <h2>{title}</h2>
          </div>
        </div>
        <div className="loading-container">
          <Loading />
          <p>Loading flash sales...</p>
        </div>
      </div>
    );
  }

  if (error || !currentFlashSale || flashSaleProducts.length === 0) {
    return (
      <div className={`flash-sales-section error ${className}`}>
        <div className="section-header">
          <div className="section-title">
            <Zap className="flash-icon" />
            <h2>{title}</h2>
          </div>
        </div>
        <div className="no-flash-sales">
          <div className="no-sales-icon">
            <Clock size={48} />
          </div>
          <h3>No Active Flash Sales</h3>
          <p>Check back later for amazing deals!</p>
          {showViewAll && (
            <Button variant="outline" onClick={handleViewAll}>
              View All Sales
            </Button>
          )}
        </div>
      </div>
    );
  }

  const visibleProducts = getVisibleProducts();

  return (
    <div className={`flash-sales-section ${layout} ${className}`}>
      {/* Section Header */}
      <div className="section-header">
        <div className="section-title">
          <Zap className="flash-icon" />
          <h2>{title}</h2>
          {showTimer && currentFlashSale && currentFlashSale.end_time && (
            <CountdownTimer
              endTime={currentFlashSale.end_time}
              onExpire={() => {
                if (refreshSales) refreshSales();
                fetchActiveFlashSales();
              }}
            />
          )}
        </div>

        <div className="section-actions">
          {/* Flash Sale Selector */}
          {flashSales.length > 1 && (
            <div className="flash-sale-selector">
              <select
                value={currentFlashSale.id}
                onChange={e => {
                  const selectedSale = flashSales.find(sale => sale.id === e.target.value);
                  if (selectedSale) {
                    handleFlashSaleChange(selectedSale);
                  }
                }}
                className="flash-sale-select"
              >
                {flashSales.map(sale => (
                  <option key={sale.id} value={sale.id}>
                    {sale.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Navigation Controls */}
          {layout === 'horizontal' && flashSaleProducts.length > 4 && (
            <div className="carousel-controls">
              <button
                className={`carousel-btn prev ${!canScrollLeft ? 'disabled' : ''}`}
                onClick={handlePrevious}
                disabled={!canScrollLeft}
                aria-label="Previous products"
              >
                <ChevronRight className="rotated" size={20} />
              </button>

              <button
                className={`carousel-btn next ${!canScrollRight() ? 'disabled' : ''}`}
                onClick={handleNext}
                disabled={!canScrollRight()}
                aria-label="Next products"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {showViewAll && (
            <Button variant="link" onClick={handleViewAll} className="view-all-btn">
              View All
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Flash Sale Banner */}
      {currentFlashSale.banner_image && (
        <div className="flash-sale-banner">
          <img
            src={currentFlashSale.banner_image}
            alt={currentFlashSale.name}
            className="banner-image"
            onError={e => {
              e.target.style.display = 'none';
            }}
          />
          <div className="banner-overlay">
            <div className="banner-content">
              <h3>{currentFlashSale.name}</h3>
              <p>{currentFlashSale.description}</p>
              <div className="banner-discount">
                Up to {currentFlashSale.discount_percentage}% OFF
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid/Carousel */}
      <div className="flash-sale-products">
        {layout === 'grid' ? (
          <div className="products-grid">
            {flashSaleProducts.map(product => (
              <FlashSaleCard
                key={product.id}
                product={product}
                flashSale={currentFlashSale}
                showTimer={showTimer}
              />
            ))}
          </div>
        ) : (
          <div className="products-carousel">
            <div className="products-track">
              {visibleProducts.map(product => (
                <div key={product.id} className="product-slide">
                  <FlashSaleCard
                    product={product}
                    flashSale={currentFlashSale}
                    showTimer={false}
                    compact={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Flash Sale Stats */}
      <div className="flash-sale-stats">
        <div className="stats-item">
          <span className="stats-number">{flashSaleProducts.length}</span>
          <span className="stats-label">Products</span>
        </div>

        <div className="stats-item">
          <span className="stats-number">{currentFlashSale.discount_percentage}%</span>
          <span className="stats-label">Max Discount</span>
        </div>

        <div className="stats-item">
          <span className="stats-number">
            {flashSaleProducts.filter(p => !p.is_sold_out && p.is_in_stock !== false).length}
          </span>
          <span className="stats-label">Available</span>
        </div>
      </div>

      {/* Call to Action */}
      {showViewAll && (
        <div className="flash-sale-cta">
          <p>Don't miss out on these amazing deals!</p>
          <Button variant="primary" size="large" onClick={handleViewAll} className="shop-now-btn">
            <Zap size={20} />
            Shop Flash Sales
          </Button>
        </div>
      )}
    </div>
  );
};

export default FlashSalesSection;