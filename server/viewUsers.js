// Quick script to view all users in database
require('dotenv').config();
const { query } = require('./database/db');

async function viewUsers() {
  try {
    console.log('📋 Fetching all users from database...\n');

    const result = await query(`
      SELECT
        id,
        email,
        is_premium,
        premium_since,
        subscription_status,
        stripe_customer_id,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('❌ No users found in database\n');
      process.exit(0);
    }

    console.log(`✅ Found ${result.rows.length} user(s):\n`);
    console.log('─'.repeat(100));

    result.rows.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Premium: ${user.is_premium ? '👑 YES' : '❌ NO'}`);
      console.log(`   Premium Since: ${user.premium_since || 'N/A'}`);
      console.log(`   Subscription: ${user.subscription_status || 'inactive'}`);
      console.log(`   Stripe Customer: ${user.stripe_customer_id || 'N/A'}`);
      console.log(`   Registered: ${new Date(user.created_at).toLocaleString()}`);
    });

    console.log('\n' + '─'.repeat(100));
    console.log(`\n✅ Total Users: ${result.rows.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    process.exit(1);
  }
}

viewUsers();
