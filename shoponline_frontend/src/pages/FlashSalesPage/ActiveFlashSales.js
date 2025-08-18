import React from 'react';
import { Clock, ChevronLeft, ChevronRight, Tag, Users } from 'lucide-react';
import FlashSaleTimer from './FlashSaleTimer';

const ActiveFlashSales = ({ flashSales, selectedSale, onSaleSelect }) => {
  const scrollContainer = React.useRef(null);

  const scrollLeft = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!flashSales || flashSales.length === 0) {
    return null;
  }

  return (
    <div className="active-flash-sales">
      <div className="section-header">
        <h2>Active Flash Sales</h2>
        <p>
          Choose from {flashSales.length} active flash sale{flashSales.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="sales-navigation">
        {flashSales.length > 3 && (
          <button className="scroll-btn scroll-left" onClick={scrollLeft}>
            <ChevronLeft size={20} />
          </button>
        )}

        <div className="sales-container" ref={scrollContainer}>
          {flashSales.map(sale => (
            <div
              key={sale.id}
              className={`sale-card ${selectedSale?.id === sale.id ? 'selected' : ''}`}
              onClick={() => onSaleSelect(sale)}
            >
              <div className="sale-image">
                {sale.banner_image ? (
                  <img src={sale.banner_image} alt={sale.name} className="banner-img" />
                ) : (
                  <div className="banner-placeholder">
                    <Tag size={32} />
                  </div>
                )}
                <div className="sale-badge">
                  <span>{sale.discount_percentage}% OFF</span>
                </div>
              </div>

              <div className="sale-content">
                <h3 className="sale-title">{sale.name}</h3>
                {sale.description && <p className="sale-description">{sale.description}</p>}

                <div className="sale-stats">
                  <div className="stat">
                    <Users size={14} />
                    <span>{sale.products_count} products</span>
                  </div>
                  <div className="stat priority">
                    <span className="priority-badge">Priority {sale.priority}</span>
                  </div>
                </div>

                <div className="sale-timer-container">
                  <Clock size={14} />
                  <FlashSaleTimer
                    endTime={sale.end_time}
                    isRunning={sale.is_running}
                    isUpcoming={sale.is_upcoming}
                    compact={true}
                  />
                </div>

                <div className="sale-status">
                  {sale.is_running && <span className="status-badge running">🔥 Live Now</span>}
                  {sale.is_upcoming && (
                    <span className="status-badge upcoming">⏰ Coming Soon</span>
                  )}
                  {sale.is_expired && <span className="status-badge expired">⏰ Ended</span>}
                </div>
              </div>

              {selectedSale?.id === sale.id && (
                <div className="selected-indicator">
                  <div className="indicator-dot" />
                </div>
              )}
            </div>
          ))}
        </div>

        {flashSales.length > 3 && (
          <button className="scroll-btn scroll-right" onClick={scrollRight}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Mobile Dots Indicator */}
      {flashSales.length > 1 && (
        <div className="mobile-indicators">
          {flashSales.map((sale, index) => (
            <button
              key={sale.id}
              className={`indicator ${selectedSale?.id === sale.id ? 'active' : ''}`}
              onClick={() => onSaleSelect(sale)}
              aria-label={`Select ${sale.name}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .active-flash-sales {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 2rem 1rem;
          margin-bottom: 2rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .section-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .section-header p {
          color: #64748b;
          font-size: 0.9rem;
        }

        .sales-navigation {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .scroll-btn {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 2;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .scroll-btn:hover {
          background: #2563eb;
          color: white;
          transform: scale(1.05);
        }

        .sales-container {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
          flex: 1;
          padding: 0.5rem 0;
        }

        .sales-container::-webkit-scrollbar {
          display: none;
        }

        .sale-card {
          background: white;
          border-radius: 12px;
          min-width: 280px;
          max-width: 300px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          position: relative;
          overflow: hidden;
        }

        .sale-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.15);
          border-color: #2563eb;
        }

        .sale-card.selected {
          border-color: #2563eb;
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
          transform: translateY(-2px);
        }

        .sale-image {
          position: relative;
          height: 120px;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          overflow: hidden;
        }

        .banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .banner-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0.8;
        }

        .sale-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ef4444;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sale-content {
          padding: 1rem;
        }

        .sale-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .sale-description {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 0.75rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .sale-stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .priority-badge {
          background: #f1f5f9;
          color: #475569;
          padding: 0.125rem 0.375rem;
          border-radius: 12px;
          font-size: 0.6rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .sale-timer-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #64748b;
          font-size: 0.8rem;
        }

        .sale-status {
          display: flex;
          justify-content: center;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.running {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.upcoming {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.expired {
          background: #fee2e2;
          color: #991b1b;
        }

        .selected-indicator {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
        }

        .indicator-dot {
          width: 8px;
          height: 8px;
          background: #2563eb;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .mobile-indicators {
          display: none;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .indicator.active {
          background: #2563eb;
          transform: scale(1.2);
        }

        @media (max-width: 768px) {
          .active-flash-sales {
            padding: 1rem;
          }

          .scroll-btn {
            display: none;
          }

          .sales-container {
            gap: 0.75rem;
          }

          .sale-card {
            min-width: 240px;
            max-width: 260px;
          }

          .mobile-indicators {
            display: flex;
          }
        }

        @media (max-width: 480px) {
          .sale-card {
            min-width: 200px;
            max-width: 220px;
          }

          .sale-image {
            height: 100px;
          }

          .sale-content {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ActiveFlashSales;
