// src/hooks/useFlashSales.js
import { useContext, useCallback, useMemo } from 'react';
import FlashSalesContext from '../contexts/FlashSalesContext';
import { useCountdown, useMultipleCountdowns } from './useCountdown';

/**
 * Custom hook for flash sales functionality
 * Provides access to flash sales state and methods with additional utilities
 */
export const useFlashSales = () => {
  const context = useContext(FlashSalesContext);

  if (!context) {
    throw new Error('useFlashSales must be used within a FlashSalesProvider');
  }

  const {
    activeSales,
    upcomingSales,
    allSales,
    timers,
    isLoading,
    error,
    loadActiveSales,
    loadUpcomingSales,
    loadAllSales,
    getFlashSaleById,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
    addProductsToSale,
    refreshSales,
    clearError,
    getFlashSalePrice,
    isProductInFlashSale,
    formatTimeRemaining,
    getActiveSalesCount,
    getUpcomingSalesCount,
  } = context;

  // Set up countdowns for all active sales
  const countdownTimers = useMemo(() => {
    return activeSales.map(sale => ({
      id: sale.id,
      targetDate: sale.end_time,
      onComplete: () => {
        console.log(`Flash sale ${sale.name} has expired`);
        // Reload active sales when one expires
        setTimeout(() => loadActiveSales(), 1000);
      },
    }));
  }, [activeSales, loadActiveSales]);

  const { countdowns, formatTime, isExpired } = useMultipleCountdowns(countdownTimers);

  // Get flash sale with countdown
  const getFlashSaleWithCountdown = useCallback(
    saleId => {
      const sale = activeSales.find(s => s.id === saleId);
      if (!sale) return null;

      return {
        ...sale,
        timeRemaining: countdowns[saleId] || 0,
        formattedTime: formatTime(countdowns[saleId] || 0),
        isExpired: isExpired(saleId),
      };
    },
    [activeSales, countdowns, formatTime, isExpired]
  );

  // Get all active sales with countdowns
  const getActiveSalesWithCountdowns = useCallback(() => {
    return activeSales.map(sale => getFlashSaleWithCountdown(sale.id)).filter(Boolean);
  }, [activeSales, getFlashSaleWithCountdown]);

  // Check if any flash sales are ending soon (within 1 hour)
  const hasEndingSoonSales = useMemo(() => {
    return activeSales.some(sale => {
      const timeRemaining = countdowns[sale.id] || 0;
      return timeRemaining > 0 && timeRemaining <= 3600; // 1 hour
    });
  }, [activeSales, countdowns]);

  // Get sales ending soon
  const getEndingSoonSales = useCallback(() => {
    return activeSales
      .filter(sale => {
        const timeRemaining = countdowns[sale.id] || 0;
        return timeRemaining > 0 && timeRemaining <= 3600;
      })
      .map(sale => getFlashSaleWithCountdown(sale.id));
  }, [activeSales, countdowns, getFlashSaleWithCountdown]);

  // Enhanced create flash sale with validation
  const createFlashSaleWithValidation = useCallback(
    async saleData => {
      try {
        // Basic validation
        if (!saleData.name || saleData.name.trim() === '') {
          return { success: false, error: 'Flash sale name is required' };
        }

        if (!saleData.start_time || !saleData.end_time) {
          return { success: false, error: 'Start and end times are required' };
        }

        const startTime = new Date(saleData.start_time);
        const endTime = new Date(saleData.end_time);
        const now = new Date();

        if (startTime >= endTime) {
          return { success: false, error: 'End time must be after start time' };
        }

        if (endTime <= now) {
          return { success: false, error: 'End time must be in the future' };
        }

        if (saleData.discount_percentage < 1 || saleData.discount_percentage > 90) {
          return { success: false, error: 'Discount must be between 1% and 90%' };
        }

        const result = await createFlashSale(saleData);

      if (result.success) {
          // Refresh sales lists to include new sale
          await refreshSales();
        }


      return result;
      } catch (error) {
        console.error('Create flash sale error:', error);
        return { success: false, error: error.message };
      }
    },
    [createFlashSale, refreshSales]
  );

  // Enhanced add products to sale
  const addProductsToSaleWithValidation = useCallback(
    async (saleId, products) => {
      try {
        if (!products || products.length === 0) {
          return { success: false, error: 'No products selected' };
        }

        // Validate each product
        for (const product of products) {
          if (!product.product) {
            return { success: false, error: 'Invalid product data' };
          }

          if (product.custom_discount_percentage) {
            if (product.custom_discount_percentage < 1 || product.custom_discount_percentage > 90) {
              return {
                success: false,
                error: 'Custom discount must be between 1% and 90%',
              };
            }
          }

          if (product.stock_limit && product.stock_limit <= 0) {
            return {
              success: false,
              error: 'Stock limit must be positive',
            };
          }
        }

        const result = await addProductsToSale(saleId, products);

      if (result.success) {
          // Refresh the specific flash sale data
          await loadActiveSales();
        }

      return result;
      } catch (error) {
        console.error('Add products to sale error:', error);
        return { success: false, error: error.message };
      }
    },
    [addProductsToSale, loadActiveSales]
  );

  // Get best flash sale price for a product
  const getBestFlashSalePrice = useCallback(
    (productId, originalPrice) => {
      let bestPrice = originalPrice;
      let bestSale = null;
      let bestDiscount = 0;

      activeSales.forEach(sale => {
        if (sale.flash_sale_products) {
          const product = sale.flash_sale_products.find(p => p.product.id === productId);
          if (product && product.flash_sale_price < bestPrice) {
            bestPrice = product.flash_sale_price;
            bestSale = sale;
            bestDiscount = product.discount_percentage;
          }
        }
      });

      return {
        price: bestPrice,
        originalPrice,
        discount: bestDiscount,
        savings: originalPrice - bestPrice,
        sale: bestSale,
        isFlashSale: bestPrice < originalPrice,
      };
    },
    [activeSales]
  );

  // Get flash sales by category
  const getFlashSalesByCategory = useCallback(
    categoryId => {
      return activeSales.filter(sale => {
        return sale.flash_sale_products?.some(
          product => product.product.category?.id === categoryId
        );
      });
    },
    [activeSales]
  );

  // Get products in flash sales
  const getProductsInFlashSales = useCallback(() => {
    const products = [];

    activeSales.forEach(sale => {
      if (sale.flash_sale_products) {
        sale.flash_sale_products.forEach(flashProduct => {
          products.push({
            ...flashProduct.product,
            flashSalePrice: flashProduct.flash_sale_price,
            originalPrice: flashProduct.original_price,
            discount: flashProduct.discount_percentage,
            savings: flashProduct.savings_amount,
            flashSale: {
              id: sale.id,
              name: sale.name,
              endTime: sale.end_time,
              timeRemaining: countdowns[sale.id] || 0,
            },
          });
        });
      }
    });

    return products;
  }, [activeSales, countdowns]);

  // Get flash sale statistics
  const getFlashSaleStats = useMemo(() => {
    const totalActiveSales = activeSales.length;
    const totalUpcomingSales = upcomingSales.length;

    const totalProductsInSales = activeSales.reduce((total, sale) => {
      return total + (sale.products_count || 0);
    }, 0);

    const averageDiscount =
      activeSales.length > 0
        ? activeSales.reduce((total, sale) => total + sale.discount_percentage, 0) /
          activeSales.length
        : 0;

    const endingSoonCount = getEndingSoonSales().length;

    return {
      totalActiveSales,
      totalUpcomingSales,
      totalProductsInSales,
      averageDiscount: Math.round(averageDiscount),
      endingSoonCount,
      hasActiveSales: totalActiveSales > 0,
      hasUpcomingSales: totalUpcomingSales > 0,
    };
  }, [activeSales, upcomingSales, getEndingSoonSales]);

  // Check if sale is about to start (within 24 hours)
  const isSaleStartingSoon = useCallback(sale => {
    if (!sale.is_upcoming) return false;

    const now = new Date().getTime();
    const startTime = new Date(sale.start_time).getTime();
    const timeToStart = startTime - now;

    return timeToStart <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }, []);

  // Get urgency level for flash sale
  const getSaleUrgency = useCallback(
    saleId => {
      const timeRemaining = countdowns[saleId] || 0;

    if (timeRemaining === 0) return 'expired';
      if (timeRemaining <= 300) return 'critical'; // 5 minutes
      if (timeRemaining <= 1800) return 'urgent'; // 30 minutes
      if (timeRemaining <= 3600) return 'warning'; // 1 hour
      if (timeRemaining <= 21600) return 'notice'; // 6 hours
      return 'normal';
    },
    [countdowns]
  );

  // Search flash sales
  const searchFlashSales = useCallback(
    query => {
      if (!query || query.trim() === '') return [];

      const searchTerm = query.toLowerCase().trim();

    return [...activeSales, ...upcomingSales].filter(sale =>
          sale.name.toLowerCase().includes(searchTerm) ||
          sale.description?.toLowerCase().includes(searchTerm)
      );
    },
    [activeSales, upcomingSales]
  );

  // Filter flash sales by discount range
  const filterByDiscountRange = useCallback(
    (minDiscount = 0, maxDiscount = 100) => {
      return activeSales.filter(
        sale => sale.discount_percentage >= minDiscount && sale.discount_percentage <= maxDiscount
      );
    },
    [activeSales]
  );

  // Get flash sale banner for homepage
  const getHomepageBanner = useCallback(() => {
    // Return the highest priority active sale with a banner
    return (
      activeSales.filter(sale => sale.banner_image).sort((a, b) => b.priority - a.priority)[0] ||
      null
    );
  }, [activeSales]);

  // Calculate total savings across all flash sales
  const getTotalPotentialSavings = useCallback(() => {
    let totalSavings = 0;

    activeSales.forEach(sale => {
      if (sale.flash_sale_products) {
        sale.flash_sale_products.forEach(product => {
          totalSavings += product.savings_amount || 0;
        });
      }
    });

    return Math.round(totalSavings);
  }, [activeSales]);

  // Check if product is sold out in flash sale
  const isFlashSaleProductSoldOut = useCallback(
    (saleId, productId) => {
      const sale = activeSales.find(s => s.id === saleId);
      if (!sale) return false;

      const product = sale.flash_sale_products?.find(p => p.product.id === productId);
      return product?.is_sold_out || false;
    },
    [activeSales]
  );

  // Get flash sale product details
  const getFlashSaleProduct = useCallback(
    (saleId, productId) => {
      const sale = activeSales.find(s => s.id === saleId);
      if (!sale) return null;

      return sale.flash_sale_products?.find(p => p.product.id === productId) || null;
    },
    [activeSales]
  );

  return {
    // State from context
    activeSales,
    upcomingSales,
    allSales,
    timers,
    isLoading,
    error,

    // Enhanced data with countdowns
    getFlashSaleWithCountdown,
    getActiveSalesWithCountdowns,
    countdowns,

    // Actions from context
    loadActiveSales,
    loadUpcomingSales,
    loadAllSales,
    getFlashSaleById,
    createFlashSale: createFlashSaleWithValidation,
    updateFlashSale,
    deleteFlashSale,
    addProductsToSale: addProductsToSaleWithValidation,
    refreshSales,
    clearError,

    // Pricing utilities
    getFlashSalePrice,
    getBestFlashSalePrice,
    isProductInFlashSale,

    // Product utilities
    getProductsInFlashSales,
    isFlashSaleProductSoldOut,
    getFlashSaleProduct,

    // Search and filtering
    searchFlashSales,
    filterByDiscountRange,
    getFlashSalesByCategory,

    // Status checks
    hasEndingSoonSales,
    getEndingSoonSales,
    isSaleStartingSoon,
    getSaleUrgency,

    // Statistics
    getFlashSaleStats,
    getTotalPotentialSavings,
    getActiveSalesCount,
    getUpcomingSalesCount,

    // UI utilities
    getHomepageBanner,
    formatTimeRemaining,

    // Computed properties
    hasActiveSales: activeSales.length > 0,
    hasUpcomingSales: upcomingSales.length > 0,
    isEmpty: activeSales.length === 0 && upcomingSales.length === 0,
  };
};

/**
 * Hook for a specific flash sale with countdown
 */
export const useFlashSale = saleId => {
  const { getFlashSaleById, activeSales, countdowns } = useFlashSales();

  // Find sale in active sales or fetch if needed
  const sale = useMemo(() => {
    return activeSales.find(s => s.id === saleId);
  }, [activeSales, saleId]);

  // Set up countdown for this specific sale
  const {
  timeRemaining,
  formattedTime,
  isCompleted,
  isLastHour,
  isLastMinute,
  getUrgencyLevel
} = useCountdown(sale?.end_time, {
  onComplete: () => {
    console.log(`Flash sale ${sale?.name} has completed`);
  },
});

  // Load sale details if not in context
  const loadSaleDetails = useCallback(async () => {
    if (!sale) {
      return await getFlashSaleById(saleId);
    }
    return { success: true, data: sale };
  }, [sale, getFlashSaleById, saleId]);

  // Get sale products with flash sale pricing
  const getSaleProducts = useCallback(() => {
    if (!sale || !sale.flash_sale_products) return [];

    return sale.flash_sale_products.map(flashProduct => ({
      ...flashProduct.product,
      flashSalePrice: flashProduct.flash_sale_price,
      originalPrice: flashProduct.original_price,
      discount: flashProduct.discount_percentage,
      savings: flashProduct.savings_amount,
      isFlashSale: true,
      isSoldOut: flashProduct.is_sold_out,
      stockLimit: flashProduct.stock_limit,
      soldQuantity: flashProduct.sold_quantity,
    }));
  }, [sale]);

  return {
    // Sale data
    sale,
    saleProducts: getSaleProducts(),

    // Countdown data
    timeRemaining,
    formattedTime,
    isCompleted,
    isLastHour,
    isLastMinute,
    urgencyLevel: getUrgencyLevel,

    // Status
    isActive: sale?.is_running || false,
    isUpcoming: sale?.is_upcoming || false,
    isExpired: isCompleted,

    // Actions
    loadSaleDetails,
  };
};

/**
 * Hook for flash sale product pricing in cart/product pages
 */
export const useFlashSaleProductPricing = (productId, originalPrice) => {
  const { getFlashSalePrice, isProductInFlashSale } = useFlashSales();

  const pricing = useMemo(() => {
    return getFlashSalePrice(productId, originalPrice);
  }, [getFlashSalePrice, productId, originalPrice]);

  const isInFlashSale = useMemo(() => {
    return isProductInFlashSale(productId);
  }, [isProductInFlashSale, productId]);

  return {
    ...pricing,
    isInFlashSale,
    hasDiscount: pricing.discount > 0,
    formattedSavings: `UGX ${pricing.savings.toLocaleString()}`,
    formattedDiscount: `${pricing.discount}% OFF`,
  };
};

export default useFlashSales;
