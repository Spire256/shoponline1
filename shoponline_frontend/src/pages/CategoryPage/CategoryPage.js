import React, { useState, useEffect } from 'react';
import { useParams, useLocation,useSearchParams, useNavigate } from 'react-router-dom';
//import { useSearchParams } from 'react-router-dom';
import CategoryHeader from './CategoryHeader';
import CategoryProducts from './CategoryProducts';
import { categoriesAPI, productsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/UI/Loading/Spinner';
import Alert from '../../components/common/UI/Alert/Alert';
import './CategoryPage.css';

const CategoryPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });

  // Filter states
  const [filters, setFilters] = useState({
    featured: searchParams.get('featured') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by: searchParams.get('sort_by') || '-created_at',
    page: parseInt(searchParams.get('page')) || 1,
  });

  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 1000000,
  });

  // Load category data
  useEffect(() => {
    loadCategory();
  }, [slug]);

  // Load products when filters change
  useEffect(() => {
    if (category) {
      loadCategoryProducts();
    }
  }, [category, filters]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        params.set(key, filters[key]);
      }
    });

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [filters, setSearchParams]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await categoriesAPI.getCategory(slug);
      setCategory(response);
      setSubcategories(response.subcategories || []);

      // Calculate price range from category products
      await calculatePriceRange(response.id);
    } catch (err) {
      console.error('Error loading category:', err);
      setError(err.message || 'Failed to load category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryProducts = async () => {
    try {
      setProductsLoading(true);

      const params = {
        category: category.id,
        page: filters.page,
        page_size: 12,
        ordering: filters.sort_by,
      };

      // Add optional filters
      if (filters.featured) {
        params.featured = filters.featured === 'true';
      }
      if (filters.min_price) {
        params.min_price = filters.min_price;
      }
      if (filters.max_price) {
        params.max_price = filters.max_price;
      }

      const response = await productsAPI.getProducts(params);

      setProducts(response.results || []);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        currentPage: filters.page,
        totalPages: Math.ceil(response.count / 12),
      });
    } catch (err) {
      console.error('Error loading category products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setProductsLoading(false);
    }
  };

  const calculatePriceRange = async categoryId => {
    try {
      const response = await productsAPI.getProducts({
        category: categoryId,
        page_size: 1000, // Get all products for price calculation
        fields: 'price',
      });

      const prices = response.results.map(p => parseFloat(p.price));
      if (prices.length > 0) {
        setPriceRange({
          min: Math.min(...prices),
          max: Math.max(...prices),
        });
      }
    } catch (err) {
      console.error('Error calculating price range:', err);
    }
  };

  const handleFilterChange = newFilters => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSortChange = sortBy => {
    setFilters(prevFilters => ({
      ...prevFilters,
      sort_by: sortBy,
      page: 1,
    }));
  };

  const handlePageChange = page => {
    setFilters(prevFilters => ({
      ...prevFilters,
      page,
    }));

    // Scroll to top on page change
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleSubcategoryClick = subcategorySlug => {
    navigate(`/categories/${subcategorySlug}`);
  };

  const resetFilters = () => {
    const resetFilters = {
      featured: '',
      min_price: '',
      max_price: '',
      sort_by: '-created_at',
      page: 1,
    };
    setFilters(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.featured) count++;
    if (filters.min_price) count++;
    if (filters.max_price) count++;
    if (filters.sort_by !== '-created_at') count++;
    return count;
  };

  if (loading) {
    return (
      <div className="category-page">
        <div className="category-page__loading">
          <LoadingSpinner size="large" />
          <p>Loading category...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="category-page">
        <div className="category-page__error">
          <Alert type="error" title="Error">
            {error}
          </Alert>
          <button className="btn btn--primary" onClick={loadCategory}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="category-page">
        <div className="category-page__not-found">
          <Alert type="warning" title="Category Not Found">
            The category you're looking for doesn't exist or has been moved.
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <CategoryHeader
        category={category}
        subcategories={subcategories}
        productCount={pagination.count}
        onSubcategoryClick={handleSubcategoryClick}
      />

      <div className="category-page__content">
        <div className="container">
          <div className="category-page__filters">
            <div className="category-filters">
              <div className="category-filters__header">
                <h3 className="category-filters__title">
                  Filter Products
                  {getActiveFiltersCount() > 0 && (
                    <span className="category-filters__count">({getActiveFiltersCount()})</span>
                  )}
                </h3>
                {getActiveFiltersCount() > 0 && (
                  <button type="button" className="category-filters__reset" onClick={resetFilters}>
                    Clear All
                  </button>
                )}
              </div>

              <div className="category-filters__grid">
                {/* Featured Filter */}
                <div className="category-filter">
                  <label className="category-filter__label">Product Type</label>
                  <select
                    value={filters.featured}
                    onChange={e => handleFilterChange({ featured: e.target.value })}
                    className="category-filter__select"
                  >
                    <option value="">All Products</option>
                    <option value="true">Featured Only</option>
                    <option value="false">Regular Products</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="category-filter">
                  <label className="category-filter__label">Price Range (UGX)</label>
                  <div className="category-filter__price-range">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={filters.min_price}
                      onChange={e => handleFilterChange({ min_price: e.target.value })}
                      className="category-filter__input"
                      min="0"
                    />
                    <span className="category-filter__separator">-</span>
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={filters.max_price}
                      onChange={e => handleFilterChange({ max_price: e.target.value })}
                      className="category-filter__input"
                      min="0"
                    />
                  </div>
                  <div className="category-filter__price-info">
                    Range: UGX {priceRange.min.toLocaleString()} - UGX{' '}
                    {priceRange.max.toLocaleString()}
                  </div>
                </div>

                {/* Sort */}
                <div className="category-filter">
                  <label className="category-filter__label">Sort By</label>
                  <select
                    value={filters.sort_by}
                    onChange={e => handleSortChange(e.target.value)}
                    className="category-filter__select"
                  >
                    <option value="-created_at">Newest First</option>
                    <option value="created_at">Oldest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="-name">Name Z-A</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                    <option value="-rating_average">Highest Rated</option>
                    <option value="-view_count">Most Popular</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <CategoryProducts
            products={products}
            loading={productsLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            categoryName={category.name}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
