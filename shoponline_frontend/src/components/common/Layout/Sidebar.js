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
  Tag,
  FileText,
  HelpCircle,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';

// Mock context and API service (in real app, these would be imported)
const AuthContext = React.createContext({
  user: { name: 'John Doe', is_admin: false },
  isAuthenticated: false
});

const categoriesAPI = {
  getCategoryTree: async () => ({
    data: [
      {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        product_count: 245,
        subcategories: [
          { id: 11, name: 'Smartphones', slug: 'smartphones', product_count: 89 },
          { id: 12, name: 'Laptops', slug: 'laptops', product_count: 45 },
          { id: 13, name: 'Accessories', slug: 'accessories', product_count: 111 }
        ]
      },
      {
        id: 2,
        name: 'Fashion & Style',
        slug: 'fashion',
        product_count: 186,
        subcategories: [
          { id: 21, name: 'Men\'s Fashion', slug: 'mens-fashion', product_count: 78 },
          { id: 22, name: 'Women\'s Fashion', slug: 'womens-fashion', product_count: 108 }
        ]
      },
      {
        id: 3,
        name: 'Home & Garden',
        slug: 'home-garden',
        product_count: 127,
        subcategories: [
          { id: 31, name: 'Furniture', slug: 'furniture', product_count: 56 },
          { id: 32, name: 'Decor', slug: 'decor', product_count: 71 }
        ]
      },
      {
        id: 4,
        name: 'Sports & Fitness',
        slug: 'sports-fitness',
        product_count: 98,
        subcategories: [
          { id: 41, name: 'Exercise Equipment', slug: 'exercise-equipment', product_count: 34 },
          { id: 42, name: 'Sportswear', slug: 'sportswear', product_count: 64 }
        ]
      }
    ]
  })
};

const Sidebar = ({ isAdmin = false, onToggle }) => {
  // Mock context usage
  const { user, isAuthenticated } = useContext(AuthContext) || { 
    user: { name: 'John Doe', is_admin: false }, 
    isAuthenticated: false 
  };
  const [categories, setCategories] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategoryTree();
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      }
    };
    if (!isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
        setIsMobileMenuOpen(false);
      } else {
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

  const renderCategoryTree = (categories, depth = 0) => {
    if (!Array.isArray(categories)) {
      return null;
    }
    
    return categories.map(category => {
      const isExpanded = expandedCategories.has(category.id);
      const hasSubcategories = category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0;
      
      return (
        <li key={category.id} className={`category-item depth-${depth}`}>
          <div className="category-link-container">
            <Link
              to={`/categories/${category.slug}`}
              className={`category-link ${
                location.pathname === `/categories/${category.slug}` ? 'active' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="category-content">
                <span className="category-name">{category.name}</span>
                {!isCollapsed && (
                  <span className="product-count">({category.product_count})</span>
                )}
              </div>
            </Link>
            {hasSubcategories && !isCollapsed && (
              <button 
                className={`expand-button ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => toggleCategory(category.id, e)}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category.name} subcategories`}
              >
                <ChevronRight className="chevron-icon" />
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

  // Check if current route is admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Mobile menu button - visible on mobile only */}
      <button 
        className="mobile-menu-button"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
          >
            {isCollapsed ? <ChevronRight className="icon" /> : <ChevronLeft className="icon" />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {isAdmin ? (
              <>
                <li className="nav-item">
                  <Link
                    to="/admin/dashboard"
                    className={`nav-link ${
                      location.pathname === '/admin/dashboard' ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Dashboard' : ''}
                  >
                    <div className="nav-icon">
                      <BarChart3 className="icon" />
                    </div>
                    <span className="nav-text">Dashboard</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/admin/products"
                    className={`nav-link ${
                      location.pathname.includes('/admin/products') ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Products' : ''}
                  >
                    <div className="nav-icon">
                      <Package className="icon" />
                    </div>
                    <span className="nav-text">Products</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/admin/categories"
                    className={`nav-link ${
                      location.pathname.includes('/admin/categories') ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Categories' : ''}
                  >
                    <div className="nav-icon">
                      <Grid3X3 className="icon" />
                    </div>
                    <span className="nav-text">Categories</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/admin/orders"
                    className={`nav-link ${
                      location.pathname.includes('/admin/orders') ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Orders' : ''}
                  >
                    <div className="nav-icon">
                      <ShoppingCart className="icon" />
                    </div>
                    <span className="nav-text">Orders</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/admin/flash-sales"
                    className={`nav-link ${
                      location.pathname.includes('/admin/flash-sales') ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Flash Sales' : ''}
                  >
                    <div className="nav-icon">
                      <Zap className="icon" />
                    </div>
                    <span className="nav-text">Flash Sales</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/admin/users"
                    className={`nav-link ${
                      location.pathname.includes('/admin/users') ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Users' : ''}
                  >
                    <div className="nav-icon">
                      <Users className="icon" />
                    </div>
                    <span className="nav-text">Users</span>
                  </Link>
                </li>
                
                {/* Admin Quick Actions */}
                <li className="nav-section">
                  <div className="section-divider" />
                  <div className={`section-header ${isCollapsed ? 'collapsed' : ''}`}>
                    <h3 className="section-title">Quick Actions</h3>
                  </div>
                </li>
                <li className="nav-item">
                  <Link
                    to="/admin/analytics"
                    className={`nav-link ${
                      location.pathname === '/admin/analytics' ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Analytics' : ''}
                  >
                    <div className="nav-icon">
                      <TrendingUp className="icon" />
                    </div>
                    <span className="nav-text">Analytics</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/admin/reviews"
                    className={`nav-link ${
                      location.pathname === '/admin/reviews' ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Reviews' : ''}
                  >
                    <div className="nav-icon">
                      <Star className="icon" />
                    </div>
                    <span className="nav-text">Reviews</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <button
                    onClick={() => handleNavigation('/')}
                    className={`nav-link nav-button ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'View Store' : ''}
                  >
                    <div className="nav-icon">
                      <Home className="icon" />
                    </div>
                    <span className="nav-text">View Store</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Main Navigation */}
                <li className="nav-item">
                  <Link
                    to="/"
                    className={`nav-link ${
                      location.pathname === '/' ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Home' : ''}
                  >
                    <div className="nav-icon">
                      <Home className="icon" />
                    </div>
                    <span className="nav-text">Home</span>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link
                    to="/products"
                    className={`nav-link ${
                      location.pathname === '/products' ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'All Products' : ''}
                  >
                    <div className="nav-icon">
                      <Package className="icon" />
                    </div>
                    <span className="nav-text">All Products</span>
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/flash-sales"
                    className={`nav-link flash-link ${
                      location.pathname === '/flash-sales' ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Flash Sales' : ''}
                  >
                    <div className="nav-icon">
                      <Zap className="icon flash-icon" />
                    </div>
                    <span className="nav-text">Flash Sales</span>
                    {!isCollapsed && <span className="flash-badge">Hot</span>}
                  </Link>
                </li>

                {/* User Account Section */}
                {isAuthenticated && (
                  <>
                    <li className="nav-section">
                      <div className="section-divider" />
                      <div className={`section-header ${isCollapsed ? 'collapsed' : ''}`}>
                        <h3 className="section-title">My Account</h3>
                      </div>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/profile"
                        className={`nav-link ${
                          location.pathname === '/profile' ? 'active' : ''
                        } ${isCollapsed ? 'collapsed' : ''}`}
                        title={isCollapsed ? 'My Profile' : ''}
                      >
                        <div className="nav-icon">
                          <User className="icon" />
                        </div>
                        <span className="nav-text">My Profile</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/orders"
                        className={`nav-link ${
                          location.pathname === '/orders' ? 'active' : ''
                        } ${isCollapsed ? 'collapsed' : ''}`}
                        title={isCollapsed ? 'My Orders' : ''}
                      >
                        <div className="nav-icon">
                          <ShoppingBag className="icon" />
                        </div>
                        <span className="nav-text">My Orders</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/wishlist"
                        className={`nav-link ${
                          location.pathname === '/wishlist' ? 'active' : ''
                        } ${isCollapsed ? 'collapsed' : ''}`}
                        title={isCollapsed ? 'Wishlist' : ''}
                      >
                        <div className="nav-icon">
                          <Heart className="icon" />
                        </div>
                        <span className="nav-text">Wishlist</span>
                      </Link>
                    </li>
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
                    <li className="nav-item categories-section">
                      <ul className="categories-list">
                        {renderCategoryTree(categories)}
                      </ul>
                    </li>
                  </>
                )}

                {/* Help & Support */}
                <li className="nav-section">
                  <div className="section-divider" />
                  <div className={`section-header ${isCollapsed ? 'collapsed' : ''}`}>
                    <h3 className="section-title">Support</h3>
                  </div>
                </li>
                <li className="nav-item">
                  <Link
                    to="/help"
                    className={`nav-link ${
                      location.pathname === '/help' ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Help Center' : ''}
                  >
                    <div className="nav-icon">
                      <HelpCircle className="icon" />
                    </div>
                    <span className="nav-text">Help Center</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/contact"
                    className={`nav-link ${
                      location.pathname === '/contact' ? 'active' : ''
                    } ${isCollapsed ? 'collapsed' : ''}`}
                    title={isCollapsed ? 'Contact Us' : ''}
                  >
                    <div className="nav-icon">
                      <Phone className="icon" />
                    </div>
                    <span className="nav-text">Contact Us</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Quick Contact (for non-admin users) */}
        {!isAdmin && !isCollapsed && (
          <div className="sidebar-footer">
            <div className="quick-contact">
              <h4 className="contact-title">Need Help?</h4>
              <div className="contact-methods">
                <button 
                  className="contact-btn phone"
                  onClick={() => window.open('tel:+256700123456')}
                  title="Call us"
                >
                  <Phone className="icon" />
                  <span>Call Now</span>
                </button>
                <button 
                  className="contact-btn whatsapp"
                  onClick={() => window.open('https://wa.me/256700123456', '_blank')}
                  title="WhatsApp us"
                >
                  <div className="whatsapp-icon">💬</div>
                  <span>WhatsApp</span>
                </button>
              </div>
              <div className="business-hours">
                <Clock className="icon" />
                <span>Mon-Fri: 8AM-8PM</span>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          /* CSS Variables aligned with Header and HomePage */
          :root {
            --primary-blue: #2563eb;
            --primary-blue-dark: #1e40af;
            --primary-blue-light: #3b82f6;
            --primary-blue-lighter: #60a5fa;
            --secondary-blue: #1e293b;
            --accent-blue: #0ea5e9;
            --light-blue: #e0f2fe;
            --very-light-blue: #f0f9ff;
            --white: #ffffff;
            --gray-50: #f8fafc;
            --gray-100: #f1f5f9;
            --gray-200: #e2e8f0;
            --gray-300: #cbd5e1;
            --gray-400: #94a3b8;
            --gray-500: #64748b;
            --gray-600: #475569;
            --gray-700: #334155;
            --gray-800: #1e293b;
            --gray-900: #0f172a;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --info: #3b82f6;
            --gradient-primary: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%);
            --gradient-secondary: linear-gradient(135deg, var(--secondary-blue) 0%, var(--primary-blue-dark) 100%);
            --shadow-sm: 0 1px 2px 0 rgba(37, 99, 235, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05);
            --radius-sm: 4px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --radius-full: 9999px;
            --transition-fast: 150ms ease-in-out;
            --transition-normal: 300ms ease-in-out;
          }

          /* Mobile menu button - only visible on mobile */
          .mobile-menu-button {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1001;
            width: 44px;
            height: 44px;
            background: var(--primary-blue);
            border: none;
            border-radius: var(--radius-md);
            cursor: pointer;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: all var(--transition-normal);
          }

          .mobile-menu-button span {
            display: block;
            width: 20px;
            height: 2px;
            background: var(--white);
            border-radius: 1px;
            transition: all var(--transition-normal);
          }

          .mobile-menu-button:hover {
            background: var(--primary-blue-dark);
            transform: scale(1.05);
          }

          /* Mobile overlay */
          .sidebar-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(4px);
          }

          /* Sidebar positioning - now relative instead of fixed */
          .sidebar {
            background: var(--white);
            border-right: 1px solid var(--gray-200);
            box-shadow: var(--shadow-lg);
            transition: all var(--transition-normal);
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 900;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .sidebar.expanded {
            width: 17rem; /* 272px */
          }

          .sidebar.collapsed {
            width: 4.5rem; /* 72px */
          }

          /* Adjust sidebar top position to account for header */
          .sidebar {
            top: 80px; /* Height of header */
            height: calc(100vh - 80px);
          }

          .sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 1rem;
            border-bottom: 1px solid var(--gray-200);
            min-height: 80px;
            background: var(--gradient-primary);
            color: var(--white);
          }

          .sidebar-title {
            transition: opacity var(--transition-normal);
            white-space: nowrap;
            overflow: hidden;
          }

          .sidebar-title.hidden {
            opacity: 0;
            width: 0;
          }

          .sidebar-title.visible {
            opacity: 1;
            width: auto;
          }

          .title-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.125rem;
            font-weight: 700;
          }

          .title-icon {
            width: 24px;
            height: 24px;
            stroke-width: 2;
            flex-shrink: 0;
          }

          .toggle-button {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: var(--white);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: var(--radius-md);
            transition: all var(--transition-normal);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            backdrop-filter: blur(10px);
          }

          .toggle-button:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
          }

          .toggle-button:focus {
            outline: 2px solid var(--white);
            outline-offset: 2px;
          }

          .icon {
            width: 20px;
            height: 20px;
            stroke-width: 1.5;
            flex-shrink: 0;
          }

          .sidebar-nav {
            flex: 1;
            padding: 1rem 0;
            overflow-y: auto;
            overflow-x: hidden;
          }

          .sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }

          .sidebar-nav::-webkit-scrollbar-track {
            background: var(--gray-100);
          }

          .sidebar-nav::-webkit-scrollbar-thumb {
            background: var(--primary-blue-light);
            border-radius: var(--radius-sm);
          }

          .sidebar-nav::-webkit-scrollbar-thumb:hover {
            background: var(--primary-blue);
          }

          .nav-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
          }

          .nav-item {
            margin: 0;
          }

          .nav-link,
          .nav-button {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1rem;
            color: var(--gray-700);
            text-decoration: none;
            transition: all var(--transition-normal);
            border-radius: 0;
            font-weight: 500;
            font-size: 0.875rem;
            position: relative;
            border-left: 3px solid transparent;
            background: transparent;
            border: none;
            width: 100%;
            text-align: left;
            cursor: pointer;
          }

          .nav-link:hover,
          .nav-button:hover {
            background: var(--very-light-blue);
            color: var(--primary-blue);
            border-left-color: var(--primary-blue-light);
            transform: translateX(2px);
          }

          .nav-link.active {
            background: var(--gradient-primary);
            color: var(--white);
            border-left-color: var(--primary-blue-dark);
            font-weight: 600;
          }

          .nav-link:focus,
          .nav-button:focus {
            outline: 2px solid var(--primary-blue-light);
            outline-offset: -2px;
          }

          .nav-link.collapsed,
          .nav-button.collapsed {
            justify-content: center;
            padding: 0.875rem 0.5rem;
          }

          .nav-link.collapsed .nav-text,
          .nav-button.collapsed .nav-text {
            display: none;
          }

          .nav-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 20px;
            height: 20px;
          }

          .nav-text {
            white-space: nowrap;
            transition: opacity var(--transition-normal);
          }

          /* Flash Sales Special Styling */
          .flash-link {
            position: relative;
            animation: subtle-glow 3s ease-in-out infinite alternate;
          }

          .flash-icon {
            color: var(--warning);
          }

          .flash-badge {
            background: var(--error);
            color: var(--white);
            font-size: 0.625rem;
            font-weight: 700;
            padding: 0.125rem 0.375rem;
            border-radius: var(--radius-full);
            position: absolute;
            top: 0.5rem;
            right: 1rem;
            animation: pulse 2s infinite;
          }

          @keyframes subtle-glow {
            from { box-shadow: inset 0 0 0 rgba(245, 158, 11, 0.1); }
            to { box-shadow: inset 0 0 8px rgba(245, 158, 11, 0.2); }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          /* Section Styling */
          .nav-section {
            margin: 1rem 0 0.5rem 0;
          }

          .section-divider {
            height: 1px;
            background: var(--gray-200);
            margin: 1rem 1rem 0.75rem 1rem;
          }

          .section-header {
            padding: 0 1rem;
            margin-bottom: 0.5rem;
            opacity: 1;
            transition: opacity var(--transition-normal);
          }

          .section-header.collapsed {
            opacity: 0;
            height: 0;
            margin: 0;
            overflow: hidden;
          }

          .section-title {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--primary-blue);
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          /* Categories Section */
          .categories-section {
            margin: 0;
          }

          .categories-list {
            list-style: none;
            margin: 0;
            padding: 0;
          }

          .category-item {
            margin: 0;
          }

          .category-item.depth-0 {
            margin-left: 0;
          }

          .category-item.depth-1 {
            margin-left: 1.5rem;
            border-left: 2px solid var(--gray-200);
          }

          .category-link-container {
            display: flex;
            align-items: center;
            position: relative;
          }

          .category-link {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            color: var(--gray-600);
            text-decoration: none;
            transition: all var(--transition-normal);
            border-radius: 0;
            font-size: 0.875rem;
            border-left: 3px solid transparent;
            background: transparent;
          }

          .category-link:hover {
            background: var(--light-blue);
            color: var(--primary-blue);
            border-left-color: var(--primary-blue-light);
            transform: translateX(2px);
          }

          .category-link.active {
            background: var(--gradient-primary);
            color: var(--white);
            border-left-color: var(--primary-blue-dark);
            font-weight: 600;
          }

          .category-link:focus {
            outline: 2px solid var(--primary-blue-light);
            outline-offset: -2px;
          }

          .category-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }

          .category-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .product-count {
            font-size: 0.75rem;
            background: var(--gray-100);
            color: var(--gray-600);
            padding: 0.125rem 0.5rem;
            border-radius: var(--radius-full);
            font-weight: 600;
            flex-shrink: 0;
            margin-left: 0.5rem;
          }

          .category-link:hover .product-count {
            background: var(--primary-blue-light);
            color: var(--white);
          }

          .category-link.active .product-count {
            background: rgba(255, 255, 255, 0.2);
            color: var(--white);
          }

          .expand-button {
            background: transparent;
            border: none;
            color: var(--gray-500);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: var(--radius-sm);
            transition: all var(--transition-normal);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            margin-left: 0.5rem;
          }

          .expand-button:hover {
            background: var(--gray-100);
            color: var(--primary-blue);
          }

          .expand-button.expanded {
            transform: rotate(90deg);
          }

          .chevron-icon {
            width: 14px;
            height: 14px;
            transition: transform var(--transition-normal);
          }

          .subcategory-list {
            list-style: none;
            margin: 0;
            padding: 0;
            background: var(--gray-50);
            border-left: 2px solid var(--primary-blue-light);
            margin-left: 1rem;
          }

          /* Sidebar Footer */
          .sidebar-footer {
            border-top: 1px solid var(--gray-200);
            padding: 1rem;
            background: var(--gray-50);
          }

          .quick-contact {
            text-align: center;
          }

          .contact-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--gray-800);
            margin-bottom: 1rem;
          }

          .contact-methods {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .contact-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border: 1px solid var(--gray-300);
            background: var(--white);
            color: var(--gray-700);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all var(--transition-normal);
            font-size: 0.875rem;
            font-weight: 500;
          }

          .contact-btn:hover {
            background: var(--primary-blue);
            color: var(--white);
            border-color: var(--primary-blue);
            transform: translateY(-1px);
          }

          .contact-btn.whatsapp:hover {
            background: #25d366;
            border-color: #25d366;
          }

          .whatsapp-icon {
            font-size: 16px;
          }

          .business-hours {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            color: var(--gray-600);
            padding: 0.5rem;
            background: var(--white);
            border-radius: var(--radius-md);
          }

          .business-hours .icon {
            width: 14px;
            height: 14px;
          }

          /* Mobile responsiveness */
          @media (max-width: 1024px) {
            .sidebar.expanded {
              width: 15rem; /* 240px */
            }
          }

          @media (max-width: 768px) {
            .mobile-menu-button {
              display: flex;
            }

            .sidebar-overlay {
              display: block;
            }

            .sidebar {
              transform: translateX(-100%);
              transition: transform var(--transition-normal);
              z-index: 1100;
              top: 0;
              height: 100vh;
            }

            .sidebar.mobile-open {
              transform: translateX(0);
            }

            .sidebar.expanded {
              width: 100%;
              max-width: 320px;
            }

            .sidebar.collapsed {
              transform: translateX(-100%);
            }

            .nav-link,
            .nav-button {
              padding: 1rem;
              font-size: 1rem;
            }

            .category-link {
              padding: 0.875rem 1rem;
            }

            .sidebar-header {
              padding: 1rem;
            }
          }

          @media (max-width: 480px) {
            .sidebar.mobile-open {
              width: 100vw;
              max-width: none;
            }
          }

          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .sidebar {
              border: 2px solid var(--gray-800);
            }

            .nav-link,
            .nav-button,
            .category-link {
              border: 1px solid transparent;
            }

            .nav-link:hover,
            .nav-button:hover,
            .category-link:hover,
            .nav-link.active,
            .category-link.active {
              border-color: var(--primary-blue);
            }
          }

          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .sidebar,
            .nav-link,
            .nav-button,
            .category-link,
            .toggle-button,
            .sidebar-title,
            .nav-text,
            .expand-button,
            .chevron-icon,
            .contact-btn {
              transition: none;
            }

            .flash-link {
              animation: none;
            }

            .flash-badge {
              animation: none;
            }
          }

          /* Print styles */
          @media print {
            .sidebar {
              display: none;
            }
          }

          /* Focus visible for keyboard navigation */
          .nav-link:focus-visible,
          .nav-button:focus-visible,
          .category-link:focus-visible,
          .toggle-button:focus-visible,
          .expand-button:focus-visible,
          .contact-btn:focus-visible {
            outline: 2px solid var(--primary-blue);
            outline-offset: 2px;
          }
        `}</style>
      </aside>
    </>
  );
};

export default Sidebar;