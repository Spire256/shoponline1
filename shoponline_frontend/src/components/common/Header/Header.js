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

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState(() => {
    // Initialize cartItems from localStorage or use mock data
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [
      { id: 1, title: 'iPhone 15 Pro Max', quantity: 1 },
      { id: 2, title: 'Samsung Galaxy S24', quantity: 1 }
    ];
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({ 
    name: 'John Doe', 
    email: 'john@gmail.com', 
    is_admin: false 
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  const userDropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Mock search suggestions
  const mockSuggestions = [
    { id: 1, title: 'iPhone 15 Pro Max', type: 'product', category: 'Electronics', slug: 'iphone-15-pro-max' },
    { id: 2, title: 'Samsung Galaxy S24', type: 'product', category: 'Electronics', slug: 'samsung-galaxy-s24' },
    { id: 3, title: 'MacBook Air M2', type: 'product', category: 'Electronics', slug: 'macbook-air-m2' },
    { id: 4, title: 'Electronics', type: 'category', count: 245, slug: 'electronics' },
    { id: 5, title: 'Fashion & Style', type: 'category', count: 186, slug: 'fashion-style' },
    { id: 6, title: 'Nike Air Max', type: 'product', category: 'Sports', slug: 'nike-air-max' },
    { id: 7, title: 'Home & Garden', type: 'category', count: 158, slug: 'home-garden' },
    { id: 8, title: 'Sports & Fitness', type: 'category', count: 92, slug: 'sports-fitness' },
  ];

  // Sync cartItems with localStorage
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

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

  // Handle search input changes
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const filtered = mockSuggestions.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchSuggestions(filtered.slice(0, 6));
      setShowSearchSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const encodedQuery = encodeURIComponent(searchQuery.trim().replace(/[<>]/g, ''));
      navigate(`/search?q=${encodedQuery}`);
      setShowSearchSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      handleNavigation(`/products/${suggestion.slug}`);
    } else if (suggestion.type === 'category') {
      handleNavigation(`/categories/${suggestion.slug}`);
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(prev => !prev);
  };

  const handleAuthAction = (action) => {
    if (action === 'login') {
      handleNavigation('/auth/login');
    } else if (action === 'register') {
      handleNavigation('/auth/register');
    } else if (action === 'logout') {
      handleLogout();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser({ name: 'John Doe', email: 'john@gmail.com', is_admin: false });
    setCartItems([]); // Clear cart on logout
    handleNavigation('/');
  };

  const handleContactAction = (type) => {
    if (type === 'phone') {
      window.location.href = 'tel:+256700123456';
    } else if (type === 'whatsapp') {
      window.open('https://wa.me/256700123456?text=Hello,%20I%20need%20help%20with%20ShopOnline%20Uganda', '_blank');
    }
  };

  const handleCartClick = () => {
    handleNavigation('/cart');
  };

  // Calculate cart count from cartItems
  const cartCount = cartItems ? cartItems.reduce((total, item) => total + (item.quantity || 1), 0) : 0;

  // Navigation menu items
  const navigationItems = [
    { label: 'Home', path: '/', icon: null },
    { label: 'Categories', path: '/categories', icon: Grid3X3 },
    { label: 'All Products', path: '/products', icon: Package },
    { label: 'Flash Sales', path: '/flash-sales', icon: Zap },
    { label: 'About', path: '/about', icon: null },
    { label: 'Contact', path: '/contact', icon: null },
  ];

  // User menu items
  const userMenuItems = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'My Orders', path: '/orders', icon: ShoppingBag },
    { label: 'Wishlist', path: '/wishlist', icon: Heart },
  ];

  // Admin menu items
  const adminMenuItems = [
    { label: 'Admin Dashboard', path: '/admin', icon: Settings },
    { label: 'Manage Products', path: '/admin/products', icon: Package },
    { label: 'Manage Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Flash Sales', path: '/admin/flash-sales', icon: Zap },
    { label: 'Homepage', path: '/admin/homepage', icon: Grid3X3 },
  ];

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
                  <span>Free delivery in Kampala for orders above UGX 100,000</span>
                </div>
              </div>
              <div className="header__topbar-right">
                <div className="header__topbar-links">
                  <button 
                    onClick={() => handleNavigation('/help')} 
                    className="header__topbar-link"
                    aria-label="Help center"
                  >
                    Help
                  </button>
                  <button 
                    onClick={() => handleNavigation('/contact')} 
                    className="header__topbar-link"
                    aria-label="Contact us"
                  >
                    Contact
                  </button>
                  {user?.is_admin && (
                    <button 
                      onClick={() => handleNavigation('/admin')} 
                      className="header__topbar-link header__topbar-link--admin"
                      aria-label="Admin panel"
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
                  >
                    <Phone className="icon" aria-hidden="true" />
                  </button>
                  <button 
                    onClick={() => handleContactAction('whatsapp')} 
                    className="contact-link whatsapp" 
                    aria-label="WhatsApp support"
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
                onClick={() => handleNavigation('/')} 
                className="header__logo-link"
                aria-label="ShopOnline Uganda homepage"
              >
                <ShoppingBag className="header__logo-icon" aria-hidden="true" />
                <div className="header__logo-text">
                  <span className="header__logo-main">ShopOnline</span>
                  <span className="header__logo-sub">Uganda</span>
                </div>
              </button>
            </div>

            {!isAdminRoute && (
              <div className="header__search desktop-only" ref={searchRef}>
                <div className="search-container">
                  <form onSubmit={handleSearch} className="search-input-container">
                    <input
                      type="text"
                      placeholder="Search for products, categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.length > 1 && setShowSearchSuggestions(true)}
                      className="search-input"
                      autoComplete="off"
                      aria-label="Search products and categories"
                    />
                    <button 
                      type="submit" 
                      className="search-btn"
                      aria-label="Search"
                    >
                      <Search className="icon" aria-hidden="true" />
                    </button>
                  </form>
                  
                  {showSearchSuggestions && searchSuggestions.length > 0 && (
                    <div className="search-suggestions" role="listbox">
                      {searchSuggestions.map(suggestion => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="search-suggestion-item"
                          role="option"
                          aria-selected="false"
                          aria-label={`${suggestion.title} ${suggestion.type === 'product' ? 'product' : 'category'}`}
                        >
                          <div className="suggestion-icon">
                            {suggestion.type === 'product' ? 
                              <ShoppingBag className="icon" aria-hidden="true" /> : 
                              <Grid3X3 className="icon" aria-hidden="true" />
                            }
                          </div>
                          <div className="suggestion-content">
                            <span className="suggestion-title">{suggestion.title}</span>
                            <span className="suggestion-meta">
                              {suggestion.type === 'product' ? `in ${suggestion.category}` : `${suggestion.count} products`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="header__actions">
              {!isAdminRoute && (
                <>
                  <div className="auth-links desktop-only">
                    {isAuthenticated ? (
                      <div className="user-menu" ref={userDropdownRef}>
                        <button 
                          onClick={toggleUserDropdown}
                          className="user-menu-trigger"
                          aria-expanded={showUserDropdown}
                          aria-label="User menu"
                        >
                          <User className="icon" aria-hidden="true" />
                          <span>Account</span>
                          <ChevronDown className={`chevron-icon ${showUserDropdown ? 'rotated' : ''}`} aria-hidden="true" />
                        </button>
                        {showUserDropdown && (
                          <div className="user-dropdown" role="menu">
                            <div className="user-dropdown-header">
                              <div className="user-info">
                                <span className="user-name">{user.name}</span>
                                <span className="user-email">{user.email}</span>
                                {user.is_admin && <span className="admin-badge">Admin</span>}
                              </div>
                            </div>
                            
                            {userMenuItems.map(item => (
                              <button 
                                key={item.path}
                                onClick={() => handleNavigation(item.path)} 
                                className="dropdown-item"
                                role="menuitem"
                              >
                                <item.icon className="icon" aria-hidden="true" />
                                {item.label}
                              </button>
                            ))}
                            
                            {user.is_admin && (
                              <>
                                <div className="dropdown-divider" role="separator"></div>
                                {adminMenuItems.slice(0, 1).map(item => (
                                  <button 
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)} 
                                    className="dropdown-item"
                                    role="menuitem"
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
                            >
                              <LogOut className="icon" aria-hidden="true" />
                              Logout
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
                        >
                          <LogIn className="icon" aria-hidden="true" />
                          <span>Sign In</span>
                        </button>
                        <button 
                          onClick={() => handleAuthAction('register')} 
                          className="auth-btn register-btn"
                          aria-label="Sign up"
                        >
                          <UserPlus className="icon" aria-hidden="true" />
                          <span>Sign Up</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button 
                    onClick={handleCartClick} 
                    className="header__cart-button"
                    aria-label={`Cart with ${cartCount} items`}
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

              {isAdminRoute && isAuthenticated && (
                <div className="admin-nav desktop-only">
                  <button 
                    onClick={() => handleNavigation('/')} 
                    className="admin-nav-btn"
                    aria-label="View store"
                  >
                    <ShoppingBag className="icon" aria-hidden="true" />
                    <span>View Store</span>
                  </button>
                  <button 
                    onClick={() => handleAuthAction('logout')} 
                    className="admin-nav-btn logout"
                    aria-label="Logout"
                  >
                    <LogOut className="icon" aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              )}

              {!isAdminRoute && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="header__mobile-toggle mobile-only"
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? <X className="icon" aria-hidden="true" /> : <Menu className="icon" aria-hidden="true" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isAdminRoute && (
        <div className="header__mobile-search mobile-only">
          <div className="container">
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-input-container">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  aria-label="Search products"
                />
                <button 
                  type="submit" 
                  className="search-btn"
                  aria-label="Search"
                >
                  <Search className="icon" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && !isAdminRoute && (
        <div className="mobile-menu mobile-only">
          <div 
            className="mobile-menu-overlay" 
            onClick={() => setIsMenuOpen(false)} 
            role="button" 
            tabIndex="0"
            aria-label="Close menu"
          />
          <div className="mobile-menu-content">
            <div className="mobile-menu-header">
              <div className="mobile-logo">
                <ShoppingBag className="logo-icon" aria-hidden="true" />
                <span>ShopOnline Uganda</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="close-btn"
                aria-label="Close menu"
              >
                <X className="icon" aria-hidden="true" />
              </button>
            </div>

            <div className="mobile-auth">
              {isAuthenticated ? (
                <div className="mobile-user-info">
                  <div className="user-avatar">
                    <User className="icon" aria-hidden="true" />
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-status">
                      {user.is_admin ? 'Admin User' : 'Logged in'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <button 
                    onClick={() => handleAuthAction('login')} 
                    className="mobile-auth-btn login"
                    aria-label="Sign in"
                  >
                    <LogIn className="icon" aria-hidden="true" />
                    <span>Sign In</span>
                  </button>
                  <button 
                    onClick={() => handleAuthAction('register')} 
                    className="mobile-auth-btn register"
                    aria-label="Sign up"
                  >
                    <UserPlus className="icon" aria-hidden="true" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mobile-nav-links">
              {navigationItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <button 
                    key={item.path}
                    onClick={() => handleNavigation(item.path)} 
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon ? <item.icon className="icon" aria-hidden="true" /> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>

            {isAuthenticated && (
              <div className="mobile-user-menu">
                {userMenuItems.map(item => (
                  <button 
                    key={item.path}
                    onClick={() => handleNavigation(item.path)} 
                    className="mobile-menu-item"
                  >
                    <item.icon className="icon" aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
                
                {user.is_admin && (
                  <>
                    <div className="mobile-menu-divider" role="separator"></div>
                    {adminMenuItems.map(item => (
                      <button 
                        key={item.path}
                        onClick={() => handleNavigation(item.path)} 
                        className="mobile-menu-item admin-item"
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
                >
                  <LogOut className="icon" aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}

            <div className="mobile-contact">
              <button 
                onClick={() => handleContactAction('phone')} 
                className="mobile-contact-item"
                aria-label="Call support"
              >
                <Phone className="icon" aria-hidden="true" />
                <span>+256 700 123 456</span>
              </button>
              <button 
                onClick={() => handleContactAction('whatsapp')} 
                className="mobile-contact-item"
                aria-label="WhatsApp support"
              >
                <MessageCircle className="icon" aria-hidden="true" />
                <span>WhatsApp Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        :root {
          --primary-blue: #2563eb;
          --primary-blue-dark: #1e40af;
          --primary-blue-light: #3b82f6;
          --white: #ffffff;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-500: #64748b;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --success: #10b981;
          --warning: #f59e0b;
          --error: #ef4444;
          --shadow-sm: 0 1px 2px 0 rgba(37, 99, 235, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05);
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-full: 9999px;
          --transition-normal: 300ms ease-in-out;
          --gradient-primary: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .header {
          background: var(--white);
          box-shadow: var(--shadow-md);
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: all var(--transition-normal);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header--scrolled {
          box-shadow: var(--shadow-lg);
        }

        .header--admin .header__topbar {
          display: none;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .icon {
          width: 20px;
          height: 20px;
          stroke-width: 1.5;
          flex-shrink: 0;
        }

        .header__topbar {
          background: var(--primary-blue);
          color: var(--white);
          font-size: 0.875rem;
          padding: 0.5rem 0;
        }

        .header__topbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .header__topbar-left {
          flex: 1;
        }

        .delivery-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .delivery-info .icon {
          width: 16px;
          height: 16px;
        }

        .header__topbar-right {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .header__topbar-links {
          display: flex;
          gap: 1.5rem;
        }

        .header__topbar-link {
          color: var(--white);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: opacity var(--transition-normal);
          font-weight: 500;
          font-size: 0.875rem;
        }

        .header__topbar-link:hover {
          opacity: 0.8;
        }

        .header__topbar-link--admin {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .contact-links {
          display: flex;
          gap: 0.75rem;
        }

        .contact-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          color: var(--white);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .contact-link:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .contact-link .icon {
          width: 16px;
          height: 16px;
        }

        .contact-link.whatsapp:hover {
          background: #25d366;
          border-color: #25d366;
        }

        .header__main {
          padding: 1rem 0;
          border-bottom: 1px solid var(--gray-200);
        }

        .header__main-content {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .header__logo {
          flex-shrink: 0;
        }

        .header__logo-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: inherit;
          transition: transform var(--transition-normal);
        }

        .header__logo-link:hover {
          transform: scale(1.02);
        }

        .header__logo-icon {
          width: 32px;
          height: 32px;
          color: var(--primary-blue);
          stroke-width: 2;
        }

        .header__logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .header__logo-main {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--gray-800);
        }

        .header__logo-sub {
          font-size: 0.75rem;
          color: var(--primary-blue);
          font-weight: 600;
          margin-top: -2px;
        }

        .header__search {
          flex: 1;
          max-width: 600px;
          position: relative;
        }

        .search-container {
          width: 100%;
          position: relative;
        }

        .search-input-container {
          position: relative;
          display: flex;
        }

        .search-input {
          flex: 1;
          padding: 0.875rem 1rem;
          padding-right: 3.5rem;
          border: 2px solid var(--gray-300);
          border-radius: var(--radius-lg);
          font-size: 1rem;
          transition: all var(--transition-normal);
          background: var(--white);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .search-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: var(--gradient-primary);
          color: var(--white);
          border: none;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-btn:hover {
          transform: translateY(-50%) scale(1.05);
        }

        .search-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 50;
          max-height: 300px;
          overflow-y: auto;
          margin-top: 0.25rem;
        }

        .search-suggestion-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-normal);
          width: 100%;
          text-align: left;
          border-bottom: 1px solid var(--gray-100);
        }

        .search-suggestion-item:last-child {
          border-bottom: none;
        }

        .search-suggestion-item:hover {
          background: var(--gray-50);
        }

        .suggestion-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--gray-100);
          border-radius: var(--radius-md);
          color: var(--primary-blue);
        }

        .suggestion-icon .icon {
          width: 16px;
          height: 16px;
        }

        .suggestion-content {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .suggestion-title {
          font-weight: 500;
          color: var(--gray-800);
        }

        .suggestion-meta {
          font-size: 0.8rem;
          color: var(--gray-500);
        }

        .header__actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        .auth-links {
          display: flex;
          gap: 0.5rem;
        }

        .auth-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.875rem;
          border: none;
          background: transparent;
        }

        .auth-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-btn .icon {
          width: 16px;
          height: 16px;
        }

        .login-btn {
          color: var(--gray-700);
          border: 1px solid var(--gray-300);
        }

        .login-btn:hover:not(:disabled) {
          background: var(--gray-50);
          border-color: var(--primary-blue);
          color: var(--primary-blue);
        }

        .register-btn {
          background: var(--gradient-primary);
          color: var(--white);
        }

        .register-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .user-menu {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          color: var(--gray-700);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-weight: 600;
        }

        .user-menu-trigger:hover:not(:disabled) {
          background: var(--gray-50);
          border-color: var(--primary-blue);
          color: var(--primary-blue);
        }

        .chevron-icon {
          width: 14px;
          height: 14px;
          transition: transform var(--transition-normal);
        }

        .chevron-icon.rotated {
          transform: rotate(180deg);
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 220px;
          z-index: 50;
          padding: 0;
          margin-top: 0.5rem;
        }

        .user-dropdown-header {
          padding: 1rem;
          border-bottom: 1px solid var(--gray-200);
          background: var(--gray-50);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .user-name {
          font-weight: 600;
          color: var(--gray-800);
          font-size: 0.9rem;
        }

        .user-email {
          font-size: 0.8rem;
          color: var(--gray-500);
        }

        .admin-badge {
          display: inline-block;
          background: var(--primary-blue);
          color: var(--white);
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          margin-top: 0.25rem;
          width: fit-content;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: var(--gray-700);
          background: transparent;
          border: none;
          width: 100%;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all var(--transition-normal);
          text-align: left;
        }

        .dropdown-item:hover:not(:disabled) {
          background: var(--gray-50);
          color: var(--primary-blue);
        }

        .dropdown-item .icon {
          width: 16px;
          height: 16px;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--gray-200);
          margin: 0.5rem 0;
        }

        .logout-btn {
          border-top: 1px solid var(--gray-200);
          margin-top: 0.5rem;
          color: var(--error);
        }

        .logout-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .admin-nav {
          display: flex;
          gap: 0.5rem;
        }

        .admin-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          color: var(--gray-700);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-weight: 600;
          font-size: 0.875rem;
        }

        .admin-nav-btn:hover:not(:disabled) {
          background: var(--gray-50);
          border-color: var(--primary-blue);
          color: var(--primary-blue);
        }

        .admin-nav-btn.logout {
          color: var(--error);
          border-color: var(--error);
        }

        .admin-nav-btn.logout:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .header__cart-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          color: var(--gray-700);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-weight: 600;
        }

        .header__cart-button:hover:not(:disabled) {
          background: var(--gray-50);
          border-color: var(--primary-blue);
          color: var(--primary-blue);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .header__cart-icon-wrapper {
          position: relative;
        }

        .header__cart-icon {
          width: 20px;
          height: 20px;
        }

        .header__cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--error);
          color: var(--white);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-full);
          min-width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          animation: cart-pulse 2s ease-in-out infinite;
        }

        @keyframes cart-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .header__cart-text {
          font-size: 0.875rem;
        }

        .header__mobile-toggle {
          background: transparent;
          border: 1px solid var(--gray-300);
          color: var(--gray-700);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          transition: all var(--transition-normal);
        }

        .header__mobile-toggle:hover:not(:disabled) {
          background: var(--gray-50);
          border-color: var(--primary-blue);
          color: var(--primary-blue);
        }

        .header__mobile-search {
          background: var(--gray-50);
          padding: 1rem 0;
          border-bottom: 1px solid var(--gray-200);
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2000;
        }

        .mobile-menu-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          cursor: pointer;
        }

        .mobile-menu-content {
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          max-width: 400px;
          height: 100%;
          background: var(--white);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .mobile-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--gray-200);
          background: var(--primary-blue);
          color: var(--white);
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
        }

        .logo-icon {
          width: 24px;
          height: 24px;
        }

        .close-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--white);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          transition: all var(--transition-normal);
        }

        .close-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.1);
        }

        .mobile-auth {
          padding: 1.5rem;
          border-bottom: 1px solid var(--gray-200);
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-avatar {
          width: 50px;
          height: 50px;
          background: var(--gray-100);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-blue);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .user-name {
          font-weight: 600;
          color: var(--gray-800);
        }

        .user-status {
          font-size: 0.875rem;
          color: var(--gray-500);
        }

        .mobile-auth-buttons {
          display: flex;
          gap: 1rem;
        }

        .mobile-auth-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .mobile-auth-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mobile-auth-btn.login {
          background: var(--gray-100);
          color: var(--gray-700);
        }

        .mobile-auth-btn.login:hover:not(:disabled) {
          background: var(--gray-200);
        }

        .mobile-auth-btn.register {
          background: var(--gradient-primary);
          color: var(--white);
        }

        .mobile-auth-btn.register:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .mobile-nav-links {
          flex: 1;
          padding: 1rem 0;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          color: var(--gray-700);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
          border-bottom: 1px solid var(--gray-100);
        }

        .mobile-nav-link:hover:not(:disabled) {
          background: var(--gray-50);
          color: var(--primary-blue);
          transform: translateX(4px);
        }

        .mobile-nav-link.active {
          background: var(--gray-50);
          color: var(--primary-blue);
          font-weight: 600;
          border-left: 4px solid var(--primary-blue);
        }

        .mobile-nav-link[aria-current="page"] {
          background: var(--gray-50);
          color: var(--primary-blue);
          font-weight: 600;
          border-left: 4px solid var(--primary-blue);
        }

        .mobile-user-menu {
          padding: 1rem 0;
          border-top: 1px solid var(--gray-200);
        }

        .mobile-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          color: var(--gray-700);
          font-size: 1rem;
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
        }

        .mobile-menu-item:hover:not(:disabled) {
          background: var(--gray-50);
          color: var(--primary-blue);
        }

        .mobile-menu-item.admin-item {
          color: var(--primary-blue);
          font-weight: 500;
        }

        .mobile-menu-item.logout {
          color: var(--error);
          border-top: 1px solid var(--gray-200);
          margin-top: 0.5rem;
        }

        .mobile-menu-item.logout:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .mobile-menu-divider {
          height: 1px;
          background: var(--gray-200);
          margin: 0.5rem 1rem;
        }

        .mobile-contact {
          padding: 1.5rem;
          background: var(--gray-50);
          border-top: 1px solid var(--gray-200);
        }

        .mobile-contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          color: var(--gray-600);
          font-size: 0.875rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-normal);
          width: 100%;
          text-align: left;
        }

        .mobile-contact-item:hover:not(:disabled) {
          color: var(--primary-blue);
        }

        .mobile-contact-item .icon {
          width: 18px;
          height: 18px;
          color: var(--primary-blue);
        }

        .desktop-only {
          display: flex;
        }

        .mobile-only {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-only {
            display: none;
          }

          .mobile-only {
            display: block;
          }

          .header__topbar-content {
            flex-direction: column;
            gap: 0.5rem;
          }

          .header__topbar-right {
            width: 100%;
            justify-content: space-between;
          }

          .header__main-content {
            gap: 1rem;
          }

          .header__logo-text {
            display: none;
          }

          .contact-links {
            order: -1;
          }

          .header__mobile-search .search-input {
            padding: 1rem;
            font-size: 1rem;
          }

          .mobile-menu-content {
            width: 100%;
            max-width: none;
          }
        }

        @media (max-width: 480px) {
          .header__topbar {
            padding: 0.75rem 0;
          }

          .header__main {
            padding: 0.75rem 0;
          }

          .header__cart-button {
            padding: 0.5rem;
          }

          .header__cart-text {
            display: none;
          }

          .mobile-auth-buttons {
            flex-direction: column;
          }
        }

        .header__logo-link:focus,
        .search-btn:focus,
        .auth-btn:focus,
        .header__cart-button:focus,
        .mobile-nav-link:focus,
        .dropdown-item:focus,
        .admin-nav-btn:focus,
        .contact-link:focus,
        .header__topbar-link:focus,
        .close-btn:focus,
        .mobile-contact-item:focus {
          outline: 2px solid var(--primary-blue);
          outline-offset: 2px;
        }

        .search-input:disabled,
        .search-btn:disabled,
        .auth-btn:disabled,
        .header__cart-button:disabled,
        .mobile-nav-link:disabled,
        .dropdown-item:disabled,
        .admin-nav-btn:disabled,
        .contact-link:disabled,
        .header__topbar-link:disabled,
        .close-btn:disabled,
        .mobile-contact-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (prefers-contrast: high) {
          .header {
            border: 2px solid var(--gray-800);
          }
          
          .auth-btn,
          .header__cart-button,
          .admin-nav-btn,
          .contact-link,
          .header__topbar-link {
            border-width: 2px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .header,
          .auth-btn,
          .header__cart-button,
          .mobile-menu-content,
          .user-dropdown,
          .search-suggestions,
          .admin-nav-btn,
          .contact-link,
          .header__topbar-link,
          .mobile-nav-link,
          .dropdown-item,
          .close-btn,
          .mobile-contact-item {
            transition: none;
          }

          .header__cart-badge {
            animation: none;
          }
        }
      `}</style>
    </header>
  );
};

Header.propTypes = {
  // No props are passed to this component, but adding PropTypes for future extensibility
};

export default Header;