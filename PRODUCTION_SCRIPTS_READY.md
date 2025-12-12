# Production Helper Scripts Created

All production readiness scripts and configuration files have been created successfully!

---

## New Files Created

### 1. Server Scripts

#### `server/verifyProduction.js`
**Purpose:** Comprehensive production environment verification script

**Features:**
- Checks all required environment variables
- Validates environment variable formats (JWT secret, Stripe keys, DATABASE_URL)
- Tests database connection
- Verifies admin user exists and has premium status
- Checks video count in database
- Warns about test mode Stripe keys in production
- Security checks for JWT secret strength
- Provides helpful error messages and fixes

**Usage:**
```bash
cd server
node verifyProduction.js
```

**Exit Codes:**
- `0` = All checks passed or warnings only
- `1` = Critical errors found, fix before deploying

---

#### `server/changeAdminPassword.js`
**Purpose:** Securely change admin password

**Features:**
- Password strength validation (length, uppercase, lowercase, numbers, symbols)
- Checks against common weak passwords
- Updates password in database using bcrypt
- Generates hash for .env file
- Provides clear success/error messages

**Usage:**
```bash
cd server
node changeAdminPassword.js YOUR_NEW_PASSWORD
```

**Example:**
```bash
node changeAdminPassword.js SecureAdmin2025!
```

---

### 2. Environment Variable Templates

#### `server/.env.example` (Updated)
**Purpose:** Template for backend environment variables

**Includes:**
- Database configuration (Supabase cloud + local PostgreSQL options)
- Security settings (JWT secret, admin password)
- Stripe API keys (test and live mode examples)
- Frontend URL configuration
- Rate limiting settings
- Complete setup instructions
- Production checklist
- Security notes

**Usage:**
1. Copy to `.env`: `cp .env.example .env`
2. Fill in your values
3. Run `node verifyProduction.js` to verify

---

#### `.env.example` (New - Frontend Root)
**Purpose:** Template for frontend environment variables

**Includes:**
- Backend API URL configuration
- Development vs production examples
- Deployment notes for Vercel, Netlify, GitHub Pages
- Security notes about frontend environment variables

**Usage:**
1. Copy to `.env`: `cp .env.example .env`
2. Update `REACT_APP_API_URL` for production
3. Restart development server: `npm start`

---

### 3. Code Updates

#### `src/services/api.js`
**Updated:** API URL now uses environment variable
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

#### `src/components/AuthModal.js`
**Updated:** Login/register endpoints use environment variable
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

#### `src/App.js`
**Updated:** User authentication endpoint uses environment variable
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

#### `src/pdfUtils.js`
**Updated:** PDF encryption/decryption endpoints use environment variable
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

---

## Quick Start Guide

### Testing Your Production Setup

1. **Verify Backend Environment:**
   ```bash
   cd server
   node verifyProduction.js
   ```

2. **Change Admin Password:**
   ```bash
   cd server
   node changeAdminPassword.js YourSecurePassword123!
   ```

3. **Generate New JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy output and add to `server/.env` as `JWT_SECRET=...`

4. **View All Users:**
   ```bash
   cd server
   node viewUsers.js
   ```

5. **Manually Make User Premium (Testing):**
   ```bash
   cd server
   node makePremium.js user@example.com
   ```

---

## Production Deployment Checklist

### Before Deploying:

**Backend Environment Variables:**
- [ ] Generate new JWT secret (64+ characters)
- [ ] Change admin password
- [ ] Update NODE_ENV to "production"
- [ ] Get Stripe live API keys
- [ ] Update FRONTEND_URL to production domain (HTTPS)
- [ ] Run `node verifyProduction.js` - all checks must pass

**Frontend Environment Variables:**
- [ ] Update REACT_APP_API_URL to production backend URL
- [ ] Ensure URL uses HTTPS
- [ ] Test API connection after deployment

**Database:**
- [ ] Verify Supabase connection is stable
- [ ] Consider upgrading to Supabase paid plan ($25/month)
- [ ] Set up automated backups
- [ ] Test all database queries

**Stripe:**
- [ ] Create product in Stripe dashboard
- [ ] Get live API keys (sk_live_..., pk_live_...)
- [ ] Set up webhook with production backend URL
- [ ] Test payment flow end-to-end

---

## Production Deployment Steps

### Option 1: Railway (Recommended for Backend)

**Backend:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from server directory
cd server
railway init
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=your_supabase_url
railway variables set JWT_SECRET=your_new_secret
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_...
railway variables set FRONTEND_URL=https://your-frontend.com

# Get your backend URL from Railway dashboard
```

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from root directory
cd ..
vercel

# Set environment variable in Vercel dashboard:
# REACT_APP_API_URL=https://your-backend.railway.app/api
```

---

### Option 2: Heroku

**Backend:**
```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login and create app
heroku login
cd server
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your_supabase_url
heroku config:set JWT_SECRET=your_secret
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_...
heroku config:set FRONTEND_URL=https://your-frontend.com

# Deploy
git init
git add .
git commit -m "Deploy to Heroku"
git push heroku master
```

---

## After Deployment

### 1. Configure Stripe Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-backend-url.com/api/payments/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret (starts with `whsec_`)
6. Add to backend environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 2. Test Production System

**End-to-End Test:**
1. Visit your production frontend URL
2. Create a new account
3. Login successfully
4. Click "Upgrade to Premium"
5. Complete Stripe checkout (use live card or test card)
6. Verify premium activation (should see crown badge)
7. Test all PDF tools
8. Test logout/login again

**API Health Check:**
```bash
curl https://your-backend-url.com/api/health
```

### 3. Monitor Errors

**Recommended Monitoring:**
- Sentry for error tracking
- Stripe Dashboard for payment issues
- Supabase Dashboard for database issues
- Server logs (Railway/Heroku dashboard)

---

## Troubleshooting

### Environment Variable Issues
```bash
# Check if variables are set correctly
node verifyProduction.js
```

### Database Connection Issues
```bash
# Test database connection
cd server
node -e "require('./database/db').query('SELECT NOW()').then(r => console.log('OK:', r.rows)).catch(e => console.error('Error:', e.message))"
```

### API Not Connecting
1. Check REACT_APP_API_URL in frontend .env
2. Verify backend is running and accessible
3. Check CORS settings in backend (FRONTEND_URL must match)
4. Check browser console for errors

### Stripe Webhooks Not Working
1. Verify webhook URL is correct and publicly accessible
2. Check webhook signing secret is correct
3. Test webhook delivery in Stripe dashboard
4. Check backend logs for webhook errors

---

## Security Best Practices

### Required for Production:

1. **Strong Secrets:**
   - JWT_SECRET: 64+ random characters
   - Admin password: 12+ characters with mixed case, numbers, symbols

2. **HTTPS Only:**
   - Backend API: HTTPS
   - Frontend URL: HTTPS
   - No mixed content warnings

3. **Environment Variables:**
   - Never commit .env files
   - Use platform environment variable settings
   - Rotate secrets regularly

4. **Database:**
   - Use connection pooling (Supabase pooler)
   - Enable SSL connections
   - Regular backups

5. **Stripe:**
   - Use live keys only in production
   - Verify webhook signatures
   - Handle failed payments gracefully

---

## Cost Estimate

### Free Tier (Development/Small Scale):
- Supabase: Free (500MB, limited connections)
- Railway: $5 credit/month
- Vercel: Free (hobby tier)
- **Total: $0-5/month**

### Production Tier (Recommended):
- Supabase Pro: $25/month
- Railway: $10-20/month (usage-based)
- Vercel Pro: $20/month (optional)
- Stripe: 2.9% + $0.30 per transaction
- **Total: $35-65/month + transaction fees**

---

## Support & Resources

### Documentation:
- [PRODUCTION_LAUNCH_CHECKLIST.md](PRODUCTION_LAUNCH_CHECKLIST.md) - Full launch guide
- [PREMIUM_SYSTEM_READY.md](PREMIUM_SYSTEM_READY.md) - System overview

### Helper Scripts:
- `server/verifyProduction.js` - Verify production readiness
- `server/changeAdminPassword.js` - Change admin password
- `server/viewUsers.js` - View all users
- `server/makePremium.js` - Manually activate premium

### External Resources:
- Stripe Dashboard: https://dashboard.stripe.com
- Supabase Dashboard: https://app.supabase.com
- Railway Dashboard: https://railway.app
- Vercel Dashboard: https://vercel.com/dashboard

---

## Next Steps

1. **Review Production Checklist:**
   - Read [PRODUCTION_LAUNCH_CHECKLIST.md](PRODUCTION_LAUNCH_CHECKLIST.md)

2. **Prepare Environment Variables:**
   - Generate new JWT secret
   - Change admin password
   - Get Stripe live keys

3. **Deploy to Staging:**
   - Test with Stripe test mode first
   - Verify all features work

4. **Deploy to Production:**
   - Switch to Stripe live mode
   - Configure webhooks
   - Test end-to-end

5. **Monitor & Maintain:**
   - Set up error monitoring
   - Regular database backups
   - Update dependencies

---

**Status: Production Scripts Complete! Ready for Deployment Configuration.**

All hardcoded URLs have been replaced with environment variables. Your app is now deployment-ready!
