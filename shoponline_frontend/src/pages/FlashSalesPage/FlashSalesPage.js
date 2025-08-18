import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Flame, Tag, Filter, Grid, List } from 'lucide-react';
import ActiveFlashSales from './ActiveFlashSales';
import FlashSaleProducts from './FlashSaleProducts';
import FlashSaleTimer from './FlashSaleTimer';
import './FlashSalesPage.css';

const FlashSalesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFlashSales, setActiveFlashSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('discount_desc');
  const [filterBy, setFilterBy] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  // Get sale ID from URL params
  const saleId = searchParams.get('sale');

  useEffect(() => {
    fetchActiveFlashSales();
  }, []);

  useEffect(() => {
    if (saleId && activeFlashSales.length > 0) {
      const sale = activeFlashSales.find(s => s.id === saleId);
      if (sale) {
        setSelectedSale(sale);
        fetchFlashSaleProducts(saleId);
      }
    }
  }, [saleId, activeFlashSales]);

  const fetchActiveFlashSales = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/flash-sales/sales/active_sales/');
      if (!response.ok) throw new Error('Failed to fetch flash sales');
      const data = await response.json();
      setActiveFlashSales(data);

      // If no specific sale selected, show first active sale
      if (!saleId && data.length > 0) {
        setSelectedSale(data[0]);
        fetchFlashSaleProducts(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSaleProducts = async flashSaleId => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/flash-sales/sales/${flashSaleId}/with_products/`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.flash_sale_products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaleSelect = sale => {
    setSelectedSale(sale);
    setSearchParams({ sale: sale.id });
    fetchFlashSaleProducts(sale.id);
  };

  const handleSortChange = newSort => {
    setSortBy(newSort);
    // Sort products based on selection
    const sorted = [...products].sort((a, b) => {
      switch (newSort) {
        case 'discount_desc':
          return b.discount_percentage - a.discount_percentage;
        case 'discount_asc':
          return a.discount_percentage - b.discount_percentage;
        case 'price_asc':
          return a.flash_sale_price - b.flash_sale_price;
        case 'price_desc':
          return b.flash_sale_price - a.flash_sale_price;
        case 'name_asc':
          return a.product_detail.name.localeCompare(b.product_detail.name);
        default:
          return 0;
      }
    });
    setProducts(sorted);
  };

  const filteredProducts = products.filter(product => {
    // Filter by availability
    if (filterBy === 'available' && product.is_sold_out) return false;
    if (filterBy === 'sold_out' && !product.is_sold_out) return false;

    // Filter by price range
    const price = parseFloat(product.flash_sale_price);
    if (price < priceRange[0] || price > priceRange[1]) return false;

    return true;
  });

  if (loading && activeFlashSales.length === 0) {
    return (
      <div className="flash-sales-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading flash sales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flash-sales-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchActiveFlashSales} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (activeFlashSales.length === 0) {
    return (
      <div className="flash-sales-page">
        <div className="no-sales-container">
          <div className="no-sales-icon">
            <Flame size={64} />
          </div>
          <h2>No Flash Sales Active</h2>
          <p>Check back soon for amazing deals and discounts!</p>
          <button onClick={() => (window.location.href = '/')} className="home-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flash-sales-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <Flame className="header-icon" />
            <div>
              <h1>Flash Sales</h1>
              <p>Limited time offers with incredible discounts</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-number">{activeFlashSales.length}</span>
              <span className="stat-label">Active Sales</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {activeFlashSales.reduce((total, sale) => total + sale.products_count, 0)}
              </span>
              <span className="stat-label">Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Flash Sales Navigation */}
      <ActiveFlashSales
        flashSales={activeFlashSales}
        selectedSale={selectedSale}
        onSaleSelect={handleSaleSelect}
      />

      {/* Selected Sale Details */}
      {selectedSale && (
        <div className="selected-sale-section">
          <div className="sale-header">
            <div className="sale-info">
              <h2>{selectedSale.name}</h2>
              <p className="sale-description">{selectedSale.description}</p>
              <div className="sale-discount">
                <Tag className="discount-icon" />
                <span>Up to {selectedSale.discount_percentage}% OFF</span>
              </div>
            </div>
            <div className="sale-timer">
              <FlashSaleTimer
                endTime={selectedSale.end_time}
                isRunning={selectedSale.is_running}
                isUpcoming={selectedSale.is_upcoming}
              />
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="controls-section">
            <div className="filters-left">
              <div className="filter-group">
                <label htmlFor="filter-availability">Filter:</label>
                <select
                  id="filter-availability"
                  value={filterBy}
                  onChange={e => setFilterBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Products</option>
                  <option value="available">Available</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="sort-products">Sort:</label>
                <select
                  id="sort-products"
                  value={sortBy}
                  onChange={e => handleSortChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="discount_desc">Highest Discount</option>
                  <option value="discount_asc">Lowest Discount</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>

              <div className="price-range-filter">
                <label>Price Range (UGX):</label>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="price-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={e =>
                      setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000])
                    }
                    className="price-input"
                  />
                </div>
              </div>
            </div>

            <div className="controls-right">
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid size={16} />
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>

              <div className="results-count">
                <span>{filteredProducts.length} products found</span>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <FlashSaleProducts
            products={filteredProducts}
            viewMode={viewMode}
            loading={loading}
            flashSale={selectedSale}
          />
        </div>
      )}
    </div>
  );
};

export default FlashSalesPage;
