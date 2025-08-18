import React from 'react';
import { Link } from 'react-router-dom';

const FooterLinks = ({ categories }) => {
  return (
    <ul className="space-y-2">
      <li>
        <Link to="/" className="hover:text-primary-blue transition">
          Home
        </Link>
      </li>
      <li>
        <Link to="/flash-sales" className="hover:text-primary-blue transition">
          Flash Sales
        </Link>
      </li>
      <li>
        <Link to="/cart" className="hover:text-primary-blue transition">
          Cart
        </Link>
      </li>
      <li>
        <Link to="/contact" className="hover:text-primary-blue transition">
          Contact Us
        </Link>
      </li>
    </ul>
  );
};

export default FooterLinks;
