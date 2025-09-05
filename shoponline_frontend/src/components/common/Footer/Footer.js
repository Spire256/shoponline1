import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('');

  // Static site information
  const siteInfo = {
    name: 'ShopOnline Uganda',
    tagline: 'Your trusted e-commerce platform for quality products and fast local delivery in Uganda.',
    email: 'support@shoponlineuganda.com',
    phone: '+256 700 123 456',
    whatsapp: '+256 700 123 456',
    address: 'Plot 123, Kampala Road, Kampala, Uganda',
    businessHours: 'Mon-Fri: 8AM-8PM, Sat: 9AM-6PM, Sun: 10AM-4PM',
  };

  // Static categories
  const categories = [
    { id: 1, name: 'Electronics', slug: 'electronics', count: 156 },
    { id: 2, name: 'Fashion & Clothing', slug: 'fashion', count: 234 },
    { id: 3, name: 'Home & Garden', slug: 'home-garden', count: 189 },
    { id: 4, name: 'Sports & Fitness', slug: 'sports', count: 87 },
    { id: 5, name: 'Beauty & Health', slug: 'beauty-health', count: 145 },
    { id: 6, name: 'Books & Media', slug: 'books-media', count: 92 },
    { id: 7, name: 'Automotive', slug: 'automotive', count: 67 },
    { id: 8, name: 'Baby & Kids', slug: 'baby-kids', count: 124 },
  ];

  // Social media links
  const socialLinks = {
    facebook: 'https://facebook.com/shoponlineuganda',
    twitter: 'https://twitter.com/shoponlineug',
    instagram: 'https://instagram.com/shoponlineuganda',
    linkedin: 'https://linkedin.com/company/shoponlineuganda',
    youtube: 'https://youtube.com/@shoponlineuganda',
    tiktok: 'https://tiktok.com/@shoponlineuganda',
  };

  // Quick links
  const quickLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Track Your Order', path: '/track-order' },
    { name: 'Shipping Info', path: '/shipping' },
    { name: 'Returns & Exchanges', path: '/returns' },
    { name: 'Size Guide', path: '/size-guide' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Help Center', path: '/help' },
  ];

  // Customer service links
  const customerService = [
    { name: 'Customer Support', path: '/support' },
    { name: 'Live Chat', path: '/chat' },
    { name: 'Order Status', path: '/order-status' },
    { name: 'Payment Methods', path: '/payment-methods' },
    { name: 'Delivery Options', path: '/delivery' },
    { name: 'Bulk Orders', path: '/wholesale' },
    { name: 'Gift Cards', path: '/gift-cards' },
    { name: 'Loyalty Program', path: '/loyalty' },
  ];

  // Legal & policy links
  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Cookie Policy', path: '/cookies' },
    { name: 'Refund Policy', path: '/refund-policy' },
    { name: 'Security', path: '/security' },
    { name: 'Accessibility', path: '/accessibility' },
  ];

  // Payment methods accepted
  const paymentMethods = [
    'Mobile Money (MTN, Airtel)',
    'Visa & Mastercard',
    'Bank Transfer',
    'Cash on Delivery',
  ];

  // Handle newsletter subscription
  const handleNewsletterSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      setSubscribeStatus('Please enter your email address');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setSubscribeStatus('Please enter a valid email address');
      return;
    }
    
    // Simulate subscription
    setSubscribeStatus('Thank you for subscribing!');
    setEmail('');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setSubscribeStatus('');
    }, 3000);
  };

  return (
    <footer className="footer bg-dark-blue text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-3">{siteInfo.name}</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {siteInfo.tagline}
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-primary-blue">📧</span>
                <a 
                  href={`mailto:${siteInfo.email}`}
                  className="hover:text-primary-blue transition duration-300"
                >
                  {siteInfo.email}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-primary-blue">📞</span>
                <a 
                  href={`tel:${siteInfo.phone}`}
                  className="hover:text-primary-blue transition duration-300"
                >
                  {siteInfo.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-primary-blue">💬</span>
                <a 
                  href={`https://wa.me/${siteInfo.whatsapp.replace(/\D/g, '')}`}
                  className="hover:text-primary-blue transition duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Support
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary-blue mt-1">📍</span>
                <span className="text-gray-300">{siteInfo.address}</span>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-primary-blue">Business Hours</h4>
              <p className="text-sm text-gray-300">{siteInfo.businessHours}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary-blue">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white hover:text-primary-blue transition duration-300 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary-blue">Customer Service</h4>
            <ul className="space-y-2">
              {customerService.map((service, index) => (
                <li key={index}>
                  <Link
                    to={service.path}
                    className="text-gray-300 hover:text-white hover:text-primary-blue transition duration-300 text-sm"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary-blue">Shop by Category</h4>
            <ul className="space-y-2">
              {categories.slice(0, 8).map(category => (
                <li key={category.id}>
                  <Link
                    to={`/categories/${category.slug}`}
                    className="text-gray-300 hover:text-white hover:text-primary-blue transition duration-300 text-sm flex justify-between"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {category.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/categories"
              className="text-primary-blue hover:text-blue-300 text-sm mt-3 inline-block transition duration-300"
            >
              View All Categories →
            </Link>
          </div>
        </div>

        {/* Newsletter & Social Media Section */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Newsletter Subscription */}
            <div>
              <h4 className="text-xl font-semibold mb-4 text-primary-blue">Stay Updated</h4>
              <p className="text-gray-300 mb-4">
                Subscribe to get special offers, free giveaways, and exclusive deals.
              </p>
              <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-blue hover:bg-blue-600 text-white font-medium rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Subscribe
                </button>
              </form>
              {subscribeStatus && (
                <p className={`mt-2 text-sm ${
                  subscribeStatus.includes('Thank you') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {subscribeStatus}
                </p>
              )}
            </div>

            {/* Social Media Links */}
            <div>
              <h4 className="text-xl font-semibold mb-4 text-primary-blue">Connect With Us</h4>
              <p className="text-gray-300 mb-4">
                Follow us on social media for updates, tips, and community highlights.
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-primary-blue text-white px-4 py-2 rounded-lg transition duration-300 capitalize text-sm font-medium"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods & Additional Info */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Payment Methods */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-primary-blue">Payment Methods</h4>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="bg-gray-800 px-3 py-2 rounded text-sm text-center">
                    {method}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Features */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-primary-blue">Why Shop With Us</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm">Free delivery across Kampala for orders above UGX 50,000</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm">30-day return policy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm">Secure payment processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm">24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-gray-700 pt-6 mb-6">
          <div className="flex flex-wrap justify-center gap-4">
            {legalLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="text-gray-400 hover:text-white text-sm transition duration-300"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {siteInfo.name}. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Made with ❤️ in Uganda | Proudly serving Ugandan customers since 2020
            </p>
          </div>
          
          {/* Additional Legal Text */}
          <div className="mt-4 text-xs text-gray-500 max-w-4xl mx-auto">
            <p>
              All product names, logos, and brands are property of their respective owners. 
              All company, product and service names used in this website are for identification purposes only. 
              Use of these names, logos, and brands does not imply endorsement.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;