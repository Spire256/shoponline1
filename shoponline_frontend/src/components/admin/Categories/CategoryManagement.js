// src/components/admin/Categories/CategoryManagement.js - Updated to align with Django backend

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Upload, Download, Trash2, Edit, Eye, AlertCircle } from 'lucide-react';
import CategoryTable from './CategoryTable';
import AddCategory from './AddCategory';
import EditCategory from './EditCategory';
import categoriesAPI from '../../../services/api/categoriesAPI';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';
import LoadingSpinner from '../../common/UI/Loading/Spinner';
import Alert from '../../common/UI/Alert/Alert';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // State management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    parent: '',
    featured: '',
    is_active: '',
    sort_by: 'sort_order',
  });

  // Stats state
  const [stats, setStats] = useState({
    overview: {
      total_categories: 0,
      active_categories: 0,
      featured_categories: 0,
      root_categories: 0,
      inactive_categories: 0,
    },
    structure: {
      max_depth: 0,
      categories_with_products: 0,
      empty_categories: 0,
    },
    top_categories: [],
    recent_activity: {
      new_categories_this_month: 0,
    },
  });

  // Action state
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Fetch categories with error handling
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        page_size: pageSize,
        ordering: filters.sort_by,
      };

      // Add search parameter
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add filter parameters (only if they have values)
      if (filters.featured !== '') {
        params.featured = filters.featured === 'true';
      }
      if (filters.is_active !== '') {
        params.is_active = filters.is_active === 'true';
      }
      if (filters.parent !== '') {
        if (filters.parent === 'root') {
          // Don't add parent param to get root categories
        } else {
          params.parent = filters.parent;
        }
      }

      const response = await categoriesAPI.getCategories(params);

      setCategories(response.results || []);
      setTotalCount(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));

    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
      showNotification('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filters, showNotification]);

  // Fetch category statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await categoriesAPI.getCategoryStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      // Keep default stats if API fails
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchCategories();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Filter change handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      parent: '',
      featured: '',
      is_active: '',
      sort_by: 'sort_order',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Selection handlers
  const handleSelectCategory = categoryId => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(cat => cat.id));
    }
  };

  // Bulk action handler
  const handleBulkAction = async action => {
    if (selectedCategories.length === 0) {
      showNotification('Please select categories to perform bulk action', 'warning');
      return;
    }

    // Confirm destructive actions
    if (action === 'delete') {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedCategories.length} categories? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    try {
      setBulkActionLoading(true);
      
      const response = await categoriesAPI.bulkAction(action, selectedCategories);

      if (response.success) {
        showNotification(
          `Successfully ${action}d ${response.updated_count} of ${response.total_count} categories`,
          'success'
        );

        if (response.errors && response.errors.length > 0) {
          response.errors.forEach(error => {
            showNotification(error, 'warning');
          });
        }
      }

      setSelectedCategories([]);
      await fetchCategories();
      await fetchStats();
      
    } catch (error) {
      console.error('Bulk action error:', error);
      showNotification(
        error.message || `Failed to ${action} categories`,
        'error'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  // CRUD handlers
  const handleAddCategory = () => {
    setShowAddModal(true);
  };

  const handleEditCategory = category => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = async categorySlug => {
    const category = categories.find(cat => cat.slug === categorySlug);
    
    if (category && (category.product_count > 0 || category.subcategory_count > 0)) {
      showNotification(
        'Cannot delete category that has products or subcategories',
        'warning'
      );
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoriesAPI.deleteCategory(categorySlug);
      showNotification('Category deleted successfully', 'success');
      await fetchCategories();
      await fetchStats();
    } catch (error) {
      console.error('Delete category error:', error);
      showNotification(
        error.message || 'Failed to delete category',
        'error'
      );
    }
  };

  const handleToggleStatus = async (categorySlug, field) => {
    try {
      let response;
      if (field === 'featured') {
        response = await categoriesAPI.toggleFeatured(categorySlug);
      } else if (field === 'is_active') {
        response = await categoriesAPI.toggleActive(categorySlug);
      }

      if (response && response.message) {
        showNotification(response.message, 'success');
      } else {
        showNotification(`Category ${field} status updated successfully`, 'success');
      }

      await fetchCategories();
      await fetchStats();
      
    } catch (error) {
      console.error('Toggle status error:', error);
      showNotification(
        error.message || 'Failed to update category status',
        'error'
      );
    }
  };

  // Modal success handlers
  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchCategories();
    fetchStats();
    showNotification('Category created successfully', 'success');
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingCategory(null);
    fetchCategories();
    fetchStats();
    showNotification('Category updated successfully', 'success');
  };

  // Export handler
  const handleExport = async () => {
    try {
      showNotification('Export functionality will be implemented soon', 'info');
    } catch (error) {
      showNotification('Failed to export categories', 'error');
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="category-management">
        <div className="category-management__error">
          <Alert type="error" title="Error Loading Categories">
            {error}
          </Alert>
          <button className="btn btn-primary" onClick={() => {
            setError(null);
            fetchCategories();
          }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-management">
      {/* Header */}
      <div className="category-management__header">
        <div className="header-left">
          <h1>Category Management</h1>
          <p>Manage your product categories and organizational structure</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline" 
            onClick={handleExport}
            disabled={categories.length === 0}
          >
            <Download className="icon" />
            Export
          </button>
          <button className="btn btn-primary" onClick={handleAddCategory}>
            <Plus className="icon" />
            Add Category
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Eye className="icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.overview.total_categories}</div>
            <div className="stat-label">Total Categories</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <Eye className="icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.overview.active_categories}</div>
            <div className="stat-label">Active Categories</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon featured">
            <Eye className="icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.overview.featured_categories}</div>
            <div className="stat-label">Featured Categories</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Filter className="icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.overview.root_categories}</div>
            <div className="stat-label">Root Categories</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label htmlFor="featured-filter">Featured Status</label>
            <select
              id="featured-filter"
              value={filters.featured}
              onChange={e => handleFilterChange('featured', e.target.value)}
              className="filter-select"
            >
              <option value="">All Featured Status</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Active Status</label>
            <select
              id="status-filter"
              value={filters.is_active}
              onChange={e => handleFilterChange('is_active', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="parent-filter">Category Type</label>
            <select
              id="parent-filter"
              value={filters.parent}
              onChange={e => handleFilterChange('parent', e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="root">Root Categories Only</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-filter">Sort By</label>
            <select
              id="sort-filter"
              value={filters.sort_by}
              onChange={e => handleFilterChange('sort_by', e.target.value)}
              className="filter-select"
            >
              <option value="sort_order">Sort Order</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="product_count">Product Count</option>
            </select>
          </div>

          {(searchTerm || Object.values(filters).some(f => f !== '' && f !== 'sort_order')) && (
            <button className="btn btn-outline btn-sm clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCategories.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span className="bulk-count">
              {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
            </span>
          </div>
          
          <div className="bulk-buttons">
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => handleBulkAction('activate')}
              disabled={bulkActionLoading}
            >
              Activate
            </button>
            
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => handleBulkAction('deactivate')}
              disabled={bulkActionLoading}
            >
              Deactivate
            </button>
            
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => handleBulkAction('feature')}
              disabled={bulkActionLoading}
            >
              Feature
            </button>
            
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => handleBulkAction('unfeature')}
              disabled={bulkActionLoading}
            >
              Unfeature
            </button>
            
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => handleBulkAction('delete')}
              disabled={bulkActionLoading}
            >
              <Trash2 className="icon" />
              Delete
            </button>
            
            {bulkActionLoading && (
              <div className="bulk-loading">
                <LoadingSpinner size="small" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="categories-table-container">
        {loading ? (
          <div className="table-loading">
            <LoadingSpinner size="large" />
            <p>Loading categories...</p>
          </div>
        ) : (
          <CategoryTable
            categories={categories}
            loading={loading}
            selectedCategories={selectedCategories}
            onSelectCategory={handleSelectCategory}
            onSelectAll={handleSelectAll}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{' '}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} categories
            </span>
          </div>

          <div className="pagination-controls">
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
            >
              First
            </button>
            
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>

            <div className="page-numbers">
              {(() => {
                const pages = [];
                const startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(totalPages, currentPage + 2);

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={`btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => handlePageChange(i)}
                    >
                      {i}
                    </button>
                  );
                }

                return pages;
              })()}
            </div>

            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
            
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Filter size={64} />
          </div>
          <h3>No Categories Found</h3>
          <p>
            {searchTerm || Object.values(filters).some(f => f !== '' && f !== 'sort_order')
              ? 'No categories match your current filters. Try adjusting your search or filters.'
              : 'Get started by creating your first category to organize your products.'}
          </p>
          <div className="empty-state-actions">
            {searchTerm || Object.values(filters).some(f => f !== '' && f !== 'sort_order') ? (
              <button className="btn btn-outline" onClick={clearFilters}>
                Clear Filters
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleAddCategory}>
                <Plus className="icon" />
                Create First Category
              </button>
            )}
          </div>
        </div>
      )}

      {/* Additional Stats Section */}
      {stats.top_categories && stats.top_categories.length > 0 && (
        <div className="additional-stats">
          <h3>Top Categories by Product Count</h3>
          <div className="top-categories-list">
            {stats.top_categories.map((category, index) => (
              <div key={category.id} className="top-category-item">
                <span className="rank">#{index + 1}</span>
                <span className="category-name">{category.name}</span>
                <span className="product-count">{category.product_count} products</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddCategory 
          onClose={() => setShowAddModal(false)} 
          onSuccess={handleAddSuccess} 
        />
      )}

      {showEditModal && editingCategory && (
        <EditCategory
          category={editingCategory}
          onClose={() => {
            setShowEditModal(false);
            setEditingCategory(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default CategoryManagement;