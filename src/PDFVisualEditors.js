import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Check, X, ZoomIn, ZoomOut, Trash2, GripVertical, Upload } from 'lucide-react';

// Visual Rotate Tool Component
export function RotateEditor({ file, onComplete, onCancel, darkMode }) {
  const [pdfPages, setPdfPages] = useState([]);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (pdfPages.length > 0) {
      renderPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRotation, pdfPages]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      // Load first page for preview
      const page = await pdf.getPage(1);
      setPdfPages([page]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const renderPreview = async () => {
    if (pdfPages.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const page = pdfPages[0];

    // Calculate available height (viewport height minus header, footer, padding)
    // This ensures buttons are always visible
    const maxHeight = window.innerHeight * 0.5; // Max 50% of viewport height
    const maxWidth = 600; // Max width for preview

    // Get base viewport to calculate proper scaling
    const baseViewport = page.getViewport({ scale: 1, rotation: currentRotation });

    // Calculate scale to fit within constraints
    const scaleWidth = maxWidth / baseViewport.width;
    const scaleHeight = maxHeight / baseViewport.height;
    const scale = Math.min(scaleWidth, scaleHeight, 1.2); // Cap at 1.2x

    const viewport = page.getViewport({ scale, rotation: currentRotation });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
  };

  const rotate = () => {
    setCurrentRotation((prev) => (prev + 90) % 360);
  };

  const handleApply = () => {
    onComplete(currentRotation);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}>
      <div className={`max-w-4xl w-full mx-4 rounded-xl shadow-2xl overflow-visible ${darkMode ? 'bg-[#1E1E2E]' : 'bg-white'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Rotate PDF
            </h3>
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
            >
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className={`p-6 ${darkMode ? 'bg-[#151521]' : 'bg-gray-50'}`}>
          <div className="flex flex-col items-center space-y-6">
            {/* Canvas Preview */}
            <div className={`relative border-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden bg-gray-100`} style={{ maxHeight: '50vh' }}>
              {loading ? (
                <div className="w-96 h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <>
                  <canvas ref={canvasRef} className="max-w-full h-auto" style={{ maxHeight: '50vh' }} />
                  {/* Rotate Button Overlay */}
                  <button
                    onClick={rotate}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-6 shadow-lg transition-all hover:scale-110"
                  >
                    <RotateCw className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>

            {/* Rotation Info */}
            <div className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p className="text-lg font-semibold">Current Rotation: {currentRotation}°</p>
              <p className="text-sm mt-1">Click the rotate button to rotate 90° clockwise</p>
            </div>

            {/* Quick Rotation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentRotation(90)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentRotation === 90
                    ? 'bg-purple-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                90°
              </button>
              <button
                onClick={() => setCurrentRotation(180)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentRotation === 180
                    ? 'bg-purple-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                180°
              </button>
              <button
                onClick={() => setCurrentRotation(270)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentRotation === 270
                    ? 'bg-purple-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                270°
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}
          style={{ position: 'relative', zIndex: 50 }}
        >
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Apply Rotation</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Visual Crop Tool Component
export function CropEditor({ file, onComplete, onCancel, darkMode }) {
  const [pdfPage, setPdfPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cropArea, setCropArea] = useState({ top: 50, right: 50, bottom: 50, left: 50 });
  const [dragging, setDragging] = useState(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    loadPDF();
    return () => {
      // Cleanup
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Render PDF when page loads or scale changes
  useEffect(() => {
    if (pdfPage && containerRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        renderPDF();
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfPage, scale]);

  // Render crop overlay when crop area or dimensions change
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      drawCropOverlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropArea, dimensions]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      setPdfPage(page);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const renderPDF = async () => {
    if (!pdfPage || !canvasRef.current || !containerRef.current) return;

    try {
      // Cancel any existing render task
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
        renderTaskRef.current = null;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { alpha: false });
      const container = containerRef.current;

      // Ensure container has rendered
      const containerWidth = Math.max(container.clientWidth || 800, 400) - 40;
      const maxHeight = Math.max(window.innerHeight * 0.6, 400);

      // Get base viewport at scale 1 with no rotation
      const baseViewport = pdfPage.getViewport({ scale: 1, rotation: 0 });

      // Calculate scale to fit within container
      const scaleX = containerWidth / baseViewport.width;
      const scaleY = maxHeight / baseViewport.height;
      const optimalScale = Math.min(scaleX, scaleY, 1.5);

      // Apply user's zoom
      const finalScale = optimalScale * scale;

      // Get final viewport
      const viewport = pdfPage.getViewport({ scale: finalScale, rotation: 0 });

      // Set canvas size
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Set canvas display size to match actual size (prevents scaling issues)
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Update dimensions
      setDimensions({ width: viewport.width, height: viewport.height });

      // Clear and fill white background
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Render PDF
      renderTaskRef.current = pdfPage.render({
        canvasContext: context,
        viewport: viewport
      });

      await renderTaskRef.current.promise;
      renderTaskRef.current = null;

      // Draw overlay
      setTimeout(() => drawCropOverlay(), 0);

    } catch (error) {
      if (error && error.name !== 'RenderingCancelledException') {
        console.error('Error rendering PDF:', error);
      }
    }
  };

  // Draws crop overlay only (not PDF) - called when crop area changes
  const drawCropOverlay = () => {
    if (!overlayRef.current || dimensions.width === 0) return;

    const overlay = overlayRef.current;
    const ctx = overlay.getContext('2d');

    // Match canvas dimensions
    overlay.width = dimensions.width;
    overlay.height = dimensions.height;

    // Clear overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

    // Top overlay
    ctx.fillRect(0, 0, overlay.width, cropArea.top);
    // Bottom overlay
    ctx.fillRect(0, overlay.height - cropArea.bottom, overlay.width, cropArea.bottom);
    // Left overlay
    ctx.fillRect(0, cropArea.top, cropArea.left, overlay.height - cropArea.top - cropArea.bottom);
    // Right overlay
    ctx.fillRect(overlay.width - cropArea.right, cropArea.top, cropArea.right, overlay.height - cropArea.top - cropArea.bottom);

    // Draw crop lines
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      cropArea.left,
      cropArea.top,
      overlay.width - cropArea.left - cropArea.right,
      overlay.height - cropArea.top - cropArea.bottom
    );
  };

  const handleMouseDown = (e, edge) => {
    setDragging(edge);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e) => {
    if (!dragging || !canvasRef.current) return;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule update on next frame for smooth 60fps updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert screen coordinates to canvas coordinates
      const scaleX = dimensions.width / rect.width;
      const scaleY = dimensions.height / rect.height;
      const canvasX = x * scaleX;
      const canvasY = y * scaleY;

      setCropArea(prev => {
        const newArea = { ...prev };

        switch (dragging) {
          case 'top':
            newArea.top = Math.max(0, Math.min(canvasY, dimensions.height - prev.bottom - 50));
            break;
          case 'bottom':
            newArea.bottom = Math.max(0, Math.min(dimensions.height - canvasY, dimensions.height - prev.top - 50));
            break;
          case 'left':
            newArea.left = Math.max(0, Math.min(canvasX, dimensions.width - prev.right - 50));
            break;
          case 'right':
            newArea.right = Math.max(0, Math.min(dimensions.width - canvasX, dimensions.width - prev.left - 50));
            break;
          default:
            break;
        }

        return newArea;
      });
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
    // Clean up animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleApply = () => {
    // Convert canvas coordinates to PDF points for cropping
    const baseViewport = pdfPage.getViewport({ scale: 1 });
    const scaleRatio = baseViewport.width / dimensions.width;

    const margins = {
      top: Math.round(cropArea.top * scaleRatio),
      right: Math.round(cropArea.right * scaleRatio),
      bottom: Math.round(cropArea.bottom * scaleRatio),
      left: Math.round(cropArea.left * scaleRatio)
    };

    onComplete(margins);
  };

  const resetCrop = () => {
    setCropArea({ top: 50, right: 50, bottom: 50, left: 50 });
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}>
      <div className={`max-w-6xl w-full mx-4 rounded-xl shadow-2xl ${darkMode ? 'bg-[#1E1E2E]' : 'bg-white'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Crop PDF
            </h3>
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
            >
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className={`p-6 ${darkMode ? 'bg-[#151521]' : 'bg-gray-50'}`}>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full max-w-4xl">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Drag the edges or corners to adjust the crop area
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomOut}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  title="Zoom Out"
                >
                  <ZoomOut className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                </button>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  title="Zoom In"
                >
                  <ZoomIn className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                </button>
              </div>
            </div>

            {/* Canvas Preview with Crop Handles */}
            <div
              ref={containerRef}
              className="relative w-full max-w-4xl flex justify-center overflow-auto max-h-[60vh] border-2 border-gray-300 rounded bg-gray-100"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: dragging ? 'grabbing' : 'default' }}
            >
              {loading ? (
                <div className="w-96 h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <div className="relative inline-block m-4">
                  {/* PDF Canvas - rendered once */}
                  <canvas ref={canvasRef} className="border-2 border-gray-300 rounded shadow-lg" />

                  {/* Overlay Canvas - redrawn on crop changes for smooth performance */}
                  <canvas
                    ref={overlayRef}
                    className="absolute top-0 left-0 pointer-events-none border-2 border-transparent"
                    style={{ width: '100%', height: '100%' }}
                  />

                  {/* Crop Handles - Positioned relative to canvas display size */}
                  {dimensions.width > 0 && canvasRef.current && (
                    <>
                      {/* Calculate display dimensions */}
                      {(() => {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const displayScaleX = rect.width / dimensions.width;
                        const displayScaleY = rect.height / dimensions.height;

                        return (
                          <>
                            {/* Top Handle - Centered on crop line */}
                            <div
                              className="absolute left-0 right-0 h-8 cursor-ns-resize"
                              style={{
                                top: `${cropArea.top * displayScaleY - 16}px`,
                              }}
                              onMouseDown={(e) => handleMouseDown(e, 'top')}
                            />

                            {/* Bottom Handle - Centered on crop line */}
                            <div
                              className="absolute left-0 right-0 h-8 cursor-ns-resize"
                              style={{
                                top: `${rect.height - cropArea.bottom * displayScaleY - 16}px`,
                              }}
                              onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                            />

                            {/* Left Handle - Centered on crop line */}
                            <div
                              className="absolute top-0 bottom-0 w-8 cursor-ew-resize"
                              style={{
                                left: `${cropArea.left * displayScaleX - 16}px`,
                              }}
                              onMouseDown={(e) => handleMouseDown(e, 'left')}
                            />

                            {/* Right Handle - Centered on crop line */}
                            <div
                              className="absolute top-0 bottom-0 w-8 cursor-ew-resize"
                              style={{
                                left: `${rect.width - cropArea.right * displayScaleX - 16}px`,
                              }}
                              onMouseDown={(e) => handleMouseDown(e, 'right')}
                            />

                            {/* Corner Indicators */}
                            {/* Top-left corner */}
                            <div
                              className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full pointer-events-none"
                              style={{
                                left: `${cropArea.left * displayScaleX - 6}px`,
                                top: `${cropArea.top * displayScaleY - 6}px`
                              }}
                            />
                            {/* Top-right corner */}
                            <div
                              className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full pointer-events-none"
                              style={{
                                left: `${rect.width - cropArea.right * displayScaleX - 6}px`,
                                top: `${cropArea.top * displayScaleY - 6}px`
                              }}
                            />
                            {/* Bottom-left corner */}
                            <div
                              className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full pointer-events-none"
                              style={{
                                left: `${cropArea.left * displayScaleX - 6}px`,
                                top: `${rect.height - cropArea.bottom * displayScaleY - 6}px`
                              }}
                            />
                            {/* Bottom-right corner */}
                            <div
                              className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full pointer-events-none"
                              style={{
                                left: `${rect.width - cropArea.right * displayScaleX - 6}px`,
                                top: `${rect.height - cropArea.bottom * displayScaleY - 6}px`
                              }}
                            />
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Crop Info and Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-4xl gap-4">
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} grid grid-cols-4 gap-4`}>
                <div>Top: {Math.round(cropArea.top)}px</div>
                <div>Right: {Math.round(cropArea.right)}px</div>
                <div>Bottom: {Math.round(cropArea.bottom)}px</div>
                <div>Left: {Math.round(cropArea.left)}px</div>
              </div>

              <button
                onClick={resetCrop}
                className={`px-4 py-2 rounded-lg font-medium ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reset Crop
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Visual Organize Pages Tool - Drag & Drop Thumbnails
export function OrganizePagesEditor({ file, onComplete, onCancel, darkMode }) {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const canvasRefs = useRef([]);

  useEffect(() => {
    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const loadedPages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        loadedPages.push({ page, originalIndex: i, id: `page-${i}` });
      }

      setPages(loadedPages);
      setLoading(false);

      // Render thumbnails after pages load
      setTimeout(() => renderThumbnails(loadedPages), 100);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const renderThumbnails = async (pagesToRender) => {
    for (let i = 0; i < pagesToRender.length; i++) {
      const canvas = canvasRefs.current[i];
      if (!canvas) continue;

      const context = canvas.getContext('2d');
      const page = pagesToRender[i].page;
      const scale = 0.5;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    }
  };

  const handleDragStart = (index) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;

    const newPages = [...pages];
    const draggedPage = newPages[draggingIndex];
    newPages.splice(draggingIndex, 1);
    newPages.splice(index, 0, draggedPage);

    setPages(newPages);
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  const deletePage = (index) => {
    if (pages.length === 1) {
      alert('Cannot delete the last page!');
      return;
    }
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    setTimeout(() => renderThumbnails(newPages), 100);
  };

  const handleApply = () => {
    const pageOrder = pages.map(p => p.originalIndex);
    onComplete(pageOrder);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}>
      <div className={`max-w-6xl w-full mx-4 max-h-[90vh] rounded-xl shadow-2xl ${darkMode ? 'bg-[#1E1E2E]' : 'bg-white'} flex flex-col`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Organize Pages
            </h3>
            <button onClick={onCancel} className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}>
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        <div className={`p-6 overflow-y-auto flex-1 ${darkMode ? 'bg-[#151521]' : 'bg-gray-50'}`}>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Drag pages to reorder them or click the trash icon to delete
          </p>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pages.map((pageData, index) => (
                <div
                  key={pageData.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-move border-2 rounded-lg p-2 transition-all ${
                    draggingIndex === index
                      ? 'border-purple-500 shadow-lg opacity-50'
                      : darkMode
                      ? 'border-gray-700 hover:border-purple-500'
                      : 'border-gray-300 hover:border-purple-500'
                  } ${darkMode ? 'bg-[#1E1E2E]' : 'bg-white'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Page {index + 1}
                    </span>
                    <div className="flex items-center space-x-1">
                      <GripVertical className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <button
                        onClick={() => deletePage(index)}
                        className="p-1 rounded hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <canvas
                    ref={el => canvasRefs.current[index] = el}
                    className="w-full h-auto border border-gray-300 rounded"
                  />
                  <p className={`text-xs mt-1 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Original: {pageData.originalIndex}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Visual Extract/Delete Pages Tool - Checkbox Selection
export function ExtractDeletePagesEditor({ file, onComplete, onCancel, darkMode, mode = 'extract' }) {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const canvasRefs = useRef([]);

  useEffect(() => {
    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const loadedPages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        loadedPages.push({ page, pageNum: i });
      }

      setPages(loadedPages);
      setLoading(false);

      setTimeout(() => renderThumbnails(loadedPages), 100);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const renderThumbnails = async (pagesToRender) => {
    for (let i = 0; i < pagesToRender.length; i++) {
      const canvas = canvasRefs.current[i];
      if (!canvas) continue;

      const context = canvas.getContext('2d');
      const page = pagesToRender[i].page;
      const scale = 0.5;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    }
  };

  const togglePage = (pageNum) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }
    setSelectedPages(newSelected);
  };

  const selectAll = () => {
    const allPages = new Set(pages.map(p => p.pageNum));
    setSelectedPages(allPages);
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleApply = () => {
    if (selectedPages.size === 0) {
      alert('Please select at least one page!');
      return;
    }
    const pageArray = Array.from(selectedPages).sort((a, b) => a - b);
    onComplete(pageArray);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}>
      <div className={`max-w-6xl w-full mx-4 max-h-[90vh] rounded-xl shadow-2xl ${darkMode ? 'bg-[#1E1E2E]' : 'bg-white'} flex flex-col`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {mode === 'extract' ? 'Extract Pages' : 'Delete Pages'}
            </h3>
            <button onClick={onCancel} className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}>
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        <div className={`p-6 overflow-y-auto flex-1 ${darkMode ? 'bg-[#151521]' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Click pages to {mode === 'extract' ? 'extract' : 'delete'} them ({selectedPages.size} selected)
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className={`px-3 py-1 text-sm rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className={`px-3 py-1 text-sm rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Deselect All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pages.map((pageData, index) => {
                const isSelected = selectedPages.has(pageData.pageNum);
                return (
                  <div
                    key={pageData.pageNum}
                    onClick={() => togglePage(pageData.pageNum)}
                    className={`relative cursor-pointer border-2 rounded-lg p-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 shadow-lg ring-2 ring-purple-500 ring-opacity-50'
                        : darkMode
                        ? 'border-gray-700 hover:border-purple-400'
                        : 'border-gray-300 hover:border-purple-400'
                    } ${darkMode ? 'bg-[#1E1E2E]' : 'bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Page {pageData.pageNum}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <canvas
                      ref={el => canvasRefs.current[index] = el}
                      className="w-full h-auto border border-gray-300 rounded"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={selectedPages.size === 0}
            className={`px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 ${
              selectedPages.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Check className="w-5 h-5" />
            <span>{mode === 'extract' ? 'Extract Selected' : 'Delete Selected'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Resize Editor Component
export function ResizeEditor({ file, onApply, onCancel, darkMode }) {
  const [pages, setPages] = useState([]);
  const [selectedSize, setSelectedSize] = useState('A4');
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  const pageSizes = [
    { name: 'A4', width: 595, height: 842, label: 'A4 (210 × 297 mm)' },
    { name: 'Letter', width: 612, height: 792, label: 'Letter (8.5 × 11 in)' },
    { name: 'Legal', width: 612, height: 1008, label: 'Legal (8.5 × 14 in)' },
    { name: 'A3', width: 842, height: 1191, label: 'A3 (297 × 420 mm)' },
    { name: 'A5', width: 420, height: 595, label: 'A5 (148 × 210 mm)' },
    { name: 'Tabloid', width: 792, height: 1224, label: 'Tabloid (11 × 17 in)' },
  ];

  useEffect(() => {
    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (pages.length > 0) {
      renderPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, selectedSize]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const loadedPages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        loadedPages.push(page);
      }

      setPages(loadedPages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const renderPreview = async () => {
    if (!canvasRef.current || pages.length === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const page = pages[0]; // Show first page as preview

    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(300 / viewport.width, 400 / viewport.height);
    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvasContext: context,
      viewport: scaledViewport
    }).promise;

    // Draw size indicator overlay
    const selectedSizeObj = pageSizes.find(s => s.name === selectedSize);
    if (selectedSizeObj) {
      context.strokeStyle = '#a855f7';
      context.lineWidth = 3;
      context.strokeRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = 'rgba(168, 85, 247, 0.1)';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleApply = () => {
    const selectedSizeObj = pageSizes.find(s => s.name === selectedSize);
    onApply({ pageSize: selectedSizeObj });
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Resize PDF Pages
          </h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Select the new page size for your PDF
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview Section */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Preview (Page 1)
                </h3>
                <div className={`border-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900`}>
                  <canvas ref={canvasRef} className="max-w-full h-auto" />
                </div>
                <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Selected: {pageSizes.find(s => s.name === selectedSize)?.label}
                </p>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Select Page Size
                </h3>
                <div className="space-y-2">
                  {pageSizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size.name)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedSize === size.name
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : darkMode
                          ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-semibold ${selectedSize === size.name ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                            {size.label}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {size.width} × {size.height} pt
                          </div>
                        </div>
                        {selectedSize === size.name && (
                          <Check className="w-5 h-5 text-purple-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Apply Resize</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Page Numbers Editor Component
export function AddPageNumbersEditor({ file, onApply, onCancel, darkMode }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState('number'); // 'number', 'page-of-total', 'roman'
  const [fontSize, setFontSize] = useState(12);
  const canvasRef = useRef(null);

  const positions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ];

  const formats = [
    { value: 'number', label: 'Number (1, 2, 3...)' },
    { value: 'page-of-total', label: 'Page X of Y' },
    { value: 'roman', label: 'Roman (I, II, III...)' },
  ];

  useEffect(() => {
    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (pages.length > 0) {
      renderPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, position, startNumber, format, fontSize]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const loadedPages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        loadedPages.push(page);
      }

      setPages(loadedPages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const formatPageNumber = (pageNum, totalPages) => {
    switch (format) {
      case 'page-of-total':
        return `Page ${pageNum} of ${totalPages}`;
      case 'roman':
        return toRoman(pageNum);
      default:
        return pageNum.toString();
    }
  };

  const toRoman = (num) => {
    const romanNumerals = [
      ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
      ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
      ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];
    let result = '';
    for (const [roman, value] of romanNumerals) {
      while (num >= value) {
        result += roman;
        num -= value;
      }
    }
    return result;
  };

  const renderPreview = async () => {
    if (!canvasRef.current || pages.length === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const page = pages[0]; // Show first page as preview

    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(300 / viewport.width, 400 / viewport.height);
    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvasContext: context,
      viewport: scaledViewport
    }).promise;

    // Draw page number preview
    const pageNumber = formatPageNumber(startNumber, pages.length);
    context.font = `${fontSize * scale}px Arial`;
    context.fillStyle = '#000000';
    context.textBaseline = 'top';

    const textMetrics = context.measureText(pageNumber);
    const textWidth = textMetrics.width;
    const textHeight = fontSize * scale;
    const margin = 20 * scale;

    let x, y;

    // Position calculation
    if (position.includes('left')) {
      x = margin;
    } else if (position.includes('center')) {
      x = (canvas.width - textWidth) / 2;
    } else { // right
      x = canvas.width - textWidth - margin;
    }

    if (position.includes('top')) {
      y = margin;
    } else { // bottom
      y = canvas.height - textHeight - margin;
    }

    // Draw background for visibility
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(x - 5, y - 5, textWidth + 10, textHeight + 10);

    // Draw page number
    context.fillStyle = '#000000';
    context.fillText(pageNumber, x, y);
  };

  const handleApply = () => {
    onApply({
      position,
      startNumber,
      format,
      fontSize
    });
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Add Page Numbers
          </h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure page numbering for your PDF
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview Section */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Preview (Page 1)
                </h3>
                <div className={`border-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900`}>
                  <canvas ref={canvasRef} className="max-w-full h-auto" />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {positions.map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => setPosition(pos.value)}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          position === pos.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : darkMode
                            ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Format
                  </label>
                  <div className="space-y-2">
                    {formats.map((fmt) => (
                      <button
                        key={fmt.value}
                        onClick={() => setFormat(fmt.value)}
                        className={`w-full p-3 rounded-lg border-2 text-sm text-left transition-all ${
                          format === fmt.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : darkMode
                            ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Start Number: {startNumber}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Font Size: {fontSize}pt
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Add Page Numbers</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Watermark Editor Component
export function WatermarkEditor({ file, onApply, onCancel, darkMode }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watermarkType, setWatermarkType] = useState('text'); // 'text' or 'image'
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState('#FF0000');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoSize, setLogoSize] = useState(100); // Logo size in points
  const canvasRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (pages.length > 0) {
      renderPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, watermarkType, text, opacity, fontSize, rotation, color, logoPreview, logoSize]);

  const handleLogoUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setLogoFile(selectedFile);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      alert('Please select a valid image file (PNG, JPG, etc.)');
    }
  };

  const loadPDF = async () => {
    try {
      setLoading(true);
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const loadedPages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        loadedPages.push(page);
      }

      setPages(loadedPages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const renderPreview = async () => {
    if (!canvasRef.current || pages.length === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const page = pages[0]; // Show first page as preview

    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(400 / viewport.width, 500 / viewport.height);
    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvasContext: context,
      viewport: scaledViewport
    }).promise;

    // Draw watermark
    context.save();
    context.globalAlpha = opacity;
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((rotation * Math.PI) / 180);

    if (watermarkType === 'text') {
      // Draw text watermark
      context.font = `bold ${fontSize * scale}px Arial`;
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 0, 0);
    } else if (watermarkType === 'image' && logoPreview) {
      // Draw image watermark
      const img = new Image();
      img.src = logoPreview;
      await new Promise((resolve) => {
        img.onload = () => {
          const scaledLogoSize = logoSize * scale;
          context.drawImage(
            img,
            -scaledLogoSize / 2,
            -scaledLogoSize / 2,
            scaledLogoSize,
            scaledLogoSize
          );
          resolve();
        };
      });
    }

    context.restore();
  };

  const handleApply = () => {
    onApply({
      watermarkType,
      text,
      opacity,
      fontSize,
      rotation,
      color,
      logoFile,
      logoPreview,
      logoSize
    });
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Add Watermark
          </h2>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Add custom watermark to your PDF pages
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview Section */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Preview (Page 1)
                </h3>
                <div className={`border-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900`}>
                  <canvas ref={canvasRef} className="max-w-full h-auto" />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                {/* Watermark Type Selector */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Watermark Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWatermarkType('text')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        watermarkType === 'text'
                          ? 'bg-purple-500 text-white'
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setWatermarkType('image')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        watermarkType === 'image'
                          ? 'bg-purple-500 text-white'
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Logo/Image
                    </button>
                  </div>
                </div>

                {/* Text Watermark Settings */}
                {watermarkType === 'text' && (
                  <>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter watermark text"
                        className={`w-full px-4 py-2 rounded-lg border-2 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:border-purple-500 focus:outline-none`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Font Size: {fontSize}pt
                      </label>
                      <input
                        type="range"
                        min="24"
                        max="96"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:border-purple-500 focus:outline-none`}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Logo Watermark Settings */}
                {watermarkType === 'image' && (
                  <>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Upload Company Logo
                      </label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className={`w-full px-4 py-3 rounded-lg border-2 border-dashed ${
                          darkMode
                            ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        } transition-colors flex items-center justify-center space-x-2`}
                      >
                        <Upload className="w-5 h-5" />
                        <span>{logoFile ? logoFile.name : 'Click to upload logo'}</span>
                      </button>
                      {logoPreview && (
                        <div className="mt-2 flex justify-center">
                          <img src={logoPreview} alt="Logo preview" className="max-w-[100px] max-h-[100px] rounded border-2 border-purple-500" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Logo Size: {logoSize}pt
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="300"
                        value={logoSize}
                        onChange={(e) => setLogoSize(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {/* Common Settings (apply to both text and image) */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Opacity: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Rotation: {rotation}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Quick presets for text watermarks */}
                {watermarkType === 'text' && (
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Quick presets:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => setText('CONFIDENTIAL')}
                      className="px-3 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600"
                    >
                      Confidential
                    </button>
                    <button
                      onClick={() => setText('DRAFT')}
                      className="px-3 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600"
                    >
                      Draft
                    </button>
                    <button
                      onClick={() => setText('COPY')}
                      className="px-3 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          <button
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg font-medium ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Add Watermark</span>
          </button>
        </div>
      </div>
    </div>
  );
}
