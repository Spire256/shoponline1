import React, { useState } from 'react';
import './ProductPage.css';

const ProductSpecifications = ({ attributes = [], productDetails = {} }) => {
  const [expandedSections, setExpandedSections] = useState({
    attributes: true,
    details: true,
  });

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Format product details into a consistent structure
  const formatProductDetails = details => {
    const formattedDetails = [];

    if (details.brand) {
      formattedDetails.push({ label: 'Brand', value: details.brand });
    }

    if (details.model) {
      formattedDetails.push({ label: 'Model', value: details.model });
    }

    if (details.condition) {
      const conditionMap = {
        new: 'New',
        used: 'Used',
        refurbished: 'Refurbished',
      };
      formattedDetails.push({
        label: 'Condition',
        value: conditionMap[details.condition] || details.condition,
      });
    }

    if (details.color) {
      formattedDetails.push({ label: 'Color', value: details.color });
    }

    if (details.size) {
      formattedDetails.push({ label: 'Size', value: details.size });
    }

    if (details.material) {
      formattedDetails.push({ label: 'Material', value: details.material });
    }

    if (details.weight) {
      formattedDetails.push({
        label: 'Weight',
        value: `${details.weight}${typeof details.weight === 'number' ? ' kg' : ''}`,
      });
    }

    if (details.dimensions) {
      formattedDetails.push({ label: 'Dimensions', value: details.dimensions });
    }

    return formattedDetails;
  };

  const productDetailsFormatted = formatProductDetails(productDetails);
  const hasAttributes = attributes && attributes.length > 0;
  const hasProductDetails = productDetailsFormatted.length > 0;

  // Sort attributes by position
  const sortedAttributes = hasAttributes
    ? [...attributes].sort((a, b) => (a.position || 0) - (b.position || 0))
    : [];

  if (!hasAttributes && !hasProductDetails) {
    return (
      <div className="product-specifications">
        <div className="no-specifications">
          <div className="no-spec-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3>No Specifications Available</h3>
          <p>Detailed specifications for this product are not available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-specifications">
      {/* Custom Attributes Section */}
      {hasAttributes && (
        <div className="specifications-section">
          <div className="section-header" onClick={() => toggleSection('attributes')}>
            <h3>Technical Specifications</h3>
            <button
              className={`expand-btn ${expandedSections.attributes ? 'expanded' : ''}`}
              aria-label={expandedSections.attributes ? 'Collapse section' : 'Expand section'}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {expandedSections.attributes && (
            <div className="specifications-content">
              <div className="specifications-grid">
                {sortedAttributes.map((attr, index) => (
                  <div key={attr.id || index} className="specification-item">
                    <div className="spec-label">{attr.name}</div>
                    <div className="spec-value">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Details Section */}
      {hasProductDetails && (
        <div className="specifications-section">
          <div className="section-header" onClick={() => toggleSection('details')}>
            <h3>Product Details</h3>
            <button
              className={`expand-btn ${expandedSections.details ? 'expanded' : ''}`}
              aria-label={expandedSections.details ? 'Collapse section' : 'Expand section'}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {expandedSections.details && (
            <div className="specifications-content">
              <div className="specifications-grid">
                {productDetailsFormatted.map((detail, index) => (
                  <div key={`detail-${index}`} className="specification-item">
                    <div className="spec-label">{detail.label}</div>
                    <div className="spec-value">{detail.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional Information */}
      <div className="specifications-footer">
        <div className="spec-note">
          <div className="note-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p>
            Specifications are provided by the manufacturer and may vary slightly from the actual
            product. Please contact us if you need more specific information about this product.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductSpecifications;
