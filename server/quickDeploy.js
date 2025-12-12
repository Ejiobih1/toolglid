// Quick Deploy Helper Script
// This script helps you prepare for production deployment

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 PDF Tools - Quick Deploy Helper\n');
console.log('='.repeat(80));
console.log('\nThis script will help you prepare for production deployment.\n');

// Step 1: Generate JWT Secret
console.log('📝 Step 1: Generate JWT Secret\n');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('Generated JWT Secret (copy this):');
console.log('─'.repeat(80));
console.log(jwtSecret);
console.log('─'.repeat(80));
console.log('\n✅ Add this to your Railway environment variables as JWT_SECRET\n');

// Step 2: Admin Password
console.log('='.repeat(80));
console.log('\n📝 Step 2: Change Admin Password\n');
console.log('After this script completes, run:');
console.log('  node changeAdminPassword.js YOUR_NEW_SECURE_PASSWORD\n');

// Step 3: Stripe Keys
console.log('='.repeat(80));
console.log('\n📝 Step 3: Get Stripe Live Keys\n');
console.log('1. Go to: https://dashboard.stripe.com/apikeys');
console.log('2. Toggle to "Live mode" (top right)');
console.log('3. Copy your Publishable key (pk_live_...)');
console.log('4. Reveal and copy your Secret key (sk_live_...)\n');

// Step 4: Deployment Platforms
console.log('='.repeat(80));
console.log('\n📝 Step 4: Choose Deployment Platform\n');
console.log('Backend Options:');
console.log('  A. Railway (Recommended)');
console.log('     - Easy setup with CLI');
console.log('     - $5/month free credit');
console.log('     - Command: npm install -g @railway/cli');
console.log('');
console.log('  B. Heroku');
console.log('     - Well-established platform');
console.log('     - Free tier available');
console.log('     - Command: Install from https://devcenter.heroku.com/articles/heroku-cli');
console.log('');
console.log('Frontend Options:');
console.log('  A. Vercel (Recommended)');
console.log('     - Perfect for React apps');
console.log('     - Free hobby tier');
console.log('     - Command: npm install -g vercel');
console.log('');
console.log('  B. Netlify');
console.log('     - Good alternative to Vercel');
console.log('     - Free tier available');
console.log('     - Command: npm install -g netlify-cli\n');

// Step 5: Environment Variables Summary
console.log('='.repeat(80));
console.log('\n📝 Step 5: Environment Variables Summary\n');
console.log('Backend (Railway/Heroku) needs these variables:');
console.log('─'.repeat(80));
console.log('NODE_ENV=production');
console.log('PORT=5000');
console.log(`DATABASE_URL=<your_supabase_connection_string>`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('STRIPE_SECRET_KEY=sk_live_...');
console.log('STRIPE_PUBLISHABLE_KEY=pk_live_...');
console.log('STRIPE_WEBHOOK_SECRET=whsec_... (after webhook setup)');
console.log('PREMIUM_MONTHLY_PRICE=4.99');
console.log('FRONTEND_URL=https://your-frontend-url.vercel.app');
console.log('─'.repeat(80));
console.log('\nFrontend (Vercel/Netlify) needs:');
console.log('─'.repeat(80));
console.log('REACT_APP_API_URL=https://your-backend-url.railway.app/api');
console.log('─'.repeat(80));

// Step 6: Deployment Commands
console.log('\n='.repeat(80));
console.log('\n📝 Step 6: Quick Deployment Commands\n');

console.log('For Railway + Vercel (Recommended):');
console.log('─'.repeat(80));
console.log('# 1. Install CLIs');
console.log('npm install -g @railway/cli vercel');
console.log('');
console.log('# 2. Deploy Backend');
console.log('cd server');
console.log('railway login');
console.log('railway init');
console.log('railway up');
console.log('railway variables set NODE_ENV=production');
console.log('railway variables set DATABASE_URL="YOUR_SUPABASE_URL"');
console.log(`railway variables set JWT_SECRET="${jwtSecret}"`);
console.log('railway variables set STRIPE_SECRET_KEY="sk_live_..."');
console.log('railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."');
console.log('railway variables set PREMIUM_MONTHLY_PRICE=4.99');
console.log('railway domain  # Get your backend URL');
console.log('');
console.log('# 3. Deploy Frontend');
console.log('cd ..');
console.log('vercel login');
console.log('vercel');
console.log('# Add environment variable in Vercel dashboard:');
console.log('# REACT_APP_API_URL=https://your-backend.railway.app/api');
console.log('─'.repeat(80));

// Final checklist
console.log('\n='.repeat(80));
console.log('\n✅ Pre-Deployment Checklist\n');
console.log('Before deploying, make sure you have:');
console.log('  [ ] Supabase database with data initialized');
console.log('  [ ] Stripe account (can start in test mode)');
console.log('  [ ] GitHub account (for Vercel deployment)');
console.log('  [ ] Changed admin password');
console.log('  [ ] Tested locally (npm start in both frontend and backend)');
console.log('  [ ] Read DEPLOYMENT_GUIDE.md for detailed instructions\n');

console.log('='.repeat(80));
console.log('\n📚 Next Steps\n');
console.log('1. Save the JWT_SECRET shown above');
console.log('2. Change admin password: node changeAdminPassword.js PASSWORD');
console.log('3. Run verification: node verifyProduction.js');
console.log('4. Follow DEPLOYMENT_GUIDE.md for deployment\n');

console.log('='.repeat(80));
console.log('\n💡 Helpful Documentation\n');
console.log('  - DEPLOYMENT_GUIDE.md - Complete deployment walkthrough');
console.log('  - PRODUCTION_SCRIPTS_READY.md - Helper scripts guide');
console.log('  - PRODUCTION_LAUNCH_CHECKLIST.md - Full launch checklist');
console.log('  - server/.env.example - Environment variables template\n');

console.log('='.repeat(80));
console.log('\n🎉 Ready to Deploy!\n');

rl.question('Press Enter to exit...', () => {
  rl.close();
  process.exit(0);
});
