// src/pages/HomePage/HeroSection.js
import React, { useState, useEffect, useCallback } from 'react';
import './HomePage.css';

const HeroSection = ({ banners = [], content, onBannerClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const activeBanners = banners.filter(banner => banner.is_active);
  const hasMultipleBanners = activeBanners.length > 1;

  const nextSlide = useCallback(() => {
    if (hasMultipleBanners) {
      setCurrentSlide(prev => (prev + 1) % activeBanners.length);
    }
  }, [hasMultipleBanners, activeBanners.length]);

  const prevSlide = useCallback(() => {
    if (hasMultipleBanners) {
      setCurrentSlide(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1));
    }
  }, [hasMultipleBanners, activeBanners.length]);

  const goToSlide = useCallback(index => {
    setCurrentSlide(index);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!hasMultipleBanners || !isAutoPlaying) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [hasMultipleBanners, isAutoPlaying, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = event => {
      if (!hasMultipleBanners) return;

      if (event.key === 'ArrowLeft') {
        prevSlide();
      } else if (event.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultipleBanners, nextSlide, prevSlide]);

  // If no banners, show default hero with content
  if (activeBanners.length === 0) {
    return (
      <section className="hero-section default-hero">
        <div className="hero-background">
          <div className="hero-overlay" />
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">{content?.title || 'Welcome to ShopOnline Uganda'}</h1>
            {content?.subtitle && <p className="hero-subtitle">{content.subtitle}</p>}
            {content?.hero_text && <div className="hero-description">{content.hero_text}</div>}
            <div className="hero-actions">
              <button
                className="cta-button primary"
                onClick={() =>
                  window.scrollTo({
                    top: document.querySelector('.featured-products')?.offsetTop || 800,
                    behavior: 'smooth',
                  })
                }
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="hero-section carousel"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="hero-carousel">
        <div
          className="hero-slides"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            transition: 'transform 0.5s ease-in-out',
          }}
        >
          {activeBanners.map((banner, index) => (
            <div
              key={banner.id}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              onClick={() => onBannerClick?.(banner)}
              style={{ cursor: banner.link_url ? 'pointer' : 'default' }}
            >
              <div className="hero-image">
                <img
                  src={banner.image}
                  alt={banner.title}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                <div className="hero-overlay" />
              </div>
              <div className="container">
                <div className="hero-content">
                  <h1 className="hero-title">{banner.title}</h1>
                  {banner.description && <p className="hero-description">{banner.description}</p>}
                  {banner.link_text && (
                    <div className="hero-actions">
                      <span className="cta-button primary">{banner.link_text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {hasMultipleBanners && (
          <>
            <button
              className="hero-nav-btn prev"
              onClick={e => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous slide"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              className="hero-nav-btn next"
              onClick={e => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next slide"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* Slide indicators */}
        {hasMultipleBanners && (
          <div className="hero-indicators">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Features bar */}
      <div className="hero-features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">Quality Products</span>
                <span className="feature-desc">Verified & Authentic</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">Fast Delivery</span>
                <span className="feature-desc">Within Kampala</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">24/7 Support</span>
                <span className="feature-desc">We're here to help</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <path d="m1 10 22 0" />
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">Secure Payment</span>
                <span className="feature-desc">Mobile Money & COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
