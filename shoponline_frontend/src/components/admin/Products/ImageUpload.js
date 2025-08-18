import React, { useState, useRef } from 'react';
import './ProductManagement.css';

const ImageUpload = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewImages, setPreviewImages] = useState(images);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = files => {
    const fileArray = Array.from(files);
    processFiles(fileArray);
  };

  // Process selected files
  const processFiles = async files => {
    setUploading(true);

    const processedImages = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // Create preview
        const preview = await createPreview(file);
        processedImages.push({
          id: Date.now() + Math.random(),
          file: file,
          preview: preview,
          name: file.name,
          size: file.size,
          isMain: previewImages.length === 0 && processedImages.length === 0,
          uploading: false,
          uploaded: false,
        });

        // Check max images limit
        if (previewImages.length + processedImages.length >= maxImages) {
          break;
        }
      } catch (error) {
        errors.push(`${file.name}: Failed to process image`);
      }
    }

    if (errors.length > 0) {
      alert(`Some images could not be processed:\n${errors.join('\n')}`);
    }

    const newImages = [...previewImages, ...processedImages];
    setPreviewImages(newImages);
    onImagesChange?.(newImages);
    setUploading(false);
  };

  // Validate file
  const validateFile = file => {
    if (!acceptedFormats.includes(file.type)) {
      return {
        isValid: false,
        error: `Unsupported format. Accepted formats: ${acceptedFormats
          .map(f => f.split('/')[1])
          .join(', ')}`,
      };
    }

    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size: ${formatFileSize(maxFileSize)}`,
      };
    }

    return { isValid: true };
  };

  // Create image preview
  const createPreview = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Format file size
  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Handle drag events
  const handleDragEnter = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Handle file input change
  const handleInputChange = e => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Remove image
  const removeImage = imageId => {
    const updatedImages = previewImages.filter(img => img.id !== imageId);

    // If we removed the main image, make the first remaining image main
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isMain)) {
      updatedImages[0].isMain = true;
    }

    setPreviewImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  // Set main image
  const setMainImage = imageId => {
    const updatedImages = previewImages.map(img => ({
      ...img,
      isMain: img.id === imageId,
    }));

    setPreviewImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  // Reorder images
  const moveImage = (dragIndex, hoverIndex) => {
    const updatedImages = [...previewImages];
    const draggedImage = updatedImages[dragIndex];

    updatedImages.splice(dragIndex, 1);
    updatedImages.splice(hoverIndex, 0, draggedImage);

    setPreviewImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <div className="image-upload-container">
      {/* Upload Area */}
      <div
        className={`image-upload-dropzone ${dragOver ? 'drag-over' : ''} ${
          previewImages.length >= maxImages ? 'disabled' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => {
          if (previewImages.length < maxImages) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        <div className="upload-content">
          {uploading ? (
            <div className="uploading-state">
              <div className="loading-spinner" />
              <p>Processing images...</p>
            </div>
          ) : previewImages.length >= maxImages ? (
            <div className="upload-limit-reached">
              <p>Maximum {maxImages} images allowed</p>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon">📸</div>
              <h4>Upload Product Images</h4>
              <p>Drag and drop images here, or click to browse</p>
              <div className="upload-specs">
                <small>
                  Supported formats: JPEG, PNG, WebP
                  <br />
                  Maximum size: {formatFileSize(maxFileSize)} per image
                  <br />
                  Maximum {maxImages} images
                </small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Previews */}
      {previewImages.length > 0 && (
        <div className="image-previews">
          <h4>
            Product Images ({previewImages.length}/{maxImages})
          </h4>

          <div className="preview-grid">
            {previewImages.map((image, index) => (
              <div
                key={image.id}
                className={`image-preview-item ${image.isMain ? 'main-image' : ''}`}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', index);
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  moveImage(dragIndex, index);
                }}
              >
                <div className="image-preview">
                  <img
                    src={image.preview || image.url}
                    alt={`Product image ${index + 1}`}
                    onError={e => {
                      e.target.src = '/assets/placeholder.jpg';
                    }}
                  />

                  {image.isMain && <div className="main-image-badge">Main</div>}

                  <div className="image-overlay">
                    <div className="image-actions">
                      {!image.isMain && (
                        <button
                          type="button"
                          onClick={() => setMainImage(image.id)}
                          className="btn-image-action"
                          title="Set as main image"
                        >
                          ⭐
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="btn-image-action delete"
                        title="Remove image"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {image.uploading && (
                    <div className="upload-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="image-info">
                  <div className="image-name" title={image.name}>
                    {image.name}
                  </div>
                  <div className="image-size">{formatFileSize(image.size)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Image Management Tips */}
          <div className="image-tips">
            <h5>💡 Image Tips:</h5>
            <ul>
              <li>The first image (marked as "Main") will be the primary product image</li>
              <li>Drag and drop to reorder images</li>
              <li>Click the star icon to set a different main image</li>
              <li>Use high-quality images for best results (recommended: 800x800px or larger)</li>
              <li>Images will be automatically optimized for web display</li>
            </ul>
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="upload-guidelines">
        <h5>📋 Image Guidelines:</h5>
        <div className="guidelines-grid">
          <div className="guideline-item">
            <strong>Quality:</strong>
            <span>Use clear, well-lit photos with good resolution</span>
          </div>
          <div className="guideline-item">
            <strong>Background:</strong>
            <span>Plain white or neutral backgrounds work best</span>
          </div>
          <div className="guideline-item">
            <strong>Angles:</strong>
            <span>Include multiple angles and close-up details</span>
          </div>
          <div className="guideline-item">
            <strong>Consistency:</strong>
            <span>Maintain consistent lighting and style across images</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
