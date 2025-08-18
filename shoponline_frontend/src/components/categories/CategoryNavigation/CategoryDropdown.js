// src/components/categories/CategoryNavigation/CategoryDropdown.js

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';

const CategoryDropdown = ({
  categories = [],
  parentCategory = null,
  isMoreDropdown = false,
  onClose,
  maxColumns = 3,
  showProductCount = true,
}) => {
  // Group categories into columns for better layout
  const getColumnLayout = () => {
    if (categories.length <= 6) return 1;
    if (categories.length <= 12) return 2;
    return Math.min(maxColumns, Math.ceil(categories.length / 8));
  };

  const columns = getColumnLayout();
  const itemsPerColumn = Math.ceil(categories.length / columns);

  const getCategoryColumns = () => {
    const columnCategories = [];
    for (let i = 0; i < columns; i++) {
      const start = i * itemsPerColumn;
      const end = start + itemsPerColumn;
      columnCategories.push(categories.slice(start, end));
    }
    return columnCategories;
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`category-dropdown ${isMoreDropdown ? 'category-dropdown--more' : ''}`}>
      <div className="category-dropdown__content">
        {/* Header for subcategory dropdowns */}
        {parentCategory && !isMoreDropdown && (
          <div className="category-dropdown__header">
            <Link
              to={`/categories/${parentCategory.slug}`}
              className="category-dropdown__parent-link"
              onClick={handleLinkClick}
            >
              <span>View All {parentCategory.name}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Categories Grid */}
        <div
          className="category-dropdown__grid"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {getCategoryColumns().map((columnCategories, columnIndex) => (
            <div key={columnIndex} className="category-dropdown__column">
              {columnCategories.map(category => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="category-dropdown__item"
                  onClick={handleLinkClick}
                >
                  <div className="category-dropdown__item-content">
                    {/* Category Image */}
                    {category.image_url && (
                      <div className="category-dropdown__item-image">
                        <img src={category.image_url} alt={category.name} loading="lazy" />
                      </div>
                    )}

                    {/* Category Info */}
                    <div className="category-dropdown__item-info">
                      <h4 className="category-dropdown__item-name">{category.name}</h4>

                      {showProductCount && category.product_count !== undefined && (
                        <div className="category-dropdown__item-count">
                          <ShoppingBag size={12} />
                          <span>
                            {category.product_count}{' '}
                            {category.product_count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      )}

                      {category.description && (
                        <p className="category-dropdown__item-description">
                          {category.description.length > 60
                            ? `${category.description.substring(0, 60)}...`
                            : category.description}
                        </p>
                      )}
                    </div>

                    {/* Arrow indicator */}
                    <ArrowRight size={14} className="category-dropdown__item-arrow" />
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Footer for more categories */}
        {isMoreDropdown && (
          <div className="category-dropdown__footer">
            <Link
              to="/categories"
              className="category-dropdown__view-all"
              onClick={handleLinkClick}
            >
              View All Categories
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Dropdown arrow pointer */}
      <div className="category-dropdown__arrow" />
    </div>
  );
};

export default CategoryDropdown;
