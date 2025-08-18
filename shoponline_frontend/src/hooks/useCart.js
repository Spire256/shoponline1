// src/hooks/useCart.js
import { useContext, useCallback, useMemo } from 'react';
import CartContext from '../contexts/CartContext';

/**
 * Custom hook for cart functionality
 * Provides access to cart state and methods with additional utilities
 */
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  const {
    items,
    totalItems,
    subtotal,
    totalSavings,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyFlashSale,
    removeFlashSale,
    getCartItem,
    isInCart,
    getCartSummary,
    validateCart,
    clearError,
  } = context;

  // Enhanced add to cart with validation and feedback
  const addItemToCart = useCallback(
    async (product, quantity = 1, options = {}) => {
      try {
        // Basic validation
        if (!product || !product.id) {
          return { success: false, error: 'Invalid product' };
        }

        if (quantity <= 0) {
          return { success: false, error: 'Quantity must be positive' };
        }

        if (quantity > 10) {
          return { success: false, error: 'Maximum quantity is 10 per item' };
        }

        // Check if already in cart and calculate total quantity
        const existingItem = getCartItem(product.id);
        const totalQuantity = (existingItem?.quantity || 0) + quantity;

        if (totalQuantity > product.stock_quantity) {
          return {
            success: false,
            error: `Only ${product.stock_quantity} items available`,
          };
        }

        // Add flash sale data if provided
        const flashSaleData = options.flashSale
          ? {
              flashSalePrice: options.flashSale.price,
              discount: options.flashSale.discount,
            }
          : null;

        const result = await addToCart(product, quantity, flashSaleData);

        if (result.success) {
          console.log(`Added ${quantity} x ${product.name} to cart`);
        }

        return result;
      } catch (error) {
        console.error('Add to cart error:', error);
        return { success: false, error: 'Failed to add item to cart' };
      }
    },
    [addToCart, getCartItem]
  );

  // Enhanced quantity update with validation
  const updateItemQuantity = useCallback(
    async (productId, newQuantity) => {
      try {
        const cartItem = getCartItem(productId);

        if (!cartItem) {
          return { success: false, error: 'Item not found in cart' };
        }

        if (newQuantity < 0) {
          return { success: false, error: 'Quantity cannot be negative' };
        }

        if (newQuantity === 0) {
          return removeFromCart(productId);
        }

        if (newQuantity > 10) {
          return { success: false, error: 'Maximum quantity is 10 per item' };
        }

        const result = await updateQuantity(productId, newQuantity);

        if (result.success) {
          console.log(`Updated quantity to ${newQuantity} for product ${productId}`);
        }

        return result;
      } catch (error) {
        console.error('Update quantity error:', error);
        return { success: false, error: 'Failed to update quantity' };
      }
    },
    [updateQuantity, getCartItem, removeFromCart]
  );

  // Enhanced remove item with confirmation
  const removeItemFromCart = useCallback(
    (productId, options = {}) => {
      try {
        const cartItem = getCartItem(productId);

        if (!cartItem) {
          return { success: false, error: 'Item not found in cart' };
        }

        const result = removeFromCart(productId);

        if (result.success) {
          console.log(`Removed ${cartItem.product.name} from cart`);

          // Could show undo notification here
          if (options.showUndo) {
            // Implementation for undo functionality
          }
        }

        return result;
      } catch (error) {
        console.error('Remove from cart error:', error);
        return { success: false, error: 'Failed to remove item from cart' };
      }
    },
    [removeFromCart, getCartItem]
  );

  // Clear entire cart with confirmation
  const clearEntireCart = useCallback(
    (confirmed = false) => {
      if (!confirmed && items.length > 0) {
        return { success: false, error: 'Confirmation required to clear cart' };
      }

      try {
        clearCart();
        console.log('Cart cleared successfully');
        return { success: true };
      } catch (error) {
        console.error('Clear cart error:', error);
        return { success: false, error: 'Failed to clear cart' };
      }
    },
    [clearCart, items.length]
  );

  // Get enhanced cart summary with delivery calculations
  const getEnhancedCartSummary = useCallback(() => {
    const summary = getCartSummary();

    // Calculate tax (example: 0% for Uganda)
    const taxRate = 0.0;
    const taxAmount = Math.round(summary.subtotal * taxRate);

    // Calculate final total
    const finalTotal = summary.subtotal + summary.deliveryFee + taxAmount;

    return {
      ...summary,
      taxAmount,
      taxRate,
      finalTotal,
      itemsCount: totalItems,
      hasFlashSaleItems: items.some(item => item.isFlashSaleItem),
      flashSaleSavings: totalSavings,
    };
  }, [getCartSummary, totalItems, items, totalSavings]);

  // Check if cart qualifies for free delivery
  const qualifiesForFreeDelivery = useMemo(() => {
    const FREE_DELIVERY_THRESHOLD = 50000; // 50,000 UGX
    return subtotal >= FREE_DELIVERY_THRESHOLD;
  }, [subtotal]);

  // Calculate amount needed for free delivery
  const amountNeededForFreeDelivery = useMemo(() => {
    const FREE_DELIVERY_THRESHOLD = 50000;
    if (qualifiesForFreeDelivery) return 0;
    return FREE_DELIVERY_THRESHOLD - subtotal;
  }, [subtotal, qualifiesForFreeDelivery]);

  // Get cart items grouped by category
  const getItemsByCategory = useMemo(() => {
    const grouped = {};

    items.forEach(item => {
      const category = item.product.category?.name || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }, [items]);

  // Get flash sale items only
  const getFlashSaleItems = useMemo(() => {
    return items.filter(item => item.isFlashSaleItem);
  }, [items]);

  // Get regular items only
  const getRegularItems = useMemo(() => {
    return items.filter(item => !item.isFlashSaleItem);
  }, [items]);

  // Calculate total weight for shipping
  const getTotalWeight = useMemo(() => {
    return items.reduce((total, item) => {
      const weight = item.product.weight || 0;
      return total + weight * item.quantity;
    }, 0);
  }, [items]);

  // Check if cart has out of stock items
  const hasOutOfStockItems = useCallback(async () => {
    const validation = await validateCart();
    return !validation.valid && validation.error.includes('available');
  }, [validateCart]);

  // Get recommended products based on cart content
  const getRecommendedProducts = useCallback(
    (allProducts = []) => {
      if (items.length === 0) return [];

      // Get categories of items in cart
      const cartCategories = [
        ...new Set(items.map(item => item.product.category?.id).filter(Boolean)),
      ];

      // Find products from same categories not in cart
      const recommendations = allProducts
        .filter(
          product =>
            cartCategories.includes(product.category?.id) &&
            !isInCart(product.id) &&
            product.is_active &&
            product.stock_quantity > 0
        )
        .slice(0, 4); // Limit to 4 recommendations

      return recommendations;
    },
    [items, isInCart]
  );

  // Estimate delivery time based on location
  const estimateDeliveryTime = useCallback((district = '') => {
    const kampalaDistricts = ['Kampala', 'Wakiso', 'Mukono', 'Entebbe'];

    if (kampalaDistricts.includes(district)) {
      return '1-2 business days';
    } else {
      return '3-5 business days';
    }
  }, []);

  // Export cart data for backup/sharing
  const exportCartData = useCallback(() => {
    const cartData = {
      items: items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        isFlashSaleItem: item.isFlashSaleItem,
      })),
      summary: getEnhancedCartSummary(),
      exportDate: new Date().toISOString(),
    };

    return cartData;
  }, [items, getEnhancedCartSummary]);

  // Import cart data from backup
  const importCartData = useCallback(
    async cartData => {
      try {
        if (!cartData || !cartData.items) {
          return { success: false, error: 'Invalid cart data' };
        }

        // Clear current cart first
        clearCart();

        // Add items from backup
        const results = await Promise.all(
          cartData.items.map(item =>
            addItemToCart({ id: item.productId, name: item.productName }, item.quantity, {
              flashSale: item.isFlashSaleItem ? { price: item.price } : null,
            })
          )
        );

        const failed = results.filter(r => !r.success);

        if (failed.length === 0) {
          return { success: true, message: 'Cart imported successfully' };
        } else {
          return {
            success: false,
            error: `Failed to import ${failed.length} items`,
            partialSuccess: true,
          };
        }
      } catch (error) {
        return { success: false, error: 'Failed to import cart data' };
      }
    },
    [addItemToCart, clearCart]
  );

  // Clear cart error
  const clearCartError = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    // State
    items,
    totalItems,
    subtotal,
    totalSavings,
    isLoading,
    error,

    // Enhanced Actions
    addToCart: addItemToCart,
    updateQuantity: updateItemQuantity,
    removeFromCart: removeItemFromCart,
    clearCart: clearEntireCart,
    clearError: clearCartError,

    // Flash Sale Actions
    applyFlashSale,
    removeFlashSale,

    // Utilities
    getCartItem,
    isInCart,
    getCartSummary: getEnhancedCartSummary,
    validateCart,

    // Computed Properties
    qualifiesForFreeDelivery,
    amountNeededForFreeDelivery,
    isEmpty: items.length === 0,
    hasItems: items.length > 0,

    // Grouped Data
    getItemsByCategory,
    getFlashSaleItems,
    getRegularItems,

    // Additional Utilities
    getTotalWeight,
    hasOutOfStockItems,
    getRecommendedProducts,
    estimateDeliveryTime,
    exportCartData,
    importCartData,
  };
};

export default useCart;