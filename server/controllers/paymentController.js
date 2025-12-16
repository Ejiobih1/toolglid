// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized successfully');
} else {
  console.log('⚠️  Stripe not configured - payment features disabled');
}

const { query } = require('../database/db');

/**
 * Create Stripe Checkout Session for Premium Subscription
 */
const createCheckoutSession = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({
      error: 'Payment system not configured',
      message: 'Premium subscriptions are coming soon! Payment processing is not yet available.'
    });
  }

  try {
    const userId = req.user.userId;
    const { email } = req.user;

    // Get or create Stripe customer
    let customer;
    const userResult = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    if (user.stripe_customer_id) {
      // Retrieve existing customer
      customer = await stripe.customers.retrieve(user.stripe_customer_id);
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email,
        metadata: {
          userId: userId.toString()
        }
      });

      // Save customer ID
      await query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customer.id, userId]
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PDF Tools Premium',
              description: 'Unlimited access to all PDF tools. No video watching required.',
            },
            unit_amount: Math.round(parseFloat(process.env.PREMIUM_MONTHLY_PRICE || 4.99) * 100), // Convert to cents
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}?payment=canceled`,
      metadata: {
        userId: userId.toString()
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });

    console.log(`✅ Checkout session created for user ${userId}`);

  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
};

/**
 * Handle Stripe Webhook Events
 */
const handleWebhook = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({
      error: 'Payment system not configured'
    });
  }

  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle successful checkout
 */
const handleCheckoutCompleted = async (session) => {
  const userId = parseInt(session.metadata.userId);
  const subscriptionId = session.subscription;

  await query(
    `UPDATE users
     SET is_premium = TRUE,
         premium_since = CURRENT_TIMESTAMP,
         stripe_subscription_id = $1,
         subscription_status = 'active'
     WHERE id = $2`,
    [subscriptionId, userId]
  );

  console.log(`✅ Premium activated for user ${userId}`);
};

/**
 * Handle subscription updates
 */
const handleSubscriptionUpdated = async (subscription) => {
  const customerId = subscription.customer;

  const result = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (result.rows.length > 0) {
    const userId = result.rows[0].id;

    await query(
      `UPDATE users
       SET subscription_status = $1,
           is_premium = $2
       WHERE id = $3`,
      [subscription.status, subscription.status === 'active', userId]
    );

    console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
  }
};

/**
 * Handle subscription deletion/cancellation
 */
const handleSubscriptionDeleted = async (subscription) => {
  const customerId = subscription.customer;

  const result = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (result.rows.length > 0) {
    const userId = result.rows[0].id;

    await query(
      `UPDATE users
       SET is_premium = FALSE,
           subscription_status = 'canceled'
       WHERE id = $1`,
      [userId]
    );

    console.log(`✅ Premium canceled for user ${userId}`);
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSucceeded = async (invoice) => {
  const customerId = invoice.customer;
  const amount = invoice.amount_paid / 100; // Convert from cents

  const result = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (result.rows.length > 0) {
    const userId = result.rows[0].id;

    // Record payment
    await query(
      `INSERT INTO payments (user_id, stripe_payment_intent_id, amount, status)
       VALUES ($1, $2, $3, 'succeeded')`,
      [userId, invoice.payment_intent, amount]
    );

    console.log(`✅ Payment recorded for user ${userId}: $${amount}`);
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (invoice) => {
  const customerId = invoice.customer;

  const result = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (result.rows.length > 0) {
    const userId = result.rows[0].id;

    await query(
      `UPDATE users
       SET subscription_status = 'past_due'
       WHERE id = $1`,
      [userId]
    );

    console.log(`⚠️ Payment failed for user ${userId}`);
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({
      error: 'Payment system not configured'
    });
  }

  try {
    const userId = req.user.userId;

    const result = await query(
      'SELECT stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].stripe_subscription_id) {
      return res.status(404).json({
        error: 'No active subscription found'
      });
    }

    const subscriptionId = result.rows[0].stripe_subscription_id;

    // Cancel at period end (user keeps access until end of billing period)
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    res.json({
      message: 'Subscription will be canceled at the end of the billing period'
    });

    console.log(`✅ Subscription cancellation scheduled for user ${userId}`);

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message
    });
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
  cancelSubscription
};
