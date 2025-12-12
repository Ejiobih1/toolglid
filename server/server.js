require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

// Import database
const { testConnection } = require('./database/db');

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const videoRoutes = require('./routes/videos');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
// IMPORTANT: Webhook route needs raw body, so we apply JSON parsing selectively
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for PDF file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/videos', videoRoutes);

// ===== PDF Processing Endpoints (Legacy from original server) =====

// Encrypt PDF endpoint
app.post('/api/encrypt-pdf', upload.single('file'), async (req, res) => {
  try {
    const { password, permissions } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    console.log('Encrypting PDF with password...');

    const pdfDoc = await PDFDocument.load(req.file.buffer);

    const encryptedPdfBytes = await pdfDoc.save({
      userPassword: password,
      ownerPassword: password + '_owner',
      permissions: {
        printing: permissions?.printing !== false ? 'highResolution' : 'none',
        modifying: permissions?.modifying !== false,
        copying: permissions?.copying !== false,
        annotating: permissions?.annotating !== false,
        fillingForms: permissions?.fillingForms !== false,
        contentAccessibility: true,
        documentAssembly: permissions?.documentAssembly !== false
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="encrypted_${Date.now()}.pdf"`);
    res.send(Buffer.from(encryptedPdfBytes));

    console.log('PDF encrypted successfully');

  } catch (error) {
    console.error('Encryption error:', error);
    res.status(500).json({
      error: 'Failed to encrypt PDF',
      details: error.message
    });
  }
});

// Decrypt/Unlock PDF endpoint
app.post('/api/decrypt-pdf', upload.single('file'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Attempting to decrypt PDF...');

    const pdfDoc = await PDFDocument.load(req.file.buffer, {
      password: password,
      ignoreEncryption: false
    });

    const decryptedPdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="decrypted_${Date.now()}.pdf"`);
    res.send(Buffer.from(decryptedPdfBytes));

    console.log('PDF decrypted successfully');

  } catch (error) {
    console.error('Decryption error:', error);

    if (error.message.includes('password')) {
      res.status(401).json({
        error: 'Incorrect password or PDF is not encrypted',
        details: error.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to decrypt PDF',
        details: error.message
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but server will start anyway');
      console.warn('   Run: npm run init-db to set up the database');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log('\n🚀 PDF Tools Backend Server Started!\n');
      console.log(`📍 Server running at: http://localhost:${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   - POST /api/auth/register - User registration`);
      console.log(`   - POST /api/auth/login - User login`);
      console.log(`   - GET  /api/auth/me - Get current user`);
      console.log(`   - GET  /api/videos - Get all videos`);
      console.log(`   - POST /api/payments/create-checkout-session - Start payment`);
      console.log(`   - POST /api/payments/webhook - Stripe webhooks`);
      console.log(`   - POST /api/encrypt-pdf - Encrypt PDF`);
      console.log(`   - POST /api/decrypt-pdf - Decrypt PDF`);
      console.log(`   - GET  /api/health - Health check\n`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Start the server
startServer();
