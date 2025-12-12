const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

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

    // Load the PDF
    const pdfDoc = await PDFDocument.load(req.file.buffer);

    // Encrypt the PDF with password
    // Note: pdf-lib supports encryption with user and owner passwords
    const encryptedPdfBytes = await pdfDoc.save({
      userPassword: password,
      ownerPassword: password + '_owner', // Owner password for permissions
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

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="encrypted_${Date.now()}.pdf"`);

    // Send the encrypted PDF
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

    // Try to load the PDF with the password
    const pdfDoc = await PDFDocument.load(req.file.buffer, {
      password: password,
      ignoreEncryption: false
    });

    // Save without encryption
    const decryptedPdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="decrypted_${Date.now()}.pdf"`);

    // Send the decrypted PDF
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
  res.json({ status: 'Server is running', port: PORT });
});

// Start server
app.listen(PORT, () => {
  console.log(`PDF Encryption Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
