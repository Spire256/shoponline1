import React, { useState, useRef, useEffect, forwardRef } from 'react';
import './Form.css';

const TextArea = forwardRef(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      onFocus,
      onBlur,
      error,
      success,
      disabled = false,
      required = false,
      className = '',
      id,
      name,
      rows = 4,
      maxLength,
      resize = 'vertical', // 'none', 'vertical', 'horizontal', 'both'
      autoResize = false,
      helperText,
      showCharacterCount = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [characterCount, setCharacterCount] = useState(value?.length || 0);
    const textareaRef = useRef(null);
    const combinedRef = ref || textareaRef;

    const textareaId = id || name || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
      setCharacterCount(value?.length || 0);

      if (autoResize && combinedRef.current) {
        // Reset height to auto to get the correct scrollHeight
        combinedRef.current.style.height = 'auto';
        // Set height to scrollHeight
        combinedRef.current.style.height = `${combinedRef.current.scrollHeight}px`;
      }
    }, [value, autoResize, combinedRef]);

    const handleFocus = e => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = e => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    const handleChange = e => {
      const newValue = e.target.value;
      setCharacterCount(newValue.length);

      if (autoResize) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }

      if (onChange) onChange(e);
    };

    const containerClasses = [
      'form-textarea-container',
      isFocused && 'form-textarea-container--focused',
      error && 'form-textarea-container--error',
      success && 'form-textarea-container--success',
      disabled && 'form-textarea-container--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const textareaClasses = [
      'form-textarea',
      `form-textarea--resize-${resize}`,
      autoResize && 'form-textarea--auto-resize',
    ]
      .filter(Boolean)
      .join(' ');

    const isOverLimit = maxLength && characterCount > maxLength;

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={textareaId} className="form-label">
            {label}
            {required && <span className="form-label__required">*</span>}
          </label>
        )}

        <div className="form-textarea-wrapper">
          <textarea
            ref={combinedRef}
            id={textareaId}
            name={name}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            maxLength={maxLength}
            className={textareaClasses}
            {...props}
          />

          {(showCharacterCount || maxLength) && (
            <div
              className={`form-textarea__count ${isOverLimit ? 'form-textarea__count--error' : ''}`}
            >
              {maxLength ? `${characterCount}/${maxLength}` : characterCount}
            </div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className="form-textarea__feedback">
            {error && (
              <div className="form-textarea__error">
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
              <div className="form-textarea__success">
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
              <div className="form-textarea__helper">{helperText}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
