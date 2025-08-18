import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import productsAPI from '../../../services/api/productsAPI';
import categoriesAPI from '../../../services/api/categoriesAPI';

const SearchBar = ({ isMobile = false, onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [categories, setCategories] = useState([]);

  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  // Handle clicks outside of search component
  useEffect(() => {
    const handleClickOutside = event => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories({
        is_active: true,
        limit: 10,
      });
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSuggestions = async searchQuery => {
    try {
      setIsLoading(true);
      const response = await productsAPI.searchProducts({
        q: searchQuery,
        limit: 8,
      });

      const products = response.data.results || response.data;

      // Format suggestions
      const productSuggestions = products.map(product => ({
        id: product.id,
        type: 'product',
        title: product.name,
        subtitle: product.category?.name,
        price: product.price,
        image: product.image_url,
        slug: product.slug,
      }));

      // Add category suggestions if query matches
      const categorySuggestions = categories
        .filter(category => category.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3)
        .map(category => ({
          id: category.id,
          type: 'category',
          title: category.name,
          subtitle: `${category.product_count} products`,
          slug: category.slug,
        }));

      setSuggestions([...categorySuggestions, ...productSuggestions]);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = e => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length < 2) {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    performSearch(query);
  };

  const performSearch = searchQuery => {
    if (!searchQuery.trim()) return;

    setShowSuggestions(false);
    setSelectedIndex(-1);

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = suggestion => {
    if (suggestion.type === 'product') {
      navigate(`/products/${suggestion.slug}`);
    } else if (suggestion.type === 'category') {
      navigate(`/categories/${suggestion.slug}`);
    }

    setQuery(suggestion.title);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = e => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          performSearch(query);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        searchRef.current?.querySelector('input')?.blur();
        break;

      default:
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const formatPrice = price => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div ref={searchRef} className={`search-bar ${isMobile ? 'search-bar--mobile' : ''}`}>
      <form onSubmit={handleSubmit} className="search-bar__form">
        <div className="search-bar__input-wrapper">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search for products, categories..."
            className="search-bar__input"
            aria-label="Search products"
            aria-autocomplete="list"
            aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="search-bar__clear"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          <button
            type="submit"
            className="search-bar__submit"
            aria-label="Search"
            disabled={!query.trim()}
          >
            {isLoading ? (
              <div className="search-bar__loading">
                <div className="search-bar__spinner" />
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path
                  d="M19 19L13.5 13.5M15.5 8.5C15.5 12.3659 12.3659 15.5 8.5 15.5C4.63407 15.5 1.5 12.3659 1.5 8.5C1.5 4.63407 4.63407 1.5 8.5 1.5C12.3659 1.5 15.5 4.63407 15.5 8.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && (
        <div ref={suggestionsRef} className="search-bar__suggestions" role="listbox">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  id={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`search-bar__suggestion ${
                    index === selectedIndex ? 'search-bar__suggestion--selected' : ''
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="search-bar__suggestion-content">
                    {suggestion.type === 'product' && suggestion.image && (
                      <img
                        src={suggestion.image}
                        alt={suggestion.title}
                        className="search-bar__suggestion-image"
                      />
                    )}

                    <div className="search-bar__suggestion-details">
                      <div className="search-bar__suggestion-title">
                        {suggestion.type === 'category' && (
                          <span className="search-bar__suggestion-type">Category: </span>
                        )}
                        {suggestion.title}
                      </div>

                      {suggestion.subtitle && (
                        <div className="search-bar__suggestion-subtitle">{suggestion.subtitle}</div>
                      )}
                    </div>

                    {suggestion.price && (
                      <div className="search-bar__suggestion-price">
                        {formatPrice(suggestion.price)}
                      </div>
                    )}
                  </div>
                </button>
              ))}

              <div className="search-bar__suggestions-footer">
                <button onClick={() => performSearch(query)} className="search-bar__view-all">
                  View all results for "{query}"
                </button>
              </div>
            </>
          ) : (
            <div className="search-bar__no-results">
              <div className="search-bar__no-results-icon">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <path
                    d="M44 44L34.5 34.5M39.5 22.5C39.5 31.6127 32.1127 39 23 39C13.8873 39 6.5 31.6127 6.5 22.5C6.5 13.3873 13.8873 6 23 6C32.1127 6 39.5 13.3873 39.5 22.5Z"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <div className="search-bar__no-results-text">No suggestions found for "{query}"</div>
              <button onClick={() => performSearch(query)} className="search-bar__search-anyway">
                Search anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;