/**
 * Input Sanitization Utilities for Ugandan E-commerce Platform
 * Provides comprehensive input sanitization and validation
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized HTML
 */
export const sanitizeHTML = (html, options = {}) => {
  try {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const defaultOptions = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'title', 'alt'],
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
      ...options,
    };

    return DOMPurify.sanitize(html, defaultOptions);
  } catch (error) {
    console.error('HTML sanitization error:', error);
    return '';
  }
};

/**
 * Sanitize plain text input
 * @param {string} text - Text to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text, options = {}) => {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const {
      maxLength = 1000,
      allowNewlines = true,
      removeExtraSpaces = true,
      allowSpecialChars = true,
    } = options;

    let sanitized = text;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Handle newlines
    if (!allowNewlines) {
      sanitized = sanitized.replace(/[\r\n]/g, ' ');
    }

    // Remove extra spaces
    if (removeExtraSpaces) {
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
    }

    // Remove dangerous characters if not allowing special chars
    if (!allowSpecialChars) {
      sanitized = sanitized.replace(/[<>\"'&]/g, '');
    }

    // Truncate if too long
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  } catch (error) {
    console.error('Text sanitization error:', error);
    return '';
  }
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = email => {
  try {
    if (!email || typeof email !== 'string') {
      return '';
    }

    // Convert to lowercase and trim
    let sanitized = email.toLowerCase().trim();

    // Remove dangerous characters
    sanitized = sanitized.replace(/[^a-z0-9@._-]/g, '');

    // Validate email format for Uganda (gmail.com for clients, @shoponline.com for admins)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(sanitized)) {
      return '';
    }

    // Check for valid domains for this platform
    const validDomains = ['gmail.com', 'shoponline.com'];
    const domain = sanitized.split('@')[1];

    if (!validDomains.includes(domain)) {
      console.warn('Email domain not in allowed list:', domain);
    }

    return sanitized;
  } catch (error) {
    console.error('Email sanitization error:', error);
    return '';
  }
};

/**
 * Sanitize Uganda phone number
 * @param {string} phoneNumber - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
export const sanitizePhoneNumber = phoneNumber => {
  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return '';
    }

    // Remove all non-digit characters except +
    let sanitized = phoneNumber.replace(/[^\d+]/g, '');

    // Handle different Uganda phone number formats
    if (sanitized.startsWith('0')) {
      sanitized = `+256${sanitized.substring(1)}`;
    } else if (sanitized.startsWith('256')) {
      sanitized = `+${sanitized}`;
    } else if (!sanitized.startsWith('+256')) {
      // Assume it's missing country code if it starts with 7
      if (sanitized.startsWith('7') && sanitized.length === 9) {
        sanitized = `+256${sanitized}`;
      }
    }

    // Validate Uganda phone number format
    const ugandaPhoneRegex = /^\+256(70|71|72|73|74|75|76|77|78|79)\d{7}$/;

    if (!ugandaPhoneRegex.test(sanitized)) {
      console.warn('Invalid Uganda phone number format:', sanitized);
      return '';
    }

    return sanitized;
  } catch (error) {
    console.error('Phone number sanitization error:', error);
    return '';
  }
};

/**
 * Sanitize monetary amount (Uganda Shillings)
 * @param {string|number} amount - Amount to sanitize
 * @returns {number} Sanitized amount
 */
export const sanitizeAmount = amount => {
  try {
    if (amount === null || amount === undefined) {
      return 0;
    }

    let sanitized;

    if (typeof amount === 'string') {
      // Remove currency symbols and commas
      sanitized = amount.replace(/[UGX\s,]/gi, '');
      sanitized = parseFloat(sanitized);
    } else if (typeof amount === 'number') {
      sanitized = amount;
    } else {
      return 0;
    }

    // Check if it's a valid number
    if (isNaN(sanitized) || !isFinite(sanitized)) {
      return 0;
    }

    // Ensure positive amount
    sanitized = Math.abs(sanitized);

    // Round to 2 decimal places for currency
    sanitized = Math.round(sanitized * 100) / 100;

    // Set reasonable limits for Uganda Shillings (max 100M UGX)
    const maxAmount = 100000000;
    if (sanitized > maxAmount) {
      console.warn('Amount exceeds maximum allowed:', sanitized);
      return maxAmount;
    }

    return sanitized;
  } catch (error) {
    console.error('Amount sanitization error:', error);
    return 0;
  }
};

/**
 * Sanitize product name/title
 * @param {string} name - Product name to sanitize
 * @returns {string} Sanitized product name
 */
export const sanitizeProductName = name => {
  try {
    if (!name || typeof name !== 'string') {
      return '';
    }

    let sanitized = name;

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove dangerous characters but allow some special chars for product names
    sanitized = sanitized.replace(/[<>\"'&\0]/g, '');

    // Limit length and trim
    sanitized = sanitized.substring(0, 200).trim();

    // Remove extra spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  } catch (error) {
    console.error('Product name sanitization error:', error);
    return '';
  }
};

/**
 * Sanitize search query
 * @param {string} query - Search query to sanitize
 * @returns {string} Sanitized search query
 */
export const sanitizeSearchQuery = query => {
  try {
    if (!query || typeof query !== 'string') {
      return '';
    }

    let sanitized = query;

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION|EXEC|EXECUTE)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(--|\#|\/\*|\*\/)/g,
      /(;|\||\&|\$)/g,
    ];

    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>\"'&\0]/g, '');

    // Limit length and trim
    sanitized = sanitized.substring(0, 100).trim();

    // Remove extra spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  } catch (error) {
    console.error('Search query sanitization error:', error);
    return '';
  }
};

/**
 * Sanitize URL parameter
 * @param {string} param - URL parameter to sanitize
 * @returns {string} Sanitized URL parameter
 */
export const sanitizeURLParam = param => {
  try {
    if (!param || typeof param !== 'string') {
      return '';
    }

    let sanitized = param;

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>\"'&\0\r\n]/g, '');

    // URL encode special characters
    sanitized = encodeURIComponent(sanitized);

    // Limit length
    sanitized = sanitized.substring(0, 500);

    return sanitized;
  } catch (error) {
    console.error('URL parameter sanitization error:', error);
    return '';
  }
};

/**
 * Sanitize file name for uploads
 * @param {string} fileName - File name to sanitize
 * @returns {string} Sanitized file name
 */
export const sanitizeFileName = fileName => {
  try {
    if (!fileName || typeof fileName !== 'string') {
      return '';
    }

    let sanitized = fileName;

    // Remove path separators and dangerous characters
    sanitized = sanitized.replace(/[\/\\:*?"<>|]/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Limit length
    sanitized = sanitized.substring(0, 255);

    // Ensure it's not empty after sanitization
    if (!sanitized.trim()) {
      sanitized = `upload_${Date.now()}`;
    }

    return sanitized.trim();
  } catch (error) {
    console.error('File name sanitization error:', error);
    return `upload_${Date.now()}`;
  }
};

/**
 * Sanitize object with multiple fields
 * @param {object} obj - Object to sanitize
 * @param {object} fieldRules - Rules for each field
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj, fieldRules = {}) => {
  try {
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    const sanitized = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const rule = fieldRules[key];

      if (!rule) {
        // Default text sanitization
        if (typeof value === 'string') {
          sanitized[key] = sanitizeText(value);
        } else {
          sanitized[key] = value;
        }
        return;
      }

      switch (rule.type) {
        case 'email':
          sanitized[key] = sanitizeEmail(value);
          break;
        case 'phone':
          sanitized[key] = sanitizePhoneNumber(value);
          break;
        case 'amount':
          sanitized[key] = sanitizeAmount(value);
          break;
        case 'productName':
          sanitized[key] = sanitizeProductName(value);
          break;
        case 'html':
          sanitized[key] = sanitizeHTML(value, rule.options);
          break;
        case 'text':
          sanitized[key] = sanitizeText(value, rule.options);
          break;
        case 'fileName':
          sanitized[key] = sanitizeFileName(value);
          break;
        default:
          sanitized[key] = sanitizeText(value);
      }
    });

    return sanitized;
  } catch (error) {
    console.error('Object sanitization error:', error);
    return {};
  }
};

/**
 * Check if input contains potential XSS payloads
 * @param {string} input - Input to check
 * @returns {boolean} True if potentially dangerous
 */
export const containsXSS = input => {
  try {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<[^>]*onerror\s*=/gi,
      /<[^>]*onload\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  } catch (error) {
    console.error('XSS check error:', error);
    return true; // Err on the side of caution
  }
};

// Export all sanitization functions
export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeAmount,
  sanitizeProductName,
  sanitizeSearchQuery,
  sanitizeURLParam,
  sanitizeFileName,
  sanitizeObject,
  containsXSS,
};
