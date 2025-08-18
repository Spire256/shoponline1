import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  UserPlus,
  TrendingUp,
  Crown,
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';

const UserAnalytics = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');

  // Fetch user analytics data
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/analytics/user_analytics/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user data');

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchUserData();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Format currency
  const formatCurrency = amount => `UGX ${amount.toLocaleString()}`;

  // Generate user activity chart data (mock data for demo)
  const generateActivityData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      active: Math.floor(Math.random() * 50) + 20,
      new: Math.floor(Math.random() * 15) + 5,
    }));
  };

  const activityData = generateActivityData();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="text-red-400 mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading user analytics</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Analytics</h1>
          <p className="text-gray-600">Monitor user engagement and customer behavior</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('customers')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedView === 'customers'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Top Customers
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">New Users (30 days)</p>
              <p className="text-2xl font-bold text-blue-600">{userData?.new_users || 0}</p>
              <p className="text-xs text-gray-500">Recently registered</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{userData?.active_users || 0}</p>
              <p className="text-xs text-gray-500">Placed orders recently</p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Top Customers</p>
              <p className="text-2xl font-bold text-purple-600">
                {userData?.top_customers?.length || 0}
              </p>
              <p className="text-xs text-gray-500">VIP customers</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-full">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">User Activity (This Week)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Bar dataKey="active" fill="#10b981" name="Active Users" radius={[4, 4, 0, 0]} />
            <Bar dataKey="new" fill="#3b82f6" name="New Users" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Engagement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">User Engagement</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-900">Active Users</p>
                    <p className="text-sm text-blue-700">Users who placed orders recently</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {userData?.active_users || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <UserPlus className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">New Registrations</p>
                    <p className="text-sm text-green-700">New users in last 30 days</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {userData?.new_users || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-purple-900">Engagement Rate</p>
                    <p className="text-sm text-purple-700">Active users percentage</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {userData?.active_users && userData?.new_users
                    ? Math.round(
                      (userData.active_users / (userData.active_users + userData.new_users)) * 100
                    )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* User Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">User Statistics</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">New Users</span>
                  <span className="text-sm font-bold text-gray-900">
                    {userData?.new_users || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        userData?.new_users ? Math.min((userData.new_users / 100) * 100, 100) : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Active Users</span>
                  <span className="text-sm font-bold text-gray-900">
                    {userData?.active_users || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        userData?.active_users
                          ? Math.min((userData.active_users / 100) * 100, 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Top Customers</span>
                  <span className="text-sm font-bold text-gray-900">
                    {userData?.top_customers?.length || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${
                        userData?.top_customers
                          ? Math.min((userData.top_customers.length / 20) * 100, 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'customers' && userData?.top_customers && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Customers</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Since
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userData.top_customers.map((customer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {customer.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">Customer #{index + 1}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{customer.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {customer.total_orders}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(customer.total_spent)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(customer.date_joined).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          index < 3
                            ? 'bg-yellow-100 text-yellow-800'
                            : index < 7
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {index < 3 ? (
                          <>
                            <Crown className="h-3 w-3 mr-1" />
                            VIP
                          </>
                        ) : index < 7 ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Premium
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3 mr-1" />
                            Regular
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">User Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {userData?.active_users && userData?.new_users
                ? Math.round(
                  (userData.active_users / (userData.active_users + userData.new_users)) * 100
                )
                : 0}
              %
            </div>
            <div className="text-sm text-blue-700 font-medium">User Engagement</div>
            <div className="text-xs text-blue-600">Active vs Total</div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {userData?.top_customers?.[0]
                ? formatCurrency(userData.top_customers[0].total_spent)
                : 'N/A'}
            </div>
            <div className="text-sm text-green-700 font-medium">Top Spender</div>
            <div className="text-xs text-green-600">Highest customer value</div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {userData?.top_customers
                ? Math.round(
                  userData.top_customers.reduce((sum, c) => sum + c.total_orders, 0) /
                      userData.top_customers.length
                )
                : 0}
            </div>
            <div className="text-sm text-purple-700 font-medium">Avg Orders</div>
            <div className="text-xs text-purple-600">Per top customer</div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {userData?.top_customers
                ? formatCurrency(
                  userData.top_customers.reduce((sum, c) => sum + c.total_spent, 0) /
                      userData.top_customers.length
                )
                : 'N/A'}
            </div>
            <div className="text-sm text-orange-700 font-medium">Avg Spending</div>
            <div className="text-xs text-orange-600">Per top customer</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;
