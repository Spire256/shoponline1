import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, TrendingUp, Clock, Users, DollarSign } from 'lucide-react';
import FlashSaleTable from './FlashSaleTable';
import CreateFlashSale from './CreateFlashSale';
import EditFlashSale from './EditFlashSale';
import { flashSalesAPI } from '../../services/api/flashSalesAPI';
import './FlashSaleManagement.css';

const FlashSaleManagement = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    expired: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchFlashSales();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };

      const response = await flashSalesAPI.getFlashSales(params);
      setFlashSales(response.results || response);
      setTotalPages(Math.ceil((response.count || response.length) / 10));
    } catch (err) {
      setError('Failed to fetch flash sales');
      console.error('Flash sales fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const allSales = await flashSalesAPI.getFlashSales();
      const now = new Date();

      const statsData = {
        total: allSales.length || allSales.count || 0,
        active: 0,
        upcoming: 0,
        expired: 0,
      };

      allSales.forEach(sale => {
        const startTime = new Date(sale.start_time);
        const endTime = new Date(sale.end_time);

        if (sale.is_active) {
          if (startTime <= now && endTime > now) {
            statsData.active++;
          } else if (startTime > now) {
            statsData.upcoming++;
          } else if (endTime <= now) {
            statsData.expired++;
          }
        }
      });

      setStats(statsData);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const handleCreateFlashSale = () => {
    setShowCreateModal(true);
  };

  const handleEditFlashSale = flashSale => {
    setSelectedFlashSale(flashSale);
    setShowEditModal(true);
  };

  const handleDeleteFlashSale = async flashSaleId => {
    if (window.confirm('Are you sure you want to delete this flash sale?')) {
      try {
        await flashSalesAPI.deleteFlashSale(flashSaleId);
        fetchFlashSales();
        fetchStats();
      } catch (err) {
        setError('Failed to delete flash sale');
      }
    }
  };

  const handleToggleStatus = async (flashSaleId, currentStatus) => {
    try {
      if (currentStatus) {
        await flashSalesAPI.deactivateFlashSale(flashSaleId);
      } else {
        await flashSalesAPI.activateFlashSale(flashSaleId);
      }
      fetchFlashSales();
      fetchStats();
    } catch (err) {
      setError('Failed to update flash sale status');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchFlashSales();
    fetchStats();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedFlashSale(null);
    fetchFlashSales();
    fetchStats();
  };

  const getStatusBadge = sale => {
    if (sale.is_running) {
      return <span className="status-badge status-active">Active</span>;
    } else if (sale.is_upcoming) {
      return <span className="status-badge status-upcoming">Upcoming</span>;
    } else if (sale.is_expired) {
      return <span className="status-badge status-expired">Expired</span>;
    } else {
      return <span className="status-badge status-inactive">Inactive</span>;
    }
  };

  if (loading && flashSales.length === 0) {
    return (
      <div className="flash-sale-management">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading flash sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flash-sale-management">
      <div className="flash-sale-header">
        <div className="header-content">
          <h1>Flash Sales Management</h1>
          <p>Create and manage time-limited promotional sales</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateFlashSale}>
          <Plus size={20} />
          Create Flash Sale
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Flash Sales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active Sales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon upcoming">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.upcoming}</h3>
            <p>Upcoming Sales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon expired">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.expired}</h3>
            <p>Expired Sales</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search flash sales..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Flash Sales Table */}
      <div className="table-section">
        <FlashSaleTable
          flashSales={flashSales}
          onEdit={handleEditFlashSale}
          onDelete={handleDeleteFlashSale}
          onToggleStatus={handleToggleStatus}
          getStatusBadge={getStatusBadge}
          loading={loading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              Previous
            </button>

            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateFlashSale
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {showEditModal && selectedFlashSale && (
        <EditFlashSale
          flashSale={selectedFlashSale}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedFlashSale(null);
          }}
        />
      )}
    </div>
  );
};

export default FlashSaleManagement;
