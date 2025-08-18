// src/components/common/Header/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../../../hooks/useCart';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { cartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomePage = location.pathname === '/';

  return (
    <header
      className={`header ${isScrolled ? 'header--scrolled' : ''} ${
        isAdminRoute ? 'header--admin' : ''
      }`}
    >
      {/* Top Bar - Only show on client pages */}
      {!isAdminRoute && (
        <div className="header__topbar">
          <div className="container">
            <div className="header__topbar-content">
              <div className="header__topbar-left">
                <span className="header__topbar-text">
                  Free delivery in Kampala for orders above UGX 100,000
                </span>
              </div>
              <div className="header__topbar-right">
                <div className="header__topbar-links">
                  <Link to="/help" className="header__topbar-link">
                    Help
                  </Link>
                  <Link to="/contact" className="header__topbar-link">
                    Contact
                  </Link>
                  {user?.is_admin && (
                    <Link to="/admin" className="header__topbar-link header__topbar-link--admin">
                      Admin Panel
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="header__main">
        <div className="container">
          <div className="header__main-content">
            {/* Logo */}
            <div className="header__logo">
              <button
                onClick={handleLogoClick}
                className="header__logo-button"
                aria-label="Go to homepage"
              >
                <img
                  src="/assets/logo/logo-blue.svg"
                  alt="ShopOnline Uganda"
                  className="header__logo-image"
                />
                <span className="header__logo-text">ShopOnline</span>
              </button>
            </div>

            {/* Search Bar - Only show on client pages and not on mobile */}
            {!isAdminRoute && (
              <div className="header__search">
                <SearchBar />
              </div>
            )}

            {/* Actions */}
            <div className="header__actions">
              {!isAdminRoute && (
                <>
                  {/* Cart Icon */}
                  <button
                    onClick={handleCartClick}
                    className="header__cart-button"
                    aria-label={`Cart with ${cartItemsCount} items`}
                  >
                    <div className="header__cart-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.4 5.1 16.4H17M17 13V16.4M9 19.5C9.8 19.5 10.5 20.2 10.5 21S9.8 22.5 9 22.5 7.5 21.8 7.5 21 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21S20.8 22.5 20 22.5 18.5 21.8 18.5 21 19.2 19.5 20 19.5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {cartItemsCount > 0 && (
                        <span className="header__cart-badge">{cartItemsCount}</span>
                      )}
                    </div>
                    <span className="header__cart-text">Cart</span>
                  </button>
                </>
              )}

              {/* User Menu */}
              <UserMenu />

              {/* Mobile Menu Toggle - Only show on client pages */}
              {!isAdminRoute && (
                <button
                  onClick={toggleMobileMenu}
                  className={`header__mobile-toggle ${
                    isMenuOpen ? 'header__mobile-toggle--active' : ''
                  }`}
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMenuOpen}
                >
                  <span className="header__mobile-toggle-line" />
                  <span className="header__mobile-toggle-line" />
                  <span className="header__mobile-toggle-line" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Only show on client pages */}
      {!isAdminRoute && <Navigation isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}

      {/* Mobile Search Bar - Show on mobile for client pages */}
      {!isAdminRoute && (
        <div className="header__mobile-search">
          <div className="container">
            <SearchBar isMobile={true} />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
