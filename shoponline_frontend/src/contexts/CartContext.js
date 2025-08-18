// src/contexts/CartContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart action types
const CART_ACTIONS = {
  LOAD_CART: 'LOAD_CART',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_FLASH_SALE: 'APPLY_FLASH_SALE',
  REMOVE_FLASH_SALE: 'REMOVE_FLASH_SALE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  totalSavings: 0,
  isLoading: false,
  error: null,
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };

    case CART_ACTIONS.ADD_ITEM: {
      const existingItem = state.items.find(item => item.product.id === action.payload.product.id);

      let newItems;
      if (existingItem) {
        // Update quantity of existing item
        newItems = state.items.map(item =>
          item.product.id === action.payload.product.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }

      return {
        ...state,
        items: newItems,
        ...calculateCartTotals(newItems),
        error: null,
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const newItems = state.items
        .map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
        .filter(item => item.quantity > 0); // Remove items with 0 quantity

      return {
        ...state,
        items: newItems,
        ...calculateCartTotals(newItems),
        error: null,
      };
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const newItems = state.items.filter(item => item.product.id !== action.payload.productId);

      return {
        ...state,
        items: newItems,
        ...calculateCartTotals(newItems),
        error: null,
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...initialState,
      };

    case CART_ACTIONS.APPLY_FLASH_SALE: {
      const newItems = state.items.map(item => {
        if (item.product.id === action.payload.productId) {
          return {
            ...item,
            isFlashSaleItem: true,
            flashSalePrice: action.payload.flashSalePrice,
            originalPrice: item.price,
            flashSaleDiscount: action.payload.discount,
            price: action.payload.flashSalePrice,
          };
        }
        return item;
      });

      return {
        ...state,
        items: newItems,
        ...calculateCartTotals(newItems),
      };
    }

    case CART_ACTIONS.REMOVE_FLASH_SALE: {
      const newItems = state.items.map(item => {
        if (item.product.id === action.payload.productId && item.isFlashSaleItem) {
          return {
            ...item,
            isFlashSaleItem: false,
            price: item.originalPrice || item.product.price,
            flashSalePrice: null,
            originalPrice: null,
            flashSaleDiscount: 0,
          };
        }
        return item;
      });

      return {
        ...state,
        items: newItems,
        ...calculateCartTotals(newItems),
      };
    }

    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Helper function to calculate cart totals
const calculateCartTotals = items => {
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const subtotal = items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  const totalSavings = items.reduce((total, item) => {
    if (item.isFlashSaleItem && item.originalPrice) {
      const savings = (item.originalPrice - item.price) * item.quantity;
      return total + savings;
    }
    return total;
  }, 0);

  return {
    totalItems,
    subtotal: Math.round(subtotal),
    totalSavings: Math.round(totalSavings),
  };
};

// Create context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          dispatch({
            type: CART_ACTIONS.LOAD_CART,
            payload: cartData,
          });
        } else {
          dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
        dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem(
        'cart',
        JSON.stringify({
          items: state.items,
          totalItems: state.totalItems,
          subtotal: state.subtotal,
          totalSavings: state.totalSavings,
        })
      );
    }
  }, [state.items, state.totalItems, state.subtotal, state.totalSavings, state.isLoading]);

  // Add item to cart
  const addToCart = async (product, quantity = 1, flashSaleData = null) => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

    try {
      // Check product availability
      const response = await fetch(`/api/products/${product.id}/`);
      if (!response.ok) {
        throw new Error('Product not available');
      }

      const productData = await response.json();

      // Check stock
      if (productData.stock_quantity < quantity) {
        throw new Error(`Only ${productData.stock_quantity} items available`);
      }

      const cartItem = {
        product: productData,
        quantity,
        price: flashSaleData ? flashSaleData.flashSalePrice : productData.price,
        isFlashSaleItem: Boolean(flashSaleData),
        flashSalePrice: flashSaleData?.flashSalePrice || null,
        originalPrice: flashSaleData ? productData.price : null,
        flashSaleDiscount: flashSaleData?.discount || 0,
        addedAt: new Date().toISOString(),
      };

      dispatch({
        type: CART_ACTIONS.ADD_ITEM,
        payload: cartItem,
      });

      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

    try {
      // Check stock availability
      const response = await fetch(`/api/products/${productId}/`);
      if (!response.ok) {
        throw new Error('Product not available');
      }

      const productData = await response.json();

      if (productData.stock_quantity < quantity) {
        throw new Error(`Only ${productData.stock_quantity} items available`);
      }

      dispatch({
        type: CART_ACTIONS.UPDATE_QUANTITY,
        payload: { productId, quantity },
      });

      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Remove item from cart
  const removeFromCart = productId => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { productId },
    });
    return { success: true };
  };

  // Clear entire cart
  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    localStorage.removeItem('cart');
  };

  // Apply flash sale to item
  const applyFlashSale = (productId, flashSalePrice, discount) => {
    dispatch({
      type: CART_ACTIONS.APPLY_FLASH_SALE,
      payload: {
        productId,
        flashSalePrice,
        discount,
      },
    });
  };

  // Remove flash sale from item
  const removeFlashSale = productId => {
    dispatch({
      type: CART_ACTIONS.REMOVE_FLASH_SALE,
      payload: { productId },
    });
  };

  // Get item by product ID
  const getCartItem = productId => {
    return state.items.find(item => item.product.id === productId);
  };

  // Check if product is in cart
  const isInCart = productId => {
    return state.items.some(item => item.product.id === productId);
  };

  // Get cart summary
  const getCartSummary = () => {
    return {
      totalItems: state.totalItems,
      subtotal: state.subtotal,
      totalSavings: state.totalSavings,
      deliveryFee: calculateDeliveryFee(state.subtotal),
      total: state.subtotal + calculateDeliveryFee(state.subtotal),
    };
  };

  // Calculate delivery fee (example logic)
  const calculateDeliveryFee = subtotal => {
    const FREE_DELIVERY_THRESHOLD = 50000; // 50,000 UGX
    const STANDARD_DELIVERY_FEE = 5000; // 5,000 UGX

    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  };

  // Validate cart for checkout
  const validateCart = async () => {
    if (state.items.length === 0) {
      return { valid: false, error: 'Cart is empty' };
    }

    try {
      // Check each item's availability and stock
      for (const item of state.items) {
        const response = await fetch(`/api/products/${item.product.id}/`);
        if (!response.ok) {
          return {
            valid: false,
            error: `${item.product.name} is no longer available`,
          };
        }

        const productData = await response.json();
        if (productData.stock_quantity < item.quantity) {
          return {
            valid: false,
            error: `Only ${productData.stock_quantity} units of ${item.product.name} available`,
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Failed to validate cart items' };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: CART_ACTIONS.SET_ERROR, payload: null });
  };

  // Context value
  const value = {
    // State
    items: state.items,
    totalItems: state.totalItems,
    subtotal: state.subtotal,
    totalSavings: state.totalSavings,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyFlashSale,
    removeFlashSale,

    // Helpers
    getCartItem,
    isInCart,
    getCartSummary,
    validateCart,
    clearError,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
