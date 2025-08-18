import React, { useState, useEffect } from 'react';
import './ProductPage.css';

const ProductImageGallery = ({ images = [], productName = 'Product' }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Set initial selected image
  useEffect(() => {
    if (images.length > 0) {
      // Find main image or use first image
      const mainImage = images.find(img => img.is_main) || images[0];
      setSelectedImage(mainImage);
      setCurrentIndex(images.indexOf(mainImage));
    }
  }, [images]);

  const handleThumbnailClick = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    setIsZoomed(false);
  };

  const handleMainImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handlePrevious = () => {
    if (images.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
    setIsZoomed(false);
  };

  const handleNext = () => {
    if (images.length === 0) return;
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedImage(images[newIndex]);
    setIsZoomed(false);
  };

  const handleKeyDown = e => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      setIsZoomed(false);
    }
  };

  useEffect(() => {
    if (isZoomed) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isZoomed, currentIndex]);

  // Fallback if no images
  if (!images || images.length === 0) {
    return (
      <div className="product-image-gallery">
        <div className="main-image-container">
          <div className="main-image-placeholder">
            <img
              src="/assets/placeholders/product-placeholder.jpg"
              alt={productName}
              className="main-image"
            />
            <div className="no-image-text">No Image Available</div>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = selectedImage || images[0];

  return (
    <div className="product-image-gallery">
      {/* Main Image */}
      <div className="main-image-container">
        <div className="main-image-wrapper">
          <img
            src={currentImage.image_url || currentImage.thumbnail_url}
            alt={currentImage.alt_text || productName}
            className="main-image"
            onClick={handleMainImageClick}
            loading="lazy"
          />

          {/* Zoom Indicator */}
          <div className="zoom-indicator">
            <svg className="zoom-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
            <span>Click to zoom</span>
          </div>

          {/* Navigation arrows for main image */}
          {images.length > 1 && (
            <>
              <button
                className="image-nav-btn prev-btn"
                onClick={e => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                aria-label="Previous image"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                className="image-nav-btn next-btn"
                onClick={e => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="image-counter">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="thumbnail-strip">
          <div className="thumbnails-container">
            {images.map((image, index) => (
              <button
                key={image.id || index}
                className={`thumbnail-btn ${selectedImage?.id === image.id ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(image, index)}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={image.thumbnail_url || image.image_url}
                  alt={image.alt_text || `${productName} image ${index + 1}`}
                  className="thumbnail-image"
                  loading="lazy"
                />
                {image.is_main && <div className="main-badge">Main</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoomed Image Modal */}
      {isZoomed && (
        <div className="zoom-modal" onClick={() => setIsZoomed(false)}>
          <div className="zoom-modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="zoom-close-btn"
              onClick={() => setIsZoomed(false)}
              aria-label="Close zoom view"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="zoomed-image-container">
              <img
                src={currentImage.image_url}
                alt={currentImage.alt_text || productName}
                className="zoomed-image"
              />
            </div>

            {/* Navigation in zoom mode */}
            {images.length > 1 && (
              <>
                <button
                  className="zoom-nav-btn zoom-prev-btn"
                  onClick={handlePrevious}
                  aria-label="Previous image"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  className="zoom-nav-btn zoom-next-btn"
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Zoom thumbnail strip */}
            {images.length > 1 && (
              <div className="zoom-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image.id || index}
                    className={`zoom-thumbnail ${currentIndex === index ? 'active' : ''}`}
                    onClick={() => handleThumbnailClick(image, index)}
                  >
                    <img
                      src={image.thumbnail_url || image.image_url}
                      alt={`Thumbnail ${index + 1}`}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
