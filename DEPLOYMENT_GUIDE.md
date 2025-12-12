# 🚀 Complete Deployment Guide - PDF Tools App

This guide will walk you through deploying your PDF Tools app from development to production.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment (Railway)](#backend-deployment-railway)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Testing Production](#testing-production)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ What You Need

- [ ] Supabase account with database setup (already done ✓)
- [ ] Stripe account with test keys (already done ✓)
- [ ] GitHub account (for deployment)
- [ ] Credit card (for Stripe live mode - no charges yet)
- [ ] Domain name (optional - can use provided URLs)

### ✅ What's Already Complete

- ✓ Backend API with all routes
- ✓ Frontend React app
- ✓ Database schema and initialization
- ✓ Stripe integration
- ✓ Authentication system
- ✓ All hardcoded URLs replaced with environment variables

---

## Environment Setup

### Step 1: Generate Production Secrets

Open a terminal in the project root:

```bash
# Generate a new JWT secret (copy the output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy the output** - you'll need it for environment variables.

### Step 2: Change Admin Password

```bash
cd server
node changeAdminPassword.js YourSecurePassword2025!
```

Replace `YourSecurePassword2025!` with your actual secure password.

### Step 3: Get Stripe Live Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Toggle from "Test mode" to "Live mode" (top right)
3. Click "Reveal live key" for Secret key
4. Copy both:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

⚠️ **IMPORTANT:** Keep these keys secure! Don't share them.

---

## Backend Deployment (Railway)

Railway is the easiest way to deploy your backend with PostgreSQL support.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to login/signup.

### Step 3: Initialize Railway Project

```bash
cd server
railway init
```

- Name your project: `pdf-tools-backend` (or your choice)
- Select "Create a new project"

### Step 4: Deploy Backend

```bash
railway up
```

This will upload and deploy your backend code.

### Step 5: Set Environment Variables

In the Railway dashboard (opens automatically), or via CLI:

```bash
# Required variables
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set DATABASE_URL="postgresql://postgres.abgbzdsjavuhbnyrqdms:ejiobih5399@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
railway variables set JWT_SECRET="PASTE_YOUR_GENERATED_SECRET_HERE"
railway variables set STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY"
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_LIVE_KEY"
railway variables set PREMIUM_MONTHLY_PRICE=4.99
```

**Note:** Replace the values with your actual secrets.

You'll update `FRONTEND_URL` and `STRIPE_WEBHOOK_SECRET` after frontend deployment.

### Step 6: Get Your Backend URL

```bash
railway domain
```

Or check the Railway dashboard - it will be something like:
`https://pdf-tools-backend-production.up.railway.app`

**Copy this URL** - you'll need it for frontend configuration.

---

## Frontend Deployment (Vercel)

Vercel is perfect for React apps with automatic builds and deployments.

### Step 1: Push Code to GitHub (if not already)

```bash
cd ..  # Back to project root
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/pdf-tools-app.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Click "New Project"
4. Import your `pdf-tools-app` repository
5. Configure project:
   - **Framework Preset:** Create React App
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

6. Click "Environment Variables"
7. Add variable:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.railway.app/api`
   - (Replace with your actual Railway backend URL)

8. Click "Deploy"

**Option B: Via Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts, then set environment variable:

```bash
vercel env add REACT_APP_API_URL
# Paste: https://your-backend-url.railway.app/api
```

### Step 3: Get Your Frontend URL

After deployment completes, Vercel will show your URL:
`https://pdf-tools-app.vercel.app` (or your custom domain)

**Copy this URL** - you need to update backend configuration.

---

## Post-Deployment Configuration

### Step 1: Update Backend Environment

Go back to Railway dashboard and add/update:

```bash
railway variables set FRONTEND_URL="https://pdf-tools-app.vercel.app"
```

Replace with your actual Vercel URL.

This triggers a new deployment with updated CORS settings.

### Step 2: Configure Stripe Webhooks

1. Go to https://dashboard.stripe.com/webhooks
2. Switch to "Live mode" (top right toggle)
3. Click "+ Add endpoint"
4. Configure:
   - **Endpoint URL:** `https://your-backend-url.railway.app/api/payments/webhook`
   - **Description:** PDF Tools Premium Subscription
   - **Events to send:**
     - Select "checkout.session.completed"
     - Select "customer.subscription.updated"
     - Select "customer.subscription.deleted"
     - Select "invoice.payment_succeeded"
     - Select "invoice.payment_failed"
5. Click "Add endpoint"
6. Click on the newly created endpoint
7. Click "Signing secret" and reveal it (starts with `whsec_`)
8. Copy the signing secret

### Step 3: Add Webhook Secret to Backend

```bash
railway variables set STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
```

Replace with the actual signing secret from Stripe.

---

## Testing Production

### Step 1: Verify Production Environment

```bash
cd server
node verifyProduction.js
```

All checks should pass ✅

### Step 2: Test Live Deployment

1. **Visit your frontend URL:** `https://pdf-tools-app.vercel.app`

2. **Test Registration:**
   - Click "Login / Register"
   - Create a new account with your email
   - Should successfully register and login

3. **Test Premium Flow:**
   - Click "Upgrade to Premium" button
   - Should redirect to Stripe checkout
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date for expiry
   - Any 3 digits for CVC
   - Any ZIP code
   - Complete payment

4. **Verify Premium Activation:**
   - After successful payment, should redirect back to app
   - Should see crown badge next to email
   - Premium status should be active
   - All features should be unlocked

5. **Test PDF Tools:**
   - Try merging PDFs
   - Try compressing PDFs
   - Try other tools
   - All should work without video requirement

### Step 3: Check Database

```bash
cd server
node viewUsers.js
```

You should see your test account with `is_premium: true`

### Step 4: Test from Different Device

- Open your app on phone or different browser
- Login with the account you created
- Verify premium status persists
- Verify all features work

---

## Troubleshooting

### Issue: "Failed to fetch" error on login

**Cause:** Backend URL not configured correctly in frontend

**Fix:**
1. Check Vercel environment variables
2. Ensure `REACT_APP_API_URL` has `/api` at the end
3. Redeploy frontend: `vercel --prod`

### Issue: Payment succeeds but premium not activated

**Cause:** Webhook not configured or secret is wrong

**Fix:**
1. Check Railway logs: `railway logs`
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Test webhook in Stripe dashboard (Send test webhook)
4. Check webhook URL is publicly accessible

### Issue: CORS errors in browser console

**Cause:** Frontend URL not in backend CORS whitelist

**Fix:**
1. Update Railway: `railway variables set FRONTEND_URL=https://your-frontend.vercel.app`
2. Ensure no trailing slash
3. Wait for Railway to redeploy

### Issue: Database connection timeout

**Cause:** Supabase connection string may have changed or database is paused

**Fix:**
1. Go to Supabase dashboard
2. Check if database is active (free tier pauses after inactivity)
3. Get fresh connection string from Settings > Database
4. Update Railway: `railway variables set DATABASE_URL="new_connection_string"`

### Issue: Webhook receiving 401/403 errors

**Cause:** Webhook signature verification failing

**Fix:**
1. Get fresh webhook secret from Stripe dashboard
2. Update Railway variable
3. Send test webhook from Stripe dashboard

---

## Going Live Checklist

Before announcing your app to real users:

### Security
- [ ] All environment variables use strong, unique values
- [ ] JWT_SECRET is 64+ random characters
- [ ] Admin password is strong and secure
- [ ] Using Stripe LIVE mode keys (not test keys)
- [ ] All URLs use HTTPS
- [ ] Database backups are enabled

### Functionality
- [ ] End-to-end test completed successfully
- [ ] Payment flow tested with real card
- [ ] Webhooks working (premium activates automatically)
- [ ] All PDF tools working
- [ ] Login/logout working
- [ ] Premium badge showing correctly

### Monitoring
- [ ] Set up error tracking (recommended: Sentry)
- [ ] Set up uptime monitoring (recommended: UptimeRobot)
- [ ] Stripe dashboard email notifications enabled
- [ ] Railway/Vercel deployment notifications enabled

### Legal (Important!)
- [ ] Create Privacy Policy
- [ ] Create Terms of Service
- [ ] Create Refund Policy
- [ ] Add links to footer of app
- [ ] Ensure GDPR compliance if serving EU users

### Optional Improvements
- [ ] Custom domain name setup
- [ ] SSL certificate (automatic with Vercel/Railway)
- [ ] Email notifications for users
- [ ] Admin dashboard for user management
- [ ] Analytics (Google Analytics, Plausible, etc.)

---

## Cost Breakdown

### Current Setup (Production Ready)

**Monthly Costs:**
- Supabase Free: $0 (up to 500MB, 2GB bandwidth)
- Railway: ~$5-10 (usage-based, includes $5 credit)
- Vercel Free: $0 (hobby tier, 100GB bandwidth)
- Stripe: 2.9% + $0.30 per transaction only

**Total: $5-10/month + transaction fees**

### Recommended for Scale

If you get 100+ users or need better performance:

**Monthly Costs:**
- Supabase Pro: $25
- Railway: $10-20 (usage-based)
- Vercel Pro: $20 (optional, more bandwidth)
- Stripe: Same transaction fees

**Total: $55-65/month + transaction fees**

---

## Support Resources

### Documentation
- [PRODUCTION_SCRIPTS_READY.md](./PRODUCTION_SCRIPTS_READY.md) - Helper scripts guide
- [PRODUCTION_LAUNCH_CHECKLIST.md](./PRODUCTION_LAUNCH_CHECKLIST.md) - Complete checklist
- [PREMIUM_SYSTEM_READY.md](./PREMIUM_SYSTEM_READY.md) - System overview

### Helper Scripts
```bash
cd server

# Verify production setup
node verifyProduction.js

# View all users
node viewUsers.js

# Change admin password
node changeAdminPassword.js NEW_PASSWORD

# Manually activate premium (testing)
node makePremium.js user@example.com
```

### External Dashboards
- **Railway:** https://railway.app/dashboard
- **Vercel:** https://vercel.com/dashboard
- **Stripe:** https://dashboard.stripe.com
- **Supabase:** https://app.supabase.com

### Getting Help
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.com/docs

---

## Next Steps After Launch

### Week 1
- Monitor Railway and Vercel logs daily
- Check Stripe dashboard for payments
- Test from multiple devices/browsers
- Gather initial user feedback

### Week 2-4
- Analyze user behavior
- Fix any reported bugs
- Consider adding features based on feedback
- Set up analytics if not done

### Monthly
- Review Supabase database usage
- Check Railway/Vercel costs
- Update dependencies: `npm update`
- Review Stripe transactions
- Backup database

### As Needed
- Scale up Supabase if free tier limits reached
- Optimize performance based on monitoring
- Add requested features
- Improve documentation

---

## 🎉 Congratulations!

Your PDF Tools app is now production-ready and deployed!

**What you've built:**
- ✅ Full-stack web application
- ✅ Premium subscription system
- ✅ Secure payment processing
- ✅ Cloud database integration
- ✅ Professional deployment setup

**Quick Deploy Summary:**
1. Backend on Railway: `railway up`
2. Frontend on Vercel: `vercel`
3. Configure webhooks
4. Test end-to-end
5. Launch! 🚀

---

**Need help?** Review the documentation files or check the support resources above.

**Ready to deploy?** Start with [Backend Deployment](#backend-deployment-railway) section!
