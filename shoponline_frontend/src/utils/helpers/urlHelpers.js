// URL manipulation utilities for the Ugandan e-commerce platform
// Handles URL building, parameter parsing, and navigation utilities

/**
 * URL Building and Manipulation
 */
export const buildUrl = (baseUrl, path = '', params = {}) => {
  try {
    let url = baseUrl;

    // Add path if provided
    if (path) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) + cleanPath : baseUrl + cleanPath;
    }

    // Add query parameters if provided
    if (Object.keys(params).length > 0) {
      const queryString = buildQueryString(params);
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    return url;
  } catch (error) {
    console.error('Error building URL:', error);
    return baseUrl || '';
  }
};

export const buildQueryString = (params = {}) => {
  try {
    const searchParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      const value = params[key];

      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item !== null && item !== undefined && item !== '') {
              searchParams.append(key, String(item));
            }
          });
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  } catch (error) {
    console.error('Error building query string:', error);
    return '';
  }
};

export const parseQueryString = (queryString = '') => {
  try {
    const params = {};
    const urlParams = new URLSearchParams(
      queryString.startsWith('?') ? queryString.slice(1) : queryString
    );

    for (const [key, value] of urlParams.entries()) {
      if (params[key]) {
        // Handle multiple values for the same key
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    }

    return params;
  } catch (error) {
    console.error('Error parsing query string:', error);
    return {};
  }
};

export const updateQueryParams = (currentUrl, newParams = {}, removeParams = []) => {
  try {
    const [baseUrl, queryString] = currentUrl.split('?');
    const currentParams = parseQueryString(queryString);

    // Remove specified parameters
    removeParams.forEach(param => {
      delete currentParams[param];
    });

    // Add/update new parameters
    const updatedParams = { ...currentParams, ...newParams };

    // Remove empty values
    Object.keys(updatedParams).forEach(key => {
      if (
        updatedParams[key] === null ||
        updatedParams[key] === undefined ||
        updatedParams[key] === ''
      ) {
        delete updatedParams[key];
      }
    });

    const newQueryString = buildQueryString(updatedParams);
    return newQueryString ? `${baseUrl}?${newQueryString}` : baseUrl;
  } catch (error) {
    console.error('Error updating query params:', error);
    return currentUrl;
  }
};

export const removeQueryParams = (url, paramsToRemove = []) => {
  try {
    const [baseUrl, queryString] = url.split('?');

    if (!queryString) {
      return baseUrl;
    }

    const currentParams = parseQueryString(queryString);

    paramsToRemove.forEach(param => {
      delete currentParams[param];
    });

    const newQueryString = buildQueryString(currentParams);
    return newQueryString ? `${baseUrl}?${newQueryString}` : baseUrl;
  } catch (error) {
    console.error('Error removing query params:', error);
    return url;
  }
};

/**
 * URL Path Manipulation
 */
export const joinPaths = (...paths) => {
  try {
    return paths
      .filter(path => path && typeof path === 'string')
      .map(path => path.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
      .filter(path => path.length > 0)
      .join('/');
  } catch (error) {
    console.error('Error joining paths:', error);
    return '';
  }
};

export const getPathSegments = url => {
  try {
    const [pathOnly] = url.split('?');
    return pathOnly.split('/').filter(segment => segment.length > 0);
  } catch (error) {
    console.error('Error getting path segments:', error);
    return [];
  }
};

export const getLastPathSegment = url => {
  try {
    const segments = getPathSegments(url);
    return segments.length > 0 ? segments[segments.length - 1] : '';
  } catch (error) {
    console.error('Error getting last path segment:', error);
    return '';
  }
};

export const replacePathSegment = (url, index, newSegment) => {
  try {
    const [pathOnly, queryString] = url.split('?');
    const segments = getPathSegments(pathOnly);

    if (index >= 0 && index < segments.length) {
      segments[index] = newSegment;
    }

    const newPath = `/${segments.join('/')}`;
    return queryString ? `${newPath}?${queryString}` : newPath;
  } catch (error) {
    console.error('Error replacing path segment:', error);
    return url;
  }
};

/**
 * URL Validation and Utilities
 */
export const isValidUrl = url => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isRelativeUrl = url => {
  try {
    return !url.includes('://') && !url.startsWith('//');
  } catch (error) {
    return false;
  }
};

export const isAbsoluteUrl = url => {
  try {
    return url.includes('://') || url.startsWith('//');
  } catch (error) {
    return false;
  }
};

export const getUrlDomain = url => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Error getting URL domain:', error);
    return '';
  }
};

export const isSameDomain = (url1, url2) => {
  try {
    return getUrlDomain(url1) === getUrlDomain(url2);
  } catch (error) {
    return false;
  }
};

/**
 * Slug Generation and Validation
 */
export const generateSlug = (text, options = {}) => {
  try {
    const { maxLength = 50, separator = '-', lowercase = true } = options;

    if (!text || typeof text !== 'string') {
      return '';
    }

    let slug = text.trim();

    if (lowercase) {
      slug = slug.toLowerCase();
    }

    slug = slug
      .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
      .replace(/\s+/g, separator) // Replace spaces with separator
      .replace(new RegExp(`${separator}+`, 'g'), separator) // Replace multiple separators with single
      .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), ''); // Remove leading/trailing separators

    if (maxLength && slug.length > maxLength) {
      slug = slug.substring(0, maxLength);
      // Remove trailing separator if cut off in the middle
      slug = slug.replace(new RegExp(`${separator}+$`), '');
    }

    return slug;
  } catch (error) {
    console.error('Error generating slug:', error);
    return '';
  }
};

export const isValidSlug = slug => {
  try {
    if (!slug || typeof slug !== 'string') {
      return false;
    }

    // Slug should only contain lowercase letters, numbers, and hyphens
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  } catch (error) {
    console.error('Error validating slug:', error);
    return false;
  }
};

/**
 * Navigation and Routing Utilities
 */
export const buildProductUrl = (productId, productSlug = '') => {
  try {
    const baseUrl = `/products/${productId}`;
    return productSlug ? `${baseUrl}/${generateSlug(productSlug)}` : baseUrl;
  } catch (error) {
    console.error('Error building product URL:', error);
    return `/products/${productId}`;
  }
};

export const buildCategoryUrl = categorySlug => {
  try {
    const slug = generateSlug(categorySlug);
    return `/category/${slug}`;
  } catch (error) {
    console.error('Error building category URL:', error);
    return '/category/unknown';
  }
};

export const buildSearchUrl = (query, filters = {}) => {
  try {
    const params = { q: query, ...filters };
    const queryString = buildQueryString(params);
    return queryString ? `/search?${queryString}` : '/search';
  } catch (error) {
    console.error('Error building search URL:', error);
    return '/search';
  }
};

export const buildAdminUrl = (path, params = {}) => {
  try {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const baseUrl = `/admin/${cleanPath}`;
    const queryString = buildQueryString(params);
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  } catch (error) {
    console.error('Error building admin URL:', error);
    return '/admin';
  }
};

export const buildApiUrl = (endpoint, params = {}) => {
  try {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    const apiPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${baseUrl}/api/v1${apiPath}`;

    const queryString = buildQueryString(params);
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  } catch (error) {
    console.error('Error building API URL:', error);
    return endpoint;
  }
};

/**
 * URL Parameter Helpers
 */
export const getUrlParameter = (url, paramName) => {
  try {
    const [, queryString] = url.split('?');
    if (!queryString) return null;

    const params = parseQueryString(queryString);
    return params[paramName] || null;
  } catch (error) {
    console.error('Error getting URL parameter:', error);
    return null;
  }
};

export const hasUrlParameter = (url, paramName) => {
  return getUrlParameter(url, paramName) !== null;
};

export const getCurrentPageFromUrl = url => {
  try {
    const page = getUrlParameter(url, 'page');
    return page ? parseInt(page) : 1;
  } catch (error) {
    console.error('Error getting current page from URL:', error);
    return 1;
  }
};

export const buildPaginationUrl = (baseUrl, page, otherParams = {}) => {
  try {
    const params = { ...otherParams, page };
    return updateQueryParams(baseUrl, params);
  } catch (error) {
    console.error('Error building pagination URL:', error);
    return baseUrl;
  }
};

/**
 * Breadcrumb Utilities
 */
export const generateBreadcrumbs = (url, customLabels = {}) => {
  try {
    const segments = getPathSegments(url);
    const breadcrumbs = [];

    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      const label =
        customLabels[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

      breadcrumbs.push({
        label,
        path: currentPath,
        isLast: index === segments.length - 1,
      });
    });

    return breadcrumbs;
  } catch (error) {
    console.error('Error generating breadcrumbs:', error);
    return [];
  }
};

/**
 * Image URL Utilities
 */
export const buildImageUrl = (imagePath, size = 'original') => {
  try {
    if (!imagePath) {
      return '/assets/images/placeholders/product-placeholder.jpg';
    }

    // If it's already a full URL, return as is
    if (isAbsoluteUrl(imagePath)) {
      return imagePath;
    }

    const baseUrl =
      process.env.REACT_APP_MEDIA_BASE_URL ||
      process.env.REACT_APP_API_BASE_URL ||
      'http://localhost:8000';

    // Handle different image sizes
    const sizeSuffix = size !== 'original' ? `_${size}` : '';
    const pathParts = imagePath.split('.');
    const extension = pathParts.pop();
    const basePath = pathParts.join('.');

    const finalPath = `${basePath}${sizeSuffix}.${extension}`;

    return `${baseUrl}/media/${finalPath}`;
  } catch (error) {
    console.error('Error building image URL:', error);
    return '/assets/images/placeholders/product-placeholder.jpg';
  }
};

export const buildThumbnailUrl = imagePath => {
  return buildImageUrl(imagePath, 'thumb');
};

export const buildLargeImageUrl = imagePath => {
  return buildImageUrl(imagePath, 'large');
};

/**
 * Social Sharing URLs
 */
export const buildShareUrls = (url, title = '', description = '') => {
  try {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      copy: url,
    };
  } catch (error) {
    console.error('Error building share URLs:', error);
    return {};
  }
};

/**
 * Route Matching and Navigation
 */
export const matchRoute = (pattern, url) => {
  try {
    // Convert route pattern to regex (e.g., '/products/:id' -> '/products/([^/]+)')
    const regexPattern = pattern.replace(/:\w+/g, '([^/]+)').replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    const [path] = url.split('?');

    const match = path.match(regex);

    if (!match) {
      return null;
    }

    // Extract parameter names from pattern
    const paramNames = (pattern.match(/:\w+/g) || []).map(param => param.slice(1));
    const paramValues = match.slice(1);

    const params = {};
    paramNames.forEach((name, index) => {
      params[name] = paramValues[index];
    });

    return {
      matched: true,
      params,
      path: match[0],
    };
  } catch (error) {
    console.error('Error matching route:', error);
    return null;
  }
};

export const isActiveRoute = (currentPath, targetPath, exact = false) => {
  try {
    if (exact) {
      return currentPath === targetPath;
    }

    return currentPath.startsWith(targetPath);
  } catch (error) {
    console.error('Error checking active route:', error);
    return false;
  }
};

export const getRouteParams = (pattern, url) => {
  try {
    const match = matchRoute(pattern, url);
    return match ? match.params : {};
  } catch (error) {
    console.error('Error getting route params:', error);
    return {};
  }
};

/**
 * URL Encoding and Decoding
 */
export const encodeUrlComponent = component => {
  try {
    return encodeURIComponent(String(component || ''));
  } catch (error) {
    console.error('Error encoding URL component:', error);
    return '';
  }
};

export const decodeUrlComponent = component => {
  try {
    return decodeURIComponent(String(component || ''));
  } catch (error) {
    console.error('Error decoding URL component:', error);
    return component || '';
  }
};

export const encodeUrlPath = path => {
  try {
    return path
      .split('/')
      .map(segment => encodeUrlComponent(segment))
      .join('/');
  } catch (error) {
    console.error('Error encoding URL path:', error);
    return path || '';
  }
};

export const decodeUrlPath = path => {
  try {
    return path
      .split('/')
      .map(segment => decodeUrlComponent(segment))
      .join('/');
  } catch (error) {
    console.error('Error decoding URL path:', error);
    return path || '';
  }
};

/**
 * Hash and Fragment Utilities
 */
export const getUrlHash = url => {
  try {
    const hashIndex = url.indexOf('#');
    return hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
  } catch (error) {
    console.error('Error getting URL hash:', error);
    return '';
  }
};

export const setUrlHash = (url, hash) => {
  try {
    const [urlWithoutHash] = url.split('#');
    return hash ? `${urlWithoutHash}#${hash}` : urlWithoutHash;
  } catch (error) {
    console.error('Error setting URL hash:', error);
    return url;
  }
};

export const removeUrlHash = url => {
  try {
    const [urlWithoutHash] = url.split('#');
    return urlWithoutHash;
  } catch (error) {
    console.error('Error removing URL hash:', error);
    return url;
  }
};

/**
 * Browser Navigation Utilities
 */
export const getCurrentUrl = () => {
  try {
    return window.location.href;
  } catch (error) {
    console.error('Error getting current URL:', error);
    return '';
  }
};

export const getCurrentPath = () => {
  try {
    return window.location.pathname;
  } catch (error) {
    console.error('Error getting current path:', error);
    return '/';
  }
};

export const getCurrentSearch = () => {
  try {
    return window.location.search;
  } catch (error) {
    console.error('Error getting current search:', error);
    return '';
  }
};

export const getCurrentHash = () => {
  try {
    return window.location.hash.slice(1); // Remove the # symbol
  } catch (error) {
    console.error('Error getting current hash:', error);
    return '';
  }
};

export const navigateTo = url => {
  try {
    window.location.href = url;
  } catch (error) {
    console.error('Error navigating to URL:', error);
  }
};

export const openInNewTab = url => {
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Error opening URL in new tab:', error);
  }
};

export const reloadPage = () => {
  try {
    window.location.reload();
  } catch (error) {
    console.error('Error reloading page:', error);
  }
};

/**
 * URL History and Back Navigation
 */
export const goBack = () => {
  try {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error going back:', error);
    window.location.href = '/';
  }
};

export const goForward = () => {
  try {
    window.history.forward();
  } catch (error) {
    console.error('Error going forward:', error);
  }
};

export const replaceCurrentUrl = url => {
  try {
    window.history.replaceState(null, '', url);
  } catch (error) {
    console.error('Error replacing current URL:', error);
  }
};

export const pushToHistory = (url, title = '') => {
  try {
    window.history.pushState(null, title, url);
  } catch (error) {
    console.error('Error pushing to history:', error);
  }
};

/**
 * URL Cleaning and Normalization
 */
export const cleanUrl = url => {
  try {
    if (!url) return '';

    // Remove multiple slashes
    let cleaned = url.replace(/\/+/g, '/');

    // Remove trailing slash (except for root)
    if (cleaned.length > 1 && cleaned.endsWith('/')) {
      cleaned = cleaned.slice(0, -1);
    }

    // Ensure leading slash for relative URLs
    if (!isAbsoluteUrl(cleaned) && !cleaned.startsWith('/')) {
      cleaned = `/${cleaned}`;
    }

    return cleaned;
  } catch (error) {
    console.error('Error cleaning URL:', error);
    return url || '';
  }
};

export const normalizeUrl = url => {
  try {
    if (!url) return '';

    // Clean the URL first
    let normalized = cleanUrl(url);

    // Sort query parameters for consistency
    const [path, queryString] = normalized.split('?');
    if (queryString) {
      const params = parseQueryString(queryString);
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((result, key) => {
          result[key] = params[key];
          return result;
        }, {});

      const newQueryString = buildQueryString(sortedParams);
      normalized = newQueryString ? `${path}?${newQueryString}` : path;
    }

    return normalized;
  } catch (error) {
    console.error('Error normalizing URL:', error);
    return url || '';
  }
};

// Default export with all URL helper functions
export default {
  buildUrl,
  buildQueryString,
  parseQueryString,
  updateQueryParams,
  removeQueryParams,
  joinPaths,
  getPathSegments,
  getLastPathSegment,
  replacePathSegment,
  isValidUrl,
  isRelativeUrl,
  isAbsoluteUrl,
  getUrlDomain,
  isSameDomain,
  generateSlug,
  isValidSlug,
  buildProductUrl,
  buildCategoryUrl,
  buildSearchUrl,
  buildAdminUrl,
  buildApiUrl,
  getUrlParameter,
  hasUrlParameter,
  getCurrentPageFromUrl,
  buildPaginationUrl,
  generateBreadcrumbs,
  buildImageUrl,
  buildThumbnailUrl,
  buildLargeImageUrl,
  buildShareUrls,
  matchRoute,
  isActiveRoute,
  getRouteParams,
  encodeUrlComponent,
  decodeUrlComponent,
  encodeUrlPath,
  decodeUrlPath,
  getUrlHash,
  setUrlHash,
  removeUrlHash,
  getCurrentUrl,
  getCurrentPath,
  getCurrentSearch,
  getCurrentHash,
  navigateTo,
  openInNewTab,
  reloadPage,
  goBack,
  goForward,
  replaceCurrentUrl,
  pushToHistory,
  cleanUrl,
  normalizeUrl,
};