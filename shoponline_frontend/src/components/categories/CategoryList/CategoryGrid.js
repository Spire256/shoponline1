// src/components/categories/CategoryList/CategoryGrid.js

import React from 'react';
import CategoryCard from '../CategoryCard/CategoryCard';

const CategoryGrid = ({ categories = [], viewMode = 'grid', loading = false }) => {
  const getGridClassName = () => {
    const baseClass = 'category-grid';
    return `${baseClass} ${baseClass}--${viewMode}`;
  };

  const getCardVariant = () => {
    switch (viewMode) {
      case 'list':
        return 'horizontal';
      case 'grid':
      default:
        return 'grid';
    }
  };

  return (
    <div className={getGridClassName()}>
      {categories.map(category => (
        <div key={category.id} className="category-grid__item">
          <CategoryCard
            category={category}
            variant={getCardVariant()}
            showProductCount={true}
            showDescription={viewMode !== 'compact'}
          />
        </div>
      ))}

      {/* Loading skeletons */}
      {loading && (
        <>
          {[...Array(6)].map((_, index) => (
            <div key={`skeleton-${index}`} className="category-grid__item">
              <div className="category-card loading">
                <div className="category-card__image-container">
                  <div className="category-card__image skeleton" />
                </div>
                <div className="category-card__content">
                  <div className="skeleton-text skeleton-title" />
                  <div className="skeleton-text skeleton-description" />
                  <div className="skeleton-text skeleton-link" />
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default CategoryGrid;
