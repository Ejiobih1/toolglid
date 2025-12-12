// Script to securely change admin password
require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('./database/db');

const newPassword = process.argv[2];

if (!newPassword) {
  console.log('\n❌ Usage: node changeAdminPassword.js <new_password>\n');
  console.log('   Example: node changeAdminPassword.js MySecurePassword123!\n');
  console.log('💡 Password Requirements:');
  console.log('   - At least 8 characters');
  console.log('   - Mix of letters, numbers, and symbols');
  console.log('   - Avoid common passwords\n');
  process.exit(1);
}

// Password strength validation
if (newPassword.length < 8) {
  console.log('\n❌ Password too short! Must be at least 8 characters.\n');
  process.exit(1);
}

if (!/[A-Z]/.test(newPassword)) {
  console.log('\n⚠️  Warning: Password should contain at least one uppercase letter');
}

if (!/[a-z]/.test(newPassword)) {
  console.log('\n⚠️  Warning: Password should contain at least one lowercase letter');
}

if (!/[0-9]/.test(newPassword)) {
  console.log('\n⚠️  Warning: Password should contain at least one number');
}

if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
  console.log('\n⚠️  Warning: Password should contain at least one special character');
}

// Common weak passwords
const weakPasswords = ['password', 'admin123', '12345678', 'qwerty', 'password123'];
if (weakPasswords.includes(newPassword.toLowerCase())) {
  console.log('\n❌ This password is too common and weak! Choose a stronger password.\n');
  process.exit(1);
}

async function changePassword() {
  try {
    console.log('\n🔐 Changing admin password...\n');

    // Check if admin user exists
    const adminCheck = await query(
      "SELECT id, email FROM users WHERE email = 'admin@pdftools.com'"
    );

    if (adminCheck.rows.length === 0) {
      console.log('❌ Admin user not found in database!');
      console.log('   Run: node database/initDatabase.js to create admin user\n');
      process.exit(1);
    }

    const adminId = adminCheck.rows[0].id;

    // Hash the new password
    console.log('🔒 Hashing password (this may take a moment)...');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the password in database
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, adminId]
    );

    console.log('✅ Admin password updated successfully in database!\n');

    // Generate hash for .env file
    console.log('📝 If you also want to update ADMIN_PASSWORD_HASH in .env:');
    console.log('   Add this line to your .env file:');
    console.log(`   ADMIN_PASSWORD_HASH=${passwordHash}\n`);

    console.log('🎉 Complete! You can now login with:');
    console.log('   Email: admin@pdftools.com');
    console.log(`   Password: ${newPassword}\n`);

    console.log('⚠️  SECURITY REMINDER:');
    console.log('   - Keep this password secure');
    console.log('   - Do not commit it to git');
    console.log('   - Use a password manager\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error changing password:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Check database connection in .env');
    console.error('   2. Ensure backend server is not running (stop it first)');
    console.error('   3. Verify bcrypt is installed: npm install bcrypt\n');
    process.exit(1);
  }
}

changePassword();
