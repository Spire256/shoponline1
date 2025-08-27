import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Star, 
  Clock, 
  ArrowRight, 
  Zap, 
  TrendingUp,
  Shield,
  Truck,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  ShoppingCart,
  Award,
  CheckCircle,
  Package,
  ThumbsUp,
  Verified,
  Quote,
  MapPin,
  Timer,
  Gift,
  Percent
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  
  const [pageData, setPageData] = useState({
    content: null,
    banners: [],
    featuredProducts: [],
    categories: [],
    flashSales: [],
    testimonials: [],
    settings: null,
    loading: true,
    error: null,
  });
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  // Mock data that would normally come from admin-controlled API
  const mockData = {
    banners: [
      {
        id: 1,
        title: 'Welcome to ShopOnline Uganda',
        subtitle: 'Your Premier Online Shopping Destination',
        description: 'Discover amazing products with fast delivery across Uganda. Shop electronics, fashion, home essentials and more!',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop',
        banner_type: 'hero',
        link_url: '/products',
        button_text: 'Start Shopping',
        is_active: true
      },
      {
        id: 2,
        title: 'Flash Sale Alert!',
        subtitle: 'Up to 70% Off Selected Items',
        description: 'Limited time offers on electronics, fashion & more. Don\'t miss out!',
        image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=600&fit=crop',
        banner_type: 'hero',
        link_url: '/flash-sales',
        button_text: 'View Flash Sales',
        is_active: true
      }
    ],
    featuredProducts: [
      {
        id: 1,
        name: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-galaxy-s24-ultra',
        description: 'Latest flagship smartphone with AI features and superior camera',
        price: 3500000,
        original_price: 4000000,
        image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop',
        category: 'Electronics',
        rating: 4.8,
        reviews_count: 124,
        in_stock: true,
        badge: 'Featured',
        is_featured: true
      },
      {
        id: 2,
        name: 'MacBook Air M3',
        slug: 'macbook-air-m3',
        description: 'Powerful laptop for work and creativity with all-day battery',
        price: 5200000,
        original_price: 5500000,
        image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop',
        category: 'Computers',
        rating: 4.9,
        reviews_count: 89,
        in_stock: true,
        badge: 'Best Seller',
        is_featured: true
      },
      {
        id: 3,
        name: 'Nike Air Force 1',
        slug: 'nike-air-force-1',
        description: 'Classic sneakers for everyday wear and style',
        price: 280000,
        original_price: 320000,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
        category: 'Fashion',
        rating: 4.7,
        reviews_count: 203,
        in_stock: true,
        badge: 'Trending',
        is_featured: true
      }
    ],
    categories: [
      {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
        product_count: 245,
        description: 'Latest gadgets, smartphones, and tech accessories',
        is_featured: true
      },
      {
        id: 2,
        name: 'Fashion & Style',
        slug: 'fashion',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
        product_count: 186,
        description: 'Trending clothes, shoes, and accessories',
        is_featured: true
      },
      {
        id: 3,
        name: 'Home & Garden',
        slug: 'home-garden',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        product_count: 127,
        description: 'Everything for your home and outdoor spaces',
        is_featured: true
      },
      {
        id: 4,
        name: 'Sports & Fitness',
        slug: 'sports-fitness',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        product_count: 98,
        description: 'Equipment and gear for active lifestyle',
        is_featured: true
      }
    ],
    flashSales: [
      {
        id: 1,
        title: 'Weekend Flash Sale',
        discount_percentage: 50,
        end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        products: [
          {
            id: 1,
            name: 'iPhone 15 Pro',
            slug: 'iphone-15-pro',
            original_price: 4500000,
            flash_price: 3600000,
            image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&h=300&fit=crop',
            stock_remaining: 12,
            total_stock: 25,
            discount: 20
          },
          {
            id: 2,
            name: 'Samsung 4K Smart TV',
            slug: 'samsung-4k-smart-tv',
            original_price: 2800000,
            flash_price: 1980000,
            image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop',
            stock_remaining: 8,
            total_stock: 15,
            discount: 29
          }
        ]
      }
    ],
    testimonials: [
      {
        id: 1,
        name: 'Sarah Nakato',
        location: 'Kampala, Uganda',
        rating: 5,
        comment: 'Amazing shopping experience! Fast delivery and excellent customer service. I got my iPhone the next day!',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        verified: true,
        purchase: 'iPhone 15 Pro',
        is_featured: true
      },
      {
        id: 2,
        name: 'James Mukasa',
        location: 'Entebbe, Uganda',
        rating: 5,
        comment: 'Best prices in Uganda! I saved over 500,000 UGX on my laptop purchase. Highly recommended!',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        verified: true,
        purchase: 'MacBook Air M3',
        is_featured: true
      },
      {
        id: 3,
        name: 'Grace Namuli',
        location: 'Jinja, Uganda',
        rating: 5,
        comment: 'Love the flash sales! Got designer shoes at 60% off. The quality is exactly as described.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
        verified: true,
        purchase: 'Nike Air Force 1',
        is_featured: true
      }
    ],
    settings: {
      site_name: 'ShopOnline Uganda',
      contact_phone: '+256700123456',
      social_whatsapp: '256700123456',
      enable_flash_sales: true,
      free_delivery_threshold: 100000,
      maintenance_mode: false
    }
  };

  // Load page data (simulating admin-controlled content)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageData({
        ...mockData,
        loading: false,
        error: null
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-advance hero carousel
  useEffect(() => {
    if (pageData.banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % pageData.banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [pageData.banners.length]);

  // Auto-advance testimonial carousel
  useEffect(() => {
    if (pageData.testimonials.length > 0) {
      const timer = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % pageData.testimonials.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [pageData.testimonials.length]);

  // Countdown timer for flash sales
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateDiscount = (original, current) => {
    return Math.round(((original - current) / original) * 100);
  };

  // Navigation handlers using React Router paths from the architecture
  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleProductClick = (product) => {
    navigate(`/products/${product.slug}`);
  };

  const handleCategoryClick = (category) => {
    navigate(`/categories/${category.slug}`);
  };

  const handleFlashSaleProductClick = (product) => {
    navigate(`/products/${product.slug}`);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    // Add to cart logic will be handled by CartContext
    console.log('Add to cart:', product);
  };

  const handleAddToWishlist = (e, product) => {
    e.stopPropagation();
    // Add to wishlist logic
    console.log('Add to wishlist:', product);
  };

  const handleQuickView = (e, product) => {
    e.stopPropagation();
    // Quick view modal logic
    console.log('Quick view:', product);
  };

  const handleContactPhone = () => {
    if (pageData.settings?.contact_phone) {
      window.open(`tel:${pageData.settings.contact_phone}`);
    }
  };

  const handleWhatsAppChat = () => {
    if (pageData.settings?.social_whatsapp) {
      window.open(`https://wa.me/${pageData.settings.social_whatsapp}`, '_blank');
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % pageData.banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + pageData.banners.length) % pageData.banners.length);
  };

  if (pageData.loading) {
    return (
      <div className="homepage-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading ShopOnline Uganda...</h3>
          <p>Preparing amazing deals for you</p>
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
          <button className="retry-button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-carousel">
            <div className="hero-slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {pageData.banners.map((banner, index) => (
                <div key={banner.id} className="hero-slide">
                  <div className="hero-image">
                    <img src={banner.image} alt={banner.title} />
                    <div className="hero-overlay" />
                  </div>
                  <div className="container">
                    <div className="hero-content">
                      <h1 className="hero-title">{banner.title}</h1>
                      <p className="hero-subtitle">{banner.subtitle}</p>
                      <p className="hero-description">{banner.description}</p>
                      <div className="hero-actions">
                        <button 
                          className="cta-button primary large"
                          onClick={() => handleNavigation(banner.link_url)}
                        >
                          <ShoppingBag className="icon" />
                          {banner.button_text}
                        </button>
                        <button 
                          className="cta-button secondary large"
                          onClick={() => handleNavigation('/flash-sales')}
                        >
                          <Zap className="icon" />
                          View Flash Sales
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation */}
            {pageData.banners.length > 1 && (
              <>
                <button className="hero-nav-btn prev" onClick={prevSlide}>
                  <ChevronLeft />
                </button>
                <button className="hero-nav-btn next" onClick={nextSlide}>
                  <ChevronRight />
                </button>
                
                <div className="hero-indicators">
                  {pageData.banners.map((_, index) => (
                    <button 
                      key={index} 
                      className={`indicator ${index === currentSlide ? 'active' : ''}`}
                      onClick={() => goToSlide(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Hero Features */}
          <div className="hero-features">
            <div className="container">
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">
                    <Truck />
                  </div>
                  <div className="feature-text">
                    <h4 className="feature-title">Fast Delivery</h4>
                    <p className="feature-desc">Same day delivery in Kampala</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <Shield />
                  </div>
                  <div className="feature-text">
                    <h4 className="feature-title">Secure Payments</h4>
                    <p className="feature-desc">Mobile Money & Cash on Delivery</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <Award />
                  </div>
                  <div className="feature-text">
                    <h4 className="feature-title">Quality Guaranteed</h4>
                    <p className="feature-desc">100% authentic products</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <Phone />
                  </div>
                  <div className="feature-text">
                    <h4 className="feature-title">24/7 Support</h4>
                    <p className="feature-desc">Always here to help</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Flash Sales Section */}
        {pageData.settings?.enable_flash_sales && pageData.flashSales?.length > 0 && (
          <section className="flash-sales-homepage">
            <div className="container">
              <div className="flash-sales-header">
                <div className="header-content">
                  <div className="header-badge">
                    <Zap className="icon" />
                    Flash Sale
                  </div>
                  <h2 className="section-title">
                    Limited Time <span className="discount-highlight">Offers</span>
                  </h2>
                  <p className="section-subtitle">Grab these deals before they're gone!</p>
                </div>
                <div className="header-actions">
                  <div className="timer-container">
                    <div className="timer-label">Sale Ends In:</div>
                    <div className="countdown-timer">
                      <div className="timer-segment">
                        <span className="timer-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span className="timer-label-small">Hours</span>
                      </div>
                      <span className="timer-separator">:</span>
                      <div className="timer-segment">
                        <span className="timer-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span className="timer-label-small">Minutes</span>
                      </div>
                      <span className="timer-separator">:</span>
                      <div className="timer-segment">
                        <span className="timer-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <span className="timer-label-small">Seconds</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="view-all-btn flash"
                    onClick={() => handleNavigation('/flash-sales')}
                  >
                    View All Flash Sales
                    <ArrowRight className="icon" />
                  </button>
                </div>
              </div>

              <div className="flash-products-grid">
                {pageData.flashSales[0]?.products.map(product => (
                  <div 
                    key={product.id} 
                    className="flash-product-card"
                    onClick={() => handleFlashSaleProductClick(product)}
                  >
                    <div className="product-image-container">
                      <img src={product.image} alt={product.name} />
                      <div className="flash-badge">
                        -{product.discount}%
                      </div>
                      <div className="product-actions">
                        <button 
                          className="action-btn" 
                          title="Quick View"
                          onClick={(e) => handleQuickView(e, product)}
                        >
                          <Eye />
                        </button>
                        <button 
                          className="action-btn" 
                          title="Add to Wishlist"
                          onClick={(e) => handleAddToWishlist(e, product)}
                        >
                          <Heart />
                        </button>
                        <button 
                          className="action-btn" 
                          title="Add to Cart"
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          <ShoppingCart />
                        </button>
                      </div>
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-pricing">
                        <span className="flash-price">{formatPrice(product.flash_price)}</span>
                        <span className="original-price">{formatPrice(product.original_price)}</span>
                      </div>
                      <div className="stock-progress">
                        <div className="stock-info">
                          <span>Sold: {product.total_stock - product.stock_remaining}</span>
                          <span>Available: {product.stock_remaining}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${((product.total_stock - product.stock_remaining) / product.total_stock) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        <section className="featured-products">
          <div className="container">
            <div className="section-header">
              <div className="section-title-group">
                <h2 className="section-title">Featured Products</h2>
                <p className="section-subtitle">Hand-picked items just for you</p>
              </div>
              <div className="section-actions">
                <button 
                  className="view-all-btn"
                  onClick={() => handleNavigation('/products?featured=true')}
                >
                  View All
                  <ArrowRight className="icon" />
                </button>
              </div>
            </div>

            <div className="products-grid">
              {pageData.featuredProducts.map(product => (
                <div 
                  key={product.slug} 
                  className="product-card"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="product-image-container">
                    <img src={product.image} alt={product.name} />
                    <div className="product-badges">
                      <div className="badge featured">{product.badge}</div>
                      {product.original_price > product.price && (
                        <div className="badge sale">
                          -{calculateDiscount(product.original_price, product.price)}%
                        </div>
                      )}
                    </div>
                    <div className="product-overlay">
                      <div className="product-actions">
                        <button 
                          className="action-btn" 
                          title="Quick View"
                          onClick={(e) => handleQuickView(e, product)}
                        >
                          <Eye />
                        </button>
                        <button 
                          className="action-btn" 
                          title="Add to Wishlist"
                          onClick={(e) => handleAddToWishlist(e, product)}
                        >
                          <Heart />
                        </button>
                        <button 
                          className="action-btn" 
                          title="Add to Cart"
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          <ShoppingCart />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="product-info">
                    <div className="product-category">{product.category}</div>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`star ${i < Math.floor(product.rating) ? 'filled' : ''}`} 
                          />
                        ))}
                      </div>
                      <span className="rating-count">({product.reviews_count})</span>
                    </div>
                    <div className="product-pricing">
                      <span className="current-price">{formatPrice(product.price)}</span>
                      {product.original_price > product.price && (
                        <span className="original-price">{formatPrice(product.original_price)}</span>
                      )}
                    </div>
                    <div className="product-footer">
                      <div className={`stock-status ${product.in_stock ? 'in-stock' : 'out-of-stock'}`}>
                        <CheckCircle className="icon" />
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="category-showcase">
          <div className="container">
            <div className="section-header">
              <div className="section-title-group">
                <h2 className="section-title">Shop by Category</h2>
                <p className="section-subtitle">Find what you're looking for</p>
              </div>
              <div className="section-actions">
                <button 
                  className="view-all-btn"
                  onClick={() => handleNavigation('/categories')}
                >
                  View All
                  <ArrowRight className="icon" />
                </button>
              </div>
            </div>

            <div className="categories-grid">
              {pageData.categories.map(category => (
                <div 
                  key={category.slug}
                  className="category-card"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="category-image-container">
                    <img src={category.image} alt={category.name} />
                    <div className="category-overlay">
                      <div className="overlay-gradient" />
                    </div>
                  </div>
                  <div className="category-content">
                    <h3 className="category-name">{category.name}</h3>
                    <p className="category-description">{category.description}</p>
                    <div className="category-stats">
                      <span className="product-count">{category.product_count} products</span>
                    </div>
                    <div className="category-cta">
                      <span>Shop Now</span>
                      <ArrowRight className="icon" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <div className="container">
            <div className="section-header">
              <div className="section-title-group">
                <h2 className="section-title">What Our Customers Say</h2>
                <p className="section-subtitle">Real reviews from real customers across Uganda</p>
              </div>
            </div>

            <div className="testimonials-container">
              <div className="testimonials-carousel">
                <div className="testimonials-track" style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}>
                  {pageData.testimonials.map((testimonial, index) => (
                    <div 
                      key={testimonial.id} 
                      className={`testimonial-card ${index === currentTestimonial ? 'active' : ''}`}
                    >
                      <div className="testimonial-content">
                        <div className="quote-icon">
                          <Quote />
                        </div>
                        <div className="testimonial-text">
                          <p>"{testimonial.comment}"</p>
                        </div>
                        <div className="testimonial-rating">
                          <div className="stars">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`star ${i < testimonial.rating ? 'filled' : ''}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="testimonial-author">
                        <div className="author-avatar">
                          <img src={testimonial.avatar} alt={testimonial.name} />
                          {testimonial.verified && (
                            <div className="verified-badge">
                              <CheckCircle />
                            </div>
                          )}
                        </div>
                        <div className="author-info">
                          <h4 className="author-name">{testimonial.name}</h4>
                          <p className="author-location">
                            <MapPin className="icon" />
                            {testimonial.location}
                          </p>
                          <span className="purchase-info">Purchased: {testimonial.purchase}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                {pageData.testimonials.length > 1 && (
                  <>
                    <button 
                      className="testimonial-nav prev"
                      onClick={() => setCurrentTestimonial(
                        (currentTestimonial - 1 + pageData.testimonials.length) % pageData.testimonials.length
                      )}
                    >
                      <ChevronLeft />
                    </button>
                    <button 
                      className="testimonial-nav next"
                      onClick={() => setCurrentTestimonial(
                        (currentTestimonial + 1) % pageData.testimonials.length
                      )}
                    >
                      <ChevronRight />
                    </button>
                  </>
                )}
              </div>

              <div className="testimonial-indicators">
                {pageData.testimonials.map((_, index) => (
                  <button 
                    key={index}
                    className={`indicator ${index === currentTestimonial ? 'active' : ''}`}
                    onClick={() => setCurrentTestimonial(index)}
                  />
                ))}
              </div>
            </div>

            {/* Customer Stats */}
            <div className="customer-stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">50K+</span>
                  <span className="stat-label">Happy Customers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">10K+</span>
                  <span className="stat-label">Products Available</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">99%</span>
                  <span className="stat-label">Delivery Success</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">4.8</span>
                  <span className="stat-label">Average Rating</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter/Contact Section */}
        <section className="newsletter-section">
          <div className="container">
            <div className="newsletter-content">
              <div className="newsletter-text">
                <h2>Stay Connected with ShopOnline Uganda</h2>
                <p>Get the latest updates on new products, flash sales, and exclusive offers!</p>
              </div>
              <div className="contact-info">
                {pageData.settings?.contact_phone && (
                  <div className="contact-item">
                    <div className="contact-label">Call Us</div>
                    <button 
                      onClick={handleContactPhone}
                      className="contact-value"
                    >
                      <Phone className="icon" />
                      {pageData.settings.contact_phone}
                    </button>
                  </div>
                )}
                {pageData.settings?.social_whatsapp && (
                  <div className="contact-item">
                    <div className="contact-label">WhatsApp</div>
                    <button
                      onClick={handleWhatsAppChat}
                      className="contact-value"
                    >
                      <MessageCircle className="icon" />
                      Chat with Us
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        /* CSS Variables for Blue Theme */
        :root {
          --primary-blue: #2563eb;
          --primary-blue-dark: #1e40af;
          --primary-blue-light: #3b82f6;
          --primary-blue-lighter: #60a5fa;
          --secondary-blue: #1e293b;
          --accent-blue: #0ea5e9;
          --light-blue: #e0f2fe;
          --very-light-blue: #f0f9ff;
          --white: #ffffff;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --gray-900: #0f172a;
          --success: #10b981;
          --warning: #f59e0b;
          --error: #ef4444;
          --info: #3b82f6;
          --gradient-primary: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%);
          --gradient-secondary: linear-gradient(135deg, var(--secondary-blue) 0%, var(--primary-blue-dark) 100%);
          --gradient-hero: linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(59, 130, 246, 0.8) 100%);
          --shadow-sm: 0 1px 2px 0 rgba(37, 99, 235, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05);
          --shadow-xl: 0 20px 25px -5px rgba(37, 99, 235, 0.1), 0 10px 10px -5px rgba(37, 99, 235, 0.04);
          --radius-sm: 4px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-xl: 16px;
          --radius-full: 9999px;
          --transition-fast: 150ms ease-in-out;
          --transition-normal: 300ms ease-in-out;
          --transition-slow: 500ms ease-in-out;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.5;
          color: var(--gray-800);
          background: var(--gray-50);
        }

        /* Homepage optimized for layout structure */
        .homepage {
          background-color: var(--gray-50);
          width: 100%;
          min-height: 100vh;
        }

        .main-content {
          width: 100%;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .icon {
          width: 20px;
          height: 20px;
          stroke-width: 1.5;
          flex-shrink: 0;
        }

        /* Loading & Error States */
        .homepage-loading,
        .homepage-error {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--gradient-primary);
        }

        .loading-container,
        .error-container {
          text-align: center;
          color: var(--white);
          max-width: 400px;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top: 4px solid var(--white);
          border-radius: var(--radius-full);
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .retry-button {
          background: var(--white);
          color: var(--primary-blue);
          border: none;
          padding: 1rem 2rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
          margin-top: 1rem;
        }

        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        /* Hero Section - Full width */
        .hero-section {
          position: relative;
          min-height: 70vh;
          overflow: hidden;
          width: 100vw;
          margin-left: calc(-50vw + 50%);
        }

        .hero-carousel {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .hero-slides {
          display: flex;
          width: 100%;
          height: 100%;
          transition: transform var(--transition-slow);
        }

        .hero-slide {
          flex: 0 0 100%;
          position: relative;
          min-height: 70vh;
          display: flex;
          align-items: center;
        }

        .hero-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .hero-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--gradient-hero);
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          color: var(--white);
          max-width: 600px;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .hero-subtitle {
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 1rem;
          opacity: 0.9;
        }

        .hero-description {
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          opacity: 0.8;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 1rem;
        }

        .cta-button.primary {
          background: var(--white);
          color: var(--primary-blue);
        }

        .cta-button.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: var(--white);
          border: 2px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .cta-button.large {
          padding: 1.25rem 2.5rem;
          font-size: 1.125rem;
        }

        /* Hero Navigation */
        .hero-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--white);
          width: 50px;
          height: 50px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-normal);
          z-index: 10;
        }

        .hero-nav-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .hero-nav-btn.prev {
          left: 2rem;
        }

        .hero-nav-btn.next {
          right: 2rem;
        }

        .hero-indicators {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 10;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-full);
          border: 2px solid var(--white);
          background: transparent;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .indicator.active {
          background: var(--white);
        }

        /* Hero Features */
        .hero-features {
          background: var(--white);
          border-top: 1px solid var(--gray-200);
          padding: 2rem 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .feature-icon {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-lg);
          background: var(--light-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-icon svg {
          width: 24px;
          height: 24px;
          color: var(--primary-blue);
          stroke-width: 2;
        }

        .feature-text {
          display: flex;
          flex-direction: column;
        }

        .feature-title {
          font-weight: 600;
          color: var(--gray-800);
          margin-bottom: 0.25rem;
        }

        .feature-desc {
          font-size: 0.875rem;
          color: var(--gray-500);
        }

        /* All content sections - proper spacing */
        .flash-sales-homepage,
        .featured-products,
        .category-showcase,
        .testimonials-section {
          padding: 4rem 0;
          margin: 0;
          width: 100%;
        }

        .flash-sales-homepage {
          background: var(--white);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          margin: 2rem 0;
        }

        .category-showcase,
        .testimonials-section {
          background: var(--gray-50);
        }

        /* Newsletter section - full width */
        .newsletter-section {
          padding: 4rem 0;
          background: var(--gradient-primary);
          color: var(--white);
          width: 100vw;
          margin-left: calc(-50vw + 50%);
        }

        /* Section Headers */
        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 3rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-title-group {
          flex: 1;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--gray-800);
          margin-bottom: 0.5rem;
        }

        .section-subtitle {
          font-size: 1.125rem;
          color: var(--gray-600);
        }

        .section-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .view-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--gradient-primary);
          color: var(--white);
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .view-all-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        /* Flash Sales Section */
        .flash-sales-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 3rem;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .header-content {
          flex: 1;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--gradient-primary);
          color: var(--white);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .discount-highlight {
          color: var(--primary-blue);
          font-weight: 800;
        }

        .header-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1rem;
        }

        .timer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .timer-label {
          font-size: 0.875rem;
          color: var(--gray-600);
          font-weight: 600;
        }

        .countdown-timer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--gray-50);
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 2px solid var(--primary-blue);
        }

        .timer-segment {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 50px;
        }

        .timer-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-blue);
        }

        .timer-label-small {
          font-size: 0.75rem;
          color: var(--gray-600);
          font-weight: 500;
        }

        .timer-separator {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-blue);
          margin: 0 0.25rem;
        }

        .view-all-btn.flash {
          background: var(--gradient-primary);
          animation: flash-glow 2s ease-in-out infinite alternate;
        }

        @keyframes flash-glow {
          from { box-shadow: 0 0 5px var(--primary-blue); }
          to { box-shadow: 0 0 20px var(--primary-blue), 0 0 30px var(--primary-blue); }
        }

        /* Flash Sale Products */
        .flash-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .flash-product-card {
          background: var(--white);
          border: 2px solid var(--primary-blue);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition-normal);
          position: relative;
        }

        .flash-product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .flash-product-card .product-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .flash-product-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .flash-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: var(--error);
          color: var(--white);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-full);
          font-weight: 700;
          font-size: 0.875rem;
          animation: flash-pulse 1.5s ease-in-out infinite;
        }

        @keyframes flash-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .product-actions {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .flash-product-card:hover .product-actions,
        .product-card:hover .product-actions {
          opacity: 1;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          border: 2px solid var(--white);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          color: var(--primary-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .action-btn:hover {
          background: var(--primary-blue);
          color: var(--white);
          transform: scale(1.1);
        }

        .flash-product-card .product-info {
          padding: 1.5rem;
        }

        .flash-product-card .product-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--gray-800);
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .flash-product-card .product-pricing {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .flash-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-blue);
        }

        .original-price {
          font-size: 1rem;
          color: var(--gray-500);
          text-decoration: line-through;
        }

        .stock-progress {
          margin-top: 1rem;
        }

        .stock-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--gray-600);
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          height: 6px;
          background: var(--gray-200);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-full);
          transition: width var(--transition-normal);
        }

        /* Products Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .product-card {
          background: var(--white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .product-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .product-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .product-card:hover .product-image-container img {
          transform: scale(1.1);
        }

        .product-badges {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 5;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge.featured {
          background: var(--primary-blue);
          color: var(--white);
        }

        .badge.sale {
          background: var(--error);
          color: var(--white);
        }

        .product-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gradient-hero);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .product-card:hover .product-overlay {
          opacity: 1;
        }

        .product-info {
          padding: 1.5rem;
        }

        .product-category {
          font-size: 0.875rem;
          color: var(--primary-blue);
          font-weight: 600;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .product-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--gray-800);
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .product-description {
          font-size: 0.875rem;
          color: var(--gray-600);
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .stars {
          display: flex;
          gap: 0.125rem;
        }

        .star {
          width: 16px;
          height: 16px;
          color: var(--gray-300);
          transition: color var(--transition-fast);
        }

        .star.filled {
          color: var(--warning);
        }

        .rating-count {
          font-size: 0.875rem;
          color: var(--gray-500);
        }

        .product-pricing {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .current-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-blue);
        }

        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stock-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .stock-status.in-stock {
          color: var(--success);
        }

        .stock-status.out-of-stock {
          color: var(--error);
        }

        /* Categories Grid */
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .category-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition-normal);
          position: relative;
          height: 300px;
        }

        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .category-image-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .category-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .category-card:hover .category-image-container img {
          transform: scale(1.1);
        }

        .category-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: flex-end;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
        }

        .overlay-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gradient-hero);
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .category-card:hover .overlay-gradient {
          opacity: 0.8;
        }

        .category-content {
          position: relative;
          z-index: 2;
          color: var(--white);
          padding: 2rem;
          width: 100%;
          transform: translateY(20px);
          transition: transform var(--transition-normal);
        }

        .category-card:hover .category-content {
          transform: translateY(0);
        }

        .category-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .category-description {
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 1rem;
          opacity: 0.9;
        }

        .category-stats {
          margin-bottom: 1rem;
        }

        .product-count {
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .category-cta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .category-card:hover .category-cta {
          opacity: 1;
        }

        /* Testimonials Section */
        .testimonials-container {
          position: relative;
          margin-bottom: 3rem;
        }

        .testimonials-carousel {
          position: relative;
          height: 400px;
          overflow: hidden;
          border-radius: var(--radius-xl);
        }

        .testimonials-track {
          display: flex;
          height: 100%;
          transition: transform var(--transition-slow);
        }

        .testimonial-card {
          flex: 0 0 80%;
          margin: 0 10%;
          background: var(--white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          opacity: 0.6;
          transform: scale(0.9);
          transition: all var(--transition-normal);
        }

        .testimonial-card.active {
          opacity: 1;
          transform: scale(1);
        }

        .testimonial-content {
          text-align: center;
          margin-bottom: 2rem;
        }

        .quote-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 1.5rem;
          color: var(--primary-blue);
          opacity: 0.3;
        }

        .testimonial-text p {
          font-size: 1.125rem;
          line-height: 1.6;
          color: var(--gray-700);
          font-style: italic;
          margin-bottom: 1.5rem;
        }

        .testimonial-rating {
          margin-bottom: 1rem;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 3px solid var(--primary-blue);
        }

        .author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .verified-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 24px;
          height: 24px;
          background: var(--success);
          color: var(--white);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--white);
        }

        .verified-badge svg {
          width: 12px;
          height: 12px;
          stroke-width: 3;
        }

        .author-info {
          flex: 1;
        }

        .author-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--gray-800);
          margin-bottom: 0.25rem;
        }

        .author-location {
          font-size: 0.875rem;
          color: var(--gray-600);
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .author-location .icon {
          width: 14px;
          height: 14px;
        }

        .purchase-info {
          font-size: 0.75rem;
          color: var(--primary-blue);
          font-weight: 600;
          background: var(--light-blue);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          display: inline-block;
        }

        .testimonial-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          background: var(--white);
          border: 2px solid var(--primary-blue);
          border-radius: var(--radius-full);
          color: var(--primary-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-normal);
          z-index: 10;
        }

        .testimonial-nav:hover {
          background: var(--primary-blue);
          color: var(--white);
        }

        .testimonial-nav.prev {
          left: 2rem;
        }

        .testimonial-nav.next {
          right: 2rem;
        }

        .testimonial-indicators {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .customer-stats {
          background: var(--white);
          padding: 3rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          text-align: center;
        }

        .stat-item {
          padding: 1rem;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 800;
          color: var(--primary-blue);
          margin-bottom: 0.5rem;
          display: block;
        }

        .stat-label {
          font-size: 1rem;
          color: var(--gray-600);
          font-weight: 500;
        }

        /* Newsletter Section */
        .newsletter-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .newsletter-text h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .newsletter-text p {
          font-size: 1.125rem;
          opacity: 0.9;
        }

        .contact-info {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .contact-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .contact-label {
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .contact-value {
          color: var(--white);
          background: transparent;
          border: none;
          font-weight: 600;
          font-size: 1.125rem;
          cursor: pointer;
          transition: opacity var(--transition-normal);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .contact-value:hover {
          opacity: 0.8;
        }

        .contact-value .icon {
          width: 20px;
          height: 20px;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero-title {
            font-size: 3rem;
          }
          
          .section-title {
            font-size: 2rem;
          }
          
          .features-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .flash-products-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }

          .flash-sales-header {
            flex-direction: column;
            gap: 1.5rem;
          }

          .header-actions {
            align-items: flex-start;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            min-height: 50vh;
          }
          
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-nav-btn {
            width: 40px;
            height: 40px;
          }
          
          .hero-nav-btn.prev {
            left: 1rem;
          }
          
          .hero-nav-btn.next {
            right: 1rem;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .section-title {
            font-size: 1.75rem;
          }
          
          .products-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
          }
          
          .categories-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
          
          .flash-products-grid {
            grid-template-columns: 1fr;
          }
          
          .countdown-timer {
            gap: 0.25rem;
          }
          
          .timer-segment {
            min-width: 40px;
          }
          
          .timer-number {
            font-size: 1.25rem;
          }
          
          .testimonial-card {
            flex: 0 0 90%;
            margin: 0 5%;
            padding: 2rem;
          }
          
          .testimonial-nav {
            width: 40px;
            height: 40px;
          }
          
          .testimonial-nav.prev {
            left: 1rem;
          }
          
          .testimonial-nav.next {
            right: 1rem;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          
          .stat-number {
            font-size: 2rem;
          }
          
          .newsletter-content {
            flex-direction: column;
            text-align: center;
          }
          
          .contact-info {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 2rem;
          }
          
          .section-title {
            font-size: 1.5rem;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
          }

          .categories-grid {
            grid-template-columns: 1fr;
          }
          
          .countdown-timer {
            padding: 0.75rem;
          }

          .timer-number {
            font-size: 1rem;
          }
          
          .testimonial-card {
            padding: 1.5rem;
          }
          
          .testimonial-text p {
            font-size: 1rem;
          }
          
          .stat-number {
            font-size: 1.75rem;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .contact-info {
            flex-direction: column;
            gap: 1rem;
          }

          .flash-sales-header {
            text-align: center;
          }

          .timer-container {
            align-items: center;
          }

          .category-card {
            height: 250px;
          }

          .category-content {
            padding: 1.5rem;
          }

          .category-name {
            font-size: 1.25rem;
          }
        }

        /* Animation for better UX */
        .product-card,
        .category-card,
        .flash-product-card {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        .product-card:nth-child(1) { animation-delay: 0.1s; }
        .product-card:nth-child(2) { animation-delay: 0.2s; }
        .product-card:nth-child(3) { animation-delay: 0.3s; }
        .product-card:nth-child(4) { animation-delay: 0.4s; }

        .category-card:nth-child(1) { animation-delay: 0.1s; }
        .category-card:nth-child(2) { animation-delay: 0.2s; }
        .category-card:nth-child(3) { animation-delay: 0.3s; }
        .category-card:nth-child(4) { animation-delay: 0.4s; }

        .flash-product-card:nth-child(1) { animation-delay: 0.1s; }
        .flash-product-card:nth-child(2) { animation-delay: 0.2s; }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Focus states for accessibility */
        .cta-button:focus,
        .view-all-btn:focus,
        .product-card:focus,
        .category-card:focus,
        .testimonial-nav:focus,
        .hero-nav-btn:focus {
          outline: 2px solid var(--primary-blue);
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .product-card,
          .category-card,
          .flash-product-card {
            border: 2px solid var(--gray-800);
          }

          .hero-overlay {
            background: rgba(0, 0, 0, 0.8);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .hero-slides,
          .testimonials-track {
            transition: none;
          }

          .loading-spinner {
            animation: none;
          }

          .flash-badge,
          .header-badge {
            animation: none;
          }

          .view-all-btn.flash {
            animation: none;
          }

          .product-card,
          .category-card,
          .flash-product-card {
            animation: none;
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Print styles */
        @media print {
          .hero-nav-btn,
          .testimonial-nav,
          .view-all-btn,
          .cta-button,
          .contact-value {
            display: none;
          }

          .hero-section {
            min-height: auto;
          }

          .section-title {
            color: var(--gray-800);
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;