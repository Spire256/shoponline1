import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const staticSettings = {
    site_name: 'ShopOnline Uganda',
    contact_email: 'support@shoponlineuganda.com',
    contact_phone: '+256 700 123 456',
    contact_address: 'Kampala, Uganda',
    social_facebook: 'https://facebook.com/shoponlineuganda',
    social_twitter: 'https://twitter.com/shoponlineug',
    social_instagram: 'https://instagram.com/shoponlineuganda',
    social_whatsapp: '256700123456',
  };

  return (
    <footer className="footer bg-blue-500 text-slate-50">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">
              {staticSettings.site_name}
            </h3>
            <p className="text-slate-200 text-sm leading-relaxed mb-4">
              Your trusted e-commerce platform for quality products and fast local delivery in Uganda.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Quick Links</h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <Link to="/" className="text-sm hover:text-blue-300 transition-colors">Home</Link>
              <Link to="/products" className="text-sm hover:text-blue-300 transition-colors">Products</Link>
              <Link to="/about" className="text-sm hover:text-blue-300 transition-colors">About Us</Link>
              <Link to="/contact" className="text-sm hover:text-blue-300 transition-colors">Contact</Link>
              <Link to="/help" className="text-sm hover:text-blue-300 transition-colors">Help Center</Link>
              <Link to="/privacy" className="text-sm hover:text-blue-300 transition-colors">Privacy</Link>
            </div>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Contact & Follow</h3>
            
            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <p className="text-sm text-blue-100">📧 {staticSettings.contact_email}</p>
              <p className="text-sm text-slate-200">📞 {staticSettings.contact_phone}</p>
              <p className="text-sm text-slate-200">📍 {staticSettings.contact_address}</p>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={staticSettings.social_facebook}
                className="text-sm hover:text-blue-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
              <a
                href={staticSettings.social_twitter}
                className="text-sm hover:text-blue-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
              <a
                href={staticSettings.social_instagram}
                className="text-sm hover:text-blue-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                href={`https://wa.me/${staticSettings.social_whatsapp}`}
                className="text-sm hover:text-blue-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-500 mt-6 pt-4 text-center">
          <p className="text-sm text-slate-200">
            &copy; {new Date().getFullYear()} {staticSettings.site_name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;