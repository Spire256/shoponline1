import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  LogIn, 
  UserPlus, 
  ShoppingBag, 
  Truck, 
  Phone, 
  MessageCircle,
  ChevronDown,
  Settings,
  LogOut,
  Grid3X3,
  Heart,
  Package,
  Zap,
  HelpCircle,
  Mail
} from 'lucide-react';
import PropTypes from 'prop-types';

// Import the logo image
import logoImage from '../../../assets/images/logo/logo-blue.svg.jpg';

// FIXED: Import from the custom hook, not directly from context
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../../../contexts/CartContext';
import { useNotifications } from '../../../contexts/NotificationContext';

// Import services
import { authService } from '../../../services/auth/authService';

// Import utilities
import { formatPhoneNumber } from '../../../utils/helpers/formatters';
import { 
  PUBLIC_ROUTES, 
  PRODUCT_ROUTES, 
  FLASH_SALES_ROUTES, 
  SHOPPING_ROUTES, 
  USER_ROUTES, 
  ADMIN_ROUTES, 
  API_ROUTE_HELPERS 
} from '../../../utils/constants/routes';
import { APP_CONFIG } from '../../../utils/constants/app';

// Import styles
import './Header.css';

// Simple search query validation function
const isValidSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return false;
  const trimmedQuery = query.trim();
  return trimmedQuery.length >= 1 && trimmedQuery.length <= 100;
};

const Header = ({ 
  // Legacy props for backward compatibility - but we'll use context instead
  isAuthenticated: propIsAuthenticated = false, 
  user: propUser = null, 
  onLogin: propOnLogin, 
  onLogout: propOnLogout, 
  cartItems: propCartItems = [],
  // New props for search coordination
  searchQuery: propSearchQuery = '',
  onSearchQueryChange = null,
  hideSearchOnSearchPage = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // FIXED: Use the enhanced useAuth hook properly
  const { 
    user,
    isAuthenticated,
    isLoading: authLoading,
    isAdmin,
    isClient,
    canAccessAdmin,
    logout: logoutUser,
    getUserDisplayName,
    validateSession,
    ensureValidToken
  } = useAuth();
  
  const { 
    cartItems: contextCartItems, 
    getCartCount, 
    clearCart 
  } = useCart();
  const { addNotification } = useNotifications();

  // Use context data (preferred) or fall back to props for backward compatibility
  const currentUser = user || propUser;
  const currentIsAuth = isAuthenticated !== undefined ? isAuthenticated : propIsAuthenticated;
  const currentCartItems = contextCartItems || propCartItems;
  
  // FIXED: Use the auth hook's admin detection instead of custom logic
  const isAdminUser = canAccessAdmin();
  const isClientUser = isClient();
  
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState(propSearchQuery || '');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const userDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Check if we're on the search page
  const isSearchPage = location.pathname === '/search' || location.pathname.startsWith('/search');
  
  // Check if we're on help or contact pages
  const isHelpPage = location.pathname === '/help' || location.pathname.startsWith('/help');
  const isContactPage = location.pathname === '/contact' || location.pathname.startsWith('/contact');

  // FIXED: Add session validation on component mount and route changes
  useEffect(() => {
    const validateCurrentSession = async () => {
      if (currentIsAuth && currentUser) {
        try {
          const result = await validateSession();
          if (!result.valid) {
            console.warn('Session validation failed:', result.error);
            // Don't show notification for expired sessions, just let the auth system handle it
          }
        } catch (error) {
          console.error('Session validation error:', error);
        }
      }
    };

    validateCurrentSession();
  }, [location.pathname, currentIsAuth, currentUser, validateSession]);

  // FIXED: Add token refresh on admin route access
  useEffect(() => {
    const checkAdminAccess = async () => {
      const isAdminRoute = location.pathname.startsWith('/admin');
      
      if (isAdminRoute && currentIsAuth) {
        try {
          // Ensure we have a valid token before accessing admin routes
          const tokenResult = await ensureValidToken();
          if (!tokenResult.success) {
            console.warn('Token validation failed for admin route');
            addNotification({
              type: 'warning',
              message: 'Please log in again to access admin features'
            });
            navigate(PUBLIC_ROUTES.LOGIN, { 
              state: { from: location.pathname },
              replace: true 
            });
            return;
          }

          // Double-check admin permissions
          if (!canAccessAdmin()) {
            addNotification({
              type: 'error',
              message: 'Admin access required'
            });
            navigate(PUBLIC_ROUTES.HOME, { replace: true });
          }
        } catch (error) {
          console.error('Admin access check failed:', error);
          addNotification({
            type: 'error',
            message: 'Authentication error. Please log in again.'
          });
          navigate(PUBLIC_ROUTES.LOGIN, { 
            state: { from: location.pathname },
            replace: true 
          });
        }
      }
    };

    checkAdminAccess();
  }, [location.pathname, currentIsAuth, canAccessAdmin, ensureValidToken, navigate, addNotification]);

  // Update local search query when prop changes
  useEffect(() => {
    if (propSearchQuery !== undefined && propSearchQuery !== searchQuery) {
      setSearchQuery(propSearchQuery);
    }
  }, [propSearchQuery]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input changes with mock suggestions
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 1) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        try {
          // Mock search suggestions - enhanced to include help content
          const mockSuggestions = [
            {
              id: 1,
              title: `Products matching "${searchQuery}"`,
              type: 'product',
              category: 'Electronics',
              slug: 'products-matching'
            },
            {
              id: 2,
              title: `Categories containing "${searchQuery}"`,
              type: 'category',
              count: 5,
              slug: 'categories-containing'
            }
          ];

          // Add help suggestions if query matches help-related terms
          const helpTerms = ['help', 'support', 'faq', 'question', 'order', 'payment', 'delivery', 'return'];
          const contactTerms = ['contact', 'phone', 'call', 'email', 'support'];
          
          if (helpTerms.some(term => searchQuery.toLowerCase().includes(term))) {
            mockSuggestions.push({
              id: 3,
              title: `Help articles about "${searchQuery}"`,
              type: 'help',
              category: 'Help Center',
              slug: 'help-articles'
            });
          }

          if (contactTerms.some(term => searchQuery.toLowerCase().includes(term))) {
            mockSuggestions.push({
              id: 4,
              title: `Contact support for "${searchQuery}"`,
              type: 'contact',
              category: 'Support',
              slug: 'contact-support'
            });
          }

          setSearchSuggestions(mockSuggestions.slice(0, 6));
          setShowSearchSuggestions(true);
        } catch (error) {
          console.error('Search suggestions error:', error);
          setSearchSuggestions([]);
          setShowSearchSuggestions(false);
        } finally {
          setSearchLoading(false);
        }
      }, 300);
    } else {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      setSearchLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Check if current route is admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Navigation functions
  const handleNavigation = (path) => {
    setIsMenuOpen(false);
    setShowUserDropdown(false);
    setShowSearchSuggestions(false);
    navigate(path);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    if (!query) {
      addNotification({
        type: 'warning',
        message: 'Please enter a search term'
      });
      return;
    }

    if (!isValidSearchQuery(query)) {
      addNotification({
        type: 'error',
        message: 'Invalid search query'
      });
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(query.replace(/[<>]/g, ''));
      
      if (isSearchPage && onSearchQueryChange) {
        onSearchQueryChange(query);
        navigate(`${PRODUCT_ROUTES.SEARCH}?q=${encodedQuery}`, { replace: true });
      } else {
        navigate(`${PRODUCT_ROUTES.SEARCH}?q=${encodedQuery}`);
      }
      
      setShowSearchSuggestions(false);
      
      if (!isSearchPage) {
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Search navigation error:', error);
      addNotification({
        type: 'error',
        message: 'Search failed. Please try again.'
      });
    }
  };

  const handleSearchInputChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    
    if (isSearchPage && onSearchQueryChange) {
      onSearchQueryChange(newQuery);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    try {
      if (suggestion.type === 'product') {
        handleNavigation(`${PRODUCT_ROUTES.PRODUCTS}/${suggestion.slug}`);
      } else if (suggestion.type === 'category') {
        handleNavigation(`${PRODUCT_ROUTES.CATEGORY.replace(':slug', suggestion.slug)}`);
      } else if (suggestion.type === 'flash_sale') {
        handleNavigation(`${FLASH_SALES_ROUTES.FLASH_SALES}/${suggestion.slug}`);
      } else if (suggestion.type === 'help') {
        // Navigate to help page with search query
        handleNavigation(`/help?search=${encodeURIComponent(searchQuery)}`);
      } else if (suggestion.type === 'contact') {
        // Navigate to contact page
        handleNavigation('/contact');
      }
    } catch (error) {
      console.error('Suggestion navigation error:', error);
      addNotification({
        type: 'error',
        message: 'Navigation failed. Please try again.'
      });
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(prev => !prev);
  };

  // FIXED: Enhanced auth action handler with proper auth hook integration
  const handleAuthAction = async (action) => {
    if (isLoading || authLoading) return;
    
    setIsLoading(true);
    try {
      if (action === 'login') {
        handleNavigation(PUBLIC_ROUTES.LOGIN);
      } else if (action === 'register') {
        handleNavigation(PUBLIC_ROUTES.REGISTER);
      } else if (action === 'logout') {
        // Use the auth hook's logout method
        const result = await logoutUser();
        
        if (result.success) {
          addNotification({
            type: 'success',
            message: 'Logged out successfully'
          });
          
          // Clear cart on logout
          if (clearCart) {
            clearCart();
          }
          
          handleNavigation(PUBLIC_ROUTES.HOME);
        } else {
          addNotification({
            type: 'error',
            message: result.error || 'Logout failed'
          });
        }
      }
    } catch (error) {
      console.error('Auth action failed:', error);
      addNotification({
        type: 'error',
        message: action === 'logout' ? 'Logout failed' : 'Authentication failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactAction = (type) => {
    try {
      if (type === 'phone') {
        window.location.href = `tel:${APP_CONFIG.CONTACT.PHONE}`;
      } else if (type === 'whatsapp') {
        const whatsappUrl = `https://wa.me/${APP_CONFIG.CONTACT.WHATSAPP}?text=${encodeURIComponent(APP_CONFIG.CONTACT.WHATSAPP_MESSAGE)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Contact action error:', error);
      addNotification({
        type: 'error',
        message: 'Unable to open contact method'
      });
    }
  };

  const handleCartClick = () => {
    handleNavigation(SHOPPING_ROUTES.CART);
  };

  // Calculate cart count
  const cartCount = getCartCount ? getCartCount() : 
    currentCartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  // Navigation menu items - Enhanced with better help/contact integration
  const navigationItems = [
    { label: 'Home', path: PUBLIC_ROUTES.HOME, icon: null },
    { label: 'Categories', path: PRODUCT_ROUTES.CATEGORY.replace('/:slug', ''), icon: Grid3X3 },
    { label: 'All Products', path: PRODUCT_ROUTES.PRODUCTS, icon: Package },
    { label: 'Flash Sales', path: FLASH_SALES_ROUTES.FLASH_SALES, icon: Zap },
    { label: 'Help Center', path: '/help', icon: HelpCircle }, // Direct path for help
    { label: 'Contact Us', path: '/contact', icon: Mail }, // Direct path for contact
    { label: 'About', path: PUBLIC_ROUTES.ABOUT, icon: null },
  ];

  // Client user menu items
  const clientUserMenuItems = [
    { label: 'Profile', path: USER_ROUTES.PROFILE, icon: User },
    { label: 'My Orders', path: USER_ROUTES.ORDERS, icon: ShoppingBag },
    { label: 'Wishlist', path: SHOPPING_ROUTES.WISHLIST, icon: Heart },
    { label: 'Help Center', path: '/help', icon: HelpCircle }, // Added help to user menu
  ];

  // Admin user menu items
  const adminUserMenuItems = [
    { label: 'Admin Dashboard', path: ADMIN_ROUTES.ADMIN_DASHBOARD, icon: Settings },
    { label: 'Manage Products', path: ADMIN_ROUTES.ADMIN_PRODUCTS, icon: Package },
    { label: 'Manage Orders', path: ADMIN_ROUTES.ADMIN_ORDERS, icon: ShoppingBag },
    { label: 'Flash Sales', path: ADMIN_ROUTES.ADMIN_FLASH_SALES, icon: Zap },
    { label: 'Homepage', path: ADMIN_ROUTES.ADMIN_HOMEPAGE, icon: Grid3X3 },
  ];

  // Get appropriate menu items based on user type
  const getUserMenuItems = () => {
    if (isAdminUser) {
      return adminUserMenuItems;
    }
    return clientUserMenuItems;
  };

  // Get user display name using the auth hook
  const displayName = getUserDisplayName();

  // Determine if search should be shown
  const shouldShowSearch = !isAdminRoute && (!isSearchPage || !hideSearchOnSearchPage);

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Header Debug:', {
      currentUser,
      currentIsAuth,
      isAdminUser,
      isClientUser,
      canAccessAdmin: canAccessAdmin(),
      isAdminRoute,
      isHelpPage,
      isContactPage,
      path: location.pathname
    });
  }

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''} ${isAdminRoute ? 'header--admin' : ''} ${isHelpPage ? 'header--help' : ''} ${isContactPage ? 'header--contact' : ''}`}>
      {/* Top Bar */}
      {!isAdminRoute && (
        <div className="header__topbar">
          <div className="container">
            <div className="header__topbar-content">
              <div className="header__topbar-left">
                <div className="delivery-info">
                  <Truck className="icon" aria-hidden="true" />
                  <span>{APP_CONFIG.DELIVERY.FREE_DELIVERY_MESSAGE}</span>
                </div>
              </div>
              <div className="header__topbar-right">
                <div className="header__topbar-links">
                  <button 
                    onClick={() => handleNavigation('/help')} 
                    className={`header__topbar-link ${isHelpPage ? 'active' : ''}`}
                    aria-label="Help center"
                    aria-current={isHelpPage ? 'page' : undefined}
                    disabled={isLoading}
                  >
                    <HelpCircle className="icon" aria-hidden="true" />
                    Help
                  </button>
                  <button 
                    onClick={() => handleNavigation('/contact')} 
                    className={`header__topbar-link ${isContactPage ? 'active' : ''}`}
                    aria-label="Contact us"
                    aria-current={isContactPage ? 'page' : undefined}
                    disabled={isLoading}
                  >
                    <Mail className="icon" aria-hidden="true" />
                    Contact
                  </button>
                  {isAdminUser && (
                    <button 
                      onClick={() => handleNavigation(ADMIN_ROUTES.ADMIN_DASHBOARD)} 
                      className="header__topbar-link header__topbar-link--admin"
                      aria-label="Admin panel"
                      disabled={isLoading}
                    >
                      Admin Panel
                    </button>
                  )}
                </div>
                <div className="contact-links">
                  <button 
                    onClick={() => handleContactAction('phone')} 
                    className="contact-link" 
                    aria-label="Call us"
                    disabled={isLoading}
                    title={formatPhoneNumber(APP_CONFIG.CONTACT.PHONE)}
                  >
                    <Phone className="icon" aria-hidden="true" />
                  </button>
                  <button 
                    onClick={() => handleContactAction('whatsapp')} 
                    className="contact-link whatsapp" 
                    aria-label="WhatsApp support"
                    disabled={isLoading}
                  >
                    <MessageCircle className="icon" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="header__main">
        <div className="container">
          <div className="header__main-content">
            <div className="header__logo">
              <button 
                onClick={() => handleNavigation(PUBLIC_ROUTES.HOME)} 
                className="header__logo-link"
                aria-label="ShopOnline Uganda homepage"
                disabled={isLoading}
              >
                <img 
                  src={logoImage} 
                  alt={`${APP_CONFIG.APP_NAME} Logo`}
                  className="header__logo-image"
                />
                <div className="header__logo-text">
                  <span className="header__logo-main">{APP_CONFIG.APP_NAME}</span>
                  <span className="header__logo-sub">{APP_CONFIG.COUNTRY}</span>
                </div>
              </button>
            </div>

            {shouldShowSearch && (
              <div className="header__search desktop-only" ref={searchRef}>
                <div className="search-container">
                  <form onSubmit={handleSearch} className="search-input-container">
                    <input
                      type="text"
                      placeholder="Search for products, categories, help..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
                      className="search-input"
                      style={{
                        color: '#333',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        outline: 'none',
                        caretColor: '#007bff'
                      }}
                      autoComplete="off"
                      aria-label="Search products, categories, and help"
                      disabled={isLoading || searchLoading}
                    />
                    <button 
                      type="submit" 
                      className="search-btn"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#007bff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label="Search"
                      disabled={isLoading || searchLoading}
                    >
                      <Search className="icon" style={{ color: '#fff', width: '16px', height: '16px' }} aria-hidden="true" />
                    </button>
                  </form>
                  
                  {/* Enhanced search suggestions with help/contact integration */}
                  {showSearchSuggestions && searchSuggestions.length > 0 && !isSearchPage && (
                    <div className="search-suggestions" role="listbox" style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      right: '0',
                      backgroundColor: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {searchSuggestions.map(suggestion => {
                        // Enhanced icon mapping
                        const getIcon = (type) => {
                          switch (type) {
                            case 'help':
                              return <HelpCircle className="icon" style={{ width: '16px', height: '16px', color: '#007bff' }} />;
                            case 'contact':
                              return <Mail className="icon" style={{ width: '16px', height: '16px', color: '#28a745' }} />;
                            case 'product':
                              return <ShoppingBag className="icon" style={{ width: '16px', height: '16px', color: '#666' }} />;
                            default:
                              return <Grid3X3 className="icon" style={{ width: '16px', height: '16px', color: '#666' }} />;
                          }
                        };

                        return (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="search-suggestion-item"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              borderBottom: '1px solid #f0f0f0'
                            }}
                            role="option"
                            aria-selected="false"
                            disabled={isLoading}
                          >
                            <div className="suggestion-icon">
                              {getIcon(suggestion.type)}
                            </div>
                            <div className="suggestion-content">
                              <span className="suggestion-title" style={{ color: '#333', fontSize: '14px', fontWeight: '500' }}>
                                {suggestion.title}
                              </span>
                              <span className="suggestion-meta" style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '2px' }}>
                                {suggestion.type === 'product' ? 
                                  `in ${suggestion.category}` : 
                                  suggestion.type === 'help' ?
                                  'Help & Support' :
                                  suggestion.type === 'contact' ?
                                  'Customer Support' :
                                  `${suggestion.count} products`
                                }
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {searchLoading && (
                    <div className="search-loading" style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      right: '0',
                      backgroundColor: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      zIndex: 1000
                    }}>
                      <div className="loading-spinner" style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #f0f0f0',
                        borderTop: '2px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span style={{ color: '#666', fontSize: '14px' }}>Searching...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="header__actions">
              {!isAdminRoute && (
                <>
                  <div className="auth-links desktop-only">
                    {currentIsAuth && currentUser ? (
                      <div className="user-menu" ref={userDropdownRef}>
                        <button 
                          onClick={toggleUserDropdown}
                          className="user-menu-trigger"
                          aria-expanded={showUserDropdown}
                          aria-label="User menu"
                          disabled={isLoading}
                        >
                          <User className="icon" aria-hidden="true" />
                          <span>{displayName || 'Account'}</span>
                          <ChevronDown className={`chevron-icon ${showUserDropdown ? 'rotated' : ''}`} aria-hidden="true" />
                        </button>
                        {showUserDropdown && (
                          <div className="user-dropdown" role="menu">
                            <div className="user-dropdown-header">
                              <div className="user-info">
                                <span className="user-name">{displayName}</span>
                                <span className="user-email">{currentUser.email}</span>
                                {isAdminUser && <span className="admin-badge">Admin</span>}
                                {isClientUser && <span className="client-badge">Client</span>}
                              </div>
                            </div>
                            
                            {getUserMenuItems().map(item => (
                              <button 
                                key={item.path}
                                onClick={() => handleNavigation(item.path)} 
                                className="dropdown-item"
                                role="menuitem"
                                disabled={isLoading}
                              >
                                <item.icon className="icon" aria-hidden="true" />
                                {item.label}
                              </button>
                            ))}
                            
                            <button 
                              onClick={() => handleAuthAction('logout')} 
                              className="dropdown-item logout-btn"
                              role="menuitem"
                              disabled={isLoading}
                            >
                              <LogOut className="icon" aria-hidden="true" />
                              {isLoading ? 'Logging out...' : 'Logout'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleAuthAction('login')} 
                          className="auth-btn login-btn"
                          aria-label="Sign in"
                          disabled={isLoading}
                        >
                          <LogIn className="icon" aria-hidden="true" />
                          <span>{isLoading ? 'Loading...' : 'Sign In'}</span>
                        </button>
                        <button 
                          onClick={() => handleAuthAction('register')} 
                          className="auth-btn register-btn"
                          aria-label="Sign up"
                          disabled={isLoading}
                        >
                          <UserPlus className="icon" aria-hidden="true" />
                          <span>{isLoading ? 'Loading...' : 'Sign Up'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button 
                    onClick={handleCartClick} 
                    className="header__cart-button"
                    aria-label={`Cart with ${cartCount} items`}
                    disabled={isLoading}
                  >
                    <div className="header__cart-icon-wrapper">
                      <ShoppingCart className="header__cart-icon" aria-hidden="true" />
                      {cartCount > 0 && (
                        <span className="header__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                      )}
                    </div>
                    <span className="header__cart-text desktop-only">Cart</span>
                  </button>
                </>
              )}

              {isAdminRoute && currentIsAuth && currentUser && (
                <div className="admin-nav desktop-only">
                  <button 
                    onClick={() => handleNavigation(PUBLIC_ROUTES.HOME)} 
                    className="admin-nav-btn"
                    aria-label="View store"
                    disabled={isLoading}
                  >
                    <ShoppingBag className="icon" aria-hidden="true" />
                    <span>View Store</span>
                  </button>
                  <button 
                    onClick={() => handleAuthAction('logout')} 
                    className="admin-nav-btn logout"
                    aria-label="Logout"
                    disabled={isLoading}
                  >
                    <LogOut className="icon" aria-hidden="true" />
                    <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              )}

              {!isAdminRoute && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="header__mobile-toggle mobile-only"
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMenuOpen}
                  disabled={isLoading}
                >
                  {isMenuOpen ? <X className="icon" aria-hidden="true" /> : <Menu className="icon" aria-hidden="true" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {shouldShowSearch && (
        <div className="header__mobile-search mobile-only">
          <div className="container">
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-input-container" style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search products, help..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="search-input"
                  style={{
                    color: '#333',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    padding: '12px 45px 12px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                    caretColor: '#007bff'
                  }}
                  aria-label="Search products and help"
                  disabled={isLoading || searchLoading}
                />
                <button 
                  type="submit" 
                  className="search-btn"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#007bff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label="Search"
                  disabled={isLoading || searchLoading}
                >
                  <Search className="icon" style={{ color: '#fff', width: '16px', height: '16px' }} aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && !isAdminRoute && (
        <div className="mobile-menu mobile-only">
          <div 
            className="mobile-menu-overlay" 
            onClick={() => setIsMenuOpen(false)} 
            role="button" 
            tabIndex="0"
            aria-label="Close menu"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsMenuOpen(false);
              }
            }}
          />
          <div className="mobile-menu-content">
            <div className="mobile-menu-header">
              <div className="mobile-logo">
                <img 
                  src={logoImage} 
                  alt={`${APP_CONFIG.APP_NAME} Logo`}
                  className="mobile-logo-image"
                />
                <span>{APP_CONFIG.APP_NAME} {APP_CONFIG.COUNTRY}</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="close-btn"
                aria-label="Close menu"
                disabled={isLoading}
              >
                <X className="icon" aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Auth Section */}
            <div className="mobile-auth">
              {currentIsAuth && currentUser ? (
                <div className="mobile-user-info">
                  <div className="user-avatar">
                    <User className="icon" aria-hidden="true" />
                  </div>
                  <div className="user-details">
                    <span className="user-name">{displayName}</span>
                    <span className="user-status">
                      {isAdminUser ? 'Admin User' : isClientUser ? 'Client User' : 'Logged in'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <button 
                    onClick={() => handleAuthAction('login')} 
                    className="mobile-auth-btn login"
                    aria-label="Sign in"
                    disabled={isLoading}
                  >
                    <LogIn className="icon" aria-hidden="true" />
                    <span>{isLoading ? 'Loading...' : 'Sign In'}</span>
                  </button>
                  <button 
                    onClick={() => handleAuthAction('register')} 
                    className="mobile-auth-btn register"
                    aria-label="Sign up"
                    disabled={isLoading}
                  >
                    <UserPlus className="icon" aria-hidden="true" />
                    <span>{isLoading ? 'Loading...' : 'Sign Up'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Navigation Links - Enhanced with active states */}
            <div className="mobile-nav-links">
              {navigationItems.map(item => {
                const isActive = location.pathname === item.path || 
                  (item.path === '/help' && isHelpPage) ||
                  (item.path === '/contact' && isContactPage);
                return (
                  <button 
                    key={item.path}
                    onClick={() => handleNavigation(item.path)} 
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    disabled={isLoading}
                  >
                    {item.icon ? <item.icon className="icon" aria-hidden="true" /> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile User Menu */}
            {currentIsAuth && currentUser && (
              <div className="mobile-user-menu">
                {getUserMenuItems().map(item => (
                  <button 
                    key={item.path}
                    onClick={() => handleNavigation(item.path)} 
                    className="mobile-menu-item"
                    disabled={isLoading}
                  >
                    <item.icon className="icon" aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
                
                <button 
                  onClick={() => handleAuthAction('logout')} 
                  className="mobile-menu-item logout"
                  disabled={isLoading}
                >
                  <LogOut className="icon" aria-hidden="true" />
                  {isLoading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}

            {/* Mobile Contact - Enhanced with help/contact context */}
            <div className="mobile-contact">
              <div className="mobile-contact-header">
                <h4>Need Help?</h4>
              </div>
              <button 
                onClick={() => handleNavigation('/help')} 
                className={`mobile-contact-item ${isHelpPage ? 'active' : ''}`}
                aria-label="Help center"
                disabled={isLoading}
              >
                <HelpCircle className="icon" aria-hidden="true" />
                <span>Visit Help Center</span>
              </button>
              <button 
                onClick={() => handleContactAction('phone')} 
                className="mobile-contact-item"
                aria-label="Call support"
                disabled={isLoading}
              >
                <Phone className="icon" aria-hidden="true" />
                <span>{formatPhoneNumber(APP_CONFIG.CONTACT.PHONE)}</span>
              </button>
              <button 
                onClick={() => handleContactAction('whatsapp')} 
                className="mobile-contact-item"
                aria-label="WhatsApp support"
                disabled={isLoading}
              >
                <MessageCircle className="icon" aria-hidden="true" />
                <span>WhatsApp Support</span>
              </button>
              <button 
                onClick={() => handleNavigation('/contact')} 
                className={`mobile-contact-item ${isContactPage ? 'active' : ''}`}
                aria-label="Contact page"
                disabled={isLoading}
              >
                <Mail className="icon" aria-hidden="true" />
                <span>Contact Form</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact - Enhanced for help/contact pages */}
      {(isHelpPage || isContactPage) && (
        <div className="help-contact-banner">
          <div className="container">
            <div className="help-contact-content">
              <div className="help-contact-info">
                <HelpCircle className="icon" aria-hidden="true" />
                <span>Need immediate assistance?</span>
              </div>
              <div className="help-contact-actions">
                <button 
                  onClick={() => handleContactAction('phone')} 
                  className="help-contact-btn phone"
                  aria-label="Call support now"
                  disabled={isLoading}
                >
                  <Phone className="icon" aria-hidden="true" />
                  <span>Call Now</span>
                </button>
                <button 
                  onClick={() => handleContactAction('whatsapp')} 
                  className="help-contact-btn whatsapp"
                  aria-label="WhatsApp support"
                  disabled={isLoading}
                >
                  <MessageCircle className="icon" aria-hidden="true" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add keyframe animation for loading spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Enhanced styles for help/contact integration */
        .header--help .header__topbar-link:first-child,
        .header--contact .header__topbar-link:nth-child(2) {
          background-color: rgba(0, 123, 255, 0.1);
          color: #007bff;
          font-weight: 600;
        }
        
        .help-contact-banner {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .help-contact-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        
        .help-contact-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .help-contact-actions {
          display: flex;
          gap: 12px;
        }
        
        .help-contact-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .help-contact-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .help-contact-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .help-contact-btn.whatsapp:hover:not(:disabled) {
          background: rgba(37, 211, 102, 0.2);
          border-color: rgba(37, 211, 102, 0.3);
        }
        
        .mobile-contact-header {
          padding: 12px 0 8px;
          border-bottom: 1px solid #eee;
          margin-bottom: 8px;
        }
        
        .mobile-contact-header h4 {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .mobile-contact-item.active {
          background-color: rgba(0, 123, 255, 0.1);
          color: #007bff;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .help-contact-content {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }
          
          .help-contact-actions {
            width: 100%;
            justify-content: center;
          }
          
          .help-contact-btn {
            flex: 1;
            max-width: 120px;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
};

Header.propTypes = {
  isAuthenticated: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string,
    email: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    is_admin: PropTypes.bool,
  }),
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      quantity: PropTypes.number,
    })  
  ),
  onLogin: PropTypes.func,
  onLogout: PropTypes.func,
  searchQuery: PropTypes.string,
  onSearchQueryChange: PropTypes.func,
  hideSearchOnSearchPage: PropTypes.bool,
};

export default Header;