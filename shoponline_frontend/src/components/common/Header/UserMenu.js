// src/components/common/Header/UserMenu.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Handle clicks outside of menu
  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuItemClick = path => {
    closeMenu();
    navigate(path);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getUserDisplayName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  if (!isAuthenticated) {
    return (
      <div className="user-menu">
        <div className="user-menu__auth-buttons">
          <Link to="/login" className="user-menu__auth-button user-menu__auth-button--login">
            Sign In
          </Link>
          <Link to="/register" className="user-menu__auth-button user-menu__auth-button--register">
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="user-menu">
      <button
        onClick={toggleMenu}
        className="user-menu__trigger"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="user-menu__avatar">
          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt={getUserDisplayName()}
              className="user-menu__avatar-image"
            />
          ) : (
            <div className="user-menu__avatar-placeholder">
              {getInitials(user?.first_name, user?.last_name)}
            </div>
          )}
        </div>

        <div className="user-menu__info">
          <div className="user-menu__name">{getUserDisplayName()}</div>
          <div className="user-menu__role">{user?.is_admin ? 'Administrator' : 'Customer'}</div>
        </div>

        <svg
          className={`user-menu__arrow ${isOpen ? 'user-menu__arrow--rotated' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="user-menu__dropdown">
          <div className="user-menu__dropdown-header">
            <div className="user-menu__dropdown-avatar">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={getUserDisplayName()}
                  className="user-menu__dropdown-avatar-image"
                />
              ) : (
                <div className="user-menu__dropdown-avatar-placeholder">
                  {getInitials(user?.first_name, user?.last_name)}
                </div>
              )}
            </div>
            <div className="user-menu__dropdown-info">
              <div className="user-menu__dropdown-name">{getUserDisplayName()}</div>
              <div className="user-menu__dropdown-email">{user?.email}</div>
            </div>
          </div>

          <div className="user-menu__dropdown-content">
            {/* Customer Menu Items */}
            {!user?.is_admin && (
              <>
                <button
                  onClick={() => handleMenuItemClick('/profile')}
                  className="user-menu__dropdown-item"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="user-menu__dropdown-icon"
                  >
                    <path
                      d="M10 2C6.68629 2 4 4.68629 4 8C4 11.3137 6.68629 14 10 14C13.3137 14 16 11.3137 16 8C16 4.68629 13.3137 2 10 2ZM10 18C6.13401 18 3 14.866 3 11V10C3 9.44772 3.44772 9 4 9H16C16.5523 9 17 9.44772 17 10V11C17 14.866 13.866 18 10 18Z"
                      fill="currentColor"
                    />
                  </svg>
                  My Profile
                </button>

                <button
                  onClick={() => handleMenuItemClick('/orders')}
                  className="user-menu__dropdown-item"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="user-menu__dropdown-icon"
                  >
                    <path
                      d="M3 4H17C17.5523 4 18 4.44772 18 5V15C18 15.5523 17.5523 16 17 16H3C2.44772 16 2 15.5523 2 15V5C2 4.44772 2.44772 4 3 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path d="M8 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M8 12H12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  My Orders
                </button>

                <button
                  onClick={() => handleMenuItemClick('/wishlist')}
                  className="user-menu__dropdown-item"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="user-menu__dropdown-icon"
                  >
                    <path
                      d="M10 18L8.55 16.7C4.4 12.96 2 10.78 2 8.18C2 6.22 3.64 4.7 5.8 4.7C7.04 4.7 8.23 5.39 8.97 6.4H11.03C11.77 5.39 12.96 4.7 14.2 4.7C16.36 4.7 18 6.22 18 8.18C18 10.78 15.6 12.96 11.45 16.7L10 18Z"
                      fill="currentColor"
                    />
                  </svg>
                  Wishlist
                </button>
              </>
            )}

            {/* Admin Menu Items */}
            {user?.is_admin && (
              <>
                <button
                  onClick={() => handleMenuItemClick('/admin')}
                  className="user-menu__dropdown-item user-menu__dropdown-item--admin"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="user-menu__dropdown-icon"
                  >
                    <path
                      d="M4 6H16M4 10H16M4 14H16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Admin Dashboard
                </button>

                <button
                  onClick={() => handleMenuItemClick('/admin/products')}
                  className="user-menu__dropdown-item"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="user-menu__dropdown-icon"
                  >
                    <path
                      d="M5 4H15C16.1046 4 17 4.89543 17 6V14C17 15.1046 16.1046 16 15 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                  Manage Products
                </button>

                <button
                  onClick={() => handleMenuItemClick('/admin/orders')}
                  className="user-menu__dropdown-item"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="user-menu__dropdown-icon"
                  >
                    <path
                      d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                  Manage Orders
                </button>

                <div className="user-menu__dropdown-separator" />

                <button
                  onClick={() => handleMenuItemClick('/profile')}
                  className="user-menu__dropdown-item"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="user-menu__dropdown-icon"
                  >
                    <path
                      d="M10 2C6.68629 2 4 4.68629 4 8C4 11.3137 6.68629 14 10 14C13.3137 14 16 11.3137 16 8C16 4.68629 13.3137 2 10 2ZM10 18C6.13401 18 3 14.866 3 11V10C3 9.44772 3.44772 9 4 9H16C16.5523 9 17 9.44772 17 10V11C17 14.866 13.866 18 10 18Z"
                      fill="currentColor"
                    />
                  </svg>
                  My Profile
                </button>
              </>
            )}

            <div className="user-menu__dropdown-separator" />

            {/* Settings */}
            <button
              onClick={() => handleMenuItemClick('/settings')}
              className="user-menu__dropdown-item"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="user-menu__dropdown-icon">
                <path
                  d="M10 6C8.89543 6 8 6.89543 8 8C8 9.10457 8.89543 10 10 10C11.1046 10 12 9.10457 12 8C12 6.89543 11.1046 6 10 6Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 2C8.44772 2 8 2.44772 8 3V4.27924C7.33179 4.47251 6.7071 4.77088 6.14963 5.15706L5.28033 4.28776C4.88981 3.89724 4.25664 3.89724 3.86612 4.28776C3.4756 4.67829 3.4756 5.31145 3.86612 5.70198L4.73542 6.57128C4.34924 7.12875 4.05087 7.75344 3.8576 8.42165H2.58579C2.03351 8.42165 1.58579 8.86937 1.58579 9.42165C1.58579 9.97394 2.03351 10.4217 2.58579 10.4217H3.8576C4.05087 11.0899 4.34924 11.7146 4.73542 12.272L3.86612 13.1413C3.4756 13.5319 3.4756 14.165 3.86612 14.5556C4.25664 14.9461 4.88981 14.9461 5.28033 14.5556L6.14963 13.6863C6.7071 14.0724 7.33179 14.3708 8 14.5641V15.8358C8 16.3881 8.44772 16.8358 9 16.8358C9.55228 16.8358 10 16.3881 10 15.8358V14.5641C10.6682 14.3708 11.2929 14.0724 11.8504 13.6863L12.7197 14.5556C13.1102 14.9461 13.7434 14.9461 14.1339 14.5556C14.5244 14.165 14.5244 13.5319 14.1339 13.1413L13.2646 12.272C13.6508 11.7146 13.9491 11.0899 14.1424 10.4217H15.4142C15.9665 10.4217 16.4142 9.97394 16.4142 9.42165C16.4142 8.86937 15.9665 8.42165 15.4142 8.42165H14.1424C13.9491 7.75344 13.6508 7.12875 13.2646 6.57128L14.1339 5.70198C14.5244 5.31145 14.5244 4.67829 14.1339 4.28776C13.7434 3.89724 13.1102 3.89724 12.7197 4.28776L11.8504 5.15706C11.2929 4.77088 10.6682 4.47251 10 4.27924V3C10 2.44772 9.55228 2 9 2Z"
                  fill="currentColor"
                />
              </svg>
              Settings
            </button>

            {/* Help */}
            <button
              onClick={() => handleMenuItemClick('/help')}
              className="user-menu__dropdown-item"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="user-menu__dropdown-icon">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10ZM10 7C9.63113 7 9.3076 7.19922 9.13318 7.50073C8.85664 7.97879 8.24491 8.14215 7.76685 7.86561C7.28879 7.58906 7.12543 6.97733 7.40197 6.49927C7.91918 5.60518 8.88833 5 10 5C11.6569 5 13 6.34315 13 8C13 9.30622 12.1652 10.4175 11 10.8293V11C11 11.5523 10.5523 12 10 12C9.44772 12 9 11.5523 9 11V10C9 9.44772 9.44772 9 10 9C10.5523 9 11 8.55228 11 8C11 7.44772 10.5523 7 10 7ZM10 15C10.5523 15 11 14.5523 11 14C11 13.4477 10.5523 13 10 13C9.44772 13 9 13.4477 9 14C9 14.5523 9.44772 15 10 15Z"
                  fill="currentColor"
                />
              </svg>
              Help & Support
            </button>

            <div className="user-menu__dropdown-separator" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="user-menu__dropdown-item user-menu__dropdown-item--logout"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="user-menu__dropdown-icon">
                <path
                  d="M17 7L17 13M14 10L17 10M17 10L20 10M9 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
