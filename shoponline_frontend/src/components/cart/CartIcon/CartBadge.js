import React, { useState, useEffect } from 'react';

const CartBadge = ({
  count = 0,
  variant = 'header', // 'header', 'mobile', 'fab'
  maxCount = 99,
  showZero = false,
  animate = true,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  // Animate badge when count changes
  useEffect(() => {
    if (animate && count !== prevCount && count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount, animate]);

  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  const getBadgeClasses = () => {
    const baseClasses = ['cart-badge'];

    baseClasses.push(`cart-badge-${variant}`);

    if (isAnimating) baseClasses.push('cart-badge-animate');
    if (count === 0) baseClasses.push('cart-badge-empty');
    if (count > maxCount) baseClasses.push('cart-badge-overflow');

    return baseClasses.join(' ');
  };

  const getDisplayCount = () => {
    if (count === 0) return '0';
    if (count > maxCount) return `${maxCount}+`;
    return count.toString();
  };

  const getAriaLabel = () => {
    if (count === 0) return 'No items in cart';
    if (count === 1) return '1 item in cart';
    if (count > maxCount) return `More than ${maxCount} items in cart`;
    return `${count} items in cart`;
  };

  return (
    <span className={getBadgeClasses()} aria-label={getAriaLabel()} role="status">
      {getDisplayCount()}
    </span>
  );
};

export default CartBadge;
