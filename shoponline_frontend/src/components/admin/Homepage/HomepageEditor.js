import React, { useState, useEffect } from 'react';
import { Plus, Save, RefreshCcw, Eye, Settings } from 'lucide-react';
import BannerManager from './BannerManager';
import FeaturedProducts from './FeaturedProducts';
import ContentEditor from './ContentEditor';
import FlashSalesWidget from './FlashSalesWidget';
import './HomepageEditor.css';

const HomepageEditor = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(false);
  const [homepageContent, setHomepageContent] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/homepage-content/active_content/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHomepageContent(data);
      }
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Save all changes across components
      // This would trigger save methods in child components
      setUnsavedChanges(false);
      // Show success message
    } catch (error) {
      console.error('Error saving homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // Open homepage in new tab for preview
    window.open('/', '_blank');
  };

  const tabs = [
    { id: 'content', label: 'Page Content', icon: Settings },
    { id: 'banners', label: 'Banners', icon: Plus },
    { id: 'featured', label: 'Featured Products', icon: Plus },
    { id: 'flash-sales', label: 'Flash Sales Widget', icon: Plus },
  ];

  return (
    <div className="homepage-editor">
      <div className="homepage-editor__header">
        <div className="homepage-editor__title">
          <h1>Homepage Management</h1>
          <p>Manage your homepage content, banners, and featured products</p>
        </div>

        <div className="homepage-editor__actions">
          <button className="btn btn--secondary" onClick={handlePreview}>
            <Eye size={20} />
            Preview Homepage
          </button>

          <button className="btn btn--outline" onClick={fetchHomepageData} disabled={loading}>
            <RefreshCcw size={20} />
            Refresh
          </button>

          <button
            className={`btn btn--primary ${unsavedChanges ? 'btn--highlight' : ''}`}
            onClick={handleSaveAll}
            disabled={loading}
          >
            <Save size={20} />
            {unsavedChanges ? 'Save Changes' : 'Save'}
          </button>
        </div>
      </div>

      <div className="homepage-editor__tabs">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="homepage-editor__content">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <p>Loading homepage data...</p>
          </div>
        )}

        {activeTab === 'content' && (
          <ContentEditor
            content={homepageContent}
            onContentChange={updated => {
              setHomepageContent(updated);
              setUnsavedChanges(true);
            }}
          />
        )}

        {activeTab === 'banners' && <BannerManager onDataChange={() => setUnsavedChanges(true)} />}

        {activeTab === 'featured' && (
          <FeaturedProducts onDataChange={() => setUnsavedChanges(true)} />
        )}

        {activeTab === 'flash-sales' && (
          <FlashSalesWidget onDataChange={() => setUnsavedChanges(true)} />
        )}
      </div>

      {unsavedChanges && (
        <div className="homepage-editor__unsaved-notice">
          <div className="unsaved-notice">
            <div className="unsaved-notice__content">
              <div className="unsaved-indicator" />
              <span>You have unsaved changes</span>
            </div>
            <button className="btn btn--primary btn--sm" onClick={handleSaveAll}>
              Save Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageEditor;
