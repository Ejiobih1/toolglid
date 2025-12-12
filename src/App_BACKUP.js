import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Lock, Clock, Play, FileText, Scissors, Minimize2, Image, FileImage, Type, Shield, RotateCw, Crown, X, Upload, Download, AlertCircle, CheckCircle, Loader, Hash, Trash2, FileDown, FileEdit, PenTool, Crop, Maximize2, Layers, AlignCenter, ArrowUpDown } from 'lucide-react';
import {
  mergePDFs,
  splitPDF,
  compressPDF,
  pdfToJPG,
  jpgToPDF,
  pdfToWord,
  wordToPDF,
  rotatePDF,
  protectPDF,
  pdfToPNG,
  addPageNumbers,
  extractPages,
  deletePages,
  extractText,
  addSignature,
  editMetadata,
  extractImages,
  cropPDF,
  resizePDF,
  flattenPDF,
  addHeaderFooter,
  organizePages,
  getFileSizeMB
} from './pdfUtils';
import { RotateEditor, CropEditor, OrganizePagesEditor, ExtractDeletePagesEditor, ResizeEditor, AddPageNumbersEditor, WatermarkEditor } from './PDFVisualEditors';
import AdminPage from './AdminPage';

export default function PDFToolsApp() {
  // Check if on admin page
  const [showAdminPage, setShowAdminPage] = useState(false);

  // Check URL for admin route
  useEffect(() => {
    const checkAdminRoute = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#/admin') {
        setShowAdminPage(true);
      }
    };
    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    return () => window.removeEventListener('popstate', checkAdminRoute);
  }, []);
  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);

  // YouTube Player State
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [videoWatchProgress, setVideoWatchProgress] = useState(0);
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [lastKnownTime, setLastKnownTime] = useState(0);
  const [hasSkipped, setHasSkipped] = useState(false);
  const playerRef = useRef(null);

  // Refs to track latest values for event handlers
  const progressRef = useRef(0);
  const skippedRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    progressRef.current = videoWatchProgress;
    skippedRef.current = hasSkipped;
  }, [videoWatchProgress, hasSkipped]);

  // Visual Editors State
  const [showRotateEditor, setShowRotateEditor] = useState(false);
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [showOrganizePagesEditor, setShowOrganizePagesEditor] = useState(false);
  const [showExtractPagesEditor, setShowExtractPagesEditor] = useState(false);
  const [showDeletePagesEditor, setShowDeletePagesEditor] = useState(false);
  const [showResizeEditor, setShowResizeEditor] = useState(false);
  const [showPageNumbersEditor, setShowPageNumbersEditor] = useState(false);
  const [showWatermarkEditor, setShowWatermarkEditor] = useState(false);

  // Access State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  // File Processing State
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Reset premium/access for testing
  const handleResetAccess = () => {
    localStorage.removeItem('pdf_premium');
    localStorage.removeItem('pdf_access');
    setIsPremium(false);
    setIsUnlocked(false);
    setTimeRemaining(0);
    console.log('Access reset - Premium and unlock status cleared');
  };

  // Add keyboard shortcut for reset (Ctrl+Shift+R)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handleResetAccess();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Configuration - Load videos from admin page (localStorage)
  const [videos, setVideos] = useState([]);

  // Load videos from admin configuration
  useEffect(() => {
    const loadVideos = () => {
      const savedVideos = localStorage.getItem('admin_videos');
      if (savedVideos) {
        setVideos(JSON.parse(savedVideos));
      } else {
        // Default videos if admin hasn't configured any yet
        const defaultVideos = [
          { id: 'VIDEO_ID_3MIN', title: 'Military Technology Overview', duration: 3, accessHours: 1 },
          { id: 'VIDEO_ID_5MIN', title: 'Advanced Weapons Systems', duration: 5, accessHours: 3 },
          { id: 'VIDEO_ID_10MIN', title: 'Future of Defense Tech', duration: 10, accessHours: 12 },
          { id: 'VIDEO_ID_15MIN', title: 'Aircraft Carrier Technology', duration: 15, accessHours: 24 },
        ];
        setVideos(defaultVideos);
      }
    };

    loadVideos();

    // Listen for storage changes (when admin updates videos)
    const handleStorageChange = (e) => {
      if (e.key === 'admin_videos') {
        loadVideos();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const tools = [
    // ========== LAUNCH VERSION - TESTED TOOLS ONLY ==========

    // Core Tools (TESTED & WORKING)
    { id: 'merge', icon: FileText, name: 'Merge PDF', desc: 'Combine multiple PDFs into one document', accept: '.pdf', multiple: true },
    { id: 'split', icon: Scissors, name: 'Split PDF', desc: 'Extract pages or split into multiple files', accept: '.pdf', multiple: false },
    { id: 'compress', icon: Minimize2, name: 'Compress PDF', desc: 'Reduce file size while maintaining quality', accept: '.pdf', multiple: false },

    // Conversion Tools (TESTED & WORKING)
    { id: 'pdf-to-jpg', icon: Image, name: 'PDF to JPG', desc: 'Convert PDF pages to JPG images', accept: '.pdf', multiple: false },
    { id: 'pdf-to-png', icon: Image, name: 'PDF to PNG', desc: 'Convert PDF pages to PNG images', accept: '.pdf', multiple: false },
    { id: 'jpg-to-pdf', icon: FileImage, name: 'JPG to PDF', desc: 'Convert images to PDF documents', accept: 'image/*', multiple: true },
    { id: 'pdf-to-word', icon: Type, name: 'PDF to Word', desc: 'Convert PDF to Word document (.docx)', accept: '.pdf', multiple: false },
    // { id: 'word-to-pdf', icon: FileText, name: 'Word to PDF', desc: 'Convert Word documents to PDF (.docx format)', accept: '.docx,.txt', multiple: false }, // TODO: Test before enabling

    // Page Management (TESTED & WORKING)
    { id: 'organize-pages', icon: ArrowUpDown, name: 'Organize Pages', desc: 'Reorder, rearrange, or delete pages', accept: '.pdf', multiple: false },
    { id: 'rotate', icon: RotateCw, name: 'Rotate PDF', desc: 'Rotate pages by custom angles', accept: '.pdf', multiple: false },
    { id: 'extract-pages', icon: FileDown, name: 'Extract Pages', desc: 'Extract specific pages from PDF', accept: '.pdf', multiple: false },
    { id: 'delete-pages', icon: Trash2, name: 'Delete Pages', desc: 'Remove unwanted pages from PDF', accept: '.pdf', multiple: false },
    { id: 'crop', icon: Crop, name: 'Crop PDF', desc: 'Trim margins and resize pages', accept: '.pdf', multiple: false },
    { id: 'resize', icon: Maximize2, name: 'Resize PDF', desc: 'Change page size (A4, Letter, etc.)', accept: '.pdf', multiple: false },

    // ========== FEATURES TO ADD LATER (Post-Launch) ==========
    // Uncomment and test these one by one after launch

    // Editing Tools
    // { id: 'add-page-numbers', icon: Hash, name: 'Add Page Numbers', desc: 'Number pages automatically', accept: '.pdf', multiple: false },
    // { id: 'add-signature', icon: PenTool, name: 'Add Signature', desc: 'Sign documents with image signature', accept: '.pdf', multiple: false },
    // { id: 'protect', icon: Shield, name: 'Add Watermark', desc: 'Add custom watermark to prove ownership', accept: '.pdf', multiple: false },
    // { id: 'header-footer', icon: AlignCenter, name: 'Header & Footer', desc: 'Add headers and footers to pages', accept: '.pdf', multiple: false },

    // Advanced Tools
    // { id: 'extract-text', icon: Type, name: 'Extract Text', desc: 'Extract all text from PDF', accept: '.pdf', multiple: false },
    // { id: 'extract-images', icon: Image, name: 'Extract Images', desc: 'Extract all images from PDF', accept: '.pdf', multiple: false },
    // { id: 'edit-metadata', icon: FileEdit, name: 'Edit Metadata', desc: 'Edit PDF properties and info', accept: '.pdf', multiple: false },
    // { id: 'flatten', icon: Layers, name: 'Flatten PDF', desc: 'Make form fields non-editable', accept: '.pdf', multiple: false },
  ];

  // Initialize access state from localStorage
  useEffect(() => {
    const checkAccess = () => {
      try {
        // Check for premium status
        const premiumStatus = localStorage.getItem('pdf_premium');
        if (premiumStatus === 'true') {
          setIsPremium(true);
          setIsUnlocked(true);
          return;
        }

        // Check for video-based access
        const accessData = localStorage.getItem('pdf_access');
        if (accessData) {
          const { expiresAt } = JSON.parse(accessData);
          const now = Date.now();

          if (expiresAt > now) {
            setIsUnlocked(true);
            setTimeRemaining(Math.floor((expiresAt - now) / 1000));
          } else {
            localStorage.removeItem('pdf_access');
          }
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };

    checkAccess();
  }, []);

  // Countdown timer for video-based access
  useEffect(() => {
    if (isUnlocked && timeRemaining > 0 && !isPremium) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsUnlocked(false);
            localStorage.removeItem('pdf_access');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isUnlocked, timeRemaining, isPremium]);

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Handle video selection and watching
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setVideoWatchProgress(0);
    setVideoStartTime(0);
    setLastKnownTime(0);
    setHasSkipped(false);
  };

  // Initialize YouTube Player when video is selected
  useEffect(() => {
    if (!selectedVideo) return;

    // Clear any existing player first
    if (youtubePlayer) {
      try {
        youtubePlayer.destroy();
      } catch (e) {
        console.log('Error destroying player:', e);
      }
      setYoutubePlayer(null);
    }

    // Wait for playerRef to be ready and YT API to load
    let initAttempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    const initPlayer = () => {
      initAttempts++;

      const playerElement = document.getElementById('youtube-player');

      if (!playerElement) {
        if (initAttempts < maxAttempts) {
          setTimeout(initPlayer, 100);
        } else {
          console.error('Player element not found after max attempts');
          alert('Failed to initialize video player. Please close and try again.');
        }
        return;
      }

      if (!window.YT || !window.YT.Player) {
        if (initAttempts < maxAttempts) {
          console.log('Waiting for YouTube API... Attempt:', initAttempts);
          setTimeout(initPlayer, 100);
        } else {
          console.error('YouTube API not loaded after max attempts');
          alert('YouTube API failed to load. Please refresh the page.');
        }
        return;
      }

      try {
        console.log('Initializing YouTube player with video ID:', selectedVideo.id);

        // Clear the container first
        playerElement.innerHTML = '';

        const player = new window.YT.Player('youtube-player', {
          videoId: selectedVideo.id,
          width: '100%',
          height: '100%',
          playerVars: {
            rel: 0,              // Don't show related videos at end
            modestbranding: 1,   // Minimal YouTube branding
            controls: 1,         // Show player controls
            disablekb: 0,        // Enable keyboard controls
            fs: 1,               // Allow fullscreen
            autoplay: 1,         // Autoplay when loaded
          },
          events: {
            onReady: (event) => {
              console.log('YouTube player ready for video:', selectedVideo.id);
              setYoutubePlayer(event.target);
              setVideoStartTime(Date.now());
            },
            onStateChange: (event) => {
              // Track when video ends
              if (event.data === window.YT.PlayerState.ENDED) {
                // Use refs to get the latest values (avoids stale closure)
                const currentProgress = progressRef.current;
                const currentHasSkipped = skippedRef.current;

                console.log('Video ended - Progress:', currentProgress, 'Skipped:', currentHasSkipped);

                if (currentProgress >= 95 && !currentHasSkipped) {
                  const accessHours = selectedVideo.accessHours;
                  const expiresAt = Date.now() + (accessHours * 60 * 60 * 1000);

                  localStorage.setItem('pdf_access', JSON.stringify({
                    expiresAt,
                    videoId: selectedVideo.id
                  }));

                  setIsUnlocked(true);
                  setTimeRemaining(accessHours * 60 * 60);
                  setShowVideoModal(false);
                  setSelectedVideo(null);

                  if (event.target) {
                    try {
                      event.target.destroy();
                    } catch (e) {
                      console.log('Error destroying player on end:', e);
                    }
                  }
                  setYoutubePlayer(null);
                } else if (currentHasSkipped) {
                  alert('Please watch the entire video without skipping to unlock access.');
                } else {
                  alert('Please watch the entire video to unlock access.');
                }
              }
            },
            onError: (event) => {
              console.error('YouTube player error code:', event.data);
              let errorMessage = 'Error loading video.';

              switch(event.data) {
                case 2:
                  errorMessage = 'Invalid video ID. Please check the video ID in admin settings.';
                  break;
                case 5:
                  errorMessage = 'Video playback error. The video may not support embedded playback.';
                  break;
                case 100:
                  errorMessage = 'Video not found. Please check if the video exists and is public.';
                  break;
                case 101:
                case 150:
                  errorMessage = 'Video cannot be embedded. The video owner has disabled embedding.';
                  break;
              }

              alert(errorMessage + '\n\nVideo ID: ' + selectedVideo.id);
            }
          },
        });
      } catch (error) {
        console.error('Error creating YouTube player:', error);
        alert('Failed to create video player: ' + error.message);
      }
    };

    // Start initialization with a small delay to ensure DOM is ready
    const startInit = setTimeout(() => {
      if (window.YT && window.YT.Player) {
        console.log('YouTube API already loaded, initializing player...');
        initPlayer();
      } else {
        console.log('Waiting for YouTube API to load...');
        window.onYouTubeIframeAPIReady = initPlayer;
      }
    }, 200);

    return () => {
      clearTimeout(startInit);
      // Cleanup when component unmounts or video changes
      if (youtubePlayer) {
        try {
          youtubePlayer.destroy();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, [selectedVideo]);

  // Track video progress and detect skipping
  useEffect(() => {
    if (!youtubePlayer || !selectedVideo) return;

    const progressInterval = setInterval(() => {
      try {
        const currentTime = youtubePlayer.getCurrentTime();
        const duration = youtubePlayer.getDuration();

        if (duration > 0) {
          // Check for skipping (if current time jumped forward by more than 2 seconds)
          if (lastKnownTime > 0 && currentTime - lastKnownTime > 2) {
            setHasSkipped(true);
          }

          setLastKnownTime(currentTime);
          const progress = (currentTime / duration) * 100;
          setVideoWatchProgress(Math.min(progress, 100));
        }
      } catch (error) {
        console.error('Error tracking video progress:', error);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(progressInterval);
  }, [youtubePlayer, lastKnownTime, selectedVideo]);

  const handleVideoWatched = () => {
    if (!selectedVideo) return;

    const accessHours = selectedVideo.accessHours;
    const expiresAt = Date.now() + (accessHours * 60 * 60 * 1000);

    localStorage.setItem('pdf_access', JSON.stringify({
      expiresAt,
      videoId: selectedVideo.id
    }));

    setIsUnlocked(true);
    setTimeRemaining(accessHours * 60 * 60);
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  // Handle premium upgrade
  const handlePremiumUpgrade = () => {
    const confirmPurchase = window.confirm(
      'Upgrade to Premium for $4.99/month?\n\n' +
      '- Unlimited access\n' +
      '- No video watching required\n' +
      '- Priority processing\n' +
      '- No ads'
    );

    if (confirmPurchase) {
      localStorage.setItem('pdf_premium', 'true');
      setIsPremium(true);
      setIsUnlocked(true);
      alert('Premium activated! Enjoy unlimited access.');
    }
  };

  // Handle tool selection
  const handleToolSelect = (tool) => {
    if (!isUnlocked && !isPremium) {
      setShowVideoModal(true);
      return;
    }

    setSelectedTool(tool);
    setFiles([]);
    setResult(null);
    setError(null);
  };

  // Handle file input change
  const handleFileInputChange = (event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(Array.from(selectedFiles));
      setError(null);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      setFiles(Array.from(droppedFiles));
      setError(null);
    }
  };

  // Trigger file input click
  const handleSelectFilesClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process PDF
  const processPDF = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      let resultBlob;
      let resultFiles = [];
      let filename = `${selectedTool.id}_${Date.now()}`;

      switch (selectedTool.id) {
        case 'merge':
          resultBlob = await mergePDFs(files);
          filename += '.pdf';
          break;

        case 'split':
          resultFiles = await splitPDF(files[0]);
          setResult({
            files: resultFiles,
            message: `Successfully split into ${resultFiles.length} pages!`,
            multiFile: true
          });
          setProcessing(false);
          return;

        case 'compress':
          resultBlob = await compressPDF(files[0]);
          filename += '_compressed.pdf';
          break;

        case 'pdf-to-jpg':
          resultFiles = await pdfToJPG(files[0]);
          setResult({
            files: resultFiles,
            message: `Successfully converted ${resultFiles.length} pages to JPG!`,
            multiFile: true
          });
          setProcessing(false);
          return;

        case 'jpg-to-pdf':
          resultBlob = await jpgToPDF(files);
          filename += '.pdf';
          break;

        case 'pdf-to-word':
          resultBlob = await pdfToWord(files[0]);
          filename += '.docx';
          break;

        case 'word-to-pdf':
          resultBlob = await wordToPDF(files[0]);
          filename += '.pdf';
          break;

        case 'organize-pages':
          setShowOrganizePagesEditor(true);
          setProcessing(false);
          return;

        case 'rotate':
          // Show visual rotate editor
          setShowRotateEditor(true);
          setProcessing(false);
          return;

        case 'protect':
          // Show visual watermark editor
          setShowWatermarkEditor(true);
          setProcessing(false);
          return;

        case 'pdf-to-png':
          resultFiles = await pdfToPNG(files[0]);
          setResult({
            files: resultFiles,
            message: `Successfully converted ${resultFiles.length} pages to PNG!`,
            multiFile: true
          });
          setProcessing(false);
          return;

        case 'add-page-numbers':
          // Show visual page numbers editor
          setShowPageNumbersEditor(true);
          setProcessing(false);
          return;

        case 'extract-pages':
          setShowExtractPagesEditor(true);
          setProcessing(false);
          return;

        case 'delete-pages':
          setShowDeletePagesEditor(true);
          setProcessing(false);
          return;

        case 'extract-text':
          resultBlob = await extractText(files[0]);
          filename += '_text.txt';
          break;

        case 'add-signature':
          const signatureFile = await new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png,image/jpeg,image/jpg';
            input.onchange = (e) => resolve(e.target.files[0]);
            input.click();
          });
          if (!signatureFile) {
            setProcessing(false);
            return;
          }
          const sigPosition = prompt('Choose signature position:\n1 - Bottom Right\n2 - Bottom Left\n3 - Top Right\n4 - Top Left', '1');
          const sigPositions = { '1': 'bottom-right', '2': 'bottom-left', '3': 'top-right', '4': 'top-left' };
          resultBlob = await addSignature(files[0], signatureFile, sigPositions[sigPosition] || 'bottom-right');
          filename += '_signed.pdf';
          break;

        case 'edit-metadata':
          const metadata = {
            title: prompt('Title:', '') || '',
            author: prompt('Author:', '') || '',
            subject: prompt('Subject:', '') || '',
            keywords: prompt('Keywords (comma-separated):', '') || '',
          };
          resultBlob = await editMetadata(files[0], metadata);
          filename += '_metadata.pdf';
          break;

        case 'extract-images':
          resultFiles = await extractImages(files[0]);
          setResult({
            files: resultFiles,
            message: `Successfully extracted ${resultFiles.length} images!`,
            multiFile: true
          });
          setProcessing(false);
          return;

        case 'crop':
          // Show visual crop editor
          setShowCropEditor(true);
          setProcessing(false);
          return;

        case 'resize':
          // Show visual resize editor
          setShowResizeEditor(true);
          setProcessing(false);
          return;

        case 'flatten':
          resultBlob = await flattenPDF(files[0]);
          filename += '_flattened.pdf';
          break;

        case 'header-footer':
          const header = prompt('Header text (use {page} and {total} for page numbers):', '');
          const footer = prompt('Footer text (use {page} and {total} for page numbers):', 'Page {page} of {total}');
          resultBlob = await addHeaderFooter(files[0], header, footer);
          filename += '_headerfooter.pdf';
          break;

        default:
          throw new Error('Unknown tool');
      }

      if (resultBlob) {
        const size = getFileSizeMB(resultBlob);
        setResult({
          blob: resultBlob,
          filename,
          size: `${size} MB`,
          message: 'Your file has been processed successfully!'
        });
      }

      setProcessing(false);
    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message || 'An error occurred while processing your file.');
      setProcessing(false);
    }
  };

  // Handle rotate editor completion
  const handleRotateComplete = async (rotation) => {
    setShowRotateEditor(false);
    setProcessing(true);

    try {
      const resultBlob = await rotatePDF(files[0], rotation);
      const filename = `rotated_${rotation}_${Date.now()}.pdf`;
      const size = getFileSizeMB(resultBlob);

      setResult({
        blob: resultBlob,
        filename,
        size: `${size} MB`,
        message: 'Your PDF has been rotated successfully!'
      });
    } catch (error) {
      console.error('Rotation error:', error);
      setError(error.message || 'Failed to rotate PDF');
    } finally {
      setProcessing(false);
    }
  };

  // Handle crop editor completion
  const handleCropComplete = async (margins) => {
    setShowCropEditor(false);
    setProcessing(true);

    try {
      const resultBlob = await cropPDF(files[0], margins);
      const filename = `cropped_${Date.now()}.pdf`;
      const size = getFileSizeMB(resultBlob);

      setResult({
        blob: resultBlob,
        filename,
        size: `${size} MB`,
        message: 'Your PDF has been cropped successfully!'
      });
    } catch (error) {
      console.error('Crop error:', error);
      setError(error.message || 'Failed to crop PDF');
    } finally {
      setProcessing(false);
    }
  };

  // Handle organize pages editor completion
  const handleOrganizePagesComplete = async (pageOrder) => {
    setShowOrganizePagesEditor(false);
    setProcessing(true);

    try {
      const resultBlob = await organizePages(files[0], pageOrder);
      const filename = `organized_${Date.now()}.pdf`;
      const size = getFileSizeMB(resultBlob);

      setResult({
        blob: resultBlob,
        filename,
        size: `${size} MB`,
        message: 'Your pages have been reorganized successfully!'
      });
    } catch (error) {
      console.error('Organize pages error:', error);
      setError(error.message || 'Failed to organize pages');
    } finally {
      setProcessing(false);
    }
  };

  // Handle extract pages editor completion
  const handleExtractPagesComplete = async (pageNumbers) => {
    setShowExtractPagesEditor(false);
    setProcessing(true);

    try {
      const resultBlob = await extractPages(files[0], pageNumbers);
      const filename = `extracted_pages_${Date.now()}.pdf`;
      const size = getFileSizeMB(resultBlob);

      setResult({
        blob: resultBlob,
        filename,
        size: `${size} MB`,
        message: `Successfully extracted ${pageNumbers.length} page(s)!`
      });
    } catch (error) {
      console.error('Extract pages error:', error);
      setError(error.message || 'Failed to extract pages');
    } finally {
      setProcessing(false);
    }
  };

  // Handle delete pages editor completion
  const handleDeletePagesComplete = async (pageNumbers) => {
    setShowDeletePagesEditor(false);
    setProcessing(true);

    try {
      const resultBlob = await deletePages(files[0], pageNumbers);
      const filename = `deleted_pages_${Date.now()}.pdf`;
      const size = getFileSizeMB(resultBlob);

      setResult({
        blob: resultBlob,
        filename,
        size: `${size} MB`,
        message: `Successfully deleted ${pageNumbers.length} page(s)!`
      });
    } catch (error) {
      console.error('Delete pages error:', error);
      setError(error.message || 'Failed to delete pages');
    } finally {
      setProcessing(false);
    }
  };

  // Handle resize editor completion
  const handleResizeComplete = async ({ pageSize }) => {
    setShowResizeEditor(false);
    setProcessing(true);

    try {
      const resultBlob = await resizePDF(files[0], pageSize.name);
      const filename = `resized_${pageSize.name}_${Date.now()}.pdf`;
      const size = getFileSizeMB(resultBlob);

      setResult({
        blob: resultBlob,
        filename,
        size: `${size} MB`,
        message: `Successfully resized to ${pageSize.label}!`
      });
    } catch (error) {
      console.error('Resize error:', error);
      setError(error.message || 'Failed to resize PDF');
    } finally {
      setProcessing(false);
    }
  };

  // Handle page numbers editor completion
  const handlePageNumbersComplete = async ({ position, startNumber, format, fontSize }) => {
    setShowPageNumbersEditor(false);
    setProcessing(true);

    try {
      const resultBlob = await addPageNumbers(files[0], position, startNumber, format, fontSize);
      const filename = `numbered_${Date.now()}.pdf`;
      const size = getFileSizeMB(resultBlob);

      setResult({
        blob: resultBlob,
        filename,
        size: `${size} MB`,
        message: 'Successfully added page numbers!'
      });
    } catch (error) {
      console.error('Add page numbers error:', error);
      setError(error.message || 'Failed to add page numbers');
    } finally {
      setProcessing(false);
    }
  };

  // Handle watermark editor completion
  const handleWatermarkComplete = async ({ text, opacity, fontSize, rotation, color }) => {
    setShowWatermarkEditor(false);
    setProcessing(true);

    try {
      const resultBlob = await protectPDF(files[0], text, { opacity, fontSize, rotation, color });
      const filename = `watermarked_${Date.now()}.pdf`;
      const size = getFileSizeMB(resultBlob);

      setResult({
        blob: resultBlob,
        filename,
        size: `${size} MB`,
        message: 'Successfully added watermark!'
      });
    } catch (error) {
      console.error('Add watermark error:', error);
      setError(error.message || 'Failed to add watermark');
    } finally {
      setProcessing(false);
    }
  };

  // Download result
  const downloadResult = (fileToDownload = null) => {
    const blob = fileToDownload?.blob || result?.blob;
    const filename = fileToDownload?.name || result?.filename || 'processed_file.pdf';

    if (!blob) {
      setError('No file available to download');
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download all files (for multi-file results)
  const downloadAllFiles = () => {
    if (result?.files) {
      result.files.forEach((file, index) => {
        setTimeout(() => {
          downloadResult(file);
        }, index * 100);
      });
    }
  };

  // Reset tool
  const resetTool = () => {
    setResult(null);
    setFiles([]);
  };

  // Close modals
  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const closeToolModal = () => {
    setSelectedTool(null);
    setFiles([]);
    setResult(null);
    setError(null);
  };

  // Show admin page if on admin route
  if (showAdminPage) {
    return <AdminPage darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-[#1E1E2E] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${
        darkMode ? 'bg-[#2A2A3E]/90 border-purple-500/20' : 'bg-white/90 border-purple-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-purple-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                PDF Tools Pro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isPremium && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                  <Crown className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-semibold">Premium</span>
                </div>
              )}
              {isUnlocked && !isPremium && (
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-semibold">{formatTime(timeRemaining)}</span>
                </div>
              )}
              {!isUnlocked && !isPremium && (
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Unlock Tools</span>
                </button>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className={`text-4xl sm:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Professional PDF Tools
          </h2>
          <p className={`text-lg sm:text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Convert, compress, merge, and edit PDFs with ease
          </p>
        </div>

        {/* Access Status Banner */}
        {!isUnlocked && !isPremium && (
          <div className={`mb-8 p-6 rounded-2xl border-2 ${
            darkMode
              ? 'bg-purple-900/20 border-purple-500/30'
              : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Lock className="w-8 h-8 text-purple-500" />
                <div>
                  <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Tools Locked
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Watch a short video to unlock access, or upgrade to Premium
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Unlock Now
              </button>
            </div>
          </div>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool)}
                className={`p-6 rounded-2xl text-left transition-all transform hover:scale-105 ${
                  darkMode
                    ? 'bg-[#2A2A3E] hover:bg-purple-900/30 border border-purple-500/20'
                    : 'bg-white hover:shadow-xl border border-purple-100'
                } ${!isUnlocked && !isPremium ? 'opacity-75' : ''}`}
              >
                <Icon className="w-12 h-12 text-purple-500 mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {tool.name}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {tool.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Premium CTA */}
        {!isPremium && (
          <div className={`mt-12 p-8 rounded-2xl border-2 ${
            darkMode
              ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30'
              : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Crown className="w-12 h-12 text-yellow-500" />
                <div>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Upgrade to Premium
                  </h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Unlimited access. No videos required. Priority processing.
                  </p>
                </div>
              </div>
              <button
                onClick={handlePremiumUpgrade}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
              >
                Only $4.99/month
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-16 border-t ${darkMode ? 'border-purple-500/20' : 'border-purple-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            PDF Tools Pro - Professional PDF manipulation in your browser
          </p>
          {/* Hidden reset button for testing - Press Ctrl+Shift+R or click here */}
          <button
            onClick={handleResetAccess}
            className={`mx-auto mt-2 block text-xs opacity-20 hover:opacity-100 transition-opacity ${
              darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-600'
            }`}
            title="Reset access (Ctrl+Shift+R)"
          >
            Reset Access
          </button>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`max-w-4xl w-full rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-[#2A2A3E]' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Watch to Unlock Access
              </h3>
              <button
                onClick={closeVideoModal}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!selectedVideo ? (
              <div className="space-y-4">
                <p className={`text-center mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Choose a video to watch. Longer videos grant more access time!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleVideoSelect(video)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        darkMode
                          ? 'bg-[#1E1E2E] hover:bg-purple-900/30 border border-purple-500/30'
                          : 'bg-purple-50 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Play className="w-8 h-8 text-purple-500" />
                        <div className="flex-1">
                          <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {video.title}
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {video.duration} min video
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-2 text-sm font-semibold ${
                        darkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>Get {video.accessHours}h access</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className={`mt-8 p-4 rounded-xl border-2 ${
                  darkMode ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Crown className="w-8 h-8 text-yellow-500" />
                      <div>
                        <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Premium Plan
                        </h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Unlimited access, no video watching required
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handlePremiumUpgrade}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      $4.99/mo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <div id="youtube-player" ref={playerRef} style={{ width: '100%', height: '100%' }}></div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Watch Progress
                    </span>
                    <span className={`text-sm font-bold ${
                      videoWatchProgress >= 95 && !hasSkipped
                        ? 'text-green-500'
                        : hasSkipped
                        ? 'text-red-500'
                        : 'text-purple-500'
                    }`}>
                      {Math.floor(videoWatchProgress)}%
                    </span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className={`h-full transition-all duration-300 ${
                        videoWatchProgress >= 95 && !hasSkipped
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : hasSkipped
                          ? 'bg-gradient-to-r from-red-500 to-orange-500'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${videoWatchProgress}%` }}
                    ></div>
                  </div>
                  {hasSkipped && (
                    <p className="text-sm text-red-500 mt-2 text-center font-semibold">
                      ⚠️ Video skipping detected! Please watch without skipping.
                    </p>
                  )}
                </div>

                <p className={`text-sm text-center mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Watch the entire video to unlock {selectedVideo.accessHours} hour{selectedVideo.accessHours > 1 ? 's' : ''} of access
                </p>

                <div className={`p-4 rounded-lg mb-4 ${
                  darkMode ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'
                }`}>
                  <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>✓ Video must be watched completely (100%)</li>
                    <li>✓ Skipping ahead will prevent unlocking</li>
                    <li>✓ Access unlocks automatically when video ends</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`max-w-2xl w-full rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-[#2A2A3E]' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {React.createElement(selectedTool.icon, { className: "w-8 h-8 text-purple-500" })}
                <div>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedTool.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedTool.desc}
                  </p>
                </div>
              </div>
              <button
                onClick={closeToolModal}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!result ? (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    darkMode
                      ? 'border-purple-500/30 hover:border-purple-500 bg-[#1E1E2E]'
                      : 'border-purple-300 hover:border-purple-500 bg-purple-50'
                  }`}
                >
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Drop files here or use the button below
                  </p>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Supported: {selectedTool.accept}
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={selectedTool.accept}
                    multiple={selectedTool.multiple}
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={handleSelectFilesClick}
                    className={`inline-block px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all ${
                      darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    Select Files
                  </button>
                </div>

                {files.length > 0 && (
                  <div className="mt-6">
                    <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Selected Files ({files.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            darkMode ? 'bg-[#1E1E2E]' : 'bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-purple-500" />
                            <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {file.name}
                            </span>
                          </div>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                )}

                <button
                  onClick={processPDF}
                  disabled={processing || files.length === 0}
                  className={`w-full mt-6 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
                    processing || files.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg transform hover:scale-105'
                  } text-white`}
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {React.createElement(selectedTool.icon, { className: "w-5 h-5" })}
                      <span>Process {selectedTool.name}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h4 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Success!
                </h4>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {result.message}
                </p>

                {result.multiFile ? (
                  <div className={`p-4 rounded-lg mb-6 max-h-60 overflow-y-auto ${darkMode ? 'bg-[#1E1E2E]' : 'bg-gray-100'}`}>
                    <h5 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Files ({result.files.length})
                    </h5>
                    <div className="space-y-2">
                      {result.files.map((file, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            darkMode ? 'bg-[#2A2A3E]' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-purple-500" />
                            <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => downloadResult(file)}
                            className="p-2 text-purple-500 hover:bg-purple-500/10 rounded transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-[#1E1E2E]' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-purple-500" />
                        <div className="text-left">
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {result.filename}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {result.size}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={result.multiFile ? downloadAllFiles : downloadResult}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>{result.multiFile ? 'Download All' : 'Download'}</span>
                  </button>
                  <button
                    onClick={resetTool}
                    className={`px-6 py-3 rounded-lg font-semibold ${
                      darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Process Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Editors */}
      {showRotateEditor && files.length > 0 && (
        <RotateEditor
          file={files[0]}
          onComplete={handleRotateComplete}
          onCancel={() => setShowRotateEditor(false)}
          darkMode={darkMode}
        />
      )}

      {showCropEditor && files.length > 0 && (
        <CropEditor
          file={files[0]}
          onComplete={handleCropComplete}
          onCancel={() => setShowCropEditor(false)}
          darkMode={darkMode}
        />
      )}

      {showOrganizePagesEditor && files.length > 0 && (
        <OrganizePagesEditor
          file={files[0]}
          onComplete={handleOrganizePagesComplete}
          onCancel={() => setShowOrganizePagesEditor(false)}
          darkMode={darkMode}
        />
      )}

      {showExtractPagesEditor && files.length > 0 && (
        <ExtractDeletePagesEditor
          file={files[0]}
          mode="extract"
          onComplete={handleExtractPagesComplete}
          onCancel={() => setShowExtractPagesEditor(false)}
          darkMode={darkMode}
        />
      )}

      {showDeletePagesEditor && files.length > 0 && (
        <ExtractDeletePagesEditor
          file={files[0]}
          mode="delete"
          onComplete={handleDeletePagesComplete}
          onCancel={() => setShowDeletePagesEditor(false)}
          darkMode={darkMode}
        />
      )}

      {showResizeEditor && files.length > 0 && (
        <ResizeEditor
          file={files[0]}
          onApply={handleResizeComplete}
          onCancel={() => setShowResizeEditor(false)}
          darkMode={darkMode}
        />
      )}

      {showPageNumbersEditor && files.length > 0 && (
        <AddPageNumbersEditor
          file={files[0]}
          onApply={handlePageNumbersComplete}
          onCancel={() => setShowPageNumbersEditor(false)}
          darkMode={darkMode}
        />
      )}

      {showWatermarkEditor && files.length > 0 && (
        <WatermarkEditor
          file={files[0]}
          onApply={handleWatermarkComplete}
          onCancel={() => setShowWatermarkEditor(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
