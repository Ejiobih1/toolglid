# 🚀 Complete Launch Guide - PDF Tools App

Step-by-step guide to deploy your PDF Tools app to production.

---

## 📋 Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Prepare Environment Variables](#prepare-environment-variables)
3. [Deploy Backend (Railway)](#deploy-backend-railway)
4. [Deploy Frontend (Vercel)](#deploy-frontend-vercel)
5. [Configure Stripe Webhooks](#configure-stripe-webhooks)
6. [Test Production](#test-production)
7. [Go Live](#go-live)
8. [Post-Launch Monitoring](#post-launch-monitoring)

---

## Pre-Launch Checklist

### ✅ What You Need Before Starting:

- [ ] **GitHub Account** (for deploying code)
- [ ] **Stripe Account** (already have test keys)
- [ ] **Supabase Account** (already set up)
- [ ] **Credit/Debit Card** (for Stripe live mode verification)
- [ ] **Your YouTube Channel** (already configured)

### ✅ What's Already Done:

- ✅ Backend API built and tested
- ✅ Frontend app built and tested
- ✅ Database connected (Supabase)
- ✅ Stripe test mode working
- ✅ Video watching system working
- ✅ Subscribe requirement working
- ✅ Video skip prevention working

---

## Step 1: Prepare Environment Variables

### 1.1 Generate Production JWT Secret

Open a terminal and run:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy the output** - you'll need this for backend deployment.

Example output:
```
a7f3c8d2e9b4f1a6c3d8e2f7b9a4c1d6e3f8a2b7c4d1e6f9a3c8b2d7e1f4a9c6
```

### 1.2 Change Admin Password

```bash
cd server
node changeAdminPassword.js YourSecurePassword2025!
```

Replace `YourSecurePassword2025!` with your actual secure password.

### 1.3 Get Stripe Live Keys

1. Go to: https://dashboard.stripe.com/apikeys
2. **Toggle to "Live mode"** (top right corner - switch from test to live)
3. Click **"Reveal live key"** for Secret key
4. Copy both keys:
   - **Publishable key:** Starts with `pk_live_...`
   - **Secret key:** Starts with `sk_live_...`

⚠️ **IMPORTANT:** Keep these keys safe! Don't share them.

---

## Step 2: Push Code to GitHub

### 2.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `pdf-tools-app` (or your choice)
3. Keep it **Private** (recommended)
4. Don't initialize with README (we already have code)
5. Click **"Create repository"**

### 2.2 Push Your Code

Open terminal in project root:

```bash
# Initialize git (if not already done)
git init

# Add .gitignore to exclude sensitive files
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "*.log" >> .gitignore

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for production deployment"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/pdf-tools-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Your code is now on GitHub!** ✅

---

## Step 3: Deploy Backend (Railway)

Railway is the easiest platform for deploying your Node.js backend.

### 3.1 Sign Up for Railway

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended)
4. Authorize Railway to access your repositories

### 3.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `pdf-tools-app`
4. Railway will detect it's a Node.js app

### 3.3 Configure Backend

1. Click on the deployed service
2. Go to **"Settings"** tab
3. Set **Root Directory:** `server`
4. Set **Start Command:** `npm start`
5. Click **"Save"**

### 3.4 Add Environment Variables

Click on **"Variables"** tab, then add these one by one:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.abgbzdsjavuhbnyrqdms:ejiobih5399@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=PASTE_YOUR_GENERATED_SECRET_FROM_STEP_1.1
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
PREMIUM_MONTHLY_PRICE=4.99
```

**Important:**
- Use YOUR JWT secret from Step 1.1
- Use YOUR Stripe LIVE keys from Step 1.3
- Leave FRONTEND_URL empty for now (we'll add it after frontend deployment)
- Leave STRIPE_WEBHOOK_SECRET empty for now (we'll add it later)

### 3.5 Deploy Backend

1. Click **"Deploy"** (or it auto-deploys)
2. Wait 2-3 minutes for deployment
3. You'll see logs in the **"Deployments"** tab

### 3.6 Get Backend URL

1. Go to **"Settings"** tab
2. Click **"Generate Domain"** under "Domains"
3. Copy your backend URL (example: `pdf-tools-backend.up.railway.app`)

**Save this URL!** You need it for frontend deployment.

---

## Step 4: Deploy Frontend (Vercel)

Vercel is perfect for React apps with automatic builds.

### 4.1 Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Sign up with **GitHub**
3. Authorize Vercel to access your repositories

### 4.2 Import Project

1. Click **"New Project"**
2. Click **"Import"** next to your `pdf-tools-app` repository
3. Vercel detects it's a React app

### 4.3 Configure Project

**Framework Preset:** Create React App (should be auto-detected)

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

**Root Directory:** Leave as `./` (not `server`)

### 4.4 Add Environment Variables

Click **"Environment Variables"**, then add:

**Name:** `REACT_APP_API_URL`
**Value:** `https://YOUR-BACKEND-URL.railway.app/api`

Replace `YOUR-BACKEND-URL` with your actual Railway backend URL from Step 3.6.

Example:
```
REACT_APP_API_URL=https://pdf-tools-backend.up.railway.app/api
```

⚠️ **Make sure to include `/api` at the end!**

### 4.5 Deploy Frontend

1. Click **"Deploy"**
2. Wait 2-3 minutes for build and deployment
3. You'll get a URL like: `pdf-tools-app.vercel.app`

**Your frontend is now live!** 🎉

---

## Step 5: Update Backend with Frontend URL

Now that you have your frontend URL, update the backend:

### 5.1 Add FRONTEND_URL to Railway

1. Go back to Railway dashboard
2. Click on your backend service
3. Go to **"Variables"** tab
4. Add new variable:
   - **Name:** `FRONTEND_URL`
   - **Value:** `https://pdf-tools-app.vercel.app` (your Vercel URL)

5. Click **"Save"**
6. Railway will automatically redeploy

---

## Step 6: Configure Stripe Webhooks

Webhooks are needed for automatic premium activation after payment.

### 6.1 Create Webhook in Stripe

1. Go to https://dashboard.stripe.com/webhooks
2. Make sure you're in **"Live mode"** (top right)
3. Click **"+ Add endpoint"**

### 6.2 Configure Webhook

**Endpoint URL:** `https://YOUR-BACKEND-URL.railway.app/api/payments/webhook`

Replace `YOUR-BACKEND-URL` with your Railway backend URL.

Example:
```
https://pdf-tools-backend.up.railway.app/api/payments/webhook
```

**Events to send:** Click "Select events" and choose:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

Click **"Add endpoint"**

### 6.3 Get Webhook Secret

1. Click on the webhook you just created
2. Click **"Reveal"** under "Signing secret"
3. Copy the secret (starts with `whsec_`)

### 6.4 Add Webhook Secret to Railway

1. Go to Railway dashboard
2. Click on your backend service
3. Go to **"Variables"** tab
4. Add new variable:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_YOUR_WEBHOOK_SECRET`

5. Click **"Save"**
6. Railway will redeploy

---

## Step 7: Test Production

Before announcing your app, test everything end-to-end.

### 7.1 Clear Browser Data

1. Open your production URL: `https://pdf-tools-app.vercel.app`
2. Press **F12** to open DevTools
3. Go to **Application** tab
4. Click **Local Storage** > Your domain
5. Click **"Clear All"**
6. Refresh the page

### 7.2 Test as New User

**Step-by-step test:**

1. ✅ **Visit your app:** Open `https://pdf-tools-app.vercel.app`
2. ✅ **Click any locked PDF tool** (e.g., "Merge PDF")
3. ✅ **See modal:** "Watch Video to Unlock"
4. ✅ **Choose a video** (e.g., "Military Drones - 3 min")
5. ✅ **See subscribe screen:** "Before you watch..."
6. ✅ **Click "Open YouTube Channel"** → Opens your channel
7. ✅ **Subscribe to your channel** on YouTube
8. ✅ **Go back to app,** check "I have subscribed"
9. ✅ **Click "Start Video"**
10. ✅ **Video plays** - try to skip (should be blocked)
11. ✅ **Wait 3 minutes** for video to finish
12. ✅ **Click "Unlock 3h Access"**
13. ✅ **Modal closes,** tools are unlocked
14. ✅ **Use a PDF tool** - should work!

### 7.3 Test Premium Subscription

1. ✅ **Click "Upgrade to Premium"** in any modal
2. ✅ **See login/register modal**
3. ✅ **Create account** with your email
4. ✅ **Redirected to Stripe checkout**
5. ✅ **Use REAL credit card** (will charge $4.99)
6. ✅ **Complete payment**
7. ✅ **Redirected back to app**
8. ✅ **Should see crown badge** next to email
9. ✅ **Premium status active** - no video watching needed
10. ✅ **Tools always unlocked**

⚠️ **You'll be charged $4.99** - this is a real payment to test the system.

### 7.4 Test from Different Devices

- ✅ Test on mobile phone
- ✅ Test on different browser
- ✅ Test on incognito/private mode

---

## Step 8: Go Live! 🚀

### 8.1 Verify Everything Works

Before announcing:

- [ ] ✅ Subscribe flow works
- [ ] ✅ Video watching works
- [ ] ✅ Cannot skip video
- [ ] ✅ Premium payment works
- [ ] ✅ Premium activates automatically
- [ ] ✅ All PDF tools work
- [ ] ✅ Mobile experience works
- [ ] ✅ No console errors

### 8.2 Optional: Get Custom Domain

**Using Vercel:**
1. Buy domain (from Namecheap, GoDaddy, etc.)
2. Go to Vercel project > Settings > Domains
3. Add your domain (e.g., `pdftools.com`)
4. Update DNS records as instructed
5. Wait for DNS propagation (up to 48 hours)

**Update Railway FRONTEND_URL:**
- Change from `pdf-tools-app.vercel.app`
- To your custom domain: `https://pdftools.com`

### 8.3 Announce Your App

Share your app:
- 📱 Social media
- 🎬 YouTube community post
- 📧 Email newsletter
- 🌐 Product Hunt (optional)

**Your live URL:** `https://pdf-tools-app.vercel.app` (or your custom domain)

---

## Step 9: Post-Launch Monitoring

### 9.1 Monitor Stripe Dashboard

Check daily:
- New subscriptions
- Payment failures
- Cancellations
- Revenue

Dashboard: https://dashboard.stripe.com

### 9.2 Monitor Railway Logs

Check for errors:
1. Go to Railway dashboard
2. Click your backend service
3. Check **"Logs"** tab
4. Look for errors or issues

### 9.3 Monitor Supabase Database

Check database health:
1. Go to https://app.supabase.com
2. Click your project
3. Check **"Database"** > **"Tables"**
4. View users and payments

### 9.4 Check Analytics (Optional)

Add Google Analytics:
1. Create GA4 property
2. Add tracking code to `public/index.html`
3. Redeploy frontend

---

## 💰 Cost Breakdown

### Monthly Costs:

**Free Tier (First Month):**
- Railway: $5 free credit
- Vercel: Free
- Supabase: Free (up to 500MB)
- **Total: $0**

**After Free Credits:**
- Railway: ~$5-10/month
- Vercel: Free (or $20 for Pro)
- Supabase: Free or $25/month (Pro)
- Stripe: 2.9% + $0.30 per transaction
- **Total: $5-35/month + transaction fees**

**Revenue Potential:**
- 10 subscribers × $4.99 = $49.90/month
- 50 subscribers × $4.99 = $249.50/month
- 100 subscribers × $4.99 = $499/month

---

## 🆘 Troubleshooting

### Frontend shows "Failed to fetch"

**Problem:** Frontend can't connect to backend

**Solution:**
1. Check `REACT_APP_API_URL` in Vercel is correct
2. Make sure it ends with `/api`
3. Check Railway backend is running
4. Check `FRONTEND_URL` in Railway is correct

### Premium doesn't activate after payment

**Problem:** Webhook not working

**Solution:**
1. Check webhook URL is correct in Stripe
2. Check `STRIPE_WEBHOOK_SECRET` is set in Railway
3. Test webhook in Stripe dashboard (Send test event)
4. Check Railway logs for webhook errors

### Video not playing

**Problem:** Video ID might be wrong

**Solution:**
1. Go to admin page: `?admin=true`
2. Login with admin credentials
3. Update video IDs with real YouTube video IDs

### Database connection errors

**Problem:** Supabase connection string wrong

**Solution:**
1. Go to Supabase dashboard
2. Settings > Database
3. Copy fresh connection string (Connection Pooling)
4. Update `DATABASE_URL` in Railway

---

## 📚 Important Links

### Your Services:
- **Frontend:** https://pdf-tools-app.vercel.app
- **Backend:** https://YOUR-BACKEND.railway.app
- **YouTube:** https://www.youtube.com/@militarytechnology001

### Dashboards:
- **Railway:** https://railway.app/dashboard
- **Vercel:** https://vercel.com/dashboard
- **Stripe:** https://dashboard.stripe.com
- **Supabase:** https://app.supabase.com

### Documentation:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [PRODUCTION_SCRIPTS_READY.md](PRODUCTION_SCRIPTS_READY.md)
- [SUBSCRIBE_AND_WATCH_UPDATE.md](SUBSCRIBE_AND_WATCH_UPDATE.md)
- [VIDEO_SKIP_PREVENTION_FIX.md](VIDEO_SKIP_PREVENTION_FIX.md)

---

## ✅ Launch Checklist Summary

### Pre-Deployment:
- [ ] Generate JWT secret
- [ ] Change admin password
- [ ] Get Stripe live keys
- [ ] Push code to GitHub

### Backend (Railway):
- [ ] Create Railway account
- [ ] Deploy backend
- [ ] Add environment variables
- [ ] Get backend URL

### Frontend (Vercel):
- [ ] Create Vercel account
- [ ] Deploy frontend
- [ ] Add REACT_APP_API_URL
- [ ] Get frontend URL

### Configuration:
- [ ] Update FRONTEND_URL in Railway
- [ ] Create Stripe webhook
- [ ] Add STRIPE_WEBHOOK_SECRET to Railway

### Testing:
- [ ] Test subscribe flow
- [ ] Test video watching
- [ ] Test skip prevention
- [ ] Test premium payment
- [ ] Test on mobile

### Go Live:
- [ ] Verify everything works
- [ ] Announce your app
- [ ] Monitor dashboards

---

## 🎉 Congratulations!

Your PDF Tools app is now **LIVE and RUNNING** in production!

**What you've accomplished:**
- ✅ Full-stack web application
- ✅ Premium subscription system
- ✅ Stripe payment integration
- ✅ YouTube channel growth tool
- ✅ Cloud database
- ✅ Professional deployment

**Next steps:**
1. Share your app with users
2. Monitor growth and revenue
3. Gather feedback
4. Add new features
5. Scale as needed

---

**Need Help?**
- Check troubleshooting section above
- Review documentation files
- Check platform dashboards for logs
- Test in incognito mode to isolate issues

**Good luck with your launch! 🚀**

---

**Last Updated:** December 8, 2025
**Status:** Ready for Production Launch
**Deployment:** Railway + Vercel
**Payment:** Stripe Live Mode
