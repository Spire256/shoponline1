// src/services/auth/tokenService.js

/**
 * Token Service for JWT token management
 * Handles storing, retrieving, and managing JWT tokens securely
 */
class TokenService {
  constructor() {
    this.ACCESS_TOKEN_KEY = 'shoponline_access_token';
    this.REFRESH_TOKEN_KEY = 'shoponline_refresh_token';
    this.TOKEN_EXPIRY_KEY = 'shoponline_token_expiry';
  }

  /**
   * Store access and refresh tokens
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);

      // Calculate and store expiry time
      const tokenData = this.parseJWT(accessToken);
      if (tokenData && tokenData.exp) {
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, tokenData.exp.toString());
      }
    }

    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Store only access token (used during token refresh)
   * @param {string} accessToken - JWT access token
   */
  setAccessToken(accessToken) {
    if (accessToken) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);

      // Update expiry time
      const tokenData = this.parseJWT(accessToken);
      if (tokenData && tokenData.exp) {
        localStorage.setItem(this.TOKEN_EXPIRY_KEY, tokenData.exp.toString());
      }
    }
  }

  /**
   * Get access token from storage
   * @returns {string|null} Access token or null
   */
  getAccessToken() {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token from storage
   * @returns {string|null} Refresh token or null
   */
  getRefreshToken() {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Check if access token exists and is not expired
   * @returns {boolean} Token validity status
   */
  isTokenValid() {
    const token = this.getAccessToken();
    if (!token) return false;

    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return false;

    // Check if token is expired (with 30 second buffer)
    const now = Math.floor(Date.now() / 1000);
    const expiry = parseInt(expiryTime, 10);

    return now < expiry - 30; // 30 second buffer for network delays
  }

  /**
   * Check if token is about to expire (within 5 minutes)
   * @returns {boolean} True if token expires soon
   */
  isTokenExpiringSoon() {
    const token = this.getAccessToken();
    if (!token) return false;

    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return false;

    const now = Math.floor(Date.now() / 1000);
    const expiry = parseInt(expiryTime, 10);

    // Check if token expires within 5 minutes (300 seconds)
    return now > expiry - 300;
  }

  /**
   * Get token expiry time
   * @returns {Date|null} Expiry date or null
   */
  getTokenExpiry() {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return null;

    return new Date(parseInt(expiryTime, 10) * 1000);
  }

  /**
   * Get time remaining until token expires
   * @returns {number} Seconds until expiry, or 0 if expired/invalid
   */
  getTimeUntilExpiry() {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return 0;

    const now = Math.floor(Date.now() / 1000);
    const expiry = parseInt(expiryTime, 10);

    return Math.max(0, expiry - now);
  }

  /**
   * Clear all tokens from storage
   */
  clearTokens() {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Parse JWT token to extract payload
   * @param {string} token - JWT token
   * @returns {Object|null} Parsed token payload or null
   */
  parseJWT(token) {
    try {
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  /**
   * Get user info from access token
   * @returns {Object|null} User info from token or null
   */
  getUserFromToken() {
    const token = this.getAccessToken();
    if (!token) return null;

    const tokenData = this.parseJWT(token);
    if (!tokenData) return null;

    return {
      userId: tokenData.user_id,
      email: tokenData.email,
      role: tokenData.role,
      isAdmin: tokenData.is_staff || tokenData.role === 'admin',
      exp: tokenData.exp,
      iat: tokenData.iat,
    };
  }

  /**
   * Create authorization header for API requests
   * @returns {Object|null} Authorization header or null
   */
  getAuthHeader() {
    const token = this.getAccessToken();
    if (!token) return null;

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Check if refresh token exists
   * @returns {boolean} Refresh token availability
   */
  hasRefreshToken() {
    return Boolean(this.getRefreshToken());
  }

  /**
   * Validate token format (basic validation)
   * @param {string} token - Token to validate
   * @returns {boolean} Token format validity
   */
  isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Check if each part is base64url encoded
    try {
      parts.forEach(part => {
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get token info for debugging
   * @returns {Object} Token information
   */
  getTokenInfo() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const tokenData = this.getUserFromToken();

    return {
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(refreshToken),
      isTokenValid: this.isTokenValid(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      expiry: this.getTokenExpiry(),
      timeUntilExpiry: this.getTimeUntilExpiry(),
      userInfo: tokenData,
    };
  }

  /**
   * Set up automatic token refresh
   * @param {Function} refreshCallback - Function to call for token refresh
   * @returns {Function} Cleanup function to clear the interval
   */
  setupAutoRefresh(refreshCallback) {
    const checkInterval = 60000; // Check every minute

    const intervalId = setInterval(() => {
      if (this.isTokenExpiringSoon() && this.hasRefreshToken()) {
        refreshCallback();
      }
    }, checkInterval);

    return () => clearInterval(intervalId);
  }

  /**
   * Handle token refresh response
   * @param {Object} response - Refresh response containing new tokens
   * @returns {boolean} Success status
   */
  handleRefreshResponse(response) {
    try {
      if (response.access) {
        this.setAccessToken(response.access);
      }

      if (response.refresh) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh);
      }

      return true;
    } catch (error) {
      console.error('Error handling refresh response:', error);
      return false;
    }
  }

  /**
   * Export tokens for backup (use with caution)
   * @returns {Object} Token data
   */
  exportTokens() {
    return {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
      expiry: this.getTokenExpiry(),
    };
  }

  /**
   * Import tokens from backup (use with caution)
   * @param {Object} tokenData - Token data to import
   */
  importTokens(tokenData) {
    if (tokenData.accessToken && tokenData.refreshToken) {
      this.setTokens(tokenData.accessToken, tokenData.refreshToken);
    }
  }

  /**
   * Clear expired tokens
   */
  clearExpiredTokens() {
    if (!this.isTokenValid()) {
      this.clearTokens();
    }
  }

  /**
   * Get remaining token lifetime as human readable string
   * @returns {string} Human readable time remaining
   */
  getTokenLifetimeString() {
    const timeRemaining = this.getTimeUntilExpiry();

    if (timeRemaining <= 0) {
      return 'Token expired';
    }

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`;
    } else {
      return `${seconds}s remaining`;
    }
  }
}

// Create and export singleton instance
const tokenService = new TokenService();
export { tokenService };
