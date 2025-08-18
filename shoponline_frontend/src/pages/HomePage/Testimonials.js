// src/pages/HomePage/Testimonials.js
import React, { useState, useEffect, useCallback } from 'react';
import './HomePage.css';

const Testimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Static testimonials data - in a real app, this could come from an API
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Nakamya',
      location: 'Kampala, Uganda',
      rating: 5,
      text: 'ShopOnline has made shopping so convenient for me. The mobile money payment is seamless, and delivery is always on time. I especially love their flash sales!',
      avatar: '/images/testimonials/sarah.jpg',
      verified: true,
      purchaseInfo: 'Electronics Customer',
    },
    {
      id: 2,
      name: 'James Okello',
      location: 'Entebbe, Uganda',
      rating: 5,
      text: 'The quality of products is excellent and the prices are very competitive. Customer service is also very responsive. Highly recommended!',
      avatar: '/images/testimonials/james.jpg',
      verified: true,
      purchaseInfo: 'Fashion Customer',
    },
    {
      id: 3,
      name: 'Grace Achieng',
      location: 'Jinja, Uganda',
      rating: 4,
      text: 'Great variety of products and fast delivery. The cash on delivery option is perfect for me. Will definitely shop again!',
      avatar: '/images/testimonials/grace.jpg',
      verified: true,
      purchaseInfo: 'Home & Garden Customer',
    },
    {
      id: 4,
      name: 'David Musoke',
      location: 'Mukono, Uganda',
      rating: 5,
      text: "I've been shopping with ShopOnline for over a year. Their featured products section always has exactly what I'm looking for. Amazing service!",
      avatar: '/images/testimonials/david.jpg',
      verified: true,
      purchaseInfo: 'Sports & Fitness Customer',
    },
    {
      id: 5,
      name: 'Mary Nalongo',
      location: 'Wakiso, Uganda',
      rating: 5,
      text: 'The website is easy to use and the mobile money integration works perfectly with both MTN and Airtel. Shopping has never been this easy!',
      avatar: '/images/testimonials/mary.jpg',
      verified: true,
      purchaseInfo: 'Beauty & Health Customer',
    },
  ];

  const nextTestimonial = useCallback(() => {
    setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = useCallback(() => {
    setCurrentTestimonial(prev => (prev === 0 ? testimonials.length - 1 : prev - 1));
  }, [testimonials.length]);

  const goToTestimonial = useCallback(index => {
    setCurrentTestimonial(index);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(nextTestimonial, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextTestimonial]);

  const renderStars = rating => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`star ${index < rating ? 'filled' : ''}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ));
  };

  const current = testimonials[currentTestimonial];
  const visibleTestimonials = [
    testimonials[(currentTestimonial - 1 + testimonials.length) % testimonials.length],
    current,
    testimonials[(currentTestimonial + 1) % testimonials.length],
  ];

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <div className="section-title-group">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Join thousands of happy customers across Uganda</p>
          </div>
        </div>

        <div
          className="testimonials-container"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main testimonial display */}
          <div className="testimonials-carousel">
            <div className="testimonials-track">
              {visibleTestimonials.map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}`}
                  className={`testimonial-card ${
                    index === 1 ? 'active' : index === 0 ? 'prev' : 'next'
                  }`}
                >
                  <div className="testimonial-content">
                    <div className="quote-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>

                    <div className="testimonial-text">
                      <p>"{testimonial.text}"</p>
                    </div>

                    <div className="testimonial-rating">
                      <div className="stars">{renderStars(testimonial.rating)}</div>
                    </div>
                  </div>

                  <div className="testimonial-author">
                    <div className="author-avatar">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        onError={e => {
                          e.target.src = '/images/placeholder-avatar.jpg';
                        }}
                      />
                      {testimonial.verified && (
                        <div className="verified-badge">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12l2 2 4-4" />
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="author-info">
                      <h4 className="author-name">{testimonial.name}</h4>
                      <p className="author-location">{testimonial.location}</p>
                      <span className="purchase-info">{testimonial.purchaseInfo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            <button
              className="testimonial-nav prev"
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <button
              className="testimonial-nav next"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Testimonial indicators */}
          <div className="testimonial-indicators">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentTestimonial ? 'active' : ''}`}
                onClick={() => goToTestimonial(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Customer stats */}
        <div className="customer-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">5,000+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">4.8/5</div>
              <div className="stat-label">Average Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Orders Delivered</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="trust-badges">
          <div className="badges-grid">
            <div className="trust-badge">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z" />
                  <path d="M3 12v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6" />
                </svg>
              </div>
              <div className="badge-text">
                <span className="badge-title">Secure Payments</span>
                <span className="badge-desc">SSL Protected</span>
              </div>
            </div>

            <div className="trust-badge">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="badge-text">
                <span className="badge-title">Quality Guaranteed</span>
                <span className="badge-desc">100% Authentic</span>
              </div>
            </div>

            <div className="trust-badge">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <div className="badge-text">
                <span className="badge-title">Fast Delivery</span>
                <span className="badge-desc">Same Day Available</span>
              </div>
            </div>

            <div className="trust-badge">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="badge-text">
                <span className="badge-title">24/7 Support</span>
                <span className="badge-desc">Always Here to Help</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
