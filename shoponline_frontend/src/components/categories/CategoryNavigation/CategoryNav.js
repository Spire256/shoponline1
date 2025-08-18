// src/components/categories/CategoryNavigation/CategoryNav.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import CategoryDropdown from './CategoryDropdown';
import './CategoryNav.css';

const CategoryNav = ({
  categories = [],
  loading = false,
  variant = 'horizontal', // 'horizontal' | 'vertical' | 'mobile'
  showAllLink = true,
  maxVisible = 8,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [visibleCategories, setVisibleCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const location = useLocation();
  const navRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  // Process categories on mount and when categories change
  useEffect(() => {
    if (categories.length > 0) {
      const rootCategories = categories.filter(cat => !cat.parent);

      if (rootCategories.length > maxVisible) {
        setVisibleCategories(rootCategories.slice(0, maxVisible - 1));
        setHiddenCategories(rootCategories.slice(maxVisible - 1));
      } else {
        setVisibleCategories(rootCategories);
        setHiddenCategories([]);
      }
    }
  }, [categories, maxVisible]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  // Handle dropdown hover with delay
  const handleDropdownEnter = categoryId => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(categoryId);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // Get subcategories for a category
  const getSubcategories = categoryId => {
    return categories.filter(cat => cat.parent === categoryId);
  };

  // Check if current route matches category
  const isActiveCategory = categorySlug => {
    return location.pathname.includes(`/categories/${categorySlug}`);
  };

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (loading) {
    return (
      <nav className={`category-nav category-nav--${variant} ${className}`}>
        <div className="category-nav__loading">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="category-nav__skeleton" />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav ref={navRef} className={`category-nav category-nav--${variant} ${className}`}>
      {/* Mobile Menu Toggle */}
      {variant === 'mobile' && (
        <button
          onClick={toggleMobileMenu}
          className="category-nav__mobile-toggle"
          aria-label="Toggle categories menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          <span>Categories</span>
        </button>
      )}

      {/* Navigation List */}
      <ul className={`category-nav__list ${isMenuOpen ? 'open' : ''}`}>
        {/* All Categories Link */}
        {showAllLink && (
          <li className="category-nav__item category-nav__item--all">
            <Link
              to="/categories"
              className={`category-nav__link ${
                location.pathname === '/categories' ? 'active' : ''
              }`}
            >
              All Categories
            </Link>
          </li>
        )}

        {/* Visible Categories */}
        {visibleCategories.map(category => {
          const subcategories = getSubcategories(category.id);
          const hasSubcategories = subcategories.length > 0;
          const isActive = isActiveCategory(category.slug);

          return (
            <li
              key={category.id}
              className="category-nav__item"
              onMouseEnter={() => hasSubcategories && handleDropdownEnter(category.id)}
              onMouseLeave={handleDropdownLeave}
            >
              <Link
                to={`/categories/${category.slug}`}
                className={`category-nav__link ${isActive ? 'active' : ''}`}
              >
                <span>{category.name}</span>
                {hasSubcategories && (
                  <ChevronDown
                    size={16}
                    className={`category-nav__chevron ${
                      activeDropdown === category.id ? 'rotated' : ''
                    }`}
                  />
                )}
              </Link>

              {/* Dropdown for subcategories */}
              {hasSubcategories && activeDropdown === category.id && (
                <CategoryDropdown
                  categories={subcategories}
                  parentCategory={category}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </li>
          );
        })}

        {/* More Categories Dropdown */}
        {hiddenCategories.length > 0 && (
          <li
            className="category-nav__item category-nav__item--more"
            onMouseEnter={() => handleDropdownEnter('more')}
            onMouseLeave={handleDropdownLeave}
          >
            <button className="category-nav__link category-nav__more-trigger">
              <span>More</span>
              <ChevronDown
                size={16}
                className={`category-nav__chevron ${activeDropdown === 'more' ? 'rotated' : ''}`}
              />
            </button>

            {activeDropdown === 'more' && (
              <CategoryDropdown
                categories={hiddenCategories}
                isMoreDropdown={true}
                onClose={() => setActiveDropdown(null)}
              />
            )}
          </li>
        )}
      </ul>

      {/* Mobile Overlay */}
      {variant === 'mobile' && isMenuOpen && (
        <div className="category-nav__overlay" onClick={() => setIsMenuOpen(false)} />
      )}
    </nav>
  );
};

export default CategoryNav;
