// src/services/api/uploadAPI.js
import { fileUploadClient, handleApiResponse, handleApiError } from './apiClient';

const uploadAPI = {
  // General file upload
  uploadFile: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add additional options
      Object.entries(options).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const response = await fileUploadClient.post('/upload/', formData, {
        onUploadProgress: options.onProgress,
        timeout: options.timeout || 60000,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async (files, options = {}) => {
    try {
      const formData = new FormData();

      files.forEach((file, index) => {
        formData.append('files', file);
      });

      Object.entries(options).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const response = await fileUploadClient.post('/upload/multiple/', formData, {
        onUploadProgress: options.onProgress,
        timeout: options.timeout || 120000,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload product images
  uploadProductImages: async (productId, images, options = {}) => {
    try {
      const formData = new FormData();

      images.forEach((imageData, index) => {
        formData.append('images', imageData.file);
        formData.append(`alt_text_${index}`, imageData.alt_text || '');
        formData.append(`caption_${index}`, imageData.caption || '');
        formData.append(`position_${index}`, imageData.position || index);
        formData.append(`is_main_${index}`, imageData.is_main || false);
      });

      formData.append('product_id', productId);

      const response = await fileUploadClient.post('/upload/product-images/', formData, {
        onUploadProgress: options.onProgress,
        timeout: options.timeout || 90000,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload category image
  uploadCategoryImage: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt_text', options.alt_text || '');
      formData.append('category_id', options.category_id || '');

      const response = await fileUploadClient.post('/upload/category-image/', formData, {
        onUploadProgress: options.onProgress,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload banner image
  uploadBannerImage: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt_text', options.alt_text || '');
      formData.append('banner_type', options.banner_type || 'promo');

      const response = await fileUploadClient.post('/upload/banner-image/', formData, {
        onUploadProgress: options.onProgress,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload user profile image
  uploadProfileImage: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('profile_image', file);

      const response = await fileUploadClient.post('/upload/profile-image/', formData, {
        onUploadProgress: options.onProgress,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload flash sale banner
  uploadFlashSaleBanner: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('banner_image', file);
      formData.append('flash_sale_id', options.flash_sale_id || '');

      const response = await fileUploadClient.post('/upload/flash-sale-banner/', formData, {
        onUploadProgress: options.onProgress,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Upload site assets (logo, favicon, etc.)
  uploadSiteAsset: async (file, assetType, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('asset', file);
      formData.append('asset_type', assetType);

      const response = await fileUploadClient.post('/upload/site-asset/', formData, {
        onUploadProgress: options.onProgress,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get upload progress for chunked uploads
  getUploadProgress: async uploadId => {
    try {
      const response = await fileUploadClient.get(`/upload/progress/${uploadId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Cancel upload
  cancelUpload: async uploadId => {
    try {
      const response = await fileUploadClient.post(`/upload/cancel/${uploadId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete uploaded file
  deleteFile: async fileId => {
    try {
      const response = await fileUploadClient.delete(`/upload/delete/${fileId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get file info
  getFileInfo: async fileId => {
    try {
      const response = await fileUploadClient.get(`/upload/info/${fileId}/`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Chunk upload for large files
  uploadChunk: async (chunk, chunkData, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunk_number', chunkData.chunkNumber);
      formData.append('total_chunks', chunkData.totalChunks);
      formData.append('file_id', chunkData.fileId);
      formData.append('file_name', chunkData.fileName);
      formData.append('file_size', chunkData.fileSize);

      const response = await fileUploadClient.post('/upload/chunk/', formData, {
        onUploadProgress: options.onProgress,
        timeout: options.timeout || 60000,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Complete chunked upload
  completeChunkedUpload: async (fileId, options = {}) => {
    try {
      const response = await fileUploadClient.post(`/upload/complete/${fileId}/`, {
        ...options,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Utility functions
  validateFile: (file, options = {}) => {
    const errors = [];

    // Check file size
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${uploadAPI.formatFileSize(maxSize)}`);
    }

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const fileExtension = uploadAPI.getFileExtension(file.name).toLowerCase();
      const mimeType = file.type.toLowerCase();

      const isAllowedExtension = options.allowedTypes.some(
        type => type.toLowerCase() === fileExtension || type.toLowerCase() === mimeType
      );

      if (!isAllowedExtension) {
        errors.push(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
      }
    }

    // Check image dimensions (if applicable)
    if (file.type.startsWith('image/') && options.imageDimensions) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const { minWidth, maxWidth, minHeight, maxHeight } = options.imageDimensions;

          if (minWidth && img.width < minWidth) {
            errors.push(`Image width must be at least ${minWidth}px`);
          }
          if (maxWidth && img.width > maxWidth) {
            errors.push(`Image width must be at most ${maxWidth}px`);
          }
          if (minHeight && img.height < minHeight) {
            errors.push(`Image height must be at least ${minHeight}px`);
          }
          if (maxHeight && img.height > maxHeight) {
            errors.push(`Image height must be at most ${maxHeight}px`);
          }

          resolve({
            isValid: errors.length === 0,
            errors,
            dimensions: { width: img.width, height: img.height },
          });
        };

        img.onerror = () => {
          errors.push('Invalid image file');
          resolve({
            isValid: false,
            errors,
            dimensions: null,
          });
        };

        img.src = URL.createObjectURL(file);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateImageFile: (file, options = {}) => {
    const imageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    const defaultOptions = {
      allowedTypes: imageTypes,
      maxSize: 5 * 1024 * 1024, // 5MB
      imageDimensions: {
        minWidth: 100,
        minHeight: 100,
        maxWidth: 4000,
        maxHeight: 4000,
      },
      ...options,
    };

    return uploadAPI.validateFile(file, defaultOptions);
  },

  getFileExtension: fileName => {
    return fileName.split('.').pop() || '';
  },

  formatFileSize: bytes => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  generateFileName: (originalName, prefix = '') => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = uploadAPI.getFileExtension(originalName);

    return `${prefix}${timestamp}_${randomStr}.${extension}`;
  },

  createImagePreview: file => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsDataURL(file);
    });
  },

  compressImage: (file, options = {}) => {
    return new Promise(resolve => {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        outputFormat = 'image/jpeg',
      } = options;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            const compressedFile = new File([blob], file.name, {
              type: outputFormat,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputFormat,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  },

  createThumbnail: (file, size = 200) => {
    return uploadAPI.compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
    });
  },

  uploadWithProgress: (file, uploadFunction, options = {}) => {
    return new Promise((resolve, reject) => {
      let progress = 0;

      const progressCallback = progressEvent => {
        progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (options.onProgress) {
          options.onProgress(progress, progressEvent);
        }
      };

      uploadFunction(file, { ...options, onProgress: progressCallback })
        .then(resolve)
        .catch(reject);
    });
  },

  uploadMultipleWithProgress: (files, uploadFunction, options = {}) => {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let completedCount = 0;

      const updateOverallProgress = () => {
        const overallProgress = Math.round((completedCount / files.length) * 100);
        if (options.onOverallProgress) {
          options.onOverallProgress(overallProgress, completedCount, files.length);
        }
      };

      files.forEach((file, index) => {
        const fileProgressCallback = (progress, progressEvent) => {
          if (options.onFileProgress) {
            options.onFileProgress(index, progress, progressEvent, file);
          }
        };

        uploadFunction(file, { ...options, onProgress: fileProgressCallback })
          .then(result => {
            results[index] = result;
            completedCount++;
            updateOverallProgress();

            if (completedCount === files.length) {
              resolve({ results, errors });
            }
          })
          .catch(error => {
            errors[index] = error;
            completedCount++;
            updateOverallProgress();

            if (completedCount === files.length) {
              if (options.failOnAnyError && errors.some(e => e)) {
                reject(errors);
              } else {
                resolve({ results, errors });
              }
            }
          });
      });
    });
  },

  resumeUpload: async (uploadId, file, startByte = 0) => {
    try {
      const chunk = file.slice(startByte);
      const response = await fileUploadClient.post(`/upload/resume/${uploadId}/`, chunk, {
        headers: {
          'Content-Range': `bytes ${startByte}-${file.size - 1}/${file.size}`,
          'Content-Type': 'application/octet-stream',
        },
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUploadUrl: async (fileName, fileSize, options = {}) => {
    try {
      const response = await fileUploadClient.post('/upload/get-url/', {
        file_name: fileName,
        file_size: fileSize,
        ...options,
      });

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Drag and drop utilities
  handleDragOver: e => {
    e.preventDefault();
    e.stopPropagation();
  },

  handleDragEnter: e => {
    e.preventDefault();
    e.stopPropagation();
  },

  handleDragLeave: e => {
    e.preventDefault();
    e.stopPropagation();
  },

  handleDrop: (e, callback) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (callback) {
      callback(files);
    }

    return files;
  },

  setupDropZone: (element, callbacks = {}) => {
    const { onDragEnter, onDragOver, onDragLeave, onDrop, onFilesSelected } = callbacks;

    element.addEventListener('dragenter', e => {
      uploadAPI.handleDragEnter(e);
      if (onDragEnter) onDragEnter(e);
    });

    element.addEventListener('dragover', e => {
      uploadAPI.handleDragOver(e);
      if (onDragOver) onDragOver(e);
    });

    element.addEventListener('dragleave', e => {
      uploadAPI.handleDragLeave(e);
      if (onDragLeave) onDragLeave(e);
    });

    element.addEventListener('drop', e => {
      const files = uploadAPI.handleDrop(e);
      if (onDrop) onDrop(e, files);
      if (onFilesSelected) onFilesSelected(files);
    });
  },

  // File type detection
  getFileCategory: file => {
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('text/') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))
      return 'archive';

    return 'other';
  },

  getFileIcon: file => {
    const category = uploadAPI.getFileCategory(file);

    const icons = {
      image: '🖼️',
      video: '🎥',
      audio: '🎵',
      pdf: '📄',
      document: '📝',
      spreadsheet: '📊',
      presentation: '📽️',
      archive: '📦',
      other: '📁',
    };

    return icons[category] || icons.other;
  },
};

export default uploadAPI;
