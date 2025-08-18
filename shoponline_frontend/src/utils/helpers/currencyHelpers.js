// Uganda Shillings formatting utilities for the e-commerce platform
// Specialized currency formatting and validation for Uganda Shillings (UGX)

import { APP_CONFIG } from '../constants/app';

/**
 * Uganda Shillings Configuration
 */
export const UGX_CONFIG = {
  CURRENCY_CODE: 'UGX',
  CURRENCY_SYMBOL: 'UGX',
  CURRENCY_NAME: 'Uganda Shillings',
  DECIMAL_PLACES: 0, // UGX doesn't use decimal places
  THOUSAND_SEPARATOR: ',',
  DECIMAL_SEPARATOR: '.', // Not used but defined for consistency
  PREFIX: 'UGX ',
  SUFFIX: '',
  MIN_VALUE: 1,
  MAX_VALUE: 999999999999, // 999 billion UGX
  SMALLEST_DENOMINATION: 1, // 1 shilling is the smallest unit
  LOCALE: 'en-UG',
};

/**
 * Core Currency Formatting Functions
 */
export const formatUGX = (amount, options = {}) => {
  try {
    const {
      showSymbol = true,
      usePrefix = true,
      addSpacing = true,
      showFullForm = false,
      roundUp = false,
    } = options;

    // Convert to number and handle invalid inputs
    let numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;

    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      return showSymbol ? 'UGX 0' : '0';
    }

    // Round to nearest shilling (no decimals)
    numAmount = roundUp ? Math.ceil(numAmount) : Math.round(numAmount);

    // Format with thousand separators
    const formatted = new Intl.NumberFormat('en-UG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(numAmount);

    if (!showSymbol) {
      return formatted;
    }

    const symbol = showFullForm ? UGX_CONFIG.CURRENCY_NAME : UGX_CONFIG.CURRENCY_SYMBOL;
    const spacing = addSpacing ? ' ' : '';

    return usePrefix ? `${symbol}${spacing}${formatted}` : `${formatted}${spacing}${symbol}`;
  } catch (error) {
    console.error('Error formatting UGX:', error);
    return showSymbol ? 'UGX 0' : '0';
  }
};

export const formatPrice = (price, options = {}) => {
  return formatUGX(price, { showSymbol: true, ...options });
};

export const formatPriceCompact = price => {
  try {
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;

    if (isNaN(numPrice) || numPrice === 0) {
      return 'UGX 0';
    }

    if (numPrice >= 1000000000) {
      // Billions
      const billions = numPrice / 1000000000;
      return `UGX ${billions.toFixed(1)}B`;
    } else if (numPrice >= 1000000) {
      // Millions
      const millions = numPrice / 1000000;
      return `UGX ${millions.toFixed(1)}M`;
    } else if (numPrice >= 1000) {
      // Thousands
      const thousands = numPrice / 1000;
      return `UGX ${thousands.toFixed(1)}K`;
    }

    return formatUGX(numPrice);
  } catch (error) {
    console.error('Error formatting compact price:', error);
    return 'UGX 0';
  }
};

export const formatPriceRange = (minPrice, maxPrice, options = {}) => {
  try {
    const { separator = ' - ', showSymbolOnBoth = false } = options;

    const formattedMin = formatUGX(minPrice, { showSymbol: true });
    const formattedMax = formatUGX(maxPrice, { showSymbol: showSymbolOnBoth });

    if (minPrice === maxPrice) {
      return formattedMin;
    }

    return `${formattedMin}${separator}${formattedMax}`;
  } catch (error) {
    console.error('Error formatting price range:', error);
    return 'UGX 0';
  }
};

/**
 * Currency Parsing and Conversion
 */
export const parseUGX = formattedAmount => {
  try {
    if (typeof formattedAmount !== 'string') {
      return parseFloat(formattedAmount) || 0;
    }

    // Remove currency symbols and separators
    const cleaned = formattedAmount
      .replace(/UGX/gi, '')
      .replace(/Uganda\s+Shillings?/gi, '')
      .replace(/[,\s]/g, '')
      .trim();

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed);
  } catch (error) {
    console.error('Error parsing UGX:', error);
    return 0;
  }
};

export const convertToUGX = (amount, fromCurrency = 'USD') => {
  try {
    // This would typically use real exchange rates from an API
    // For now, using approximate rates (these should be updated regularly)
    const exchangeRates = {
      USD: 3700, // 1 USD ≈ 3,700 UGX
      EUR: 4000, // 1 EUR ≈ 4,000 UGX
      GBP: 4600, // 1 GBP ≈ 4,600 UGX
      KES: 27, // 1 KES ≈ 27 UGX
      TZS: 1.6, // 1 TZS ≈ 1.6 UGX
      RWF: 3, // 1 RWF ≈ 3 UGX
    };

    const rate = exchangeRates[fromCurrency.toUpperCase()];
    if (!rate) {
      console.warn(`Exchange rate not found for ${fromCurrency}`);
      return amount;
    }

    const convertedAmount = parseFloat(amount) * rate;
    return Math.round(convertedAmount);
  } catch (error) {
    console.error('Error converting to UGX:', error);
    return amount;
  }
};

export const convertFromUGX = (ugxAmount, toCurrency = 'USD') => {
  try {
    const exchangeRates = {
      USD: 1 / 3700,
      EUR: 1 / 4000,
      GBP: 1 / 4600,
      KES: 1 / 27,
      TZS: 1 / 1.6,
      RWF: 1 / 3,
    };

    const rate = exchangeRates[toCurrency.toUpperCase()];
    if (!rate) {
      console.warn(`Exchange rate not found for ${toCurrency}`);
      return ugxAmount;
    }

    return parseFloat(ugxAmount) * rate;
  } catch (error) {
    console.error('Error converting from UGX:', error);
    return ugxAmount;
  }
};

/**
 * Price Validation for Uganda Market
 */
export const isValidUGXAmount = amount => {
  try {
    const numAmount = typeof amount === 'string' ? parseUGX(amount) : amount;

    return (
      !isNaN(numAmount) &&
      numAmount >= UGX_CONFIG.MIN_VALUE &&
      numAmount <= UGX_CONFIG.MAX_VALUE &&
      Number.isInteger(numAmount)
    );
  } catch (error) {
    console.error('Error validating UGX amount:', error);
    return false;
  }
};

export const isReasonablePrice = (price, category = 'general') => {
  try {
    const numPrice = typeof price === 'string' ? parseUGX(price) : price;

    if (!isValidUGXAmount(numPrice)) {
      return false;
    }

    // Define reasonable price ranges for different categories (in UGX)
    const priceRanges = {
      electronics: { min: 50000, max: 50000000 }, // 50K - 50M
      clothing: { min: 10000, max: 2000000 }, // 10K - 2M
      food: { min: 1000, max: 500000 }, // 1K - 500K
      books: { min: 5000, max: 200000 }, // 5K - 200K
      home: { min: 20000, max: 10000000 }, // 20K - 10M
      beauty: { min: 5000, max: 1000000 }, // 5K - 1M
      sports: { min: 10000, max: 5000000 }, // 10K - 5M
      automotive: { min: 100000, max: 100000000 }, // 100K - 100M
      general: { min: 1000, max: 100000000 }, // 1K - 100M (default)
    };

    const range = priceRanges[category.toLowerCase()] || priceRanges.general;
    return numPrice >= range.min && numPrice <= range.max;
  } catch (error) {
    console.error('Error checking reasonable price:', error);
    return false;
  }
};

/**
 * Price Comparison and Analysis
 */
export const calculatePriceDifference = (price1, price2, asPercentage = false) => {
  try {
    const p1 = typeof price1 === 'string' ? parseUGX(price1) : price1;
    const p2 = typeof price2 === 'string' ? parseUGX(price2) : price2;

    const difference = p1 - p2;

    if (asPercentage && p2 !== 0) {
      return (difference / p2) * 100;
    }

    return difference;
  } catch (error) {
    console.error('Error calculating price difference:', error);
    return 0;
  }
};

export const formatPriceDifference = (price1, price2, options = {}) => {
  try {
    const { showPercentage = false, showDirection = true, absoluteValue = false } = options;

    const difference = calculatePriceDifference(price1, price2, showPercentage);
    const absDifference = absoluteValue ? Math.abs(difference) : difference;

    let formatted;
    if (showPercentage) {
      formatted = `${absDifference.toFixed(1)}%`;
    } else {
      formatted = formatUGX(absDifference, { showSymbol: true });
    }

    if (showDirection && !absoluteValue) {
      if (difference > 0) {
        formatted = `+${formatted}`;
      } else if (difference < 0) {
        formatted = `-${Math.abs(difference)}`;
        if (showPercentage) {
          formatted = `-${Math.abs(difference).toFixed(1)}%`;
        } else {
          formatted = `-${formatUGX(Math.abs(difference), { showSymbol: true })}`;
        }
      }
    }

    return formatted;
  } catch (error) {
    console.error('Error formatting price difference:', error);
    return 'UGX 0';
  }
};

/**
 * Price Input Helpers
 */
export const sanitizePriceInput = input => {
  try {
    if (!input) return '';

    // Remove everything except digits and commas
    let sanitized = String(input).replace(/[^\d,]/g, '');

    // Remove multiple consecutive commas
    sanitized = sanitized.replace(/,+/g, ',');

    // Remove leading commas
    sanitized = sanitized.replace(/^,+/, '');

    // Remove trailing commas
    sanitized = sanitized.replace(/,+$/, '');

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing price input:', error);
    return '';
  }
};

export const formatPriceInput = input => {
  try {
    const sanitized = sanitizePriceInput(input);
    const number = parseUGX(sanitized);

    if (number === 0) {
      return '';
    }

    return formatUGX(number, { showSymbol: false });
  } catch (error) {
    console.error('Error formatting price input:', error);
    return '';
  }
};

export const addCommasToPrice = input => {
  try {
    if (!input) return '';

    // Remove existing commas and non-digits
    const numbers = String(input).replace(/\D/g, '');

    if (!numbers) return '';

    // Add commas every three digits from the right
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } catch (error) {
    console.error('Error adding commas to price:', error);
    return String(input);
  }
};

/**
 * Price Rounding Functions for Uganda Market
 */
export const roundToNearestShilling = amount => {
  try {
    const numAmount = typeof amount === 'string' ? parseUGX(amount) : amount;
    return Math.round(numAmount);
  } catch (error) {
    console.error('Error rounding to nearest shilling:', error);
    return 0;
  }
};

export const roundToNearestTen = amount => {
  try {
    const numAmount = typeof amount === 'string' ? parseUGX(amount) : amount;
    return Math.round(numAmount / 10) * 10;
  } catch (error) {
    console.error('Error rounding to nearest ten:', error);
    return 0;
  }
};

export const roundToNearestHundred = amount => {
  try {
    const numAmount = typeof amount === 'string' ? parseUGX(amount) : amount;
    return Math.round(numAmount / 100) * 100;
  } catch (error) {
    console.error('Error rounding to nearest hundred:', error);
    return 0;
  }
};

export const roundToNearestThousand = amount => {
  try {
    const numAmount = typeof amount === 'string' ? parseUGX(amount) : amount;
    return Math.round(numAmount / 1000) * 1000;
  } catch (error) {
    console.error('Error rounding to nearest thousand:', error);
    return 0;
  }
};

export const roundUpToNearestThousand = amount => {
  try {
    const numAmount = typeof amount === 'string' ? parseUGX(amount) : amount;
    return Math.ceil(numAmount / 1000) * 1000;
  } catch (error) {
    console.error('Error rounding up to nearest thousand:', error);
    return 0;
  }
};

/**
 * Price Category and Descriptive Functions
 */
export const getPriceCategory = price => {
  try {
    const numPrice = typeof price === 'string' ? parseUGX(price) : price;

    if (numPrice < 10000) return 'budget'; // Under 10K
    if (numPrice < 50000) return 'affordable'; // 10K - 50K
    if (numPrice < 200000) return 'moderate'; // 50K - 200K
    if (numPrice < 500000) return 'expensive'; // 200K - 500K
    if (numPrice < 2000000) return 'premium'; // 500K - 2M
    return 'luxury'; // Over 2M
  } catch (error) {
    console.error('Error getting price category:', error);
    return 'unknown';
  }
};

export const getPriceCategoryLabel = price => {
  try {
    const category = getPriceCategory(price);
    const labels = {
      budget: 'Budget Friendly',
      affordable: 'Affordable',
      moderate: 'Moderately Priced',
      expensive: 'Expensive',
      premium: 'Premium',
      luxury: 'Luxury',
    };

    return labels[category] || 'Unknown';
  } catch (error) {
    console.error('Error getting price category label:', error);
    return 'Unknown';
  }
};

export const formatPriceWithCategory = price => {
  try {
    const formatted = formatUGX(price);
    const category = getPriceCategoryLabel(price);
    return `${formatted} (${category})`;
  } catch (error) {
    console.error('Error formatting price with category:', error);
    return formatUGX(price);
  }
};

/**
 * Discount and Savings Formatting
 */
export const formatSavings = (originalPrice, salePrice, options = {}) => {
  try {
    const {
      showPercentage = true,
      showAmount = true,
      format = 'both', // 'amount', 'percentage', 'both'
    } = options;

    const original = typeof originalPrice === 'string' ? parseUGX(originalPrice) : originalPrice;
    const sale = typeof salePrice === 'string' ? parseUGX(salePrice) : salePrice;

    if (original <= sale) {
      return null; // No savings
    }

    const savingsAmount = original - sale;
    const savingsPercentage = Math.round((savingsAmount / original) * 100);

    const formattedAmount = formatUGX(savingsAmount);
    const formattedPercentage = `${savingsPercentage}%`;

    switch (format) {
      case 'amount':
        return `Save ${formattedAmount}`;
      case 'percentage':
        return `${formattedPercentage} OFF`;
      case 'both':
      default:
        return `Save ${formattedAmount} (${formattedPercentage})`;
    }
  } catch (error) {
    console.error('Error formatting savings:', error);
    return null;
  }
};

export const formatDiscount = (discountPercent, originalPrice = null) => {
  try {
    const discount = parseFloat(discountPercent);

    if (isNaN(discount) || discount <= 0) {
      return null;
    }

    if (originalPrice) {
      const savings = (parseUGX(originalPrice) * discount) / 100;
      return `${discount}% OFF (Save ${formatUGX(savings)})`;
    }

    return `${discount}% OFF`;
  } catch (error) {
    console.error('Error formatting discount:', error);
    return null;
  }
};

/**
 * Price Comparison Functions
 */
export const comparePrices = (price1, price2) => {
  try {
    const p1 = typeof price1 === 'string' ? parseUGX(price1) : price1;
    const p2 = typeof price2 === 'string' ? parseUGX(price2) : price2;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
    return 0;
  } catch (error) {
    console.error('Error comparing prices:', error);
    return 0;
  }
};

export const isHigherPrice = (price1, price2) => {
  return comparePrices(price1, price2) > 0;
};

export const isLowerPrice = (price1, price2) => {
  return comparePrices(price1, price2) < 0;
};

export const isSamePrice = (price1, price2) => {
  return comparePrices(price1, price2) === 0;
};

/**
 * Bulk Pricing and Tier Calculations
 */
export const calculateTierPrice = (basePrice, quantity, tierRules = []) => {
  try {
    const price = typeof basePrice === 'string' ? parseUGX(basePrice) : basePrice;
    const qty = parseInt(quantity) || 1;

    if (tierRules.length === 0) {
      return price * qty;
    }

    // Find applicable tier based on quantity
    let applicableTier = null;
    tierRules.forEach(tier => {
      if (qty >= tier.minQuantity) {
        applicableTier = tier;
      }
    });

    if (applicableTier) {
      if (applicableTier.fixedPrice) {
        return applicableTier.fixedPrice * qty;
      } else if (applicableTier.discountPercent) {
        const discountedPrice = price * (1 - applicableTier.discountPercent / 100);
        return discountedPrice * qty;
      }
    }

    return price * qty;
  } catch (error) {
    console.error('Error calculating tier price:', error);
    return 0;
  }
};

export const formatTierPricing = (tiers = []) => {
  try {
    return tiers.map(tier => {
      const quantityText = tier.maxQuantity
        ? `${tier.minQuantity}-${tier.maxQuantity}`
        : `${tier.minQuantity}+`;

      let priceText;
      if (tier.fixedPrice) {
        priceText = formatUGX(tier.fixedPrice);
      } else if (tier.discountPercent) {
        priceText = `${tier.discountPercent}% OFF`;
      } else {
        priceText = 'Standard Price';
      }

      return {
        quantity: quantityText,
        price: priceText,
        description: tier.description || '',
      };
    });
  } catch (error) {
    console.error('Error formatting tier pricing:', error);
    return [];
  }
};

/**
 * Mobile Money Specific Formatting
 */
export const formatMobileMoneyAmount = (amount, includeFees = false, network = 'MTN') => {
  try {
    const formattedAmount = formatUGX(amount);

    if (!includeFees) {
      return formattedAmount;
    }

    // Calculate fees based on network (this would use actual fee calculation)
    let fee = 0;
    if (network === 'MTN') {
      // Simplified fee calculation - would use actual MTN fee structure
      if (amount <= 2500) fee = 0;
      else if (amount <= 25000) fee = 165;
      else if (amount <= 100000) fee = 330;
      else if (amount <= 500000) fee = 825;
      else fee = 1650;
    } else if (network === 'AIRTEL') {
      // Simplified fee calculation - would use actual Airtel fee structure
      if (amount <= 5000) fee = 0;
      else if (amount <= 30000) fee = 150;
      else if (amount <= 150000) fee = 300;
      else if (amount <= 1000000) fee = 750;
      else fee = 1500;
    }

    const total = parseUGX(amount) + fee;
    const formattedTotal = formatUGX(total);
    const formattedFee = formatUGX(fee);

    return fee > 0
      ? `${formattedAmount} + ${formattedFee} fee = ${formattedTotal}`
      : formattedAmount;
  } catch (error) {
    console.error('Error formatting mobile money amount:', error);
    return formatUGX(amount);
  }
};

export const formatCODAmount = (amount, includeDeliveryFee = true) => {
  try {
    const formattedAmount = formatUGX(amount);

    if (!includeDeliveryFee) {
      return formattedAmount;
    }

    const deliveryFee = 5000; // Standard COD delivery fee
    const total = parseUGX(amount) + deliveryFee;
    const formattedTotal = formatUGX(total);
    const formattedFee = formatUGX(deliveryFee);

    return `${formattedAmount} + ${formattedFee} delivery = ${formattedTotal}`;
  } catch (error) {
    console.error('Error formatting COD amount:', error);
    return formatUGX(amount);
  }
};

/**
 * Utility Functions for Common Operations
 */
export const getSmallestNote = () => {
  // Uganda bank notes denominations
  return [1000, 2000, 5000, 10000, 20000, 50000, 100000];
};

export const breakdownToNotes = amount => {
  try {
    const notes = getSmallestNote().reverse(); // Start with largest
    const numAmount = typeof amount === 'string' ? parseUGX(amount) : amount;
    const breakdown = {};
    let remaining = Math.round(numAmount);

    notes.forEach(note => {
      if (remaining >= note) {
        const count = Math.floor(remaining / note);
        breakdown[note] = count;
        remaining = remaining % note;
      }
    });

    if (remaining > 0) {
      breakdown['coins'] = remaining;
    }

    return breakdown;
  } catch (error) {
    console.error('Error breaking down to notes:', error);
    return {};
  }
};

export const formatNoteBreakdown = amount => {
  try {
    const breakdown = breakdownToNotes(amount);
    const parts = [];

    Object.keys(breakdown).forEach(denomination => {
      const count = breakdown[denomination];
      if (count > 0) {
        if (denomination === 'coins') {
          parts.push(`${formatUGX(count)} in coins`);
        } else {
          const noteValue = formatUGX(denomination);
          parts.push(`${count} × ${noteValue}`);
        }
      }
    });

    return parts.join(', ');
  } catch (error) {
    console.error('Error formatting note breakdown:', error);
    return formatUGX(amount);
  }
};

/**
 * Price Validation Helpers
 */
export const isWholeShilling = amount => {
  try {
    const numAmount = typeof amount === 'string' ? parseUGX(amount) : amount;
    return Number.isInteger(numAmount);
  } catch (error) {
    console.error('Error checking whole shilling:', error);
    return false;
  }
};

export const validatePriceFormat = input => {
  try {
    if (!input) {
      return { isValid: false, error: 'Price is required' };
    }

    const parsed = parseUGX(input);

    if (isNaN(parsed) || parsed < UGX_CONFIG.MIN_VALUE) {
      return {
        isValid: false,
        error: `Price must be at least ${formatUGX(UGX_CONFIG.MIN_VALUE)}`,
      };
    }

    if (parsed > UGX_CONFIG.MAX_VALUE) {
      return {
        isValid: false,
        error: `Price cannot exceed ${formatUGX(UGX_CONFIG.MAX_VALUE)}`,
      };
    }

    if (!isWholeShilling(parsed)) {
      return {
        isValid: false,
        error: 'Price must be a whole number (no decimals)',
      };
    }

    return { isValid: true, value: parsed };
  } catch (error) {
    console.error('Error validating price format:', error);
    return { isValid: false, error: 'Invalid price format' };
  }
};

// Default export with all currency helper functions
export default {
  UGX_CONFIG,
  formatUGX,
  formatPrice,
  formatPriceCompact,
  formatPriceRange,
  parseUGX,
  convertToUGX,
  convertFromUGX,
  isValidUGXAmount,
  isReasonablePrice,
  calculatePriceDifference,
  formatPriceDifference,
  sanitizePriceInput,
  formatPriceInput,
  addCommasToPrice,
  roundToNearestShilling,
  roundToNearestTen,
  roundToNearestHundred,
  roundToNearestThousand,
  roundUpToNearestThousand,
  getPriceCategory,
  getPriceCategoryLabel,
  formatPriceWithCategory,
  formatSavings,
  formatDiscount,
  comparePrices,
  isHigherPrice,
  isLowerPrice,
  isSamePrice,
  calculateTierPrice,
  formatTierPricing,
  formatMobileMoneyAmount,
  formatCODAmount,
  getSmallestNote,
  breakdownToNotes,
  formatNoteBreakdown,
  isWholeShilling,
  validatePriceFormat,
};
