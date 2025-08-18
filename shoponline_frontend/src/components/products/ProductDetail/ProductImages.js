// src/components/products/ProductDetail/ProductImages.js
import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

const ProductImages = ({
  images = [],
  selectedIndex = 0,
  onImageSelect,
  productName = '',
  className = '',
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Use placeholder if no images
  const displayImages =
    images.length > 0
      ? images
      : [
          {
            id: 'placeholder',
            image_url: '/assets/images/placeholders/product-placeholder.jpg',
            thumbnail_url: '/assets/images/placeholders/product-placeholder.jpg',
            alt_text: productName || 'Product Image',
          },
        ];

  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const handleThumbnailClick = useCallback(
    index => {
      if (onImageSelect) {
        onImageSelect(index);
      }
    },
    [onImageSelect]
  );

  const handlePrevImage = useCallback(() => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : displayImages.length - 1;
    handleThumbnailClick(newIndex);
  }, [selectedIndex, displayImages.length, handleThumbnailClick]);

  const handleNextImage = useCallback(() => {
    const newIndex = selectedIndex < displayImages.length - 1 ? selectedIndex + 1 : 0;
    handleThumbnailClick(newIndex);
  }, [selectedIndex, displayImages.length, handleThumbnailClick]);

  const handleMouseMove = useCallback(
    e => {
      if (!isZoomed) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setZoomPosition({ x, y });
    },
    [isZoomed]
  );

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const openModal = (index = selectedIndex) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  };

  const handleModalPrev = () => {
    setModalImageIndex(prev =>
      prev > 0 ? prev - 1 : displayImages.length - 1
    );
  };

  const handleModalNext = () => {
    setModalImageIndex(prev =>
      prev < displayImages.length - 1 ? prev + 1 : 0
    );
  };

  const handleKeyDown = useCallback(
    e => {
      if (!isModalOpen) return;

      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          handleModalPrev();
          break;
        case 'ArrowRight':
          handleModalNext();
          break;
        default:
          break;
      }
    },
    [isModalOpen]
  );

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`product-images ${className}`}>
      {/* Main Image */}
      <div className="main-image-container">
        <div
          className="main-image-wrapper"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={currentImage.image_url}
            alt={currentImage.alt_text || productName}
            className={`main-image ${isZoomed ? 'zoomed' : ''}`}
            style={
              isZoomed
                ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : {}
            }
          />

          {/* Expand Button */}
          <button className="expand-btn" onClick={() => openModal()} title="View full size">
            <Expand size={20} />
          </button>

          {/* Navigation Arrows (only show if multiple images) */}
          {displayImages.length > 1 && (
            <>
              <button
                className="nav-btn nav-btn--prev"
                onClick={handlePrevImage}
                title="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className="nav-btn nav-btn--next"
                onClick={handleNextImage}
                title="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="image-counter">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="thumbnail-gallery">
          <div className="thumbnail-scroll">
            {displayImages.map((image, index) => (
              <button
                key={image.id || index}
                className={`thumbnail ${index === selectedIndex ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(index)}
              >
                <img
                  src={image.thumbnail_url || image.image_url}
                  alt={image.alt_text || `${productName} ${index + 1}`}
                  className="thumbnail-image"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="image-modal" onClick={closeModal}>
          <div className="image-modal__content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} title="Close">
              <X size={24} />
            </button>

            <div className="modal-image-container">
              <img
                src={displayImages[modalImageIndex]?.image_url}
                alt={displayImages[modalImageIndex]?.alt_text || productName}
                className="modal-image"
              />

              {displayImages.length > 1 && (
                <>
                  <button
                    className="modal-nav modal-nav--prev"
                    onClick={handleModalPrev}
                    title="Previous image"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    className="modal-nav modal-nav--next"
                    onClick={handleModalNext}
                    title="Next image"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
            </div>

            {displayImages.length > 1 && (
              <div className="modal-thumbnails">
                {displayImages.map((image, index) => (
                  <button
                    key={image.id || index}
                    className={`modal-thumbnail ${index === modalImageIndex ? 'active' : ''}`}
                    onClick={() => setModalImageIndex(index)}
                  >
                    <img
                      src={image.thumbnail_url || image.image_url}
                      alt={image.alt_text || `${productName} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="modal-counter">
              {modalImageIndex + 1} / {displayImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImages;