/**
 * Blue Theme Configuration for ShopOnline Uganda E-commerce Platform
 * Comprehensive theme system with blue color palette, typography, and component styling
 */

/**
 * Core Blue Color Palette
 */
export const colors = {
  // Primary Blue Shades
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary
    600: '#2563eb', // Primary brand color
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },

  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },

  // Status Colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    700: '#047857'
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  }
};

/**
 * Typography Configuration
 */
export const typography = {
  fonts: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondary: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace'
  },

  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
    '8xl': '6rem',     // 96px
    '9xl': '8rem'      // 128px
  },

  weights: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
};

/**
 * Spacing Configuration
 */
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem'     // 256px
};

/**
 * Border Radius Configuration
 */
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
};

/**
 * Shadow Configuration
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Blue-themed shadows
  blue: '0 4px 14px 0 rgba(37, 99, 235, 0.2)',
  blueLight: '0 2px 8px 0 rgba(37, 99, 235, 0.1)',
  blueDark: '0 8px 25px 0 rgba(30, 64, 175, 0.3)'
};

/**
 * Gradient Configurations
 */
export const gradients = {
  primary: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
  primaryLight: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  primaryReverse: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  
  // Background gradients
  blueLight: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  blueToWhite: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
  
  // Status gradients
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  
  // Overlay gradients
  overlay: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
  overlayBlue: 'linear-gradient(180deg, rgba(37,99,235,0.4) 0%, rgba(30,64,175,0.6) 100%)'
};

/**
 * Animation Configuration
 */
export const animations = {
  // Durations
  durations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms'
  },

  // Easing functions
  easings: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },

  // Predefined animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: '300ms',
    easing: 'ease-out'
  },

  slideUp: {
    from: { transform: 'translateY(20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
    duration: '300ms',
    easing: 'ease-out'
  },

  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    duration: '200ms',
    easing: 'ease-out'
  },

  buttonPress: {
    from: { transform: 'scale(1)' },
    to: { transform: 'scale(0.98)' },
    duration: '100ms',
    easing: 'ease-in-out'
  }
};

/**
 * Component-specific Theme Configurations
 */
export const components = {
  // Button themes
  button: {
    primary: {
      backgroundColor: colors.primary[600],
      color: '#ffffff',
      borderColor: colors.primary[600],
      hover: {
        backgroundColor: colors.primary[700],
        borderColor: colors.primary[700]
      },
      active: {
        backgroundColor: colors.primary[800],
        borderColor: colors.primary[800]
      },
      disabled: {
        backgroundColor: colors.secondary[300],
        color: colors.secondary[500],
        borderColor: colors.secondary[300]
      }
    },
    
    secondary: {
      backgroundColor: 'transparent',
      color: colors.primary[600],
      borderColor: colors.primary[600],
      hover: {
        backgroundColor: colors.primary[50],
        borderColor: colors.primary[700]
      }
    },
    
    ghost: {
      backgroundColor: 'transparent',
      color: colors.primary[600],
      borderColor: 'transparent',
      hover: {
        backgroundColor: colors.primary[50]
      }
    }
  },

  // Card themes
  card: {
    default: {
      backgroundColor: '#ffffff',
      borderColor: colors.secondary[200],
      shadow: shadows.default,
      borderRadius: borderRadius.lg
    },
    
    elevated: {
      backgroundColor: '#ffffff',
      borderColor: 'transparent',
      shadow: shadows.lg,
      borderRadius: borderRadius.lg
    },
    
    product: {
      backgroundColor: '#ffffff',
      borderColor: colors.secondary[200],
      shadow: shadows.sm,
      borderRadius: borderRadius.lg,
      hover: {
        shadow: shadows.md,
        borderColor: colors.primary[300]
      }
    }
  },

  // Form elements
  input: {
    default: {
      borderColor: colors.secondary[300],
      backgroundColor: '#ffffff',
      color: colors.secondary[900],
      borderRadius: borderRadius.md,
      focus: {
        borderColor: colors.primary[500],
        shadowColor: colors.primary[500]
      },
      error: {
        borderColor: colors.error[500],
        shadowColor: colors.error[500]
      }
    }
  },

  // Navigation
  navigation: {
    header: {
      backgroundColor: '#ffffff',
      borderColor: colors.secondary[200],
      shadow: shadows.sm
    },
    
    sidebar: {
      backgroundColor: colors.primary[900],
      textColor: '#ffffff',
      activeColor: colors.primary[400],
      hoverColor: colors.primary[800]
    }
  }
};

/**
 * Responsive Breakpoints
 */
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

/**
 * Z-Index Scale
 */
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
};

/**
 * Theme Configuration Object
 */
export const theme = {
  name: 'ShopOnline Blue Theme',
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  gradients,
  animations,
  components,
  breakpoints,
  zIndex
};

/**
 * CSS Custom Properties Generator
 * Generates CSS variables for the theme
 */
export const generateCSSVariables = () => {
  const cssVars = {};

  // Color variables
  Object.entries(colors).forEach(([colorName, colorShades]) => {
    if (typeof colorShades === 'object') {
      Object.entries(colorShades).forEach(([shade, value]) => {
        cssVars[`--color-${colorName}-${shade}`] = value;
      });
    } else {
      cssVars[`--color-${colorName}`] = colorShades;
    }
  });

  // Typography variables
  Object.entries(typography.sizes).forEach(([size, value]) => {
    cssVars[`--font-size-${size}`] = value;
  });

  Object.entries(typography.weights).forEach(([weight, value]) => {
    cssVars[`--font-weight-${weight}`] = value;
  });

  // Spacing variables
  Object.entries(spacing).forEach(([space, value]) => {
    cssVars[`--spacing-${space}`] = value;
  });

  // Border radius variables
  Object.entries(borderRadius).forEach(([radius, value]) => {
    cssVars[`--border-radius-${radius}`] = value;
  });

  return cssVars;
};

/**
 * Dark Mode Theme (Blue Dark Variant)
 */
export const darkTheme = {
  ...theme,
  colors: {
    ...colors,
    
    // Override background colors for dark mode
    background: {
      primary: colors.secondary[900],
      secondary: colors.secondary[800],
      tertiary: colors.secondary[700]
    },
    
    // Override text colors for dark mode
    text: {
      primary: colors.secondary[100],
      secondary: colors.secondary[300],
      muted: colors.secondary[400]
    },
    
    // Adjust primary colors for dark mode visibility
    primary: {
      ...colors.primary,
      500: colors.primary[400], // Lighter primary for dark backgrounds
      600: colors.primary[500]
    }
  }
};

/**
 * Theme Utility Functions
 */
export const themeUtils = {
  /**
   * Get color value by path (e.g., 'primary.600')
   * @param {string} colorPath - Color path
   * @returns {string} Color value
   */
  getColor(colorPath) {
    const [colorName, shade] = colorPath.split('.');
    return shade ? colors[colorName]?.[shade] : colors[colorName];
  },

  /**
   * Generate component styles based on theme
   * @param {string} component - Component name
   * @param {string} variant - Component variant
   * @returns {Object} Style object
   */
  getComponentStyle(component, variant = 'default') {
    return components[component]?.[variant] || {};
  },

  /**
   * Create responsive styles
   * @param {Object} styles - Styles object with breakpoint keys
   * @returns {Object} Media query styles
   */
  responsive(styles) {
    const mediaQueries = {};
    
    Object.entries(styles).forEach(([breakpoint, style]) => {
      if (breakpoints[breakpoint]) {
        mediaQueries[`@media (min-width: ${breakpoints[breakpoint]})`] = style;
      } else {
        mediaQueries[breakpoint] = style; // Base styles
      }
    });
    
    return mediaQueries;
  },

  /**
   * Apply theme to CSS-in-JS styles
   * @param {Function} styleFunction - Function that receives theme and returns styles
   * @returns {Object} Computed styles
   */
  withTheme(styleFunction) {
    return styleFunction(theme);
  },

  /**
   * Generate hover styles with theme colors
   * @param {Object} baseStyles - Base styles
   * @param {string} colorPath - Color path for hover state
   * @returns {Object} Styles with hover state
   */
  withHover(baseStyles, colorPath) {
    return {
      ...baseStyles,
      '&:hover': {
        backgroundColor: this.getColor(colorPath),
        transition: `background-color ${animations.durations.normal} ${animations.easings.easeOut}`
      }
    };
  },

  /**
   * Generate focus styles with theme colors
   * @param {Object} baseStyles - Base styles
   * @returns {Object} Styles with focus state
   */
  withFocus(baseStyles) {
    return {
      ...baseStyles,
      '&:focus': {
        outline: 'none',
        borderColor: colors.primary[500],
        boxShadow: `0 0 0 3px ${colors.primary[500]}20`,
        transition: `border-color ${animations.durations.fast}, box-shadow ${animations.durations.fast}`
      }
    };
  }
};

/**
 * Flash Sale Specific Theme
 */
export const flashSaleTheme = {
  colors: {
    background: gradients.primaryLight,
    badge: colors.error[500],
    timer: {
      critical: colors.error[600],
      high: colors.warning[600], 
      medium: colors.warning[500],
      normal: colors.primary[600]
    },
    discount: {
      background: colors.error[500],
      text: '#ffffff'
    }
  },
  
  animations: {
    pulse: {
      animation: 'flash-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      keyframes: `
        @keyframes flash-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `
    },
    
    countdown: {
      animation: 'countdown-tick 1s ease-in-out',
      keyframes: `
        @keyframes countdown-tick {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `
    }
  }
};

/**
 * Admin Dashboard Theme
 */
export const adminTheme = {
  sidebar: {
    width: '260px',
    collapsedWidth: '80px',
    backgroundColor: colors.primary[900],
    textColor: '#ffffff',
    activeItemColor: colors.primary[400],
    hoverItemColor: colors.primary[800]
  },
  
  header: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderColor: colors.secondary[200],
    shadow: shadows.sm
  },
  
  content: {
    backgroundColor: colors.secondary[50],
    padding: spacing[6]
  },
  
  cards: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    shadow: shadows.default,
    padding: spacing[6]
  }
};

/**
 * Mobile Theme Adjustments
 */
export const mobileTheme = {
  // Larger touch targets for mobile
  minTouchTarget: '44px',
  
  // Mobile-specific spacing
  spacing: {
    ...spacing,
    touchPadding: '12px 16px',
    mobilePadding: '16px'
  },
  
  // Mobile navigation
  navigation: {
    height: '56px',
    tabBarHeight: '60px'
  },
  
  // Mobile typography adjustments
  typography: {
    ...typography,
    sizes: {
      ...typography.sizes,
      // Slightly larger for mobile readability
      base: '1.05rem',
      lg: '1.175rem'
    }
  }
};

/**
 * Theme Context Helper
 */
export const createThemeContext = (initialTheme = 'light') => {
  let currentTheme = initialTheme;
  let themeData = currentTheme === 'dark' ? darkTheme : theme;

  return {
    theme: themeData,
    
    toggleTheme() {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      themeData = currentTheme === 'dark' ? darkTheme : theme;
      return themeData;
    },
    
    setTheme(themeName) {
      currentTheme = themeName;
      themeData = themeName === 'dark' ? darkTheme : theme;
      return themeData;
    },
    
    getCurrentTheme() {
      return currentTheme;
    }
  };
};

/**
 * CSS-in-JS Style Generator
 */
export const styleGenerator = {
  /**
   * Generate button styles
   * @param {string} variant - Button variant
   * @param {string} size - Button size
   * @returns {Object} Button styles
   */
  button(variant = 'primary', size = 'md') {
    const baseStyles = {
      fontFamily: typography.fonts.primary,
      fontWeight: typography.weights.medium,
      borderRadius: borderRadius.md,
      transition: `all ${animations.durations.normal} ${animations.easings.easeInOut}`,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid transparent',
      textDecoration: 'none',
      outline: 'none'
    };

    const sizeStyles = {
      sm: {
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.sizes.sm,
        minHeight: '32px'
      },
      md: {
        padding: `${spacing[3]} ${spacing[4]}`,
        fontSize: typography.sizes.base,
        minHeight: '40px'
      },
      lg: {
        padding: `${spacing[4]} ${spacing[6]}`,
        fontSize: typography.sizes.lg,
        minHeight: '48px'
      }
    };

    const variantStyles = components.button[variant] || components.button.primary;

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles,
      
      '&:hover': variantStyles.hover,
      '&:active': variantStyles.active,
      '&:disabled': variantStyles.disabled,
      '&:focus': {
        boxShadow: `0 0 0 3px ${colors.primary[500]}30`
      }
    };
  },

  /**
   * Generate card styles
   * @param {string} variant - Card variant
   * @returns {Object} Card styles
   */
  card(variant = 'default') {
    const cardStyles = components.card[variant] || components.card.default;
    
    return {
      ...cardStyles,
      border: `1px solid ${cardStyles.borderColor}`,
      boxShadow: cardStyles.shadow,
      
      '&:hover': cardStyles.hover
    };
  },

  /**
   * Generate input styles
   * @param {string} state - Input state (default, focus, error)
   * @returns {Object} Input styles
   */
  input(state = 'default') {
    const inputStyles = components.input.default;
    
    const baseStyles = {
      fontFamily: typography.fonts.primary,
      fontSize: typography.sizes.base,
      lineHeight: typography.lineHeights.normal,
      padding: `${spacing[3]} ${spacing[4]}`,
      border: `1px solid ${inputStyles.borderColor}`,
      borderRadius: inputStyles.borderRadius,
      backgroundColor: inputStyles.backgroundColor,
      color: inputStyles.color,
      transition: `border-color ${animations.durations.fast}, box-shadow ${animations.durations.fast}`,
      outline: 'none',
      width: '100%'
    };

    const stateStyles = {
      focus: inputStyles.focus,
      error: inputStyles.error
    };

    return {
      ...baseStyles,
      ...(stateStyles[state] && {
        borderColor: stateStyles[state].borderColor,
        boxShadow: `0 0 0 3px ${stateStyles[state].shadowColor}20`
      })
    };
  }
};

/**
 * Theme CSS Class Generator
 */
export const generateThemeClasses = () => {
  return {
    // Primary colors
    'bg-primary': { backgroundColor: colors.primary[600] },
    'bg-primary-light': { backgroundColor: colors.primary[500] },
    'bg-primary-dark': { backgroundColor: colors.primary[700] },
    'text-primary': { color: colors.primary[600] },
    'border-primary': { borderColor: colors.primary[600] },

    // Status colors
    'bg-success': { backgroundColor: colors.success[500] },
    'bg-warning': { backgroundColor: colors.warning[500] },
    'bg-error': { backgroundColor: colors.error[500] },
    'text-success': { color: colors.success[600] },
    'text-warning': { color: colors.warning[600] },
    'text-error': { color: colors.error[600] },

    // Utility classes
    'shadow-blue': { boxShadow: shadows.blue },
    'shadow-blue-light': { boxShadow: shadows.blueLight },
    'rounded-theme': { borderRadius: borderRadius.lg },
    
    // Interactive states
    'hover-lift': {
      transition: `transform ${animations.durations.normal}`,
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: shadows.lg
      }
    },
    
    'focus-ring': {
      '&:focus': {
        outline: 'none',
        boxShadow: `0 0 0 3px ${colors.primary[500]}30`
      }
    }
  };
};

/**
 * Theme Provider Utilities
 */
export const themeProvider = {
  /**
   * Inject theme CSS variables into document
   */
  injectCSSVariables() {
    const cssVars = generateCSSVariables();
    const root = document.documentElement;
    
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  },

  /**
   * Create theme stylesheet
   * @returns {string} CSS stylesheet string
   */
  createStylesheet() {
    const cssVars = generateCSSVariables();
    
    let css = ':root {\n';
    Object.entries(cssVars).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
    css += '}\n\n';
    
    // Add flash sale animations
    css += flashSaleTheme.animations.pulse.keyframes + '\n';
    css += flashSaleTheme.animations.countdown.keyframes + '\n';
    
    return css;
  },

  /**
   * Apply theme to existing element
   * @param {HTMLElement} element - DOM element
   * @param {Object} styles - Styles to apply
   */
  applyStyles(element, styles) {
    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value;
    });
  }
};

/**
 * Predefined Style Combinations
 */
export const stylePresets = {
  // Page layouts
  pageContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `0 ${spacing[4]}`,
    minHeight: '100vh'
  },

  // Content sections
  section: {
    padding: `${spacing[12]} 0`,
    marginBottom: spacing[8]
  },

  // Flash sale specific styles
  flashSaleBanner: {
    background: gradients.primary,
    color: '#ffffff',
    padding: `${spacing[4]} ${spacing[6]}`,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[6],
    boxShadow: shadows.blue
  },

  // Product card styles
  productCard: {
    backgroundColor: '#ffffff',
    border: `1px solid ${colors.secondary[200]}`,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    boxShadow: shadows.sm,
    transition: `all ${animations.durations.normal}`,
    
    '&:hover': {
      boxShadow: shadows.md,
      borderColor: colors.primary[300],
      transform: 'translateY(-2px)'
    }
  },

  // Form styles
  formContainer: {
    backgroundColor: '#ffffff',
    padding: spacing[8],
    borderRadius: borderRadius.xl,
    boxShadow: shadows.lg,
    border: `1px solid ${colors.secondary[200]}`
  },

  // Admin layout styles
  adminSidebar: {
    backgroundColor: colors.primary[900],
    color: '#ffffff',
    width: adminTheme.sidebar.width,
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    overflowY: 'auto',
    borderRight: `1px solid ${colors.primary[800]}`
  },

  adminContent: {
    marginLeft: adminTheme.sidebar.width,
    padding: spacing[6],
    backgroundColor: colors.secondary[50],
    minHeight: '100vh'
  }
};

/**
 * Export default theme configuration
 */
export default theme;

/**
 * Named exports for easy importing
 */
export {
  theme as blueTheme,
  darkTheme as blueDarkTheme,
  flashSaleTheme,
  adminTheme,
  mobileTheme
};