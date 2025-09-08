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
  Zap
} from 'lucide-react';
import PropTypes from 'prop-types';

// Import the logo image
import logoImage from '../../../assets/images/logo/logo-blue.svg.jpg';

// Import page components
import HomePage from '../../../pages/HomePage/HomePage';
import CategoryPage from '../../../pages/CategoryPage/CategoryPage';
import ProductPage from '../../../pages/ProductPage/ProductPage';
import FlashSalesPage from '../../../pages/FlashSalesPage/FlashSalesPage';
import CartPage from '../../../pages/CartPage/CartPage';
import CheckoutPage from '../../../pages/CheckoutPage/CheckoutPage';
import ProfilePage from '../../../pages/ProfilePage/ProfilePage';
import SearchPage from '../../../pages/SearchPage/SearchPage';

// Import auth pages
import Login from '../../auth/Login/Login';
import Register from '../../auth/Register/Register';

// Import admin pages
import AdminDashboardPage from '../../../pages/AdminPages/AdminDashboardPage';
import ProductManagementPage from '../../../pages/AdminPages/ProductManagementPage';
import OrderManagementPage from '../../../pages/AdminPages/OrderManagementPage';
import FlashSalesManagementPage from '../../../pages/AdminPages/FlashSalesManagementPage';
import HomepageManagementPage from '../../../pages/AdminPages/HomepageManagementPage';

// Import contexts
import { useAuth } from '../../../contexts/AuthContext';
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
  isAuthenticated = false, 
  user = null, 
  onLogin, 
  onLogout, 
  cartItems = [],
  // New props for search coordination
  searchQuery: propSearchQuery = '',
  onSearchQueryChange = null,
  hideSearchOnSearchPage = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Context hooks
  const { 
    user: contextUser, 
    isAuthenticated: contextIsAuth, 
    logout: contextLogout,
    isLoading: authLoading 
  } = useAuth();
  const { 
    cartItems: contextCartItems, 
    getCartCount, 
    clearCart 
  } = useCart();
  const { addNotification } = useNotifications();

  // Page component references for potential dynamic loading
  const pageComponents = {
    home: HomePage,
    categories: CategoryPage,
    products: ProductPage,
    flashSales: FlashSalesPage,
    cart: CartPage,
    checkout: CheckoutPage,
    profile: ProfilePage,
    search: SearchPage,
    login: Login,
    register: Register,
    admin: {
      dashboard: AdminDashboardPage,
      products: ProductManagementPage,
      orders: OrderManagementPage,
      flashSales: FlashSalesManagementPage,
      homepage: HomepageManagementPage,
    }
  };

  // Use context data if available, otherwise fall back to props
  const currentUser = contextUser || user;
  const currentIsAuth = contextIsAuth !== undefined ? contextIsAuth : isAuthenticated;
  const currentCartItems = contextCartItems || cartItems;
  
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
          // Mock search suggestions since searchService doesn't exist
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

  // Optional: Preload page component for faster navigation
  const preloadPage = (pageName) => {
    try {
      const component = pageComponents[pageName];
      if (component && typeof component.preload === 'function') {
        component.preload();
      }
    } catch (error) {
      console.warn('Page preload failed:', error);
    }
  };

  // Enhanced navigation with preloading
  const handleNavigationWithPreload = (path, pageName = null) => {
    if (pageName) {
      preloadPage(pageName);
    }
    handleNavigation(path);
  };

  // Quick access to page components if needed
  const getPageComponent = (pageName) => {
    const keys = pageName.split('.');
    let component = pageComponents;
    for (const key of keys) {
      component = component[key];
      if (!component) return null;
    }
    return component;
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
      
      // If we're already on search page and have callback, update search query
      if (isSearchPage && onSearchQueryChange) {
        onSearchQueryChange(query);
        // Update URL
        navigate(`${PRODUCT_ROUTES.SEARCH}?q=${encodedQuery}`, { replace: true });
      } else {
        // Navigate to search page
        navigate(`${PRODUCT_ROUTES.SEARCH}?q=${encodedQuery}`);
      }
      
      setShowSearchSuggestions(false);
      
      // Only clear search query if we're not on search page
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
    
    // If we're on search page and have callback, notify parent component
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

  const handleAuthAction = async (action) => {
    if (isLoading || authLoading) return;
    
    setIsLoading(true);
    try {
      if (action === 'login') {
        preloadPage('login');
        handleNavigation(PUBLIC_ROUTES.LOGIN);
      } else if (action === 'register') {
        preloadPage('register');
        handleNavigation(PUBLIC_ROUTES.REGISTER);
      } else if (action === 'logout') {
        const logoutFunction = contextLogout || onLogout;
        if (logoutFunction) {
          await logoutFunction();
          addNotification({
            type: 'success',
            message: 'Logged out successfully'
          });
        } else {
          await authService.logout();
          addNotification({
            type: 'success',
            message: 'Logged out successfully'
          });
        }
        // Clear cart on logout if using context
        if (clearCart) {
          clearCart();
        }
        preloadPage('home');
        handleNavigation(PUBLIC_ROUTES.HOME);
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
    preloadPage('cart');
    handleNavigation(SHOPPING_ROUTES.CART);
  };

  // Calculate cart count
  const cartCount = getCartCount ? getCartCount() : 
    currentCartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  // Navigation menu items with proper routes and preload hints
  const navigationItems = [
    { label: 'Home', path: PUBLIC_ROUTES.HOME, icon: null, preload: 'home' },
    { label: 'Categories', path: PRODUCT_ROUTES.CATEGORY.replace('/:slug', ''), icon: Grid3X3, preload: 'categories' },
    { label: 'All Products', path: PRODUCT_ROUTES.PRODUCTS, icon: Package, preload: 'products' },
    { label: 'Flash Sales', path: FLASH_SALES_ROUTES.FLASH_SALES, icon: Zap, preload: 'flashSales' },
    { label: 'About', path: PUBLIC_ROUTES.ABOUT, icon: null },
    { label: 'Contact', path: PUBLIC_ROUTES.CONTACT, icon: null },
  ];

  // User menu items with proper routes and preload hints
  const userMenuItems = [
    { label: 'Profile', path: USER_ROUTES.PROFILE, icon: User, preload: 'profile' },
    { label: 'My Orders', path: USER_ROUTES.ORDERS, icon: ShoppingBag },
    { label: 'Wishlist', path: SHOPPING_ROUTES.WISHLIST, icon: Heart },
  ];

  // Admin menu items with proper routes and preload hints
  const adminMenuItems = [
    { label: 'Admin Dashboard', path: ADMIN_ROUTES.ADMIN_DASHBOARD, icon: Settings, preload: 'admin.dashboard' },
    { label: 'Manage Products', path: ADMIN_ROUTES.ADMIN_PRODUCTS, icon: Package, preload: 'admin.products' },
    { label: 'Manage Orders', path: ADMIN_ROUTES.ADMIN_ORDERS, icon: ShoppingBag, preload: 'admin.orders' },
    { label: 'Flash Sales', path: ADMIN_ROUTES.ADMIN_FLASH_SALES, icon: Zap, preload: 'admin.flashSales' },
    { label: 'Homepage', path: ADMIN_ROUTES.ADMIN_HOMEPAGE, icon: Grid3X3, preload: 'admin.homepage' },
  ];

  // Determine if search should be shown
  const shouldShowSearch = !isAdminRoute && (!isSearchPage || !hideSearchOnSearchPage);

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''} ${isAdminRoute ? 'header--admin' : ''}`}>
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
                    className="header__topbar-link"
                    aria-label="Help center"
                    disabled={isLoading}
                  >
                    Help
                  </button>
                  <button 
                    onClick={() => handleNavigation(PUBLIC_ROUTES.CONTACT)} 
                    className="header__topbar-link"
                    aria-label="Contact us"
                    disabled={isLoading}
                  >
                    Contact
                  </button>
                  {currentUser?.is_admin && (
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
                onClick={() => handleNavigationWithPreload(PUBLIC_ROUTES.HOME, 'home')} 
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
                      placeholder="Search for products, categories..."
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
                      aria-label="Search products and categories"
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
                      {searchSuggestions.map(suggestion => (
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
                          aria-label={`${suggestion.title} ${suggestion.type}`}
                          disabled={isLoading}
                        >
                          <div className="suggestion-icon">
                            {suggestion.type === 'product' ? 
                              <ShoppingBag className="icon" style={{ width: '16px', height: '16px', color: '#666' }} aria-hidden="true" /> : 
                              suggestion.type === 'flash_sale' ?
                              <Zap className="icon" style={{ width: '16px', height: '16px', color: '#666' }} aria-hidden="true" /> :
                              <Grid3X3 className="icon" style={{ width: '16px', height: '16px', color: '#666' }} aria-hidden="true" />
                            }
                          </div>
                          <div className="suggestion-content">
                            <span className="suggestion-title" style={{ color: '#333', fontSize: '14px', fontWeight: '500' }}>
                              {suggestion.title}
                            </span>
                            <span className="suggestion-meta" style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '2px' }}>
                              {suggestion.type === 'product' ? 
                                `in ${suggestion.category}` : 
                                suggestion.type === 'flash_sale' ?
                                `Flash Sale - ${suggestion.discount}% off` :
                                `${suggestion.count} products`
                              }
                            </span>
                          </div>
                        </button>
                      ))}
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
                      }} aria-hidden="true"></div>
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
                          <span>
                            {currentUser.first_name 
                              ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() 
                              : currentUser.username || currentUser.email?.split('@')[0] || 'Account'
                            }
                          </span>
                          <ChevronDown className={`chevron-icon ${showUserDropdown ? 'rotated' : ''}`} aria-hidden="true" />
                        </button>
                        {showUserDropdown && (
                          <div className="user-dropdown" role="menu">
                            <div className="user-dropdown-header">
                              <div className="user-info">
                                <span className="user-name">
                                  {currentUser.first_name 
                                    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
                                    : currentUser.username || 'User'
                                  }
                                </span>
                                <span className="user-email">{currentUser.email}</span>
                                {currentUser.is_admin && <span className="admin-badge">Admin</span>}
                              </div>
                            </div>
                            
                            {userMenuItems.map(item => (
                              <button 
                                key={item.path}
                                onClick={() => handleNavigationWithPreload(item.path, item.preload)} 
                                className="dropdown-item"
                                role="menuitem"
                                disabled={isLoading}
                              >
                                <item.icon className="icon" aria-hidden="true" />
                                {item.label}
                              </button>
                            ))}
                            
                            {currentUser.is_admin && (
                              <>
                                <div className="dropdown-divider" role="separator"></div>
                                {adminMenuItems.slice(0, 1).map(item => (
                                  <button 
                                    key={item.path}
                                    onClick={() => handleNavigationWithPreload(item.path, item.preload)} 
                                    className="dropdown-item"
                                    role="menuitem"
                                    disabled={isLoading}
                                  >
                                    <item.icon className="icon" aria-hidden="true" />
                                    {item.label}
                                  </button>
                                ))}
                              </>
                            )}
                            
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
                  placeholder="Search products..."
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
                  aria-label="Search products"
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
                    <span className="user-name">
                      {currentUser.first_name 
                        ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
                        : currentUser.username || 'User'
                      }
                    </span>
                    <span className="user-status">
                      {currentUser.is_admin ? 'Admin User' : 'Logged in'}
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

            {/* Mobile Navigation Links */}
            <div className="mobile-nav-links">
              {navigationItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <button 
                    key={item.path}
                    onClick={() => handleNavigationWithPreload(item.path, item.preload)} 
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
                {userMenuItems.map(item => (
                  <button 
                    key={item.path}
                    onClick={() => handleNavigationWithPreload(item.path, item.preload)} 
                    className="mobile-menu-item"
                    disabled={isLoading}
                  >
                    <item.icon className="icon" aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
                
                {currentUser.is_admin && (
                  <>
                    <div className="mobile-menu-divider" role="separator"></div>
                    {adminMenuItems.map(item => (
                      <button 
                        key={item.path}
                        onClick={() => handleNavigationWithPreload(item.path, item.preload)} 
                        className="mobile-menu-item admin-item"
                        disabled={isLoading}
                      >
                        <item.icon className="icon" aria-hidden="true" />
                        {item.label}
                      </button>
                    ))}
                  </>
                )}
                
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

            {/* Mobile Contact */}
            <div className="mobile-contact">
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
  // New prop types for search coordination
  searchQuery: PropTypes.string,
  onSearchQueryChange: PropTypes.func,
  hideSearchOnSearchPage: PropTypes.bool,
};

export default Header;