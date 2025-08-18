// src/hooks/useLocalStorage.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for localStorage with automatic JSON serialization
 * and synchronization across tabs
 */
export const useLocalStorage = (key, initialValue = null) => {
  // State to store the value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
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

        // Save to localStorage
        if (valueToStore === null || valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = e => {
      if (e.key === key && e.newValue !== e.oldValue) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for managing multiple localStorage keys with a prefix
 */
export const usePrefixedLocalStorage = prefix => {
  const setItem = useCallback(
    (key, value) => {
      const prefixedKey = `${prefix}_${key}`;
      try {
        if (value === null || value === undefined) {
          localStorage.removeItem(prefixedKey);
        } else {
          localStorage.setItem(prefixedKey, JSON.stringify(value));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${prefixedKey}":`, error);
      }
    },
    [prefix]
  );

  const getItem = useCallback(
    (key, defaultValue = null) => {
      const prefixedKey = `${prefix}_${key}`;
      try {
        const item = localStorage.getItem(prefixedKey);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error(`Error reading localStorage key "${prefixedKey}":`, error);
        return defaultValue;
      }
    },
    [prefix]
  );

  const removeItem = useCallback(
    key => {
      const prefixedKey = `${prefix}_${key}`;
      try {
        localStorage.removeItem(prefixedKey);
      } catch (error) {
        console.error(`Error removing localStorage key "${prefixedKey}":`, error);
      }
    },
    [prefix]
  );

  const clear = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${prefix}_`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error(`Error clearing localStorage with prefix "${prefix}":`, error);
    }
  }, [prefix]);

  const getAllItems = useCallback(() => {
    try {
      const items = {};
      const keys = Object.keys(localStorage);

      keys.forEach(key => {
        if (key.startsWith(`${prefix}_`)) {
          const unprefixedKey = key.replace(`${prefix}_`, '');
          const value = localStorage.getItem(key);
          items[unprefixedKey] = value ? JSON.parse(value) : null;
        }
      });

      return items;
    } catch (error) {
      console.error(`Error getting all items with prefix "${prefix}":`, error);
      return {};
    }
  }, [prefix]);

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    getAllItems,
  };
};

/**
 * Hook for localStorage with validation
 */
export const useValidatedLocalStorage = (key, initialValue, validator) => {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState(null);

  // Validate value whenever it changes
  useEffect(() => {
    if (validator && value !== null) {
      try {
        const validation = validator(value);
        setIsValid(validation.isValid);
        setValidationError(validation.error || null);

        // If invalid, could optionally reset to initial value
        if (!validation.isValid && validation.resetOnInvalid) {
          setValue(initialValue);
        }
      } catch (error) {
        setIsValid(false);
        setValidationError(error.message);
      }
    }
  }, [value, validator, setValue, initialValue]);

  const setValidatedValue = useCallback(
    newValue => {
      if (validator) {
        try {
          const validation = validator(newValue);
          if (validation.isValid) {
            setValue(newValue);
          } else {
            setValidationError(validation.error || 'Invalid value');
            return false;
          }
        } catch (error) {
          setValidationError(error.message);
          return false;
        }
      } else {
        setValue(newValue);
      }
      return true;
    },
    [setValue, validator]
  );

  return [value, setValidatedValue, removeValue, { isValid, validationError }];
};

/**
 * Hook for localStorage with expiration
 */
export const useExpiringLocalStorage = (key, initialValue, expirationMs = 24 * 60 * 60 * 1000) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return initialValue;

      const { value: storedValue, timestamp } = JSON.parse(item);

      // Check if expired
      if (Date.now() - timestamp > expirationMs) {
        localStorage.removeItem(key);
        return initialValue;
      }

      return storedValue;
    } catch (error) {
      console.error(`Error reading expiring localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setExpiringValue = useCallback(
    newValue => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;

        if (valueToStore === null || valueToStore === undefined) {
          localStorage.removeItem(key);
          setValue(initialValue);
        } else {
          const item = {
            value: valueToStore,
            timestamp: Date.now(),
          };
          localStorage.setItem(key, JSON.stringify(item));
          setValue(valueToStore);
        }
      } catch (error) {
        console.error(`Error setting expiring localStorage key "${key}":`, error);
      }
    },
    [key, value, initialValue]
  );

  const removeExpiringValue = useCallback(() => {
    localStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);

  // Check if value is expired
  const isExpired = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return true;

      const { timestamp } = JSON.parse(item);
      return Date.now() - timestamp > expirationMs;
    } catch (error) {
      return true;
    }
  }, [key, expirationMs]);

  return [value, setExpiringValue, removeExpiringValue, isExpired];
};

export default useLocalStorage;
