import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { productsAPI } from '../../services/api/productsAPI';
import ProductImageGallery from './ProductImageGallery';
import ProductSpecifications from './ProductSpecifications';
import './ProductPage.css';

const ProductPage = ({ productSlug, onNavigate }) => {
  const { addToCart, isInCart, getCartItemQuantity } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Mock product data for demonstration
  const mockProduct = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description: `<h3>Experience the Future of Mobile Technology</h3>
    <p>The Samsung Galaxy S24 Ultra represents the pinnacle of smartphone innovation, combining cutting-edge technology with elegant design. This flagship device delivers unparalleled performance, stunning photography capabilities, and productivity features that redefine what's possible on a mobile device.</p>
    
    <h4>Key Features:</h4>
    <ul>
      <li>6.8" Dynamic AMOLED 2X Display with 120Hz refresh rate</li>
      <li>200MP main camera with advanced AI photography</li>
      <li>S Pen integration for enhanced productivity</li>
      <li>5000mAh battery with fast charging</li>
      <li>Snapdragon 8 Gen 3 processor</li>
      <li>IP68 water and dust resistance</li>
    </ul>
    
    <p>Whether you're capturing memories, creating content, or staying productive, the Galaxy S24 Ultra adapts to your lifestyle with intelligent features and seamless performance.</p>`,
    short_description: 'Flagship smartphone with 200MP camera, S Pen, and premium features',
    category: {
      id: 'cat-1',
      name: 'Smartphones',
      slug: 'smartphones',
    },
    price: 4500000, // UGX
    original_price: 5000000,
    sku: 'SMG-S24U-512-TIT',
    stock_quantity: 15,
    is_active: true,
    is_featured: true,
    is_in_stock: true,
    is_low_stock: false,
    is_on_sale: true,
    discount_percentage: 10,
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    color: 'Titanium Gray',
    weight: 232,
    dimensions: '162.3 x 79.0 x 8.6 mm',
    condition: 'new',
    track_inventory: true,
    rating_average: 4.8,
    review_count: 124,
    images: [
      {
        id: 'img-1',
        image_url:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop',
        thumbnail_url:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&h=150&fit=crop',
        alt_text: 'Samsung Galaxy S24 Ultra front view',
        is_main: true,
        position: 0,
      },
      {
        id: 'img-2',
        image_url:
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=600&fit=crop',
        thumbnail_url:
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=150&h=150&fit=crop',
        alt_text: 'Samsung Galaxy S24 Ultra back view',
        is_main: false,
        position: 1,
      },
    ],
    attributes: [
      {
        id: 'attr-1',
        name: 'Display',
        value: '6.8" Dynamic AMOLED 2X, 3120x1440, 120Hz',
        position: 0,
      },
      { id: 'attr-2', name: 'Processor', value: 'Snapdragon 8 Gen 3', position: 1 },
      { id: 'attr-3', name: 'RAM', value: '12GB', position: 2 },
      { id: 'attr-4', name: 'Storage', value: '512GB', position: 3 },
      { id: 'attr-5', name: 'Main Camera', value: '200MP + 50MP + 12MP + 10MP', position: 4 },
      { id: 'attr-6', name: 'Front Camera', value: '12MP', position: 5 },
      { id: 'attr-7', name: 'Battery', value: '5000mAh with 45W fast charging', position: 6 },
      { id: 'attr-8', name: 'Operating System', value: 'Android 14 with One UI 6.1', position: 7 },
    ],
    variants: [
      {
        id: 'var-1',
        name: '256GB Titanium Gray',
        price: 4200000,
        stock_quantity: 8,
        is_active: true,
        sku: 'SMG-S24U-256-TIT',
      },
      {
        id: 'var-2',
        name: '512GB Titanium Gray',
        price: 4500000,
        stock_quantity: 15,
        is_active: true,
        sku: 'SMG-S24U-512-TIT',
      },
      {
        id: 'var-3',
        name: '1TB Titanium Gray',
        price: 4800000,
        stock_quantity: 5,
        is_active: true,
        sku: 'SMG-S24U-1TB-TIT',
      },
    ],
    related_products: [
      {
        id: 'rel-1',
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        price: 4800000,
        original_price: 5200000,
        image_url:
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
      },
      {
        id: 'rel-2',
        name: 'Google Pixel 8 Pro',
        slug: 'google-pixel-8-pro',
        price: 3800000,
        image_url:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
      },
    ],
  };

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setProduct(mockProduct);
      setRelatedProducts(mockProduct.related_products);
      if (mockProduct.variants?.length > 0) {
        setSelectedVariant(mockProduct.variants[1]); // Select 512GB variant by default
      }
      setLoading(false);
    }, 1000);
  }, [productSlug]);

  const handleAddToCart = async () => {
    if (!product) return;

    const canPurchase = product.is_in_stock && product.is_active;
    if (!canPurchase) {
      setError('This product is currently unavailable.');
      return;
    }

    if (product.track_inventory && getCurrentStock() < quantity) {
      setError(`Only ${getCurrentStock()} items available in stock.`);
      return;
    }

    try {
      setAddingToCart(true);

      const cartItem = {
        product_id: product.id,
        variant_id: selectedVariant?.id,
        quantity: quantity,
        price: selectedVariant?.price || product.price,
      };

      await addToCart(cartItem);
      setError(null);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if (!error && onNavigate) {
      onNavigate('/checkout');
    }
  };

  const handleQuantityChange = newQuantity => {
    const maxQuantity = product?.track_inventory ? getCurrentStock() : 999;
    const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
    setQuantity(validQuantity);
  };

  const handleVariantSelect = variant => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const getCurrentPrice = () => {
    return selectedVariant?.price || product?.price || 0;
  };

  const getCurrentStock = () => {
    return selectedVariant?.stock_quantity ?? product?.stock_quantity ?? 0;
  };

  const formatPrice = price => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="product-page-loading">
        <div className="loading-spinner" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="product-page-error">
        <div className="error-message">{error}</div>
        <button onClick={() => onNavigate && onNavigate(-1)} className="btn btn-secondary">
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
        <button onClick={() => onNavigate && onNavigate('/')} className="btn btn-primary">
          Return to Home
        </button>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const currentStock = getCurrentStock();
  const isInStock =
    product.is_in_stock && (selectedVariant ? selectedVariant.stock_quantity > 0 : true);
  const cartQuantity = getCartItemQuantity
    ? getCartItemQuantity(product.id, selectedVariant?.id)
    : 0;

  return (
    <div className="product-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => onNavigate && onNavigate('/')} className="breadcrumb-link">
            Home
          </button>
          <span className="breadcrumb-separator">/</span>
          <button
            onClick={() => onNavigate && onNavigate(`/category/${product.category.slug}`)}
            className="breadcrumb-link"
          >
            {product.category.name}
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <div className="product-details">
          {/* Left Column - Images */}
          <div className="product-images-section">
            <ProductImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Right Column - Product Info */}
          <div className="product-info-section">
            <div className="product-header">
              <h1 className="product-title">{product.name}</h1>

              <div className="product-badges">
                {product.is_featured && <span className="badge badge-featured">Featured</span>}
                {product.is_on_sale && (
                  <span className="badge badge-sale">{product.discount_percentage}% OFF</span>
                )}
                {!isInStock && <span className="badge badge-out-of-stock">Out of Stock</span>}
                {product.is_low_stock && isInStock && (
                  <span className="badge badge-warning">Low Stock</span>
                )}
              </div>

              {/* Rating */}
              {product.rating_average > 0 && (
                <div className="product-rating">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${star <= product.rating_average ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-text">
                    ({product.rating_average}) - {product.review_count} reviews
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
                  Save{' '}
                  {formatPrice(
                    (selectedVariant?.price ? product.original_price : product.original_price) -
                      currentPrice
                  )}
                  ({product.discount_percentage}%)
                </div>
              )}
            </div>

            {/* Product Meta */}
            <div className="product-meta">
              <div className="meta-item">
                <span className="meta-label">SKU:</span>
                <span className="meta-value">{selectedVariant?.sku || product.sku}</span>
              </div>
              {product.brand && (
                <div className="meta-item">
                  <span className="meta-label">Brand:</span>
                  <span className="meta-value">{product.brand}</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-label">Availability:</span>
                <span className={`meta-value ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
                  {isInStock ? `In Stock (${currentStock} available)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <div className="product-short-description">
                <p>{product.short_description}</p>
              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="product-variants">
                <h3>Options</h3>
                <div className="variants-grid">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      className={`variant-option ${
                        selectedVariant?.id === variant.id ? 'selected' : ''
                      } ${!variant.is_active || variant.stock_quantity <= 0 ? 'disabled' : ''}`}
                      onClick={() => handleVariantSelect(variant)}
                      disabled={!variant.is_active || variant.stock_quantity <= 0}
                    >
                      <div className="variant-name">{variant.name}</div>
                      <div className="variant-price">{formatPrice(variant.price)}</div>
                      {variant.stock_quantity <= 0 && (
                        <div className="variant-out-of-stock">Out of Stock</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            {isInStock && (
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
                      max={product.track_inventory ? currentStock : 999}
                      value={quantity}
                      onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="quantity-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={product.track_inventory && quantity >= currentStock}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock || addingToCart}
                    className={`btn btn-secondary add-to-cart-btn ${addingToCart ? 'loading' : ''}`}
                  >
                    {addingToCart
                      ? 'Adding...'
                      : cartQuantity > 0
                        ? `Update Cart (${cartQuantity})`
                        : 'Add to Cart'}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!isInStock || addingToCart}
                    className={`btn btn-primary buy-now-btn ${addingToCart ? 'loading' : ''}`}
                  >
                    {addingToCart ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>

                {error && <div className="alert alert-error product-error">{error}</div>}
              </div>
            )}

            {!isInStock && (
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
            {product.attributes && product.attributes.length > 0 && (
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

            {activeTab === 'specifications' && product.attributes && (
              <div className="tab-panel specifications-panel">
                <ProductSpecifications
                  attributes={product.attributes}
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
                        relatedProduct.image_url || '/assets/placeholders/product-placeholder.jpg'
                      }
                      alt={relatedProduct.name}
                      onClick={() => onNavigate && onNavigate(`/product/${relatedProduct.slug}`)}
                    />
                  </div>
                  <div className="related-product-info">
                    <h4
                      className="related-product-name"
                      onClick={() => onNavigate && onNavigate(`/product/${relatedProduct.slug}`)}
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
