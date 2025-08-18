// src/hooks/usePagination.js
import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for pagination functionality
 * Handles page state, calculations, and navigation
 */
export const usePagination = (initialOptions = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 20,
    totalItems = 0,
    maxVisiblePages = 5
  } = initialOptions;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(totalItems);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  // Calculate current items range
  const itemsRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    
    return { start, end };
  }, [currentPage, pageSize, total]);

  // Check if we're on first/last page
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Navigate to specific page
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    return validPage;
  }, [totalPages]);

  // Navigate to next page
  const nextPage = useCallback(() => {
    if (!isLastPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      return newPage;
    }
    return currentPage;
  }, [currentPage, isLastPage]);

  // Navigate to previous page
  const previousPage = useCallback(() => {
    if (!isFirstPage) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      return newPage;
    }
    return currentPage;
  }, [currentPage, isFirstPage]);

  // Go to first page
  const firstPage = useCallback(() => {
    setCurrentPage(1);
    return 1;
  }, []);

  // Go to last page
  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
    return totalPages;
  }, [totalPages]);

  // Change page size
  const changePageSize = useCallback((newPageSize) => {
    const validPageSize = Math.max(1, newPageSize);
    setPageSize(validPageSize);
    
    // Adjust current page to maintain roughly the same position
    const currentItem = (currentPage - 1) * pageSize + 1;
    const newPage = Math.ceil(currentItem / validPageSize);
    setCurrentPage(Math.max(1, newPage));
    
    return validPageSize;
  }, [currentPage, pageSize]);

  // Update total items (usually from API response)
  const updateTotal = useCallback((newTotal) => {
    setTotal(newTotal);
    
    // Adjust current page if it's now beyond the total pages
    const newTotalPages = Math.ceil(newTotal / pageSize);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  }, [currentPage, pageSize]);

  // Generate page numbers for pagination display
  const getVisiblePages = useMemo(() => {
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range around current page
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, currentPage - halfVisible);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust if we're near the end
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  // Get pagination info for API calls
  const getPaginationParams = useCallback(() => {
    return {
      page: currentPage,
      page_size: pageSize,
      offset: (currentPage - 1) * pageSize,
      limit: pageSize
    };
  }, [currentPage, pageSize]);

  // Reset pagination
  const reset = useCallback(() => {
    setCurrentPage(1);
    setTotal(0);
  }, []);

  // Get slice of data for current page (for client-side pagination)
  const getPageData = useCallback((data = []) => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [currentPage, pageSize]);

  return {
    // Current state
    currentPage,
    pageSize,
    totalPages,
    total,
    
    // Range info
    itemsRange,
    
    // Status checks
    isFirstPage,
    isLastPage,
    hasNextPage: !isLastPage,
    hasPreviousPage: !isFirstPage,
    
    // Navigation
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    
    // Configuration
    changePageSize,
    updateTotal,
    reset,
    
    // Utilities
    getVisiblePages,
    getPaginationParams,
    getPageData
  };
};

/**
 * Hook for infinite scroll pagination
 */
export const useInfiniteScroll = (loadMore, options = {}) => {
  const {
    threshold = 100,
    hasMore = true,
    isLoading = false
  } = options;

  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Handle intersection observer
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoading && !isFetching) {
      setIsFetching(true);
      loadMore().finally(() => setIsFetching(false));
    }
  }, [hasMore, isLoading, isFetching, loadMore]);

  // Set up intersection observer
  const setSentinel = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(handleObserver, {
        rootMargin: `${threshold}px`
      });
      observerRef.current.observe(node);
      sentinelRef.current = node;
    }
  }, [handleObserver, threshold]);

  // Cleanup on unmount
  useState(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    setSentinel,
    isFetching: isFetching || isLoading
  };
};

/**
 * Hook for table pagination with sorting and filtering
 */
export const useTablePagination = (data = [], options = {}) => {
  const {
    initialPageSize = 10,
    initialSortField = null,
    initialSortDirection = 'asc'
  } = options;

  const [pageSize, setPageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(initialSortField);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const [filters, setFilters] = useState({});

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          
          if (typeof value === 'string') {
            return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
          }
          
          return itemValue === value;
        });
      }
    });

    return filtered;
  }, [data, filters]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Calculate pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentPageData = sortedData.slice(startIndex, endIndex);

  // Navigation functions
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Sorting functions
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Reset to first page when sorting changes
    setCurrentPage(1);
  }, [sortField]);

  // Filter functions
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Reset all pagination state
  const reset = useCallback(() => {
    setCurrentPage(1);
    setSortField(initialSortField);
    setSortDirection(initialSortDirection);
    setFilters({});
  }, [initialSortField, initialSortDirection]);

  return {
    // Data
    currentPageData,
    totalItems,
    totalPages,
    
    // Pagination state
    currentPage,
    pageSize,
    startIndex,
    endIndex,
    
    // Pagination controls
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    
    // Sorting state
    sortField,
    sortDirection,
    handleSort,
    
    // Filter state
    filters,
    updateFilter,
    removeFilter,
    clearFilters,
    
    // Status
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    hasData: totalItems > 0,
    
    // Utilities
    reset
  };
};

export { useDebouncedCallback, useDebouncedSearch, useDebouncedValidation };
export default usePagination;