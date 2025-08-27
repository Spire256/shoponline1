import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown,
  ChevronRight,
  Zap,
  Package,
  Star,
  TrendingUp,
  Grid3X3,
  X
} from 'lucide-react';

const Navigation = ({ isOpen = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [categories, setCategories] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Mock data for categories with proper routing paths
  const mockCategories = [
    {
      id: 1,
      name: 'Electronics',
      slug: 'electronics',
      image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100&h=100&fit=crop',
      product_count: 245,
      is_active: true,
      description: 'Latest gadgets and tech accessories'
    },
    {
      id: 2,
      name: 'Fashion & Style',
      slug: 'fashion',
      image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
      product_count: 186,
      is_active: true,
      description: 'Trending clothes and accessories'
    },
    {
      id: 3,
      name: 'Home & Garden',
      slug: 'home-garden',
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop',
      product_count: 127,
      is_active: true,
      description: 'Everything for your home'
    },
    {
      id: 4,
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop',
      product_count: 98,
      is_active: true,
      description: 'Sports and fitness equipment'
    },
    {
      id: 5,
      name: 'Beauty & Health',
      slug: 'beauty-health',
      image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop',
      product_count: 156,
      is_active: true,
      description: 'Personal care and wellness products'
    },
    {
      id: 6,
      name: 'Books & Education',
      slug: 'books-education',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      product_count: 89,
      is_active: true,
      description: 'Books and learning resources'
    }
  ];

  // Mock flash sales data
  const mockFlashSales = [
    {
      id: 1,
      title: 'Weekend Flash Sale',
      discount_percentage: 50,
      is_active: true,
      products_count: 25
    }
  ];

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setCategories(mockCategories);
      setFlashSales(mockFlashSales);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleDropdownToggle = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handleLinkClick = (path) => {
    navigate(path);
    setActiveDropdown(null);
    onClose();
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const hasActiveFlashSales = flashSales && flashSales.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.navigation__item--dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Close mobile navigation on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="navigation">
        <div className="container">
          <div className="navigation__content">
            <ul className="navigation__list">
              <li className="navigation__item">
                <button
                  onClick={() => handleLinkClick('/')}
                  className={`navigation__link ${
                    isActiveLink('/') ? 'navigation__link--active' : ''
                  }`}
                >
                  Home
                </button>
              </li>

              {/* Categories Dropdown */}
              <li className="navigation__item navigation__item--dropdown">
                <button
                  className={`navigation__link navigation__dropdown-trigger ${
                    activeDropdown === 'categories' ? 'navigation__dropdown-trigger--active' : ''
                  }`}
                  onClick={() => handleDropdownToggle('categories')}
                  aria-expanded={activeDropdown === 'categories'}
                >
                  Categories
                  <ChevronDown className="navigation__dropdown-icon" />
                </button>

                <div
                  className={`navigation__dropdown ${
                    activeDropdown === 'categories' ? 'navigation__dropdown--open' : ''
                  }`}
                >
                  <div className="navigation__dropdown-content">
                    {isLoading ? (
                      <div className="navigation__loading">
                        <div className="navigation__loading-spinner" />
                        <span>Loading categories...</span>
                      </div>
                    ) : (
                      <>
                        <div className="navigation__dropdown-header">
                          <button
                            onClick={() => handleLinkClick('/categories')}
                            className="navigation__dropdown-header-link"
                          >
                            <Grid3X3 className="icon" />
                            View All Categories
                          </button>
                        </div>
                        <div className="navigation__dropdown-grid">
                          {categories.slice(0, 8).map(category => (
                            <button
                              key={category.id}
                              onClick={() => handleLinkClick(`/categories/${category.slug}`)}
                              className="navigation__dropdown-item"
                            >
                              <div className="navigation__dropdown-item-image">
                                <img
                                  src={category.image_url}
                                  alt={category.name}
                                  loading="lazy"
                                />
                              </div>
                              <div className="navigation__dropdown-item-content">
                                <span className="navigation__dropdown-item-name">
                                  {category.name}
                                </span>
                                <span className="navigation__dropdown-item-count">
                                  {category.product_count} products
                                </span>
                                <span className="navigation__dropdown-item-desc">
                                  {category.description}
                                </span>
                              </div>
                              <ChevronRight className="navigation__dropdown-item-arrow" />
                            </button>
                          ))}
                        </div>
                        <div className="navigation__dropdown-footer">
                          <button
                            onClick={() => handleLinkClick('/categories')}
                            className="navigation__dropdown-view-all"
                          >
                            <Package className="icon" />
                            Browse All {categories.length} Categories
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>

              {/* Flash Sales Link */}
              {hasActiveFlashSales && (
                <li className="navigation__item">
                  <button
                    onClick={() => handleLinkClick('/flash-sales')}
                    className={`navigation__link navigation__link--flash ${
                      isActiveLink('/flash-sales') ? 'navigation__link--active' : ''
                    }`}
                  >
                    <Zap className="navigation__flash-icon" />
                    Flash Sales
                    <span className="navigation__flash-badge">HOT</span>
                  </button>
                </li>
              )}

              {/* Products Link */}
              <li className="navigation__item">
                <button
                  onClick={() => handleLinkClick('/products')}
                  className={`navigation__link ${
                    isActiveLink('/products') ? 'navigation__link--active' : ''
                  }`}
                >
                  All Products
                </button>
              </li>

              {/* Trending Products */}
              <li className="navigation__item">
                <button
                  onClick={() => handleLinkClick('/trending')}
                  className={`navigation__link ${
                    isActiveLink('/trending') ? 'navigation__link--active' : ''
                  }`}
                >
                  <TrendingUp className="navigation__trending-icon" />
                  Trending
                </button>
              </li>

              {/* Deals Link */}
              <li className="navigation__item">
                <button
                  onClick={() => handleLinkClick('/deals')}
                  className={`navigation__link ${
                    isActiveLink('/deals') ? 'navigation__link--active' : ''
                  }`}
                >
                  Deals
                </button>
              </li>

              {/* About Link */}
              <li className="navigation__item">
                <button
                  onClick={() => handleLinkClick('/about')}
                  className={`navigation__link ${
                    isActiveLink('/about') ? 'navigation__link--active' : ''
                  }`}
                >
                  About
                </button>
              </li>

              {/* Contact Link */}
              <li className="navigation__item">
                <button
                  onClick={() => handleLinkClick('/contact')}
                  className={`navigation__link ${
                    isActiveLink('/contact') ? 'navigation__link--active' : ''
                  }`}
                >
                  Contact
                </button>
              </li>
            </ul>

            {/* Quality Badges */}
            <div className="navigation__badges">
              <div className="navigation__badge">
                <Star className="icon" />
                <span>Verified Products</span>
              </div>
              <div className="navigation__badge">
                <Package className="icon" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="navigation__mobile">
          <div className="navigation__mobile-overlay" onClick={onClose} />
          <div className="navigation__mobile-content">
            <div className="navigation__mobile-header">
              <h3>Navigation</h3>
              <button onClick={onClose} className="navigation__mobile-close">
                <X size={20} />
              </button>
            </div>

            <div className="navigation__mobile-body">
              {/* Main Links */}
              <div className="navigation__mobile-section">
                <button
                  onClick={() => handleLinkClick('/')}
                  className={`navigation__mobile-link ${
                    isActiveLink('/') ? 'navigation__mobile-link--active' : ''
                  }`}
                >
                  Home
                </button>

                {/* Categories in Mobile */}
                <div className="navigation__mobile-dropdown">
                  <button
                    onClick={() => handleDropdownToggle('mobile-categories')}
                    className={`navigation__mobile-trigger ${
                      activeDropdown === 'mobile-categories' ? 'navigation__mobile-trigger--active' : ''
                    }`}
                  >
                    Categories
                    <ChevronDown className="navigation__mobile-chevron" />
                  </button>
                  
                  {activeDropdown === 'mobile-categories' && (
                    <div className="navigation__mobile-submenu">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => handleLinkClick(`/categories/${category.slug}`)}
                          className="navigation__mobile-sublink"
                        >
                          <div className="navigation__mobile-sublink-image">
                            <img
                              src={category.image_url}
                              alt={category.name}
                            />
                          </div>
                          <div className="navigation__mobile-sublink-content">
                            <span className="navigation__mobile-sublink-name">
                              {category.name}
                            </span>
                            <span className="navigation__mobile-sublink-count">
                              {category.product_count} items
                            </span>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => handleLinkClick('/categories')}
                        className="navigation__mobile-view-all"
                      >
                        View All Categories
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleLinkClick('/products')}
                  className={`navigation__mobile-link ${
                    isActiveLink('/products') ? 'navigation__mobile-link--active' : ''
                  }`}
                >
                  All Products
                </button>

                {hasActiveFlashSales && (
                  <button
                    onClick={() => handleLinkClick('/flash-sales')}
                    className={`navigation__mobile-link navigation__mobile-link--flash ${
                      isActiveLink('/flash-sales') ? 'navigation__mobile-link--active' : ''
                    }`}
                  >
                    <Zap className="icon" />
                    Flash Sales
                    <span className="navigation__mobile-flash-badge">HOT</span>
                  </button>
                )}

                <button
                  onClick={() => handleLinkClick('/trending')}
                  className={`navigation__mobile-link ${
                    isActiveLink('/trending') ? 'navigation__mobile-link--active' : ''
                  }`}
                >
                  <TrendingUp className="icon" />
                  Trending
                </button>

                <button
                  onClick={() => handleLinkClick('/deals')}
                  className={`navigation__mobile-link ${
                    isActiveLink('/deals') ? 'navigation__mobile-link--active' : ''
                  }`}
                >
                  Deals
                </button>

                <button
                  onClick={() => handleLinkClick('/about')}
                  className={`navigation__mobile-link ${
                    isActiveLink('/about') ? 'navigation__mobile-link--active' : ''
                  }`}
                >
                  About
                </button>

                <button
                  onClick={() => handleLinkClick('/contact')}
                  className={`navigation__mobile-link ${
                    isActiveLink('/contact') ? 'navigation__mobile-link--active' : ''
                  }`}
                >
                  Contact
                </button>
              </div>
            </div>

            <div className="navigation__mobile-footer">
              <div className="navigation__mobile-badges">
                <div className="navigation__mobile-badge">
                  <Star className="icon" />
                  <span>Verified Products</span>
                </div>
                <div className="navigation__mobile-badge">
                  <Package className="icon" />
                  <span>Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* CSS Variables */
        :root {
          --primary-blue: #2563eb;
          --primary-blue-dark: #1e40af;
          --primary-blue-light: #3b82f6;
          --white: #ffffff;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-500: #64748b;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --success: #10b981;
          --warning: #f59e0b;
          --error: #ef4444;
          --shadow-md: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05);
          --shadow-xl: 0 20px 25px -5px rgba(37, 99, 235, 0.1), 0 10px 10px -5px rgba(37, 99, 235, 0.04);
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-xl: 16px;
          --radius-full: 9999px;
          --transition-normal: 300ms ease-in-out;
          --gradient-primary: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Container */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .icon {
          width: 18px;
          height: 18px;
          stroke-width: 1.5;
          flex-shrink: 0;
        }

        /* Desktop Navigation */
        .navigation {
          background: var(--gray-50);
          border-bottom: 1px solid var(--gray-200);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .navigation__content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
        }

        .navigation__list {
          display: flex;
          align-items: center;
          gap: 0;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .navigation__item {
          position: relative;
        }

        .navigation__link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          color: var(--gray-700);
          background: transparent;
          border: none;
          font-weight: 500;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all var(--transition-normal);
          border-radius: var(--radius-md);
          position: relative;
          white-space: nowrap;
        }

        .navigation__link:hover {
          background: var(--white);
          color: var(--primary-blue);
          box-shadow: var(--shadow-md);
        }

        .navigation__link--active {
          background: var(--white);
          color: var(--primary-blue);
          font-weight: 600;
          box-shadow: var(--shadow-md);
        }

        .navigation__link--active::after {
          content: '';
          position: absolute;
          bottom: -1rem;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background: var(--primary-blue);
          border-radius: var(--radius-full);
        }

        .navigation__link--flash {
          background: var(--gradient-primary);
          color: var(--white);
          animation: flash-pulse 2s infinite;
          position: relative;
          overflow: hidden;
        }

        .navigation__link--flash:hover {
          background: var(--primary-blue-dark);
          color: var(--white);
          box-shadow: var(--shadow-lg);
        }

        @keyframes flash-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }

        .navigation__flash-icon {
          width: 16px;
          height: 16px;
          animation: flash-spark 1.5s ease-in-out infinite;
        }

        @keyframes flash-spark {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(5deg) scale(1.1); }
        }

        .navigation__flash-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--error);
          color: var(--white);
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          animation: badge-bounce 2s ease-in-out infinite;
        }

        @keyframes badge-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .navigation__trending-icon {
          width: 16px;
          height: 16px;
          color: var(--success);
        }

        /* Dropdown */
        .navigation__item--dropdown {
          position: relative;
        }

        .navigation__dropdown-trigger {
          position: relative;
        }

        .navigation__dropdown-icon {
          width: 14px;
          height: 14px;
          margin-left: 0.25rem;
          transition: transform var(--transition-normal);
        }

        .navigation__dropdown-trigger--active .navigation__dropdown-icon,
        .navigation__item--dropdown:hover .navigation__dropdown-icon {
          transform: rotate(180deg);
        }

        .navigation__dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          width: 600px;
          z-index: 100;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all var(--transition-normal);
          margin-top: 0.5rem;
        }

        .navigation__dropdown--open,
        .navigation__item--dropdown:hover .navigation__dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .navigation__dropdown-content {
          padding: 1.5rem;
        }

        .navigation__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          color: var(--gray-500);
        }

        .navigation__loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--gray-200);
          border-top: 3px solid var(--primary-blue);
          border-radius: var(--radius-full);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .navigation__dropdown-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--gray-200);
        }

        .navigation__dropdown-header-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--gradient-primary);
          color: var(--white);
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.95rem;
        }

        .navigation__dropdown-header-link:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .navigation__dropdown-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .navigation__dropdown-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
          width: 100%;
        }

        .navigation__dropdown-item:hover {
          background: var(--gray-50);
          border-color: var(--primary-blue);
          transform: translateX(4px);
        }

        .navigation__dropdown-item-image {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--gray-100);
        }

        .navigation__dropdown-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .navigation__dropdown-item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .navigation__dropdown-item-name {
          font-weight: 600;
          color: var(--gray-800);
          font-size: 0.95rem;
        }

        .navigation__dropdown-item-count {
          font-size: 0.8rem;
          color: var(--primary-blue);
          font-weight: 500;
        }

        .navigation__dropdown-item-desc {
          font-size: 0.75rem;
          color: var(--gray-500);
          line-height: 1.3;
        }

        .navigation__dropdown-item-arrow {
          width: 16px;
          height: 16px;
          color: var(--gray-400);
          transition: all var(--transition-normal);
        }

        .navigation__dropdown-item:hover .navigation__dropdown-item-arrow {
          color: var(--primary-blue);
          transform: translateX(4px);
        }

        .navigation__dropdown-footer {
          padding-top: 1rem;
          border-top: 1px solid var(--gray-200);
        }

        .navigation__dropdown-view-all {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--gray-50);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          color: var(--gray-700);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
          width: 100%;
          font-size: 0.9rem;
        }

        .navigation__dropdown-view-all:hover {
          background: var(--primary-blue);
          border-color: var(--primary-blue);
          color: var(--white);
        }

        /* Navigation Badges */
        .navigation__badges {
          display: flex;
          gap: 1rem;
        }

        .navigation__badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-full);
          color: var(--gray-600);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .navigation__badge .icon {
          width: 14px;
          height: 14px;
          color: var(--primary-blue);
        }

        /* Mobile Navigation */
        .navigation__mobile {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 200;
          display: block;
        }

        .navigation__mobile-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .navigation__mobile-content {
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          max-width: 380px;
          height: 100%;
          background: var(--white);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .navigation__mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--gray-200);
          background: var(--gray-50);
        }

        .navigation__mobile-header h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--gray-800);
        }

        .navigation__mobile-close {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-300);
          background: var(--white);
          color: var(--gray-600);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-normal);
        }

        .navigation__mobile-close:hover {
          background: var(--error);
          border-color: var(--error);
          color: var(--white);
        }

        .navigation__mobile-body {
          flex: 1;
          padding: 1rem 0;
        }

        .navigation__mobile-section {
          display: flex;
          flex-direction: column;
        }

        .navigation__mobile-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          color: var(--gray-700);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
          border-bottom: 1px solid var(--gray-100);
        }

        .navigation__mobile-link:hover {
          background: var(--gray-50);
          color: var(--primary-blue);
        }

        .navigation__mobile-link--active {
          background: var(--primary-blue);
          color: var(--white);
          font-weight: 600;
        }

        .navigation__mobile-link--flash {
          background: var(--gradient-primary);
          color: var(--white);
          margin: 0.5rem 1rem;
          border-radius: var(--radius-md);
          border-bottom: none;
          position: relative;
        }

        .navigation__mobile-flash-badge {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          background: var(--error);
          color: var(--white);
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .navigation__mobile-dropdown {
          border-bottom: 1px solid var(--gray-100);
        }

        .navigation__mobile-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          color: var(--gray-700);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-normal);
          width: 100%;
          text-align: left;
        }

        .navigation__mobile-trigger:hover {
          background: var(--gray-50);
          color: var(--primary-blue);
        }

        .navigation__mobile-trigger--active {
          background: var(--gray-50);
          color: var(--primary-blue);
        }

        .navigation__mobile-chevron {
          width: 16px;
          height: 16px;
          transition: transform var(--transition-normal);
        }

        .navigation__mobile-trigger--active .navigation__mobile-chevron {
          transform: rotate(180deg);
        }

        .navigation__mobile-submenu {
          background: var(--gray-50);
          border-top: 1px solid var(--gray-200);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 500px;
            opacity: 1;
          }
        }

        .navigation__mobile-sublink {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-normal);
          width: 100%;
          text-align: left;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .navigation__mobile-sublink:hover {
          background: var(--white);
          transform: translateX(4px);
        }

        .navigation__mobile-sublink-image {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--gray-100);
        }

        .navigation__mobile-sublink-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .navigation__mobile-sublink-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .navigation__mobile-sublink-name {
          font-weight: 600;
          color: var(--gray-800);
          font-size: 0.9rem;
        }

        .navigation__mobile-sublink-count {
          font-size: 0.75rem;
          color: var(--primary-blue);
        }

        .navigation__mobile-view-all {
          padding: 1rem 2rem;
          background: var(--white);
          border: none;
          color: var(--primary-blue);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
          width: 100%;
          text-align: left;
          margin-top: 0.5rem;
        }

        .navigation__mobile-view-all:hover {
          background: var(--primary-blue);
          color: var(--white);
        }

        .navigation__mobile-footer {
          padding: 1.5rem;
          background: var(--gray-50);
          border-top: 1px solid var(--gray-200);
        }

        .navigation__mobile-badges {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .navigation__mobile-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          color: var(--gray-600);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .navigation__mobile-badge .icon {
          width: 16px;
          height: 16px;
          color: var(--primary-blue);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .navigation__dropdown {
            width: 500px;
          }

          .navigation__dropdown-grid {
            grid-template-columns: 1fr;
          }

          .navigation__badges {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .navigation {
            display: none;
          }

          .navigation__mobile {
            display: block;
          }

          .navigation__mobile-content {
            width: 100%;
            max-width: none;
          }
        }

        @media (max-width: 480px) {
          .navigation__mobile-header {
            padding: 1rem;
          }

          .navigation__mobile-link {
            padding: 0.875rem 1rem;
          }

          .navigation__mobile-sublink {
            padding: 0.875rem 1.5rem;
          }

          .navigation__mobile-footer {
            padding: 1rem;
          }
        }

        /* Animation for better UX */
        .navigation__dropdown-item {
          animation: fadeInUp 0.3s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
        }

        .navigation__dropdown-item:nth-child(1) { animation-delay: 0.05s; }
        .navigation__dropdown-item:nth-child(2) { animation-delay: 0.1s; }
        .navigation__dropdown-item:nth-child(3) { animation-delay: 0.15s; }
        .navigation__dropdown-item:nth-child(4) { animation-delay: 0.2s; }
        .navigation__dropdown-item:nth-child(5) { animation-delay: 0.25s; }
        .navigation__dropdown-item:nth-child(6) { animation-delay: 0.3s; }
        .navigation__dropdown-item:nth-child(7) { animation-delay: 0.35s; }
        .navigation__dropdown-item:nth-child(8) { animation-delay: 0.4s; }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Focus states for accessibility */
        .navigation__link:focus,
        .navigation__dropdown-item:focus,
        .navigation__mobile-link:focus {
          outline: 2px solid var(--primary-blue);
          outline-offset: 2px;
        }

        /* Loading animation */
        @keyframes loading-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .navigation__loading span {
          animation: loading-pulse 1.5s ease-in-out infinite;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .navigation__link {
            border: 1px solid transparent;
          }

          .navigation__link:hover,
          .navigation__link--active {
            border-color: var(--primary-blue);
          }

          .navigation__dropdown {
            border-width: 2px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .navigation__link,
          .navigation__dropdown,
          .navigation__dropdown-item,
          .navigation__mobile-link,
          .navigation__mobile-sublink,
          .navigation__mobile-content {
            transition: none;
            animation: none;
          }

          .navigation__loading-spinner {
            animation: none;
          }

          .navigation__link--flash {
            animation: none;
          }

          .navigation__flash-icon {
            animation: none;
          }

          .navigation__flash-badge {
            animation: none;
          }
        }

        /* Ensure proper z-index stacking */
        .navigation__dropdown {
          z-index: 1000;
        }

        .navigation__mobile {
          z-index: 2000;
        }

        /* Smooth scrolling for mobile navigation */
        .navigation__mobile-content {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar for mobile navigation */
        .navigation__mobile-content::-webkit-scrollbar {
          width: 4px;
        }

        .navigation__mobile-content::-webkit-scrollbar-track {
          background: var(--gray-100);
        }

        .navigation__mobile-content::-webkit-scrollbar-thumb {
          background: var(--primary-blue);
          border-radius: var(--radius-full);
        }

        .navigation__mobile-content::-webkit-scrollbar-thumb:hover {
          background: var(--primary-blue-dark);
        }
      `}</style>
    </>
  );
};

export default Navigation;