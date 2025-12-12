// Script to manually make a user premium (for testing)
require('dotenv').config();
const { query } = require('./database/db');

const email = process.argv[2];

if (!email) {
  console.log('❌ Usage: node makePremium.js <email>');
  console.log('   Example: node makePremium.js test@example.com');
  process.exit(1);
}

async function makePremium() {
  try {
    console.log(`🔍 Looking for user: ${email}...\n`);

    // Check if user exists
    const userResult = await query(
      'SELECT id, email, is_premium FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      console.log('\n📋 Available users:');
      const allUsers = await query('SELECT email FROM users ORDER BY created_at DESC');
      allUsers.rows.forEach(u => console.log(`   - ${u.email}`));
      process.exit(1);
    }

    const user = userResult.rows[0];

    if (user.is_premium) {
      console.log(`✅ User ${email} is already premium!`);
      process.exit(0);
    }

    // Make user premium
    await query(
      `UPDATE users
       SET is_premium = true,
           premium_since = NOW(),
           subscription_status = 'active'
       WHERE email = $1`,
      [email]
    );

    console.log(`✅ Successfully upgraded ${email} to PREMIUM! 👑\n`);
    console.log('📝 Next steps:');
    console.log('   1. Refresh your browser (Ctrl + Shift + R)');
    console.log('   2. You should see the Premium crown badge');
    console.log('   3. All tools are now unlocked!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makePremium();
