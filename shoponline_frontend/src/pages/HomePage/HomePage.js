// src/pages/HomePage/HomePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './HeroSection';
import FeaturedProducts from './FeaturedProducts';
import CategoryShowcase from './CategoryShowcase';
import FlashSalesHomepage from './FlashSalesHomepage';
import Testimonials from './Testimonials';
import './HomePage.css';

// API imports - using default exports
import homepageAPI from '../../services/api/homepageAPI';
import adminAPI from '../../services/api/adminAPI';
import categoriesAPI from '../../services/api/categoriesAPI';
import flashSalesAPI from '../../services/api/flashSalesAPI';

const HomePage = () => {
  const navigate = useNavigate();
  const [pageData, setPageData] = useState({
    content: null,
    banners: [],
    featuredProducts: [],
    categories: [],
    flashSales: [],
    settings: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadHomepageData();
  }, []);

  const loadHomepageData = async () => {
    try {
      setPageData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all homepage data in parallel
      const [
        contentResponse,
        bannersResponse,
        featuredResponse,
        categoriesResponse,
        flashSalesResponse,
        settingsResponse,
      ] = await Promise.allSettled([
        homepageAPI.getHomepageData(),
        homepageAPI.getActiveBanners(),
        homepageAPI.getFeaturedProducts(),
        categoriesAPI.getFeaturedCategories(6),
        flashSalesAPI.getActiveFlashSales(),
        adminAPI.siteSettings.getSettings(),
      ]);

      const data = {
        content: contentResponse.status === 'fulfilled' ? contentResponse.value.data : null,
        banners: bannersResponse.status === 'fulfilled' ? bannersResponse.value.data : [],
        featuredProducts:
          featuredResponse.status === 'fulfilled' ? featuredResponse.value.data : [],
        categories: categoriesResponse.status === 'fulfilled' ? categoriesResponse.value.data : [],
        flashSales: flashSalesResponse.status === 'fulfilled' ? flashSalesResponse.value.data : [],
        settings: settingsResponse.status === 'fulfilled' ? settingsResponse.value.data : null,
        loading: false,
        error: null,
      };

      setPageData(data);
    } catch (error) {
      console.error('Error loading homepage data:', error);
      setPageData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load homepage content. Please try again later.',
      }));
    }
  };

  const handleRetry = () => {
    loadHomepageData();
  };

  if (pageData.loading) {
    return (
      <div className="homepage-loading">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  if (pageData.error) {
    return (
      <div className="homepage-error">
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{pageData.error}</p>
          <button className="retry-button" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if site is in maintenance mode
  if (pageData.settings?.maintenance_mode) {
    return (
      <div className="homepage-maintenance">
        <div className="maintenance-container">
          <h1>We'll be right back!</h1>
          <p>
            {pageData.settings.maintenance_message ||
              'We are currently performing maintenance. Please check back soon.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section with banners */}
      <HeroSection
        banners={pageData.banners.filter(banner => banner.banner_type === 'hero')}
        content={pageData.content}
        onBannerClick={banner => {
          if (banner.link_url) {
            if (banner.link_url.startsWith('/')) {
              navigate(banner.link_url);
            } else {
              window.open(banner.link_url, '_blank', 'noopener,noreferrer');
            }
          }
        }}
      />

      {/* Flash Sales Section - Show if flash sales are enabled and available */}
      {pageData.settings?.enable_flash_sales && pageData.flashSales.length > 0 && (
        <FlashSalesHomepage
          flashSales={pageData.flashSales}
          onViewAll={() => navigate('/flash-sales')}
          onProductClick={product => navigate(`/products/${product.slug}`)}
        />
      )}

      {/* Featured Products Section */}
      {pageData.featuredProducts.length > 0 && (
        <FeaturedProducts
          products={pageData.featuredProducts}
          onProductClick={product => navigate(`/products/${product.product_details.slug}`)}
          onViewAll={() => navigate('/products?featured=true')}
        />
      )}

      {/* Category Showcase */}
      {pageData.categories.length > 0 && (
        <CategoryShowcase
          categories={pageData.categories}
          onCategoryClick={category => navigate(`/categories/${category.slug}`)}
          onViewAll={() => navigate('/categories')}
        />
      )}

      {/* Promotional Banners */}
      {pageData.banners.filter(banner => banner.banner_type === 'promo').length > 0 && (
        <section className="promo-banners-section">
          <div className="container">
            <div className="promo-banners-grid">
              {pageData.banners
                .filter(banner => banner.banner_type === 'promo')
                .slice(0, 3)
                .map(banner => (
                  <button
                    key={banner.id}
                    className="promo-banner-card"
                    onClick={() => {
                      if (banner.link_url) {
                        if (banner.link_url.startsWith('/')) {
                          navigate(banner.link_url);
                        } else {
                          window.open(banner.link_url, '_blank', 'noopener,noreferrer');
                        }
                      }
                    }}
                    aria-label={`${banner.title} - ${banner.description || 'Click to learn more'}`}
                  >
                    <img src={banner.image} alt={banner.title} loading="lazy" />
                    <div className="promo-banner-content">
                      <h3>{banner.title}</h3>
                      {banner.description && <p>{banner.description}</p>}
                      {banner.link_text && <span className="promo-cta">{banner.link_text}</span>}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <Testimonials />

      {/* Newsletter/Contact Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h2>Stay Updated</h2>
              <p>Get notified about new products and flash sales!</p>
            </div>
            <div className="newsletter-form">
              <div className="contact-info">
                {pageData.settings?.contact_phone && (
                  <div className="contact-item">
                    <span className="contact-label">Call us:</span>
                    <a href={`tel:${pageData.settings.contact_phone}`}>
                      {pageData.settings.contact_phone}
                    </a>
                  </div>
                )}
                {pageData.settings?.social_whatsapp && (
                  <div className="contact-item">
                    <span className="contact-label">WhatsApp:</span>
                    <a
                      href={`https://wa.me/${pageData.settings.social_whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pageData.settings.social_whatsapp}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
