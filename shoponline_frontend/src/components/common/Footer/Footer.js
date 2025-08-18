import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FooterLinks from './FooterLinks';
import categoriesAPI from '../../../services/api/categoriesAPI';
import adminAPI from '../../../services/api/adminAPI';
import './Footer.css';

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch active root categories
        const categoriesResponse = await categoriesAPI.getCategories({
          parent: 'root',
          is_active: true,
        });
        setCategories(categoriesResponse.data);

        // Fetch site settings
        const settingsResponse = await adminAPI.siteSettings.getSettings();
        setSiteSettings(settingsResponse.data);
      } catch (err) {
        console.error('Failed to fetch footer data:', err);
        setError('Failed to load footer content');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="footer bg-dark-blue text-white py-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="footer bg-dark-blue text-white py-8 text-center">{error}</div>;
  }

  return (
    <footer className="footer bg-dark-blue text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Shop Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {siteSettings?.site_name || 'ShopOnline Uganda'}
            </h3>
            <p className="text-gray-300 mb-4">
              Your trusted e-commerce platform for quality products and fast local delivery in
              Uganda.
            </p>
            <div className="space-y-2">
              <p>Email: {siteSettings?.contact_email || 'support@shoponline.com'}</p>
              <p>Phone: {siteSettings?.contact_phone || '+256 123 456 789'}</p>
              {siteSettings?.contact_address && <p>Address: {siteSettings.contact_address}</p>}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <FooterLinks categories={categories} />
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop by Category</h3>
            <ul className="space-y-2">
              {categories.map(category => (
                <li key={category.id}>
                  <Link
                    to={`/categories/${category.slug}`}
                    className="hover:text-primary-blue transition"
                  >
                    {category.name} ({category.product_count})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media & Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              {siteSettings?.social_facebook && (
                <a
                  href={siteSettings.social_facebook}
                  className="hover:text-primary-blue transition"
                >
                  Facebook
                </a>
              )}
              {siteSettings?.social_twitter && (
                <a
                  href={siteSettings.social_twitter}
                  className="hover:text-primary-blue transition"
                >
                  Twitter
                </a>
              )}
              {siteSettings?.social_instagram && (
                <a
                  href={siteSettings.social_instagram}
                  className="hover:text-primary-blue transition"
                >
                  Instagram
                </a>
              )}
              {siteSettings?.social_whatsapp && (
                <a
                  href={`https://wa.me/${siteSettings.social_whatsapp}`}
                  className="hover:text-primary-blue transition"
                >
                  WhatsApp
                </a>
              )}
            </div>
            <div>
              <h4 className="text-md font-medium mb-2">Newsletter</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-grow p-2 rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <button
                  type="button"
                  className="bg-primary-blue hover:bg-blue-700 text-white px-4 py-2 rounded-r-md transition"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-4 text-center">
          <p>
            &copy; {new Date().getFullYear()} {siteSettings?.site_name || 'ShopOnline Uganda'}. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
