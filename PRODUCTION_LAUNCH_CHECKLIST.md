# 🚀 Production Launch Checklist

## ✅ What's Already Complete

### Backend Features
- ✅ Express.js server with all routes
- ✅ PostgreSQL database (Supabase cloud)
- ✅ User registration & login (JWT auth)
- ✅ Premium subscription system
- ✅ Stripe payment integration
- ✅ Video management API
- ✅ PDF processing endpoints
- ✅ Security middleware (helmet, rate limiting, CORS)

### Frontend Features
- ✅ Login/Register UI
- ✅ Premium upgrade button
- ✅ User authentication state
- ✅ Video watching system
- ✅ Subscribe/Like/Comment requirements
- ✅ PDF tools (merge, split, compress, etc.)
- ✅ Dark mode
- ✅ Responsive design

### Database
- ✅ Users table with premium tracking
- ✅ Videos table (4 default videos)
- ✅ Payments table for transactions
- ✅ Connected to Supabase cloud

### Testing
- ✅ User registration tested
- ✅ User login tested
- ✅ Stripe checkout tested
- ✅ Premium activation tested
- ✅ Database queries tested

---

## 🔧 Required Before Launch

### 1. Environment Variables for Production

**Backend (.env):**
```env
# CHANGE THESE FOR PRODUCTION:
NODE_ENV=production
JWT_SECRET=GENERATE_NEW_STRONG_SECRET_HERE  # ⚠️ MUST CHANGE!
DATABASE_URL=YOUR_PRODUCTION_DATABASE_URL

# Stripe (keep test keys until ready for real payments)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY  # Change to live when ready
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Update these:
FRONTEND_URL=https://your-domain.com
ADMIN_PASSWORD_HASH=NEW_HASHED_PASSWORD  # Generate new one!
```

**Frontend (.env):**
```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
```

---

### 2. Security Updates

#### A. Change JWT Secret
```bash
# Generate new secret (run this):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and replace `JWT_SECRET` in `.env`

#### B. Change Admin Password
```bash
cd server
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_NEW_STRONG_PASSWORD', 10).then(hash => console.log(hash))"
```
Replace `ADMIN_PASSWORD_HASH` in `.env`

#### C. Update Database Admin Password
```bash
cd server
node changeAdminPassword.js YOUR_NEW_PASSWORD
```

---

### 3. Stripe Configuration

#### A. Switch to Live Mode (when ready for real payments)
1. Go to: https://dashboard.stripe.com
2. Toggle from **Test mode** to **Live mode**
3. Get live API keys: Developers → API Keys
4. Update `.env` with live keys

#### B. Create Product & Price
1. In Stripe Dashboard → Products
2. Click "Add Product"
3. Name: "PDF Tools Premium"
4. Price: $4.99/month (recurring)
5. Copy the Price ID (starts with `price_`)
6. Update `PREMIUM_PRICE_ID` in `.env`

#### C. Set Up Webhooks
1. In Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-backend.com/api/payments/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy "Signing secret" (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in `.env`

---

### 4. Deployment

#### Option A: Railway (Recommended - Easy!)

**Backend Deployment:**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd server
railway init

# 4. Add environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=your_supabase_url
railway variables set JWT_SECRET=your_new_secret
railway variables set STRIPE_SECRET_KEY=your_stripe_key
railway variables set STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
railway variables set FRONTEND_URL=https://your-frontend.com

# 5. Deploy
railway up
```

**Frontend Deployment:**
```bash
# Option 1: Vercel (Easiest)
npm install -g vercel
cd ..  # back to root
vercel

# Option 2: Netlify
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

#### Option B: Heroku

**Backend:**
```bash
# Install Heroku CLI from: https://devcenter.heroku.com/articles/heroku-cli

# Login and create app
heroku login
cd server
heroku create your-app-name

# Add PostgreSQL (or use Supabase)
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
heroku config:set STRIPE_SECRET_KEY=your_key
# ... add all other env vars

# Deploy
git init  # if not already a git repo
git add .
git commit -m "Deploy backend"
git push heroku master
```

**Frontend:**
Same as above (Vercel or Netlify)

---

### 5. Database Setup (Production)

#### If Using Supabase (Current Setup):
✅ **Already done!** Your current Supabase database can be used for production.

**However, consider:**
1. **Upgrade to paid plan** ($25/month) for:
   - More storage
   - Better performance
   - Priority support
2. **Enable row-level security** (optional for extra security)
3. **Set up automated backups**

#### If Switching to Production Database:
1. Create new production database (Supabase Pro or other)
2. Run initialization script:
   ```bash
   cd server
   DATABASE_URL=new_production_url node database/initDatabase.js
   ```
3. Migrate any existing users/data (if needed)

---

### 6. Frontend Updates

#### Update API URLs
Create `src/.env.production`:
```env
REACT_APP_API_URL=https://your-backend-url.com
```

#### Update App.js
Replace hardcoded `http://localhost:5000` with environment variable:

```javascript
// In src/services/api.js, change:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

#### Update Auth URLs
In `src/App.js` line 140 and `src/components/AuthModal.js`, replace:
```javascript
// OLD:
fetch('http://localhost:5000/api/auth/me', ...)

// NEW:
fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/me`, ...)
```

---

### 7. Testing Before Launch

#### Test Checklist:
- [ ] User registration works
- [ ] User login works
- [ ] Logout works
- [ ] Premium upgrade redirects to Stripe
- [ ] Stripe test payment works
- [ ] Webhook activates premium (after deployment)
- [ ] Video watching unlocks tools
- [ ] All PDF tools work
- [ ] Admin login works
- [ ] Database is saving data
- [ ] Mobile responsive design works

#### Load Testing:
```bash
# Install load testing tool
npm install -g loadtest

# Test your API
loadtest -c 10 -n 100 https://your-backend.com/api/health
```

---

### 8. Monitoring & Analytics

#### Add Error Monitoring (Choose one):

**Sentry (Recommended):**
```bash
npm install @sentry/react @sentry/node

# Frontend (src/index.js):
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "YOUR_SENTRY_DSN" });

# Backend (server.js):
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "YOUR_SENTRY_DSN" });
```

#### Add Analytics:
- Google Analytics
- Plausible (privacy-friendly)
- Mixpanel

---

### 9. Performance Optimization

#### Frontend:
```bash
# Build optimized production version
npm run build

# Test build locally
npm install -g serve
serve -s build
```

#### Backend:
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Optimize database queries
- [ ] Add caching (Redis optional)

---

### 10. Legal & Compliance

#### Required Pages:
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Refund Policy
- [ ] Cookie Policy (if using cookies)

#### Stripe Requirements:
- [ ] Business name registered
- [ ] Bank account connected
- [ ] Tax ID provided (if required)

---

## 📋 Quick Launch Script

I'll create scripts to help automate deployment:

### Script 1: Environment Check
```bash
node checkProduction.js
```
(Will create this script to verify all env vars are set)

### Script 2: Database Migration
```bash
node migrateToProduction.js
```
(Will create this to migrate data if needed)

---

## 🎯 Launch Day Checklist

**1 Week Before:**
- [ ] Test all features thoroughly
- [ ] Get Stripe approved for live mode
- [ ] Set up monitoring
- [ ] Create backup strategy

**1 Day Before:**
- [ ] Deploy to production servers
- [ ] Test production environment
- [ ] Set up webhooks
- [ ] Update DNS records

**Launch Day:**
- [ ] Switch Stripe to live mode
- [ ] Monitor server logs
- [ ] Test payment flow with real card
- [ ] Have rollback plan ready

**After Launch:**
- [ ] Monitor errors (Sentry)
- [ ] Check server performance
- [ ] Respond to user feedback
- [ ] Fix any critical bugs immediately

---

## 🚨 Known Issues to Fix

### Critical (Fix Before Launch):
1. **Database Connection Stability** - Supabase connection drops occasionally
   - **Solution**: Implement connection retry logic
2. **API URL Hardcoded** - Frontend has `localhost:5000` hardcoded
   - **Solution**: Use environment variables
3. **No Webhook Handler for Production** - Premium won't activate automatically
   - **Solution**: Already built, just needs webhook URL configured

### Medium Priority:
1. **No Email Verification** - Users can register without email verification
   - **Solution**: Add email verification flow (optional)
2. **No Password Reset** - Users can't reset forgotten passwords
   - **Solution**: Add password reset endpoint
3. **No Admin Dashboard** - Admin page exists but needs auth integration
   - **Solution**: Connect admin page to backend authentication

### Low Priority (Post-Launch):
1. **No user profile page** - Users can't view/edit profile
2. **No subscription management** - Users can't cancel from UI
3. **No payment history** - Users can't see past payments

---

## 💰 Cost Estimate (Monthly)

**Free Tier (Development):**
- Supabase: Free (500MB)
- Stripe: Free (test mode)
- Railway: $5 credit/month
- Vercel: Free
- **Total: $0-5/month**

**Paid Tier (Production - Recommended):**
- Supabase Pro: $25/month
- Railway: ~$10/month (backend hosting)
- Vercel Pro: $20/month (optional)
- Stripe: 2.9% + $0.30 per transaction
- **Total: ~$35-55/month + transaction fees**

---

## 🆘 Emergency Contacts

**If Something Breaks:**
1. Check server logs: `railway logs` or Heroku dashboard
2. Check Stripe dashboard for payment issues
3. Check Supabase logs for database issues
4. Roll back to previous deployment if critical

**Support Resources:**
- Stripe Support: https://support.stripe.com
- Supabase Discord: https://discord.supabase.com
- Railway Discord: https://discord.gg/railway

---

## ✅ Final Pre-Launch Command

Run this to verify everything is ready:
```bash
cd server
node verifyProduction.js  # I'll create this script
```

---

**Status: 🟡 Development Complete - Ready for Production Setup**

**Next Immediate Steps:**
1. Create production environment variables
2. Deploy backend to Railway/Heroku
3. Deploy frontend to Vercel/Netlify
4. Configure Stripe webhooks
5. Test end-to-end in production

**Would you like me to create the helper scripts and start the deployment process?**
