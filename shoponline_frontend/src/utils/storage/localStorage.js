// Local storage wrapper for the Ugandan e-commerce platform
// Provides safe and efficient local storage operations with error handling

import { STORAGE_KEYS } from '../constants/app';

/**
 * Core Storage Operations
 */
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.warn('Local storage is not available:', error);
    return false;
  }
};

export const setItem = (key, value, expiryInMs = null) => {
  try {
    if (!isStorageAvailable()) {
      console.warn('Local storage not available, using memory storage');
      return false;
    }

    const storageData = {
      value: value,
      timestamp: Date.now(),
      expiry: expiryInMs ? Date.now() + expiryInMs : null,
    };

    localStorage.setItem(key, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error('Error setting localStorage item:', error);
    return false;
  }
};

export const getItem = (key, defaultValue = null) => {
  try {
    if (!isStorageAvailable()) {
      return defaultValue;
    }

    const item = localStorage.getItem(key);

    if (!item) {
      return defaultValue;
    }

    const storageData = JSON.parse(item);

    // Check if item has expired
    if (storageData.expiry && Date.now() > storageData.expiry) {
      localStorage.removeItem(key);
      return defaultValue;
    }

    return storageData.value;
  } catch (error) {
    console.error('Error getting localStorage item:', error);
    return defaultValue;
  }
};

export const removeItem = key => {
  try {
    if (!isStorageAvailable()) {
      return false;
    }

    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing localStorage item:', error);
    return false;
  }
};

export const clear = () => {
  try {
    if (!isStorageAvailable()) {
      return false;
    }

    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

export const hasItem = key => {
  try {
    if (!isStorageAvailable()) {
      return false;
    }

    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error('Error checking localStorage item:', error);
    return false;
  }
};

export const getItemSize = key => {
  try {
    const item = localStorage.getItem(key);
    return item ? new Blob([item]).size : 0;
  } catch (error) {
    console.error('Error getting item size:', error);
    return 0;
  }
};

export const getTotalSize = () => {
  try {
    if (!isStorageAvailable()) {
      return 0;
    }

    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += getItemSize(key);
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error getting total storage size:', error);
    return 0;
  }
};

/**
 * Specialized Storage Functions for E-commerce
 */
export const setUserData = userData => {
  return setItem(STORAGE_KEYS.USER_DATA, userData);
};

export const getUserData = () => {
  return getItem(STORAGE_KEYS.USER_DATA);
};

export const removeUserData = () => {
  return removeItem(STORAGE_KEYS.USER_DATA);
};

export const setAuthToken = (token, expiryInMs = null) => {
  return setItem(STORAGE_KEYS.AUTH_TOKEN, token, expiryInMs);
};

export const getAuthToken = () => {
  return getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeAuthToken = () => {
  return removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const setRefreshToken = (token, expiryInMs = null) => {
  return setItem(STORAGE_KEYS.REFRESH_TOKEN, token, expiryInMs);
};

export const getRefreshToken = () => {
  return getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const removeRefreshToken = () => {
  return removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const setCartData = cartData => {
  const expiryInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  return setItem(STORAGE_KEYS.CART_DATA, cartData, expiryInMs);
};

export const getCartData = () => {
  return getItem(STORAGE_KEYS.CART_DATA, []);
};

export const removeCartData = () => {
  return removeItem(STORAGE_KEYS.CART_DATA);
};

export const setWishlistData = wishlistData => {
  const expiryInMs = 90 * 24 * 60 * 60 * 1000; // 90 days
  return setItem(STORAGE_KEYS.WISHLIST_DATA, wishlistData, expiryInMs);
};

export const getWishlistData = () => {
  return getItem(STORAGE_KEYS.WISHLIST_DATA, []);
};

export const removeWishlistData = () => {
  return removeItem(STORAGE_KEYS.WISHLIST_DATA);
};

export const setRecentSearches = searches => {
  const expiryInMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  return setItem(STORAGE_KEYS.RECENT_SEARCHES, searches, expiryInMs);
};

export const getRecentSearches = () => {
  return getItem(STORAGE_KEYS.RECENT_SEARCHES, []);
};

export const addRecentSearch = searchTerm => {
  try {
    const recent = getRecentSearches();
    const maxSearches = 10;

    // Remove if already exists
    const filtered = recent.filter(term => term.toLowerCase() !== searchTerm.toLowerCase());

    // Add to beginning
    const updated = [searchTerm, ...filtered].slice(0, maxSearches);

    return setRecentSearches(updated);
  } catch (error) {
    console.error('Error adding recent search:', error);
    return false;
  }
};

export const setViewedProducts = products => {
  const expiryInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  return setItem(STORAGE_KEYS.VIEWED_PRODUCTS, products, expiryInMs);
};

export const getViewedProducts = () => {
  return getItem(STORAGE_KEYS.VIEWED_PRODUCTS, []);
};

export const addViewedProduct = productId => {
  try {
    const viewed = getViewedProducts();
    const maxProducts = 20;

    // Remove if already exists
    const filtered = viewed.filter(id => id !== productId);

    // Add to beginning
    const updated = [productId, ...filtered].slice(0, maxProducts);

    return setViewedProducts(updated);
  } catch (error) {
    console.error('Error adding viewed product:', error);
    return false;
  }
};

export const setThemePreference = theme => {
  return setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
};

export const getThemePreference = () => {
  return getItem(STORAGE_KEYS.THEME_PREFERENCE, 'light');
};

export const setLanguagePreference = language => {
  return setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, language);
};

export const getLanguagePreference = () => {
  return getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, 'en');
};

export const setGuestId = guestId => {
  const expiryInMs = 24 * 60 * 60 * 1000; // 24 hours
  return setItem(STORAGE_KEYS.GUEST_ID, guestId, expiryInMs);
};

export const getGuestId = () => {
  return getItem(STORAGE_KEYS.GUEST_ID);
};

export const setRememberMe = remember => {
  return setItem(STORAGE_KEYS.REMEMBER_ME, remember);
};

export const getRememberMe = () => {
  return getItem(STORAGE_KEYS.REMEMBER_ME, false);
};

/**
 * Bulk Operations
 */
export const setMultipleItems = items => {
  try {
    const results = {};

    Object.keys(items).forEach(key => {
      results[key] = setItem(key, items[key]);
    });

    return results;
  } catch (error) {
    console.error('Error setting multiple items:', error);
    return {};
  }
};

export const getMultipleItems = (keys, defaultValues = {}) => {
  try {
    const results = {};

    keys.forEach(key => {
      results[key] = getItem(key, defaultValues[key] || null);
    });

    return results;
  } catch (error) {
    console.error('Error getting multiple items:', error);
    return {};
  }
};

export const removeMultipleItems = keys => {
  try {
    const results = {};

    keys.forEach(key => {
      results[key] = removeItem(key);
    });

    return results;
  } catch (error) {
    console.error('Error removing multiple items:', error);
    return {};
  }
};

/**
 * Storage Cleanup and Maintenance
 */
export const cleanupExpiredItems = () => {
  try {
    if (!isStorageAvailable()) {
      return { cleaned: 0, errors: 0 };
    }

    let cleaned = 0;
    let errors = 0;

    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);

        if (item) {
          const storageData = JSON.parse(item);

          // Check if item has expiry and is expired
          if (storageData.expiry && Date.now() > storageData.expiry) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      } catch (error) {
        console.error(`Error cleaning up item ${key}:`, error);
        errors++;
      }
    });

    return { cleaned, errors };
  } catch (error) {
    console.error('Error during cleanup:', error);
    return { cleaned: 0, errors: 1 };
  }
};

export const clearUserSession = () => {
  try {
    const userRelatedKeys = [
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.CART_DATA,
      STORAGE_KEYS.WISHLIST_DATA,
    ];

    return removeMultipleItems(userRelatedKeys);
  } catch (error) {
    console.error('Error clearing user session:', error);
    return {};
  }
};

export const clearAppData = () => {
  try {
    const appKeys = Object.values(STORAGE_KEYS);
    return removeMultipleItems(appKeys);
  } catch (error) {
    console.error('Error clearing app data:', error);
    return {};
  }
};

/**
 * Storage Statistics and Monitoring
 */
export const getStorageStats = () => {
  try {
    if (!isStorageAvailable()) {
      return {
        available: false,
        totalSize: 0,
        itemCount: 0,
        items: [],
      };
    }

    const items = [];
    let totalSize = 0;

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = getItemSize(key);
        const item = localStorage.getItem(key);

        let parsedData = null;
        let hasExpiry = false;
        let isExpired = false;

        try {
          parsedData = JSON.parse(item);
          hasExpiry = Boolean(parsedData.expiry);
          isExpired = parsedData.expiry && Date.now() > parsedData.expiry;
        } catch {
          // Item is not in our format, probably plain text
        }

        items.push({
          key,
          size,
          hasExpiry,
          isExpired,
          lastModified: parsedData ? parsedData.timestamp : null,
        });

        totalSize += size;
      }
    }

    return {
      available: true,
      totalSize,
      itemCount: items.length,
      items: items.sort((a, b) => b.size - a.size), // Sort by size descending
      expiredItems: items.filter(item => item.isExpired).length,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      available: false,
      totalSize: 0,
      itemCount: 0,
      items: [],
    };
  }
};

export const isStorageNearLimit = (threshold = 0.8) => {
  try {
    if (!isStorageAvailable()) {
      return false;
    }

    // Rough estimate of storage limit (5-10MB in most browsers)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const currentSize = getTotalSize();

    return currentSize / estimatedLimit > threshold;
  } catch (error) {
    console.error('Error checking storage limit:', error);
    return false;
  }
};

/**
 * Advanced Storage Operations
 */
export const setItemWithCallback = (key, value, options = {}) => {
  try {
    const { expiryInMs = null, onSuccess = null, onError = null, compress = false } = options;

    let processedValue = value;

    // Basic compression for large objects
    if (compress && typeof value === 'object') {
      processedValue = JSON.stringify(value);
    }

    const success = setItem(key, processedValue, expiryInMs);

    if (success && onSuccess) {
      onSuccess(key, value);
    } else if (!success && onError) {
      onError(key, new Error('Failed to store item'));
    }

    return success;
  } catch (error) {
    console.error('Error setting item with callback:', error);
    if (options.onError) {
      options.onError(key, error);
    }
    return false;
  }
};

export const updateItem = (key, updateFunction, defaultValue = null) => {
  try {
    const currentValue = getItem(key, defaultValue);
    const newValue = updateFunction(currentValue);
    return setItem(key, newValue);
  } catch (error) {
    console.error('Error updating localStorage item:', error);
    return false;
  }
};

export const incrementNumber = (key, increment = 1, defaultValue = 0) => {
  return updateItem(
    key,
    current => {
      const num = typeof current === 'number' ? current : defaultValue;
      return num + increment;
    },
    defaultValue
  );
};

export const appendToArray = (key, newItem, maxLength = null) => {
  return updateItem(
    key,
    current => {
      const array = Array.isArray(current) ? current : [];
      const updated = [...array, newItem];

      if (maxLength && updated.length > maxLength) {
        return updated.slice(-maxLength);
      }

      return updated;
    },
    []
  );
};

export const removeFromArray = (key, itemToRemove, compareFunction = null) => {
  return updateItem(
    key,
    current => {
      const array = Array.isArray(current) ? current : [];

      if (compareFunction) {
        return array.filter(item => !compareFunction(item, itemToRemove));
      }

      return array.filter(item => item !== itemToRemove);
    },
    []
  );
};

export const updateObjectProperty = (key, property, value) => {
  return updateItem(
    key,
    current => {
      const obj = typeof current === 'object' && current !== null ? current : {};
      return { ...obj, [property]: value };
    },
    {}
  );
};

/**
 * Cache-like Operations
 */
export const setWithTTL = (key, value, ttlInSeconds) => {
  const expiryInMs = ttlInSeconds * 1000;
  return setItem(key, value, expiryInMs);
};

export const getWithDefault = (key, defaultValue, setDefault = false) => {
  try {
    const value = getItem(key);

    if (value === null && setDefault) {
      setItem(key, defaultValue);
      return defaultValue;
    }

    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error('Error getting with default:', error);
    return defaultValue;
  }
};

export const setIfNotExists = (key, value, expiryInMs = null) => {
  try {
    if (!hasItem(key)) {
      return setItem(key, value, expiryInMs);
    }
    return false; // Item already exists
  } catch (error) {
    console.error('Error setting if not exists:', error);
    return false;
  }
};

/**
 * Backup and Restore Functions
 */
export const exportData = (keys = null) => {
  try {
    if (!isStorageAvailable()) {
      return null;
    }

    const data = {};
    const targetKeys = keys || Object.keys(localStorage);

    targetKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        data[key] = item;
      }
    });

    return {
      data,
      timestamp: Date.now(),
      version: '1.0',
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

export const importData = (backupData, options = {}) => {
  try {
    const { overwrite = false, skipKeys = [], onlyKeys = null } = options;

    if (!backupData || !backupData.data) {
      return { success: false, error: 'Invalid backup data' };
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    Object.keys(backupData.data).forEach(key => {
      try {
        // Skip if in skip list
        if (skipKeys.includes(key)) {
          skipped++;
          return;
        }

        // Skip if only specific keys requested and this isn't one
        if (onlyKeys && !onlyKeys.includes(key)) {
          skipped++;
          return;
        }

        // Skip if exists and overwrite is false
        if (!overwrite && hasItem(key)) {
          skipped++;
          return;
        }

        localStorage.setItem(key, backupData.data[key]);
        imported++;
      } catch (error) {
        console.error(`Error importing key ${key}:`, error);
        errors++;
      }
    });

    return {
      success: true,
      imported,
      skipped,
      errors,
    };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Event-driven Storage
 */
export const createStorageListener = (callback, keys = null) => {
  try {
    const handleStorageChange = event => {
      try {
        // Only listen to changes for specific keys if provided
        if (keys && !keys.includes(event.key)) {
          return;
        }

        const change = {
          key: event.key,
          oldValue: event.oldValue,
          newValue: event.newValue,
          timestamp: Date.now(),
        };

        callback(change);
      } catch (error) {
        console.error('Error in storage listener callback:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  } catch (error) {
    console.error('Error creating storage listener:', error);
    return () => {}; // Return empty cleanup function
  }
};

/**
 * Migration and Versioning
 */
export const migrateStorageData = (migrations = []) => {
  try {
    const currentVersion = getItem('__storage_version__', '0.0.0');

    migrations.forEach(migration => {
      if (compareVersions(currentVersion, migration.version) < 0) {
        try {
          migration.migrate();
          console.log(`Migrated storage to version ${migration.version}`);
        } catch (error) {
          console.error(`Failed to migrate to version ${migration.version}:`, error);
        }
      }
    });

    // Update to latest version
    if (migrations.length > 0) {
      const latestVersion = migrations[migrations.length - 1].version;
      setItem('__storage_version__', latestVersion);
    }

    return true;
  } catch (error) {
    console.error('Error migrating storage data:', error);
    return false;
  }
};

export const compareVersions = (version1, version2) => {
  try {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;

      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }

    return 0;
  } catch (error) {
    console.error('Error comparing versions:', error);
    return 0;
  }
};

// Default export with all localStorage functions
export default {
  isStorageAvailable,
  setItem,
  getItem,
  removeItem,
  clear,
  hasItem,
  getItemSize,
  getTotalSize,
  setUserData,
  getUserData,
  removeUserData,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  setCartData,
  getCartData,
  removeCartData,
  setWishlistData,
  getWishlistData,
  removeWishlistData,
  setRecentSearches,
  getRecentSearches,
  addRecentSearch,
  setViewedProducts,
  getViewedProducts,
  addViewedProduct,
  setThemePreference,
  getThemePreference,
  setLanguagePreference,
  getLanguagePreference,
  setGuestId,
  getGuestId,
  setRememberMe,
  getRememberMe,
  setMultipleItems,
  getMultipleItems,
  removeMultipleItems,
  cleanupExpiredItems,
  clearUserSession,
  clearAppData,
  getStorageStats,
  isStorageNearLimit,
  setItemWithCallback,
  updateItem,
  incrementNumber,
  appendToArray,
  removeFromArray,
  updateObjectProperty,
  setWithTTL,
  getWithDefault,
  setIfNotExists,
  exportData,
  importData,
  createStorageListener,
  migrateStorageData,
  compareVersions,
};
