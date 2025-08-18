import React, { useState, useRef, useEffect, forwardRef } from 'react';
import './Form.css';

const Select = forwardRef(
  (
    {
      label,
      options = [],
      value,
      onChange,
      onFocus,
      onBlur,
      placeholder = 'Select an option',
      error,
      success,
      disabled = false,
      required = false,
      className = '',
      id,
      name,
      size = 'medium',
      searchable = false,
      multiple = false,
      helperText,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
      const handleClickOutside = event => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen && onFocus) {
          setIsFocused(true);
          onFocus();
        }
      }
    };

    const handleOptionSelect = option => {
      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        const newValue = currentValue.includes(option.value)
          ? currentValue.filter(v => v !== option.value)
          : [...currentValue, option.value];
        onChange(newValue);
      } else {
        onChange(option.value);
        setIsOpen(false);
        setIsFocused(false);
        if (onBlur) onBlur();
      }
    };

    const handleSearchChange = e => {
      setSearchTerm(e.target.value);
    };

    const filteredOptions = searchable
      ? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
      : options;

    const getDisplayValue = () => {
      if (multiple) {
        const selectedOptions = options.filter(option =>
          Array.isArray(value) ? value.includes(option.value) : false
        );
        return selectedOptions.length > 0
          ? selectedOptions.map(opt => opt.label).join(', ')
          : placeholder;
      } else {
        const selectedOption = options.find(option => option.value === value);
        return selectedOption ? selectedOption.label : placeholder;
      }
    };

    const isOptionSelected = option => {
      if (multiple) {
        return Array.isArray(value) ? value.includes(option.value) : false;
      }
      return value === option.value;
    };

    const containerClasses = [
      'form-select-container',
      `form-select-container--${size}`,
      isOpen && 'form-select-container--open',
      isFocused && 'form-select-container--focused',
      error && 'form-select-container--error',
      success && 'form-select-container--success',
      disabled && 'form-select-container--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={containerRef} className={containerClasses}>
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}
            {required && <span className="form-label__required">*</span>}
          </label>
        )}

        <div className="form-select-wrapper">
          <button
            ref={ref}
            type="button"
            id={selectId}
            name={name}
            className="form-select"
            onClick={handleToggle}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            {...props}
          >
            <span className="form-select__value">{getDisplayValue()}</span>

            <div className="form-select__icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isOpen ? 'form-select__icon--rotated' : ''}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </button>

          {isOpen && (
            <div className="form-select__dropdown" role="listbox">
              {searchable && (
                <div className="form-select__search">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search options..."
                    className="form-select__search-input"
                  />
                </div>
              )}

              <div className="form-select__options">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
                    <button
                      key={option.value || index}
                      type="button"
                      className={`form-select__option ${
                        isOptionSelected(option) ? 'form-select__option--selected' : ''
                      }`}
                      onClick={() => handleOptionSelect(option)}
                      role="option"
                      aria-selected={isOptionSelected(option)}
                    >
                      {multiple && (
                        <div className="form-select__checkbox">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={isOptionSelected(option) ? 'visible' : 'hidden'}
                          >
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                        </div>
                      )}

                      <span className="form-select__option-label">
                        {option.label}
                      </span>

                      {!multiple && isOptionSelected(option) && (
                        <div className="form-select__check">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="form-select__no-options">No options found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className="form-select__feedback">
            {error && (
              <div className="form-select__error">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {success && !error && (
              <div className="form-select__success">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {success}
              </div>
            )}

            {helperText && !error && !success && (
              <div className="form-select__helper">{helperText}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;