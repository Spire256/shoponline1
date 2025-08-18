import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import Loading from '../../common/UI/Loading/Spinner';
import { productsAPI } from '../../../services/api/productsAPI';
import './RelatedProducts.css';

const RelatedProducts = ({ product, limit = 8 }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product?.id) {
      fetchRelatedProducts();
    }
  }, [product?.id, limit]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch related products based on category and similar attributes
      const response = await productsAPI.getRecommendations({
        product_id: product.id,
        limit: limit,
      });

      if (response.data && response.data.results) {
        setRelatedProducts(response.data.results);
      } else {
        // Fallback: fetch products from same category
        const categoryResponse = await productsAPI.getByCategory({
          category_id: product.category.id,
          limit: limit + 1, // Get one extra to exclude current product
        });

        const filtered =
          categoryResponse.data.results?.filter(p => p.id !== product.id).slice(0, limit) || [];

        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      setError('Failed to load related products');

      // Mock data fallback for development
      const mockRelated = [
        {
          id: 'mock-1',
          name: 'Similar Product 1',
          price: 25000,
          original_price: 30000,
          image_url: '/api/placeholder/250/250',
          category: product.category,
          is_featured: false,
          is_in_stock: true,
          rating_average: 4.2,
          review_count: 15,
        },
        {
          id: 'mock-2',
          name: 'Similar Product 2',
          price: 35000,
          image_url: '/api/placeholder/250/250',
          category: product.category,
          is_featured: true,
          is_in_stock: true,
          rating_average: 4.8,
          review_count: 32,
        },
        {
          id: 'mock-3',
          name: 'Similar Product 3',
          price: 15000,
          original_price: 18000,
          image_url: '/api/placeholder/250/250',
          category: product.category,
          is_featured: false,
          is_in_stock: false,
          rating_average: 4.0,
          review_count: 8,
        },
        {
          id: 'mock-4',
          name: 'Similar Product 4',
          price: 45000,
          image_url: '/api/placeholder/250/250',
          category: product.category,
          is_featured: false,
          is_in_stock: true,
          rating_average: 4.5,
          review_count: 23,
        },
      ];

      setRelatedProducts(mockRelated);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, relatedProducts.length - getVisibleCount());
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const getVisibleCount = () => {
    // Responsive visible count
    if (window.innerWidth >= 1200) return 4;
    if (window.innerWidth >= 768) return 3;
    if (window.innerWidth >= 480) return 2;
    return 1;
  };

  const handleViewAllCategory = () => {
    window.location.href = `/categories/${product.category.slug}`;
  };

  if (loading) {
    return (
      <div className="related-products">
        <div className="related-products-header">
          <h3 className="section-title">Related Products</h3>
        </div>
        <div className="loading-container">
          <Loading />
        </div>
      </div>
    );
  }

  if (error || relatedProducts.length === 0) {
    return (
      <div className="related-products">
        <div className="related-products-header">
          <h3 className="section-title">Related Products</h3>
        </div>
        <div className="no-related-products">
          <p>No related products found.</p>
          <button className="view-category-btn" onClick={handleViewAllCategory}>
            View All {product.category.name}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const visibleCount = getVisibleCount();
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < relatedProducts.length - visibleCount;
  const visibleProducts = relatedProducts.slice(currentIndex, currentIndex + visibleCount);

  return (
    <div className="related-products">
      <div className="related-products-header">
        <h3 className="section-title">Related Products</h3>

        <div className="header-actions">
          <button className="view-all-btn" onClick={handleViewAllCategory}>
            View All in {product.category.name}
            <ArrowRight size={16} />
          </button>

          {relatedProducts.length > visibleCount && (
            <div className="carousel-controls">
              <button
                className={`carousel-btn prev ${!canScrollLeft ? 'disabled' : ''}`}
                onClick={handlePrevious}
                disabled={!canScrollLeft}
                aria-label="Previous products"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                className={`carousel-btn next ${!canScrollRight ? 'disabled' : ''}`}
                onClick={handleNext}
                disabled={!canScrollRight}
                aria-label="Next products"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="related-products-container">
        <div className="products-carousel">
          <div
            className="products-track"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              width: `${(relatedProducts.length / visibleCount) * 100}%`,
            }}
          >
            {relatedProducts.map(relatedProduct => (
              <div
                key={relatedProduct.id}
                className="product-slide"
                style={{ width: `${100 / relatedProducts.length}%` }}
              >
                <ProductCard
                  product={relatedProduct}
                  showQuickActions={true}
                  showCompare={false}
                  className="related-product-card"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile scroll indicators */}
        {relatedProducts.length > visibleCount && (
          <div className="scroll-indicators mobile-only">
            {Array.from({ length: Math.ceil(relatedProducts.length / visibleCount) }).map(
              (_, index) => (
                <button
                  key={index}
                  className={`indicator ${
                    index === Math.floor(currentIndex / visibleCount) ? 'active' : ''
                  }`}
                  onClick={() => setCurrentIndex(index * visibleCount)}
                  aria-label={`Go to page ${index + 1}`}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Alternative Categories */}
      {product.category.parent && (
        <div className="alternative-suggestions">
          <p className="suggestion-text">
            You might also like products from{' '}
            <button
              className="category-link"
              onClick={() => (window.location.href = `/categories/${product.category.parent.slug}`)}
            >
              {product.category.parent.name}
            </button>
          </p>
        </div>
      )}

      {/* Recently Viewed Products */}
      <div className="recently-viewed-hint">
        <p>
          Based on your browsing history and products similar to <strong>{product.name}</strong>
        </p>
      </div>
    </div>
  );
};

export default RelatedProducts;
