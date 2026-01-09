const { createClient } = require('@supabase/supabase-js');

// IMPORTANT: Use environment variables for production
// NEVER commit these credentials to git
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('ERROR: Missing Supabase credentials!');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  console.error('Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx node create-premium-user.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPremiumUser() {
  console.log('Creating premium test user...');

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'testpremium@pdftools.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {}
  });

  if (authError) {
    console.error('Error creating auth user:', authError.message);
    if (authError.message.includes('already registered')) {
      console.log('User already exists, updating to premium...');

      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === 'testpremium@pdftools.com');

      if (existingUser) {
        // Update to premium
        const { error: updateError } = await supabase
          .from('users')
          .upsert({
            id: existingUser.id,
            email: existingUser.email,
            is_premium: true,
            premium_since: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (updateError) {
          console.error('Error updating user to premium:', updateError.message);
        } else {
          console.log('✅ User updated to premium successfully!');
        }
      }
    }
    return;
  }

  console.log('Auth user created:', authData.user.id);

  // Make user premium in users table
  const { error: dbError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: authData.user.email,
      is_premium: true,
      premium_since: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (dbError) {
    console.error('Error creating user record:', dbError.message);
  } else {
    console.log('✅ Premium user created successfully!');
  }

  console.log('\nTest Account Credentials:');
  console.log('Email: testpremium@pdftools.com');
  console.log('Password: Password123!');
  console.log('Status: Premium ✨');
}

createPremiumUser().catch(console.error);
