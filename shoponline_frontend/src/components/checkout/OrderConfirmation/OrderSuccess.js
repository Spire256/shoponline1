import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Package,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Download,
  Eye,
  ArrowRight,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { ordersAPI } from '../../../services/api/ordersAPI';
import { paymentsAPI } from '../../../services/api/paymentsAPI';
import { useAuth } from '../../../hooks/useAuth';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const [orderResponse, paymentsResponse] = await Promise.all([
        ordersAPI.getOrderDetails(orderId),
        paymentsAPI.getPaymentsByOrder(orderId),
      ]);

      if (orderResponse.success) {
        setOrder(orderResponse.data);
      }

      if (paymentsResponse.success && paymentsResponse.data.length > 0) {
        // Get the latest payment
        const latestPayment = paymentsResponse.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];
        setPayment(latestPayment);
      }
    } catch (err) {
      setError('Failed to load order details');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getPaymentMethodIcon = method => {
    switch (method) {
      case 'mtn_momo':
        return '📱';
      case 'airtel_money':
        return '📱';
      case 'cod':
        return '💰';
      default:
        return '💳';
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
      case 'pending':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  const getNextSteps = () => {
    if (!order || !payment) return [];

    if (payment.payment_method === 'cod') {
      return [
        'Our team will contact you within 24 hours to confirm delivery details',
        `Please ensure you have the exact amount ready: ${formatCurrency(order.total_amount)}`,
        `Keep your order number handy for reference: ${order.order_number}`,
      ];
    } else if (payment.status === 'processing') {
      return [
        'Complete the payment on your mobile phone',
        'Check your phone for a payment prompt',
        'Enter your Mobile Money PIN to confirm payment',
        'You will receive a confirmation SMS once payment is successful',
      ];
    } else if (payment.status === 'completed') {
      return [
        'Your payment has been confirmed',
        'We will prepare your order for delivery',
        'You will receive updates via email and SMS',
        'Estimated delivery: 1-2 business days',
      ];
    }

    return [];
  };

  if (loading) {
    return (
      <div className="order-success-loading">
        <div className="spinner" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-success-error">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <h2>Order Not Found</h2>
          <p>{error || 'The order you are looking for could not be found.'}</p>
          <button className="btn-primary" onClick={() => navigate('/orders')}>
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const nextSteps = getNextSteps();

  return (
    <div className="order-success">
      <div className="order-success-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">
            <CheckCircle size={64} />
          </div>
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for your order. Here are your order details:</p>
        </div>

        {/* Order Details Card */}
        <div className="order-details-card">
          <div className="card-header">
            <div className="order-number">
              <h3>Order #{order.order_number}</h3>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(order.order_number, 'orderNumber')}
                title="Copy order number"
              >
                {copiedField === 'orderNumber' ? <CheckCheck size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className={`order-status status-${getStatusColor(order.status)}`}>
              {order.status_display}
            </div>
          </div>

          <div className="card-content">
            <div className="detail-row">
              <div className="detail-item">
                <Clock size={20} />
                <div>
                  <label>Order Date</label>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>

              <div className="detail-item">
                <Package size={20} />
                <div>
                  <label>Items</label>
                  <span>{order.items?.length || 0} item(s)</span>
                </div>
              </div>

              <div className="detail-item">
                <CreditCard size={20} />
                <div>
                  <label>Total Amount</label>
                  <span className="amount">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {payment && (
          <div className="payment-info-card">
            <h3>Payment Information</h3>
            <div className="payment-details">
              <div className="payment-method">
                <span className="payment-icon">{getPaymentMethodIcon(payment.payment_method)}</span>
                <div>
                  <label>Payment Method</label>
                  <span>{payment.payment_method_display}</span>
                </div>
                <div className={`payment-status status-${getStatusColor(payment.status)}`}>
                  {payment.status_display}
                </div>
              </div>

              {payment.reference_number && (
                <div className="reference-number">
                  <label>Reference Number</label>
                  <div className="reference-value">
                    <span>{payment.reference_number}</span>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(payment.reference_number, 'reference')}
                      title="Copy reference number"
                    >
                      {copiedField === 'reference' ? <CheckCheck size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {payment.mobile_money_details && (
                <div className="mobile-money-details">
                  <label>Phone Number</label>
                  <span>{payment.mobile_money_details.phone_number}</span>
                </div>
              )}

              {payment.cod_details && (
                <div className="cod-details">
                  <div className="cod-info">
                    <MapPin size={20} />
                    <div>
                      <label>Delivery Address</label>
                      <span>{payment.cod_details.delivery_address}</span>
                    </div>
                  </div>
                  <div className="cod-info">
                    <Phone size={20} />
                    <div>
                      <label>Delivery Phone</label>
                      <span>{payment.cod_details.delivery_phone}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="order-items-card">
          <h3>Order Items</h3>
          <div className="items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item">
                {item.product_image && (
                  <img src={item.product_image} alt={item.product_name} className="item-image" />
                )}
                <div className="item-details">
                  <h4>{item.product_name}</h4>
                  {item.product_sku && <span className="item-sku">SKU: {item.product_sku}</span>}
                  <div className="item-pricing">
                    <span className="quantity">Qty: {item.quantity}</span>
                    <span className="unit-price">{formatCurrency(item.unit_price)} each</span>
                    <span className="total-price">{formatCurrency(item.total_price)}</span>
                  </div>
                  {item.is_flash_sale_item && (
                    <div className="flash-sale-savings">
                      <span className="savings-badge">🎉 You saved {item.savings_display}!</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            {order.flash_sale_savings > 0 && (
              <div className="summary-row flash-savings">
                <span>Flash Sale Savings</span>
                <span>-{formatCurrency(order.flash_sale_savings)}</span>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="summary-row">
                <span>Tax</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div className="next-steps-card">
            <h3>What's Next?</h3>
            <div className="steps-list">
              {nextSteps.map((step, index) => (
                <div key={index} className="step-item">
                  <div className="step-number">{index + 1}</div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="order-actions">
          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => navigate('/orders')}>
              <Eye size={20} />
              View All Orders
            </button>

            <button className="btn-secondary" onClick={() => navigate('/products')}>
              Continue Shopping
              <ArrowRight size={20} />
            </button>

            {payment && payment.status === 'completed' && (
              <button
                className="btn-primary"
                onClick={() => window.open(`/payments/${payment.id}/receipt`, '_blank')}
              >
                <Download size={20} />
                Download Receipt
              </button>
            )}
          </div>

          {payment && payment.status === 'processing' && payment.payment_method !== 'cod' && (
            <div className="payment-pending-notice">
              <div className="notice-content">
                <Clock size={24} />
                <div>
                  <h4>Payment Pending</h4>
                  <p>
                    Please complete the payment on your mobile phone. The page will update
                    automatically once payment is confirmed.
                  </p>
                </div>
              </div>
              <button className="btn-outline" onClick={() => window.location.reload()}>
                Refresh Status
              </button>
            </div>
          )}
        </div>

        {/* Support Information */}
        <div className="support-info">
          <h4>Need Help?</h4>
          <p>
            If you have any questions about your order, please contact our support team order
            number: <strong>{order.order_number}</strong>
          </p>
          <div className="contact-options">
            <a href="mailto:support@shoponline.com" className="contact-link">
              📧 Email Support
            </a>
            <a href="tel:+256700000000" className="contact-link">
              📞 Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
