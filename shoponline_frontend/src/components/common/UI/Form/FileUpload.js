import React, { useState, useRef, forwardRef } from 'react';
import './Form.css';

const FileUpload = forwardRef(
  (
    {
      label,
      accept,
      multiple = false,
      maxSize = 5 * 1024 * 1024, // 5MB default
      maxFiles = 5,
      onChange,
      onError,
      error,
      disabled = false,
      required = false,
      className = '',
      id,
      name,
      helperText,
      preview = true,
      dragAndDrop = true,
      ...props
    },
    ref
  ) => {
    const [files, setFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const combinedRef = ref || fileInputRef;

    const fileUploadId = id || name || `file-upload-${Math.random().toString(36).substr(2, 9)}`;

    const validateFile = file => {
      const errors = [];

      // Check file size
      if (maxSize && file.size > maxSize) {
        errors.push(`File size exceeds ${formatFileSize(maxSize)}`);
      }

      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;

        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return type.toLowerCase() === fileExtension;
          }
          return fileType.match(type.replace('*', '.*'));
        });

        if (!isAccepted) {
          errors.push('File type not supported');
        }
      }

      return errors;
    };

    const processFiles = fileList => {
      const newFiles = [];
      const errors = [];

      // Convert FileList to Array
      const fileArray = Array.from(fileList);

      // Check max files limit
      const totalFiles = multiple ? files.length + fileArray.length : 1;
      if (maxFiles && totalFiles > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        if (onError) onError(errors);
        return;
      }

      fileArray.forEach(file => {
        const fileErrors = validateFile(file);

        if (fileErrors.length === 0) {
          const fileObj = {
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: null,
            id: Math.random().toString(36).substr(2, 9),
          };

          // Generate preview for images
          if (preview && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = e => {
              fileObj.preview = e.target.result;
              // Force re-render
              setFiles(prevFiles => [...prevFiles]);
            };
            reader.readAsDataURL(file);
          }

          newFiles.push(fileObj);
        } else {
          errors.push(`${file.name}: ${fileErrors.join(', ')}`);
        }
      });

      if (errors.length > 0) {
        if (onError) onError(errors);
      }

      if (newFiles.length > 0) {
        const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
        setFiles(updatedFiles);
        if (onChange) onChange(updatedFiles.map(f => f.file));
      }
    };

    const handleFileSelect = e => {
      const fileList = e.target.files;
      if (fileList && fileList.length > 0) {
        processFiles(fileList);
      }
    };

    const handleDragOver = e => {
      e.preventDefault();
      if (!disabled && dragAndDrop) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = e => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = e => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled || !dragAndDrop) return;

      const fileList = e.dataTransfer.files;
      if (fileList && fileList.length > 0) {
        processFiles(fileList);
      }
    };

    const removeFile = fileId => {
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      if (onChange) onChange(updatedFiles.map(f => f.file));
    };

    const openFileDialog = () => {
      if (!disabled && combinedRef.current) {
        combinedRef.current.click();
      }
    };

    const formatFileSize = bytes => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const getFileIcon = fileType => {
      if (fileType.startsWith('image/')) {
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        );
      } else if (fileType.includes('pdf')) {
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
        );
      }
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    };

    const containerClasses = [
      'form-fileupload-container',
      error && 'form-fileupload-container--error',
      disabled && 'form-fileupload-container--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const dropzoneClasses = [
      'form-fileupload__dropzone',
      isDragOver && 'form-fileupload__dropzone--drag-over',
      disabled && 'form-fileupload__dropzone--disabled',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label className="form-label">
            {label}
            {required && <span className="form-label__required">*</span>}
          </label>
        )}

        <input
          ref={combinedRef}
          type="file"
          id={fileUploadId}
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          required={required}
          className="form-fileupload__input"
          {...props}
        />

        <div
          className={dropzoneClasses}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="form-fileupload__dropzone-content">
            <div className="form-fileupload__icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5-5 5 5" />
                <path d="M12 15V4" />
              </svg>
            </div>

            <div className="form-fileupload__text">
              {dragAndDrop ? (
                <>
                  <p className="form-fileupload__primary-text">
                    Drop files here or click to browse
                  </p>
                  <p className="form-fileupload__secondary-text">
                    {accept && `Accepted formats: ${accept}`}
                    {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
                  </p>
                </>
              ) : (
                <p className="form-fileupload__primary-text">Click to select files</p>
              )}
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="form-fileupload__files">
            {files.map(fileObj => (
              <div key={fileObj.id} className="form-fileupload__file">
                <div className="form-fileupload__file-preview">
                  {fileObj.preview ? (
                    <img src={fileObj.preview} alt={fileObj.name} />
                  ) : (
                    <div className="form-fileupload__file-icon">{getFileIcon(fileObj.type)}</div>
                  )}
                </div>

                <div className="form-fileupload__file-info">
                  <div className="form-fileupload__file-name">{fileObj.name}</div>
                  <div className="form-fileupload__file-size">{formatFileSize(fileObj.size)}</div>
                </div>

                <button
                  type="button"
                  className="form-fileupload__file-remove"
                  onClick={() => removeFile(fileObj.id)}
                  aria-label={`Remove ${fileObj.name}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {(error || helperText) && (
          <div className="form-fileupload__feedback">
            {error && (
              <div className="form-fileupload__error">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {Array.isArray(error) ? error.join(', ') : error}
              </div>
            )}

            {helperText && !error && (
              <div className="form-fileupload__helper">
                {helperText}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;