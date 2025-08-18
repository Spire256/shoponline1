/**
 * CSRF Protection Utilities for Ugandan E-commerce Platform
 * Provides comprehensive CSRF token management and validation
 */

import { generateSecureRandom } from './encryption.js';

// CSRF token storage and configuration
const CSRF_CONFIG = {
  tokenName: 'csrfToken',
  headerName: 'X-CSRF-Token',
  cookieName: 'csrftoken',
  tokenLength: 32,
  tokenExpiry: 60 * 60 * 1000, // 1 hour in milliseconds
  storageKey: 'shopopnline_csrf_token',
  refreshThreshold: 10 * 60 * 1000, // Refresh token 10 minutes before expiry
};

// In-memory token storage
let csrfTokenData = {
  token: null,
  expires: null,
  generated: null,
};

/**
 * Generate a new CSRF token
 * @returns {object} CSRF token data
 */
export const generateCSRFToken = () => {
  try {
    const token = generateSecureRandom(CSRF_CONFIG.tokenLength);
    const now = Date.now();
    const expires = now + CSRF_CONFIG.tokenExpiry;

    csrfTokenData = {
      token,
      expires,
      generated: now,
    };

    // Store in session storage for persistence
    try {
      sessionStorage.setItem(CSRF_CONFIG.storageKey, JSON.stringify(csrfTokenData));
    } catch (storageError) {
      console.warn('Could not store CSRF token in session storage:', storageError);
    }

    return { ...csrfTokenData };
  } catch (error) {
    console.error('CSRF token generation error:', error);
    throw new Error('Failed to generate CSRF token');
  }
};

/**
 * Get current CSRF token, generating one if needed
 * @returns {string} CSRF token
 */
export const getCSRFToken = () => {
  try {
    // Try to load from session storage first
    if (!csrfTokenData.token) {
      try {
        const stored = sessionStorage.getItem(CSRF_CONFIG.storageKey);
        if (stored) {
          csrfTokenData = JSON.parse(stored);
        }
      } catch (storageError) {
        console.warn('Could not load CSRF token from session storage:', storageError);
      }
    }

    const now = Date.now();

    // Check if token exists and is not expired
    if (!csrfTokenData.token || !csrfTokenData.expires || now >= csrfTokenData.expires) {
      generateCSRFToken();
    }
    // Check if token needs refresh (within refresh threshold)
    else if (now >= csrfTokenData.expires - CSRF_CONFIG.refreshThreshold) {
      generateCSRFToken();
    }

    return csrfTokenData.token;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    // Generate a new token as fallback
    generateCSRFToken();
    return csrfTokenData.token;
  }
};

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @returns {boolean} True if token is valid
 */
export const validateCSRFToken = token => {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }

    if (!csrfTokenData.token) {
      return false;
    }

    const now = Date.now();

    // Check if stored token is expired
    if (csrfTokenData.expires && now >= csrfTokenData.expires) {
      return false;
    }

    // Compare tokens securely
    return secureTokenCompare(token, csrfTokenData.token);
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
};

/**
 * Get CSRF token for HTTP headers
 * @returns {object} Headers object with CSRF token
 */
export const getCSRFHeaders = () => {
  try {
    const token = getCSRFToken();
    return {
      [CSRF_CONFIG.headerName]: token,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Error getting CSRF headers:', error);
    return {};
  }
};

/**
 * Add CSRF token to form data
 * @param {FormData|object} formData - Form data to add token to
 * @returns {FormData|object} Form data with CSRF token
 */
export const addCSRFToFormData = formData => {
  try {
    const token = getCSRFToken();

    if (formData instanceof FormData) {
      formData.append(CSRF_CONFIG.tokenName, token);
    } else if (typeof formData === 'object' && formData !== null) {
      formData[CSRF_CONFIG.tokenName] = token;
    }

    return formData;
  } catch (error) {
    console.error('Error adding CSRF to form data:', error);
    return formData;
  }
};

/**
 * Create CSRF meta tag for HTML head
 * @returns {string} Meta tag HTML
 */
export const createCSRFMetaTag = () => {
  try {
    const token = getCSRFToken();
    return `<meta name="csrf-token" content="${token}">`;
  } catch (error) {
    console.error('Error creating CSRF meta tag:', error);
    return '';
  }
};

/**
 * Extract CSRF token from meta tag
 * @returns {string|null} CSRF token from meta tag
 */
export const getCSRFTokenFromMeta = () => {
  try {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  } catch (error) {
    console.error('Error getting CSRF token from meta tag:', error);
    return null;
  }
};

/**
 * Set up CSRF protection for fetch requests
 * @param {function} fetchFunction - Original fetch function to wrap
 * @returns {function} Enhanced fetch function with CSRF protection
 */
export const setupCSRFProtection = (fetchFunction = fetch) => {
  return async (url, options = {}) => {
    try {
      // Only add CSRF token to state-changing requests
      const method = (options.method || 'GET').toUpperCase();
      const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

      if (needsCSRF) {
        // Ensure headers object exists
        options.headers = options.headers || {};

        // Add CSRF token to headers
        const csrfHeaders = getCSRFHeaders();
        options.headers = { ...options.headers, ...csrfHeaders };

        // If sending FormData, add CSRF token to it as well
        if (options.body instanceof FormData) {
          options.body = addCSRFToFormData(options.body);
        }
        // If sending JSON, ensure CSRF token is in headers (already done above)
        else if (options.body && typeof options.body === 'string') {
          try {
            const bodyData = JSON.parse(options.body);
            bodyData[CSRF_CONFIG.tokenName] = getCSRFToken();
            options.body = JSON.stringify(bodyData);
          } catch (jsonError) {
            // Body is not JSON, leave as is
            console.warn('Could not parse body as JSON for CSRF token addition');
          }
        }
      }

      // Make the request
      const response = await fetchFunction(url, options);

      // Check for CSRF-related errors
      if (response.status === 403 || response.status === 419) {
        const responseText = await response.text();
        if (
          responseText.toLowerCase().includes('csrf') ||
          responseText.toLowerCase().includes('token')
        ) {
          console.warn('CSRF token may be invalid, generating new one');
          generateCSRFToken();
          throw new Error('CSRF token validation failed');
        }
      }

      return response;
    } catch (error) {
      console.error('CSRF-protected fetch error:', error);
      throw error;
    }
  };
};

/**
 * Set up CSRF protection for XMLHttpRequest
 * @param {XMLHttpRequest} xhr - XMLHttpRequest object
 * @param {string} method - HTTP method
 */
export const setupXHRCSRFProtection = (xhr, method = 'GET') => {
  try {
    const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

    if (needsCSRF) {
      const token = getCSRFToken();
      xhr.setRequestHeader(CSRF_CONFIG.headerName, token);
    }
  } catch (error) {
    console.error('XHR CSRF setup error:', error);
  }
};

/**
 * Create CSRF-protected form submission handler
 * @param {HTMLFormElement} form - Form element to protect
 * @param {function} submitHandler - Custom submit handler (optional)
 */
export const protectForm = (form, submitHandler = null) => {
  try {
    if (!form || !(form instanceof HTMLFormElement)) {
      throw new Error('Valid form element is required');
    }

    // Add hidden CSRF token field if it doesn't exist
    let csrfField = form.querySelector(`input[name="${CSRF_CONFIG.tokenName}"]`);
    if (!csrfField) {
      csrfField = document.createElement('input');
      csrfField.type = 'hidden';
      csrfField.name = CSRF_CONFIG.tokenName;
      form.appendChild(csrfField);
    }

    // Update token value
    csrfField.value = getCSRFToken();

    // Add submit event listener
    const submitListener = event => {
      try {
        // Update token before submission (in case it was refreshed)
        csrfField.value = getCSRFToken();

        // Call custom submit handler if provided
        if (submitHandler) {
          submitHandler(event);
        }
      } catch (error) {
        console.error('Form CSRF protection error:', error);
        event.preventDefault();
      }
    };

    // Remove existing listener if any
    form.removeEventListener('submit', submitListener);
    // Add new listener
    form.addEventListener('submit', submitListener);

    return () => {
      // Return cleanup function
      form.removeEventListener('submit', submitListener);
      if (csrfField && csrfField.parentNode) {
        csrfField.parentNode.removeChild(csrfField);
      }
    };
  } catch (error) {
    console.error('Form protection setup error:', error);
    return () => {}; // Return empty cleanup function
  }
};

/**
 * Secure token comparison (timing attack resistant)
 * @param {string} a - First token
 * @param {string} b - Second token
 * @returns {boolean} True if tokens are equal
 */
const secureTokenCompare = (a, b) => {
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
    console.error('Secure token compare error:', error);
    return false;
  }
};

/**
 * Clear CSRF token from memory and storage
 */
export const clearCSRFToken = () => {
  try {
    // Clear in-memory token
    csrfTokenData = {
      token: null,
      expires: null,
      generated: null,
    };

    // Clear from session storage
    try {
      sessionStorage.removeItem(CSRF_CONFIG.storageKey);
    } catch (storageError) {
      console.warn('Could not clear CSRF token from session storage:', storageError);
    }

    // Clear from any meta tags
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.setAttribute('content', '');
    }
  } catch (error) {
    console.error('Error clearing CSRF token:', error);
  }
};

/**
 * Check if CSRF token needs refresh
 * @returns {boolean} True if token needs refresh
 */
export const needsCSRFRefresh = () => {
  try {
    if (!csrfTokenData.token || !csrfTokenData.expires) {
      return true;
    }

    const now = Date.now();
    return now >= csrfTokenData.expires - CSRF_CONFIG.refreshThreshold;
  } catch (error) {
    console.error('Error checking CSRF refresh need:', error);
    return true;
  }
};

/**
 * Get CSRF token info for debugging
 * @returns {object} Token information
 */
export const getCSRFTokenInfo = () => {
  try {
    const now = Date.now();
    return {
      hasToken: Boolean(csrfTokenData.token),
      isExpired: csrfTokenData.expires ? now >= csrfTokenData.expires : true,
      needsRefresh: needsCSRFRefresh(),
      timeToExpiry: csrfTokenData.expires ? Math.max(0, csrfTokenData.expires - now) : 0,
      generated: csrfTokenData.generated,
      config: {
        tokenLength: CSRF_CONFIG.tokenLength,
        tokenExpiry: CSRF_CONFIG.tokenExpiry,
        refreshThreshold: CSRF_CONFIG.refreshThreshold,
      },
    };
  } catch (error) {
    console.error('Error getting CSRF token info:', error);
    return {
      hasToken: false,
      isExpired: true,
      needsRefresh: true,
      timeToExpiry: 0,
      error: error.message,
    };
  }
};

/**
 * Initialize CSRF protection system
 * @param {object} options - Configuration options
 */
export const initCSRFProtection = (options = {}) => {
  try {
    // Update configuration with provided options
    Object.assign(CSRF_CONFIG, options);

    // Generate initial token
    generateCSRFToken();

    // Set up automatic token refresh
    setInterval(() => {
      if (needsCSRFRefresh()) {
        generateCSRFToken();
      }
    }, CSRF_CONFIG.refreshThreshold);

    // Set up page visibility change handler to refresh token when page becomes visible
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && needsCSRFRefresh()) {
          generateCSRFToken();
        }
      });
    }

    console.log('CSRF protection initialized');
  } catch (error) {
    console.error('Error initializing CSRF protection:', error);
  }
};

/**
 * Middleware for axios requests to add CSRF protection
 * @param {object} axiosInstance - Axios instance to configure
 */
export const configureAxiosCSRF = axiosInstance => {
  try {
    // Request interceptor to add CSRF token
    axiosInstance.interceptors.request.use(
      config => {
        const method = (config.method || 'get').toUpperCase();
        const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

        if (needsCSRF) {
          // Add CSRF token to headers
          config.headers = config.headers || {};
          config.headers[CSRF_CONFIG.headerName] = getCSRFToken();

          // Add CSRF token to form data if applicable
          if (config.data instanceof FormData) {
            config.data.append(CSRF_CONFIG.tokenName, getCSRFToken());
          } else if (config.data && typeof config.data === 'object') {
            config.data[CSRF_CONFIG.tokenName] = getCSRFToken();
          }
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle CSRF errors
    axiosInstance.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 403 || error.response.status === 419)) {
          const responseData = error.response.data;
          if (
            (typeof responseData === 'string' && responseData.toLowerCase().includes('csrf')) ||
            (typeof responseData === 'object' &&
              responseData.error &&
              responseData.error.toLowerCase().includes('csrf'))
          ) {
            console.warn('CSRF token validation failed, generating new token');
            generateCSRFToken();
          }
        }
        return Promise.reject(error);
      }
    );

    console.log('Axios CSRF protection configured');
  } catch (error) {
    console.error('Error configuring Axios CSRF protection:', error);
  }
};

// Export all CSRF protection functions
export default {
  generateCSRFToken,
  getCSRFToken,
  validateCSRFToken,
  getCSRFHeaders,
  addCSRFToFormData,
  createCSRFMetaTag,
  getCSRFTokenFromMeta,
  setupCSRFProtection,
  setupXHRCSRFProtection,
  protectForm,
  clearCSRFToken,
  needsCSRFRefresh,
  getCSRFTokenInfo,
  initCSRFProtection,
  configureAxiosCSRF,
};
