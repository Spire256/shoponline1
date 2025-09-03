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
import './Layout.css'; // Import the CSS file

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
      </aside>
    </>
  );
};

export default Sidebar;