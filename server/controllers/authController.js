const bcrypt = require('bcrypt');
const { query } = require('../database/db');
const { generateToken } = require('../middleware/auth');

/**
 * User Registration
 */
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'An account with this email already exists. Please login instead.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, is_premium, created_at`,
      [email, passwordHash]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        isPremium: newUser.is_premium,
        createdAt: newUser.created_at
      },
      token
    });

    console.log(`✅ New user registered: ${email}`);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * User Login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const result = await query(
      `SELECT id, email, password_hash, is_premium, premium_since, subscription_status
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        isPremium: user.is_premium,
        premiumSince: user.premium_since,
        subscriptionStatus: user.subscription_status
      },
      token
    });

    console.log(`✅ User logged in: ${email}`);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Get current user info (requires authentication)
 */
const getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, is_premium, premium_since, subscription_status, created_at
       FROM users
       WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        isPremium: user.is_premium,
        premiumSince: user.premium_since,
        subscriptionStatus: user.subscription_status,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user information'
    });
  }
};

/**
 * Check if user has premium access
 */
const checkPremium = async (req, res) => {
  try {
    const result = await query(
      'SELECT is_premium, subscription_status FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ hasPremium: false });
    }

    const user = result.rows[0];
    const hasPremium = user.is_premium && user.subscription_status === 'active';

    res.json({
      hasPremium,
      subscriptionStatus: user.subscription_status
    });

  } catch (error) {
    console.error('Check premium error:', error);
    res.status(500).json({
      error: 'Failed to check premium status'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  checkPremium
};
