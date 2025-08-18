import React, { useState, useEffect } from 'react';
import { Save, RefreshCcw, Eye, Type, FileText, Tag } from 'lucide-react';

const ContentEditor = ({ content, onContentChange }) => {
  const [formData, setFormData] = useState({
    title: 'Welcome to ShopOnline',
    subtitle: '',
    hero_text: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || 'Welcome to ShopOnline',
        subtitle: content.subtitle || '',
        hero_text: content.hero_text || '',
        meta_description: content.meta_description || '',
        meta_keywords: content.meta_keywords || '',
        is_active: content.is_active !== undefined ? content.is_active : true,
      });
    }
  }, [content]);

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    setHasChanges(true);
    onContentChange(updatedData);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const url = content?.id
        ? `/api/admin/homepage-content/${content.id}/`
        : '/api/admin/homepage-content/';

      const method = content?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedContent = await response.json();
        onContentChange(updatedContent);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  const characterLimits = {
    title: 200,
    subtitle: 300,
    meta_description: 160,
    meta_keywords: 255,
  };

  const getCharacterCount = field => {
    return formData[field]?.length || 0;
  };

  const isOverLimit = field => {
    return getCharacterCount(field) > characterLimits[field];
  };

  return (
    <div className="content-editor">
      <div className="content-editor__header">
        <div className="content-editor__title">
          <h2>Homepage Content</h2>
          <p>Edit homepage titles, descriptions, and SEO content</p>
        </div>

        <div className="content-editor__actions">
          <button className="btn btn--secondary" onClick={handlePreview}>
            <Eye size={20} />
            Preview
          </button>

          <button
            className={`btn btn--primary ${hasChanges ? 'btn--highlight' : ''}`}
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={20} />
            {hasChanges ? 'Save Changes' : 'Save'}
          </button>
        </div>
      </div>

      <div className="content-editor__form">
        <div className="content-section">
          <div className="section-header">
            <Type size={20} />
            <h3>Main Content</h3>
          </div>

          <div className="form-group">
            <label htmlFor="title">
              Page Title *
              <span className={`char-count ${isOverLimit('title') ? 'over-limit' : ''}`}>
                {getCharacterCount('title')}/{characterLimits.title}
              </span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder="Welcome to ShopOnline"
              className={isOverLimit('title') ? 'error' : ''}
            />
            {isOverLimit('title') && (
              <span className="error-text">Title exceeds maximum length</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="subtitle">
              Subtitle
              <span className={`char-count ${isOverLimit('subtitle') ? 'over-limit' : ''}`}>
                {getCharacterCount('subtitle')}/{characterLimits.subtitle}
              </span>
            </label>
            <input
              id="subtitle"
              type="text"
              value={formData.subtitle}
              onChange={e => handleInputChange('subtitle', e.target.value)}
              placeholder="Your premier online shopping destination in Uganda"
              className={isOverLimit('subtitle') ? 'error' : ''}
            />
            {isOverLimit('subtitle') && (
              <span className="error-text">Subtitle exceeds maximum length</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="hero_text">Hero Text</label>
            <textarea
              id="hero_text"
              value={formData.hero_text}
              onChange={e => handleInputChange('hero_text', e.target.value)}
              rows="4"
              placeholder="Discover amazing products, enjoy secure payments with Mobile Money, and get fast delivery across Uganda..."
            />
            <small className="form-help">
              This text appears in the hero section of your homepage
            </small>
          </div>
        </div>

        <div className="content-section">
          <div className="section-header">
            <Tag size={20} />
            <h3>SEO Settings</h3>
          </div>

          <div className="form-group">
            <label htmlFor="meta_description">
              Meta Description
              <span className={`char-count ${isOverLimit('meta_description') ? 'over-limit' : ''}`}>
                {getCharacterCount('meta_description')}/{characterLimits.meta_description}
              </span>
            </label>
            <textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={e => handleInputChange('meta_description', e.target.value)}
              rows="3"
              placeholder="Shop online in Uganda with secure Mobile Money payments, fast delivery, and quality products..."
              className={isOverLimit('meta_description') ? 'error' : ''}
            />
            {isOverLimit('meta_description') && (
              <span className="error-text">Meta description exceeds recommended length</span>
            )}
            <small className="form-help">This description appears in search engine results</small>
          </div>

          <div className="form-group">
            <label htmlFor="meta_keywords">
              Meta Keywords
              <span className={`char-count ${isOverLimit('meta_keywords') ? 'over-limit' : ''}`}>
                {getCharacterCount('meta_keywords')}/{characterLimits.meta_keywords}
              </span>
            </label>
            <input
              id="meta_keywords"
              type="text"
              value={formData.meta_keywords}
              onChange={e => handleInputChange('meta_keywords', e.target.value)}
              placeholder="online shopping, Uganda, mobile money, ecommerce, products"
              className={isOverLimit('meta_keywords') ? 'error' : ''}
            />
            {isOverLimit('meta_keywords') && (
              <span className="error-text">Meta keywords exceed maximum length</span>
            )}
            <small className="form-help">Separate keywords with commas</small>
          </div>
        </div>

        <div className="content-section">
          <div className="section-header">
            <FileText size={20} />
            <h3>Status</h3>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => handleInputChange('is_active', e.target.checked)}
              />
              <span>Active</span>
            </label>
            <small className="form-help">
              When active, this content will be displayed on the homepage
            </small>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="unsaved-changes-notice">
          <div className="notice-content">
            <div className="notice-indicator" />
            <span>You have unsaved changes</span>
          </div>
          <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={loading}>
            Save Now
          </button>
        </div>
      )}

      <div className="content-preview">
        <h3>Preview</h3>
        <div className="preview-card">
          <div className="preview-hero">
            <h1>{formData.title || 'Welcome to ShopOnline'}</h1>
            {formData.subtitle && <h2>{formData.subtitle}</h2>}
            {formData.hero_text && <p>{formData.hero_text}</p>}
          </div>

          <div className="preview-seo">
            <h4>SEO Preview</h4>
            <div className="search-result-preview">
              <div className="search-title">{formData.title}</div>
              <div className="search-url">https://shoponline.com</div>
              <div className="search-description">
                {formData.meta_description || 'No meta description set'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;
