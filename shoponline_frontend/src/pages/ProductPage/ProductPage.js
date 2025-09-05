// src/pages/ProductPage/ProductPage.js - Updated for backend integration
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import productsAPI from '../../services/api/productsAPI';
import ProductImageGallery from './ProductImageGallery';
import ProductSpecifications from './ProductSpecifications';
import LoadingSpinner from '../../components/common/UI/Loading/Spinner';
import Alert from '../../components/common/UI/Alert/Alert';
import './ProductPage.css';

const ProductPage = ({ productSlug, onNavigate }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const currentSlug = productSlug || slug;
  
  const { addToCart, isInCart, getCartItemQuantity } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (currentSlug) {
      loadProduct();
    }
  }, [currentSlug]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get product by slug using backend API
      const productData = await productsAPI.getProductBySlug(currentSlug);
      setProduct(productData);

      // Set default variant if available
      if (productData.variants && productData.variants.length > 0) {
        const activeVariants = productData.variants.filter(v => v.is_active);
        if (activeVariants.length > 0) {
          setSelectedVariant(activeVariants[0]);
        }
      }

      // Load related products if category exists
      if (productData.category) {
        try {
          const categoryId = typeof productData.category === 'object' 
            ? productData.category.id 
            : productData.category;
          
          const relatedResponse = await productsAPI.getProductsByCategory(categoryId, {
            page_size: 4,
            is_active: true,
            status: 'published'
          });
          
          // Filter out current product
          const filtered = (relatedResponse.results || []).filter(p => p.id !== productData.id);
          setRelatedProducts(filtered.slice(0, 4));
        } catch (relatedError) {
          console.error('Error loading related products:', relatedError);
          setRelatedProducts([]);
        }
      }

      // Increment view count
      try {
        await productsAPI.incrementViewCount(productData.id);
      } catch (viewError) {
        console.error('Error incrementing view count:', viewError);
      }

    } catch (err) {
      console.error('Error loading product:', err);
      setError(err.message || 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isProductAvailable()) return;

    setActionLoading(true);
    try {
      const cartItem = {
        product_id: product.id,
        variant_id: selectedVariant?.id || null,
        quantity: quantity,
        price: getCurrentPrice(),
      };

      await addToCart(cartItem);
      setError(null);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if (!error && (onNavigate || navigate)) {
      const navigateTo = onNavigate || navigate;
      navigateTo('/checkout');
    }
  };

  const handleQuantityChange = (newQuantity) => {
    const maxQuantity = getCurrentStock();
    const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity || 999));
    setQuantity(validQuantity);
  };

  const handleVariantSelect = (variant) => {
    if (variant.is_active && (variant.stock_quantity > 0 || product.allow_backorders)) {
      setSelectedVariant(variant);
      setQuantity(1);
    }
  };

  const getCurrentPrice = () => {
    return selectedVariant?.price || product?.price || 0;
  };

  const getCurrentStock = () => {
    if (!product?.track_inventory) return null;
    return selectedVariant?.stock_quantity ?? product?.stock_quantity ?? 0;
  };

  const isProductAvailable = () => {
    if (!product?.is_active || product?.status !== 'published') return false;
    if (!product?.track_inventory) return true;
    
    const stock = getCurrentStock();
    return stock > 0 || product?.allow_backorders;
  };

  const getStockMessage = () => {
    if (!product?.track_inventory) {
      return { message: 'Available', className: 'in-stock' };
    }

    const stock = getCurrentStock();
    if (stock === 0) {
      if (product?.allow_backorders) {
        return { message: 'Available on Backorder', className: 'backorder' };
      }
      return { message: 'Out of Stock', className: 'out-of-stock' };
    }

    if (stock <= (product?.low_stock_threshold || 10)) {
      return { message: `Low Stock (${stock} available)`, className: 'low-stock' };
    }

    return { message: `In Stock (${stock} available)`, className: 'in-stock' };
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="product-page-loading">
        <LoadingSpinner size="large" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="product-page-error">
        <Alert type="error" title="Error Loading Product">
          {error}
        </Alert>
        <button onClick={() => (onNavigate || navigate)(-1)} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page-not-found">
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => (onNavigate || navigate)('/')} className="btn btn-primary">
          Return to Home
        </button>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();
  const isAvailable = isProductAvailable();
  const stockInfo = getStockMessage();
  const cartQuantity = getCartItemQuantity ? getCartItemQuantity(product.id, selectedVariant?.id) : 0;

  return (
    <div className="product-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => (onNavigate || navigate)('/')} className="breadcrumb-link">
            Home
          </button>
          <span className="breadcrumb-separator">/</span>
          {product.category && (
            <>
              <button
                onClick={() => (onNavigate || navigate)(`/categories/${
                  typeof product.category === 'object' ? product.category.slug : 'category'
                }`)}
                className="breadcrumb-link"
              >
                {typeof product.category === 'object' ? product.category.name : product.category}
              </button>
              <span className="breadcrumb-separator">/</span>
            </>
          )}
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <div className="product-details">
          {/* Left Column - Images */}
          <div className="product-images-section">
            <ProductImageGallery images={product.images || []} productName={product.name} />
          </div>

          {/* Right Column - Product Info */}
          <div className="product-info-section">
            <div className="product-header">
              <div className="product-badges">
                {product.is_featured && <span className="badge badge-featured">Featured</span>}
                {product.is_on_sale && (
                  <span className="badge badge-sale">{product.discount_percentage || 0}% OFF</span>
                )}
                {!isAvailable && <span className="badge badge-out-of-stock">Out of Stock</span>}
                {product.condition && product.condition !== 'new' && (
                  <span className="badge badge-condition">
                    {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
                  </span>
                )}
              </div>

              <h1 className="product-title">{product.name}</h1>

              {product.short_description && (
                <p className="product-subtitle">{product.short_description}</p>
              )}

              {/* Rating */}
              {product.rating_average > 0 && (
                <div className="product-rating">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${star <= Math.floor(product.rating_average) ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-text">
                    ({product.rating_average.toFixed(1)}) - {product.review_count} reviews
                  </span>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="product-pricing">
              <div className="price-main">{formatPrice(currentPrice)}</div>
              {product.original_price && product.original_price > currentPrice && (
                <div className="price-original">{formatPrice(product.original_price)}</div>
              )}
              {product.is_on_sale && (
                <div className="savings">
                  Save {formatPrice((product.original_price || currentPrice) - currentPrice)}
                  ({product.discount_percentage || 0}%)
                </div>
              )}
            </div>

            {/* Product Meta */}
            <div className="product-meta">
              {product.sku && (
                <div className="meta-item">
                  <span className="meta-label">SKU:</span>
                  <span className="meta-value">{selectedVariant?.sku || product.sku}</span>
                </div>
              )}
              {product.brand && (
                <div className="meta-item">
                  <span className="meta-label">Brand:</span>
                  <span className="meta-value">{product.brand}</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-label">Availability:</span>
                <span className={`meta-value ${stockInfo.className}`}>
                  {stockInfo.message}
                </span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="product-error">
                <Alert type="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="product-variants">
                <h3>Options</h3>
                <div className="variants-grid">
                  {product.variants.filter(v => v.is_active).map(variant => {
                    const isUnavailable = product.track_inventory && 
                      variant.stock_quantity === 0 && 
                      !product.allow_backorders;
                    
                    return (
                      <button
                        key={variant.id}
                        className={`variant-option ${
                          selectedVariant?.id === variant.id ? 'selected' : ''
                        } ${isUnavailable ? 'disabled' : ''}`}
                        onClick={() => handleVariantSelect(variant)}
                        disabled={isUnavailable}
                      >
                        <div className="variant-name">{variant.name}</div>
                        <div className="variant-price">{formatPrice(variant.price)}</div>
                        {isUnavailable && (
                          <div className="variant-out-of-stock">Out of Stock</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            {isAvailable && (
              <div className="product-actions">
                <div className="quantity-selector">
                  <label htmlFor="quantity">Quantity:</label>
                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max={currentStock || 999}
                      value={quantity}
                      onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="quantity-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={currentStock && quantity >= currentStock}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isAvailable || actionLoading}
                    className={`btn btn-secondary add-to-cart-btn ${actionLoading ? 'loading' : ''}`}
                  >
                    {actionLoading
                      ? 'Adding...'
                      : cartQuantity > 0
                        ? `Update Cart (${cartQuantity})`
                        : 'Add to Cart'}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!isAvailable || actionLoading}
                    className={`btn btn-primary buy-now-btn ${actionLoading ? 'loading' : ''}`}
                  >
                    {actionLoading ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            )}

            {!isAvailable && (
              <div className="out-of-stock-actions">
                <button disabled className="btn btn-secondary out-of-stock-btn">
                  Out of Stock
                </button>
                <p className="notify-text">
                  This product is currently unavailable. Check back later!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="product-tabs">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            {((product.attributes && product.attributes.length > 0) || product.brand || product.model) && (
              <button
                className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
              >
                Specifications
              </button>
            )}
          </div>

          <div className="tabs-content">
            {activeTab === 'description' && (
              <div className="tab-panel description-panel">
                <div className="product-description">
                  {product.description ? (
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  ) : (
                    <p>No detailed description available.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="tab-panel specifications-panel">
                <ProductSpecifications
                  attributes={product.attributes || []}
                  productDetails={{
                    weight: product.weight,
                    dimensions: product.dimensions,
                    color: product.color,
                    size: product.size,
                    material: product.material,
                    brand: product.brand,
                    model: product.model,
                    condition: product.condition,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2>Related Products</h2>
            <div className="related-products-grid">
              {relatedProducts.map(relatedProduct => (
                <div key={relatedProduct.id} className="related-product-card">
                  <div className="related-product-image">
                    <img
                      src={
                        relatedProduct.thumbnail_url || 
                        relatedProduct.image_url || 
                        '/assets/placeholders/product-placeholder.jpg'
                      }
                      alt={relatedProduct.name}
                      onClick={() => (onNavigate || navigate)(`/products/${relatedProduct.slug}`)}
                    />
                  </div>
                  <div className="related-product-info">
                    <h4
                      className="related-product-name"
                      onClick={() => (onNavigate || navigate)(`/products/${relatedProduct.slug}`)}
                    >
                      {relatedProduct.name}
                    </h4>
                    <div className="related-product-price">
                      {formatPrice(relatedProduct.price)}
                      {relatedProduct.original_price &&
                        relatedProduct.original_price > relatedProduct.price && (
                        <span className="related-product-original-price">
                          {formatPrice(relatedProduct.original_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;