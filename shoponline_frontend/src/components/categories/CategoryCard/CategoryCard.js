// src/components/categories/CategoryCard/CategoryCard.js

import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import './CategoryCard.css';

const CategoryCard = ({
  category,
  variant = 'default',
  showProductCount = true,
  showDescription = true,
  onClick,
}) => {
  const { id, name, slug, description, image_url, product_count = 0, featured = false } = category;

  const handleClick = e => {
    if (onClick) {
      e.preventDefault();
      onClick(category);
    }
  };

  const CardContent = () => (
    <div className={`category-card ${variant} ${featured ? 'featured' : ''}`}>
      {/* Category Image */}
      <div className="category-card__image-container">
        <img
          src={image_url || '/assets/placeholders/category-placeholder.jpg'}
          alt={name}
          className="category-card__image"
          loading="lazy"
        />
        {featured && (
          <div className="category-card__featured-badge">
            <span>Featured</span>
          </div>
        )}
        <div className="category-card__overlay">
          <div className="category-card__overlay-content">
            <ArrowRight className="category-card__overlay-icon" />
            <span>View Products</span>
          </div>
        </div>
      </div>

      {/* Category Info */}
      <div className="category-card__content">
        <div className="category-card__header">
          <h3 className="category-card__title">{name}</h3>
          {showProductCount && (
            <div className="category-card__product-count">
              <ShoppingBag size={16} />
              <span>
                {product_count} {product_count === 1 ? 'Product' : 'Products'}
              </span>
            </div>
          )}
        </div>

        {showDescription && description && (
          <p className="category-card__description">
            {description.length > 80 ? `${description.substring(0, 80)}...` : description}
          </p>
        )}

        <div className="category-card__footer">
          <span className="category-card__link-text">
            Browse {name} <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </div>
  );

  return onClick ? (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      <CardContent />
    </div>
  ) : (
    <Link
      to={`/categories/${slug}`}
      className="category-card__link"
      aria-label={`Browse ${name} category`}
    >
      <CardContent />
    </Link>
  );
};

export default CategoryCard;
