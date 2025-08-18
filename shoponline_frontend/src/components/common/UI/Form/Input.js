import React, { useState, forwardRef } from 'react';
import './Form.css';

const Input = forwardRef(
  (
    {
      type = 'text',
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
      size = 'medium',
      startIcon,
      endIcon,
      helperText,
      maxLength,
      autoComplete,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleFocus = e => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = e => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
    const inputType = type === 'password' && showPassword ? 'text' : type;

    const containerClasses = [
      'form-input-container',
      `form-input-container--${size}`,
      isFocused && 'form-input-container--focused',
      error && 'form-input-container--error',
      success && 'form-input-container--success',
      disabled && 'form-input-container--disabled',
      (startIcon || endIcon || type === 'password') && 'form-input-container--with-icon',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && <span className="form-label__required">*</span>}
          </label>
        )}

        <div className="form-input-wrapper">
          {startIcon && <div className="form-input__icon form-input__icon--start">{startIcon}</div>}

          <input
            ref={ref}
            type={inputType}
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            autoComplete={autoComplete}
            className="form-input"
            {...props}
          />

          {type === 'password' && (
            <button
              type="button"
              className="form-input__icon form-input__icon--end form-input__password-toggle"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}

          {endIcon && type !== 'password' && (
            <div className="form-input__icon form-input__icon--end">{endIcon}</div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className="form-input__feedback">
            {error && (
              <div className="form-input__error">
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
              <div className="form-input__success">
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
              <div className="form-input__helper">{helperText}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
