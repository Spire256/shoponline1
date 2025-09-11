import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  StarOff, 
  Power, 
  MoreVertical,
  Package,
  FolderOpen,
  Image,
  ExternalLink,
  TreePine,
  ChevronRight
} from 'lucide-react';

const CategoryTable = ({
  categories = [],
  loading = false,
  selectedCategories = [],
  onSelectCategory,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const [sortField, setSortField] = useState('sort_order');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showActions, setShowActions] = useState(null);

  // Sort categories based on backend fields
  const sortedCategories = [...categories].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    const allSelected = selectedCategories.length === categories.length;
    onSelectAll(!allSelected);
  };

  const handleCategorySelect = (categoryId) => {
    const isSelected = selectedCategories.includes(categoryId);
    onSelectCategory(categoryId, !isSelected);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getFeaturedBadge = (featured) => {
    return featured ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <Star className="w-3 h-3 mr-1" />
        Featured
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <StarOff className="w-3 h-3 mr-1" />
        Not Featured
      </span>
    );
  };

  const CategoryActionMenu = ({ category, onClose }) => (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="py-1">
        <button 
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => {
            onEdit(category);
            onClose();
          }}
        >
          <Edit className="w-4 h-4 mr-3" />
          Edit Category
        </button>
        
        <button 
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => {
            onToggleStatus(category.id, 'featured');
            onClose();
          }}
        >
          {category.featured ? (
            <>
              <StarOff className="w-4 h-4 mr-3" />
              Remove Featured
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-3" />
              Set Featured
            </>
          )}
        </button>
        
        <button 
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => {
            onToggleStatus(category.id, 'is_active');
            onClose();
          }}
        >
          <Power className="w-4 h-4 mr-3" />
          {category.is_active ? 'Deactivate' : 'Activate'}
        </button>
        
        {category.slug && (
          <button 
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              window.open(`/categories/${category.slug}`, '_blank');
              onClose();
            }}
          >
            <ExternalLink className="w-4 h-4 mr-3" />
            View on Site
          </button>
        )}
        
        <hr className="my-1" />
        
        <button 
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this category?')) {
              onDelete(category.id);
            }
            onClose();
          }}
        >
          <Trash2 className="w-4 h-4 mr-3" />
          Delete Category
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-12 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-gray-100 p-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-200 h-4 w-4 rounded"></div>
                <div className="bg-gray-200 h-12 w-12 rounded-lg"></div>
                <div className="flex-1">
                  <div className="bg-gray-200 h-4 w-32 mb-2 rounded"></div>
                  <div className="bg-gray-200 h-3 w-24 rounded"></div>
                </div>
                <div className="bg-gray-200 h-6 w-16 rounded-full"></div>
                <div className="bg-gray-200 h-6 w-20 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Found</h3>
          <p className="text-gray-600 mb-6">Start by creating your first product category to organize your store.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Create First Category
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCategories.length === categories.length && categories.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  {sortField === 'name' && (
                    <ChevronRight className={`w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                  )}
                </div>
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('product_count')}
              >
                <div className="flex items-center space-x-1">
                  <span>Products</span>
                  {sortField === 'product_count' && (
                    <ChevronRight className={`w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                  )}
                </div>
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Featured
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {sortField === 'created_at' && (
                    <ChevronRight className={`w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                  )}
                </div>
              </th>
              
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCategories.map(category => (
              <tr 
                key={category.id}
                className={`hover:bg-gray-50 ${selectedCategories.includes(category.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategorySelect(category.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <div className="flex items-center">
                        {category.parent && (
                          <TreePine className="w-4 h-4 text-gray-400 mr-1" />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        /{category.slug}
                        {category.parent && (
                          <span className="text-gray-400 ml-2">
                            in {category.parent.name || 'Parent Category'}
                          </span>
                        )}
                      </div>
                      
                      {category.subcategory_count > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {category.subcategory_count} subcategories
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  {category.description ? (
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={category.description}>
                      {category.description.length > 80 
                        ? `${category.description.substring(0, 80)}...`
                        : category.description
                      }
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No description</span>
                  )}
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                    {category.product_count || 0}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  {getFeaturedBadge(category.featured)}
                </td>
                
                <td className="px-6 py-4">
                  {getStatusBadge(category.is_active)}
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>{formatDate(category.created_at)}</div>
                  {category.updated_at !== category.created_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      Updated: {formatDate(category.updated_at)}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => window.open(`/categories/${category.slug}`, '_blank')}
                      title="View on site"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => onEdit(category)}
                      title="Edit category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <div className="relative">
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowActions(showActions === category.id ? null : category.id)}
                        title="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {showActions === category.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActions(null)}
                          />
                          <CategoryActionMenu
                            category={category}
                            onClose={() => setShowActions(null)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;