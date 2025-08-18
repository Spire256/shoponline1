/**
 * Price calculation utilities for ShopOnline Uganda E-commerce Platform
 *
 * Contains all price calculation functions including:
 * - Cart totals and taxes
 * - Flash sale discounts
 * - Delivery fees
 * - Payment method fees
 * - Currency formatting for UGX
 */

import { CURRENCY } from '../constants/paymentMethods';
import { MOBILE_MONEY_PROVIDERS, COD_CONFIG } from '../constants/paymentMethods';

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

/**
 * Format amount in Uganda Shillings (UGX)
 * @param {number} amount - Amount to format
 * @param {boolean} showCurrency - Whether to show currency symbol
 * @param {boolean} showDecimals - Whether to show decimal places (usually false for UGX)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showCurrency = true, showDecimals = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showCurrency ? 'UGX 0' : '0';
  }

  const numAmount = parseFloat(amount);
  const decimals = showDecimals ? CURRENCY.DECIMAL_PLACES : 0;

  const formatted = numAmount.toLocaleString('en-UG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });

  return showCurrency ? `${CURRENCY.SYMBOL} ${formatted}` : formatted;
};

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed amount
 */
export const parseCurrency = currencyString => {
  if (!currencyString) return 0;

  // Remove currency symbol and separators
  const cleanString = currencyString
    .toString()
    .replace(/UGX|,|\s/g, '')
    .replace(/[^\d.-]/g, '');

  return parseFloat(cleanString) || 0;
};

/**
 * Format amount for display with appropriate abbreviations
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount with abbreviations (K, M, B)
 */
export const formatAmountCompact = amount => {
  if (!amount) return 'UGX 0';

  const numAmount = parseFloat(amount);

  if (numAmount >= 1000000000) {
    return `UGX ${(numAmount / 1000000000).toFixed(1)}B`;
  } else if (numAmount >= 1000000) {
    return `UGX ${(numAmount / 1000000).toFixed(1)}M`;
  } else if (numAmount >= 1000) {
    return `UGX ${(numAmount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(numAmount);
};

// =============================================================================
// CART CALCULATIONS
// =============================================================================

/**
 * Calculate cart subtotal
 * @param {Array} cartItems - Array of cart items
 * @returns {number} Subtotal amount
 */
export const calculateCartSubtotal = cartItems => {
  if (!Array.isArray(cartItems)) return 0;

  return cartItems.reduce((total, item) => {
    const itemTotal = calculateItemTotal(item);
    return total + itemTotal;
  }, 0);
};

/**
 * Calculate individual item total
 * @param {Object} item - Cart item object
 * @returns {number} Item total
 */
export const calculateItemTotal = item => {
  if (!item) return 0;

  const price = parseFloat(item.price || item.unit_price || 0);
  const quantity = parseInt(item.quantity || 0);

  return price * quantity;
};

/**
 * Calculate cart tax amount
 * @param {number} subtotal - Cart subtotal
 * @param {number} taxRate - Tax rate as percentage (e.g., 18 for 18%)
 * @returns {number} Tax amount
 */
export const calculateTax = (subtotal, taxRate = 0) => {
  if (!subtotal || !taxRate) return 0;
  return (subtotal * taxRate) / 100;
};

/**
 * Calculate delivery fee based on location and order amount
 * @param {string} deliveryRegion - Delivery region code
 * @param {number} orderAmount - Total order amount
 * @param {boolean} isCOD - Whether order is cash on delivery
 * @returns {number} Delivery fee
 */
export const calculateDeliveryFee = (deliveryRegion, orderAmount = 0, isCOD = false) => {
  // Free delivery threshold
  const FREE_DELIVERY_THRESHOLD = 200000; // UGX 200,000

  if (orderAmount >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }

  // Default delivery fee for COD
  if (isCOD) {
    return COD_CONFIG.deliveryFee;
  }

  // Region-based delivery fees (from delivery config)
  const regionFees = {
    KLA_CENTRAL: 5000,
    KLA_GREATER: 8000,
    WAKISO: 10000,
    CENTRAL: 15000,
    MAJOR_TOWNS: 20000,
    OTHER: 25000,
  };

  return regionFees[deliveryRegion] || 15000; // Default fee
};

/**
 * Calculate cart total including all fees
 * @param {Object} cartData - Cart data object
 * @returns {Object} Calculation breakdown
 */
export const calculateCartTotal = cartData => {
  const {
    items = [],
    deliveryRegion = 'CENTRAL',
    paymentMethod = 'mtn_momo',
    taxRate = 0,
    discountAmount = 0,
    isCOD = false,
  } = cartData;

  const subtotal = calculateCartSubtotal(items);
  const taxAmount = calculateTax(subtotal, taxRate);
  const deliveryFee = calculateDeliveryFee(deliveryRegion, subtotal, isCOD);
  const paymentFee = calculatePaymentFee(subtotal, paymentMethod);

  const totalBeforeDiscount = subtotal + taxAmount + deliveryFee + paymentFee;
  const discountApplied = Math.min(discountAmount, totalBeforeDiscount);
  const finalTotal = Math.max(0, totalBeforeDiscount - discountApplied);

  return {
    subtotal: Math.round(subtotal),
    taxAmount: Math.round(taxAmount),
    deliveryFee: Math.round(deliveryFee),
    paymentFee: Math.round(paymentFee),
    discountAmount: Math.round(discountApplied),
    total: Math.round(finalTotal),
    savings: Math.round(discountApplied),
    itemCount: items.reduce((count, item) => count + parseInt(item.quantity || 0), 0),
  };
};

// =============================================================================
// FLASH SALE CALCULATIONS
// =============================================================================

/**
 * Calculate flash sale discount amount
 * @param {number} originalPrice - Original product price
 * @param {number} discountPercentage - Discount percentage
 * @returns {Object} Discount calculation details
 */
export const calculateFlashSaleDiscount = (originalPrice, discountPercentage) => {
  if (!originalPrice || !discountPercentage) {
    return {
      originalPrice: originalPrice || 0,
      discountPercentage: 0,
      discountAmount: 0,
      salePrice: originalPrice || 0,
      savings: 0,
    };
  }

  const discountAmount = (originalPrice * discountPercentage) / 100;
  const salePrice = originalPrice - discountAmount;

  return {
    originalPrice: Math.round(originalPrice),
    discountPercentage: discountPercentage,
    discountAmount: Math.round(discountAmount),
    salePrice: Math.round(salePrice),
    savings: Math.round(discountAmount),
  };
};

/**
 * Calculate flash sale savings for cart items
 * @param {Array} cartItems - Array of cart items
 * @returns {Object} Flash sale savings breakdown
 */
export const calculateFlashSaleSavings = cartItems => {
  if (!Array.isArray(cartItems)) return { totalSavings: 0, itemsOnSale: 0 };

  let totalSavings = 0;
  let itemsOnSale = 0;

  cartItems.forEach(item => {
    if (item.is_flash_sale_item && item.original_price && item.price) {
      const itemSavings = (item.original_price - item.price) * item.quantity;
      totalSavings += itemSavings;
      itemsOnSale++;
    }
  });

  return {
    totalSavings: Math.round(totalSavings),
    itemsOnSale,
    averageSavingsPerItem: itemsOnSale > 0 ? Math.round(totalSavings / itemsOnSale) : 0,
  };
};

// =============================================================================
// PAYMENT FEE CALCULATIONS
// =============================================================================

/**
 * Calculate payment processing fee
 * @param {number} amount - Payment amount
 * @param {string} paymentMethod - Payment method
 * @returns {number} Payment fee
 */
export const calculatePaymentFee = (amount, paymentMethod) => {
  if (!amount || paymentMethod === 'cod') return 0;

  const provider = MOBILE_MONEY_PROVIDERS[paymentMethod];
  if (!provider || !provider.fees) return 0;

  const { fixed, percentage, min_fee, max_fee } = provider.fees;

  let fee = fixed + amount * percentage;

  // Apply min/max fee limits
  if (min_fee && fee < min_fee) fee = min_fee;
  if (max_fee && fee > max_fee) fee = max_fee;

  return Math.round(fee);
};

/**
 * Calculate payment fee breakdown
 * @param {number} amount - Payment amount
 * @param {string} paymentMethod - Payment method
 * @returns {Object} Fee breakdown
 */
export const getPaymentFeeBreakdown = (amount, paymentMethod) => {
  if (!amount || paymentMethod === 'cod') {
    return {
      fixedFee: 0,
      percentageFee: 0,
      totalFee: 0,
      netAmount: amount || 0,
    };
  }

  const provider = MOBILE_MONEY_PROVIDERS[paymentMethod];
  if (!provider || !provider.fees) {
    return {
      fixedFee: 0,
      percentageFee: 0,
      totalFee: 0,
      netAmount: amount || 0,
    };
  }

  const { fixed, percentage } = provider.fees;
  const fixedFee = fixed || 0;
  const percentageFee = amount * (percentage || 0);
  const totalFee = Math.round(fixedFee + percentageFee);

  return {
    fixedFee: Math.round(fixedFee),
    percentageFee: Math.round(percentageFee),
    totalFee,
    netAmount: Math.round(amount - totalFee),
  };
};

// =============================================================================
// DISCOUNT CALCULATIONS
// =============================================================================

/**
 * Calculate percentage discount
 * @param {number} originalPrice - Original price
 * @param {number} discountedPrice - Discounted price
 * @returns {number} Discount percentage
 */
export const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
  if (!originalPrice || originalPrice <= 0) return 0;
  if (!discountedPrice || discountedPrice >= originalPrice) return 0;

  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

/**
 * Apply discount to amount
 * @param {number} amount - Original amount
 * @param {number} discountPercentage - Discount percentage
 * @param {number} maxDiscount - Maximum discount amount (optional)
 * @returns {Object} Discount application result
 */
export const applyDiscount = (amount, discountPercentage, maxDiscount = null) => {
  if (!amount || !discountPercentage) {
    return {
      originalAmount: amount || 0,
      discountAmount: 0,
      finalAmount: amount || 0,
      discountPercentage: 0,
    };
  }

  let discountAmount = (amount * discountPercentage) / 100;

  // Apply maximum discount limit if provided
  if (maxDiscount && discountAmount > maxDiscount) {
    discountAmount = maxDiscount;
  }

  const finalAmount = amount - discountAmount;

  return {
    originalAmount: Math.round(amount),
    discountAmount: Math.round(discountAmount),
    finalAmount: Math.round(finalAmount),
    discountPercentage: calculateDiscountPercentage(amount, finalAmount),
  };
};

/**
 * Calculate bulk discount based on quantity
 * @param {number} quantity - Item quantity
 * @param {number} unitPrice - Unit price
 * @param {Array} bulkTiers - Bulk discount tiers
 * @returns {Object} Bulk discount calculation
 */
export const calculateBulkDiscount = (quantity, unitPrice, bulkTiers = []) => {
  if (!quantity || !unitPrice || !bulkTiers.length) {
    return {
      originalTotal: quantity * unitPrice,
      discountPercentage: 0,
      discountAmount: 0,
      finalTotal: quantity * unitPrice,
    };
  }

  // Find applicable tier
  const applicableTier = bulkTiers
    .filter(tier => quantity >= tier.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];

  if (!applicableTier) {
    return {
      originalTotal: quantity * unitPrice,
      discountPercentage: 0,
      discountAmount: 0,
      finalTotal: quantity * unitPrice,
    };
  }

  const originalTotal = quantity * unitPrice;
  const discountAmount = (originalTotal * applicableTier.discountPercentage) / 100;
  const finalTotal = originalTotal - discountAmount;

  return {
    originalTotal: Math.round(originalTotal),
    discountPercentage: applicableTier.discountPercentage,
    discountAmount: Math.round(discountAmount),
    finalTotal: Math.round(finalTotal),
    tierName: applicableTier.name,
  };
};

// =============================================================================
// TAX CALCULATIONS
// =============================================================================

/**
 * Calculate VAT (Value Added Tax) for Uganda
 * @param {number} amount - Amount to calculate VAT on
 * @param {number} vatRate - VAT rate (default 18% for Uganda)
 * @returns {Object} VAT calculation breakdown
 */
export const calculateVAT = (amount, vatRate = 18) => {
  if (!amount) return { vatAmount: 0, amountWithVAT: 0, amountWithoutVAT: amount || 0 };

  const vatAmount = (amount * vatRate) / 100;
  const amountWithVAT = amount + vatAmount;

  return {
    vatAmount: Math.round(vatAmount),
    amountWithVAT: Math.round(amountWithVAT),
    amountWithoutVAT: Math.round(amount),
    vatRate,
  };
};

/**
 * Calculate tax-inclusive price from tax-exclusive price
 * @param {number} exclusivePrice - Price without tax
 * @param {number} taxRate - Tax rate percentage
 * @returns {number} Price including tax
 */
export const calculateInclusivePrice = (exclusivePrice, taxRate = 18) => {
  if (!exclusivePrice || !taxRate) return exclusivePrice || 0;

  const inclusivePrice = exclusivePrice * (1 + taxRate / 100);
  return Math.round(inclusivePrice);
};

/**
 * Calculate tax-exclusive price from tax-inclusive price
 * @param {number} inclusivePrice - Price including tax
 * @param {number} taxRate - Tax rate percentage
 * @returns {number} Price excluding tax
 */
export const calculateExclusivePrice = (inclusivePrice, taxRate = 18) => {
  if (!inclusivePrice || !taxRate) return inclusivePrice || 0;

  const exclusivePrice = inclusivePrice / (1 + taxRate / 100);
  return Math.round(exclusivePrice);
};

// =============================================================================
// INSTALLMENT CALCULATIONS
// =============================================================================

/**
 * Calculate installment payments (for future use)
 * @param {number} totalAmount - Total amount to be paid
 * @param {number} installments - Number of installments
 * @param {number} interestRate - Interest rate per installment
 * @returns {Object} Installment calculation
 */
export const calculateInstallments = (totalAmount, installments = 1, interestRate = 0) => {
  if (!totalAmount || installments <= 0) {
    return {
      installmentAmount: 0,
      totalWithInterest: 0,
      totalInterest: 0,
      schedule: [],
    };
  }

  if (installments === 1) {
    return {
      installmentAmount: Math.round(totalAmount),
      totalWithInterest: Math.round(totalAmount),
      totalInterest: 0,
      schedule: [
        {
          installmentNumber: 1,
          amount: Math.round(totalAmount),
          dueDate: new Date(),
        },
      ],
    };
  }

  const monthlyInterestRate = interestRate / 100;
  const installmentAmount =
    (totalAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, installments))) /
    (Math.pow(1 + monthlyInterestRate, installments) - 1);

  const totalWithInterest = installmentAmount * installments;
  const totalInterest = totalWithInterest - totalAmount;

  // Generate payment schedule
  const schedule = [];
  const today = new Date();

  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      amount: Math.round(installmentAmount),
      dueDate,
      status: 'pending',
    });
  }

  return {
    installmentAmount: Math.round(installmentAmount),
    totalWithInterest: Math.round(totalWithInterest),
    totalInterest: Math.round(totalInterest),
    schedule,
  };
};

// =============================================================================
// PROFIT MARGIN CALCULATIONS
// =============================================================================

/**
 * Calculate profit margin
 * @param {number} sellingPrice - Selling price
 * @param {number} costPrice - Cost price
 * @returns {Object} Profit margin calculation
 */
export const calculateProfitMargin = (sellingPrice, costPrice) => {
  if (!sellingPrice || !costPrice) {
    return {
      profit: 0,
      marginPercentage: 0,
      markupPercentage: 0,
    };
  }

  const profit = sellingPrice - costPrice;
  const marginPercentage = (profit / sellingPrice) * 100;
  const markupPercentage = (profit / costPrice) * 100;

  return {
    profit: Math.round(profit),
    marginPercentage: Math.round(marginPercentage * 100) / 100,
    markupPercentage: Math.round(markupPercentage * 100) / 100,
  };
};

// =============================================================================
// ANALYTICS CALCULATIONS
// =============================================================================

/**
 * Calculate average order value
 * @param {Array} orders - Array of orders
 * @returns {number} Average order value
 */
export const calculateAverageOrderValue = orders => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;

  const totalValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  return Math.round(totalValue / orders.length);
};

/**
 * Calculate conversion rate
 * @param {number} conversions - Number of conversions
 * @param {number} visitors - Total number of visitors
 * @returns {number} Conversion rate percentage
 */
export const calculateConversionRate = (conversions, visitors) => {
  if (!visitors || visitors === 0) return 0;

  const rate = (conversions / visitors) * 100;
  return Math.round(rate * 100) / 100;
};

/**
 * Calculate growth rate
 * @param {number} currentValue - Current period value
 * @param {number} previousValue - Previous period value
 * @returns {Object} Growth calculation
 */
export const calculateGrowthRate = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) {
    return {
      growth: currentValue || 0,
      growthRate: currentValue > 0 ? 100 : 0,
      isPositive: (currentValue || 0) > 0,
    };
  }

  const growth = (currentValue || 0) - previousValue;
  const growthRate = (growth / previousValue) * 100;

  return {
    growth: Math.round(growth),
    growthRate: Math.round(growthRate * 100) / 100,
    isPositive: growth >= 0,
  };
};

// =============================================================================
// COMMISSION CALCULATIONS
// =============================================================================

/**
 * Calculate platform commission (for future multi-vendor support)
 * @param {number} saleAmount - Sale amount
 * @param {number} commissionRate - Commission rate percentage
 * @returns {Object} Commission calculation
 */
export const calculateCommission = (saleAmount, commissionRate = 5) => {
  if (!saleAmount) return { commission: 0, vendorAmount: 0 };

  const commission = (saleAmount * commissionRate) / 100;
  const vendorAmount = saleAmount - commission;

  return {
    commission: Math.round(commission),
    vendorAmount: Math.round(vendorAmount),
    commissionRate,
  };
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Round to nearest currency unit
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export const roundToCurrency = amount => {
  if (!amount) return 0;
  return Math.round(parseFloat(amount));
};

/**
 * Calculate percentage of total
 * @param {number} value - Value
 * @param {number} total - Total
 * @returns {number} Percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round(((value || 0) / total) * 10000) / 100; // Round to 2 decimal places
};

/**
 * Calculate change for cash payments
 * @param {number} amountDue - Amount due
 * @param {number} amountPaid - Amount paid
 * @returns {Object} Change calculation
 */
export const calculateChange = (amountDue, amountPaid) => {
  const change = (amountPaid || 0) - (amountDue || 0);

  return {
    amountDue: Math.round(amountDue || 0),
    amountPaid: Math.round(amountPaid || 0),
    change: Math.round(change),
    isExact: change === 0,
    isOverpaid: change > 0,
    isUnderpaid: change < 0,
  };
};

/**
 * Validate calculation results
 * @param {Object} calculation - Calculation object to validate
 * @returns {boolean} Whether calculation is valid
 */
export const validateCalculation = calculation => {
  if (!calculation || typeof calculation !== 'object') return false;

  // Check for NaN values
  const values = Object.values(calculation);
  return values.every(value => (typeof value === 'number' ? !isNaN(value) : true));
};

// =============================================================================
// PRICE COMPARISON UTILITIES
// =============================================================================

/**
 * Compare prices between different time periods
 * @param {number} currentPrice - Current price
 * @param {number} previousPrice - Previous price
 * @returns {Object} Price comparison
 */
export const comparePrices = (currentPrice, previousPrice) => {
  if (!previousPrice) {
    return {
      priceDifference: 0,
      percentageChange: 0,
      priceDirection: 'same',
      isIncrease: false,
      isDecrease: false,
    };
  }

  const priceDifference = (currentPrice || 0) - previousPrice;
  const percentageChange = calculateDiscountPercentage(previousPrice, currentPrice || 0);

  let priceDirection = 'same';
  if (priceDifference > 0) priceDirection = 'increase';
  if (priceDifference < 0) priceDirection = 'decrease';

  return {
    priceDifference: Math.round(priceDifference),
    percentageChange: Math.round(percentageChange * 100) / 100,
    priceDirection,
    isIncrease: priceDifference > 0,
    isDecrease: priceDifference < 0,
  };
};

// =============================================================================
// INVENTORY VALUE CALCULATIONS
// =============================================================================

/**
 * Calculate inventory value
 * @param {Array} products - Array of products with stock and cost
 * @returns {Object} Inventory value calculation
 */
export const calculateInventoryValue = products => {
  if (!Array.isArray(products)) return { totalValue: 0, totalItems: 0 };

  let totalValue = 0;
  let totalItems = 0;

  products.forEach(product => {
    const stock = parseInt(product.stock_quantity || 0);
    const cost = parseFloat(product.cost_price || product.price || 0);

    totalValue += stock * cost;
    totalItems += stock;
  });

  return {
    totalValue: Math.round(totalValue),
    totalItems,
    averageValuePerItem: totalItems > 0 ? Math.round(totalValue / totalItems) : 0,
  };
};

// =============================================================================
// EXPORTED HELPER OBJECT
// =============================================================================

export const CalculationHelpers = {
  // Currency formatting
  formatCurrency,
  parseCurrency,
  formatAmountCompact,

  // Cart calculations
  calculateCartSubtotal,
  calculateItemTotal,
  calculateTax,
  calculateDeliveryFee,
  calculateCartTotal,

  // Flash sale calculations
  calculateFlashSaleDiscount,
  calculateFlashSaleSavings,

  // Payment calculations
  calculatePaymentFee,
  getPaymentFeeBreakdown,

  // Discount calculations
  calculateDiscountPercentage,
  applyDiscount,
  calculateBulkDiscount,

  // Tax calculations
  calculateVAT,
  calculateInclusivePrice,
  calculateExclusivePrice,

  // Analytics calculations
  calculateAverageOrderValue,
  calculateConversionRate,
  calculateGrowthRate,
  calculateCommission,
  calculateProfitMargin,

  // Utility functions
  roundToCurrency,
  calculatePercentage,
  calculateChange,
  validateCalculation,
  comparePrices,
  calculateInventoryValue,
  calculateInstallments,
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default CalculationHelpers;
