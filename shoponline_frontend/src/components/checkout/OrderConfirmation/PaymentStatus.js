import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  Smartphone,
  DollarSign,
} from 'lucide-react';
import { paymentsAPI } from '../../../services/api/paymentsAPI';
import { ordersAPI } from '../../../services/api/ordersAPI';
import { useAuth } from '../../../hooks/useAuth';
import './PaymentStatus.css';

const PaymentStatus = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [payment, setPayment] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh for pending/processing payments
  useEffect(() => {
    let interval;

    if (payment && ['pending', 'processing'].includes(payment.status) && autoRefresh) {
      interval = setInterval(() => {
        verifyPaymentStatus(false);
      }, 10000); // Check every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [payment, autoRefresh]);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  // Start auto-refresh if payment is processing
  useEffect(() => {
    if (payment && ['pending', 'processing'].includes(payment.status)) {
      setAutoRefresh(true);
    } else {
      setAutoRefresh(false);
    }
  }, [payment]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getPaymentDetails(paymentId);

      if (response.success) {
        setPayment(response.data);

        // Fetch order details
        if (response.data.order) {
          const orderResponse = await ordersAPI.getOrderDetails(response.data.order);
          if (orderResponse.success) {
            setOrder(orderResponse.data);
          }
        }
      } else {
        setError('Payment not found');
      }
    } catch (err) {
      setError('Failed to load payment details');
      console.error('Error fetching payment details:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyPaymentStatus = async (showLoader = true) => {
    if (!payment) return;

    try {
      if (showLoader) setVerifying(true);

      const response = await paymentsAPI.verifyPayment(payment.id);

      if (response.success) {
        setPayment(response.data.payment);

        // If payment is completed, stop auto-refresh
        if (response.data.payment.status === 'completed') {
          setAutoRefresh(false);
        }
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
    } finally {
      if (showLoader) setVerifying(false);
    }
  };

  const cancelPayment = async () => {
    if (!payment || !['pending', 'processing'].includes(payment.status)) return;

    try {
      const response = await paymentsAPI.cancelPayment(payment.id);

      if (response.success) {
        setPayment(response.data.payment);
        setAutoRefresh(false);
      }
    } catch (err) {
      console.error('Error cancelling payment:', err);
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

  const getStatusConfig = status => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'success',
          title: 'Payment Successful',
          message: 'Your payment has been processed successfully.',
          bgColor: '#f0fdf4',
        };
      case 'processing':
        return {
          icon: Clock,
          color: 'warning',
          title: 'Payment Processing',
          message: 'Please complete the payment on your mobile device.',
          bgColor: '#fffbeb',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'info',
          title: 'Payment Pending',
          message: 'Waiting for payment confirmation.',
          bgColor: '#eff6ff',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'error',
          title: 'Payment Failed',
          message: 'Your payment could not be processed.',
          bgColor: '#fef2f2',
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'warning',
          title: 'Payment Cancelled',
          message: 'This payment has been cancelled.',
          bgColor: '#fffbeb',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'info',
          title: 'Payment Status Unknown',
          message: 'Unable to determine payment status.',
          bgColor: '#f8fafc',
        };
    }
  };

  const getPaymentMethodIcon = method => {
    switch (method) {
      case 'mtn_momo':
      case 'airtel_money':
        return Smartphone;
      case 'cod':
        return DollarSign;
      default:
        return CreditCard;
    }
  };

  const renderActionButtons = () => {
    if (!payment) return null;

    const buttons = [];

    // Refresh button for pending/processing payments
    if (['pending', 'processing'].includes(payment.status)) {
      buttons.push(
        <button
          key="refresh"
          className="btn-primary"
          onClick={() => verifyPaymentStatus(true)}
          disabled={verifying}
        >
          <RefreshCw size={20} className={verifying ? 'spinning' : ''} />
          {verifying ? 'Checking...' : 'Check Status'}
        </button>
      );
    }

    // Cancel button for pending payments (not COD)
    if (payment.status === 'pending' && payment.payment_method !== 'cod') {
      buttons.push(
        <button key="cancel" className="btn-outline btn-error" onClick={cancelPayment}>
          Cancel Payment
        </button>
      );
    }

    // Receipt button for completed payments
    if (payment.status === 'completed') {
      buttons.push(
        <button
          key="receipt"
          className="btn-primary"
          onClick={() => window.open(`/payments/${payment.id}/receipt`, '_blank')}
        >
          Download Receipt
        </button>
      );
    }

    // Order details button
    if (order) {
      buttons.push(
        <button
          key="order"
          className="btn-secondary"
          onClick={() => navigate(`/orders/${order.id}`)}
        >
          View Order Details
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="payment-status-loading">
        <div className="spinner" />
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="payment-status-error">
        <div className="error-content">
          <XCircle size={64} />
          <h2>Payment Not Found</h2>
          <p>{error || 'The payment you are looking for could not be found.'}</p>
          <button className="btn-primary" onClick={() => navigate('/orders')}>
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.status);
  const StatusIcon = statusConfig.icon;
  const PaymentIcon = getPaymentMethodIcon(payment.payment_method);

  return (
    <div className="payment-status">
      <div className="payment-status-container">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Status Header */}
        <div className="status-header" style={{ backgroundColor: statusConfig.bgColor }}>
          <div className="status-icon-wrapper">
            <StatusIcon size={64} className={`status-icon status-${statusConfig.color}`} />
          </div>
          <div className="status-info">
            <h1>{statusConfig.title}</h1>
            <p>{statusConfig.message}</p>
            {autoRefresh && (
              <div className="auto-refresh-indicator">
                <Clock size={16} />
                <span>Auto-refreshing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details Card */}
        <div className="payment-details-card">
          <div className="card-header">
            <h3>Payment Details</h3>
            <div className={`status-badge status-${statusConfig.color}`}>
              {payment.status_display}
            </div>
          </div>

          <div className="payment-info">
            <div className="payment-method-info">
              <PaymentIcon size={24} />
              <div>
                <label>Payment Method</label>
                <span>{payment.payment_method_display}</span>
              </div>
            </div>

            <div className="payment-details-grid">
              <div className="detail-item">
                <label>Reference Number</label>
                <span className="reference-number">{payment.reference_number}</span>
              </div>

              <div className="detail-item">
                <label>Amount</label>
                <span className="amount">{formatCurrency(payment.amount)}</span>
              </div>

              <div className="detail-item">
                <label>Created</label>
                <span>{formatDate(payment.created_at)}</span>
              </div>

              {payment.processed_at && (
                <div className="detail-item">
                  <label>Processed</label>
                  <span>{formatDate(payment.processed_at)}</span>
                </div>
              )}

              {payment.transaction_id && (
                <div className="detail-item">
                  <label>Transaction ID</label>
                  <span>{payment.transaction_id}</span>
                </div>
              )}

              {payment.external_transaction_id && (
                <div className="detail-item">
                  <label>Provider Transaction ID</label>
                  <span>{payment.external_transaction_id}</span>
                </div>
              )}
            </div>

            {/* Method-specific details */}
            {payment.mobile_money_details && (
              <div className="mobile-money-details">
                <h4>Mobile Money Details</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Phone Number</label>
                    <span>{payment.mobile_money_details.phone_number}</span>
                  </div>
                  {payment.mobile_money_details.customer_name && (
                    <div className="detail-item">
                      <label>Customer Name</label>
                      <span>{payment.mobile_money_details.customer_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {payment.cod_details && (
              <div className="cod-details">
                <h4>Cash on Delivery Details</h4>
                <div className="details-grid">
                  <div className="detail-item full-width">
                    <label>Delivery Address</label>
                    <span>{payment.cod_details.delivery_address}</span>
                  </div>
                  <div className="detail-item">
                    <label>Delivery Phone</label>
                    <span>{payment.cod_details.delivery_phone}</span>
                  </div>
                  {payment.cod_details.delivery_notes && (
                    <div className="detail-item full-width">
                      <label>Delivery Notes</label>
                      <span>{payment.cod_details.delivery_notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {payment.failure_reason && (
              <div className="failure-reason">
                <AlertCircle size={20} />
                <div>
                  <label>Failure Reason</label>
                  <span>{payment.failure_reason}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Information */}
        {order && (
          <div className="order-info-card">
            <h3>Order Information</h3>
            <div className="order-details">
              <div className="detail-item">
                <label>Order Number</label>
                <span>{order.order_number}</span>
              </div>
              <div className="detail-item">
                <label>Order Status</label>
                <span>{order.status_display}</span>
              </div>
              <div className="detail-item">
                <label>Items</label>
                <span>{order.items?.length || 0} item(s)</span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions based on payment status and method */}
        {payment.status === 'processing' && payment.payment_method !== 'cod' && (
          <div className="payment-instructions">
            <h4>Complete Your Payment</h4>
            <div className="instructions-content">
              <div className="instruction-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <span>Check your mobile phone for a payment prompt</span>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <span>Enter your Mobile Money PIN to authorize payment</span>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <span>Wait for confirmation - this page will update automatically</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {payment.status === 'processing' && payment.payment_method === 'cod' && (
          <div className="cod-instructions">
            <h4>What's Next?</h4>
            <div className="instructions-content">
              <div className="instruction-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <span>Our team will contact you within 24 hours</span>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <span>We'll arrange a convenient delivery time</span>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <span>Have exact change ready: {formatCurrency(payment.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">{renderActionButtons()}</div>
      </div>
    </div>
  );
};

export default PaymentStatus;
