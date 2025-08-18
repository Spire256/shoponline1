import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ShoppingCart,
  User,
  Calendar,
  CreditCard,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  AlertTriangle,
  MoreVertical,
  Download,
  Edit,
  Phone,
  MapPin,
  Package,
} from 'lucide-react';

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, selectedStatus, selectedPayment, dateRange, sortBy, sortOrder]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockOrders = [
        {
          id: 'SHO20241201001',
          customerName: 'John Doe',
          customerEmail: 'john.doe@gmail.com',
          customerPhone: '+256701234567',
          totalAmount: 2450000,
          status: 'pending',
          paymentMethod: 'cash_on_delivery',
          paymentStatus: 'pending',
          itemsCount: 3,
          createdAt: '2024-12-01T10:30:00Z',
          deliveryAddress: 'Plot 123, Kampala Road, Kampala, Central Region',
          district: 'Kampala',
          isCOD: true,
          codVerified: false,
          items: [
            { name: 'Samsung Galaxy S24', quantity: 1, price: 1200000 },
            { name: 'Phone Case', quantity: 2, price: 625000 },
          ],
        },
        {
          id: 'SHO20241201002',
          customerName: 'Jane Smith',
          customerEmail: 'jane.smith@gmail.com',
          customerPhone: '+256702345678',
          totalAmount: 890000,
          status: 'confirmed',
          paymentMethod: 'mtn_momo',
          paymentStatus: 'completed',
          itemsCount: 1,
          createdAt: '2024-12-01T09:15:00Z',
          deliveryAddress: 'Plot 456, Jinja Road, Kampala, Central Region',
          district: 'Kampala',
          isCOD: false,
          codVerified: false,
          transactionId: 'MTN123456789',
          items: [{ name: 'Sony WH-1000XM5 Headphones', quantity: 1, price: 890000 }],
        },
        {
          id: 'SHO20241201003',
          customerName: 'Bob Johnson',
          customerEmail: 'bob.johnson@gmail.com',
          customerPhone: '+256703456789',
          totalAmount: 3400000,
          status: 'processing',
          paymentMethod: 'airtel_money',
          paymentStatus: 'completed',
          itemsCount: 2,
          createdAt: '2024-12-01T08:45:00Z',
          deliveryAddress: 'Plot 789, Entebbe Road, Wakiso, Central Region',
          district: 'Wakiso',
          isCOD: false,
          codVerified: false,
          transactionId: 'AIRTEL987654321',
          items: [
            { name: 'MacBook Air M3', quantity: 1, price: 2800000 },
            { name: 'Magic Mouse', quantity: 1, price: 600000 },
          ],
        },
        {
          id: 'SHO20241130004',
          customerName: 'Alice Brown',
          customerEmail: 'alice.brown@gmail.com',
          customerPhone: '+256704567890',
          totalAmount: 1250000,
          status: 'delivered',
          paymentMethod: 'cash_on_delivery',
          paymentStatus: 'completed',
          itemsCount: 2,
          createdAt: '2024-11-30T18:30:00Z',
          deliveryAddress: 'Plot 101, Masaka Road, Kampala, Central Region',
          district: 'Kampala',
          isCOD: true,
          codVerified: true,
          deliveredAt: '2024-12-01T14:20:00Z',
          items: [
            { name: 'iPhone 15 Pro Max', quantity: 1, price: 1100000 },
            { name: 'Screen Protector', quantity: 1, price: 150000 },
          ],
        },
        {
          id: 'SHO20241130005',
          customerName: 'Charlie Wilson',
          customerEmail: 'charlie.wilson@gmail.com',
          customerPhone: '+256705678901',
          totalAmount: 675000,
          status: 'cancelled',
          paymentMethod: 'mtn_momo',
          paymentStatus: 'refunded',
          itemsCount: 1,
          createdAt: '2024-11-30T16:15:00Z',
          deliveryAddress: 'Plot 202, Bombo Road, Kampala, Central Region',
          district: 'Kampala',
          isCOD: false,
          codVerified: false,
          cancelledAt: '2024-11-30T18:00:00Z',
          items: [{ name: 'Dell XPS 13', quantity: 1, price: 675000 }],
        },
      ];

      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        order =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerPhone.includes(searchTerm)
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'cod_pending') {
        filtered = filtered.filter(order => order.isCOD && !order.codVerified);
      } else if (selectedStatus === 'cod_verified') {
        filtered = filtered.filter(order => order.isCOD && order.codVerified);
      } else {
        filtered = filtered.filter(order => order.status === selectedStatus);
      }
    }

    // Payment method filter
    if (selectedPayment !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === selectedPayment);
    }

    // Date filter
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          filterDate = null;
      }

      if (filterDate) {
        filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
      }
    }

    // Sort orders
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'customer':
          aVal = a.customerName.toLowerCase();
          bVal = b.customerName.toLowerCase();
          break;
        case 'amount':
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = status => {
    const colors = {
      pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      confirmed: 'text-blue-700 bg-blue-50 border-blue-200',
      processing: 'text-purple-700 bg-purple-50 border-purple-200',
      out_for_delivery: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      delivered: 'text-green-700 bg-green-50 border-green-200',
      cancelled: 'text-red-700 bg-red-50 border-red-200',
      cod_pending: 'text-orange-700 bg-orange-50 border-orange-200',
      cod_verified: 'text-teal-700 bg-teal-50 border-teal-200',
    };
    return colors[status] || 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const getPaymentMethodIcon = method => {
    switch (method) {
      case 'mtn_momo':
        return (
          <div className="h-6 w-6 bg-yellow-400 rounded text-xs flex items-center justify-center font-bold">
            M
          </div>
        );
      case 'airtel_money':
        return (
          <div className="h-6 w-6 bg-red-500 rounded text-xs flex items-center justify-center font-bold text-white">
            A
          </div>
        );
      case 'cash_on_delivery':
        return <CreditCard className="h-5 w-5 text-green-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setOrders(
        orders.map(order => (order.id === orderId ? { ...order, status: newStatus } : order))
      );

      console.log(`Updated order ${orderId} to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleCODVerification = async (orderId, verified) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setOrders(
        orders.map(order =>
          order.id === orderId
            ? { ...order, codVerified: verified, status: verified ? 'confirmed' : order.status }
            : order
        )
      );

      console.log(`COD verification for order ${orderId}: ${verified}`);
    } catch (error) {
      console.error('Failed to update COD verification:', error);
    }
  };

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Order Details - {order.id}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Status & Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {order.isCOD && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        order.codVerified
                          ? 'text-green-700 bg-green-50 border-green-200'
                          : 'text-orange-700 bg-orange-50 border-orange-200'
                      }`}
                    >
                      COD {order.codVerified ? 'Verified' : 'Pending'}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={order.status}
                    onChange={e => handleStatusUpdate(order.id, e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {order.isCOD && !order.codVerified && (
                    <button
                      onClick={() => handleCODVerification(order.id, true)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Verify COD
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Name:</span> {order.customerName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {order.customerEmail}
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Phone:</span>
                    <Phone className="h-4 w-4 mr-1" />
                    {order.customerPhone}
                  </p>
                  <p className="flex items-start">
                    <span className="font-medium mr-2">Address:</span>
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                  <p>
                    <span className="font-medium">District:</span> {order.district}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Method:</span>
                    {getPaymentMethodIcon(order.paymentMethod)}
                    <span className="ml-2 capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  <p>
                    <span className="font-medium">Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        order.paymentStatus === 'completed'
                          ? 'text-green-700 bg-green-100'
                          : order.paymentStatus === 'pending'
                          ? 'text-yellow-700 bg-yellow-100'
                          : 'text-red-700 bg-red-100'
                      }`}
                    >
                      {order.paymentStatus.toUpperCase()}
                    </span>
                  </p>
                  {order.transactionId && (
                    <p>
                      <span className="font-medium">Transaction ID:</span> {order.transactionId}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-gray-900">
                    <span className="font-medium">Total:</span> {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items ({order.itemsCount})
              </h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Order Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.status !== 'pending' && (
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order Confirmed</p>
                      <p className="text-sm text-gray-600">Status updated to {order.status}</p>
                    </div>
                  </div>
                )}

                {order.deliveredAt && (
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order Delivered</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.deliveredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {order.cancelledAt && (
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order Cancelled</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.cancelledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600">Track and manage customer orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-blue-600 hover:text-blue-700 border border-blue-600 hover:border-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, customer, phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="cod_pending">COD Pending</option>
                <option value="cod_verified">COD Verified</option>
              </select>

              {/* Payment Filter */}
              <select
                value={selectedPayment}
                onChange={e => setSelectedPayment(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Payment Methods</option>
                <option value="mtn_momo">MTN Mobile Money</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={e => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="customer-asc">Customer A-Z</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="status-asc">Status A-Z</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>

            <div className="flex items-center space-x-4 text-sm">
              <span className="text-yellow-600">
                ● {filteredOrders.filter(o => o.status === 'pending').length} Pending
              </span>
              <span className="text-orange-600">
                ● {filteredOrders.filter(o => o.isCOD && !o.codVerified).length} COD Pending
              </span>
              <span className="text-green-600">
                ● {filteredOrders.filter(o => o.status === 'delivered').length} Delivered
              </span>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {order.itemsCount} item{order.itemsCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{order.customerEmail}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {order.customerPhone}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        <div>
                          <p className="text-sm text-gray-900 capitalize">
                            {order.paymentMethod.replace('_', ' ')}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              order.paymentStatus === 'completed'
                                ? 'text-green-700 bg-green-100'
                                : order.paymentStatus === 'pending'
                                ? 'text-yellow-700 bg-yellow-100'
                                : 'text-red-700 bg-red-100'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {order.isCOD && (
                          <span
                            className={`block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              order.codVerified
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-orange-700 bg-orange-50 border-orange-200'
                            }`}
                          >
                            COD {order.codVerified ? 'Verified' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-700 p-1"
                          title="Edit Status"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {order.isCOD && !order.codVerified && (
                          <button
                            onClick={() => handleCODVerification(order.id, true)}
                            className="text-orange-600 hover:text-orange-700 p-1"
                            title="Verify COD"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ||
                selectedStatus !== 'all' ||
                selectedPayment !== 'all' ||
                dateRange !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No orders have been placed yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default OrderManagementPage;