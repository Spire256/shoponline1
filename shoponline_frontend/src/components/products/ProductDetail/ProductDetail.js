// src/components/products/ProductDetail/ProductDetail.js - Updated for backend integration
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  Star,
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';
import ProductImages from './ProductImages';
import ProductInfo from './ProductInfo';
import ProductActions from './ProductActions';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import productsAPI from '../../../services/api/productsAPI';
import { useCart } from '../../../hooks/useCart';
import { useAuth } from '../../../hooks/useAuth';
import LoadingSpinner from '../../common/UI/Loading/Spinner';
import './ProductDetail.css';

const ProductDetail = ({ productSlug, onBack }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const currentSlug = productSlug || slug;

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { user } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();

  // Load product data
  useEffect(() => {
    if (currentSlug) {
      loadProduct();
    }
  }, [currentSlug]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get product by slug
      const productData = await productsAPI.getProductBySlug(currentSlug);
      setProduct(productData);

      // Set default variant if available
      if (productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }

      // Load related products
      if (productData.category) {
        const categoryId = typeof productData.category === 'object' 
          ? productData.category.id 
          : productData.category;
        
        try {
          const relatedResponse = await productsAPI.getProductsByCategory(categoryId, {
            page_size: 4,
            exclude: productData.id
          });
          setRelatedProducts(relatedResponse.results || []);
        } catch (relatedError) {
          console.error('Error loading related products:', relatedError);
          // Don't fail the whole component if related products fail
        }
      }

      // Increment view count
      try {
        await productsAPI.incrementViewCount(productData.id);
      } catch (viewError) {
        console.error('Error incrementing view count:', viewError);
        // Don't fail if view count increment fails
      }

    } catch (err) {
      console.error('Error loading product:', err);
      setError(err.message || 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleQuantityChange = newQuantity => {
    const maxQuantity = getCurrentStock();
    const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity || 999));
    setQuantity(validQuantity);
  };

  const handleAddToCart = async () => {
    if (!isProductAvailable()) return;

    setActionLoading(true);
    try {
      const cartItem = {
        product: product,
        variant: selectedVariant,
        quantity: quantity,
      };

      await addToCart(cartItem);
      
      // Show success notification (you can implement a toast notification here)
      console.log('Product added to cart successfully');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setError('Failed to add product to cart. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setActionLoading(true);
    try {
      setIsWishlisted(!isWishlisted);
      // TODO: Implement wishlist API call
      console.log('Wishlist toggled:', !isWishlisted);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      setIsWishlisted(!isWishlisted); // Revert on error
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.short_description,
          url: window.location.href,
        });
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // Show success notification
        console.log('URL copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const formatPrice = price => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentPrice = () => {
    return selectedVariant?.price || product?.price || 0;
  };

  const getCurrentStock = () => {
    if (!product?.track_inventory) return null;
    return selectedVariant?.stock_quantity ?? product?.stock_quantity ?? 0;
  };

  const isProductAvailable = () => {
    if (!product?.is_active) return false;
    if (!product?.track_inventory) return true;
    const stock = getCurrentStock();
    return stock > 0 || product?.allow_backorders;
  };

  const getStockMessage = () => {
    if (!product?.track_inventory) {
      return { message: 'Available', type: 'success' };
    }

    const stock = getCurrentStock();
    if (stock === 0) {
      if (product?.allow_backorders) {
        return { message: 'Available on Backorder', type: 'warning' };
      }
      return { message: 'Out of Stock', type: 'error' };
    }

    if (stock <= (product?.low_stock_threshold || 10)) {
      return { message: `Low Stock (${stock} available)`, type: 'warning' };
    }

    return { message: `In Stock (${stock} available)`, type: 'success' };
  };

  const renderBreadcrumbs = () => (
    <nav className="breadcrumbs">
      <button onClick={handleBack} className="back-btn">
        <ArrowLeft size={16} />
        Back
      </button>
      <div className="breadcrumb-trail">
        <span>Home</span>
        <span>/</span>
        {product.category && (
          <>
            <span>
              {typeof product.category === 'object' ? product.category.name : product.category}
            </span>
            <span>/</span>
          </>
        )}
        <span>{product.name}</span>
      </div>
    </nav>
  );

  const renderFeatures = () => (
    <div className="product-features">
      <div className="feature-item">
        <Truck className="feature-icon" size={20} />
        <div className="feature-text">
          <span className="feature-title">Local Delivery</span>
          <span className="feature-desc">Same day delivery available</span>
        </div>
      </div>
      <div className="feature-item">
        <Shield className="feature-icon" size={20} />
        <div className="feature-text">
          <span className="feature-title">Secure Payment</span>
          <span className="feature-desc">MTN & Airtel Money supported</span>
        </div>
      </div>
      <div className="feature-item">
        <RotateCcw className="feature-icon" size={20} />
        <div className="feature-text">
          <span className="feature-title">Return Policy</span>
          <span className="feature-desc">7-day return guarantee</span>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => {
    const tabs = [
      { key: 'description', label: 'Description' },
      { key: 'specifications', label: 'Specifications' },
    ];

    // Only show reviews tab if product has reviews
    if (product.review_count > 0) {
      tabs.push({ key: 'reviews', label: `Reviews (${product.review_count})` });
    }

    return (
      <div className="product-tabs">
        <div className="tab-headers">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-header ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="tab-pane">
              <div className="product-description">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p>No detailed description available.</p>
                )}
              </div>

              {product.attributes && product.attributes.length > 0 && (
                <div className="product-attributes">
                  <h4>Key Features</h4>
                  <ul>
                    {product.attributes.map(attr => (
                      <li key={attr.id}>
                        <strong>{attr.name}:</strong> {attr.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="tab-pane">
              <div className="specifications-grid">
                {[
                  { label: 'Brand', value: product.brand },
                  { label: 'Model', value: product.model },
                  { label: 'Condition', value: product.condition },
                  { label: 'Weight', value: product.weight ? `${product.weight} kg` : null },
                  { label: 'Dimensions', value: product.dimensions },
                  { label: 'Color', value: product.color },
                  { label: 'Size', value: product.size },
                  { label: 'Material', value: product.material },
                  { label: 'SKU', value: product.sku },
                ]
                  .filter(spec => spec.value)
                  .map(spec => (
                    <div key={spec.label} className="spec-item">
                      <span className="spec-label">{spec.label}:</span>
                      <span className="spec-value">{spec.value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="tab-pane">
              <ProductReviews productId={product.id} />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="product-detail__loading">
        <LoadingSpinner size="large" />
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail__error">
        <h3>Product Not Found</h3>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <button onClick={handleBack} className="back-to-products-btn">
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  const stockInfo = getStockMessage();
  const isAvailable = isProductAvailable();

  return (
    <div className="product-detail">
      {renderBreadcrumbs()}

      <div className="product-detail__main">
        {/* Product Images */}
        <div className="product-detail__images">
          <ProductImages
            images={product.images || []}
            selectedIndex={selectedImageIndex}
            onImageSelect={setSelectedImageIndex}
            productName={product.name}
          />
        </div>

        {/* Product Info & Actions */}
        <div className="product-detail__info">
          <div className="product-header">
            <div className="product-badges">
              {product.is_on_sale && (
                <span className="badge badge--sale">{product.discount_percentage || 0}% OFF</span>
              )}
              {product.is_featured && <span className="badge badge--featured">Featured</span>}
              {product.condition !== 'new' && (
                <span className="badge badge--condition">
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
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={star <= Math.floor(product.rating_average) ? 'filled' : ''}
                      size={16}
                    />
                  ))}
                </div>
                <span className="rating-text">
                  {product.rating_average.toFixed(1)} ({product.review_count} reviews)
                </span>
              </div>
            )}

            {/* Category and Brand */}
            <div className="product-meta">
              {product.category && (
                <div className="product-category">
                  Category: <span>
                    {typeof product.category === 'object' ? product.category.name : product.category}
                  </span>
                </div>
              )}
              {product.brand && (
                <div className="product-brand">
                  Brand: <span>{product.brand}</span>
                </div>
              )}
              {product.sku && (
                <div className="product-sku">
                  SKU: <span>{product.sku}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="product-pricing">
            <div className="price-main">
              <span className="current-price">{formatPrice(getCurrentPrice())}</span>
              {product.original_price && product.is_on_sale && (
                <span className="original-price">{formatPrice(product.original_price)}</span>
              )}
            </div>
            {product.is_on_sale && (
              <div className="savings">
                You save {formatPrice(product.original_price - getCurrentPrice())}
              </div>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="product-variants">
              <h4>Options:</h4>
              <div className="variant-options">
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    className={`variant-option ${
                      selectedVariant?.id === variant.id ? 'active' : ''
                    } ${!variant.is_active || (variant.stock_quantity === 0 && !product.allow_backorders) ? 'disabled' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={!variant.is_active || (variant.stock_quantity === 0 && !product.allow_backorders)}
                  >
                    <div className="variant-name">{variant.name}</div>
                    <div className="variant-price">{formatPrice(variant.price)}</div>
                    {variant.stock_quantity === 0 && !product.allow_backorders && (
                      <div className="variant-unavailable">Unavailable</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="stock-status">
            <div className={`stock-message stock-message--${stockInfo.type}`}>
              {stockInfo.type === 'success' && <Check size={16} />}
              {stockInfo.type === 'warning' && <AlertCircle size={16} />}
              {stockInfo.type === 'error' && <AlertCircle size={16} />}
              <span>{stockInfo.message}</span>
            </div>
          </div>

          {/* Quantity & Actions */}
          {isAvailable && (
            <div className="product-actions">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button
                    className="qty-btn"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-display">{quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={getCurrentStock() && quantity >= getCurrentStock()}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={cartLoading || actionLoading || !isAvailable}
                >
                  <ShoppingCart size={20} />
                  {cartLoading || actionLoading ? 'Adding...' : 'Add to Cart'}
                </button>

                <button
                  className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={handleToggleWishlist}
                  disabled={actionLoading}
                >
                  <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>

                <button className="share-btn" onClick={handleShare}>
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Features */}
          {renderFeatures()}
        </div>
      </div>

      {/* Product Tabs */}
      <div className="product-detail__tabs">{renderTabs()}</div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="product-detail__related">
          <RelatedProducts 
            products={relatedProducts} 
            categoryName={
              typeof product.category === 'object' ? product.category.name : product.category
            }
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;