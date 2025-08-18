// src/pages/FlashSalesPage/FlashSaleProducts.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FlashSaleProducts.css';

const FlashSaleProducts = ({ flashSale, onAddToCart }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('discount');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    if (flashSale?.flash_sale_products) {
      setProducts(flashSale.flash_sale_products);
      setLoading(false);
    }
  }, [flashSale]);

  const formatPrice = price => {
    return `UGX ${Number(price).toLocaleString()}`;
  };

  const calculateSavings = (originalPrice, salePrice) => {
    return originalPrice - salePrice;
  };

  const getDiscountPercentage = (originalPrice, salePrice) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  const sortProducts = (products, sortBy) => {
    const sorted = [...products];
    switch (sortBy) {
      case 'discount':
        return sorted.sort((a, b) => b.discount_percentage - a.discount_percentage);
      case 'price_low':
        return sorted.sort((a, b) => a.flash_sale_price - b.flash_sale_price);
      case 'price_high':
        return sorted.sort((a, b) => b.flash_sale_price - a.flash_sale_price);
      case 'name':
        return sorted.sort((a, b) => a.product_detail.name.localeCompare(b.product_detail.name));
      case 'stock':
        return sorted.sort((a, b) => {
          const stockA = a.stock_limit ? a.stock_limit - a.sold_quantity : Infinity;
          const stockB = b.stock_limit ? b.stock_limit - b.sold_quantity : Infinity;
          return stockB - stockA;
        });
      default:
        return sorted;
    }
  };

  const filterProducts = (products, filterBy) => {
    switch (filterBy) {
      case 'available':
        return products.filter(product => !product.is_sold_out && product.is_active);
      case 'limited':
        return products.filter(product => product.stock_limit && product.stock_limit > 0);
      case 'high_discount':
        return products.filter(product => product.discount_percentage >= 30);
      case 'all':
      default:
        return products.filter(product => product.is_active);
    }
  };

  const handleProductClick = product => {
    navigate(`/products/${product.product_detail.slug}`);
  };

  const handleAddToCart = product => {
    const cartItem = {
      product_id: product.product_detail.id,
      name: product.product_detail.name,
      price: product.flash_sale_price,
      original_price: product.original_price,
      image: product.product_detail.image_url,
      is_flash_sale: true,
      flash_sale_id: flashSale.id,
      quantity: 1,
    };
    onAddToCart(cartItem);
  };

  const getStockStatus = product => {
    if (!product.stock_limit) return null;

    const remaining = product.stock_limit - product.sold_quantity;
    const percentage = (remaining / product.stock_limit) * 100;

    if (remaining === 0) return { text: 'Sold Out', class: 'sold-out' };
    if (percentage <= 20) return { text: `Only ${remaining} left!`, class: 'low-stock' };
    if (percentage <= 50) return { text: `${remaining} remaining`, class: 'medium-stock' };

    return { text: `${remaining} available`, class: 'high-stock' };
  };

  if (loading) {
    return (
      <div className="flash-sale-products-loading">
        <div className="loading-spinner" />
        <p>Loading flash sale products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flash-sale-products-error">
        <h3>Error Loading Products</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  const filteredProducts = filterProducts(products, filterBy);
  const sortedProducts = sortProducts(filteredProducts, sortBy);

  return (
    <div className="flash-sale-products">
      {/* Products Header */}
      <div className="products-header">
        <div className="products-info">
          <h2>Flash Sale Products</h2>
          <p>{sortedProducts.length} products available</p>
        </div>

        <div className="products-controls">
          <div className="filter-control">
            <label htmlFor="filter-select">Filter:</label>
            <select
              id="filter-select"
              value={filterBy}
              onChange={e => setFilterBy(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Products</option>
              <option value="available">Available</option>
              <option value="limited">Limited Stock</option>
              <option value="high_discount">30%+ Off</option>
            </select>
          </div>

          <div className="sort-control">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="discount">Highest Discount</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
              <option value="stock">Stock Remaining</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="no-products">
          <div className="no-products-icon">🔥</div>
          <h3>No Products Found</h3>
          <p>Try adjusting your filters to see more products.</p>
        </div>
      ) : (
        <div className="products-grid">
          {sortedProducts.map(product => {
            const stockStatus = getStockStatus(product);
            const discountPercent = getDiscountPercentage(
              product.original_price,
              product.flash_sale_price
            );

            return (
              <div
                key={product.id}
                className={`product-card ${product.is_sold_out ? 'sold-out' : ''}`}
              >
                {/* Product Image */}
                <div className="product-image-container">
                  <img
                    src={
                      product.product_detail.image_url ||
                      '/assets/images/placeholders/product-placeholder.jpg'
                    }
                    alt={product.product_detail.name}
                    className="product-image"
                    onClick={() => handleProductClick(product)}
                  />

                  {/* Discount Badge */}
                  <div className="discount-badge">-{discountPercent}%</div>

                  {/* Flash Sale Badge */}
                  <div className="flash-sale-badge">🔥 FLASH SALE</div>

                  {/* Stock Status */}
                  {stockStatus && (
                    <div className={`stock-status ${stockStatus.class}`}>{stockStatus.text}</div>
                  )}
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <h3 className="product-name" onClick={() => handleProductClick(product)}>
                    {product.product_detail.name}
                  </h3>

                  <p className="product-description">
                    {product.product_detail.short_description ||
                      `${product.product_detail.description?.substring(0, 100)}...`}
                  </p>

                  {/* Pricing */}
                  <div className="product-pricing">
                    <div className="price-container">
                      <span className="flash-price">{formatPrice(product.flash_sale_price)}</span>
                      <span className="original-price">{formatPrice(product.original_price)}</span>
                    </div>
                    <div className="savings">You save: {formatPrice(product.savings_amount)}</div>
                  </div>

                  {/* Product Actions */}
                  <div className="product-actions">
                    <button
                      onClick={() => handleProductClick(product)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.is_sold_out}
                      className={`add-to-cart-btn ${product.is_sold_out ? 'disabled' : ''}`}
                    >
                      {product.is_sold_out ? 'Sold Out' : 'Add to Cart'}
                    </button>
                  </div>

                  {/* Stock Progress Bar */}
                  {product.stock_limit && (
                    <div className="stock-progress">
                      <div className="stock-progress-bar">
                        <div
                          className="stock-progress-fill"
                          style={{
                            width: `${
                              ((product.stock_limit - product.sold_quantity) /
                                product.stock_limit) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="stock-text">
                        {product.stock_limit - product.sold_quantity} / {product.stock_limit} left
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button (if pagination needed) */}
      {sortedProducts.length > 0 && (
        <div className="products-footer">
          <p className="products-count">
            Showing {sortedProducts.length} of {products.length} products
          </p>
        </div>
      )}
    </div>
  );
};

export default FlashSaleProducts;
