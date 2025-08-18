// Form validation utilities for the Ugandan e-commerce platform
// Comprehensive validation functions for all form fields and data inputs

import { APP_CONFIG } from '../constants/app';
import { EMAIL_DOMAINS } from '../constants/roles';

/**
 * Basic Validation Functions
 */
export const isEmpty = value => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const isRequired = (value, fieldName = 'Field') => {
  if (isEmpty(value)) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }
  return { isValid: true };
};

export const minLength = (value, min, fieldName = 'Field') => {
  if (isEmpty(value)) {
    return { isValid: true }; // Let required validation handle empty values
  }

  const length = typeof value === 'string' ? value.trim().length : String(value).length;
  if (length < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min} characters long`,
    };
  }
  return { isValid: true };
};

export const maxLength = (value, max, fieldName = 'Field') => {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const length = typeof value === 'string' ? value.trim().length : String(value).length;
  if (length > max) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${max} characters`,
    };
  }
  return { isValid: true };
};

export const isNumeric = (value, fieldName = 'Field') => {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const num = Number(value);
  if (isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`,
    };
  }
  return { isValid: true };
};

export const minValue = (value, min, fieldName = 'Field') => {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const num = Number(value);
  if (isNaN(num) || num < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min}`,
    };
  }
  return { isValid: true };
};

export const maxValue = (value, max, fieldName = 'Field') => {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const num = Number(value);
  if (isNaN(num) || num > max) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${max}`,
    };
  }
  return { isValid: true };
};

export const isInRange = (value, min, max, fieldName = 'Field') => {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return {
      isValid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }
  return { isValid: true };
};

/**
 * Email Validation Functions
 */
export const isValidEmail = email => {
  if (isEmpty(email)) {
    return { isValid: true };
  }

  const emailRegex = APP_CONFIG.EMAIL_REGEX;
  if (!emailRegex.test(email.trim().toLowerCase())) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }
  return { isValid: true };
};

export const isValidAdminEmail = email => {
  const emailValidation = isValidEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  if (isEmpty(email)) {
    return { isValid: true };
  }

  const domain = email.trim().toLowerCase().split('@')[1];
  if (!email.endsWith(EMAIL_DOMAINS.ADMIN)) {
    return {
      isValid: false,
      error: 'Admin email must end with @shoponline.com',
    };
  }
  return { isValid: true };
};

export const isValidClientEmail = email => {
  const emailValidation = isValidEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  if (isEmpty(email)) {
    return { isValid: true };
  }

  if (!email.trim().toLowerCase().endsWith(EMAIL_DOMAINS.CLIENT)) {
    return {
      isValid: false,
      error: 'Please use a valid Gmail address',
    };
  }
  return { isValid: true };
};

/**
 * Phone Number Validation Functions
 */
export const isValidPhoneNumber = (phoneNumber, fieldName = 'Phone number') => {
  if (isEmpty(phoneNumber)) {
    return { isValid: true };
  }

  const phoneRegex = APP_CONFIG.PHONE_REGEX;
  if (!phoneRegex.test(phoneNumber.trim())) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid Uganda phone number (e.g., 077XXXXXXX, 075XXXXXXX)`,
    };
  }
  return { isValid: true };
};

export const isValidMTNNumber = phoneNumber => {
  if (isEmpty(phoneNumber)) {
    return { isValid: true };
  }

  const mtnRegex = /^(\+256|0)(77|78|76|39)\d{7}$/;
  if (!mtnRegex.test(phoneNumber.trim())) {
    return {
      isValid: false,
      error: 'Please enter a valid MTN number (077, 078, 076, or 039)',
    };
  }
  return { isValid: true };
};

export const isValidAirtelNumber = phoneNumber => {
  if (isEmpty(phoneNumber)) {
    return { isValid: true };
  }

  const airtelRegex = /^(\+256|0)(75|70|74|20)\d{7}$/;
  if (!airtelRegex.test(phoneNumber.trim())) {
    return {
      isValid: false,
      error: 'Please enter a valid Airtel number (075, 070, 074, or 020)',
    };
  }
  return { isValid: true };
};

/**
 * Password Validation Functions
 */
export const isValidPassword = password => {
  if (isEmpty(password)) {
    return { isValid: true };
  }

  const errors = [];

  if (password.length < APP_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${APP_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors[0], // Return first error
      errors: errors, // Return all errors for detailed feedback
    };
  }

  return { isValid: true };
};

export const isPasswordMatch = (password, confirmPassword) => {
  if (isEmpty(password) && isEmpty(confirmPassword)) {
    return { isValid: true };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Passwords do not match',
    };
  }
  return { isValid: true };
};

/**
 * File Validation Functions
 */
export const isValidFileType = (file, allowedTypes = []) => {
  if (!file) {
    return { isValid: true };
  }

  if (allowedTypes.length === 0) {
    return { isValid: true };
  }

  if (!allowedTypes.includes(file.type)) {
    const allowedTypesString = allowedTypes.join(', ');
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypesString}`,
    };
  }
  return { isValid: true };
};

export const isValidFileSize = (file, maxSize = APP_CONFIG.MAX_FILE_SIZE) => {
  if (!file) {
    return { isValid: true };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size must not exceed ${maxSizeMB}MB`,
    };
  }
  return { isValid: true };
};

export const isValidImageFile = file => {
  const typeValidation = isValidFileType(file, APP_CONFIG.ALLOWED_IMAGE_TYPES);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  const sizeValidation = isValidFileSize(file, APP_CONFIG.MAX_IMAGE_SIZE);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return { isValid: true };
};

/**
 * Price and Currency Validation Functions
 */
export const isValidPrice = (price, fieldName = 'Price') => {
  if (isEmpty(price)) {
    return { isValid: true };
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid positive number`,
    };
  }

  if (numPrice > 100000000) {
    // 100 million UGX limit
    return {
      isValid: false,
      error: `${fieldName} cannot exceed 100,000,000 UGX`,
    };
  }

  return { isValid: true };
};

export const isValidDiscountPercentage = discount => {
  if (isEmpty(discount)) {
    return { isValid: true };
  }

  const numDiscount = Number(discount);
  if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
    return {
      isValid: false,
      error: 'Discount must be between 0% and 100%',
    };
  }

  return { isValid: true };
};

export const isValidQuantity = (quantity, maxQuantity = APP_CONFIG.MAX_QUANTITY_PER_ITEM) => {
  if (isEmpty(quantity)) {
    return { isValid: true };
  }

  const numQuantity = Number(quantity);
  if (isNaN(numQuantity) || numQuantity < 1) {
    return {
      isValid: false,
      error: 'Quantity must be at least 1',
    };
  }

  if (numQuantity > maxQuantity) {
    return {
      isValid: false,
      error: `Quantity cannot exceed ${maxQuantity}`,
    };
  }

  if (!Number.isInteger(numQuantity)) {
    return {
      isValid: false,
      error: 'Quantity must be a whole number',
    };
  }

  return { isValid: true };
};

/**
 * Date Validation Functions
 */
export const isValidDate = (date, fieldName = 'Date') => {
  if (isEmpty(date)) {
    return { isValid: true };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      error: `${fieldName} is not a valid date`,
    };
  }

  return { isValid: true };
};

export const isFutureDate = (date, fieldName = 'Date') => {
  const dateValidation = isValidDate(date, fieldName);
  if (!dateValidation.isValid) {
    return dateValidation;
  }

  if (isEmpty(date)) {
    return { isValid: true };
  }

  const dateObj = new Date(date);
  const now = new Date();

  if (dateObj <= now) {
    return {
      isValid: false,
      error: `${fieldName} must be in the future`,
    };
  }

  return { isValid: true };
};

export const isPastDate = (date, fieldName = 'Date') => {
  const dateValidation = isValidDate(date, fieldName);
  if (!dateValidation.isValid) {
    return dateValidation;
  }

  if (isEmpty(date)) {
    return { isValid: true };
  }

  const dateObj = new Date(date);
  const now = new Date();

  if (dateObj >= now) {
    return {
      isValid: false,
      error: `${fieldName} must be in the past`,
    };
  }

  return { isValid: true };
};

export const isValidDateRange = (startDate, endDate) => {
  const startValidation = isValidDate(startDate, 'Start date');
  if (!startValidation.isValid) {
    return startValidation;
  }

  const endValidation = isValidDate(endDate, 'End date');
  if (!endValidation.isValid) {
    return endValidation;
  }

  if (isEmpty(startDate) || isEmpty(endDate)) {
    return { isValid: true };
  }

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  if (endDateObj <= startDateObj) {
    return {
      isValid: false,
      error: 'End date must be after start date',
    };
  }

  return { isValid: true };
};

/**
 * URL Validation Functions
 */
export const isValidUrl = (url, fieldName = 'URL') => {
  if (isEmpty(url)) {
    return { isValid: true };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: `${fieldName} must be a valid URL`,
    };
  }
};

export const isValidSlug = (slug, fieldName = 'Slug') => {
  if (isEmpty(slug)) {
    return { isValid: true };
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug.trim().toLowerCase())) {
    return {
      isValid: false,
      error: `${fieldName} can only contain lowercase letters, numbers, and hyphens`,
    };
  }

  return { isValid: true };
};

/**
 * Composite Validation Functions
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const fieldValue = data[field];

    for (const rule of fieldRules) {
      const validation = rule(fieldValue);
      if (!validation.isValid) {
        errors[field] = validation.error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });

  return { isValid, errors };
};

export const validateField = (value, rules) => {
  for (const rule of rules) {
    const validation = rule(value);
    if (!validation.isValid) {
      return validation;
    }
  }
  return { isValid: true };
};

/**
 * Common Validation Rule Sets
 */
export const VALIDATION_RULES = {
  // User validation rules
  firstName: [
    value => isRequired(value, 'First name'),
    value => minLength(value, 2, 'First name'),
    value => maxLength(value, 50, 'First name'),
  ],

  lastName: [
    value => isRequired(value, 'Last name'),
    value => minLength(value, 2, 'Last name'),
    value => maxLength(value, 50, 'Last name'),
  ],

  email: [value => isRequired(value, 'Email'), value => isValidEmail(value)],

  adminEmail: [value => isRequired(value, 'Email'), value => isValidAdminEmail(value)],

  clientEmail: [value => isRequired(value, 'Email'), value => isValidClientEmail(value)],

  password: [value => isRequired(value, 'Password'), value => isValidPassword(value)],

  confirmPassword: password => [
    value => isRequired(value, 'Confirm password'),
    value => isPasswordMatch(password, value),
  ],

  phoneNumber: [value => isRequired(value, 'Phone number'), value => isValidPhoneNumber(value)],

  // Product validation rules
  productName: [
    value => isRequired(value, 'Product name'),
    value => minLength(value, 3, 'Product name'),
    value => maxLength(value, 200, 'Product name'),
  ],

  productDescription: [
    value => isRequired(value, 'Product description'),
    value => minLength(value, 10, 'Product description'),
    value => maxLength(value, 2000, 'Product description'),
  ],

  productPrice: [value => isRequired(value, 'Price'), value => isValidPrice(value)],

  productQuantity: [value => isRequired(value, 'Quantity'), value => isValidQuantity(value)],

  // Category validation rules
  categoryName: [
    value => isRequired(value, 'Category name'),
    value => minLength(value, 2, 'Category name'),
    value => maxLength(value, 100, 'Category name'),
  ],

  categorySlug: [
    value => isRequired(value, 'Category slug'),
    value => isValidSlug(value, 'Category slug'),
  ],

  // Flash sale validation rules
  flashSaleName: [
    value => isRequired(value, 'Flash sale name'),
    value => minLength(value, 3, 'Flash sale name'),
    value => maxLength(value, 100, 'Flash sale name'),
  ],

  flashSaleDiscount: [
    value => isRequired(value, 'Discount percentage'),
    value => isValidDiscountPercentage(value),
  ],

  flashSaleStartDate: [
    value => isRequired(value, 'Start date'),
    value => isValidDate(value, 'Start date'),
  ],

  flashSaleEndDate: startDate => [
    value => isRequired(value, 'End date'),
    value => isValidDate(value, 'End date'),
    value => isValidDateRange(startDate, value),
  ],

  // Address validation rules
  address: [
    value => isRequired(value, 'Address'),
    value => minLength(value, 10, 'Address'),
    value => maxLength(value, 500, 'Address'),
  ],

  city: [
    value => isRequired(value, 'City'),
    value => minLength(value, 2, 'City'),
    value => maxLength(value, 100, 'City'),
  ],
};

// Default export with all validation functions
export default {
  isEmpty,
  isRequired,
  minLength,
  maxLength,
  isNumeric,
  minValue,
  maxValue,
  isInRange,
  isValidEmail,
  isValidAdminEmail,
  isValidClientEmail,
  isValidPhoneNumber,
  isValidMTNNumber,
  isValidAirtelNumber,
  isValidPassword,
  isPasswordMatch,
  isValidFileType,
  isValidFileSize,
  isValidImageFile,
  isValidPrice,
  isValidDiscountPercentage,
  isValidQuantity,
  isValidDate,
  isFutureDate,
  isPastDate,
  isValidDateRange,
  isValidUrl,
  isValidSlug,
  validateForm,
  validateField,
  VALIDATION_RULES,
};
