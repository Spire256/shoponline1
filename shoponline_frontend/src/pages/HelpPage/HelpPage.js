import React, { useState } from 'react';
import './HelpPage.css';

const HelpPage = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const helpSections = {
    'getting-started': {
      title: 'Getting Started',
      content: [
        {
          question: 'How do I create an account?',
          answer: 'To create an account, click on "Sign Up" in the top right corner. You can register with any Gmail address. Fill in your details and verify your email to get started.'
        },
        {
          question: 'How do I browse products?',
          answer: 'You can browse products by category using the navigation menu, use the search bar to find specific items, or explore our featured products on the homepage.'
        },
        {
          question: 'What is a Flash Sale?',
          answer: 'Flash Sales are time-limited discounts on selected products. They appear on our homepage and have countdown timers showing how much time is left. Don\'t miss out on these special deals!'
        }
      ]
    },
    'shopping': {
      title: 'Shopping & Orders',
      content: [
        {
          question: 'How do I add items to my cart?',
          answer: 'Click the "Add to Cart" button on any product page. You can view your cart by clicking the cart icon in the top right corner and adjust quantities there.'
        },
        {
          question: 'How do I place an order?',
          answer: 'After adding items to your cart, click "Checkout". Fill in your delivery information, choose your payment method (Mobile Money or Cash on Delivery), and confirm your order.'
        },
        {
          question: 'Can I cancel or modify my order?',
          answer: 'You can cancel or modify your order within 30 minutes of placing it. Contact our support team immediately or call us at +256 XXX XXX XXX.'
        },
        {
          question: 'How can I track my order?',
          answer: 'Go to "My Account" > "Order History" to view all your orders and their current status. You\'ll also receive email updates when your order status changes.'
        }
      ]
    },
    'payments': {
      title: 'Payments & Billing',
      content: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept MTN Mobile Money, Airtel Money, and Cash on Delivery (COD). All payments are processed in Uganda Shillings (UGX).'
        },
        {
          question: 'How does Mobile Money payment work?',
          answer: 'Select MTN MoMo or Airtel Money at checkout, enter your phone number, and follow the prompts on your phone to complete the payment securely.'
        },
        {
          question: 'What is Cash on Delivery?',
          answer: 'Cash on Delivery means you pay when your order is delivered to you. There may be additional delivery charges for COD orders.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Yes, all payment transactions are encrypted and secure. We never store your Mobile Money PIN or financial details.'
        }
      ]
    },
    'delivery': {
      title: 'Delivery & Shipping',
      content: [
        {
          question: 'Do you deliver nationwide?',
          answer: 'We currently deliver within Uganda. Delivery times and charges vary by location. Kampala and major cities typically receive next-day delivery.'
        },
        {
          question: 'How much does delivery cost?',
          answer: 'Delivery costs depend on your location and order value. Free delivery is available for orders above UGX 200,000 in Kampala and UGX 300,000 for other areas.'
        },
        {
          question: 'How long does delivery take?',
          answer: 'Kampala: 1-2 business days, Major cities: 2-3 business days, Rural areas: 3-5 business days. You\'ll receive a delivery confirmation call before delivery.'
        },
        {
          question: 'What if I\'m not home during delivery?',
          answer: 'Our delivery team will call you before arriving. If you\'re not available, they can arrange a convenient time or deliver to a trusted neighbor with your permission.'
        }
      ]
    },
    'account': {
      title: 'Account Management',
      content: [
        {
          question: 'How do I reset my password?',
          answer: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email we send you.'
        },
        {
          question: 'How do I update my profile information?',
          answer: 'Go to "My Account" > "Profile" to update your personal information, delivery address, and contact details.'
        },
        {
          question: 'Can I delete my account?',
          answer: 'Yes, you can request account deletion by contacting our support team. Note that this action is irreversible and will delete all your order history.'
        }
      ]
    },
    'returns': {
      title: 'Returns & Refunds',
      content: [
        {
          question: 'What is your return policy?',
          answer: 'You can return items within 7 days of delivery if they are unused and in original packaging. Electronics and perishable items have specific return conditions.'
        },
        {
          question: 'How do I return an item?',
          answer: 'Contact our support team to initiate a return. We\'ll arrange pickup and provide you with a return reference number.'
        },
        {
          question: 'When will I receive my refund?',
          answer: 'Refunds are processed within 5-7 business days after we receive the returned item. Mobile Money refunds are instant, while bank transfers may take 3-5 days.'
        }
      ]
    }
  };

  const filteredSections = Object.entries(helpSections).map(([key, section]) => ({
    key,
    ...section,
    content: section.content.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.content.length > 0 || searchQuery === '');

  return (
    <div className="help-page">
      <div className="help-container">
        {/* Header */}
        <div className="help-header">
          <h1>Help Center</h1>
          <p>Find answers to common questions and get support</p>
          
          {/* Search */}
          <div className="help-search">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="help-content">
          {/* Sidebar Navigation */}
          <aside className="help-sidebar">
            <nav className="help-nav">
              <h3>Categories</h3>
              <ul>
                {Object.entries(helpSections).map(([key, section]) => (
                  <li key={key}>
                    <button
                      className={`nav-item ${activeSection === key ? 'active' : ''}`}
                      onClick={() => setActiveSection(key)}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Quick Contact */}
            <div className="quick-contact">
              <h4>Still need help?</h4>
              <div className="contact-options">
                <a href="/contact" className="contact-link">
                  Contact Support
                </a>
                <a href="tel:+256XXXXXXXX" className="contact-link">
                  Call Us
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="help-main">
            {searchQuery ? (
              <div className="search-results">
                <h2>Search Results for "{searchQuery}"</h2>
                {filteredSections.length === 0 ? (
                  <div className="no-results">
                    <p>No results found. Try different keywords or browse our categories.</p>
                  </div>
                ) : (
                  filteredSections.map((section) => (
                    section.content.map((item, index) => (
                      <div key={`${section.key}-${index}`} className="faq-item">
                        <h3>{item.question}</h3>
                        <p>{item.answer}</p>
                        <span className="category-tag">{section.title}</span>
                      </div>
                    ))
                  ))
                )}
              </div>
            ) : (
              <div className="help-section">
                <h2>{helpSections[activeSection]?.title}</h2>
                <div className="faq-list">
                  {helpSections[activeSection]?.content.map((item, index) => (
                    <div key={index} className="faq-item">
                      <h3>{item.question}</h3>
                      <p>{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;