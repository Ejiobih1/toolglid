import React, { useState, useEffect, useMemo } from 'react';

const ImagePreview = ({ files, darkMode }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Convert blobs to URLs
  const imageUrls = useMemo(() => {
    if (!files) return [];

    const filesArray = Array.isArray(files) ? files : [files];
    return filesArray.map(file => ({
      url: URL.createObjectURL(file.blob),
      name: file.name,
      size: file.size
    }));
  }, [files]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      imageUrls.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [imageUrls]);

  // Get image dimensions
  const handleImageLoad = (e) => {
    setImageDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleZoomReset = () => setZoom(1.0);

  const handlePrev = () => {
    setSelectedIndex(prev => Math.max(prev - 1, 0));
    setZoom(1.0);
  };

  const handleNext = () => {
    setSelectedIndex(prev => Math.min(prev + 1, imageUrls.length - 1));
    setZoom(1.0);
  };

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No images to preview</p>
      </div>
    );
  }

  const currentImage = imageUrls[selectedIndex];
  const isMultiple = imageUrls.length > 1;

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className="flex items-center space-x-4">
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isMultiple ? (
              <span>Image {selectedIndex + 1} of {imageUrls.length}</span>
            ) : (
              <span>1 image</span>
            )}
          </div>

          {imageDimensions.width > 0 && (
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {imageDimensions.width} × {imageDimensions.height} px
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className={`px-3 py-1 rounded ${
              zoom <= 0.5
                ? 'bg-gray-300 cursor-not-allowed'
                : darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            -
          </button>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3.0}
            className={`px-3 py-1 rounded ${
              zoom >= 3.0
                ? 'bg-gray-300 cursor-not-allowed'
                : darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className={`px-3 py-1 rounded ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="relative">
          {isMultiple && (
            <>
              <button
                onClick={handlePrev}
                disabled={selectedIndex === 0}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg z-10 ${
                  selectedIndex === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={handleNext}
                disabled={selectedIndex === imageUrls.length - 1}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg z-10 ${
                  selectedIndex === imageUrls.length - 1
                    ? 'bg-gray-300 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <img
            src={currentImage.url}
            alt={currentImage.name}
            onLoad={handleImageLoad}
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease-in-out',
              maxWidth: '100%',
              maxHeight: '70vh'
            }}
            className="rounded shadow-2xl"
          />
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {isMultiple && (
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
          <div className="flex overflow-x-auto space-x-2 pb-2">
            {imageUrls.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedIndex(idx);
                  setZoom(1.0);
                }}
                className={`flex-shrink-0 relative ${
                  idx === selectedIndex
                    ? 'ring-4 ring-blue-500'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-20 w-20 object-cover rounded"
                />
                <div className={`absolute bottom-0 left-0 right-0 text-xs text-center py-1 ${
                  darkMode ? 'bg-gray-900/80 text-white' : 'bg-white/80 text-gray-900'
                }`}>
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Info */}
      <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
          {currentImage.name}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
