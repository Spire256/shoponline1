// Image processing utilities for the Ugandan e-commerce platform
// Handles image validation, resizing, compression, and URL generation

import { APP_CONFIG } from '../constants/app';

/**
 * Image Validation Functions
 */
export const isValidImageFile = file => {
  try {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    // Check if it's a file object
    if (!(file instanceof File)) {
      return { isValid: false, error: 'Invalid file object' };
    }

    // Check file type
    if (!APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${APP_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > APP_CONFIG.MAX_IMAGE_SIZE) {
      const maxSizeMB = Math.round(APP_CONFIG.MAX_IMAGE_SIZE / (1024 * 1024));
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${maxSizeMB}MB`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating image file:', error);
    return { isValid: false, error: 'File validation failed' };
  }
};

export const validateImageDimensions = (
  file,
  minWidth = 100,
  minHeight = 100,
  maxWidth = 4000,
  maxHeight = 4000
) => {
  return new Promise(resolve => {
    try {
      if (!file) {
        resolve({ isValid: false, error: 'No file provided' });
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const { width, height } = img;

        if (width < minWidth || height < minHeight) {
          resolve({
            isValid: false,
            error: `Image dimensions too small. Minimum: ${minWidth}x${minHeight}px`,
          });
          return;
        }

        if (width > maxWidth || height > maxHeight) {
          resolve({
            isValid: false,
            error: `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}px`,
          });
          return;
        }

        resolve({
          isValid: true,
          dimensions: { width, height },
          aspectRatio: width / height,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ isValid: false, error: 'Invalid image file' });
      };

      img.src = url;
    } catch (error) {
      console.error('Error validating image dimensions:', error);
      resolve({ isValid: false, error: 'Dimension validation failed' });
    }
  });
};

/**
 * Image Processing Functions
 */
export const resizeImage = (
  file,
  targetWidth,
  targetHeight,
  quality = APP_CONFIG.IMAGE_QUALITY
) => {
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate new dimensions maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateAspectRatioFit(
          img.width,
          img.height,
          targetWidth,
          targetHeight
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress image
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          blob => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve({ success: true, file: resizedFile });
            } else {
              resolve({ success: false, error: 'Failed to create resized image' });
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ success: false, error: 'Failed to load image' });
      };

      img.src = url;
    } catch (error) {
      console.error('Error resizing image:', error);
      resolve({ success: false, error: 'Image resizing failed' });
    }
  });
};

export const compressImage = (file, quality = 0.8, maxWidth = 1200, maxHeight = 1200) => {
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;

        // Calculate new dimensions if image is too large
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              const compressionRatio = (1 - blob.size / file.size) * 100;

              resolve({
                success: true,
                file: compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: Math.round(compressionRatio),
              });
            } else {
              resolve({ success: false, error: 'Failed to compress image' });
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ success: false, error: 'Failed to load image for compression' });
      };

      img.src = url;
    } catch (error) {
      console.error('Error compressing image:', error);
      resolve({ success: false, error: 'Image compression failed' });
    }
  });
};

export const createThumbnail = (file, size = 300) => {
  return resizeImage(file, size, size, 0.8);
};

export const generateImagePreview = file => {
  return new Promise(resolve => {
    try {
      if (!file) {
        resolve({ success: false, error: 'No file provided' });
        return;
      }

      const reader = new FileReader();

      reader.onload = e => {
        resolve({
          success: true,
          preview: e.target.result,
          file: file,
        });
      };

      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to generate preview' });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error generating image preview:', error);
      resolve({ success: false, error: 'Preview generation failed' });
    }
  });
};

/**
 * Image URL Functions
 */
export const buildImageUrl = (imagePath, options = {}) => {
  try {
    const {
      size = 'original',
      baseUrl = process.env.REACT_APP_MEDIA_BASE_URL ||
        process.env.REACT_APP_API_BASE_URL ||
        'http://localhost:8000',
      fallback = '/assets/images/placeholders/product-placeholder.jpg',
    } = options;

    if (!imagePath) {
      return fallback;
    }

    // If it's already a complete URL, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
      return imagePath;
    }

    // If it's a relative path starting with /, use as is
    if (imagePath.startsWith('/')) {
      return `${baseUrl}${imagePath}`;
    }

    // Build the full URL
    const mediaPath = imagePath.startsWith('media/') ? imagePath : `media/${imagePath}`;
    return `${baseUrl}/${mediaPath}`;
  } catch (error) {
    console.error('Error building image URL:', error);
    return options.fallback || '/assets/images/placeholders/product-placeholder.jpg';
  }
};

export const buildProductImageUrl = (imagePath, size = 'medium') => {
  return buildImageUrl(imagePath, {
    size,
    fallback: '/assets/images/placeholders/product-placeholder.jpg',
  });
};

export const buildCategoryImageUrl = imagePath => {
  return buildImageUrl(imagePath, {
    fallback: '/assets/images/placeholders/category-placeholder.jpg',
  });
};

export const buildUserAvatarUrl = imagePath => {
  return buildImageUrl(imagePath, {
    fallback: '/assets/images/placeholders/user-avatar.jpg',
  });
};

export const buildBannerImageUrl = imagePath => {
  return buildImageUrl(imagePath, {
    fallback: '/assets/images/placeholders/banner-placeholder.jpg',
  });
};

/**
 * Image Processing Utilities
 */
export const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  try {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return {
      width: Math.round(srcWidth * ratio),
      height: Math.round(srcHeight * ratio),
      ratio: ratio,
    };
  } catch (error) {
    console.error('Error calculating aspect ratio fit:', error);
    return { width: maxWidth, height: maxHeight, ratio: 1 };
  }
};

export const getImageDimensions = file => {
  return new Promise(resolve => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          success: true,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ success: false, error: 'Failed to load image' });
      };

      img.src = url;
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      resolve({ success: false, error: 'Failed to get dimensions' });
    }
  });
};

export const convertImageFormat = (file, targetFormat = 'image/jpeg', quality = 0.8) => {
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        canvas.width = img.width;
        canvas.height = img.height;

        // Fill with white background for JPEG conversion
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          blob => {
            if (blob) {
              const extension = targetFormat.split('/')[1];
              const newFileName = file.name.replace(/\.[^/.]+$/, `.${extension}`);

              const convertedFile = new File([blob], newFileName, {
                type: targetFormat,
                lastModified: Date.now(),
              });

              resolve({ success: true, file: convertedFile });
            } else {
              resolve({ success: false, error: 'Failed to convert image' });
            }
          },
          targetFormat,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ success: false, error: 'Failed to load image for conversion' });
      };

      img.src = url;
    } catch (error) {
      console.error('Error converting image format:', error);
      resolve({ success: false, error: 'Image conversion failed' });
    }
  });
};

/**
 * Image Optimization Functions
 */
export const optimizeImageForWeb = (file, options = {}) => {
  return new Promise(async resolve => {
    try {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.85,
        format = file.type,
        progressive = true,
      } = options;

      // First, validate the image
      const validation = isValidImageFile(file);
      if (!validation.isValid) {
        resolve({ success: false, error: validation.error });
        return;
      }

      // Get original dimensions
      const dimensions = await getImageDimensions(file);
      if (!dimensions.success) {
        resolve({ success: false, error: 'Failed to get image dimensions' });
        return;
      }

      // Check if optimization is needed
      const needsResize = dimensions.width > maxWidth || dimensions.height > maxHeight;
      const needsCompression = file.size > APP_CONFIG.MAX_IMAGE_SIZE * 0.7; // 70% of max size

      if (!needsResize && !needsCompression) {
        resolve({ success: true, file: file, optimized: false });
        return;
      }

      // Resize if needed
      let processedFile = file;
      if (needsResize) {
        const resizeResult = await resizeImage(file, maxWidth, maxHeight, quality);
        if (resizeResult.success) {
          processedFile = resizeResult.file;
        }
      } else if (needsCompression) {
        const compressResult = await compressImage(file, quality, maxWidth, maxHeight);
        if (compressResult.success) {
          processedFile = compressResult.file;
        }
      }

      resolve({
        success: true,
        file: processedFile,
        optimized: true,
        originalSize: file.size,
        optimizedSize: processedFile.size,
        compressionRatio: Math.round((1 - processedFile.size / file.size) * 100),
      });
    } catch (error) {
      console.error('Error optimizing image:', error);
      resolve({ success: false, error: 'Image optimization failed' });
    }
  });
};

export const createMultipleSizes = (file, sizes = []) => {
  return new Promise(async resolve => {
    try {
      const defaultSizes = [
        { name: 'thumbnail', width: 150, height: 150 },
        { name: 'small', width: 300, height: 300 },
        { name: 'medium', width: 600, height: 600 },
        { name: 'large', width: 1200, height: 1200 },
      ];

      const targetSizes = sizes.length > 0 ? sizes : defaultSizes;
      const results = {};

      for (const size of targetSizes) {
        const resizeResult = await resizeImage(file, size.width, size.height);
        if (resizeResult.success) {
          results[size.name] = resizeResult.file;
        }
      }

      resolve({ success: true, sizes: results });
    } catch (error) {
      console.error('Error creating multiple sizes:', error);
      resolve({ success: false, error: 'Failed to create multiple sizes' });
    }
  });
};

/**
 * Image Placeholder and Fallback Functions
 */
export const getPlaceholderImage = (type = 'product', size = 'medium') => {
  const placeholders = {
    product: '/assets/images/placeholders/product-placeholder.jpg',
    category: '/assets/images/placeholders/category-placeholder.jpg',
    user: '/assets/images/placeholders/user-avatar.jpg',
    banner: '/assets/images/placeholders/banner-placeholder.jpg',
    default: '/assets/images/placeholders/default-placeholder.jpg',
  };

  return placeholders[type] || placeholders.default;
};

export const generatePlaceholderDataUrl = (
  width = 300,
  height = 300,
  text = '',
  backgroundColor = '#f0f0f0',
  textColor = '#666666'
) => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Add text if provided
    if (text) {
      ctx.fillStyle = textColor;
      ctx.font = `${Math.min(width, height) / 10}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    }

    return canvas.toDataURL();
  } catch (error) {
    console.error('Error generating placeholder data URL:', error);
    return '';
  }
};

/**
 * Image Loading and Error Handling
 */
export const preloadImage = src => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();

      img.onload = () => {
        resolve({
          success: true,
          image: img,
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };

      img.src = src;
    } catch (error) {
      reject(error);
    }
  });
};

export const preloadImages = srcArray => {
  return Promise.allSettled(srcArray.map(src => preloadImage(src)));
};

export const handleImageError = (event, fallbackSrc = null) => {
  try {
    const img = event.target;

    if (fallbackSrc && img.src !== fallbackSrc) {
      img.src = fallbackSrc;
    } else {
      // Use placeholder
      img.src = getPlaceholderImage();
    }

    // Add error class for styling
    img.classList.add('image-error');
  } catch (error) {
    console.error('Error handling image error:', error);
  }
};

/**
 * Image URL Generation and Management
 */
export const generateImageSrcSet = (basePath, sizes = []) => {
  try {
    if (!basePath) return '';

    const defaultSizes = [
      { width: 300, suffix: '_small' },
      { width: 600, suffix: '_medium' },
      { width: 1200, suffix: '_large' },
    ];

    const targetSizes = sizes.length > 0 ? sizes : defaultSizes;

    return targetSizes
      .map(size => {
        const url = buildImageUrl(basePath.replace(/(\.[^.]+)$/, `${size.suffix}$1`));
        return `${url} ${size.width}w`;
      })
      .join(', ');
  } catch (error) {
    console.error('Error generating image srcset:', error);
    return '';
  }
};

export const generateImageSizes = (breakpoints = []) => {
  try {
    const defaultBreakpoints = [
      { condition: '(max-width: 480px)', size: '100vw' },
      { condition: '(max-width: 768px)', size: '50vw' },
      { condition: '(max-width: 1024px)', size: '33vw' },
      { condition: '', size: '25vw' },
    ];

    const targetBreakpoints = breakpoints.length > 0 ? breakpoints : defaultBreakpoints;

    return targetBreakpoints
      .map(bp => (bp.condition ? `${bp.condition} ${bp.size}` : bp.size))
      .join(', ');
  } catch (error) {
    console.error('Error generating image sizes:', error);
    return '100vw';
  }
};

/**
 * Image Gallery Functions
 */
export const sortImagesByOrder = images => {
  try {
    if (!Array.isArray(images)) {
      return [];
    }

    return [...images].sort((a, b) => {
      const orderA = a.order || a.sort_order || 0;
      const orderB = b.order || b.sort_order || 0;
      return orderA - orderB;
    });
  } catch (error) {
    console.error('Error sorting images by order:', error);
    return images || [];
  }
};

export const getMainImage = images => {
  try {
    if (!Array.isArray(images) || images.length === 0) {
      return null;
    }

    // Look for image marked as main/primary
    const mainImage = images.find(img => img.is_main || img.is_primary);
    if (mainImage) {
      return mainImage;
    }

    // Return first image if no main image is set
    const sortedImages = sortImagesByOrder(images);
    return sortedImages[0] || null;
  } catch (error) {
    console.error('Error getting main image:', error);
    return null;
  }
};

export const getImageGallery = (images, includeMain = true) => {
  try {
    if (!Array.isArray(images) || images.length === 0) {
      return [];
    }

    const sortedImages = sortImagesByOrder(images);

    if (!includeMain) {
      return sortedImages.filter(img => !img.is_main && !img.is_primary);
    }

    return sortedImages;
  } catch (error) {
    console.error('Error getting image gallery:', error);
    return [];
  }
};

/**
 * Image Lazy Loading Helpers
 */
export const createIntersectionObserver = (callback, options = {}) => {
  try {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
    };

    const observerOptions = { ...defaultOptions, ...options };

    if ('IntersectionObserver' in window) {
      return new IntersectionObserver(callback, observerOptions);
    }

    return null;
  } catch (error) {
    console.error('Error creating intersection observer:', error);
    return null;
  }
};

export const setupLazyLoading = (imageSelector = '[data-lazy]') => {
  try {
    const images = document.querySelectorAll(imageSelector);

    if (images.length === 0) {
      return null;
    }

    const imageObserver = createIntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.removeAttribute('data-lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    if (imageObserver) {
      images.forEach(img => imageObserver.observe(img));
    }

    return imageObserver;
  } catch (error) {
    console.error('Error setting up lazy loading:', error);
    return null;
  }
};

/**
 * Image Upload Utilities
 */
export const prepareImageForUpload = async (file, options = {}) => {
  try {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.85,
      createThumbnail: shouldCreateThumbnail = true,
      thumbnailSize = 300,
    } = options;

    // Validate image
    const validation = isValidImageFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Optimize main image
    const optimized = await optimizeImageForWeb(file, {
      maxWidth,
      maxHeight,
      quality,
    });

    if (!optimized.success) {
      return { success: false, error: optimized.error };
    }

    const result = {
      success: true,
      mainImage: optimized.file,
      originalFile: file,
    };

    // Create thumbnail if requested
    if (shouldCreateThumbnail) {
      const thumbnailResult = await createThumbnail(optimized.file, thumbnailSize);
      if (thumbnailResult.success) {
        result.thumbnail = thumbnailResult.file;
      }
    }

    return result;
  } catch (error) {
    console.error('Error preparing image for upload:', error);
    return { success: false, error: 'Failed to prepare image for upload' };
  }
};

export const generateUniqueFileName = (originalFileName, prefix = '') => {
  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFileName.split('.').pop();
    const nameWithoutExtension = originalFileName.split('.').slice(0, -1).join('.');

    const cleanName = nameWithoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${prefix}${prefix ? '_' : ''}${cleanName}_${timestamp}_${randomString}.${extension}`;
  } catch (error) {
    console.error('Error generating unique filename:', error);
    return `image_${Date.now()}.jpg`;
  }
};

/**
 * Image Color and Analysis Functions
 */
export const getImageDominantColor = file => {
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Resize to small canvas for faster processing
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50);
        const data = imageData.data;
        const colorCounts = {};

        // Sample every 4th pixel to improve performance
        for (let i = 0; i < data.length; i += 16) {
          const r = Math.round(data[i] / 10) * 10;
          const g = Math.round(data[i + 1] / 10) * 10;
          const b = Math.round(data[i + 2] / 10) * 10;
          const color = `${r},${g},${b}`;

          colorCounts[color] = (colorCounts[color] || 0) + 1;
        }

        // Find most common color
        let dominantColor = '128,128,128'; // Default gray
        let maxCount = 0;

        Object.keys(colorCounts).forEach(color => {
          if (colorCounts[color] > maxCount) {
            maxCount = colorCounts[color];
            dominantColor = color;
          }
        });

        const [r, g, b] = dominantColor.split(',').map(Number);

        resolve({
          success: true,
          rgb: { r, g, b },
          hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
            .toString(16)
            .padStart(2, '0')}`,
          css: `rgb(${r}, ${g}, ${b})`,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ success: false, error: 'Failed to analyze image color' });
      };

      img.src = url;
    } catch (error) {
      console.error('Error getting dominant color:', error);
      resolve({ success: false, error: 'Color analysis failed' });
    }
  });
};

/**
 * Image Utils for React Components
 */
export const useImageWithFallback = (src, fallbackSrc = null) => {
  try {
    const [imageSrc, setImageSrc] = React.useState(src);
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);

      if (fallbackSrc && imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        setImageSrc(getPlaceholderImage());
      }
    };

    React.useEffect(() => {
      setImageSrc(src);
      setIsLoading(true);
      setHasError(false);
    }, [src]);

    return {
      src: imageSrc,
      isLoading,
      hasError,
      onLoad: handleLoad,
      onError: handleError,
    };
  } catch (error) {
    console.error('Error in useImageWithFallback hook:', error);
    return {
      src: fallbackSrc || getPlaceholderImage(),
      isLoading: false,
      hasError: true,
      onLoad: () => {},
      onError: () => {},
    };
  }
};

// Default export with all image helper functions
export default {
  isValidImageFile,
  validateImageDimensions,
  resizeImage,
  compressImage,
  createThumbnail,
  generateImagePreview,
  buildImageUrl,
  buildProductImageUrl,
  buildCategoryImageUrl,
  buildUserAvatarUrl,
  buildBannerImageUrl,
  calculateAspectRatioFit,
  getImageDimensions,
  convertImageFormat,
  optimizeImageForWeb,
  createMultipleSizes,
  getPlaceholderImage,
  generatePlaceholderDataUrl,
  preloadImage,
  preloadImages,
  handleImageError,
  setupLazyLoading,
  createIntersectionObserver,
  prepareImageForUpload,
  generateUniqueFileName,
  getImageDominantColor,
  sortImagesByOrder,
  getMainImage,
  getImageGallery,
  generateImageSrcSet,
  generateImageSizes,
  useImageWithFallback,
};
