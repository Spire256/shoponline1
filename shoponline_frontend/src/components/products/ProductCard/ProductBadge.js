// src/components/products/ProductCard/ProductBadge.js
import React from 'react';
import { Flame, Star, AlertTriangle, Info } from 'lucide-react';

const ProductBadge = ({ type, text, icon, className = '', size = 'small' }) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'sale':
        return {
          className: 'product-badge--sale',
          icon: icon || <Flame size={12} />,
          bgColor: '#ef4444',
          textColor: '#ffffff',
        };

      case 'featured':
        return {
          className: 'product-badge--featured',
          icon: icon || <Star size={12} />,
          bgColor: '#f59e0b',
          textColor: '#ffffff',
        };

      case 'out-of-stock':
        return {
          className: 'product-badge--out-of-stock',
          icon: icon || <AlertTriangle size={12} />,
          bgColor: '#64748b',
          textColor: '#ffffff',
        };

      case 'new':
        return {
          className: 'product-badge--new',
          icon: icon || null,
          bgColor: '#10b981',
          textColor: '#ffffff',
        };

      case 'condition':
        return {
          className: 'product-badge--condition',
          icon: icon || <Info size={12} />,
          bgColor: '#6366f1',
          textColor: '#ffffff',
        };

      case 'flash-sale':
        return {
          className: 'product-badge--flash-sale',
          icon: icon || <Flame size={12} />,
          bgColor: '#dc2626',
          textColor: '#ffffff',
        };

      case 'limited':
        return {
          className: 'product-badge--limited',
          icon: icon || <AlertTriangle size={12} />,
          bgColor: '#7c3aed',
          textColor: '#ffffff',
        };

      case 'best-seller':
        return {
          className: 'product-badge--best-seller',
          icon: icon || <Star size={12} />,
          bgColor: '#059669',
          textColor: '#ffffff',
        };

      default:
        return {
          className: 'product-badge--default',
          icon: icon || null,
          bgColor: '#2563eb',
          textColor: '#ffffff',
        };
    }
  };

  const config = getBadgeConfig();

  const badgeStyle = {
    backgroundColor: config.bgColor,
    color: config.textColor,
  };

  return (
    <div
      className={`product-badge product-badge--${size} ${config.className} ${className}`}
      style={badgeStyle}
      title={text}
    >
      {config.icon && <span className="product-badge__icon">{config.icon}</span>}
      <span className="product-badge__text">{text}</span>
    </div>
  );
};

// Predefined badge components for common use cases
export const SaleBadge = ({ discount, className = '' }) => (
  <ProductBadge type="sale" text={`${discount}% OFF`} className={className} />
);

export const FeaturedBadge = ({ className = '' }) => (
  <ProductBadge type="featured" text="Featured" className={className} />
);

export const OutOfStockBadge = ({ className = '' }) => (
  <ProductBadge type="out-of-stock" text="Out of Stock" className={className} />
);

export const NewBadge = ({ className = '' }) => (
  <ProductBadge type="new" text="New" className={className} />
);

export const FlashSaleBadge = ({ timeLeft, className = '' }) => (
  <ProductBadge
    type="flash-sale"
    text={timeLeft ? `${timeLeft}` : 'Flash Sale'}
    className={className}
  />
);

export const BestSellerBadge = ({ className = '' }) => (
  <ProductBadge type="best-seller" text="Best Seller" className={className} />
);

export const LimitedBadge = ({ quantity, className = '' }) => (
  <ProductBadge
    type="limited"
    text={quantity ? `Only ${quantity} left` : 'Limited'}
    className={className}
  />
);

export const ConditionBadge = ({ condition, className = '' }) => (
  <ProductBadge
    type="condition"
    text={condition.charAt(0).toUpperCase() + condition.slice(1)}
    className={className}
  />
);

// CSS-in-JS styles for the badges
const badgeStyles = `
.product-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  z-index: 2;
}

.product-badge--small {
  padding: 3px 6px;
  font-size: 10px;
}

.product-badge--medium {
  padding: 5px 10px;
  font-size: 12px;
}

.product-badge--large {
  padding: 6px 12px;
  font-size: 13px;
}

.product-badge__icon {
  display: flex;
  align-items: center;
}

.product-badge__text {
  line-height: 1;
}

/* Specific badge type styles */
.product-badge--sale {
  animation: pulse-sale 2s infinite;
}

.product-badge--flash-sale {
  animation: flash-glow 1.5s ease-in-out infinite alternate;
}

.product-badge--featured {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.product-badge--new {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.product-badge--best-seller {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

@keyframes pulse-sale {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes flash-glow {
  0% {
    box-shadow: 0 0 5px rgba(220, 38, 38, 0.5);
  }
  100% {
    box-shadow: 0 0 15px rgba(220, 38, 38, 0.8), 0 0 25px rgba(220, 38, 38, 0.4);
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .product-badge {
    padding: 2px 6px;
    font-size: 9px;
    gap: 2px;
  }
  
  .product-badge__icon svg {
    width: 10px;
    height: 10px;
  }
}
`;

// Inject styles into head if not already present
if (typeof document !== 'undefined' && !document.getElementById('product-badge-styles')) {
  const style = document.createElement('style');
  style.id = 'product-badge-styles';
  style.textContent = badgeStyles;
  document.head.appendChild(style);
}

export default ProductBadge;
