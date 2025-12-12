const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const bcrypt = require('bcrypt');

/**
 * Initialize the database with schema and default data
 */
async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database initialization...\n');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing schema.sql...');
    await client.query(schema);
    console.log('✅ Schema created successfully\n');

    // Hash admin password
    const adminPassword = 'admin123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    // Update admin user with proper password hash
    console.log('🔐 Creating admin user...');
    await client.query(
      `INSERT INTO users (email, password_hash, is_premium)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = $2`,
      ['admin@pdftools.com', adminPasswordHash, true]
    );
    console.log('✅ Admin user created/updated');
    console.log('   Email: admin@pdftools.com');
    console.log('   Password: admin123');
    console.log('   (Change this in production!)\n');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
    `);

    console.log('📋 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    // Check default videos
    const videosResult = await client.query('SELECT COUNT(*) FROM videos');
    console.log(`\n📹 Default videos: ${videosResult.rows[0].count} videos loaded`);

    console.log('\n✅ Database initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update .env with your database credentials');
    console.log('   2. Get Stripe API keys from https://dashboard.stripe.com');
    console.log('   3. Run: npm start (to start the server)');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Make sure PostgreSQL is installed and running');
    console.error('   2. Create database: createdb pdf_tools_db');
    console.error('   3. Check credentials in .env file');
    console.error('   4. Ensure PostgreSQL is accepting connections');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
