// src/components/checkout/OrderConfirmation/OrderConfirmation.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderSuccess from './OrderSuccess';
import PaymentStatus from './PaymentStatus';
import { formatCurrency } from '../../../utils/helpers/currencyHelpers';
import { paymentsAPI } from '../../../services/api/paymentsAPI';

const OrderConfirmation = ({
  order,
  payment,
  customerInfo,
  addressInfo,
  paymentInfo,
  onBack
}) => {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState(payment?.status || 'processing');
  const [verifying, setVerifying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-verify payment status for mobile money payments
  useEffect(() => {
    if (payment && (paymentInfo.method === 'mtn_momo' || paymentInfo.method === 'airtel_money')) {
      const interval = setInterval(() => {
        verifyPaymentStatus();
      }, 5000); // Check every 5 seconds

      // Clean up interval after 5 minutes
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 300000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [payment, paymentInfo.method]);

  const verifyPaymentStatus = async () => {
    if (!payment?.payment_id) return;

    try {
      setVerifying(true);
      const response = await paymentsAPI.verifyPayment(payment.payment_id);

      if (response.success && response.data.status !== paymentStatus) {
        setPaymentStatus(response.data.status);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleViewOrder = () => {
    if (order?.id) {
      navigate(`/orders/${order.id}`);
    } else {
      navigate('/orders');
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const getPaymentMethodDisplay = () => {
    switch (paymentInfo.method) {
      case 'mtn_momo':
        return 'MTN Mobile Money';
      case 'airtel_money':
        return 'Airtel Money';
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      default:
        return 'Payment';
    }
  };

  const getEstimatedDelivery = () => {
    if (!order) return 'Not specified';

    if (order.estimated_delivery) {
      return new Date(order.estimated_delivery).toLocaleDateString('en-UG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // Default estimation: 2-3 business days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    return deliveryDate.toLocaleDateString('en-UG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!order) {
    return (
      <div className="confirmation-error">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle" />
          <h3>Order Information Not Found</h3>
          <p>We couldn't load your order details. Please contact support if you need assistance.</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/')}
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation">
      <div className="confirmation-content">
        {/* Success Header */}
        <OrderSuccess
          order={order}
          paymentMethod={getPaymentMethodDisplay()}
          paymentStatus={paymentStatus}
        />

        {/* Payment Status Section */}
        {payment && (
          <PaymentStatus
            payment={payment}
            paymentInfo={paymentInfo}
            status={paymentStatus}
            verifying={verifying}
            onVerify={verifyPaymentStatus}
          />
        )}

        {/* Order Details */}
        <div className="order-details-section">
          <div className="section-header">
            <h3>Order Details</h3>
            <button
              className="btn-toggle-details"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
              <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'}`} />
            </button>
          </div>

          <div className="order-summary-card">
            <div className="order-header">
              <div className="order-info">
                <h4>Order #{order.order_number}</h4>
                <p>
                  Placed on{' '}
                  {new Date(order.created_at).toLocaleDateString('en-UG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="order-status">
                <span className={`status-badge ${order.status}`}>
                  {order.status_display || order.status}
                </span>
              </div>
            </div>

            {showDetails && (
              <div className="order-details-expanded">
                {/* Order Items */}
                <div className="items-section">
                  <h5>Order Items ({order.items?.length || 0})</h5>
                  <div className="items-list">
                    {order.items?.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-image">
                          <img
                            src={item.product_image || '/images/placeholder-product.jpg'}
                            alt={item.product_name}
                            onError={e => {
                              e.target.src = '/images/placeholder-product.jpg';
                            }}
                          />
                        </div>
                        <div className="item-details">
                          <div className="item-name">
                            {item.product_name}
                            {item.is_flash_sale_item && (
                              <span className="flash-sale-badge">
                                <i className="fas fa-bolt" />
                                Flash Sale
                              </span>
                            )}
                          </div>
                          <div className="item-meta">
                            <span>Qty: {item.quantity}</span>
                            <span>Price: {formatCurrency(parseFloat(item.unit_price))}</span>
                          </div>
                          <div className="item-total">
                            Total: {formatCurrency(parseFloat(item.total_price))}
                            {item.is_flash_sale_item && item.flash_sale_savings > 0 && (
                              <span className="savings">
                                (Saved: {formatCurrency(parseFloat(item.flash_sale_savings))})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Totals */}
                <div className="totals-section">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(parseFloat(order.subtotal))}</span>
                  </div>

                  {order.flash_sale_savings > 0 && (
                    <div className="total-row savings">
                      <span>
                        <i className="fas fa-bolt" />
                        Flash Sale Savings:
                      </span>
                      <span>-{formatCurrency(parseFloat(order.flash_sale_savings))}</span>
                    </div>
                  )}

                  {order.discount_amount > 0 && (
                    <div className="total-row discount">
                      <span>Discount:</span>
                      <span>-{formatCurrency(parseFloat(order.discount_amount))}</span>
                    </div>
                  )}

                  {order.tax_amount > 0 && (
                    <div className="total-row">
                      <span>Tax:</span>
                      <span>{formatCurrency(parseFloat(order.tax_amount))}</span>
                    </div>
                  )}

                  {order.delivery_fee > 0 && (
                    <div className="total-row">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(parseFloat(order.delivery_fee))}</span>
                    </div>
                  )}

                  <div className="total-row final-total">
                    <span>Total:</span>
                    <span>{formatCurrency(parseFloat(order.total_amount))}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="delivery-info-section">
          <h3>Delivery Information</h3>
          <div className="delivery-card">
            <div className="delivery-details">
              <div className="detail-item">
                <i className="fas fa-user" />
                <div>
                  <strong>Recipient:</strong>
                  <p>
                    {customerInfo.first_name} {customerInfo.last_name}
                  </p>
                </div>
              </div>

              <div className="detail-item">
                <i className="fas fa-phone" />
                <div>
                  <strong>Phone:</strong>
                  <p>{customerInfo.phone}</p>
                </div>
              </div>

              <div className="detail-item">
                <i className="fas fa-envelope" />
                <div>
                  <strong>Email:</strong>
                  <p>{customerInfo.email}</p>
                </div>
              </div>

              <div className="detail-item">
                <i className="fas fa-map-marker-alt" />
                <div>
                  <strong>Delivery Address:</strong>
                  <p>
                    {addressInfo.address_line_1}
                    {addressInfo.address_line_2 && (
                      <>
                        <br />
                        {addressInfo.address_line_2}
                      </>
                    )}
                    <br />
                    {addressInfo.city}, {addressInfo.district}
                    {addressInfo.postal_code && <> {addressInfo.postal_code}</>}
                  </p>
                </div>
              </div>

              <div className="detail-item">
                <i className="fas fa-calendar" />
                <div>
                  <strong>Estimated Delivery:</strong>
                  <p>{getEstimatedDelivery()}</p>
                </div>
              </div>

              {addressInfo.delivery_notes && (
                <div className="detail-item">
                  <i className="fas fa-sticky-note" />
                  <div>
                    <strong>Delivery Notes:</strong>
                    <p>{addressInfo.delivery_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="payment-info-section">
          <h3>Payment Information</h3>
          <div className="payment-card">
            <div className="payment-method">
              <div className="method-info">
                <i
                  className={`fas ${
                    paymentInfo.method === 'mtn_momo'
                      ? 'fa-mobile-alt'
                      : paymentInfo.method === 'airtel_money' ? 'fa-mobile-alt'
                      : 'fa-money-bill-wave'
                  }`}
                ></i>
                <div>
                  <strong>{getPaymentMethodDisplay()}</strong>
                  {paymentInfo.method === 'mtn_momo' && paymentInfo.phone_number && (
                    <p>Phone: {paymentInfo.phone_number}</p>
                  )}
                  {paymentInfo.method === 'airtel_money' && paymentInfo.phone_number && (
                    <p>Phone: {paymentInfo.phone_number}</p>
                  )}
                  {paymentInfo.method === 'cash_on_delivery' && <p>Pay with cash upon delivery</p>}
                </div>
              </div>
            </div>

            {payment && (
              <div className="payment-details">
                <div className="detail-row">
                  <span>Payment Reference:</span>
                  <span className="reference-code">{payment.reference_number}</span>
                </div>

                <div className="detail-row">
                  <span>Amount:</span>
                  <span>{formatCurrency(parseFloat(payment.amount || order.total_amount))}</span>
                </div>

                <div className="detail-row">
                  <span>Status:</span>
                  <span className={`payment-status ${paymentStatus}`}>
                    {paymentStatus === 'completed'
                      ? 'Completed'
                      : paymentStatus === 'processing' ? 'Processing'
                      : paymentStatus === 'pending' ? 'Pending'
                      : paymentStatus === 'failed' ? 'Failed'
                      : paymentStatus}
                  </span>
                </div>

                {payment.transaction_id && (
                  <div className="detail-row">
                    <span>Transaction ID:</span>
                    <span className="transaction-id">{payment.transaction_id}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps-section">
          <h3>What Happens Next?</h3>
          <div className="steps-timeline">
            {paymentInfo.method === 'cash_on_delivery' ? (
              <>
                <div className="timeline-step completed">
                  <div className="step-icon">
                    <i className="fas fa-check" />
                  </div>
                  <div className="step-content">
                    <strong>Order Received</strong>
                    <p>Your order has been confirmed and is being prepared</p>
                  </div>
                </div>

                <div className="timeline-step">
                  <div className="step-icon">
                    <i className="fas fa-box" />
                  </div>
                  <div className="step-content">
                    <strong>Order Processing</strong>
                    <p>We're preparing your items for delivery</p>
                  </div>
                </div>

                <div className="timeline-step">
                  <div className="step-icon">
                    <i className="fas fa-phone" />
                  </div>
                  <div className="step-content">
                    <strong>Delivery Call</strong>
                    <p>Our delivery team will call you before arriving</p>
                  </div>
                </div>

                <div className="timeline-step">
                  <div className="step-icon">
                    <i className="fas fa-truck" />
                  </div>
                  <div className="step-content">
                    <strong>Delivery & Payment</strong>
                    <p>Pay with cash when your order arrives</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`timeline-step ${
                    paymentStatus === 'completed' ? 'completed' : 'pending'
                  }`}
                >
                  <div className="step-icon">
                    <i className="fas fa-credit-card" />
                  </div>
                  <div className="step-content">
                    <strong>Payment Processing</strong>
                    <p>
                      {paymentStatus === 'completed'
                        ? 'Payment successful!'
                        : paymentStatus === 'processing' ? 'Waiting for payment confirmation'
                        : 'Complete payment on your phone'}
                    </p>
                  </div>
                </div>

                <div
                  className={`timeline-step ${
                    paymentStatus === 'completed' ? 'active' : 'pending'
                  }`}
                >
                  <div className="step-icon">
                    <i className="fas fa-box" />
                  </div>
                  <div className="step-content">
                    <strong>Order Processing</strong>
                    <p>We'll start preparing your order once payment is confirmed</p>
                  </div>
                </div>

                <div className="timeline-step pending">
                  <div className="step-icon">
                    <i className="fas fa-truck" />
                  </div>
                  <div className="step-content">
                    <strong>Delivery</strong>
                    <p>Your order will be delivered to your address</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <button
            className="btn-secondary"
            onClick={handleContinueShopping}
          >
            <i className="fas fa-shopping-bag" />
            Continue Shopping
          </button>

          <button
            className="btn-primary"
            onClick={handleViewOrder}
          >
            <i className="fas fa-eye" />
            View Order Details
          </button>
        </div>

        {/* Support Info */}
        <div className="support-info">
          <div className="support-content">
            <h4>Need Help?</h4>
            <p>If you have any questions about your order, please don't hesitate to contact us.</p>

            <div className="support-contacts">
              <a href="tel:+256700000000" className="support-contact">
                <i className="fas fa-phone" />
                +256 700 000 000
              </a>

              <a href="mailto:support@shoponline.com" className="support-contact">
                <i className="fas fa-envelope" />
                support@shoponline.com
              </a>

              <a href="/help" className="support-contact">
                <i className="fas fa-question-circle" />
                Help Center
              </a>
            </div>
          </div>
        </div>

        {/* Order Reference */}
        <div className="order-reference">
          <div className="reference-content">
            <i className="fas fa-bookmark" />
            <div>
              <strong>Save this reference for your records:</strong>
              <p>Order #{order.order_number}</p>
              {payment?.reference_number && <p>Payment Reference: {payment.reference_number}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;