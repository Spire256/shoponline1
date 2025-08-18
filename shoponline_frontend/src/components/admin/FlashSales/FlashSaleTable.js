import React from 'react';
import {
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Clock,
  Package,
  TrendingUp,
} from 'lucide-react';

const FlashSaleTable = ({
  flashSales = [],
  onEdit,
  onDelete,
  onToggleStatus,
  getStatusBadge,
  loading,
}) => {
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
    }).format(amount || 0);
  };

  const formatDateTime = dateString => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const formatTimeRemaining = seconds => {
    if (!seconds || seconds <= 0) return 'Expired';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getRowClassName = flashSale => {
    if (flashSale.is_running) return 'bg-green-50 border-green-200';
    if (flashSale.is_upcoming) return 'bg-blue-50 border-blue-200';
    if (flashSale.is_expired) return 'bg-gray-50 border-gray-200';
    return 'bg-white border-gray-200';
  };

  // Mock status badge function if not provided
  const defaultGetStatusBadge = (flashSale) => {
    if (flashSale.is_running) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Running</span>;
    }
    if (flashSale.is_upcoming) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Upcoming</span>;
    }
    if (flashSale.is_expired) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Inactive</span>;
  };

  const statusBadgeFunc = getStatusBadge || defaultGetStatusBadge;

  if (loading && flashSales.length === 0) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-sm border">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading flash sales...</p>
        </div>
      </div>
    );
  }

  if (flashSales.length === 0) {
    return (
      <div className="p-12 bg-white rounded-lg shadow-sm border text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Clock size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Flash Sales Found</h3>
          <p className="text-gray-600 max-w-md">Create your first flash sale to start offering time-limited discounts to customers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flash Sale</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {flashSales.map(flashSale => (
              <tr key={flashSale.id} className={`${getRowClassName(flashSale)} hover:bg-gray-50 transition-colors`}>
                {/* Flash Sale Info */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{flashSale.name}</h4>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          Priority: {flashSale.priority}
                        </span>
                      </div>
                    </div>
                    {flashSale.description && (
                      <p className="text-sm text-gray-600 max-w-xs">{flashSale.description}</p>
                    )}
                    <div className="text-xs text-gray-500">Created by: {flashSale.created_by_name}</div>
                  </div>
                </td>

                {/* Discount Info */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-green-600">{flashSale.discount_percentage}% OFF</div>
                    {flashSale.max_discount_amount && (
                      <div className="text-sm text-gray-600">
                        Max: {formatCurrency(flashSale.max_discount_amount)}
                      </div>
                    )}
                  </div>
                </td>

                {/* Timing Info */}
                <td className="px-6 py-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong className="text-gray-900">Start:</strong> <span className="text-gray-600">{formatDateTime(flashSale.start_time)}</span>
                    </div>
                    <div>
                      <strong className="text-gray-900">End:</strong> <span className="text-gray-600">{formatDateTime(flashSale.end_time)}</span>
                    </div>
                    {flashSale.is_running && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Clock size={14} />
                        <span className="font-medium">{formatTimeRemaining(flashSale.time_remaining)} left</span>
                      </div>
                    )}
                    {flashSale.is_upcoming && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Clock size={14} />
                        <span className="font-medium">Starts in {formatTimeRemaining(flashSale.time_remaining)}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    {statusBadgeFunc(flashSale)}
                    <div>
                      <button
                        className={`flex items-center justify-center w-10 h-6 rounded-full transition-colors ${
                          flashSale.is_active 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        onClick={() => onToggleStatus && onToggleStatus(flashSale.id, flashSale.is_active)}
                        title={flashSale.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {flashSale.is_active ? 
                          <ToggleRight size={18} className="text-white" /> : 
                          <ToggleLeft size={18} className="text-white" />
                        }
                      </button>
                    </div>
                  </div>
                </td>

                {/* Products Count */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Package size={16} />
                    <span>{flashSale.products_count} products</span>
                  </div>
                </td>

                {/* Performance Metrics */}
                <td className="px-6 py-4">
                  <div>
                    {flashSale.is_running || flashSale.is_expired ? (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                        <TrendingUp size={14} />
                        <span>View Analytics</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <span>No data yet</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => window.open(`/admin/flash-sales/${flashSale.id}`, '_blank')}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                      onClick={() => onEdit && onEdit(flashSale)}
                      title="Edit Flash Sale"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      className={`p-2 rounded-lg transition-colors ${
                        flashSale.is_running
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                      }`}
                      onClick={() => onDelete && onDelete(flashSale.id)}
                      title="Delete Flash Sale"
                      disabled={flashSale.is_running}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && flashSales.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default FlashSaleTable;