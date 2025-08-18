// src/services/auth/authService.js
import { tokenService } from './tokenService';
import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../../utils/constants/api';

/**
 * Authentication Service
 * Handles all authentication operations including login, logout, registration
 */
class AuthService {
  constructor() {
    this.baseURL = '/api/v1/auth';
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login response with user data and tokens
   */
  async login(email, password) {
    try {
      const response = await apiClient.post(`${this.baseURL}/login/`, {
        email,
        password,
      });

      if (response.data.tokens) {
        // Store tokens
        tokenService.setTokens(response.data.tokens.access, response.data.tokens.refresh);

        // Store user data
        this.setCurrentUser(response.data.user);
      }

      return {
        success: true,
        user: response.data.user,
        message: response.data.message,
        tokens: response.data.tokens,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Register new client user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  async registerClient(userData) {
    try {
      const response = await apiClient.post(`${this.baseURL}/register/client/`, {
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        password: userData.password,
        password_confirm: userData.passwordConfirm,
        phone_number: userData.phoneNumber || '',
      });

      if (response.data.tokens) {
        // Auto-login after successful registration
        tokenService.setTokens(response.data.tokens.access, response.data.tokens.refresh);

        this.setCurrentUser(response.data.user);
      }

      return {
        success: true,
        user: response.data.user,
        message: response.data.message,
        tokens: response.data.tokens,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Register admin user via invitation token
   * @param {Object} adminData - Admin registration data including invitation token
   * @returns {Promise<Object>} Registration response
   */
  async registerAdmin(adminData) {
    try {
      const response = await apiClient.post(`${this.baseURL}/register/admin/`, {
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        password: adminData.password,
        password_confirm: adminData.passwordConfirm,
        invitation_token: adminData.invitationToken,
      });

      if (response.data.tokens) {
        tokenService.setTokens(response.data.tokens.access, response.data.tokens.refresh);

        this.setCurrentUser(response.data.user);
      }

      return {
        success: true,
        user: response.data.user,
        message: response.data.message,
        tokens: response.data.tokens,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Logout current user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    try {
      const refreshToken = tokenService.getRefreshToken();

      if (refreshToken) {
        await apiClient.post(`${this.baseURL}/logout/`, {
          refresh: refreshToken,
        });
      }

      // Clear all local storage
      this.clearAuthData();

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      // Clear local data even if API call fails
      this.clearAuthData();

      return {
        success: true,
        message: 'Logout completed',
      };
    }
  }

  /**
   * Validate admin invitation token
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Validation response
   */
  async validateInvitation(token) {
    try {
      const response = await apiClient.get(`${this.baseURL}/invitations/validate/${token}/`);

      return {
        success: true,
        valid: response.data.valid,
        email: response.data.email,
        invitedBy: response.data.invited_by,
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile response
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get(`${this.baseURL}/profile/`);

      // Update stored user data
      this.setCurrentUser(response.data);

      return {
        success: true,
        user: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Update response
   */
  async updateProfile(userData) {
    try {
      const response = await apiClient.patch(`${this.baseURL}/profile/`, userData);

      // Update stored user data
      this.setCurrentUser(response.data);

      return {
        success: true,
        user: response.data,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Refresh authentication tokens
   * @returns {Promise<Object>} Token refresh response
   */
  async refreshTokens() {
    try {
      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post(`${this.baseURL}/token/refresh/`, {
        refresh: refreshToken,
      });

      if (response.data.access) {
        tokenService.setAccessToken(response.data.access);
      }

      return {
        success: true,
        accessToken: response.data.access,
      };
    } catch (error) {
      // If refresh fails, clear auth data
      this.clearAuthData();

      return {
        success: false,
        error: 'Token refresh failed',
      };
    }
  }

  /**
   * Send admin invitation
   * @param {string} email - Email to send invitation to
   * @returns {Promise<Object>} Invitation response
   */
  async sendAdminInvitation(email) {
    try {
      const response = await apiClient.post(`${this.baseURL}/invitations/`, {
        email,
      });

      return {
        success: true,
        invitation: response.data,
        message: 'Admin invitation sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Get admin invitations list
   * @returns {Promise<Object>} Invitations list response
   */
  async getAdminInvitations() {
    try {
      const response = await apiClient.get(`${this.baseURL}/invitations/`);

      return {
        success: true,
        invitations: response.data.results || response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Cancel admin invitation
   * @param {string} invitationId - Invitation ID to cancel
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelAdminInvitation(invitationId) {
    try {
      const response = await apiClient.delete(`${this.baseURL}/invitations/${invitationId}/`);

      return {
        success: true,
        message: response.data.message || 'Invitation cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = tokenService.getAccessToken();
    const user = this.getCurrentUserFromStorage();
    return Boolean(token && user);
  }

  /**
   * Check if current user is admin
   * @returns {boolean} Admin status
   */
  isAdmin() {
    const user = this.getCurrentUserFromStorage();
    return user?.role === 'admin' || user?.is_staff;
  }

  /**
   * Check if current user is client
   * @returns {boolean} Client status
   */
  isClient() {
    const user = this.getCurrentUserFromStorage();
    return user?.role === 'client';
  }

  /**
   * Get current user from local storage
   * @returns {Object|null} Current user data
   */
  getCurrentUserFromStorage() {
    try {
      const userData = localStorage.getItem('shoponline_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user from storage:', error);
      return null;
    }
  }

  /**
   * Set current user data in local storage
   * @param {Object} user - User data to store
   */
  setCurrentUser(user) {
    try {
      localStorage.setItem('shoponline_user', JSON.stringify(user));

      // Dispatch custom event for user data update
      window.dispatchEvent(
        new CustomEvent('userDataUpdated', {
          detail: user,
        })
      );
    } catch (error) {
      console.error('Error setting user in storage:', error);
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuthData() {
    tokenService.clearTokens();
    localStorage.removeItem('shoponline_user');

    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }

  /**
   * Check if email domain is valid for client registration
   * @param {string} email - Email to validate
   * @returns {boolean} Validation result
   */
  isValidClientEmail(email) {
    return email && email.endsWith('@gmail.com');
  }

  /**
   * Check if email domain is valid for admin
   * @param {string} email - Email to validate
   * @returns {boolean} Validation result
   */
  isValidAdminEmail(email) {
    return email && email.endsWith('@shoponline.com');
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with strength info
   */
  validatePassword(password) {
    const validation = {
      isValid: false,
      strength: 'weak',
      errors: [],
      score: 0,
    };

    if (!password) {
      validation.errors.push('Password is required');
      return validation;
    }

    // Length check
    if (password.length < 8) {
      validation.errors.push('Password must be at least 8 characters long');
    } else {
      validation.score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      validation.errors.push('Password must contain at least one uppercase letter');
    } else {
      validation.score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      validation.errors.push('Password must contain at least one lowercase letter');
    } else {
      validation.score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      validation.errors.push('Password must contain at least one number');
    } else {
      validation.score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      validation.errors.push('Password must contain at least one special character');
    } else {
      validation.score += 1;
    }

    // Determine strength
    if (validation.score >= 4) {
      validation.strength = 'strong';
      validation.isValid = validation.errors.length === 0;
    } else if (validation.score >= 2) {
      validation.strength = 'medium';
    } else {
      validation.strength = 'weak';
    }

    return validation;
  }

  /**
   * Generate password reset token (placeholder for future implementation)
   * @param {string} email - Email for password reset
   * @returns {Promise<Object>} Reset response
   */
  async requestPasswordReset(email) {
    try {
      // This would be implemented when password reset is added to backend
      const response = await apiClient.post(`${this.baseURL}/password-reset/`, {
        email,
      });

      return {
        success: true,
        message: 'Password reset instructions sent to your email',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Password reset failed',
      };
    }
  }

  /**
   * Get user permissions based on role
   * @returns {Array} Array of user permissions
   */
  getUserPermissions() {
    const user = this.getCurrentUserFromStorage();

    if (!user) return [];

    const basePermissions = ['view_profile', 'edit_profile'];

    if (user.role === 'admin' || user.is_staff) {
      return [
        ...basePermissions,
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_users',
        'view_analytics',
        'manage_flash_sales',
        'manage_homepage',
        'send_invitations',
        'manage_payments',
      ];
    }

    if (user.role === 'client') {
      return [...basePermissions, 'place_orders', 'view_orders', 'add_to_cart', 'make_payments'];
    }

    return basePermissions;
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Permission status
   */
  hasPermission(permission) {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission);
  }
}

// Create and export singleton instance
const authService = new AuthService();
export { authService };
