import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Lock, Clock, Play, FileText, Scissors, Minimize2, Image, FileImage, Type, Shield, RotateCw, Crown, X, Upload, Download, AlertCircle, CheckCircle, Loader, Hash, Trash2, FileDown, FileEdit, PenTool, Crop, Maximize2, Layers, AlignCenter, ArrowUpDown, LogOut, LogIn, User as UserIcon } from 'lucide-react';
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
import VideoRequirements from './components/VideoRequirements';
import AuthModal from './components/AuthModal';
import { videoAPI, paymentAPI } from './services/api';
import {
  getUserId,
  hasUserSubscribed,
  setUserSubscribed,
  isReturningUser,
  getWelcomeMessage,
  updateLastVisit
} from './utils/userTracking';

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

  // Authentication State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Video requirements state
  const [showRequirements, setShowRequirements] = useState(true);
  const [requirementsMet, setRequirementsMet] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  // User tracking
  const [userIsReturningSubscriber, setUserIsReturningSubscriber] = useState(false);

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
    const resetAll = window.confirm(
      'Reset Options:\n\n' +
      'Click OK to reset access ONLY\n' +
      'Click Cancel, then hold Shift+Click to RESET EVERYTHING (including videos)'
    );

    if (resetAll) {
      // Regular reset - just access
      localStorage.removeItem('pdf_premium');
      localStorage.removeItem('pdf_access');
      setIsPremium(false);
      setIsUnlocked(false);
      setTimeRemaining(0);
      console.log('Access reset - Premium and unlock status cleared');
    }
  };

  const handleFullReset = () => {
    if (window.confirm('⚠️ FULL RESET: Clear ALL data including videos and reload with defaults?')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('All data cleared! Page will reload with fresh defaults including working video IDs.');
      window.location.reload();
    }
  };

  // Initialize user tracking on mount
  useEffect(() => {
    // Get or create user ID
    getUserId();

    // Check if user is a returning subscriber
    setUserIsReturningSubscriber(hasUserSubscribed());

    // Update last visit
    updateLastVisit();

    // Load authenticated user
    const loadUser = async () => {
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        try {
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            // Update premium status from backend
            if (data.user.isPremium) {
              setIsPremium(true);
              setIsUnlocked(true);
            }
          } else {
            // Invalid token, remove it
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      }
    };

    loadUser();
  }, []);

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

  // Load videos from database API
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const videosFromAPI = await videoAPI.getAll();
        if (videosFromAPI && videosFromAPI.length > 0) {
          // Convert API format to frontend format
          const formattedVideos = videosFromAPI.map(v => ({
            id: v.id,
            title: v.title,
            duration: v.duration,
            accessHours: v.access_hours
          }));
          setVideos(formattedVideos);
        } else {
          // Fallback to default videos if API returns empty
          const defaultVideos = [
            { id: '-6FYfcXFxn4', title: 'Your Channel Video', duration: 5, accessHours: 1 },
            { id: 'ScMzIvxBSi4', title: 'Sample Video (1 min)', duration: 1, accessHours: 3 },
            { id: 'aqz-KE-bpKQ', title: 'Test Video (2 min)', duration: 2, accessHours: 12 },
            { id: 'jNQXAC9IVRw', title: 'Me at the zoo (Classic)', duration: 1, accessHours: 24 },
          ];
          setVideos(defaultVideos);
        }
      } catch (error) {
        console.error('Failed to load videos from API:', error);
        // Fallback to default videos on error
        const defaultVideos = [
          { id: '-6FYfcXFxn4', title: 'Your Channel Video', duration: 5, accessHours: 1 },
          { id: 'ScMzIvxBSi4', title: 'Sample Video (1 min)', duration: 1, accessHours: 3 },
          { id: 'aqz-KE-bpKQ', title: 'Test Video (2 min)', duration: 2, accessHours: 12 },
          { id: 'jNQXAC9IVRw', title: 'Me at the zoo (Classic)', duration: 1, accessHours: 24 },
        ];
        setVideos(defaultVideos);
      }
    };

    loadVideos();
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

  // Handle video selection
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setVideoWatched(false);
    setRequirementsMet(false);

    // Check if user already subscribed (returning subscriber)
    if (userIsReturningSubscriber) {
      // Skip requirements, go straight to video
      setShowRequirements(false);
      setRequirementsMet(true);
    } else {
      setShowRequirements(true);
    }
  };

  // Handle requirements completion (only subscribe, no like/comment)
  const handleRequirementsComplete = (data) => {
    if (!selectedVideo) return;

    // Save subscription status
    if (data.subscribed) {
      setUserSubscribed();
      setUserIsReturningSubscriber(true);
    }

    // Mark requirements as met and show the video
    setRequirementsMet(true);
    setShowRequirements(false);
  };

  // Timer to enable unlock button after video duration
  useEffect(() => {
    if (!selectedVideo || !requirementsMet) return;

    // Enable the button after the video duration
    const timer = setTimeout(() => {
      setVideoWatched(true);
    }, selectedVideo.duration * 60 * 1000); // Convert minutes to milliseconds

    return () => clearTimeout(timer);
  }, [selectedVideo, requirementsMet]);

  // Handle video watched - grant access
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
    setVideoWatched(false);
    setRequirementsMet(false);
    setShowRequirements(true);
  };

  // Handle premium upgrade
  const handlePremiumUpgrade = async () => {
    // Check if user is logged in
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Create Stripe checkout session
      const data = await paymentAPI.createCheckoutSession();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  // Handle login/logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsPremium(false);
    // Don't remove video-based access when logging out
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    if (userData.isPremium) {
      setIsPremium(true);
      setIsUnlocked(true);
    }
    setShowAuthModal(false);
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
              {user && (
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{user.email}</span>
                </div>
              )}
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
              {user ? (
                <button
                  onClick={handleLogout}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-purple-700 hover:bg-purple-600' : 'bg-purple-200 hover:bg-purple-300'
                  }`}
                >
                  <LogIn className="w-5 h-5" />
                  <span className="text-sm font-semibold">Login</span>
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
          {/* Reset buttons for testing */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleResetAccess}
              className={`text-xs opacity-20 hover:opacity-100 transition-opacity ${
                darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-600'
              }`}
              title="Reset access only (Ctrl+Shift+R)"
            >
              Reset Access
            </button>
            <button
              onClick={handleFullReset}
              className={`text-xs opacity-20 hover:opacity-100 transition-opacity ${
                darkMode ? 'text-orange-600 hover:text-orange-400' : 'text-orange-400 hover:text-orange-600'
              }`}
              title="Clear ALL data and reload with new videos"
            >
              🔄 Full Reset (Fix Videos)
            </button>
          </div>
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
              /* Video Selection Screen */
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
                      disabled
                      className="px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed"
                      title="Premium payments coming soon"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            ) : showRequirements ? (
              /* Show subscribe requirement BEFORE video */
              <VideoRequirements
                darkMode={darkMode}
                isReturningSubscriber={userIsReturningSubscriber}
                onComplete={handleRequirementsComplete}
              />
            ) : (
              /* Show video player AFTER subscription */
              <div>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${selectedVideo.id}?rel=0&modestbranding=1&autoplay=1&controls=1&fs=0&disablekb=1`}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                  ></iframe>
                  {/* Complete overlay to prevent ANY interaction with video controls */}
                  <div
                    className="absolute inset-0 bg-transparent"
                    style={{
                      pointerEvents: 'auto',
                      cursor: 'not-allowed',
                      zIndex: 10
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseUp={(e) => e.preventDefault()}
                    onClick={(e) => e.preventDefault()}
                    onDoubleClick={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  {/* Warning message overlay */}
                  <div
                    className="absolute top-2 left-2 right-2 bg-black/70 text-white text-xs px-3 py-2 rounded pointer-events-none"
                    style={{ zIndex: 11 }}
                  >
                    🚫 Skipping disabled - Watch the full video to unlock
                  </div>
                </div>

                <div className={`p-3 rounded-lg mb-4 text-xs ${
                  darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  <p className="font-semibold">🔒 Video controls are completely locked!</p>
                  <p className="mt-1">The video will play automatically. Watch the full {selectedVideo.duration} minute{selectedVideo.duration > 1 ? 's' : ''} to unlock access.</p>
                  <p className="mt-1 text-yellow-600 dark:text-yellow-400">⚠️ Do not refresh the page or the timer will reset!</p>
                </div>

                {/* Unlock button */}
                <button
                  onClick={handleVideoWatched}
                  disabled={!videoWatched}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                    videoWatched
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg cursor-pointer'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {videoWatched ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Unlock {selectedVideo.accessHours}h Access Now!</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>Video playing... {selectedVideo.duration} minute{selectedVideo.duration > 1 ? 's' : ''} remaining</span>
                    </>
                  )}
                </button>

                <p className={`text-xs text-center mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Thanks for subscribing! 💙
                </p>
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

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          darkMode={darkMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
