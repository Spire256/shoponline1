// src/components/admin/Categories/AddCategory.js

import React from 'react';
import { X } from 'lucide-react';
import CategoryForm from './CategoryForm';
import { categoriesAPI } from '../../../services/api/categoriesAPI';
import { useNotifications } from '../../../hooks/useNotifications';

const AddCategory = ({ onClose, onSuccess }) => {
  const { showNotification } = useNotifications();

  const handleSubmit = async formData => {
    try {
      const category = await categoriesAPI.createCategory(formData);
      onSuccess(category);
    } catch (error) {
      console.error('Error creating category:', error);

      // Handle specific error messages
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat();
          throw new Error(errorMessages.join(', '));
        } else if (typeof errorData === 'string') {
          throw new Error(errorData);
        }
      }

      throw new Error('Failed to create category. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content category-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Add New Category</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X className="icon" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <CategoryForm mode="create" onSubmit={handleSubmit} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
