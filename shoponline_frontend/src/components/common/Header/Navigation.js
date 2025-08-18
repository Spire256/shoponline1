import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import categoriesAPI from '../../../services/api/categoriesAPI';
import flashSalesAPI from '../../../services/api/flashSalesAPI';

const Navigation = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchNavigationData();
  }, []);

  const fetchNavigationData = async () => {
    try {
      setIsLoading(true);
      const [categoriesResponse, flashSalesResponse] = await Promise.all([
        categoriesAPI.getCategories({ is_active: true, limit: 12 }),
        flashSalesAPI.getActiveFlashSales(),
      ]);

      setCategories(categoriesResponse.data.results || categoriesResponse.data);
      setFlashSales(flashSalesResponse.data.results || flashSalesResponse.data);
    } catch (error) {
      console.error('Error fetching navigation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropdownToggle = dropdownName => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handleLinkClick = () => {
    setActiveDropdown(null);
    onClose();
  };

  const isActiveLink = path => {
    return location.pathname === path;
  };

  const hasActiveFlashSales = flashSales && flashSales.length > 0;

  return (
    <nav className={`navigation ${isOpen ? 'navigation--open' : ''}`}>
      <div className="container">
        <div className="navigation__content">
          {/* Main Navigation Links */}
          <ul className="navigation__list">
            <li className="navigation__item">
              <Link
                to="/"
                className={`navigation__link ${
                  isActiveLink('/') ? 'navigation__link--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                Home
              </Link>
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
                <svg
                  className="navigation__dropdown-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
                      Loading categories...
                    </div>
                  ) : (
                    <>
                      <div className="navigation__dropdown-header">
                        <Link
                          to="/categories"
                          className="navigation__dropdown-header-link"
                          onClick={handleLinkClick}
                        >
                          View All Categories
                        </Link>
                      </div>
                      <div className="navigation__dropdown-grid">
                        {categories.slice(0, 8).map(category => (
                          <Link
                            key={category.id}
                            to={`/categories/${category.slug}`}
                            className="navigation__dropdown-item"
                            onClick={handleLinkClick}
                          >
                            {category.image_url && (
                              <img
                                src={category.image_url}
                                alt={category.name}
                                className="navigation__dropdown-item-image"
                              />
                            )}
                            <div className="navigation__dropdown-item-content">
                              <span className="navigation__dropdown-item-name">
                                {category.name}
                              </span>
                              <span className="navigation__dropdown-item-count">
                                {category.product_count} products
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </li>

            {/* Flash Sales Link */}
            {hasActiveFlashSales && (
              <li className="navigation__item">
                <Link
                  to="/flash-sales"
                  className={`navigation__link navigation__link--flash ${
                    isActiveLink('/flash-sales') ? 'navigation__link--active' : ''
                  }`}
                  onClick={handleLinkClick}
                >
                  <span className="navigation__flash-icon">⚡</span>
                  Flash Sales
                  <span className="navigation__flash-badge">HOT</span>
                </Link>
              </li>
            )}

            {/* Products Link */}
            <li className="navigation__item">
              <Link
                to="/products"
                className={`navigation__link ${
                  isActiveLink('/products') ? 'navigation__link--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                All Products
              </Link>
            </li>

            {/* Deals Link */}
            <li className="navigation__item">
              <Link
                to="/deals"
                className={`navigation__link ${
                  isActiveLink('/deals') ? 'navigation__link--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                Deals
              </Link>
            </li>

            {/* About Link */}
            <li className="navigation__item">
              <Link
                to="/about"
                className={`navigation__link ${
                  isActiveLink('/about') ? 'navigation__link--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                About
              </Link>
            </li>

            {/* Contact Link */}
            <li className="navigation__item">
              <Link
                to="/contact"
                className={`navigation__link ${
                  isActiveLink('/contact') ? 'navigation__link--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                Contact
              </Link>
            </li>
          </ul>

          {/* Mobile Authentication Links */}
          <div className="navigation__mobile-auth">
            <Link
              to="/login"
              className="navigation__auth-link navigation__auth-link--login"
              onClick={handleLinkClick}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="navigation__auth-link navigation__auth-link--register"
              onClick={handleLinkClick}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`navigation__overlay ${isOpen ? 'navigation__overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
       />
    </nav>
  );
};

export default Navigation;