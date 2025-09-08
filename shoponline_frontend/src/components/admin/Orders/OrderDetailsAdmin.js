// src/components/admin/Orders/OrderDetailsAdmin.js

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  Package, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Truck,
  DollarSign,
  Edit3,
  Save,
  MessageSquare,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import './OrderDetailsAdmin.css';

const OrderDetailsAdmin = ({ order, isOpen, onClose, onOrderUpdate }) => {
  const [orderData, setOrderData] = useState(order);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(order?.status || '');
  const [adminNotes, setAdminNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(order?.estimated_delivery || '');

  useEffect(() => {
    if (order) {
      setOrderData(order);
      setNewStatus(order.status);
      setTrackingNumber(order.tracking_number || '');
      setEstimatedDelivery(order.estimated_delivery || '');
    }
  }, [order]);

  const handleUpdateOrder = async () => {
    setLoading(true);
    try {
      const updateData = {
        status: newStatus,
        tracking_number: trackingNumber,
        estimated_delivery: estimatedDelivery,
        admin_notes: adminNotes
      };

      const response = await fetch(`/api/v1/orders/${orderData.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrderData(updatedOrder);
        setEditing(false);
        setAdminNotes('');
        onOrderUpdate && onOrderUpdate(updatedOrder);
      } else {
        console.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/orders/${orderData.id}/confirm/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrderData(updatedOrder);
        onOrderUpdate && onOrderUpdate(updatedOrder);
      }
    } catch (error) {
      console.error('Error confirming order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/orders/${orderData.id}/delivered/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrderData(updatedOrder);
        onOrderUpdate && onOrderUpdate(updatedOrder);
      }
    } catch (error) {
      console.error('Error marking order as delivered:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      out_for_delivery: 'status-shipping',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    };
    return colors[status] || 'status-pending';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      out_for_delivery: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <X className="w-4 h-4" />,
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      mtn_momo: '📱',
      airtel_money: '📱',
      cash_on_delivery: '💵',
    };
    return icons[method] || '💳';
  };

  if (!isOpen || !orderData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <h2>Order Details</h2>
            <p>#{orderData.order_number}</p>
          </div>
          <div className="header-right">
            <button
              className="btn-icon refresh-btn"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="btn-icon close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          <div className="order-details-grid">
            {/* Left Column */}
            <div className="order-main-info">
              {/* Order Status */}
              <div className="info-card">
                <div className="card-header">
                  <h3>Order Status</h3>
                  <div className="status-actions">
                    {!editing && (
                      <button
                        className="btn-icon edit-btn"
                        onClick={() => setEditing(true)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {editing ? (
                    <div className="status-editor">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      
                      <input
                        type="text"
                        placeholder="Tracking Number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="tracking-input"
                      />
                      
                      <input
                        type="datetime-local"
                        value={estimatedDelivery}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                        className="delivery-input"
                      />
                      
                      <textarea
                        placeholder="Admin notes..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="notes-textarea"
                        rows="3"
                      />
                      
                      <div className="edit-actions">
                        <button
                          className="btn btn-success"
                          onClick={handleUpdateOrder}
                          disabled={loading}
                        >
                          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Changes
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditing(false);
                            setNewStatus(orderData.status);
                            setAdminNotes('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="status-display">
                      <div className={`status-badge ${getStatusColor(orderData.status)}`}>
                        {getStatusIcon(orderData.status)}
                        <span>{orderData.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      
                      {orderData.tracking_number && (
                        <div className="tracking-info">
                          <strong>Tracking:</strong> {orderData.tracking_number}
                        </div>
                      )}
                      
                      {orderData.estimated_delivery && (
                        <div className="delivery-info">
                          <strong>Est. Delivery:</strong> {new Date(orderData.estimated_delivery).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="info-card">
                <div className="card-header">
                  <h3>Customer Information</h3>
                </div>
                <div className="card-body">
                  <div className="customer-info">
                    <div className="info-row">
                      <User className="w-4 h-4 text-blue-600" />
                      <div>
                        <strong>{orderData.first_name} {orderData.last_name}</strong>
                        <span className="customer-type">
                          {orderData.user ? 'Registered Customer' : 'Guest'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="info-row">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <div>
                        <a href={`mailto:${orderData.email}`} className="contact-link">
                          {orderData.email}
                        </a>
                      </div>
                    </div>
                    
                    <div className="info-row">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <div>
                        <a href={`tel:${orderData.phone}`} className="contact-link">
                          {orderData.phone}
                        </a>
                      </div>
                    </div>
                    
                    <div className="info-row">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="address">
                          {orderData.address_line_1}
                          {orderData.address_line_2 && <br />}
                          {orderData.address_line_2}
                          <br />
                          {orderData.city}, {orderData.district}
                          {orderData.postal_code && `, ${orderData.postal_code}`}
                        </div>
                        {orderData.delivery_notes && (
                          <div className="delivery-notes">
                            <strong>Notes:</strong> {orderData.delivery_notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="info-card">
                <div className="card-header">
                  <h3>Payment Information</h3>
                </div>
                <div className="card-body">
                  <div className="payment-info">
                    <div className="payment-method">
                      <span className="method-icon">
                        {getPaymentMethodIcon(orderData.payment_method)}
                      </span>
                      <div className="method-details">
                        <strong>{orderData.payment_method.replace('_', ' ').toUpperCase()}</strong>
                        <div className={`payment-status status-${orderData.payment_status}`}>
                          {orderData.payment_status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    {orderData.payment_reference && (
                      <div className="payment-reference">
                        <strong>Reference:</strong> {orderData.payment_reference}
                      </div>
                    )}
                    
                    {orderData.transaction_id && (
                      <div className="transaction-id">
                        <strong>Transaction ID:</strong> {orderData.transaction_id}
                      </div>
                    )}
                    
                    {orderData.is_cash_on_delivery && (
                      <div className="cod-info">
                        <div className={`cod-status ${orderData.cod_verified ? 'verified' : 'pending'}`}>
                          {orderData.cod_verified ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>COD Verified</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4" />
                              <span>COD Pending Verification</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="info-card">
                <div className="card-header">
                  <h3>Order Items ({orderData.items?.length || 0})</h3>
                </div>
                <div className="card-body">
                  <div className="order-items">
                    {orderData.items?.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-image">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} />
                          ) : (
                            <div className="placeholder-image">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        
                        <div className="item-details">
                          <h4>{item.product_name}</h4>
                          {item.product_sku && (
                            <p className="item-sku">SKU: {item.product_sku}</p>
                          )}
                          {item.product_category && (
                            <p className="item-category">{item.product_category}</p>
                          )}
                          
                          {item.is_flash_sale_item && (
                            <div className="flash-sale-indicator">
                              <span className="flash-badge">Flash Sale</span>
                              <span className="savings">
                                Saved: {formatCurrency(item.flash_sale_savings)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="item-pricing">
                          <div className="quantity">Qty: {item.quantity}</div>
                          <div className="unit-price">
                            {formatCurrency(item.unit_price)}
                            {item.original_price && item.original_price > item.unit_price && (
                              <span className="original-price">
                                {formatCurrency(item.original_price)}
                              </span>
                            )}
                          </div>
                          <div className="total-price">
                            <strong>{formatCurrency(item.total_price)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="order-sidebar">
              {/* Order Summary */}
              <div className="info-card summary-card">
                <div className="card-header">
                  <h3>Order Summary</h3>
                  <div className="order-date">
                    {new Date(orderData.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="card-body">
                  <div className="summary-breakdown">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>{formatCurrency(orderData.subtotal)}</span>
                    </div>
                    
                    {orderData.tax_amount > 0 && (
                      <div className="summary-row">
                        <span>Tax</span>
                        <span>{formatCurrency(orderData.tax_amount)}</span>
                      </div>
                    )}
                    
                    {orderData.delivery_fee > 0 && (
                      <div className="summary-row">
                        <span>Delivery Fee</span>
                        <span>{formatCurrency(orderData.delivery_fee)}</span>
                      </div>
                    )}
                    
                    {orderData.discount_amount > 0 && (
                      <div className="summary-row discount">
                        <span>Discount</span>
                        <span>-{formatCurrency(orderData.discount_amount)}</span>
                      </div>
                    )}
                    
                    {orderData.flash_sale_savings > 0 && (
                      <div className="summary-row flash-savings">
                        <span>Flash Sale Savings</span>
                        <span>-{formatCurrency(orderData.flash_sale_savings)}</span>
                      </div>
                    )}
                    
                    <div className="summary-row total">
                      <span>Total</span>
                      <span>{formatCurrency(orderData.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="info-card">
                <div className="card-header">
                  <h3>Quick Actions</h3>
                </div>
                <div className="card-body">
                  <div className="action-buttons">
                    {orderData.status === 'pending' && (
                      <button
                        className="btn btn-success btn-block"
                        onClick={handleConfirmOrder}
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Order
                      </button>
                    )}
                    
                    {orderData.status === 'confirmed' && (
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => {
                          setNewStatus('processing');
                          setEditing(true);
                        }}
                      >
                        <Package className="w-4 h-4" />
                        Start Processing
                      </button>
                    )}
                    
                    {['confirmed', 'processing', 'out_for_delivery'].includes(orderData.status) && (
                      <button
                        className="btn btn-success btn-block"
                        onClick={handleMarkDelivered}
                        disabled={loading}
                      >
                        <Truck className="w-4 h-4" />
                        Mark as Delivered
                      </button>
                    )}
                    
                    <button className="btn btn-secondary btn-block">
                      <MessageSquare className="w-4 h-4" />
                      Contact Customer
                    </button>
                    
                    <button className="btn btn-outline btn-block">
                      <Download className="w-4 h-4" />
                      Download Invoice
                    </button>
                    
                    <button className="btn btn-outline btn-block">
                      <Eye className="w-4 h-4" />
                      View in Store
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {orderData.status_history && orderData.status_history.length > 0 && (
                <div className="info-card">
                  <div className="card-header">
                    <h3>Order Timeline</h3>
                  </div>
                  <div className="card-body">
                    <div className="timeline">
                      {orderData.status_history.map((history, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <div className="timeline-status">
                              {history.new_status.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="timeline-date">
                              {new Date(history.created_at).toLocaleString()}
                            </div>
                            {history.notes && (
                              <div className="timeline-notes">
                                {history.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {orderData.admin_notes && (
                <div className="info-card">
                  <div className="card-header">
                    <h3>Admin Notes</h3>
                  </div>
                  <div className="card-body">
                    <div className="admin-notes">
                      {orderData.admin_notes}
                    </div>
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

export default OrderDetailsAdmin;