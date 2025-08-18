import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { productsAPI } from '../../../services/api/productsAPI';
import './SearchBar.css';

const SearchBar = ({
  onSearch = null,
  onFiltersToggle = null,
  placeholder = 'Search products...',
  showFilters = false,
  autoFocus = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Local storage for search history
  const [searchHistory, setSearchHistory] = useLocalStorage('search_history', []);
  const [recentSearches] = useLocalStorage('recent_searches', []);

  // Debounce search query for suggestions
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = event => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async searchQuery => {
    try {
      setLoading(true);

      // Simulate API call for suggestions
      // In real implementation, this would be a dedicated suggestions endpoint
      const response = await productsAPI.search({
        q: searchQuery,
        page_size: 5,
        suggest_only: true,
      });

      if (response.data && response.data.results) {
        const productSuggestions = response.data.results.map(product => ({
          type: 'product',
          text: product.name,
          category: product.category?.name,
          image: product.image_url,
          id: product.id,
        }));

        // Add query suggestions
        const querySuggestions = generateQuerySuggestions(searchQuery);

        setSuggestions([...querySuggestions, ...productSuggestions]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);

      // Fallback to query suggestions only
      setSuggestions(generateQuerySuggestions(searchQuery));
    } finally {
      setLoading(false);
    }
  };

  const generateQuerySuggestions = query => {
    const commonSuggestions = [
      'phones',
      'laptops',
      'shoes',
      'clothes',
      'electronics',
      'fashion',
      'home decor',
      'books',
      'sports',
      'beauty',
      'kitchen',
      'furniture',
    ];

    return commonSuggestions
      .filter(
        suggestion =>
          suggestion.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(suggestion.toLowerCase())
      )
      .slice(0, 3)
      .map(suggestion => ({
        type: 'query',
        text: suggestion,
        icon: <Search size={16} />,
      }));
  };

  const handleInputChange = e => {
    setQuery(e.target.value);
    setShowSuggestions(true);
    setSelectedSuggestion(-1);
  };

  const handleInputFocus = () => {
    setIsExpanded(true);
    if (query.trim() === '' && (searchHistory.length > 0 || recentSearches.length > 0)) {
      setShowSuggestions(true);
      showRecentAndHistory();
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow suggestion clicks to register
    setTimeout(() => {
      setIsExpanded(false);
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }, 200);
  };

  const handleSubmit = e => {
    e.preventDefault();
    performSearch(query);
  };

  const performSearch = searchQuery => {
    if (!searchQuery.trim()) return;

    // Add to search history
    const updatedHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(
      0,
      10
    ); // Keep last 10 searches

    setSearchHistory(updatedHistory);

    // Close suggestions
    setShowSuggestions(false);
    setSelectedSuggestion(-1);

    // Trigger search
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Default behavior: navigate to search page
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSuggestionClick = suggestion => {
    if (suggestion.type === 'product') {
      // Navigate to product page
      window.location.href = `/products/${suggestion.id}`;
    } else {
      // Perform search
      setQuery(suggestion.text);
      performSearch(suggestion.text);
    }
  };

  const handleKeyDown = e => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestion]);
        } else {
          performSearch(query);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeFromHistory = (searchTerm, e) => {
    e.stopPropagation();
    const updatedHistory = searchHistory.filter(h => h !== searchTerm);
    setSearchHistory(updatedHistory);
  };

  const showRecentAndHistory = () => {
    const recentSuggestions = [
      ...searchHistory.slice(0, 5).map(search => ({
        type: 'history',
        text: search,
        icon: <Clock size={16} />,
      })),
      ...recentSearches.slice(0, 3).map(search => ({
        type: 'recent',
        text: search,
        icon: <TrendingUp size={16} />,
      })),
    ];

    setSuggestions(recentSuggestions);
  };

  const renderSuggestion = (suggestion, index) => {
    const isSelected = index === selectedSuggestion;

    return (
      <div
        key={`${suggestion.type}-${index}`}
        className={`suggestion-item ${isSelected ? 'selected' : ''} ${suggestion.type}`}
        onClick={() => handleSuggestionClick(suggestion)}
        onMouseEnter={() => setSelectedSuggestion(index)}
      >
        <div className="suggestion-content">
          <div className="suggestion-icon">
            {suggestion.image ? (
              <img src={suggestion.image} alt="" className="suggestion-image" />
            ) : (
              suggestion.icon || <Search size={16} />
            )}
          </div>

          <div className="suggestion-text">
            <span className="suggestion-title">{suggestion.text}</span>
            {suggestion.category && (
              <span className="suggestion-category">in {suggestion.category}</span>
            )}
          </div>
        </div>

        {suggestion.type === 'history' && (
          <button
            className="remove-suggestion"
            onClick={e => removeFromHistory(suggestion.text, e)}
            aria-label="Remove from history"
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`search-bar ${isExpanded ? 'expanded' : ''} ${className}`}>
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <div className="search-input-container">
          <Search className="search-icon" size={20} />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="search-input"
            autoComplete="off"
            aria-label="Search products"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-activedescendant={
              selectedSuggestion >= 0 ? `suggestion-${selectedSuggestion}` : undefined
            }
          />

          {query && (
            <button
              type="button"
              className="clear-search"
              onClick={clearQuery}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {showFilters && onFiltersToggle && (
          <button
            type="button"
            className="filters-toggle"
            onClick={onFiltersToggle}
            aria-label="Toggle filters"
          >
            <Filter size={20} />
            <span className="filters-text">Filters</span>
          </button>
        )}

        <button type="submit" className="search-submit" aria-label="Search">
          <Search size={20} />
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="suggestions-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {loading ? (
            <div className="suggestion-loading">
              <div className="loading-spinner" />
              <span>Searching...</span>
            </div>
          ) : (
            <>
              {query.trim() === '' && searchHistory.length > 0 && (
                <div className="suggestions-section">
                  <div className="suggestions-header">
                    <Clock size={14} />
                    <span>Recent Searches</span>
                  </div>
                </div>
              )}

              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
              </div>

              {query.trim() !== '' && suggestions.length === 0 && (
                <div className="no-suggestions">
                  <span>No suggestions found</span>
                </div>
              )}

              <div className="search-footer">
                <div className="search-tip">
                  Press <kbd>Enter</kbd> to search for "<strong>{query}</strong>"
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
