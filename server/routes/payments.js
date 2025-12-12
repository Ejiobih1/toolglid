const express = require('express');
const router = express.Router();
const { createCheckoutSession, handleWebhook, cancelSubscription } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// Webhook route (no auth needed - verified by Stripe signature)
// IMPORTANT: This must use raw body, not JSON parsed body
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-checkout-session', verifyToken, createCheckoutSession);
router.post('/cancel-subscription', verifyToken, cancelSubscription);

module.exports = router;
