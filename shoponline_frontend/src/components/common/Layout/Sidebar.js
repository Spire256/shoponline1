import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import categoriesAPI from '../../../services/api/categoriesAPI'; // Fixed: Updated path and import
import AuthContext from '../../../contexts/AuthContext'; // Fixed: Updated path

const Sidebar = ({ isAdmin }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategoryTree(); // Updated to use default export
        // Ensure we always set an array, even if the response is unexpected
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Set empty array on error to prevent undefined access
        setCategories([]);
      }
    };
    if (!isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const renderCategoryTree = (categories, depth = 0) => {
    // Add safety check to ensure categories is an array
    if (!Array.isArray(categories)) {
      return null;
    }
    
    return categories.map(category => (
      <li key={category.id} className={`ml-${depth * 4}`}>
        <Link
          to={`/categories/${category.slug}`}
          className={`block py-2 px-4 hover:bg-primary-blue hover:text-white transition ${
            location.pathname === `/categories/${category.slug}` ? 'bg-primary-blue text-white' : ''
          }`}
        >
          {category.name} ({category.product_count})
        </Link>
        {category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0 && (
          <ul className="ml-4">{renderCategoryTree(category.subcategories, depth + 1)}</ul>
        )}
      </li>
    ));
  };

  return (
    <aside
      className={`sidebar bg-dark-blue text-white ${
        isCollapsed ? 'w-16' : 'w-64'
      } transition-all duration-300`}
    >
      <div className="p-4 flex justify-between items-center">
        <h2 className={`text-lg font-semibold ${isCollapsed ? 'hidden' : ''}`}>
          {isAdmin ? 'Admin Menu' : 'Categories'}
        </h2>
        <button onClick={toggleSidebar} className="p-2 hover:bg-blue-700 rounded-md">
          {isCollapsed ? '>' : '<'}
        </button>
      </div>
      <nav className="px-4">
        <ul className="space-y-2">
          {isAdmin ? (
            <>
              <li>
                <Link
                  to="/admin/dashboard"
                  className={`block py-2 px-4 hover:bg-primary-blue hover:text-white transition ${
                    location.pathname === '/admin/dashboard' ? 'bg-primary-blue text-white' : ''
                  } ${isCollapsed ? 'text-center' : ''}`}
                >
                  {isCollapsed ? '🏠' : 'Dashboard'}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/products"
                  className={`block py-2 px-4 hover:bg-primary-blue hover:text-white transition ${
                    location.pathname === '/admin/products' ? 'bg-primary-blue text-white' : ''
                  } ${isCollapsed ? 'text-center' : ''}`}
                >
                  {isCollapsed ? '📦' : 'Products'}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/categories"
                  className={`block py-2 px-4 hover:bg-primary-blue hover:text-white transition ${
                    location.pathname === '/admin/categories' ? 'bg-primary-blue text-white' : ''
                  } ${isCollapsed ? 'text-center' : ''}`}
                >
                  {isCollapsed ? '🏷️' : 'Categories'}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/orders"
                  className={`block py-2 px-4 hover:bg-primary-blue hover:text-white transition ${
                    location.pathname === '/admin/orders' ? 'bg-primary-blue text-white' : ''
                  } ${isCollapsed ? 'text-center' : ''}`}
                >
                  {isCollapsed ? '🛒' : 'Orders'}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/users"
                  className={`block py-2 px-4 hover:bg-primary-blue hover:text-white transition ${
                    location.pathname === '/admin/users' ? 'bg-primary-blue text-white' : ''
                  } ${isCollapsed ? 'text-center' : ''}`}
                >
                  {isCollapsed ? '👥' : 'Users'}
                </Link>
              </li>
            </>
          ) : (
            <>
              {isAuthenticated && (
                <>
                  <li>
                    <Link
                      to="/profile"
                      className={`block py-2 px-4 hover:bg-primary-blue hover:text-white transition ${
                        location.pathname === '/profile' ? 'bg-primary-blue text-white' : ''
                      } ${isCollapsed ? 'text-center' : ''}`}
                    >
                      {isCollapsed ? '👤' : 'Profile'}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/orders"
                      className={`block py-2 px-4 hover:bg-primary-blue hover:text-white transition ${
                        location.pathname === '/orders' ? 'bg-primary-blue text-white' : ''
                      } ${isCollapsed ? 'text-center' : ''}`}
                    >
                      {isCollapsed ? '🛍️' : 'My Orders'}
                    </Link>
                  </li>
                </>
              )}
              {Array.isArray(categories) && categories.length > 0 && (
                <li className={`${isCollapsed ? 'hidden' : ''}`}>
                  <h3 className="text-md font-medium py-2 px-4">Shop by Category</h3>
                  <ul className="space-y-1">{renderCategoryTree(categories)}</ul>
                </li>
              )}
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;