// src/hooks/useDebounce.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing values
 * Useful for search inputs, API calls, etc.
 */
export const useDebounce = (value, delay = 500, options = {}) => {
  const { leading = false, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  const leadingRef = useRef(true);

  useEffect(() => {
    // Handle leading edge
    if (leading && leadingRef.current) {
      setDebouncedValue(value);
      leadingRef.current = false;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for trailing edge
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        leadingRef.current = true;
      }, delay);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing]);

  return debouncedValue;
};

/**
 * Custom hook for debouncing functions
 * Useful for API calls, form submissions, etc.
 */
export const useDebouncedCallback = (callback, delay = 500, deps = []) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const debouncedCallback = useCallback(
    (...args) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cancel pending callback
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Flush (execute immediately)
  const flush = useCallback(
    (...args) => {
      cancel();
      callbackRef.current(...args);
    },
    [cancel]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancel, flush];
};

/**
 * Custom hook for search with debouncing
 * Combines debouncing with search state management
 */
export const useDebouncedSearch = (searchFunction, delay = 500) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  // Perform search when debounced term changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await searchFunction(debouncedSearchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError(error.message);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, searchFunction]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    searchError,
    clearSearch,
    hasResults: searchResults.length > 0,
  };
};

/**
 * Custom hook for debounced form validation
 */
export const useDebouncedValidation = (validator, delay = 300) => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    errors: {},
    isValid: true,
  });

  const [debouncedValidate] = useDebouncedCallback(async values => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const errors = await validator(values);
      setValidationState({
        isValidating: false,
        errors: errors || {},
        isValid: Object.keys(errors || {}).length === 0,
      });
    } catch (error) {
      setValidationState({
        isValidating: false,
        errors: { general: error.message },
        isValid: false,
      });
    }
  }, delay);

  return {
    ...validationState,
    validate: debouncedValidate,
    clearErrors: () => setValidationState(prev => ({ ...prev, errors: {}, isValid: true })),
  };
};

export default useDebounce;
