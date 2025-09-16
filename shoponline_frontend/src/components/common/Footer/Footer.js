import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, HelpCircle, MessageCircle, ExternalLink } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const location = useLocation();
  
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

  // Check if we're on help or contact pages
  const isHelpPage = location.pathname === '/help' || location.pathname.startsWith('/help');
  const isContactPage = location.pathname === '/contact' || location.pathname.startsWith('/contact');

  // Quick links with enhanced help/contact integration
  const quickLinks = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/flash-sales", label: "Flash Sales" },
    { to: "/about", label: "About Us" },
    { to: "/help", label: "Help Center", icon: HelpCircle, highlight: isHelpPage },
    { to: "/contact", label: "Contact", icon: Mail, highlight: isContactPage },
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/terms", label: "Terms of Service" }
  ];

  // Contact methods with enhanced integration
  const contactMethods = [
    {
      icon: Mail,
      text: staticSettings.contact_email,
      href: `mailto:${staticSettings.contact_email}`,
      label: "Email Support"
    },
    {
      icon: Phone,
      text: staticSettings.contact_phone,
      href: `tel:${staticSettings.contact_phone}`,
      label: "Call Us"
    },
    {
      icon: MessageCircle,
      text: "WhatsApp Support",
      href: `https://wa.me/${staticSettings.social_whatsapp}?text=Hello%2C%20I%20need%20help%20with%20my%20order`,
      label: "WhatsApp Chat",
      external: true
    },
    {
      icon: MapPin,
      text: staticSettings.contact_address,
      href: null,
      label: "Our Location"
    }
  ];

  // Social links with icons
  const socialLinks = [
    {
      name: "Facebook",
      url: staticSettings.social_facebook,
      icon: "📘"
    },
    {
      name: "Twitter", 
      url: staticSettings.social_twitter,
      icon: "🐦"
    },
    {
      name: "Instagram",
      url: staticSettings.social_instagram,
      icon: "📷"
    },
    {
      name: "WhatsApp",
      url: `https://wa.me/${staticSettings.social_whatsapp}`,
      icon: "💬"
    }
  ];

  return (
    <footer className={`footer bg-blue-500 text-slate-50 ${isHelpPage || isContactPage ? 'footer--support' : ''}`}>
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-white">
              {staticSettings.site_name}
            </h3>
            <p className="text-slate-200 text-sm leading-relaxed mb-4">
              Your trusted e-commerce platform for quality products and fast local delivery in Uganda.
            </p>
            
            {/* Enhanced CTA for help/contact pages */}
            {(isHelpPage || isContactPage) && (
              <div className="mt-4 p-3 bg-blue-600 rounded-lg border border-blue-400">
                <p className="text-sm text-blue-100 mb-2">
                  <HelpCircle className="inline w-4 h-4 mr-1" />
                  Need immediate help?
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${staticSettings.contact_phone}`}
                    className="text-xs bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    Call Now
                  </a>
                  <a
                    href={`https://wa.me/${staticSettings.social_whatsapp}?text=I%20need%20urgent%20help`}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-white">Quick Links</h3>
            <div className="space-y-2">
              {quickLinks.map((link, index) => {
                const IconComponent = link.icon;
                return (
                  <Link 
                    key={index}
                    to={link.to} 
                    className={`text-sm hover:text-blue-300 transition-colors flex items-center gap-2 ${
                      link.highlight ? 'text-blue-200 font-medium' : ''
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                    {link.label}
                    {link.highlight && <span className="text-xs bg-blue-400 px-2 py-0.5 rounded-full">Active</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-white">Contact Info</h3>
            <div className="space-y-3">
              {contactMethods.map((contact, index) => {
                const IconComponent = contact.icon;
                return (
                  <div key={index} className="flex items-start gap-2">
                    <IconComponent className="w-4 h-4 mt-0.5 text-blue-200 flex-shrink-0" />
                    <div className="flex-1">
                      {contact.href ? (
                        <a
                          href={contact.href}
                          className="text-sm text-slate-200 hover:text-blue-300 transition-colors"
                          target={contact.external ? "_blank" : undefined}
                          rel={contact.external ? "noopener noreferrer" : undefined}
                        >
                          {contact.text}
                          {contact.external && <ExternalLink className="inline w-3 h-3 ml-1" />}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-200">{contact.text}</span>
                      )}
                      <div className="text-xs text-blue-200">{contact.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support & Social */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-white">Support & Social</h3>
            
            {/* Support Links */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-blue-200 mb-2">Customer Support</h4>
              <div className="space-y-1">
                <Link 
                  to="/help" 
                  className={`text-sm hover:text-blue-300 transition-colors flex items-center gap-2 ${
                    isHelpPage ? 'text-blue-200 font-medium' : ''
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  Help Center
                  {isHelpPage && <span className="text-xs bg-blue-400 px-2 py-0.5 rounded-full">Current</span>}
                </Link>
                <Link 
                  to="/contact" 
                  className={`text-sm hover:text-blue-300 transition-colors flex items-center gap-2 ${
                    isContactPage ? 'text-blue-200 font-medium' : ''
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Contact Form
                  {isContactPage && <span className="text-xs bg-blue-400 px-2 py-0.5 rounded-full">Current</span>}
                </Link>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-sm font-medium text-blue-200 mb-2">Follow Us</h4>
              <div className="grid grid-cols-2 gap-2">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    className="text-sm hover:text-blue-300 transition-colors flex items-center gap-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-base">{social.icon}</span>
                    <span className="truncate">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Bar for Support Pages */}
        <div className="border-t border-blue-400 mt-8 pt-6">
          {(isHelpPage || isContactPage) && (
            <div className="mb-4 p-4 bg-blue-600 rounded-lg border border-blue-400">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 text-blue-100">
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Still need help? We're here for you 24/7
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`mailto:${staticSettings.contact_email}`}
                    className="text-xs bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    Email Support
                  </a>
                  <a
                    href={`tel:${staticSettings.contact_phone}`}
                    className="text-xs bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition-colors inline-flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    Call Now
                  </a>
                  <a
                    href={`https://wa.me/${staticSettings.social_whatsapp}?text=Hello%2C%20I%20need%20support`}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-sm text-slate-200">
              &copy; {new Date().getFullYear()} {staticSettings.site_name}. All rights reserved.
            </p>
            <p className="text-xs text-blue-200 mt-1">
              {isHelpPage && "Visit our Help Center for instant answers to common questions."}
              {isContactPage && "Get in touch with our friendly customer support team."}
              {!isHelpPage && !isContactPage && "Your satisfaction is our priority. Shop with confidence."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;