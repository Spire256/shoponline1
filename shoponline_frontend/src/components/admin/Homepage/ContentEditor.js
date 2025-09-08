import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, AlertCircle, Type, FileText, Tag, Search } from 'lucide-react';

const ContentEditor = ({ content, onContentChange }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    hero_text: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        subtitle: content.subtitle || '',
        hero_text: content.hero_text || '',
        meta_description: content.meta_description || '',
        meta_keywords: content.meta_keywords || '',
        is_active: content.is_active ?? true
      });
    }
  }, [content]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setUnsavedChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (formData.subtitle.length > 300) {
      newErrors.subtitle = 'Subtitle must be less than 300 characters';
    }

    if (formData.meta_description.length > 160) {
      newErrors.meta_description = 'Meta description should be less than 160 characters';
    }

    if (formData.meta_keywords.length > 255) {
      newErrors.meta_keywords = 'Meta keywords must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/homepage-content/', {
        method: content?.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedContent = await response.json();
        onContentChange(updatedContent);
        setUnsavedChanges(false);
      } else {
        const errorData = await response.json();
        setErrors(errorData);
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save content' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    window.open('/', '_blank');
  };

  const getCharacterCountColor = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-gray-500';
  };

  return (
    <div className="content-editor">
      <div className="editor-header">
        <div className="header-left">
          <h2 className="section-title">
            <Type className="icon" />
            Page Content Management
          </h2>
          <p className="section-description">
            Manage your homepage content, meta information, and SEO settings
          </p>
        </div>

        <div className="header-actions">
          <button 
            type="button"
            onClick={handlePreview}
            className="btn btn-outline"
          >
            <Eye className="icon" />
            Preview
          </button>
          
          <button 
            type="button"
            onClick={handleSave}
            disabled={loading || !unsavedChanges}
            className={`btn btn-primary ${unsavedChanges ? 'btn-highlight' : ''}`}
          >
            {loading ? (
              <>
                <RefreshCw className="icon spinning" />
                Saving...
              </>
            ) : (
              <>
                <Save className="icon" />
                {unsavedChanges ? 'Save Changes' : 'Save'}
              </>
            )}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="alert alert-error">
          <AlertCircle className="icon" />
          <span>{errors.submit}</span>
        </div>
      )}

      <div className="editor-content">
        <div className="editor-grid">
          {/* Main Content Section */}
          <div className="editor-section">
            <div className="section-header">
              <h3>Main Content</h3>
              <p>Primary homepage content visible to visitors</p>
            </div>

            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Page Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Enter page title..."
                maxLength={200}
              />
              <div className="form-meta">
                <span className={getCharacterCountColor(formData.title.length, 200)}>
                  {formData.title.length}/200 characters
                </span>
              </div>
              {errors.title && (
                <span className="error-text">{errors.title}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="subtitle" className="form-label">
                Subtitle
              </label>
              <input
                type="text"
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                className={`form-input ${errors.subtitle ? 'error' : ''}`}
                placeholder="Enter subtitle..."
                maxLength={300}
              />
              <div className="form-meta">
                <span className={getCharacterCountColor(formData.subtitle.length, 300)}>
                  {formData.subtitle.length}/300 characters
                </span>
              </div>
              {errors.subtitle && (
                <span className="error-text">{errors.subtitle}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="hero_text" className="form-label">
                Hero Section Text
              </label>
              <textarea
                id="hero_text"
                value={formData.hero_text}
                onChange={(e) => handleInputChange('hero_text', e.target.value)}
                className="form-textarea"
                placeholder="Enter hero section text..."
                rows={4}
              />
              <div className="form-hint">
                This text will appear in the main hero section of your homepage
              </div>
            </div>

            <div className="form-group">
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="checkmark"></span>
                Active Content
              </label>
              <div className="form-hint">
                When active, this content will be displayed on the homepage
              </div>
            </div>
          </div>

          {/* SEO Section */}
          <div className="editor-section">
            <div className="section-header">
              <h3>
                <Search className="icon" />
                SEO & Meta Information
              </h3>
              <p>Optimize your homepage for search engines</p>
            </div>

            <div className="form-group">
              <label htmlFor="meta_description" className="form-label">
                Meta Description
              </label>
              <textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                className={`form-textarea ${errors.meta_description ? 'error' : ''}`}
                placeholder="Enter meta description for search engines..."
                rows={3}
                maxLength={160}
              />
              <div className="form-meta">
                <span className={getCharacterCountColor(formData.meta_description.length, 160)}>
                  {formData.meta_description.length}/160 characters
                </span>
              </div>
              <div className="form-hint">
                This description will appear in search engine results. Keep it under 160 characters.
              </div>
              {errors.meta_description && (
                <span className="error-text">{errors.meta_description}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="meta_keywords" className="form-label">
                Meta Keywords
              </label>
              <input
                type="text"
                id="meta_keywords"
                value={formData.meta_keywords}
                onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                className={`form-input ${errors.meta_keywords ? 'error' : ''}`}
                placeholder="Enter keywords separated by commas..."
                maxLength={255}
              />
              <div className="form-meta">
                <span className={getCharacterCountColor(formData.meta_keywords.length, 255)}>
                  {formData.meta_keywords.length}/255 characters
                </span>
              </div>
              <div className="form-hint">
                Separate keywords with commas. Example: "shopping, uganda, online store"
              </div>
              {errors.meta_keywords && (
                <span className="error-text">{errors.meta_keywords}</span>
              )}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="content-preview">
          <div className="preview-header">
            <h3>Content Preview</h3>
            <p>How your content will appear to visitors</p>
          </div>

          <div className="preview-content">
            <div className="preview-hero">
              <h1 className="preview-title">{formData.title || 'Page Title'}</h1>
              {formData.subtitle && (
                <h2 className="preview-subtitle">{formData.subtitle}</h2>
              )}
              {formData.hero_text && (
                <p className="preview-hero-text">{formData.hero_text}</p>
              )}
            </div>

            {formData.meta_description && (
              <div className="preview-seo">
                <h4>SEO Preview</h4>
                <div className="seo-snippet">
                  <div className="seo-title">{formData.title}</div>
                  <div className="seo-url">https://shoponline.ug</div>
                  <div className="seo-description">{formData.meta_description}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {unsavedChanges && (
        <div className="unsaved-changes-indicator">
          <AlertCircle className="icon" />
          <span>You have unsaved changes</span>
        </div>
      )}

      <style jsx>{`
        .content-editor {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .header-left .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .header-left .section-description {
          color: #64748b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-highlight {
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
        }

        .btn-outline {
          background: white;
          color: #2563eb;
          border: 2px solid #2563eb;
        }

        .btn-outline:hover {
          background: #2563eb;
          color: white;
        }

        .icon {
          width: 16px;
          height: 16px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .editor-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .editor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .editor-section {
          background: white;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .section-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .section-header p {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-label.checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .required {
          color: #dc2626;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-input.error,
        .form-textarea.error {
          border-color: #dc2626;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #2563eb;
        }

        .form-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          font-size: 12px;
        }

        .form-hint {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }

        .error-text {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .content-preview {
          background: white;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .preview-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .preview-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .preview-header p {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .preview-hero {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 32px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 24px;
        }

        .preview-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .preview-subtitle {
          font-size: 1.25rem;
          font-weight: 400;
          color: #64748b;
          margin: 0 0 16px 0;
        }

        .preview-hero-text {
          color: #475569;
          margin: 0;
          line-height: 1.6;
        }

        .preview-seo h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .seo-snippet {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .seo-title {
          color: #1a0dab;
          font-size: 18px;
          margin-bottom: 4px;
        }

        .seo-url {
          color: #006621;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .seo-description {
          color: #545454;
          font-size: 14px;
          line-height: 1.4;
        }

        .unsaved-changes-indicator {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f59e0b;
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .editor-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .header-actions {
            justify-content: flex-end;
          }

          .editor-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .editor-section {
            padding: 16px;
          }

          .preview-hero {
            padding: 24px 16px;
          }

          .preview-title {
            font-size: 1.5rem;
          }

          .preview-subtitle {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ContentEditor;