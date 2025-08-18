import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import categoriesAPI from '../../../services/api/categoriesAPI';
import productsAPI from '../../../services/api/productsAPI';

const Breadcrumb = () => {
  const location = useLocation();
  const { slug } = useParams();
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Home', path: '/' }]);

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const pathSegments = location.pathname.split('/').filter(segment => segment);
      let newBreadcrumbs = [{ name: 'Home', path: '/' }];

      if (pathSegments[0] === 'categories' && slug) {
        try {
          const response = await categoriesAPI.getCategory(slug);
          const category = response.data;
          newBreadcrumbs = [
            ...newBreadcrumbs,
            ...category.breadcrumb_trail.map(item => ({
              name: item.name,
              path: `/categories/${item.slug}`,
            })),
          ];
        } catch (error) {
          console.error('Failed to fetch category:', error);
        }
      } else if (pathSegments[0] === 'products' && slug) {
        try {
          const response = await productsAPI.getProduct(slug);
          const product = response.data;
          const categoryResponse = await categoriesAPI.getCategory(product.category.slug);
          const categoryTrail = categoryResponse.data.breadcrumb_trail;
          newBreadcrumbs = [
            ...newBreadcrumbs,
            ...categoryTrail.map(item => ({
              name: item.name,
              path: `/categories/${item.slug}`,
            })),
            { name: product.name, path: `/products/${product.slug}` },
          ];
        } catch (error) {
          console.error('Failed to fetch product or category:', error);
        }
      } else if (pathSegments[0] === 'profile') {
        newBreadcrumbs.push({ name: 'Profile', path: '/profile' });
      } else if (pathSegments[0] === 'orders') {
        newBreadcrumbs.push({ name: 'My Orders', path: '/orders' });
      } else if (pathSegments[0] === 'cart') {
        newBreadcrumbs.push({ name: 'Cart', path: '/cart' });
      }

      setBreadcrumbs(newBreadcrumbs);
    };

    generateBreadcrumbs();
  }, [location.pathname, slug]);

  return (
    <nav className="breadcrumb bg-white py-4 px-4 border-b border-gray-200">
      <ul className="flex space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link to={crumb.path} className="text-primary-blue hover:underline">
                  {crumb.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            ) : (
              <span className="text-gray-600">{crumb.name}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
