// src/services/api/homepageAPI.js
import apiClient, { handleApiResponse, handleApiError } from './apiClient';

const homepageAPI = {
  // Get homepage data for public view
  getHomepageData: async () => {
    try {
      const response = await apiClient.get('/homepage/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get featured products for homepage
  getFeaturedProducts: async (limit = 8) => {
    try {
      const response = await apiClient.get(`/homepage/featured-products/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get featured categories for homepage
  getFeaturedCategories: async (limit = 6) => {
    try {
      const response = await apiClient.get(`/homepage/featured-categories/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get active banners for homepage
  getActiveBanners: async (bannerType = null) => {
    try {
      const url = bannerType ? `/homepage/banners/?type=${bannerType}` : '/homepage/banners/';
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get hero banner
  getHeroBanner: async () => {
    try {
      const response = await apiClient.get('/homepage/hero-banner/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get flash sales for homepage
  getHomepageFlashSales: async (limit = 3) => {
    try {
      const response = await apiClient.get(`/homepage/flash-sales/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get new arrivals
  getNewArrivals: async (limit = 8) => {
    try {
      const response = await apiClient.get(`/homepage/new-arrivals/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get best sellers
  getBestSellers: async (limit = 8) => {
    try {
      const response = await apiClient.get(`/homepage/best-sellers/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get trending products
  getTrendingProducts: async (limit = 8) => {
    try {
      const response = await apiClient.get(`/homepage/trending/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get promotional sections
  getPromotionalSections: async () => {
    try {
      const response = await apiClient.get('/homepage/promotions/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get testimonials
  getTestimonials: async (limit = 6) => {
    try {
      const response = await apiClient.get(`/homepage/testimonials/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get social media links
  getSocialLinks: async () => {
    try {
      const response = await apiClient.get('/homepage/social-links/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get newsletter signup info
  getNewsletterInfo: async () => {
    try {
      const response = await apiClient.get('/homepage/newsletter/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Subscribe to newsletter
  subscribeToNewsletter: async email => {
    try {
      const response = await apiClient.post('/homepage/newsletter/subscribe/', {
        email,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get homepage SEO data
  getSEOData: async () => {
    try {
      const response = await apiClient.get('/homepage/seo/');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get popular searches
  getPopularSearches: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/homepage/popular-searches/?limit=${limit}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Track homepage view
  trackHomepageView: async (viewData = {}) => {
    try {
      const response = await apiClient.post('/homepage/track-view/', viewData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get homepage statistics (for admin)
  getHomepageStats: async (period = '30d') => {
    try {
      const response = await apiClient.get(`/homepage/stats/?period=${period}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Utility functions
  formatHomepageData: data => {
    return {
      content: {
        title: data.content?.title || 'Welcome to ShopOnline Uganda',
        subtitle: data.content?.subtitle || '',
        heroText: data.content?.hero_text || '',
        metaDescription: data.content?.meta_description || '',
        metaKeywords: data.content?.meta_keywords || '',
      },
      banners: data.banners || [],
      featuredProducts: data.featured_products || [],
      featuredCategories: data.featured_categories || [],
      flashSales: data.flash_sales || [],
      newArrivals: data.new_arrivals || [],
      bestSellers: data.best_sellers || [],
      trending: data.trending || [],
      promotions: data.promotions || [],
      testimonials: data.testimonials || [],
      socialLinks: data.social_links || {},
      newsletter: data.newsletter || {},
      seo: data.seo || {},
      popularSearches: data.popular_searches || [],
    };
  },

  groupBannersByType: banners => {
    return banners.reduce((groups, banner) => {
      const type = banner.banner_type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(banner);
      return groups;
    }, {});
  },

  sortBannersByOrder: banners => {
    return [...banners].sort((a, b) => a.order - b.order);
  },

  getActiveBannersOnly: banners => {
    const now = new Date();
    return banners.filter(banner => {
      if (!banner.is_active) return false;

      if (banner.start_date && new Date(banner.start_date) > now) return false;
      if (banner.end_date && new Date(banner.end_date) < now) return false;

      return true;
    });
  },

  formatProductsForHomepage: products => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
      imageUrl: product.image_url || product.thumbnail_url,
      category: product.category?.name,
      rating: product.rating_average ? parseFloat(product.rating_average) : 0,
      reviewCount: product.review_count || 0,
      isOnSale: product.is_on_sale,
      discountPercentage: product.discount_percentage,
      isInStock: product.is_in_stock,
      isFeatured: product.is_featured,
    }));
  },

  formatCategoriesForHomepage: categories => {
    return categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image,
      productCount: category.product_count,
      featured: category.featured,
    }));
  },

  validateNewsletterEmail: email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  getBannersByType: (banners, type) => {
    return banners.filter(banner => banner.banner_type === type);
  },

  getRandomTestimonials: (testimonials, count = 3) => {
    if (testimonials.length <= count) return testimonials;

    const shuffled = [...testimonials].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },

  formatSocialLinks: socialLinks => {
    return {
      facebook: socialLinks.facebook || '',
      twitter: socialLinks.twitter || '',
      instagram: socialLinks.instagram || '',
      whatsapp: socialLinks.whatsapp || '',
      youtube: socialLinks.youtube || '',
      linkedin: socialLinks.linkedin || '',
    };
  },

  getSocialLinkIcon: platform => {
    const icons = {
      facebook: 'fab fa-facebook-f',
      twitter: 'fab fa-twitter',
      instagram: 'fab fa-instagram',
      whatsapp: 'fab fa-whatsapp',
      youtube: 'fab fa-youtube',
      linkedin: 'fab fa-linkedin-in',
    };
    return icons[platform] || 'fas fa-link';
  },

  getSocialLinkColor: platform => {
    const colors = {
      facebook: '#1877F2',
      twitter: '#1DA1F2',
      instagram: '#E4405F',
      whatsapp: '#25D366',
      youtube: '#FF0000',
      linkedin: '#0A66C2',
    };
    return colors[platform] || '#6B7280';
  },

  isValidSocialLink: (url, platform) => {
    if (!url) return true; // Empty is valid

    try {
      const urlObj = new URL(url);
      const platformDomains = {
        facebook: ['facebook.com', 'fb.com'],
        twitter: ['twitter.com', 'x.com'],
        instagram: ['instagram.com'],
        whatsapp: ['wa.me', 'whatsapp.com'],
        youtube: ['youtube.com', 'youtu.be'],
        linkedin: ['linkedin.com'],
      };

      const validDomains = platformDomains[platform];
      if (validDomains) {
        return validDomains.some(
          domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );
      }

      return true; // For unknown platforms, just check if it's a valid URL
    } catch {
      return false;
    }
  },

  generateHomepageStructuredData: data => {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ShopOnline Uganda',
      url: window.location.origin,
      description: data.content?.metaDescription || "Uganda's leading e-commerce platform",
      potentialAction: {
        '@type': 'SearchAction',
        target: `${window.location.origin}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  },

  generateBreadcrumbStructuredData: () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: window.location.origin,
        },
      ],
    };
  },

  optimizeImageLoading: images => {
    // Add lazy loading and optimize image loading
    return images.map(image => ({
      ...image,
      loading: 'lazy',
      sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    }));
  },

  preloadCriticalResources: data => {
    // Preload critical images and resources
    const criticalImages = [
      ...(data.banners?.filter(b => b.banner_type === 'hero').map(b => b.image) || []),
      ...(data.featuredProducts?.slice(0, 4).map(p => p.image_url) || []),
    ];

    criticalImages.forEach(imageUrl => {
      if (imageUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageUrl;
        document.head.appendChild(link);
      }
    });
  },

  calculateLoadingPriority: sectionIndex => {
    // Calculate loading priority based on section position
    if (sectionIndex === 0) return 'high';
    if (sectionIndex <= 2) return 'medium';
    return 'low';
  },

  formatPriceForDisplay: (price, currency = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  },

  generateMetaTags: data => {
    const metaTags = [];

    if (data.content?.metaDescription) {
      metaTags.push({
        name: 'description',
        content: data.content.metaDescription,
      });
    }

    if (data.content?.metaKeywords) {
      metaTags.push({
        name: 'keywords',
        content: data.content.metaKeywords,
      });
    }

    // Open Graph tags
    metaTags.push(
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: data.content?.title || 'ShopOnline Uganda' },
      {
        property: 'og:description',
        content: data.content?.metaDescription || "Uganda's leading e-commerce platform",
      },
      { property: 'og:url', content: window.location.href },
      { property: 'og:site_name', content: 'ShopOnline Uganda' }
    );

    // Twitter Card tags
    metaTags.push(
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: data.content?.title || 'ShopOnline Uganda' },
      {
        name: 'twitter:description',
        content: data.content?.metaDescription || "Uganda's leading e-commerce platform",
      }
    );

    return metaTags;
  },

  trackSectionView: (sectionName, sectionData = {}) => {
    // Track homepage section views for analytics
    homepageAPI
      .trackHomepageView({
        section: sectionName,
        timestamp: new Date().toISOString(),
        ...sectionData,
      })
      .catch(error => {
        console.warn('Failed to track section view:', error);
      });
  },

  getHomepageCacheKey: (userId = null) => {
    const baseKey = 'homepage_data';
    return userId ? `${baseKey}_user_${userId}` : `${baseKey}_public`;
  },

  shouldRefreshCache: (lastUpdated, maxAge = 5 * 60 * 1000) => {
    // Check if cache should be refreshed (default: 5 minutes)
    if (!lastUpdated) return true;
    return Date.now() - new Date(lastUpdated).getTime() > maxAge;
  },
};

export default homepageAPI;
