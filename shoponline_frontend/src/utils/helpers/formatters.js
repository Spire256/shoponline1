// Data formatting utilities for the Ugandan e-commerce platform
// Handles formatting of currency, dates, numbers, text, and other data types

import { APP_CONFIG } from '../constants/app';

/**
 * Currency Formatting Functions
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = APP_CONFIG.CURRENCY,
    showSymbol = true,
    showDecimals = false,
    locale = 'en-UG',
  } = options;

  try {
    // Convert to number if string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return showSymbol ? `${currency} 0` : '0';
    }

    // Format the number with thousand separators
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
      useGrouping: true,
    }).format(Math.round(numAmount));

    return showSymbol ? `${currency} ${formatted}` : formatted;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return showSymbol ? `${currency} 0` : '0';
  }
};

export const formatPrice = price => formatCurrency(price);

export const formatDiscountedPrice = (originalPrice, discountPercent) => {
  const discountAmount = (originalPrice * discountPercent) / 100;
  const finalPrice = originalPrice - discountAmount;
  return formatCurrency(finalPrice);
};

export const formatDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) {
    return '0%';
  }

  const discountPercent = ((originalPrice - salePrice) / originalPrice) * 100;
  return `${Math.round(discountPercent)}%`;
};

export const formatSavings = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) {
    return formatCurrency(0);
  }

  const savings = originalPrice - salePrice;
  return formatCurrency(savings);
};

/**
 * Date and Time Formatting Functions
 */
export const formatDate = (date, format = APP_CONFIG.DATE_FORMAT) => {
  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: APP_CONFIG.TIMEZONE,
    };

    if (format === 'DD/MM/YYYY') {
      return dateObj.toLocaleDateString('en-GB', options);
    } else if (format === 'MM/DD/YYYY') {
      return dateObj.toLocaleDateString('en-US', options);
    } else if (format === 'YYYY-MM-DD') {
      return dateObj.toISOString().split('T')[0];
    }

    return dateObj.toLocaleDateString('en-UG', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatTime = (time, format = APP_CONFIG.TIME_FORMAT) => {
  try {
    const timeObj = new Date(time);

    if (isNaN(timeObj.getTime())) {
      return 'Invalid Time';
    }

    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
      timeZone: APP_CONFIG.TIMEZONE,
    };

    return timeObj.toLocaleTimeString('en-UG', options);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

export const formatDateTime = (dateTime, options = {}) => {
  const {
    dateFormat = APP_CONFIG.DATE_FORMAT,
    timeFormat = APP_CONFIG.TIME_FORMAT,
    separator = ' ',
  } = options;

  const formattedDate = formatDate(dateTime, dateFormat);
  const formattedTime = formatTime(dateTime, timeFormat);

  return `${formattedDate}${separator}${formattedTime}`;
};

export const formatRelativeTime = date => {
  try {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(date);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

export const formatTimeRemaining = endTime => {
  try {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  } catch (error) {
    console.error('Error formatting time remaining:', error);
    return 'Invalid time';
  }
};

/**
 * Number Formatting Functions
 */
export const formatNumber = (number, options = {}) => {
  const {
    decimals = 0,
    thousandSeparator = ',',
    decimalSeparator = '.',
    prefix = '',
    suffix = '',
  } = options;

  try {
    const num = typeof number === 'string' ? parseFloat(number) : number;

    if (isNaN(num)) {
      return '0';
    }

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    }).format(num);

    return `${prefix}${formatted}${suffix}`;
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
};

export const formatPercentage = (value, decimals = 1) => {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
      return '0%';
    }

    return `${num.toFixed(decimals)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
};

export const formatFileSize = bytes => {
  try {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  } catch (error) {
    console.error('Error formatting file size:', error);
    return '0 Bytes';
  }
};

/**
 * Text Formatting Functions
 */
export const formatName = (firstName, lastName, options = {}) => {
  const { format = 'first_last', capitalize = true } = options;

  const cleanFirst = (firstName || '').trim();
  const cleanLast = (lastName || '').trim();

  if (!cleanFirst && !cleanLast) {
    return '';
  }

  let formatted;
  switch (format) {
    case 'last_first':
      formatted = cleanLast ? `${cleanLast}, ${cleanFirst}` : cleanFirst;
      break;
    case 'first_only':
      formatted = cleanFirst;
      break;
    case 'last_only':
      formatted = cleanLast;
      break;
    case 'initials':
      const firstInitial = cleanFirst.charAt(0);
      const lastInitial = cleanLast.charAt(0);
      formatted = `${firstInitial}${lastInitial}`;
      break;
    default: // 'first_last'
      formatted = `${cleanFirst} ${cleanLast}`.trim();
  }

  if (capitalize) {
    return formatted.replace(/\b\w/g, l => l.toUpperCase());
  }

  return formatted;
};

export const formatPhoneNumber = (phoneNumber, format = 'international') => {
  try {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (!cleaned) {
      return phoneNumber;
    }

    // Handle Uganda phone numbers
    let formatted = cleaned;

    if (cleaned.startsWith('256')) {
      formatted = cleaned;
    } else if (cleaned.startsWith('0')) {
      formatted = `256${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      formatted = `256${cleaned}`;
    }

    switch (format) {
      case 'international':
        return `+${formatted}`;
      case 'national':
        return formatted.startsWith('256') ? `0${formatted.substring(3)}` : cleaned;
      case 'formatted':
        if (formatted.length === 12 && formatted.startsWith('256')) {
          return `+${formatted.substring(0, 3)} ${formatted.substring(3, 6)} ${formatted.substring(
            6,
            9
          )} ${formatted.substring(9)}`;
        }
        break;
      default:
        return phoneNumber;
    }

    return phoneNumber;
  } catch (error) {
    console.error('Error formatting phone number:', error);
    return phoneNumber;
  }
};

export const formatEmail = email => {
  try {
    return email ? email.toLowerCase().trim() : '';
  } catch (error) {
    console.error('Error formatting email:', error);
    return email || '';
  }
};

export const truncateText = (text, maxLength = 100, suffix = '...') => {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - suffix.length) + suffix;
  } catch (error) {
    console.error('Error truncating text:', error);
    return text || '';
  }
};

export const formatSlug = text => {
  try {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  } catch (error) {
    console.error('Error formatting slug:', error);
    return '';
  }
};

/**
 * Status and Badge Formatting
 */
export const formatStatus = status => {
  try {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  } catch (error) {
    console.error('Error formatting status:', error);
    return status || '';
  }
};

export const formatOrderNumber = (id, prefix = 'ORD') => {
  try {
    const paddedId = String(id).padStart(6, '0');
    return `${prefix}-${paddedId}`;
  } catch (error) {
    console.error('Error formatting order number:', error);
    return `${prefix}-000000`;
  }
};

export const formatProductCode = (id, categoryCode = 'PRD') => {
  try {
    const paddedId = String(id).padStart(4, '0');
    return `${categoryCode}${paddedId}`;
  } catch (error) {
    console.error('Error formatting product code:', error);
    return `${categoryCode}0000`;
  }
};

/**
 * Array and Object Formatting
 */
export const formatList = (items, options = {}) => {
  const {
    separator = ', ',
    lastSeparator = ' and ',
    maxItems = null,
    moreText = 'others',
  } = options;

  try {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    let displayItems = [...items];
    let hasMore = false;

    if (maxItems && items.length > maxItems) {
      displayItems = items.slice(0, maxItems);
      hasMore = true;
    }

    if (displayItems.length === 1) {
      const result = displayItems[0];
      return hasMore ? `${result} and ${items.length - 1} ${moreText}` : result;
    }

    const allButLast = displayItems.slice(0, -1).join(separator);
    const last = displayItems[displayItems.length - 1];
    const result = allButLast + lastSeparator + last;

    return hasMore ? `${result} and ${items.length - maxItems} ${moreText}` : result;
  } catch (error) {
    console.error('Error formatting list:', error);
    return '';
  }
};

/**
 * Address Formatting
 */
export const formatAddress = (address, options = {}) => {
  const { format = 'full', separator = ', ' } = options;

  try {
    if (!address || typeof address !== 'object') {
      return '';
    }

    const { street, city, state, postalCode, country = 'Uganda' } = address;

    const parts = [];

    switch (format) {
      case 'street_city':
        if (street) parts.push(street);
        if (city) parts.push(city);
        break;
      case 'city_country':
        if (city) parts.push(city);
        if (country) parts.push(country);
        break;
      case 'short':
        if (city) parts.push(city);
        if (state) parts.push(state);
        break;
      default: // 'full'
        if (street) parts.push(street);
        if (city) parts.push(city);
        if (state) parts.push(state);
        if (postalCode) parts.push(postalCode);
        if (country) parts.push(country);
    }

    return parts.join(separator);
  } catch (error) {
    console.error('Error formatting address:', error);
    return '';
  }
};

// Default export with all formatter functions
export default {
  formatCurrency,
  formatPrice,
  formatDiscountedPrice,
  formatDiscount,
  formatSavings,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatTimeRemaining,
  formatNumber,
  formatPercentage,
  formatFileSize,
  formatName,
  formatPhoneNumber,
  formatEmail,
  truncateText,
  formatSlug,
  formatStatus,
  formatOrderNumber,
  formatProductCode,
  formatList,
  formatAddress,
};
