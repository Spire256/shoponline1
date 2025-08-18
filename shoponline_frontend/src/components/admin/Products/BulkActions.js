import React, { useState } from 'react';

const BulkActions = ({
  selectedCount = 0,
  selectedIds = [],
  onAction,
  onCancel,
  categories = [],
}) => {
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [actionData, setActionData] = useState({
    categoryId: '',
    priceAdjustment: '',
    priceAdjustmentType: 'fixed',
    stockAdjustment: '',
    stockAdjustmentType: 'set',
  });
  const [processing, setProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Sample categories for demonstration
  const sampleCategories = categories.length > 0 ? categories : [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Clothing' },
    { id: '3', name: 'Home & Garden' },
    { id: '4', name: 'Sports & Outdoors' },
    { id: '5', name: 'Books' }
  ];

  const bulkActions = [
    {
      value: 'activate',
      label: 'Activate Products',
      icon: '✅',
      description: 'Make products visible to customers',
    },
    {
      value: 'deactivate',
      label: 'Deactivate Products',
      icon: '❌',
      description: 'Hide products from customers',
    },
    {
      value: 'feature',
      label: 'Feature Products',
      icon: '⭐',
      description: 'Mark products as featured',
    },
    {
      value: 'unfeature',
      label: 'Unfeature Products',
      icon: '☆',
      description: 'Remove featured status',
    },
    {
      value: 'update_category',
      label: 'Change Category',
      icon: '📁',
      description: 'Move products to different category',
    },
    {
      value: 'update_price',
      label: 'Update Prices',
      icon: '💰',
      description: 'Adjust prices for selected products',
    },
    {
      value: 'update_stock',
      label: 'Update Stock',
      icon: '📦',
      description: 'Adjust inventory levels',
    },
    {
      value: 'delete',
      label: 'Delete Products',
      icon: '🗑️',
      description: 'Permanently delete selected products',
      danger: true,
    },
  ];

  const handleActionSelect = action => {
    setSelectedAction(action);

    // Show additional options for certain actions
    if (['update_category', 'update_price', 'update_stock'].includes(action)) {
      setShowActionPanel(true);
    } else {
      // For simple actions, show confirmation
      setConfirmAction(action);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedAction) return;

    try {
      setProcessing(true);

      const actionPayload = {
        product_ids: selectedIds,
        action: selectedAction
      };

      // Add additional data based on action type
      if (selectedAction === 'update_category') {
        actionPayload.category_id = actionData.categoryId;
      } else if (selectedAction === 'update_price') {
        actionPayload.price_adjustment = parseFloat(actionData.priceAdjustment);
        actionPayload.price_adjustment_type = actionData.priceAdjustmentType;
      } else if (selectedAction === 'update_stock') {
        actionPayload.stock_adjustment = parseInt(actionData.stockAdjustment);
        actionPayload.stock_adjustment_type = actionData.stockAdjustmentType;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (onAction) {
        onAction(selectedAction, selectedIds, actionPayload);
      }

      // Reset state
      handleCancel();

    } catch (error) {
      console.error('Error executing bulk action:', error);
      alert('Failed to execute bulk action. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedAction('');
    setShowActionPanel(false);
    setConfirmAction(null);
    setActionData({
      categoryId: '',
      priceAdjustment: '',
      priceAdjustmentType: 'fixed',
      stockAdjustment: '',
      stockAdjustmentType: 'set',
    });
    if (onCancel) onCancel();
  };

  const getActionDescription = actionValue => {
    const action = bulkActions.find(a => a.value === actionValue);
    return action ? action.description : '';
  };

  const validateActionData = () => {
    switch (selectedAction) {
      case 'update_category':
        return actionData.categoryId !== '';
      case 'update_price':
        return actionData.priceAdjustment !== '' && !isNaN(parseFloat(actionData.priceAdjustment));
      case 'update_stock':
        return actionData.stockAdjustment !== '' && !isNaN(parseInt(actionData.stockAdjustment));
      default:
        return true;
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
                  {selectedCount}
                </span>
                <span className="text-gray-700">
                  {selectedCount === 1 ? 'product selected' : 'products selected'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              {bulkActions.map(action => (
                <button
                  key={action.value}
                  onClick={() => handleActionSelect(action.value)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action.danger
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : selectedAction === action.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={action.description}
                  disabled={processing}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={handleCancel} 
              className="text-gray-500 hover:text-gray-700 font-medium px-3 py-2" 
              disabled={processing}
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Action Configuration Panel */}
      {showActionPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Action</h3>
              <p className="text-gray-600">{getActionDescription(selectedAction)}</p>
            </div>

            <div className="p-6 space-y-4">
              {selectedAction === 'update_category' && (
                <div>
                  <label htmlFor="categorySelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Category:
                  </label>
                  <select
                    id="categorySelect"
                    value={actionData.categoryId}
                    onChange={e => setActionData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose category...</option>
                    {sampleCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedAction === 'update_price' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="priceAdjustment" className="block text-sm font-medium text-gray-700 mb-2">
                      Price Adjustment:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        id="priceAdjustment"
                        value={actionData.priceAdjustment}
                        onChange={e =>
                          setActionData(prev => ({ ...prev, priceAdjustment: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter amount"
                        step="0.01"
                      />
                      <select
                        value={actionData.priceAdjustmentType}
                        onChange={e =>
                          setActionData(prev => ({ ...prev, priceAdjustmentType: e.target.value }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="fixed">Fixed Amount (UGX)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    {actionData.priceAdjustmentType === 'fixed' ? (
                      <p className="text-sm text-blue-800">
                        Will add <strong>UGX {actionData.priceAdjustment || 0}</strong> to each
                        product's price
                      </p>
                    ) : (
                      <p className="text-sm text-blue-800">
                        Will adjust prices by <strong>{actionData.priceAdjustment || 0}%</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedAction === 'update_stock' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="stockAdjustment" className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Adjustment:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        id="stockAdjustment"
                        value={actionData.stockAdjustment}
                        onChange={e =>
                          setActionData(prev => ({ ...prev, stockAdjustment: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter quantity"
                        min="0"
                      />
                      <select
                        value={actionData.stockAdjustmentType}
                        onChange={e =>
                          setActionData(prev => ({ ...prev, stockAdjustmentType: e.target.value }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="set">Set To</option>
                        <option value="add">Add</option>
                        <option value="subtract">Subtract</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    {actionData.stockAdjustmentType === 'set' ? (
                      <p className="text-sm text-blue-800">
                        Will set stock quantity to{' '}
                        <strong>{actionData.stockAdjustment || 0}</strong> for all selected products
                      </p>
                    ) : actionData.stockAdjustmentType === 'add' ? (
                      <p className="text-sm text-blue-800">
                        Will add <strong>{actionData.stockAdjustment || 0}</strong> to current stock
                        quantities
                      </p>
                    ) : (
                      <p className="text-sm text-blue-800">
                        Will subtract <strong>{actionData.stockAdjustment || 0}</strong> from
                        current stock quantities
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowActionPanel(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (validateActionData()) {
                    setShowActionPanel(false);
                    setConfirmAction(selectedAction);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={!validateActionData() || processing}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Bulk Action</h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700">
                  Are you sure you want to{' '}
                  <strong>
                    {bulkActions.find(a => a.value === confirmAction)?.label.toLowerCase()}
                  </strong>
                  ?
                </p>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Action:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {bulkActions.find(a => a.value === confirmAction)?.label}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Products affected:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedCount}</span>
                  </div>

                  {confirmAction === 'update_category' && actionData.categoryId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">New category:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {sampleCategories.find(c => c.id === actionData.categoryId)?.name}
                      </span>
                    </div>
                  )}

                  {confirmAction === 'update_price' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price adjustment:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {actionData.priceAdjustmentType === 'fixed'
                          ? `+UGX ${actionData.priceAdjustment}`
                          : `${actionData.priceAdjustment}%`}
                      </span>
                    </div>
                  )}

                  {confirmAction === 'update_stock' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stock adjustment:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {actionData.stockAdjustmentType === 'set'
                          ? `Set to ${actionData.stockAdjustment}`
                          : `${actionData.stockAdjustmentType === 'add' ? '+' : '-'}${
                              actionData.stockAdjustment
                            }`}
                      </span>
                    </div>
                  )}
                </div>

                {confirmAction === 'delete' && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-800">
                      ⚠️ <strong>Warning:</strong> This action cannot be undone. Products
                      will be permanently removed from your inventory.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  confirmAction === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                disabled={processing}
              >
                {processing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Confirm ${bulkActions.find(a => a.value === confirmAction)?.label}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium mb-2">Processing {selectedCount} products...</p>
            <p className="text-sm text-gray-600">
              Executing: {bulkActions.find(a => a.value === selectedAction)?.label}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActions;