import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import SearchResults from './SearchResults';
import './SearchPage.css';

const SearchPage = () => {
  const location = useLocation();

  // Initialize with completely safe defaults
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    results: [],
    count: 0,
    query: '',
    filters: {}
  });

  // Extract search query from URL parameters with maximum safety
  useEffect(() => {
    try {
      if (!location || !location.search) {
        return;
      }
      
      const urlParams = new URLSearchParams(location.search);
      const queryFromUrl = urlParams.get('q');
      
      // Convert to string safely
      const safeQuery = queryFromUrl === null ? '' : String(queryFromUrl);
      
      if (safeQuery !== searchQuery) {
        setSearchQuery(safeQuery);
      }
    } catch (error) {
      console.warn('Error parsing URL search params:', error);
      setSearchQuery('');
    }
  }, [location?.search, searchQuery]);

  // Handle search query change from Header
  const handleSearchQueryChange = useCallback((newQuery) => {
    try {
      // Ensure we always have a string
      const query = newQuery === null || newQuery === undefined ? '' : String(newQuery);
      setSearchQuery(query);

      // Update URL when search query changes
      if (query && query.trim()) {
        const newUrl = `/search?q=${encodeURIComponent(query)}`;
        if (window.history && window.history.replaceState) {
          const currentUrl = `${location?.pathname || ''}${location?.search || ''}`;
          if (currentUrl !== newUrl) {
            window.history.replaceState({}, '', newUrl);
          }
        }
      } else {
        // Clear URL params when search is empty
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, '', '/search');
        }
      }
    } catch (error) {
      console.warn('Error in handleSearchQueryChange:', error);
      // Fallback to just setting the query
      setSearchQuery(newQuery === null || newQuery === undefined ? '' : String(newQuery));
    }
  }, [location]);

  // Handle results change from SearchResults component
  const handleResultsChange = useCallback((resultsData) => {
    try {
      // Completely safe result processing
      if (!resultsData || typeof resultsData !== 'object') {
        setSearchResults({
          results: [],
          count: 0,
          query: '',
          filters: {}
        });
        return;
      }

      const safeResults = {
        results: [],
        count: 0,
        query: '',
        filters: {}
      };

      // Process results array
      if (resultsData.results) {
        if (Array.isArray(resultsData.results)) {
          safeResults.results = resultsData.results;
        } else if (resultsData.results && typeof resultsData.results === 'object' && resultsData.results.length !== null && resultsData.results.length !== undefined) {
          // Handle array-like objects
          try {
            safeResults.results = Array.from(resultsData.results);
          } catch {
            safeResults.results = [];
          }
        }
      }

      // Process count
      if (typeof resultsData.count === 'number' && !isNaN(resultsData.count)) {
        safeResults.count = Math.max(0, resultsData.count);
      }

      // Process query
      if (typeof resultsData.query === 'string') {
        safeResults.query = resultsData.query;
      }

      // Process filters
      if (resultsData.filters && typeof resultsData.filters === 'object' && !Array.isArray(resultsData.filters)) {
        safeResults.filters = resultsData.filters;
      }

      setSearchResults(safeResults);
    } catch (error) {
      console.warn('Error in handleResultsChange:', error);
      setSearchResults({
        results: [],
        count: 0,
        query: '',
        filters: {}
      });
    }
  }, []);

  // Get initial filters from URL parameters
  const getInitialFilters = useCallback(() => {
    const defaultFilters = {};
    
    try {
      if (!location || !location.search) {
        return defaultFilters;
      }

      const urlParams = new URLSearchParams(location.search);
      const filterKeys = [
        'category', 'price_min', 'price_max', 'brand', 'color', 'size', 
        'condition', 'material', 'rating_min', 'in_stock', 'on_sale', 'is_featured'
      ];

      filterKeys.forEach(key => {
        try {
          const value = urlParams.get(key);
          if (value !== null && value !== '') {
            if (key === 'in_stock' || key === 'on_sale' || key === 'is_featured') {
              defaultFilters[key] = value === 'true';
            } else if (key === 'price_min' || key === 'price_max' || key === 'rating_min') {
              const numValue = parseFloat(value);
              if (!isNaN(numValue) && isFinite(numValue)) {
                defaultFilters[key] = numValue;
              }
            } else {
              defaultFilters[key] = String(value);
            }
          }
        } catch (filterError) {
          console.warn(`Error parsing filter ${key}:`, filterError);
        }
      });
    } catch (error) {
      console.warn('Error getting initial filters:', error);
    }

    return defaultFilters;
  }, [location]);

  // Ensure searchQuery is always a string
  const safeSearchQuery = searchQuery === null || searchQuery === undefined ? '' : String(searchQuery);

  return (
    <div className="search-page">
      <Header
        searchQuery={safeSearchQuery}
        onSearchQueryChange={handleSearchQueryChange}
        hideSearchOnSearchPage={false}
      />
      <div className="container">
        <div className="search-content">
          {!safeSearchQuery && (
            <div className="search-welcome">
              <h1 className="welcome-title">Search Products</h1>
              <p className="welcome-message">
                Use the search bar above to find products, categories, and more.
              </p>
            </div>
          )}
          <SearchResults
            searchQuery={safeSearchQuery}
            initialFilters={getInitialFilters()}
            onResultsChange={handleResultsChange}
            showHeader={Boolean(safeSearchQuery)}
            showFilters={true}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;