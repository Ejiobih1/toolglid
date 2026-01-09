import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const PDFPreview = ({ blob, darkMode }) => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [showAllPages, setShowAllPages] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Load PDF
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const arrayBuffer = await blob.arrayBuffer();
        const loadedPdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error('PDF preview load error:', err);
        setError('Failed to load PDF preview');
        setLoading(false);
      }
    };

    if (blob) {
      loadPDF();
    }
  }, [blob]);

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (err) {
        console.error('PDF page render error:', err);
        setError('Failed to render PDF page');
      }
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  // Render all pages
  const renderAllPages = async () => {
    if (!pdf || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = ''; // Clear existing content

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.8 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = `mb-4 border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded`;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'mb-4';

        const pageLabel = document.createElement('div');
        pageLabel.className = `text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`;
        pageLabel.textContent = `Page ${pageNum} of ${totalPages}`;

        pageWrapper.appendChild(pageLabel);
        pageWrapper.appendChild(canvas);
        container.appendChild(pageWrapper);
      } catch (err) {
        console.error(`Failed to render page ${pageNum}:`, err);
      }
    }
  };

  useEffect(() => {
    if (showAllPages && pdf) {
      renderAllPages();
    }
  }, [showAllPages, pdf, darkMode]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading PDF preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
          <p>{error}</p>
          <p className="text-sm mt-2">You can still download the file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className="flex items-center space-x-4">
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {showAllPages ? (
              <span>{totalPages} pages</span>
            ) : (
              <span>Page {currentPage} of {totalPages}</span>
            )}
          </div>

          {!showAllPages && totalPages > 1 && (
            <div className="flex space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-300 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-300 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!showAllPages && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className={`px-3 py-1 rounded ${
                  scale <= 0.5
                    ? 'bg-gray-300 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                -
              </button>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3.0}
                className={`px-3 py-1 rounded ${
                  scale >= 3.0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                +
              </button>
            </>
          )}

          {totalPages > 1 && (
            <button
              onClick={() => setShowAllPages(!showAllPages)}
              className={`px-3 py-1 rounded ml-2 ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showAllPages ? 'Show Single Page' : 'View All Pages'}
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        {showAllPages ? (
          <div ref={containerRef} className="w-full max-w-3xl"></div>
        ) : (
          <canvas
            ref={canvasRef}
            className={`border ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded shadow-lg`}
          />
        )}
      </div>
    </div>
  );
};

export default PDFPreview;
