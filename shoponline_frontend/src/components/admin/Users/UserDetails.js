import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ShoppingBag, 
  CreditCard, 
  Activity, 
  Edit3, 
  Save, 
  X, 
  Check, 
  Clock,
  Star,
  AlertCircle,
  Shield,
  UserCheck
} from 'lucide-react';

const UserDetails = ({ user, onUpdate, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    is_active: true,
  });
  const [userStats, setUserStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        is_active: user.is_active,
      });
      fetchUserStats();
      fetchRecentOrders();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/stats/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await fetch(`/api/v1/orders/?customer_email=${user.email}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdate(updatedUser);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      is_active: user.is_active,
    });
    setEditMode(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
      'confirmed': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Check },
      'delivered': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Check },
      'cancelled': { color: 'bg-red-100 text-red-800 border-red-200', icon: X },
    };
    
    const config = statusMap[status] || statusMap.pending;
    const StatusIcon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <StatusIcon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {user.first_name} {user.last_name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-blue-100 text-sm">
                  {user.role === 'admin' ? 'Administrator' : 'Customer'}
                </span>
                {user.role === 'admin' && (
                  <Shield className="w-4 h-4 text-blue-200" />
                )}
                {user.is_email_verified && (
                  <UserCheck className="w-4 h-4 text-green-300" />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-slate-900">{user.first_name || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-slate-900">{user.last_name || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Contact Information
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-slate-900">{user.email}</p>
                  {user.is_email_verified ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+256 700 000 000"
                  />
                ) : (
                  <p className="text-slate-900">{user.phone_number || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Account Status</span>
              {editMode ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Joined</span>
              <span className="text-sm text-slate-900">
                {formatDate(user.date_joined)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Last Login</span>
              <span className="text-sm text-slate-900">
                {user.last_login ? formatDate(user.last_login) : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* User Statistics */}
        {userStats && (
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Activity Statistics
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">{userStats.total_orders || 0}</p>
                <p className="text-sm text-slate-600">Total Orders</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mx-auto mb-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(userStats.total_spent || 0)}
                </p>
                <p className="text-sm text-slate-600">Total Spent</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">{userStats.avg_rating || 0}</p>
                <p className="text-sm text-slate-600">Avg Rating</p>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-lg mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-600">{userStats.days_since_last_order || 'N/A'}</p>
                <p className="text-sm text-slate-600">Days Since Last Order</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Recent Orders
            </h4>
            
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-slate-900">#{order.order_number}</p>
                        {getStatusBadge(order.status)}
                        {order.is_cash_on_delivery && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            COD
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatDate(order.created_at)} • {order.items_count || 0} items
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-sm text-slate-600">
                        {order.payment_method === 'mtn_momo' ? 'MTN MoMo' : 
                         order.payment_method === 'airtel_money' ? 'Airtel Money' : 'COD'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;