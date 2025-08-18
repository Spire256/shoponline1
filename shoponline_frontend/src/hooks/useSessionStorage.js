// src/hooks/useSessionStorage.js
import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for sessionStorage with automatic JSON serialization
 * Similar to useLocalStorage but for session-based storage
 */
export const useSessionStorage = (key, initialValue = null) => {
  // State to store the value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function
  const setValue = useCallback(
    value => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      // Save to sessionStorage
        if (valueToStore === null || valueToStore === undefined) {
          window.sessionStorage.removeItem(key);
        } else {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove item from sessionStorage
  const removeValue = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for managing form data in session storage
 * Useful for preserving form state across page refreshes
 */
export const useSessionForm = (formKey, initialFormData = {}) => {
  const [formData, setFormData] = useSessionStorage(`form_${formKey}`, initialFormData);
  const [isDirty, setIsDirty] = useState(false);

  // Update form field
  const updateField = useCallback(
    (fieldName, value) => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value,
      }));
      setIsDirty(true);
    },
    [setFormData]
  );

  // Update multiple fields
  const updateFields = useCallback(
    fields => {
      setFormData(prev => ({
        ...prev,
        ...fields,
      }));
      setIsDirty(true);
    },
    [setFormData]
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setIsDirty(false);
  }, [setFormData, initialFormData]);

  // Clear form from session storage
  const clearForm = useCallback(() => {
    setFormData(null);
    setIsDirty(false);
  }, [setFormData]);

  // Get field value
  const getField = useCallback(
    (fieldName, defaultValue = '') => {
      return formData?.[fieldName] ?? defaultValue;
    },
    [formData]
  );

  return {
    formData,
    updateField,
    updateFields,
    resetForm,
    clearForm,
    getField,
    isDirty,
  };
};

/**
 * Hook for managing checkout process state in session storage
 */
export const useSessionCheckout = () => {
  const [checkoutData, setCheckoutData] = useSessionStorage('checkout_process', {
    step: 1,
    customerInfo: {},
    deliveryInfo: {},
    paymentMethod: '',
    orderSummary: {},
  });

  // Update checkout step
  const updateStep = useCallback(
    step => {
      setCheckoutData(prev => ({
        ...prev,
        step,
      }));
    },
    [setCheckoutData]
  );

  // Update customer information
  const updateCustomerInfo = useCallback(
    customerInfo => {
      setCheckoutData(prev => ({
        ...prev,
        customerInfo: { ...prev.customerInfo, ...customerInfo },
      }));
    },
    [setCheckoutData]
  );

  // Update delivery information
  const updateDeliveryInfo = useCallback(
    deliveryInfo => {
      setCheckoutData(prev => ({
        ...prev,
        deliveryInfo: { ...prev.deliveryInfo, ...deliveryInfo },
      }));
    },
    [setCheckoutData]
  );

  // Update payment method
  const updatePaymentMethod = useCallback(
    paymentMethod => {
      setCheckoutData(prev => ({
        ...prev,
        paymentMethod,
      }));
    },
    [setCheckoutData]
  );

  // Update order summary
  const updateOrderSummary = useCallback(
    orderSummary => {
      setCheckoutData(prev => ({
        ...prev,
        orderSummary: { ...prev.orderSummary, ...orderSummary },
      }));
    },
    [setCheckoutData]
  );

  // Clear checkout data
  const clearCheckout = useCallback(() => {
    setCheckoutData({
      step: 1,
      customerInfo: {},
      deliveryInfo: {},
      paymentMethod: '',
      orderSummary: {},
    });
  }, [setCheckoutData]);

  // Validate current step
  const validateStep = useCallback(
    step => {
      switch (step) {
        case 1: // Customer Info
          return (
            checkoutData.customerInfo.email &&
            checkoutData.customerInfo.first_name &&
            checkoutData.customerInfo.last_name)


        case 2: // Delivery Info
          return (
            checkoutData.deliveryInfo.address_line_1 &&
            checkoutData.deliveryInfo.city &&
            checkoutData.deliveryInfo.district)


        case 3: // Payment Method
          return checkoutData.paymentMethod !== '';

      default:
          return true;
      }
    },
    [checkoutData]
  );

  // Check if checkout is complete
  const isCheckoutComplete = useCallback(() => {
    return validateStep(1) && validateStep(2) && validateStep(3);
  }, [validateStep]);

  return {
    checkoutData,
    updateStep,
    updateCustomerInfo,
    updateDeliveryInfo,
    updatePaymentMethod,
    updateOrderSummary,
    clearCheckout,
    validateStep,
    isCheckoutComplete,

    // Convenience getters
    currentStep: checkoutData.step,
    customerInfo: checkoutData.customerInfo,
    deliveryInfo: checkoutData.deliveryInfo,
    paymentMethod: checkoutData.paymentMethod,
    orderSummary: checkoutData.orderSummary,
  };
};

/**
 * Hook for managing user preferences in session storage
 */
export const useSessionPreferences = () => {
  const [preferences, setPreferences] = useSessionStorage('user_preferences', {
    language: 'en',
    currency: 'UGX',
    itemsPerPage: 20,
    viewMode: 'grid', // 'grid' or 'list'
    sortBy: 'name',
    sortOrder: 'asc',
    filters: {},
  });

  // Update a single preference
  const updatePreference = useCallback(
    (key, value) => {
      setPreferences(prev => ({
        ...prev,
        [key]: value,
      }));
    },
    [setPreferences]
  );

  // Update multiple preferences
  const updatePreferences = useCallback(
    newPreferences => {
      setPreferences(prev => ({
        ...prev,
        ...newPreferences,
      }));
    },
    [setPreferences]
  );

  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    setPreferences({
      language: 'en',
      currency: 'UGX',
      itemsPerPage: 20,
      viewMode: 'grid',
      sortBy: 'name',
      sortOrder: 'asc',
      filters: {},
    });
  }, [setPreferences]);

  // Get specific preference with fallback
  const getPreference = useCallback(
    (key, fallback = null) => {
      return preferences[key] ?? fallback;
    },
    [preferences]
  );

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    getPreference,

    // Convenience getters
    language: preferences.language,
    currency: preferences.currency,
    itemsPerPage: preferences.itemsPerPage,
    viewMode: preferences.viewMode,
    sortBy: preferences.sortBy,
    sortOrder: preferences.sortOrder,
    filters: preferences.filters,
  };
};

/**
 * Hook for managing recent searches in session storage
 */
export const useRecentSearches = (maxSearches = 10) => {
  const [recentSearches, setRecentSearches] = useSessionStorage('recent_searches', []);

  // Add a new search term
  const addSearch = useCallback(
    searchTerm => {
      if (!searchTerm || searchTerm.trim() === '') return;

      const trimmedTerm = searchTerm.trim().toLowerCase();

      setRecentSearches(prev => {
        // Remove if already exists
        const filtered = prev.filter(term => term !== trimmedTerm);

      // Add to beginning and limit to maxSearches
        return [trimmedTerm, ...filtered].slice(0, maxSearches);
      });
    },
    [setRecentSearches, maxSearches]
  );

  // Remove a search term
  const removeSearch = useCallback(
    searchTerm => {
      setRecentSearches(prev => prev.filter(term => term !== searchTerm));
    },
    [setRecentSearches]
  );

  // Clear all recent searches
  const clearSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
    hasSearches: recentSearches.length > 0,
  };
};

export default useLocalStorage;
