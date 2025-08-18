// Session storage wrapper for the Ugandan e-commerce platform
// Provides safe session storage operations that persist only for the browser session

/**
 * Core Session Storage Operations
 */
export const isSessionStorageAvailable = () => {
  try {
    const test = '__session_storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (error) {
    console.warn('Session storage is not available:', error);
    return false;
  }
};

export const setSessionItem = (key, value) => {
  try {
    if (!isSessionStorageAvailable()) {
      console.warn('Session storage not available');
      return false;
    }

    const storageData = {
      value: value,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error('Error setting sessionStorage item:', error);
    return false;
  }
};

export const getSessionItem = (key, defaultValue = null) => {
  try {
    if (!isSessionStorageAvailable()) {
      return defaultValue;
    }

    const item = sessionStorage.getItem(key);

    if (!item) {
      return defaultValue;
    }

    const storageData = JSON.parse(item);
    return storageData.value;
  } catch (error) {
    console.error('Error getting sessionStorage item:', error);
    return defaultValue;
  }
};

export const removeSessionItem = key => {
  try {
    if (!isSessionStorageAvailable()) {
      return false;
    }

    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing sessionStorage item:', error);
    return false;
  }
};

export const clearSession = () => {
  try {
    if (!isSessionStorageAvailable()) {
      return false;
    }

    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
    return false;
  }
};

export const hasSessionItem = key => {
  try {
    if (!isSessionStorageAvailable()) {
      return false;
    }

    return sessionStorage.getItem(key) !== null;
  } catch (error) {
    console.error('Error checking sessionStorage item:', error);
    return false;
  }
};

/**
 * Shopping Session Management
 */
export const setCurrentCategory = categoryId => {
  return setSessionItem('current_category', categoryId);
};

export const getCurrentCategory = () => {
  return getSessionItem('current_category');
};

export const setSearchFilters = filters => {
  return setSessionItem('search_filters', filters);
};

export const getSearchFilters = () => {
  return getSessionItem('search_filters', {});
};

export const clearSearchFilters = () => {
  return removeSessionItem('search_filters');
};

export const setCurrentSearchQuery = query => {
  return setSessionItem('current_search_query', query);
};

export const getCurrentSearchQuery = () => {
  return getSessionItem('current_search_query', '');
};

export const setPaginationState = (page, pageSize = 12) => {
  return setSessionItem('pagination_state', { page, pageSize });
};

export const getPaginationState = () => {
  return getSessionItem('pagination_state', { page: 1, pageSize: 12 });
};

export const setSortingState = (sortBy, sortOrder = 'asc') => {
  return setSessionItem('sorting_state', { sortBy, sortOrder });
};

export const getSortingState = () => {
  return getSessionItem('sorting_state', { sortBy: 'name', sortOrder: 'asc' });
};

/**
 * Form State Management
 */
export const saveFormData = (formId, formData) => {
  return setSessionItem(`form_${formId}`, formData);
};

export const getFormData = formId => {
  return getSessionItem(`form_${formId}`, {});
};

export const clearFormData = formId => {
  return removeSessionItem(`form_${formId}`);
};

export const saveCheckoutProgress = (step, data) => {
  return setSessionItem('checkout_progress', { step, data, timestamp: Date.now() });
};

export const getCheckoutProgress = () => {
  return getSessionItem('checkout_progress', { step: 1, data: {}, timestamp: null });
};

export const clearCheckoutProgress = () => {
  return removeSessionItem('checkout_progress');
};

/**
 * Admin Session Management
 */
export const setAdminContext = context => {
  return setSessionItem('admin_context', context);
};

export const getAdminContext = () => {
  return getSessionItem('admin_context', {});
};

export const setAdminFilters = (section, filters) => {
  return setSessionItem(`admin_filters_${section}`, filters);
};

export const getAdminFilters = section => {
  return getSessionItem(`admin_filters_${section}`, {});
};

export const setAdminTableState = (tableId, state) => {
  return setSessionItem(`admin_table_${tableId}`, state);
};

export const getAdminTableState = tableId => {
  return getSessionItem(`admin_table_${tableId}`, {
    page: 1,
    pageSize: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
    filters: {},
  });
};

export const setLastAdminPage = page => {
  return setSessionItem('last_admin_page', page);
};

export const getLastAdminPage = () => {
  return getSessionItem('last_admin_page', '/admin/dashboard');
};

/**
 * Navigation and UI State
 */
export const setSidebarState = isOpen => {
  return setSessionItem('sidebar_state', { isOpen, timestamp: Date.now() });
};

export const getSidebarState = () => {
  const state = getSessionItem('sidebar_state', { isOpen: false });
  return state.isOpen;
};

export const setModalHistory = modalId => {
  const history = getSessionItem('modal_history', []);
  const updated = [modalId, ...history.filter(id => id !== modalId)].slice(0, 10);
  return setSessionItem('modal_history', updated);
};

export const getModalHistory = () => {
  return getSessionItem('modal_history', []);
};

export const setScrollPosition = (pageId, position) => {
  return setSessionItem(`scroll_${pageId}`, position);
};

export const getScrollPosition = pageId => {
  return getSessionItem(`scroll_${pageId}`, 0);
};

/**
 * Temporary Data Management
 */
export const setTempData = (key, data, identifier = null) => {
  const tempKey = identifier ? `temp_${key}_${identifier}` : `temp_${key}`;
  return setSessionItem(tempKey, data);
};

export const getTempData = (key, identifier = null) => {
  const tempKey = identifier ? `temp_${key}_${identifier}` : `temp_${key}`;
  return getSessionItem(tempKey);
};

export const clearTempData = (key, identifier = null) => {
  const tempKey = identifier ? `temp_${key}_${identifier}` : `temp_${key}`;
  return removeSessionItem(tempKey);
};

export const clearAllTempData = () => {
  try {
    if (!isSessionStorageAvailable()) {
      return false;
    }

    const keys = Object.keys(sessionStorage);
    const tempKeys = keys.filter(key => key.startsWith('temp_'));

    tempKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });

    return true;
  } catch (error) {
    console.error('Error clearing temp data:', error);
    return false;
  }
};

/**
 * Session Analytics and Tracking
 */
export const trackPageVisit = page => {
  try {
    const visits = getSessionItem('page_visits', {});
    const pageVisits = visits[page] || 0;

    visits[page] = pageVisits + 1;
    visits['__last_visit__'] = Date.now();

    return setSessionItem('page_visits', visits);
  } catch (error) {
    console.error('Error tracking page visit:', error);
    return false;
  }
};

export const getPageVisits = (page = null) => {
  try {
    const visits = getSessionItem('page_visits', {});

    if (page) {
      return visits[page] || 0;
    }

    return visits;
  } catch (error) {
    console.error('Error getting page visits:', error);
    return page ? 0 : {};
  }
};

export const setSessionStartTime = () => {
  if (!hasSessionItem('session_start_time')) {
    return setSessionItem('session_start_time', Date.now());
  }
  return true;
};

export const getSessionDuration = () => {
  try {
    const startTime = getSessionItem('session_start_time');

    if (!startTime) {
      return 0;
    }

    return Date.now() - startTime;
  } catch (error) {
    console.error('Error getting session duration:', error);
    return 0;
  }
};

/**
 * Session Security
 */
export const setSecureFlag = (key, isSecure = true) => {
  return setSessionItem(`${key}_secure`, isSecure);
};

export const isSecureItem = key => {
  return getSessionItem(`${key}_secure`, false);
};

export const setSessionFingerprint = () => {
  try {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now(),
    };

    return setSessionItem('__session_fingerprint__', fingerprint);
  } catch (error) {
    console.error('Error setting session fingerprint:', error);
    return false;
  }
};

export const validateSessionFingerprint = () => {
  try {
    const stored = getSessionItem('__session_fingerprint__');

    if (!stored) {
      return false;
    }

    const current = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    return (
      stored.userAgent === current.userAgent &&
      stored.language === current.language &&
      stored.timezone === current.timezone
    );
  } catch (error) {
    console.error('Error validating session fingerprint:', error);
    return false;
  }
};

/**
 * Session Storage Statistics
 */
export const getSessionStats = () => {
  try {
    if (!isSessionStorageAvailable()) {
      return {
        available: false,
        itemCount: 0,
        totalSize: 0,
        items: [],
      };
    }

    const items = [];
    let totalSize = 0;

    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        const item = sessionStorage.getItem(key);
        const size = new Blob([item]).size;

        let parsedData = null;
        try {
          parsedData = JSON.parse(item);
        } catch {
          // Item is not JSON
        }

        items.push({
          key,
          size,
          timestamp: parsedData ? parsedData.timestamp : null,
        });

        totalSize += size;
      }
    }

    return {
      available: true,
      itemCount: items.length,
      totalSize,
      items: items.sort((a, b) => b.size - a.size), // Sort by size descending
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return {
      available: false,
      itemCount: 0,
      totalSize: 0,
      items: [],
    };
  }
};

// Default export with all sessionStorage functions
export default {
  isSessionStorageAvailable,
  setSessionItem,
  getSessionItem,
  removeSessionItem,
  clearSession,
  hasSessionItem,
  setCurrentCategory,
  getCurrentCategory,
  setSearchFilters,
  getSearchFilters,
  clearSearchFilters,
  setCurrentSearchQuery,
  getCurrentSearchQuery,
  setPaginationState,
  getPaginationState,
  setSortingState,
  getSortingState,
  saveFormData,
  getFormData,
  clearFormData,
  saveCheckoutProgress,
  getCheckoutProgress,
  clearCheckoutProgress,
  setAdminContext,
  getAdminContext,
  setAdminFilters,
  getAdminFilters,
  setAdminTableState,
  getAdminTableState,
  setLastAdminPage,
  getLastAdminPage,
  setSidebarState,
  getSidebarState,
  setModalHistory,
  getModalHistory,
  setScrollPosition,
  getScrollPosition,
  setTempData,
  getTempData,
  clearTempData,
  clearAllTempData,
  trackPageVisit,
  getPageVisits,
  setSessionStartTime,
  getSessionDuration,
  setSecureFlag,
  isSecureItem,
  setSessionFingerprint,
  validateSessionFingerprint,
  getSessionStats,
};
