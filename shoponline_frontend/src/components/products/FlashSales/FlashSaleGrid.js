import React, { useState, useEffect } from 'react';
import { Grid, List, Filter, SortDesc, ChevronDown } from 'lucide-react';
import FlashSaleCard from './FlashSaleCard';
import Button from '../../common/UI/Button/Button';
import Loading from '../../common/UI/Loading/Spinner';
import { flashSalesAPI } from '../../../services/api/flashSalesAPI';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import './FlashSales.css';

const FlashSaleGrid = ({
  flashSale,
  showFilters = true,
  showViewToggle = true,
  initialLimit = 24,
  className = '',
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // View and filter state
  const [viewMode, setViewMode] = useLocalStorage('flash_sale_view_mode', 'grid');
  const [sortBy, setSortBy] = useLocalStorage('flash_sale_sort_by', 'discount_desc');
  const [filters, setFilters] = useState({
    category: '',
    price_min: '',
    price_max: '',
    in_stock: true,
    min_discount: '',
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  useEffect(() => {
    if (flashSale) {
      fetchProducts();
    }
  }, [flashSale, currentPage, sortBy, filters]);

  const fetchProducts = async () => {
    if (!flashSale) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        page_size: initialLimit,
        sort_by: sortBy,
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([key, value]) => value !== '' && value !== null && value !== undefined
          )
        ),
      };

      const response = await flashSalesAPI.getFlashSaleProducts(flashSale.id, params);

      if (response.data && response.data.flash_sale_products) {
        const flashSaleProducts = response.data.flash_sale_products.map(item => ({
          ...item.product_detail,
          flash_sale_price: item.flash_sale_price,
          original_price: item.original_price,
          discount_percentage: item.discount_percentage,
          stock_limit: item.stock_limit,
          sold_quantity: item.sold_quantity,
          is_sold_out: item.is_sold_out,
        }));

        if (currentPage === 1) {
          setProducts(flashSaleProducts);
        } else {
          setProducts(prev => [...prev, ...flashSaleProducts]);
        }

        setHasMore(response.data.pagination?.has_next || false);
        setTotalCount(response.data.pagination?.count || flashSaleProducts.length);
      }
    } catch (error) {
      console.error('Error fetching flash sale products:', error);
      setError('Failed to load products');

      // Mock data for development
      if (currentPage === 1) {
        const mockProducts = [
          {
            id: '1',
            name: 'Samsung Galaxy Smartphone',
            price: 850000,
            original_price: 1200000,
            flash_sale_price: 850000,
            discount_percentage: 29,
            image_url: '/api/placeholder/250/250',
            category: { name: 'Electronics' },
            is_in_stock: true,
            stock_limit: 20,
            sold_quantity: 5,
          },
          {
            id: '2',
            name: 'Nike Air Max Sneakers',
            price: 180000,
            original_price: 250000,
            flash_sale_price: 180000,
            discount_percentage: 28,
            image_url: '/api/placeholder/250/250',
            category: { name: 'Fashion' },
            is_in_stock: true,
            stock_limit: 15,
            sold_quantity: 8,
          },
          {
            id: '3',
            name: 'Apple MacBook Air',
            price: 2800000,
            original_price: 3500000,
            flash_sale_price: 2800000,
            discount_percentage: 20,
            image_url: '/api/placeholder/250/250',
            category: { name: 'Electronics' },
            is_in_stock: true,
            stock_limit: 5,
            sold_quantity: 2,
          },
          {
            id: '4',
            name: 'Sony Headphones',
            price: 120000,
            original_price: 180000,
            flash_sale_price: 120000,
            discount_percentage: 33,
            image_url: '/api/placeholder/250/250',
            category: { name: 'Electronics' },
            is_in_stock: false,
            stock_limit: 10,
            sold_quantity: 10,
          },
          {
            id: '5',
            name: 'Adidas Running Shoes',
            price: 150000,
            original_price: 200000,
            flash_sale_price: 150000,
            discount_percentage: 25,
            image_url: '/api/placeholder/250/250',
            category: { name: 'Fashion' },
            is_in_stock: true,
            stock_limit: 12,
            sold_quantity: 3,
          },
          {
            id: '6',
            name: 'Canon Camera',
            price: 1200000,
            original_price: 1600000,
            flash_sale_price: 1200000,
            discount_percentage: 25,
            image_url: '/api/placeholder/250/250',
            category: { name: 'Electronics' },
            is_in_stock: true,
            stock_limit: 8,
            sold_quantity: 1,
          },
        ];

        setProducts(mockProducts);
        setTotalCount(mockProducts.length);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = newFilters => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSortChange = newSortBy => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      price_min: '',
      price_max: '',
      in_stock: true,
      min_discount: '',
    });
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'in_stock' && value === true) return false;
      return value !== '' && value !== null && value !== undefined && value !== false;
    }).length;
  };

  const renderFilters = () => (
    <div className={`flash-sale-filters ${showFiltersPanel ? 'open' : ''}`}>
      <div className="filters-header">
        <h4>Filters</h4>
        {getActiveFilterCount() > 0 && (
          <button className="clear-filters" onClick={clearFilters}>
            Clear All ({getActiveFilterCount()})
          </button>
        )}
      </div>

      <div className="filter-group">
        <label>Category</label>
        <select
          value={filters.category}
          onChange={e => handleFilterChange({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Home">Home & Garden</option>
          <option value="Sports">Sports</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Price Range (UGX)</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={filters.price_min}
            onChange={e => handleFilterChange({ price_min: e.target.value })}
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.price_max}
            onChange={e => handleFilterChange({ price_max: e.target.value })}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Minimum Discount (%)</label>
        <select
          value={filters.min_discount}
          onChange={e => handleFilterChange({ min_discount: e.target.value })}
        >
          <option value="">Any Discount</option>
          <option value="10">10% or more</option>
          <option value="20">20% or more</option>
          <option value="30">30% or more</option>
          <option value="50">50% or more</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.in_stock}
            onChange={e => handleFilterChange({ in_stock: e.target.checked })}
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );

  const renderControls = () => (
    <div className="grid-controls">
      <div className="controls-left">
        <div className="results-count">{loading ? 'Loading...' : `${totalCount} products`}</div>
      </div>

      <div className="controls-right">
        {showFilters && (
          <Button
            variant="outline"
            size="small"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`filters-toggle ${getActiveFilterCount() > 0 ? 'has-filters' : ''}`}
          >
            <Filter size={16} />
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="filter-count">{getActiveFilterCount()}</span>
            )}
          </Button>
        )}

        <div className="sort-control">
          <select
            value={sortBy}
            onChange={e => handleSortChange(e.target.value)}
            className="sort-select"
          >
            <option value="discount_desc">Highest Discount</option>
            <option value="discount_asc">Lowest Discount</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="stock_desc">Most Available</option>
            <option value="popularity">Most Popular</option>
          </select>
          <SortDesc size={16} className="sort-icon" />
        </div>

        {showViewToggle && (
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!flashSale) {
    return (
      <div className={`flash-sale-grid error ${className}`}>
        <div className="error-message">
          <p>No flash sale selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flash-sale-grid ${viewMode} ${className}`}>
      {renderControls()}

      <div className="grid-content">
        {showFilters && renderFilters()}

        <div className="products-container">
          {loading && products.length === 0 ? (
            <div className="loading-container">
              <Loading />
              <p>Loading flash sale products...</p>
            </div>
          ) : error && products.length === 0 ? (
            <div className="error-container">
              <p>{error}</p>
              <Button variant="outline" onClick={() => fetchProducts()}>
                Try Again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <p>No products found in this flash sale</p>
              {getActiveFilterCount() > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className={`products-${viewMode}`}>
                {products.map(product => (
                  <FlashSaleCard
                    key={product.id}
                    product={product}
                    flashSale={flashSale}
                    showTimer={false}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>

              {/* Load More / Pagination */}
              {hasMore && (
                <div className="load-more-container">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="load-more-btn"
                  >
                    {loading ? 'Loading...' : 'Load More Products'}
                  </Button>
                </div>
              )}

              {loading && products.length > 0 && (
                <div className="loading-more">
                  <Loading size="small" />
                  <span>Loading more products...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showFiltersPanel && (
        <div className="filters-overlay" onClick={() => setShowFiltersPanel(false)} />
      )}
    </div>
  );
};

export default FlashSaleGrid;
