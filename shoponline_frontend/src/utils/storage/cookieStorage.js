/**
 * Cookie Storage Management for ShopOnline Uganda E-commerce Platform
 * Secure cookie handling for JWT tokens, user preferences, and cart data
 */

/**
 * Cookie storage class with encryption and security features
 */
class CookieStorage {
  constructor() {
    this.defaultOptions = {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.NODE_ENV === 'production' ? '.shoponline.ug' : undefined,
    };
  }

  /**
   * Set a cookie with optional encryption
   * @param {string} name - Cookie name
   * @param {string|Object} value - Cookie value
   * @param {Object} options - Cookie options
   * @returns {boolean} Success status
   */
  set(name, value, options = {}) {
    try {
      const cookieOptions = { ...this.defaultOptions, ...options };

      // Convert object to JSON string
      const cookieValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      // Build cookie string
      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(cookieValue)}`;

      // Add options
      if (cookieOptions.expires) {
        cookieString += `; expires=${cookieOptions.expires.toUTCString()}`;
      }

      if (cookieOptions.maxAge) {
        cookieString += `; max-age=${cookieOptions.maxAge}`;
      }

      if (cookieOptions.path) {
        cookieString += `; path=${cookieOptions.path}`;
      }

      if (cookieOptions.domain) {
        cookieString += `; domain=${cookieOptions.domain}`;
      }

      if (cookieOptions.secure) {
        cookieString += '; secure';
      }

      if (cookieOptions.sameSite) {
        cookieString += `; samesite=${cookieOptions.sameSite}`;
      }

      if (cookieOptions.httpOnly) {
        cookieString += '; httponly';
      }

      document.cookie = cookieString;
      return true;
    } catch (error) {
      console.error('Error setting cookie:', error);
      return false;
    }
  }

  /**
   * Get a cookie value with automatic JSON parsing
   * @param {string} name - Cookie name
   * @param {*} defaultValue - Default value if cookie doesn't exist
   * @returns {*} Cookie value or default value
   */
  get(name, defaultValue = null) {
    try {
      const cookies = document.cookie.split(';');

      for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');

        if (decodeURIComponent(cookieName) === name) {
          const decodedValue = decodeURIComponent(cookieValue);

          // Try to parse as JSON, fallback to string
          try {
            return JSON.parse(decodedValue);
          } catch {
            return decodedValue;
          }
        }
      }

      return defaultValue;
    } catch (error) {
      console.error('Error getting cookie:', error);
      return defaultValue;
    }
  }

  /**
   * Remove a cookie
   * @param {string} name - Cookie name
   * @param {Object} options - Cookie options (path, domain)
   * @returns {boolean} Success status
   */
  remove(name, options = {}) {
    try {
      const removeOptions = {
        ...options,
        expires: new Date(0),
        maxAge: 0,
      };

      return this.set(name, '', removeOptions);
    } catch (error) {
      console.error('Error removing cookie:', error);
      return false;
    }
  }

  /**
   * Check if a cookie exists
   * @param {string} name - Cookie name
   * @returns {boolean} Whether cookie exists
   */
  exists(name) {
    return this.get(name) !== null;
  }

  /**
   * Get all cookies as an object
   * @returns {Object} All cookies
   */
  getAll() {
    try {
      const cookies = {};
      const cookieString = document.cookie;

      if (!cookieString) return cookies;

      cookieString.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          const decodedName = decodeURIComponent(name);
          const decodedValue = decodeURIComponent(value);

          // Try to parse as JSON
          try {
            cookies[decodedName] = JSON.parse(decodedValue);
          } catch {
            cookies[decodedName] = decodedValue;
          }
        }
      });

      return cookies;
    } catch (error) {
      console.error('Error getting all cookies:', error);
      return {};
    }
  }

  /**
   * Clear all cookies for the current domain
   * @returns {boolean} Success status
   */
  clearAll() {
    try {
      const cookies = this.getAll();

      Object.keys(cookies).forEach(cookieName => {
        this.remove(cookieName);
        // Also try to remove with different path options
        this.remove(cookieName, { path: '/' });
        this.remove(cookieName, { path: '', domain: this.defaultOptions.domain });
      });

      return true;
    } catch (error) {
      console.error('Error clearing all cookies:', error);
      return false;
    }
  }
}

// Create singleton instance
const cookieStorage = new CookieStorage();

/**
 * Specialized cookie managers for different data types
 */

/**
 * JWT Token Management
 */
export const tokenCookies = {
  ACCESS_TOKEN_KEY: 'shoponline_access_token',
  REFRESH_TOKEN_KEY: 'shoponline_refresh_token',

  setAccessToken(token) {
    return cookieStorage.set(this.ACCESS_TOKEN_KEY, token, {
      maxAge: 15 * 60, // 15 minutes
      secure: true,
      httpOnly: false, // Allow JavaScript access for API calls
      sameSite: 'strict',
    });
  },

  setRefreshToken(token) {
    return cookieStorage.set(this.REFRESH_TOKEN_KEY, token, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: true,
      httpOnly: true, // Prevent JavaScript access for security
      sameSite: 'strict',
    });
  },

  getAccessToken() {
    return cookieStorage.get(this.ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return cookieStorage.get(this.REFRESH_TOKEN_KEY);
  },

  clearTokens() {
    cookieStorage.remove(this.ACCESS_TOKEN_KEY);
    cookieStorage.remove(this.REFRESH_TOKEN_KEY);
  },

  hasValidTokens() {
    return this.getAccessToken() && this.getRefreshToken();
  },
};

/**
 * User Preferences Management
 */
export const preferenceCookies = {
  THEME_KEY: 'shoponline_theme',
  LANGUAGE_KEY: 'shoponline_language',
  CURRENCY_KEY: 'shoponline_currency',

  setTheme(theme) {
    return cookieStorage.set(this.THEME_KEY, theme, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  },

  getTheme() {
    return cookieStorage.get(this.THEME_KEY, 'blue'); // Default blue theme
  },

  setLanguage(language) {
    return cookieStorage.set(this.LANGUAGE_KEY, language, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  },

  getLanguage() {
    return cookieStorage.get(this.LANGUAGE_KEY, 'en'); // Default English
  },

  setCurrency(currency) {
    return cookieStorage.set(this.CURRENCY_KEY, currency, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  },

  getCurrency() {
    return cookieStorage.get(this.CURRENCY_KEY, 'UGX'); // Default Uganda Shillings
  },
};

/**
 * Shopping Cart Management
 */
export const cartCookies = {
  CART_KEY: 'shoponline_cart',
  WISHLIST_KEY: 'shoponline_wishlist',

  setCart(cartData) {
    return cookieStorage.set(this.CART_KEY, cartData, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  },

  getCart() {
    return cookieStorage.get(this.CART_KEY, {
      items: [],
      total: 0,
      currency: 'UGX',
      lastUpdated: new Date().toISOString(),
    });
  },

  clearCart() {
    cookieStorage.remove(this.CART_KEY);
  },

  setWishlist(wishlistData) {
    return cookieStorage.set(this.WISHLIST_KEY, wishlistData, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  },

  getWishlist() {
    return cookieStorage.get(this.WISHLIST_KEY, {
      items: [],
      lastUpdated: new Date().toISOString(),
    });
  },

  clearWishlist() {
    cookieStorage.remove(this.WISHLIST_KEY);
  },
};

/**
 * Session Management
 */
export const sessionCookies = {
  SESSION_KEY: 'shoponline_session',
  GUEST_ID_KEY: 'shoponline_guest_id',
  LAST_ACTIVITY_KEY: 'shoponline_last_activity',

  setSession(sessionData) {
    return cookieStorage.set(
      this.SESSION_KEY,
      {
        ...sessionData,
        timestamp: Date.now(),
      },
      {
        maxAge: 24 * 60 * 60, // 24 hours
      }
    );
  },

  getSession() {
    return cookieStorage.get(this.SESSION_KEY);
  },

  updateLastActivity() {
    return cookieStorage.set(this.LAST_ACTIVITY_KEY, Date.now(), {
      maxAge: 24 * 60 * 60, // 24 hours
    });
  },

  getLastActivity() {
    return cookieStorage.get(this.LAST_ACTIVITY_KEY);
  },

  setGuestId(guestId) {
    return cookieStorage.set(this.GUEST_ID_KEY, guestId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  },

  getGuestId() {
    return cookieStorage.get(this.GUEST_ID_KEY);
  },

  clearSession() {
    cookieStorage.remove(this.SESSION_KEY);
    cookieStorage.remove(this.LAST_ACTIVITY_KEY);
  },
};

/**
 * Admin-specific cookie management
 */
export const adminCookies = {
  ADMIN_PREFERENCES_KEY: 'shoponline_admin_prefs',
  DASHBOARD_LAYOUT_KEY: 'shoponline_dashboard_layout',

  setAdminPreferences(preferences) {
    return cookieStorage.set(this.ADMIN_PREFERENCES_KEY, preferences, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  },

  getAdminPreferences() {
    return cookieStorage.get(this.ADMIN_PREFERENCES_KEY, {
      sidebarCollapsed: false,
      theme: 'blue',
      notificationsEnabled: true,
      autoRefreshDashboard: true,
      defaultPageSize: 20,
    });
  },

  setDashboardLayout(layout) {
    return cookieStorage.set(this.DASHBOARD_LAYOUT_KEY, layout, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  },

  getDashboardLayout() {
    return cookieStorage.get(this.DASHBOARD_LAYOUT_KEY, {
      widgets: [],
      columns: 2,
      lastUpdated: new Date().toISOString(),
    });
  },
};

/**
 * Flash sale specific cookie management
 */
export const flashSaleCookies = {
  VIEWED_SALES_KEY: 'shoponline_viewed_flash_sales',
  FLASH_SALE_ALERTS_KEY: 'shoponline_flash_sale_alerts',

  markFlashSaleViewed(saleId) {
    const viewedSales = this.getViewedSales();
    viewedSales.push({
      saleId,
      viewedAt: new Date().toISOString(),
    });

    // Keep only last 50 viewed sales
    const recentSales = viewedSales.slice(-50);

    return cookieStorage.set(this.VIEWED_SALES_KEY, recentSales, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  },

  getViewedSales() {
    return cookieStorage.get(this.VIEWED_SALES_KEY, []);
  },

  isFlashSaleViewed(saleId) {
    const viewedSales = this.getViewedSales();
    return viewedSales.some(sale => sale.saleId === saleId);
  },

  setFlashSaleAlerts(enabled) {
    return cookieStorage.set(this.FLASH_SALE_ALERTS_KEY, enabled, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  },

  getFlashSaleAlerts() {
    return cookieStorage.get(this.FLASH_SALE_ALERTS_KEY, true);
  },
};

/**
 * GDPR and Privacy Compliance
 */
export const privacyCookies = {
  CONSENT_KEY: 'shoponline_cookie_consent',
  PRIVACY_PREFERENCES_KEY: 'shoponline_privacy_prefs',

  setConsent(consentData) {
    return cookieStorage.set(
      this.CONSENT_KEY,
      {
        ...consentData,
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
      {
        maxAge: 365 * 24 * 60 * 60, // 1 year
      }
    );
  },

  getConsent() {
    return cookieStorage.get(this.CONSENT_KEY);
  },

  hasConsent() {
    const consent = this.getConsent();
    return consent && consent.accepted === true;
  },

  setPrivacyPreferences(preferences) {
    return cookieStorage.set(this.PRIVACY_PREFERENCES_KEY, preferences, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  },

  getPrivacyPreferences() {
    return cookieStorage.get(this.PRIVACY_PREFERENCES_KEY, {
      analytics: false,
      marketing: false,
      functional: true,
      necessary: true,
    });
  },
};

/**
 * Utility functions for cookie management
 */
export const cookieUtils = {
  /**
   * Check if cookies are enabled in the browser
   * @returns {boolean} Whether cookies are enabled
   */
  isEnabled() {
    try {
      const testKey = 'test_cookie_support';
      cookieStorage.set(testKey, 'test', { maxAge: 1 });
      const isSupported = cookieStorage.get(testKey) === 'test';
      cookieStorage.remove(testKey);
      return isSupported;
    } catch {
      return false;
    }
  },

  /**
   * Get cookie size in bytes
   * @param {string} name - Cookie name
   * @returns {number} Cookie size in bytes
   */
  getSize(name) {
    const value = cookieStorage.get(name);
    if (!value) return 0;

    const cookieString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return new Blob([cookieString]).size;
  },

  /**
   * Get total size of all cookies
   * @returns {number} Total size in bytes
   */
  getTotalSize() {
    try {
      return new Blob([document.cookie]).size;
    } catch {
      return 0;
    }
  },

  /**
   * Check if adding a cookie would exceed size limits
   * @param {string} name - Cookie name
   * @param {*} value - Cookie value
   * @returns {boolean} Whether the cookie can be added
   */
  canAddCookie(name, value) {
    const newCookieSize = new Blob([`${name}=${JSON.stringify(value)}`]).size;
    const currentSize = this.getTotalSize();
    const maxSize = 4096; // 4KB limit per domain

    return currentSize + newCookieSize < maxSize;
  },

  /**
   * Clean expired or old cookies
   */
  cleanup() {
    const allCookies = cookieStorage.getAll();
    const now = Date.now();

    Object.entries(allCookies).forEach(([name, value]) => {
      // Remove cookies older than 30 days if they have timestamp
      if (value && typeof value === 'object' && value.timestamp) {
        const age = now - new Date(value.timestamp).getTime();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

        if (age > maxAge) {
          cookieStorage.remove(name);
        }
      }
    });
  },
};

/**
 * Security utilities for cookie management
 */
export const cookieSecurity = {
  /**
   * Validate cookie value for XSS prevention
   * @param {*} value - Value to validate
   * @returns {boolean} Whether value is safe
   */
  isValueSafe(value) {
    if (typeof value !== 'string') return true;

    // Check for potentially dangerous characters
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\.cookie/i,
    ];

    return !dangerousPatterns.some(pattern => pattern.test(value));
  },

  /**
   * Sanitize cookie value
   * @param {*} value - Value to sanitize
   * @returns {*} Sanitized value
   */
  sanitizeValue(value) {
    if (typeof value !== 'string') return value;

    return value
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  /**
   * Encrypt sensitive cookie data (simple implementation)
   * @param {string} value - Value to encrypt
   * @returns {string} Encrypted value
   */
  encrypt(value) {
    try {
      // Simple base64 encoding (not cryptographically secure)
      // In production, use proper encryption libraries
      return btoa(unescape(encodeURIComponent(value)));
    } catch {
      return value;
    }
  },

  /**
   * Decrypt sensitive cookie data
   * @param {string} encryptedValue - Encrypted value
   * @returns {string} Decrypted value
   */
  decrypt(encryptedValue) {
    try {
      return decodeURIComponent(escape(atob(encryptedValue)));
    } catch {
      return encryptedValue;
    }
  },
};

/**
 * Cookie consent management for GDPR compliance
 */
export const cookieConsent = {
  showConsentBanner() {
    return !privacyCookies.hasConsent() && cookieUtils.isEnabled();
  },

  acceptAll() {
    return privacyCookies.setConsent({
      accepted: true,
      analytics: true,
      marketing: true,
      functional: true,
      necessary: true,
    });
  },

  acceptNecessaryOnly() {
    return privacyCookies.setConsent({
      accepted: true,
      analytics: false,
      marketing: false,
      functional: true,
      necessary: true,
    });
  },

  updatePreferences(preferences) {
    privacyCookies.setPrivacyPreferences(preferences);
    return privacyCookies.setConsent({
      accepted: true,
      ...preferences,
    });
  },
};

/**
 * Analytics and tracking cookies (with consent)
 */
export const analyticsCookies = {
  ANALYTICS_ID_KEY: 'shoponline_analytics_id',
  PAGE_VIEWS_KEY: 'shoponline_page_views',

  setAnalyticsId(analyticsId) {
    const consent = privacyCookies.getConsent();
    if (!consent || !consent.analytics) return false;

    return cookieStorage.set(this.ANALYTICS_ID_KEY, analyticsId, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  },

  getAnalyticsId() {
    const consent = privacyCookies.getConsent();
    if (!consent || !consent.analytics) return null;

    return cookieStorage.get(this.ANALYTICS_ID_KEY);
  },

  trackPageView(page) {
    const consent = privacyCookies.getConsent();
    if (!consent || !consent.analytics) return false;

    const pageViews = cookieStorage.get(this.PAGE_VIEWS_KEY, []);
    pageViews.push({
      page,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    // Keep only last 100 page views
    const recentViews = pageViews.slice(-100);

    return cookieStorage.set(this.PAGE_VIEWS_KEY, recentViews, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  },
};

// Export the main cookie storage instance
export default cookieStorage;

/**
 * Initialize cookie management system
 */
export const initializeCookieSystem = () => {
  // Check if cookies are enabled
  if (!cookieUtils.isEnabled()) {
    console.warn('Cookies are disabled. Some features may not work properly.');
    return false;
  }

  // Cleanup old cookies
  cookieUtils.cleanup();

  // Update last activity
  sessionCookies.updateLastActivity();

  // Generate guest ID if not exists and not logged in
  if (!sessionCookies.getGuestId() && !tokenCookies.getAccessToken()) {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionCookies.setGuestId(guestId);
  }

  return true;
};

/**
 * Clear all application cookies (for logout)
 */
export const clearAllAppCookies = () => {
  tokenCookies.clearTokens();
  cartCookies.clearCart();
  cartCookies.clearWishlist();
  sessionCookies.clearSession();

  // Keep user preferences and consent
  // These should persist across sessions
};
