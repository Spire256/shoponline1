import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const CategoryHeader = ({ category, subcategories, productCount, onSubcategoryClick }) => {
  const renderBreadcrumb = () => {
    if (!category.breadcrumb_trail || category.breadcrumb_trail.length === 0) {
      return null;
    }

    return (
      <nav className="category-header__breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb__item">
            <Link to="/" className="breadcrumb__link">
              Home
            </Link>
          </li>
          <li className="breadcrumb__item">
            <Link to="/categories" className="breadcrumb__link">
              Categories
            </Link>
          </li>
          {category.breadcrumb_trail.map((crumb, index) => (
            <li
              key={crumb.id}
              className={`breadcrumb__item ${
                index === category.breadcrumb_trail.length - 1 ? 'breadcrumb__item--active' : ''
              }`}
            >
              {index === category.breadcrumb_trail.length - 1 ? (
                <span className="breadcrumb__current">{crumb.name}</span>
              ) : (
                <Link to={`/categories/${crumb.slug}`} className="breadcrumb__link">
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderSubcategories = () => {
    if (!subcategories || subcategories.length === 0) {
      return null;
    }

    return (
      <div className="category-header__subcategories">
        <h3 className="category-header__subcategories-title">Browse Subcategories</h3>
        <div className="subcategories-grid">
          {subcategories.map(subcategory => (
            <div
              key={subcategory.id}
              className="subcategory-card"
              onClick={() => onSubcategoryClick(subcategory.slug)}
            >
              <div className="subcategory-card__content">
                {subcategory.image_url && (
                  <div className="subcategory-card__image">
                    <img src={subcategory.image_url} alt={subcategory.name} loading="lazy" />
                  </div>
                )}
                <div className="subcategory-card__info">
                  <h4 className="subcategory-card__name">{subcategory.name}</h4>
                  <p className="subcategory-card__count">{subcategory.product_count} products</p>
                  {subcategory.description && (
                    <p className="subcategory-card__description">
                      {subcategory.description.length > 100
                        ? `${subcategory.description.substring(0, 100)}...`
                        : subcategory.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="subcategory-card__overlay">
                <span className="subcategory-card__cta">View Products →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getCategoryImageUrl = () => {
    return category.image_url || '/assets/images/placeholders/category-placeholder.jpg';
  };

  return (
    <div className="category-header">
      {renderBreadcrumb()}

      <div className="category-header__hero">
        <div
          className="category-header__background"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(59, 130, 246, 0.8)), url(${getCategoryImageUrl()})`,
          }}
        >
          <div className="container">
            <div className="category-header__content">
              <div className="category-header__text">
                <h1 className="category-header__title">{category.name}</h1>

                {category.description && (
                  <p className="category-header__description">{category.description}</p>
                )}

                <div className="category-header__stats">
                  <div className="category-stat">
                    <span className="category-stat__number">{productCount.toLocaleString()}</span>
                    <span className="category-stat__label">
                      {productCount === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>

                  {subcategories && subcategories.length > 0 && (
                    <div className="category-stat">
                      <span className="category-stat__number">{subcategories.length}</span>
                      <span className="category-stat__label">
                        {subcategories.length === 1 ? 'Subcategory' : 'Subcategories'}
                      </span>
                    </div>
                  )}

                  {category.featured && (
                    <div className="category-header__badge">
                      <span className="badge badge--featured">Featured Category</span>
                    </div>
                  )}
                </div>

                <div className="category-header__actions">
                  <button
                    className="btn btn--outline btn--white"
                    onClick={() => {
                      const productsSection = document.querySelector('.category-products');
                      if (productsSection) {
                        productsSection.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }
                    }}
                  >
                    Browse Products
                  </button>

                  {category.parent_details && (
                    <Link
                      to={`/categories/${category.parent_details.slug}`}
                      className="btn btn--text btn--white"
                    >
                      ← Back to {category.parent_details.name}
                    </Link>
                  )}
                </div>
              </div>

              {/* Category Image for larger screens */}
              <div className="category-header__image">
                <div className="category-header__image-container">
                  <img
                    src={getCategoryImageUrl()}
                    alt={category.name}
                    className="category-header__image-element"
                  />
                  <div className="category-header__image-overlay" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderSubcategories()}

      {/* SEO Meta Information */}
      {(category.meta_title || category.meta_description) && (
        <div className="category-header__seo" style={{ display: 'none' }}>
          {category.meta_title && <h2>{category.meta_title}</h2>}
          {category.meta_description && <p>{category.meta_description}</p>}
        </div>
      )}
    </div>
  );
};

CategoryHeader.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    description: PropTypes.string,
    image_url: PropTypes.string,
    featured: PropTypes.bool,
    meta_title: PropTypes.string,
    meta_description: PropTypes.string,
    breadcrumb_trail: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
      })
    ),
    parent_details: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }),
  }).isRequired,
  subcategories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      description: PropTypes.string,
      image_url: PropTypes.string,
      product_count: PropTypes.number.isRequired,
    })
  ),
  productCount: PropTypes.number.isRequired,
  onSubcategoryClick: PropTypes.func.isRequired,
};

CategoryHeader.defaultProps = {
  subcategories: [],
};

export default CategoryHeader;
