const express = require('express');
const router = express.Router();
const { register, login, getMe, checkPremium } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', verifyToken, getMe);
router.get('/check-premium', verifyToken, checkPremium);

module.exports = router;
