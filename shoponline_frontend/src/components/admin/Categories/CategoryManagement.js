// src/components/admin/Categories/CategoryManagement.js

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Upload, Download, Trash2, Edit, Eye } from 'lucide-react';
import CategoryTable from './CategoryTable';
import AddCategory from './AddCategory';
import EditCategory from './EditCategory';
import { categoriesAPI } from '../../../services/api/categoriesAPI';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // State management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    parent: '',
    featured: '',
    is_active: '',
    sort_by: 'sort_order',
  });
  const [stats, setStats] = useState({
    total_categories: 0,
    active_categories: 0,
    featured_categories: 0,
    root_categories: 0,
  });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await categoriesAPI.getCategories(params);

      setCategories(response.results || []);
      setTotalPages(Math.ceil(response.count / (response.page_size || 20)));
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters, showNotification]);

  // Fetch category statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await categoriesAPI.getCategoryStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Search handler with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchCategories();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Filter change handler
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  // Clear all filters
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

  // Category selection handlers
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

  // Bulk actions
  const handleBulkAction = async action => {
    if (selectedCategories.length === 0) {
      showNotification('Please select categories to perform bulk action', 'warning');
      return;
    }

    try {
      await categoriesAPI.bulkAction({
        category_ids: selectedCategories,
        action: action,
      });

      showNotification(
        `Successfully ${action}d ${selectedCategories.length} categories`,
        'success'
      );
      setSelectedCategories([]);
      fetchCategories();
      fetchStats();
    } catch (error) {
      console.error('Bulk action error:', error);
      showNotification(`Failed to ${action} categories`, 'error');
    }
  };

  // Category CRUD handlers
  const handleAddCategory = () => {
    setShowAddModal(true);
  };

  const handleEditCategory = category => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = async categoryId => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoriesAPI.deleteCategory(categoryId);
      showNotification('Category deleted successfully', 'success');
      fetchCategories();
      fetchStats();
    } catch (error) {
      console.error('Delete category error:', error);
      showNotification('Failed to delete category', 'error');
    }
  };

  const handleToggleStatus = async (categoryId, field) => {
    try {
      if (field === 'featured') {
        await categoriesAPI.toggleFeatured(categoryId);
        showNotification('Category featured status updated', 'success');
      } else if (field === 'is_active') {
        await categoriesAPI.toggleActive(categoryId);
        showNotification('Category active status updated', 'success');
      }

      fetchCategories();
      fetchStats();
    } catch (error) {
      console.error('Toggle status error:', error);
      showNotification('Failed to update category status', 'error');
    }
  };

  // Success handlers for modals
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

  // Export categories
  const handleExport = async () => {
    try {
      // This would typically generate and download a CSV/Excel file
      showNotification('Export feature coming soon', 'info');
    } catch (error) {
      showNotification('Failed to export categories', 'error');
    }
  };

  return (
    <div className="category-management">
      {/* Header */}
      <div className="category-management__header">
        <div className="header-left">
          <h1>Category Management</h1>
          <p>Manage your product categories and organization structure</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleExport}>
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
          <div className="stat-value">{stats.total_categories}</div>
          <div className="stat-label">Total Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active_categories}</div>
          <div className="stat-label">Active Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.featured_categories}</div>
          <div className="stat-label">Featured Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.root_categories}</div>
          <div className="stat-label">Root Categories</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={filters.featured}
            onChange={e => handleFilterChange('featured', e.target.value)}
          >
            <option value="">All Featured Status</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>

          <select
            value={filters.is_active}
            onChange={e => handleFilterChange('is_active', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select
            value={filters.parent}
            onChange={e => handleFilterChange('parent', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="root">Root Categories Only</option>
          </select>

          <select
            value={filters.sort_by}
            onChange={e => handleFilterChange('sort_by', e.target.value)}
          >
            <option value="sort_order">Sort Order</option>
            <option value="name">Name A-Z</option>
            <option value="-name">Name Z-A</option>
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
          </select>

          <button className="btn btn-outline btn-sm" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCategories.length > 0 && (
        <div className="bulk-actions">
          <span className="bulk-count">{selectedCategories.length} categories selected</span>
          <div className="bulk-buttons">
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('activate')}>
              Activate
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleBulkAction('deactivate')}
            >
              Deactivate
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkAction('feature')}>
              Feature
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleBulkAction('unfeature')}
            >
              Unfeature
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="icon" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="categories-table-container">
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>

          <div className="page-info">
            Page {currentPage} of {totalPages} ({totalCount} total)
          </div>

          <button
            className="btn btn-outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddCategory onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
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
