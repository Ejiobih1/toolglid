// Production Environment Verification Script
require('dotenv').config();
const crypto = require('crypto');

console.log('\n🔍 Verifying Production Environment Setup...\n');
console.log('='.repeat(80));

let hasErrors = false;
let hasWarnings = false;

// Required Environment Variables
const requiredVars = {
  'NODE_ENV': {
    required: true,
    expectedValue: 'production',
    description: 'Must be set to "production"'
  },
  'DATABASE_URL': {
    required: true,
    checkPattern: /^postgresql:\/\//,
    description: 'PostgreSQL connection string'
  },
  'JWT_SECRET': {
    required: true,
    minLength: 32,
    checkNotDefault: 'pdf_tools_super_secret_jwt_key_2025_change_in_production',
    description: 'Strong JWT secret (must be changed from default!)'
  },
  'STRIPE_SECRET_KEY': {
    required: true,
    checkPattern: /^sk_(live|test)_/,
    description: 'Stripe secret key (sk_live_... for production)'
  },
  'STRIPE_PUBLISHABLE_KEY': {
    required: true,
    checkPattern: /^pk_(live|test)_/,
    description: 'Stripe publishable key (pk_live_... for production)'
  },
  'STRIPE_WEBHOOK_SECRET': {
    required: false,
    checkPattern: /^whsec_/,
    description: 'Stripe webhook signing secret (required after deployment)'
  },
  'FRONTEND_URL': {
    required: true,
    checkPattern: /^https?:\/\//,
    description: 'Frontend URL (should be HTTPS for production)'
  },
  'ADMIN_PASSWORD_HASH': {
    required: false,
    minLength: 50,
    description: 'Hashed admin password (recommended to change)'
  },
  'PREMIUM_MONTHLY_PRICE': {
    required: true,
    description: 'Premium subscription price (e.g., 4.99)'
  }
};

console.log('\n📋 Checking Environment Variables:\n');

for (const [varName, config] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  const status = [];

  // Check if variable exists
  if (!value) {
    if (config.required) {
      console.log(`❌ ${varName}: MISSING (Required)`);
      console.log(`   → ${config.description}`);
      hasErrors = true;
    } else {
      console.log(`⚠️  ${varName}: Not set (Optional)`);
      console.log(`   → ${config.description}`);
      hasWarnings = true;
    }
    continue;
  }

  // Check expected value
  if (config.expectedValue && value !== config.expectedValue) {
    console.log(`❌ ${varName}: "${value}" (Expected: "${config.expectedValue}")`);
    hasErrors = true;
    continue;
  }

  // Check pattern
  if (config.checkPattern && !config.checkPattern.test(value)) {
    console.log(`❌ ${varName}: Invalid format`);
    console.log(`   → ${config.description}`);
    hasErrors = true;
    continue;
  }

  // Check minimum length
  if (config.minLength && value.length < config.minLength) {
    console.log(`⚠️  ${varName}: Too short (${value.length} chars, recommended: ${config.minLength}+)`);
    hasWarnings = true;
    continue;
  }

  // Check if still using default value
  if (config.checkNotDefault && value === config.checkNotDefault) {
    console.log(`❌ ${varName}: Still using DEFAULT value (MUST CHANGE!)`);
    console.log(`   → Generate new: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`);
    hasErrors = true;
    continue;
  }

  console.log(`✅ ${varName}: Configured`);
}

console.log('\n' + '='.repeat(80));
console.log('\n🔐 Security Checks:\n');

// Check if using test Stripe keys in production
if (process.env.NODE_ENV === 'production') {
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    console.log('❌ Stripe: Using TEST keys in PRODUCTION mode!');
    console.log('   → Switch to live keys: sk_live_...');
    hasErrors = true;
  } else if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
    console.log('✅ Stripe: Using LIVE keys');
  }

  if (!process.env.FRONTEND_URL?.startsWith('https://')) {
    console.log('⚠️  Frontend URL: Not using HTTPS (recommended for production)');
    hasWarnings = true;
  }
} else {
  console.log('ℹ️  NODE_ENV is not "production" - using test mode is OK');
}

// Check JWT secret strength
if (process.env.JWT_SECRET) {
  const jwtLength = process.env.JWT_SECRET.length;
  if (jwtLength < 32) {
    console.log(`⚠️  JWT_SECRET: Weak (${jwtLength} chars, recommended: 64+)`);
    hasWarnings = true;
  } else if (jwtLength >= 64) {
    console.log(`✅ JWT_SECRET: Strong (${jwtLength} chars)`);
  } else {
    console.log(`✅ JWT_SECRET: Adequate (${jwtLength} chars)`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('\n💾 Database Connection Test:\n');

// Test database connection
(async () => {
  try {
    const { query } = require('./database/db');
    await query('SELECT NOW() as current_time');
    console.log('✅ Database: Connection successful');

    // Check if admin user exists
    const adminResult = await query(
      "SELECT email, is_premium FROM users WHERE email = 'admin@pdftools.com'"
    );

    if (adminResult.rows.length > 0) {
      console.log('✅ Admin User: Exists in database');
      if (adminResult.rows[0].is_premium) {
        console.log('✅ Admin User: Has premium status');
      } else {
        console.log('⚠️  Admin User: Not premium (should be premium)');
        hasWarnings = true;
      }
    } else {
      console.log('⚠️  Admin User: Not found (run initDatabase.js to create)');
      hasWarnings = true;
    }

    // Check videos table
    const videosResult = await query('SELECT COUNT(*) as count FROM videos');
    const videoCount = parseInt(videosResult.rows[0].count);

    if (videoCount > 0) {
      console.log(`✅ Videos: ${videoCount} video(s) in database`);
    } else {
      console.log('⚠️  Videos: No videos found (run initDatabase.js to add defaults)');
      hasWarnings = true;
    }

  } catch (error) {
    console.log('❌ Database: Connection failed');
    console.log(`   → Error: ${error.message}`);
    hasErrors = true;
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary:\n');

  if (hasErrors) {
    console.log('❌ ERRORS FOUND - Fix these before deploying to production!');
    console.log('\n📝 Common fixes:');
    console.log('   1. Generate new JWT secret:');
    console.log('      node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.log('   2. Change admin password:');
    console.log('      node changeAdminPassword.js YOUR_NEW_PASSWORD');
    console.log('   3. Get Stripe live keys from: https://dashboard.stripe.com/apikeys');
    console.log('   4. Set NODE_ENV=production in your .env file\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  WARNINGS FOUND - Review these before deploying');
    console.log('✅ No critical errors - can deploy with caution\n');
    process.exit(0);
  } else {
    console.log('✅ ALL CHECKS PASSED - Ready for production deployment! 🚀\n');
    process.exit(0);
  }
})();
