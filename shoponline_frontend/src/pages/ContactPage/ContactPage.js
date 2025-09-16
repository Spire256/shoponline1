import React, { useState } from 'react';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: 'general',
    message: '',
    orderNumber: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: 'general',
        message: '',
        orderNumber: ''
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: '📞',
      title: 'Call Us',
      details: [
        '+256 XXX XXX XXX (Main)',
        '+256 XXX XXX XXX (Support)',
        'Mon-Fri: 8:00 AM - 8:00 PM',
        'Sat-Sun: 9:00 AM - 6:00 PM'
      ]
    },
    {
      icon: '✉️',
      title: 'Email Support',
      details: [
        'support@shoponline.com',
        'orders@shoponline.com',
        'We respond within 24 hours',
        'Priority support for urgent issues'
      ]
    },
    {
      icon: '📍',
      title: 'Visit Our Office',
      details: [
        'Shop Online Uganda',
        'Plot XXX, Kampala Road',
        'Kampala, Uganda',
        'Mon-Fri: 9:00 AM - 5:00 PM'
      ]
    },
    {
      icon: '💬',
      title: 'Live Chat',
      details: [
        'Available on website',
        'Instant responses during',
        'business hours',
        'WhatsApp: +256 XXX XXX XXX'
      ]
    }
  ];

  const faqQuick = [
    {
      question: 'How do I track my order?',
      answer: 'Go to "My Account" > "Order History" to track all your orders in real-time.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept MTN Mobile Money, Airtel Money, and Cash on Delivery.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Kampala: 1-2 days, Major cities: 2-3 days, Rural areas: 3-5 days.'
    },
    {
      question: 'Can I return items?',
      answer: 'Yes, you can return items within 7 days in original packaging.'
    }
  ];

  return (
    <div className="contact-page">
      <div className="contact-container">
        {/* Header */}
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>We're here to help! Reach out to us through any of the methods below.</p>
        </div>

        {/* Contact Methods Grid */}
        <div className="contact-methods">
          {contactInfo.map((method, index) => (
            <div key={index} className="contact-card">
              <div className="contact-icon">{method.icon}</div>
              <h3>{method.title}</h3>
              {method.details.map((detail, idx) => (
                <p key={idx} className={idx === 0 ? 'primary-detail' : 'secondary-detail'}>
                  {detail}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="contact-content">
          {/* Contact Form */}
          <div className="contact-form-section">
            <h2>Send us a Message</h2>
            <div className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+256 XXX XXX XXX"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="order">Order Support</option>
                    <option value="payment">Payment Issues</option>
                    <option value="delivery">Delivery Questions</option>
                    <option value="returns">Returns & Refunds</option>
                    <option value="technical">Technical Support</option>
                    <option value="complaint">Complaint</option>
                    <option value="feedback">Feedback & Suggestions</option>
                  </select>
                </div>
              </div>

              {formData.category === 'order' && (
                <div className="form-group">
                  <label htmlFor="orderNumber">Order Number</label>
                  <input
                    type="text"
                    id="orderNumber"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., ORD-2024-001234"
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Brief description of your inquiry"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  className="form-textarea"
                  placeholder="Please provide as much detail as possible to help us assist you better..."
                ></textarea>
              </div>

              {submitStatus === 'success' && (
                <div className="alert alert-success">
                  <strong>Message sent successfully!</strong> We'll get back to you within 24 hours.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="alert alert-error">
                  <strong>Error sending message.</strong> Please try again or contact us directly.
                </div>
              )}

              <button 
                type="button"
                onClick={handleSubmit}
                className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="quick-faq-section">
            <h2>Quick Answers</h2>
            <p className="faq-intro">
              Looking for quick answers? Check these common questions:
            </p>
            
            <div className="faq-list">
              {faqQuick.map((item, index) => (
                <div key={index} className="faq-item">
                  <h4>{item.question}</h4>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>

            <div className="more-help">
              <p>Need more detailed help?</p>
              <a href="/help" className="help-center-link">
                Visit our Help Center
              </a>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="business-hours">
          <h2>Business Hours</h2>
          <div className="hours-grid">
            <div className="hours-item">
              <strong>Customer Support</strong>
              <p>Monday - Friday: 8:00 AM - 8:00 PM</p>
              <p>Saturday - Sunday: 9:00 AM - 6:00 PM</p>
            </div>
            <div className="hours-item">
              <strong>Order Processing</strong>
              <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
            <div className="hours-item">
              <strong>Delivery Operations</strong>
              <p>Monday - Saturday: 8:00 AM - 6:00 PM</p>
              <p>Sunday: Limited delivery (Kampala only)</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="emergency-contact">
          <div className="emergency-content">
            <h3>🚨 Urgent Issues?</h3>
            <p>For urgent delivery or payment issues, call us directly:</p>
            <a href="tel:+256XXXXXXXX" className="emergency-phone">
              +256 XXX XXX XXX
            </a>
            <p className="emergency-note">Available 24/7 for critical issues</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;