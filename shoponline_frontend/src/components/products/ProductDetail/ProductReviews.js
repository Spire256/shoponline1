import React, { useState, useEffect, useContext } from 'react';
import { Star, ThumbsUp, ThumbsDown, Filter, ChevronDown, User } from 'lucide-react';
import { AuthContext } from '../../../contexts/AuthContext';
import { NotificationContext } from '../../../contexts/NotificationContext';
import Button from '../../common/UI/Button/Button';
import Modal from '../../common/UI/Modal/Modal';
import Loading from '../../common/UI/Loading/Spinner';
import { get_relative_time } from '../../../utils/helpers/dateHelpers';
import './ProductReviews.css';

const ProductReviews = ({ product, productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    recommend: true,
  });

  const { user, isAuthenticated } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);

  useEffect(() => {
    fetchReviews();
  }, [productId, filterRating, sortBy, currentPage]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Simulate API call - replace with actual API endpoint
      const mockReviews = [
        {
          id: 1,
          user: { name: 'Sarah Nakamura', avatar: null },
          rating: 5,
          title: 'Excellent product!',
          comment:
            'This product exceeded my expectations. Great quality and fast delivery to Kampala.',
          created_at: '2024-01-15T10:30:00Z',
          helpful_votes: 12,
          unhelpful_votes: 1,
          verified_purchase: true,
          recommend: true,
        },
        {
          id: 2,
          user: { name: 'David Ssemakula', avatar: null },
          rating: 4,
          title: 'Good value for money',
          comment: 'Product works as expected. Delivery was quick within Kampala. Would buy again.',
          created_at: '2024-01-10T14:20:00Z',
          helpful_votes: 8,
          unhelpful_votes: 0,
          verified_purchase: true,
          recommend: true,
        },
        {
          id: 3,
          user: { name: 'Grace Achieng', avatar: null },
          rating: 3,
          title: 'Average product',
          comment: 'Product is okay but could be better. The packaging was good.',
          created_at: '2024-01-08T09:15:00Z',
          helpful_votes: 3,
          unhelpful_votes: 2,
          verified_purchase: false,
          recommend: false,
        },
      ];

      setReviews(mockReviews);
      setHasMore(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showNotification('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async e => {
    e.preventDefault();

    if (!isAuthenticated) {
      showNotification('Please login to write a review', 'info');
      return;
    }

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setSubmittingReview(true);

    try {
      // Simulate API call - replace with actual API endpoint
      const newReview = {
        id: reviews.length + 1,
        user: { name: user.name || user.email, avatar: user.avatar },
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        created_at: new Date().toISOString(),
        helpful_votes: 0,
        unhelpful_votes: 0,
        verified_purchase: true,
        recommend: reviewForm.recommend,
      };

      setReviews([newReview, ...reviews]);
      setShowReviewModal(false);
      setReviewForm({
        rating: 5,
        title: '',
        comment: '',
        recommend: true,
      });

      showNotification('Review submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification('Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleVoteHelpful = async (reviewId, isHelpful) => {
    if (!isAuthenticated) {
      showNotification('Please login to vote on reviews', 'info');
      return;
    }

    // Simulate API call and update reviews
    setReviews(
      reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            helpful_votes: isHelpful ? review.helpful_votes + 1 : review.helpful_votes,
            unhelpful_votes: !isHelpful ? review.unhelpful_votes + 1 : review.unhelpful_votes,
          };
        }
        return review;
      })
    );

    showNotification('Thank you for your feedback!', 'success');
  };

  const getFilteredReviews = () => {
    let filtered = reviews;

    if (filterRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(filterRating));
    }

    // Sort reviews
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful_votes - a.helpful_votes;
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

  const renderStarRating = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className={`star-rating ${interactive ? 'interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={interactive ? 24 : 16}
            className={`star ${star <= rating ? 'filled' : ''}`}
            fill={star <= rating ? '#fbbf24' : 'none'}
            onClick={interactive ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = reviews.filter(review => review.rating === rating).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      return { rating, count, percentage };
    });

    return (
      <div className="rating-distribution">
        <div className="rating-summary">
          <div className="average-rating">
            <span className="rating-number">{product?.rating_average || 0}</span>
            {renderStarRating(Math.round(product?.rating_average || 0))}
          </div>
          <div className="rating-count">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        <div className="rating-bars">
          {distribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="rating-bar-row">
              <span className="rating-label">{rating}</span>
              <Star size={12} fill="#fbbf24" />
              <div className="rating-bar">
                <div className="rating-bar-fill" style={{ width: `${percentage}%` }} />
              </div>
              <span className="rating-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="product-reviews loading">
        <Loading />
      </div>
    );
  }

  const filteredReviews = getFilteredReviews();

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h3 className="reviews-title">Customer Reviews</h3>

        {isAuthenticated && (
          <Button
            variant="primary"
            onClick={() => setShowReviewModal(true)}
            className="write-review-btn"
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating Distribution */}
      {reviews.length > 0 && renderRatingDistribution()}

      {/* Filters and Sorting */}
      {reviews.length > 0 && (
        <div className="reviews-controls">
          <div className="review-filters">
            <select
              value={filterRating}
              onChange={e => setFilterRating(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {filteredReviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review this product!</p>
            {isAuthenticated && (
              <Button variant="outline" onClick={() => setShowReviewModal(true)}>
                Write First Review
              </Button>
            )}
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.user.avatar ? (
                      <img src={review.user.avatar} alt={review.user.name} />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="reviewer-details">
                    <span className="reviewer-name">{review.user.name}</span>
                    {review.verified_purchase && (
                      <span className="verified-badge">Verified Purchase</span>
                    )}
                  </div>
                </div>

                <div className="review-meta">
                  {renderStarRating(review.rating)}
                  <span className="review-date">
                    {get_relative_time(new Date(review.created_at))}
                  </span>
                </div>
              </div>

              <div className="review-content">
                <h4 className="review-title">{review.title}</h4>
                <p className="review-comment">{review.comment}</p>

                {review.recommend && (
                  <div className="recommendation">
                    <ThumbsUp size={16} />
                    <span>Recommends this product</span>
                  </div>
                )}
              </div>

              <div className="review-actions">
                <span className="helpful-text">Was this review helpful?</span>

                <div className="vote-buttons">
                  <button
                    className="vote-btn helpful"
                    onClick={() => handleVoteHelpful(review.id, true)}
                  >
                    <ThumbsUp size={16} />
                    <span>Yes ({review.helpful_votes})</span>
                  </button>

                  <button
                    className="vote-btn unhelpful"
                    onClick={() => handleVoteHelpful(review.id, false)}
                  >
                    <ThumbsDown size={16} />
                    <span>No ({review.unhelpful_votes})</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
        className="review-modal"
      >
        <form onSubmit={handleSubmitReview} className="review-form">
          <div className="form-group">
            <label className="form-label">Overall Rating *</label>
            {renderStarRating(reviewForm.rating, true, rating =>
              setReviewForm({ ...reviewForm, rating })
            )}
          </div>

          <div className="form-group">
            <label htmlFor="review-title" className="form-label">
              Review Title *
            </label>
            <input
              type="text"
              id="review-title"
              className="form-input"
              value={reviewForm.title}
              onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder="Summarize your experience"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="review-comment" className="form-label">
              Your Review *
            </label>
            <textarea
              id="review-comment"
              className="form-textarea"
              value={reviewForm.comment}
              onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Tell others about your experience with this product"
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={reviewForm.recommend}
                onChange={e => setReviewForm({ ...reviewForm, recommend: e.target.checked })}
              />
              <span className="checkmark" />I would recommend this product to others
            </label>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReviewModal(false)}
              disabled={submittingReview}
            >
              Cancel
            </Button>

            <Button type="submit" variant="primary" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductReviews;
