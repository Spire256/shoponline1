/**
 * Data Encryption Utilities for Ugandan E-commerce Platform
 * Provides client-side encryption for sensitive data like payment info
 */

import CryptoJS from 'crypto-js';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES',
  keySize: 256 / 32,
  ivSize: 128 / 32,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7,
};

/**
 * Generate a random encryption key
 * @returns {string} Random encryption key
 */
export const generateEncryptionKey = () => {
  return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.keySize).toString();
};

/**
 * Generate a random initialization vector
 * @returns {string} Random IV
 */
export const generateIV = () => {
  return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivSize).toString();
};

/**
 * Encrypt sensitive data (e.g., mobile money numbers, payment info)
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {object} Encrypted data with IV
 */
export const encryptData = (data, key) => {
  try {
    if (!data || !key) {
      throw new Error('Data and key are required for encryption');
    }

    const iv = generateIV();
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: ENCRYPTION_CONFIG.mode,
      padding: ENCRYPTION_CONFIG.padding,
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {object} encryptedData - Object containing encrypted data and IV
 * @param {string} key - Decryption key
 * @returns {string} Decrypted data
 */
export const decryptData = (encryptedData, key) => {
  try {
    if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !key) {
      throw new Error('Encrypted data, IV, and key are required for decryption');
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
      mode: ENCRYPTION_CONFIG.mode,
      padding: ENCRYPTION_CONFIG.padding,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash password or sensitive data using SHA-256
 * @param {string} data - Data to hash
 * @param {string} salt - Optional salt
 * @returns {string} Hashed data
 */
export const hashData = (data, salt = '') => {
  try {
    if (!data) {
      throw new Error('Data is required for hashing');
    }

    return CryptoJS.SHA256(data + salt).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
};

/**
 * Encrypt mobile money number for Uganda (MTN/Airtel)
 * @param {string} phoneNumber - Phone number to encrypt
 * @param {string} key - Encryption key
 * @returns {object} Encrypted phone number data
 */
export const encryptMobileNumber = (phoneNumber, key) => {
  try {
    // Validate Uganda phone number format
    const ugandaPhoneRegex = /^(\+256|256|0)(70|71|72|73|74|75|76|77|78|79)\d{7}$/;

    if (!ugandaPhoneRegex.test(phoneNumber)) {
      throw new Error('Invalid Uganda phone number format');
    }

    // Normalize phone number to international format
    let normalizedNumber = phoneNumber;
    if (normalizedNumber.startsWith('0')) {
      normalizedNumber = `+256${normalizedNumber.substring(1)}`;
    } else if (normalizedNumber.startsWith('256')) {
      normalizedNumber = `+${normalizedNumber}`;
    }

    return encryptData(normalizedNumber, key);
  } catch (error) {
    console.error('Mobile number encryption error:', error);
    throw new Error('Failed to encrypt mobile number');
  }
};

/**
 * Encrypt payment data for secure transmission
 * @param {object} paymentData - Payment data to encrypt
 * @param {string} key - Encryption key
 * @returns {object} Encrypted payment data
 */
export const encryptPaymentData = (paymentData, key) => {
  try {
    if (!paymentData || typeof paymentData !== 'object') {
      throw new Error('Valid payment data object is required');
    }

    const sensitiveFields = ['phoneNumber', 'pin', 'amount', 'reference'];
    const encryptedData = {};

    // Encrypt sensitive fields only
    Object.keys(paymentData).forEach(field => {
      if (sensitiveFields.includes(field)) {
        encryptedData[field] = encryptData(paymentData[field].toString(), key);
      } else {
        encryptedData[field] = paymentData[field];
      }
    });

    return encryptedData;
  } catch (error) {
    console.error('Payment data encryption error:', error);
    throw new Error('Failed to encrypt payment data');
  }
};

/**
 * Generate secure random string for tokens
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
export const generateSecureRandom = (length = 32) => {
  try {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    return randomBytes.toString();
  } catch (error) {
    console.error('Random generation error:', error);
    throw new Error('Failed to generate secure random string');
  }
};

/**
 * Create encrypted session data
 * @param {object} sessionData - Session data to encrypt
 * @param {string} key - Session encryption key
 * @returns {string} Encrypted session token
 */
export const createEncryptedSession = (sessionData, key) => {
  try {
    const sessionString = JSON.stringify({
      ...sessionData,
      timestamp: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    return encryptData(sessionString, key);
  } catch (error) {
    console.error('Session encryption error:', error);
    throw new Error('Failed to create encrypted session');
  }
};

/**
 * Decrypt and validate session data
 * @param {object} encryptedSession - Encrypted session data
 * @param {string} key - Session decryption key
 * @returns {object} Decrypted session data
 */
export const decryptSession = (encryptedSession, key) => {
  try {
    const decryptedString = decryptData(encryptedSession, key);
    const sessionData = JSON.parse(decryptedString);

    // Check if session is expired
    if (sessionData.expires && Date.now() > sessionData.expires) {
      throw new Error('Session expired');
    }

    return sessionData;
  } catch (error) {
    console.error('Session decryption error:', error);
    throw new Error('Failed to decrypt session data');
  }
};

/**
 * Utility to securely compare two strings (timing attack resistant)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings are equal
 */
export const secureCompare = (a, b) => {
  try {
    if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error('Secure compare error:', error);
    return false;
  }
};

/**
 * Clear sensitive data from memory
 * @param {object} obj - Object containing sensitive data
 */
export const clearSensitiveData = obj => {
  try {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
          clearSensitiveData(obj[key]);
        }
        obj[key] = null;
      });
    }
  } catch (error) {
    console.error('Clear sensitive data error:', error);
  }
};

// Export default encryption utilities
export default {
  generateEncryptionKey,
  generateIV,
  encryptData,
  decryptData,
  hashData,
  encryptMobileNumber,
  encryptPaymentData,
  generateSecureRandom,
  createEncryptedSession,
  decryptSession,
  secureCompare,
  clearSensitiveData,
};
