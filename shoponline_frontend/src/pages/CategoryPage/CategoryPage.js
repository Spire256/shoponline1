// src/pages/CategoryPage/CategoryPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import CategoryHeader from './CategoryHeader';
import CategoryProducts from './CategoryProducts';
import productsAPI from '../../services/api/productsAPI';
import LoadingSpinner from '../../components/common/UI/Loading/Spinner';
import Alert from '../../components/common/UI/Alert/Alert';
import './CategoryPage.css';

const CategoryPage = () => {
  const { slug } = useParams();
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

  // Filter states matching backend API
  const [filters, setFilters] = useState({
    is_featured: searchParams.get('featured') || '',
    price_min: searchParams.get('min_price') || '',
    price_max: searchParams.get('max_price') || '',
    brand: searchParams.get('brand') || '',
    color: searchParams.get('color') || '',
    size: searchParams.get('size') || '',
    in_stock: searchParams.get('in_stock') || '',
    on_sale: searchParams.get('on_sale') || '',
    ordering: searchParams.get('ordering') || '-created_at',
    page: parseInt(searchParams.get('page')) || 1,
  });

  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 1000000,
  });

  // Load category data
  useEffect(() => {
    if (slug) {
      loadCategory();
    }
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
        params.set(key === 'is_featured' ? 'featured' : key === 'price_min' ? 'min_price' : key === 'price_max' ? 'max_price' : key, filters[key]);
      }
    });

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, setSearchParams, searchParams]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use products API to get category info by filtering products
      const response = await productsAPI.getProductsByCategory(slug, {
        page: 1,
        page_size: 1,
      });
      
      // Mock category data since we don't have a direct category endpoint
      const mockCategory = {
        id: slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '),
        slug: slug,
        description: `Explore our ${slug.replace('-', ' ')} collection`,
        image_url: '/assets/images/placeholders/category-placeholder.jpg',
        is_active: true,
        product_count: response.count || 0,
      };

      setCategory(mockCategory);
      
      // Calculate price range from products
      if (response.results && response.results.length > 0) {
        await calculatePriceRange();
      }
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

      // Build parameters matching the backend API
      const params = {
        page: filters.page,
        page_size: 12,
        ordering: filters.ordering,
        category: category.slug,
      };

      // Add optional filters matching backend API field names
      if (filters.is_featured && filters.is_featured !== '') {
        params.is_featured = filters.is_featured === 'true';
      }
      if (filters.price_min) {
        params.price_min = filters.price_min;
      }
      if (filters.price_max) {
        params.price_max = filters.price_max;
      }
      if (filters.brand) {
        params.brand = filters.brand;
      }
      if (filters.color) {
        params.color = filters.color;
      }
      if (filters.size) {
        params.size = filters.size;
      }
      if (filters.in_stock && filters.in_stock !== '') {
        params.in_stock = filters.in_stock === 'true';
      }
      if (filters.on_sale && filters.on_sale !== '') {
        params.on_sale = filters.on_sale === 'true';
      }

      const response = await productsAPI.getProducts(params);

      setProducts(response.results || []);
      setPagination({
        count: response.count || 0,
        next: response.next,
        previous: response.previous,
        currentPage: filters.page,
        totalPages: Math.ceil((response.count || 0) / 12),
      });
    } catch (err) {
      console.error('Error loading category products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setProductsLoading(false);
    }
  };

  const calculatePriceRange = async () => {
    try {
      // Get a larger sample to calculate price range
      const response = await productsAPI.getProducts({
        category: category.slug,
        page_size: 100,
      });

      const prices = response.results
        .map(p => parseFloat(p.price))
        .filter(price => !isNaN(price));
        
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

  const handleSortChange = ordering => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ordering,
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
      is_featured: '',
      price_min: '',
      price_max: '',
      brand: '',
      color: '',
      size: '',
      in_stock: '',
      on_sale: '',
      ordering: '-created_at',
      page: 1,
    };
    setFilters(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.is_featured && filters.is_featured !== '') count++;
    if (filters.price_min) count++;
    if (filters.price_max) count++;
    if (filters.brand) count++;
    if (filters.color) count++;
    if (filters.size) count++;
    if (filters.in_stock && filters.in_stock !== '') count++;
    if (filters.on_sale && filters.on_sale !== '') count++;
    if (filters.ordering !== '-created_at') count++;
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
                    value={filters.is_featured}
                    onChange={e => handleFilterChange({ is_featured: e.target.value })}
                    className="category-filter__select"
                  >
                    <option value="">All Products</option>
                    <option value="true">Featured Only</option>
                    <option value="false">Regular Products</option>
                  </select>
                </div>

                {/* Stock Filter */}
                <div className="category-filter">
                  <label className="category-filter__label">Availability</label>
                  <select
                    value={filters.in_stock}
                    onChange={e => handleFilterChange({ in_stock: e.target.value })}
                    className="category-filter__select"
                  >
                    <option value="">All Products</option>
                    <option value="true">In Stock Only</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>

                {/* Sale Filter */}
                <div className="category-filter">
                  <label className="category-filter__label">Sale Status</label>
                  <select
                    value={filters.on_sale}
                    onChange={e => handleFilterChange({ on_sale: e.target.value })}
                    className="category-filter__select"
                  >
                    <option value="">All Products</option>
                    <option value="true">On Sale</option>
                    <option value="false">Regular Price</option>
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="category-filter">
                  <label className="category-filter__label">Brand</label>
                  <input
                    type="text"
                    placeholder="Enter brand name"
                    value={filters.brand}
                    onChange={e => handleFilterChange({ brand: e.target.value })}
                    className="category-filter__input"
                  />
                </div>

                {/* Color Filter */}
                <div className="category-filter">
                  <label className="category-filter__label">Color</label>
                  <input
                    type="text"
                    placeholder="Enter color"
                    value={filters.color}
                    onChange={e => handleFilterChange({ color: e.target.value })}
                    className="category-filter__input"
                  />
                </div>

                {/* Size Filter */}
                <div className="category-filter">
                  <label className="category-filter__label">Size</label>
                  <input
                    type="text"
                    placeholder="Enter size"
                    value={filters.size}
                    onChange={e => handleFilterChange({ size: e.target.value })}
                    className="category-filter__input"
                  />
                </div>

                {/* Price Range */}
                <div className="category-filter category-filter--price">
                  <label className="category-filter__label">Price Range (UGX)</label>
                  <div className="category-filter__price-range">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={filters.price_min}
                      onChange={e => handleFilterChange({ price_min: e.target.value })}
                      className="category-filter__input"
                      min="0"
                    />
                    <span className="category-filter__separator">-</span>
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={filters.price_max}
                      onChange={e => handleFilterChange({ price_max: e.target.value })}
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
                    value={filters.ordering}
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
                    <option value="-order_count">Best Selling</option>
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
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;