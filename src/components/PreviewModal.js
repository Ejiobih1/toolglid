import React, { useEffect } from 'react';
import PDFPreview from './previews/PDFPreview';
import ImagePreview from './previews/ImagePreview';
import WordPreview from './previews/WordPreview';

const PreviewModal = ({ isOpen, onClose, onDownload, result, fileType, darkMode }) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleEnter = (e) => {
      if (e.key === 'Enter' && isOpen && e.ctrlKey) {
        onDownload();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleEnter);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleEnter);
    };
  }, [isOpen, onClose, onDownload]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle both single file and array of files
  const files = Array.isArray(result) ? result : [result];
  const isMultipleFiles = files.length > 1;

  // Calculate total size
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get filename(s)
  const getFilename = () => {
    if (isMultipleFiles) {
      return `${files.length} files`;
    }
    return files[0].name;
  };

  // Render appropriate preview component
  const renderPreview = () => {
    switch (fileType) {
      case 'pdf':
        // For multiple PDFs (e.g., split result), show the first one
        // In the future, we could enhance this to show a gallery
        return <PDFPreview blob={files[0].blob} darkMode={darkMode} />;

      case 'image':
        return <ImagePreview files={files} darkMode={darkMode} />;

      case 'word':
        return <WordPreview blob={files[0].blob} darkMode={darkMode} />;

      default:
        return (
          <div className="flex items-center justify-center p-8">
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              <p className="mb-2">Preview not available for this file type.</p>
              <p className="text-sm">Click Download to save the file.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full h-full max-w-7xl max-h-screen m-4 flex flex-col rounded-lg shadow-2xl overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="flex-1 min-w-0">
            <h2 className={`text-lg font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Preview: {getFilename()}
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatSize(totalSize)}
              {isMultipleFiles && ` • ${files.length} files`}
            </p>
          </div>

          <button
            onClick={onClose}
            className={`ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Close preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'
        }`}>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Press <kbd className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>ESC</kbd> to close
            {' • '}
            <kbd className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl+Enter</kbd> to download
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Close
            </button>

            <button
              onClick={onDownload}
              className="px-6 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download{isMultipleFiles ? ` All (${files.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
