import React, { useState } from 'react';
import { Plus, Package, Zap, Users, BarChart3, Home, Settings, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const QuickActions = () => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (actionType, actionData = {}) => {
    setActionLoading(prev => ({ ...prev, [actionType]: true }));

    try {
      switch (actionType) {
        case 'addProduct':
          // Navigate to add product page
          window.location.href = '/admin/products/add';
          break;
        
        case 'createFlashSale':
          // Navigate to create flash sale page
          window.location.href = '/admin/flash-sales/create';
          break;
        
        case 'inviteAdmin':
          // Navigate to admin invitation page
          window.location.href = '/admin/users/invite';
          break;
        
        case 'manageOrders':
          // Navigate to orders management
          window.location.href = '/admin/orders';
          break;
        
        case 'viewAnalytics':
          // Navigate to analytics page
          window.location.href = '/admin/analytics';
          break;
        
        case 'editHomepage':
          // Navigate to homepage editor
          window.location.href = '/admin/homepage';
          break;
        
        case 'bulkProductUpdate':
          // Navigate to bulk product operations
          window.location.href = '/admin/products?view=bulk';
          break;
        
        case 'exportReport':
          // Handle report export
          await handleExportReport();
          break;
        
        default:
          console.log(`Action ${actionType} not implemented`);
      }
    } catch (error) {
      console.error(`Error executing ${actionType}:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionType]: false }));
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/v1/admin/analytics/overview/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const primaryActions = [
    {
      id: 'addProduct',
      title: 'Add Product',
      description: 'Add new products to inventory',
      icon: Package,
      color: 'primary',
      priority: 'high'
    },
    {
      id: 'createFlashSale',
      title: 'Create Flash Sale',
      description: 'Setup time-limited promotions',
      icon: Zap,
      color: 'warning',
      priority: 'high'
    },
    {
      id: 'manageOrders',
      title: 'Manage Orders',
      description: 'View and process customer orders',
      icon: CheckCircle,
      color: 'success',
      priority: 'high'
    },
    {
      id: 'inviteAdmin',
      title: 'Invite Admin',
      description: 'Send admin invitations',
      icon: Users,
      color: 'info',
      priority: 'medium'
    }
  ];

  const secondaryActions = [
    {
      id: 'viewAnalytics',
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: BarChart3,
      color: 'info',
      priority: 'medium'
    },
    {
      id: 'editHomepage',
      title: 'Edit Homepage',
      description: 'Manage homepage content',
      icon: Home,
      color: 'secondary',
      priority: 'low'
    },
    {
      id: 'bulkProductUpdate',
      title: 'Bulk Operations',
      description: 'Update multiple products',
      icon: Settings,
      color: 'secondary',
      priority: 'low'
    },
    {
      id: 'exportReport',
      title: 'Export Report',
      description: 'Download analytics report',
      icon: TrendingUp,
      color: 'secondary',
      priority: 'low'
    }
  ];

  const getActionColor = (color) => {
    const colors = {
      primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/25',
      warning: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/25',
      success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-green-500/25',
      info: 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-cyan-500/25',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-gray-500/25'
    };
    return colors[color] || colors.secondary;
  };

  const ActionButton = ({ action, size = 'default' }) => {
    const isLoading = actionLoading[action.id];
    const Icon = action.icon;
    
    const sizeClasses = {
      small: 'p-3 text-sm',
      default: 'p-4 text-base',
      large: 'p-6 text-lg'
    };

    const iconSizes = {
      small: 18,
      default: 20,
      large: 24
    };

    return (
      <button
        onClick={() => handleAction(action.id)}
        disabled={isLoading}
        className={`
          ${getActionColor(action.color)}
          ${sizeClasses[size]}
          rounded-xl font-medium transition-all duration-200 
          flex items-center justify-center gap-3 w-full
          hover:shadow-lg hover:-translate-y-0.5
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:transform-none disabled:shadow-none
          group
        `}
        title={action.description}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Icon 
              size={iconSizes[size]} 
              className="group-hover:scale-110 transition-transform duration-200" 
            />
            <span className="font-semibold">{action.title}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="quick-actions-container">
      <div className="card h-full">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Actions
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Frequently used admin operations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                <span>Shortcuts</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {/* Primary Actions - Most Important */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Priority Actions
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {primaryActions.map((action) => (
                  <ActionButton key={action.id} action={action} size="default" />
                ))}
              </div>
            </div>

            {/* Secondary Actions - Less Critical */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Additional Tools
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {secondaryActions.map((action) => (
                  <ActionButton key={action.id} action={action} size="small" />
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Quick Stats
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="text-lg font-bold text-blue-700">12</div>
                  <div className="text-xs text-blue-600">Pending Orders</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <div className="text-lg font-bold text-green-700">5</div>
                  <div className="text-xs text-green-600">Active Flash Sales</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="text-lg font-bold text-orange-700">8</div>
                  <div className="text-xs text-orange-600">Low Stock Items</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <div className="text-lg font-bold text-purple-700">3</div>
                  <div className="text-xs text-purple-600">COD Orders</div>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Need Help?</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Access our admin guide or contact support for assistance with any operations.
                  </div>
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
                    onClick={() => window.open('/admin/help', '_blank')}
                  >
                    View Admin Guide →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;