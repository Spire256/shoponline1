// src/contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Blue theme configuration based on the platform requirements
const blueThemeConfig = {
  // Primary color palette
  colors: {
    primary: {
      50: '#eff6ff', // Very light blue
      100: '#dbeafe', // Light blue
      200: '#bfdbfe', // Lighter blue
      300: '#93c5fd', // Medium light blue
      400: '#60a5fa', // Accent blue
      500: '#3b82f6', // Light blue
      600: '#2563eb', // Primary blue
      700: '#1d4ed8', // Medium blue
      800: '#1e40af', // Dark blue
      900: '#1e3a8a', // Very dark blue
    },

    // Secondary colors
    gray: {
      50: '#f8fafc', // Background
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b', // Text secondary
      600: '#475569',
      700: '#334155',
      800: '#1e293b', // Text primary
      900: '#0f172a',
    },

    // Status colors
    success: {
      50: '#ecfdf5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },

    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },

    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },

    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // Spacing system
  spacing: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    blue: '0 4px 14px 0 rgba(37, 99, 235, 0.25)', // Blue shadow for special elements
  },

  // Component specific styles
  components: {
    button: {
      primary: {
        backgroundColor: '#2563eb',
        color: '#ffffff',
        borderColor: '#2563eb',
        hoverBackgroundColor: '#1d4ed8',
        hoverBorderColor: '#1d4ed8',
        activeBackgroundColor: '#1e40af',
        focusRingColor: 'rgba(37, 99, 235, 0.5)',
      },
      secondary: {
        backgroundColor: 'transparent',
        color: '#2563eb',
        borderColor: '#2563eb',
        hoverBackgroundColor: '#eff6ff',
        hoverBorderColor: '#1d4ed8',
        activeBackgroundColor: '#dbeafe',
      },
      success: {
        backgroundColor: '#10b981',
        color: '#ffffff',
        borderColor: '#10b981',
        hoverBackgroundColor: '#059669',
      },
      warning: {
        backgroundColor: '#f59e0b',
        color: '#ffffff',
        borderColor: '#f59e0b',
        hoverBackgroundColor: '#d97706',
      },
      danger: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        borderColor: '#ef4444',
        hoverBackgroundColor: '#dc2626',
      },
    },

    card: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      hoverBoxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },

    input: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderRadius: '0.375rem',
      focusBorderColor: '#2563eb',
      focusRingColor: 'rgba(37, 99, 235, 0.1)',
      placeholderColor: '#9ca3af',
    },

    modal: {
      overlayColor: 'rgba(15, 23, 42, 0.5)',
      backgroundColor: '#ffffff',
      borderRadius: '0.75rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },

    header: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      textColor: '#1e293b',
      linkColor: '#2563eb',
      linkHoverColor: '#1d4ed8',
    },

    footer: {
      backgroundColor: '#1e293b',
      textColor: '#cbd5e1',
      linkColor: '#60a5fa',
      linkHoverColor: '#93c5fd',
    },

    sidebar: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      linkColor: '#64748b',
      linkHoverColor: '#2563eb',
      linkActiveColor: '#2563eb',
      linkActiveBackgroundColor: '#eff6ff',
    },
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Animation durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
};

// Theme context
const ThemeContext = createContext({
  theme: blueThemeConfig,
  isDarkMode: false,
  toggleDarkMode: () => {},
  currentTheme: 'blue',
  setTheme: () => {},
  getThemeValue: () => null,
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('blue');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('shoponline-theme');
    const savedDarkMode = localStorage.getItem('shoponline-dark-mode');

    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }

    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(blueThemeConfig.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });

    Object.entries(blueThemeConfig.colors.gray).forEach(([key, value]) => {
      root.style.setProperty(`--color-gray-${key}`, value);
    });

    // Apply component colors
    root.style.setProperty('--color-success', blueThemeConfig.colors.success[500]);
    root.style.setProperty('--color-warning', blueThemeConfig.colors.warning[500]);
    root.style.setProperty('--color-error', blueThemeConfig.colors.error[500]);
    root.style.setProperty('--color-info', blueThemeConfig.colors.info[500]);

    // Apply typography
    root.style.setProperty('--font-family-primary', blueThemeConfig.typography.fontFamily.primary);
    root.style.setProperty(
      '--font-family-secondary',
      blueThemeConfig.typography.fontFamily.secondary
    );

    // Apply spacing
    Object.entries(blueThemeConfig.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply border radius
    Object.entries(blueThemeConfig.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Apply dark mode class
    if (isDarkMode) {
      root.classList.add('dark');
      // Adjust colors for dark mode
      root.style.setProperty('--bg-primary', blueThemeConfig.colors.gray[900]);
      root.style.setProperty('--bg-secondary', blueThemeConfig.colors.gray[800]);
      root.style.setProperty('--text-primary', blueThemeConfig.colors.gray[100]);
      root.style.setProperty('--text-secondary', blueThemeConfig.colors.gray[300]);
    } else {
      root.classList.remove('dark');
      // Light mode colors
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', blueThemeConfig.colors.gray[50]);
      root.style.setProperty('--text-primary', blueThemeConfig.colors.gray[800]);
      root.style.setProperty('--text-secondary', blueThemeConfig.colors.gray[500]);
    }

  }, [isDarkMode, currentTheme]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('shoponline-dark-mode', JSON.stringify(newDarkMode));
  };

  // Set theme
  const setTheme = themeName => {
    setCurrentTheme(themeName);
    localStorage.setItem('shoponline-theme', themeName);
  };

  // Get theme value by path (e.g., 'colors.primary.600')
  const getThemeValue = path => {
    return path.split('.').reduce((obj, key) => obj?.[key], blueThemeConfig);
  };

  // Get component styles
  const getComponentStyles = (componentName, variant = 'primary') => {
    return blueThemeConfig.components[componentName]?.[variant] || {};
  };

  // Generate CSS classes for common patterns
  const getUtilityClasses = () => {
    return {
      // Text colors
      textPrimary: `color: ${blueThemeConfig.colors.gray[800]}`,
      textSecondary: `color: ${blueThemeConfig.colors.gray[500]}`,
      textBlue: `color: ${blueThemeConfig.colors.primary[600]}`,
      textSuccess: `color: ${blueThemeConfig.colors.success[600]}`,
      textWarning: `color: ${blueThemeConfig.colors.warning[600]}`,
      textError: `color: ${blueThemeConfig.colors.error[600]}`,

      // Background colors
      bgPrimary: 'background-color: #ffffff',
      bgSecondary: `background-color: ${blueThemeConfig.colors.gray[50]}`,
      bgBlue: `background-color: ${blueThemeConfig.colors.primary[600]}`,
      bgBlueLight: `background-color: ${blueThemeConfig.colors.primary[50]}`,

      // Button styles
      btnPrimary: {
        backgroundColor: blueThemeConfig.colors.primary[600],
        color: '#ffffff',
        border: `1px solid ${blueThemeConfig.colors.primary[600]}`,
        borderRadius: blueThemeConfig.borderRadius.md,
        padding: `${blueThemeConfig.spacing[2]} ${blueThemeConfig.spacing[4]}`,
        fontWeight: blueThemeConfig.typography.fontWeight.medium,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      },

      btnSecondary: {
        backgroundColor: 'transparent',
        color: blueThemeConfig.colors.primary[600],
        border: `1px solid ${blueThemeConfig.colors.primary[600]}`,
        borderRadius: blueThemeConfig.borderRadius.md,
        padding: `${blueThemeConfig.spacing[2]} ${blueThemeConfig.spacing[4]}`,
        fontWeight: blueThemeConfig.typography.fontWeight.medium,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      },

      // Card styles
      card: {
        backgroundColor: '#ffffff',
        border: `1px solid ${blueThemeConfig.colors.gray[200]}`,
        borderRadius: blueThemeConfig.borderRadius.lg,
        boxShadow: blueThemeConfig.boxShadow.base,
        padding: blueThemeConfig.spacing[6],
      },

      // Input styles
      input: {
        backgroundColor: '#ffffff',
        border: `1px solid ${blueThemeConfig.colors.gray[300]}`,
        borderRadius: blueThemeConfig.borderRadius.md,
        padding: `${blueThemeConfig.spacing[2]} ${blueThemeConfig.spacing[3]}`,
        fontSize: blueThemeConfig.typography.fontSize.base,
        color: blueThemeConfig.colors.gray[800],
        outline: 'none',
        transition: 'all 0.2s ease-in-out',
      },
    };
  };

  // Media query helpers
  const mediaQueries = {
    sm: `@media (min-width: ${blueThemeConfig.breakpoints.sm})`,
    md: `@media (min-width: ${blueThemeConfig.breakpoints.md})`,
    lg: `@media (min-width: ${blueThemeConfig.breakpoints.lg})`,
    xl: `@media (min-width: ${blueThemeConfig.breakpoints.xl})`,
    '2xl': `@media (min-width: ${blueThemeConfig.breakpoints['2xl']})`,
  };

  // Generate gradient backgrounds
  const getGradients = () => {
    return {
      blueGradient: `linear-gradient(135deg, ${blueThemeConfig.colors.primary[600]} 0%, ${blueThemeConfig.colors.primary[800]} 100%)`,
      lightBlueGradient: `linear-gradient(135deg, ${blueThemeConfig.colors.primary[50]} 0%, ${blueThemeConfig.colors.primary[100]} 100%)`,
      successGradient: `linear-gradient(135deg, ${blueThemeConfig.colors.success[500]} 0%, ${blueThemeConfig.colors.success[700]} 100%)`,
      warningGradient: `linear-gradient(135deg, ${blueThemeConfig.colors.warning[500]} 0%, ${blueThemeConfig.colors.warning[700]} 100%)`,
      errorGradient: `linear-gradient(135deg, ${blueThemeConfig.colors.error[500]} 0%, ${blueThemeConfig.colors.error[700]} 100%)`,
    };
  };

  // Theme context value
  const contextValue = {
    theme: blueThemeConfig,
    isDarkMode,
    toggleDarkMode,
    currentTheme,
    setTheme,
    getThemeValue,
    getComponentStyles,
    getUtilityClasses,
    mediaQueries,
    getGradients,

    // Convenience getters for common values
    colors: blueThemeConfig.colors,
    typography: blueThemeConfig.typography,
    spacing: blueThemeConfig.spacing,
    borderRadius: blueThemeConfig.borderRadius,
    boxShadow: blueThemeConfig.boxShadow,
    animation: blueThemeConfig.animation,
    zIndex: blueThemeConfig.zIndex,

    // Helper functions
    getPrimaryColor: (shade = 600) => blueThemeConfig.colors.primary[shade],
    getGrayColor: (shade = 500) => blueThemeConfig.colors.gray[shade],
    getSpacing: size => blueThemeConfig.spacing[size],
    getRadius: (size = 'md') => blueThemeConfig.borderRadius[size],
    getShadow: (size = 'base') => blueThemeConfig.boxShadow[size],
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// HOC for theme-aware components
export const withTheme = Component => {
  return props => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

// Utility function to generate className strings with theme
export const useCreateThemeClasses = (baseClasses, themeClasses = {}) => {
  const theme = useTheme();
    

  let classes = baseClasses;

  // Add theme-specific classes based on current theme and dark mode
  if (themeClasses.light && !theme.isDarkMode) {
    classes += ` ${themeClasses.light}`;
  }

  if (themeClasses.dark && theme.isDarkMode) {
    classes += ` ${themeClasses.dark}`;
  }

  if (themeClasses.blue && theme.currentTheme === 'blue') {
    classes += ` ${themeClasses.blue}`;
  }

  return classes.trim();
};

// Theme CSS-in-JS helper
export const useStyled = (element, styles) => {
  const theme = useTheme();

  // If styles is a function, call it with theme
  const computedStyles = typeof styles === 'function' ? styles(theme) : styles;

  return React.createElement(element, {
    style: computedStyles,
  });
};

export default ThemeContext;