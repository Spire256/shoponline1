import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Package, 
  Grid3X3, 
  ShoppingBag, 
  Users, 
  User, 
  ShoppingCart,
  Heart,
  Settings,
  BarChart3,
  TrendingUp,
  Zap,
  Star,
  FileText,
  HelpCircle,
  Phone,
  Clock,
  Search,
  Menu,
  X,
  ChevronDown,
  Filter,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  Eye,
  Plus,
  Minus,
  Mail,
  MessageCircle,
  Info,
  BookOpen
} from 'lucide-react';
import './Layout.css';

// AuthContext should be imported from your actual auth context
const AuthContext = React.createContext({
  user: null,
  isAuthenticated: false,
  logout: () => {}
});

const Sidebar = ({ 
  isAdmin = false, 
  onToggle, 
  categories = [], 
  isLoading = false,
  user = null,
  isAuthenticated = false,
  onLogout = () => {}
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize collapsed state based on screen size
    return window.innerWidth <= 768;
  });
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on help or contact pages for enhanced integration
  const isHelpPage = location.pathname === '/help' || location.pathname.startsWith('/help');
  const isContactPage = location.pathname === '/contact' || location.pathname.startsWith('/contact');
  const isAboutPage = location.pathname === '/about' || location.pathname.startsWith('/about');

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filterCategories = (cats, term) => {
      return cats.filter(category => {
        const matchesName = category.name?.toLowerCase().includes(term.toLowerCase());
        const matchesSubcategory = category.subcategories?.some(sub => 
          sub.name?.toLowerCase().includes(term.toLowerCase())
        );
        return matchesName || matchesSubcategory;
      });
    };

    setFilteredCategories(filterCategories(categories, searchTerm));
  }, [categories, searchTerm]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setIsCollapsed(true);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key for closing mobile menu
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onToggle) {
      onToggle(newCollapsed);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleCategory = (categoryId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const renderCategoryTree = (categories, depth = 0) => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return null;
    }
    
    return categories.map(category => {
      if (!category?.id || !category?.name) return null;
      
      const isExpanded = expandedCategories.has(category.id);
      const hasSubcategories = category.subcategories && 
                             Array.isArray(category.subcategories) && 
                             category.subcategories.length > 0;
      const categoryPath = `/categories/${category.slug || category.id}`;
      
      return (
        <li key={category.id} className={`category-item depth-${depth}`}>
          <div className="category-link-container">
            <Link
              to={categoryPath}
              className={`category-link ${
                isActiveRoute(categoryPath) ? 'active' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Browse ${category.name} category`}
            >
              <div className="category-content">
                <span className="category-name">{category.name}</span>
                {!isCollapsed && category.product_count !== undefined && (
                  <span className="product-count">
                    {category.product_count}
                  </span>
                )}
              </div>
            </Link>
            {hasSubcategories && !isCollapsed && (
              <button 
                className={`expand-button ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => toggleCategory(category.id, e)}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category.name} subcategories`}
                aria-expanded={isExpanded}
              >
                <ChevronDown className="chevron-icon" />
              </button>
            )}
          </div>
          {hasSubcategories && isExpanded && !isCollapsed && (
            <ul className="subcategory-list">
              {renderCategoryTree(category.subcategories, depth + 1)}
            </ul>
          )}
        </li>
      );
    });
  };

  const adminNavItems = [
    { path: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/categories', icon: Grid3X3, label: 'Categories' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/flash-sales', icon: Zap, label: 'Flash Sales' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

  const adminQuickActions = [
    { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/admin/reviews', icon: Star, label: 'Reviews' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/security', icon: Shield, label: 'Security' },
  ];

  const customerNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/products', icon: Package, label: 'All Products' },
    { path: '/flash-sales', icon: Zap, label: 'Flash Sales', isSpecial: true },
  ];

  const customerAccountItems = [
    { path: '/profile', icon: User, label: 'My Profile' },
    { path: '/orders', icon: ShoppingBag, label: 'My Orders' },
    { path: '/wishlist', icon: Heart, label: 'Wishlist' },
    { path: '/payments', icon: CreditCard, label: 'Payment Methods' },
  ];

  // Support items for navigation
  const supportItems = [
    { 
      path: '/help', 
      icon: HelpCircle, 
      label: 'Help Center',
      isActive: isHelpPage,
      description: 'Find answers to common questions'
    },
    { 
      path: '/contact', 
      icon: Mail, 
      label: 'Contact Us',
      isActive: isContactPage,
      description: 'Get in touch with our support team'
    },
    { 
      path: '/about', 
      icon: Info, 
      label: 'About Us',
      isActive: isAboutPage,
      description: 'Learn more about ShopOnline Uganda'
    },
    { 
      path: '/faq', 
      icon: BookOpen, 
      label: 'FAQ',
      description: 'Frequently asked questions'
    },
  ];

  const renderNavItem = ({ path, icon: Icon, label, isSpecial = false, isActive = false, description, onClick }) => (
    <li key={path} className="nav-item">
      {onClick ? (
        <button
          onClick={onClick}
          className={`nav-link nav-button ${isCollapsed ? 'collapsed' : ''} ${isSpecial ? 'flash-link' : ''} ${isActive ? 'active' : ''}`}
          title={isCollapsed ? label : description || label}
          aria-label={label}
        >
          <div className="nav-icon">
            <Icon className={`icon ${isSpecial ? 'flash-icon' : ''}`} />
          </div>
          <span className="nav-text">{label}</span>
          {!isCollapsed && description && (
            <span className="nav-description">{description}</span>
          )}
          {isSpecial && !isCollapsed && <span className="flash-badge">Hot</span>}
        </button>
      ) : (
        <Link
          to={path}
          className={`nav-link ${
            isActive || isActiveRoute(path) ? 'active' : ''
          } ${isCollapsed ? 'collapsed' : ''} ${isSpecial ? 'flash-link' : ''}`}
          title={isCollapsed ? label : description || label}
          aria-label={label}
        >
          <div className="nav-icon">
            <Icon className={`icon ${isSpecial ? 'flash-icon' : ''}`} />
          </div>
          <span className="nav-text">{label}</span>
          {!isCollapsed && description && (
            <span className="nav-description">{description}</span>
          )}
          {isSpecial && !isCollapsed && <span className="flash-badge">Hot</span>}
        </Link>
      )}
    </li>
  );

  const renderSection = (title, items, renderCustom = null) => (
    <>
      <li className="nav-section">
        <div className="section-divider" />
        <div className={`section-header ${isCollapsed ? 'collapsed' : ''}`}>
          <h3 className="section-title">{title}</h3>
        </div>
      </li>
      {renderCustom ? renderCustom() : items.map(renderNavItem)}
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-button"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? (
          <X className="icon" />
        ) : (
          <Menu className="icon" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobileMenuOpen ? 'mobile-open' : ''} ${(isHelpPage || isContactPage) ? 'support-context' : ''}`}
        role="navigation"
        aria-label={isAdmin ? 'Admin navigation' : 'Main navigation'}
      >
        <div className="sidebar-header">
          <div className={`sidebar-title ${isCollapsed ? 'hidden' : 'visible'}`}>
            <div className="title-content">
              {isAdmin ? (
                <>
                  <Settings className="title-icon" />
                  <span>Admin Panel</span>
                </>
              ) : (
                <>
                  <Grid3X3 className="title-icon" />
                  <span>Browse</span>
                </>
              )}
            </div>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="toggle-button"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className="icon" />
            ) : (
              <ChevronLeft className="icon" />
            )}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {isAdmin ? (
              <>
                {/* Admin Navigation */}
                {adminNavItems.map(renderNavItem)}
                
                {/* Admin Quick Actions */}
                {renderSection('Quick Actions', adminQuickActions)}
                
                {/* Admin Utilities */}
                <li className="nav-section">
                  <div className="section-divider" />
                  <div className={`section-header ${isCollapsed ? 'collapsed' : ''}`}>
                    <h3 className="section-title">Store</h3>
                  </div>
                </li>
                {renderNavItem({
                  path: '/',
                  icon: Eye,
                  label: 'View Store',
                  onClick: () => handleNavigation('/')
                })}
                {renderNavItem({
                  path: '/admin/logout',
                  icon: LogOut,
                  label: 'Logout',
                  onClick: handleLogout
                })}
              </>
            ) : (
              <>
                {/* Customer Navigation */}
                {customerNavItems.map(renderNavItem)}
                
                {/* User Account Section */}
                {isAuthenticated && user && (
                  <>
                    {renderSection('My Account', customerAccountItems)}
                  </>
                )}

                {/* Categories Section */}
                {Array.isArray(categories) && categories.length > 0 && (
                  <>
                    <li className="nav-section">
                      <div className="section-divider" />
                      <div className={`section-header ${isCollapsed ? 'collapsed' : ''}`}>
                        <h3 className="section-title">Categories</h3>
                      </div>
                    </li>
                    
                    {/* Category Search */}
                    {!isCollapsed && categories.length > 5 && (
                      <li className="nav-item">
                        <div className="category-search">
                          <div className="search-input-container">
                            <Search className="search-icon" />
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="category-search-input"
                              aria-label="Search categories"
                            />
                            {searchTerm && (
                              <button
                                onClick={clearSearch}
                                className="clear-search-btn"
                                aria-label="Clear search"
                              >
                                <X className="icon" />
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    )}
                    
                    <li className="nav-item categories-section">
                      {isLoading ? (
                        <div className="categories-loading">
                          <div className="loading-text">Loading categories...</div>
                        </div>
                      ) : (
                        <ul className="categories-list">
                          {renderCategoryTree(filteredCategories)}
                          {searchTerm && filteredCategories.length === 0 && (
                            <li className="no-categories">
                              <div className="no-results">
                                <Search className="icon" />
                                <span>No categories found for "{searchTerm}"</span>
                              </div>
                            </li>
                          )}
                        </ul>
                      )}
                    </li>
                  </>
                )}

                {/* Support Section */}
                {renderSection('Help & Support', supportItems)}
                
                {/* Logout for authenticated users */}
                {isAuthenticated && (
                  <>
                    <li className="nav-section">
                      <div className="section-divider" />
                    </li>
                    {renderNavItem({
                      path: '/logout',
                      icon: LogOut,
                      label: 'Logout',
                      onClick: handleLogout
                    })}
                  </>
                )}
              </>
            )}
          </ul>
        </nav>

        {/* REMOVED: Quick Contact Footer Section */}
        {/* The sidebar-footer and quick-contact sections have been completely removed */}
        
      </aside>

      {/* Support context styles - kept for help/contact page integration */}
      <style jsx>{`
        .sidebar.support-context .nav-link.active {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
        }

        .nav-description {
          font-size: 11px;
          color: #666;
          display: block;
          margin-top: 2px;
          opacity: 0.8;
        }

        .nav-link.active .nav-icon {
          color: inherit;
        }

        .nav-link.active .nav-description {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Category search styles */
        .category-search {
          padding: 0.5rem 1rem;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 8px;
          width: 16px;
          height: 16px;
          color: #666;
          z-index: 1;
        }

        .category-search-input {
          width: 100%;
          padding: 8px 32px 8px 32px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          background: white;
        }

        .category-search-input:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .clear-search-btn {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 2px;
          border-radius: 2px;
        }

        .clear-search-btn:hover {
          color: #666;
          background: #f5f5f5;
        }

        .categories-loading {
          padding: 1rem;
          text-align: center;
          color: #666;
          font-size: 14px;
        }

        .no-results {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 1rem;
          color: #666;
          font-size: 13px;
          justify-content: center;
        }
      `}</style>
    </>
  );
};

export default Sidebar;