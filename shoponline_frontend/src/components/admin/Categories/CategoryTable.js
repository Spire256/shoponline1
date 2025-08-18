// src/components/admin/Categories/CategoryTable.js

import React from 'react';
import {
  Edit,
  Trash2,
  Eye,
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
  Package,
  FolderTree,
} from 'lucide-react';

const CategoryTable = ({
  categories,
  loading,
  selectedCategories,
  onSelectCategory,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = isActive => {
    return (
      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getFeaturedBadge = featured => {
    return featured ? (
      <span className="featured-badge">
        <Star className="icon" />
        Featured
      </span>
    ) : null;
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner" />
        <p>Loading categories...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="empty-state">
        <FolderTree className="empty-icon" />
        <h3>No Categories Found</h3>
        <p>Start by creating your first category to organize your products.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="category-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                checked={selectedCategories.length === categories.length && categories.length > 0}
                onChange={onSelectAll}
                aria-label="Select all categories"
              />
            </th>
            <th>Category</th>
            <th>Parent</th>
            <th>Products</th>
            <th>Status</th>
            <th>Sort Order</th>
            <th>Created</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={category.id} className="category-row">
              <td className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => onSelectCategory(category.id)}
                  aria-label={`Select ${category.name}`}
                />
              </td>

              <td className="category-info">
                <div className="category-details">
                  <div className="category-image">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="category-thumbnail"
                      />
                    ) : (
                      <div className="category-placeholder">
                        <FolderTree className="placeholder-icon" />
                      </div>
                    )}
                  </div>
                  <div className="category-text">
                    <div className="category-name">
                      {category.name}
                      {getFeaturedBadge(category.featured)}
                    </div>
                    {category.description && (
                      <div className="category-description">
                        {category.description.length > 100
                          ? `${category.description.substring(0, 100)}...`
                          : category.description}
                      </div>
                    )}
                    <div className="category-meta">
                      <span className="slug">/{category.slug}</span>
                    </div>
                  </div>
                </div>
              </td>

              <td className="parent-col">
                {category.parent_details ? (
                  <div className="parent-info">
                    <span className="parent-name">{category.parent_details.name}</span>
                  </div>
                ) : (
                  <span className="root-category">Root Category</span>
                )}
              </td>

              <td className="products-col">
                <div className="product-count">
                  <Package className="icon" />
                  <span>{category.product_count || 0}</span>
                </div>
                {category.subcategory_count > 0 && (
                  <div className="subcategory-count">
                    <FolderTree className="icon" />
                    <span>{category.subcategory_count} subcategories</span>
                  </div>
                )}
              </td>

              <td className="status-col">
                <div className="status-badges">{getStatusBadge(category.is_active)}</div>
              </td>

              <td className="sort-order-col">
                <span className="sort-order">{category.sort_order}</span>
              </td>

              <td className="date-col">
                <span className="date">{formatDate(category.created_at)}</span>
              </td>

              <td className="actions-col">
                <div className="action-buttons">
                  {/* Toggle Active Status */}
                  <button
                    className={`action-btn toggle-btn ${category.is_active ? 'active' : ''}`}
                    onClick={() => onToggleStatus(category.slug, 'is_active')}
                    title={category.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {category.is_active ? (
                      <ToggleRight className="icon" />
                    ) : (
                      <ToggleLeft className="icon" />
                    )}
                  </button>

                  {/* Toggle Featured Status */}
                  <button
                    className={`action-btn star-btn ${category.featured ? 'featured' : ''}`}
                    onClick={() => onToggleStatus(category.slug, 'featured')}
                    title={category.featured ? 'Unfeature' : 'Feature'}
                  >
                    {category.featured ? (
                      <Star className="icon filled" />
                    ) : (
                      <StarOff className="icon" />
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    className="action-btn edit-btn"
                    onClick={() => onEdit(category)}
                    title="Edit Category"
                  >
                    <Edit className="icon" />
                  </button>

                  {/* Delete Button */}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => onDelete(category.slug)}
                    title="Delete Category"
                    disabled={category.product_count > 0 || category.subcategory_count > 0}
                  >
                    <Trash2 className="icon" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;
