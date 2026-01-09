# ⚡ Quick Fix Guide - Get Your App Live in 25 Minutes

**Current Status:** You're 85% done! Just a few quick fixes needed.

---

## 🔴 CRITICAL: Fix Security First (5 minutes)

Your Supabase keys were exposed in git. Must rotate them NOW!

### Step-by-Step:

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/project/abgbzdsjavuhbnyrqdms

2. **Navigate to API Settings**
   - Click "Settings" (gear icon) in left sidebar
   - Click "API"

3. **Reset Your Keys**
   - Scroll to "Project API keys"
   - Click "Reset API keys" button
   - Type `RESET` to confirm
   - Click "I understand, reset project API keys"

4. **Copy Your NEW Keys**
   Copy these and save them:
   - Project URL: `https://abgbzdsjavuhbnyrqdms.supabase.co`
   - anon public key: `eyJ...` (will be different from old one)

5. **Update Your .env File**
   Open `c:\Users\TCG\Desktop\pdf-tools-app\.env`

   Replace this line:
   ```
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   With your NEW key:
   ```
   REACT_APP_SUPABASE_ANON_KEY=your_new_key_here
   ```

6. **Add Admin Password**
   Add this NEW line to `.env`:
   ```bash
   REACT_APP_ADMIN_PASSWORD=MySecurePassword123!
   ```
   (Change to your own secure password)

✅ Security fixed!

---

## 🗄️ Create Users Table (2 minutes)

### Step-by-Step:

1. **Go to SQL Editor**
   - In Supabase Dashboard, click "SQL Editor"
   - Click "New query"

2. **Run the Migration**
   - Open: `c:\Users\TCG\Desktop\pdf-tools-app\supabase\migrations\create_users_table.sql`
   - Copy ALL the SQL code
   - Paste into Supabase SQL Editor
   - Click "Run" (or press F5)

3. **Verify Success**
   You should see:
   ```
   Users table created successfully!
   total_users: 0
   ```

✅ Database ready!

---

## 🧪 Test Locally (5 minutes)

### Step-by-Step:

1. **Start the App**
   ```bash
   cd c:\Users\TCG\Desktop\pdf-tools-app
   npm start
   ```

2. **Test These Features**
   - ✅ App loads without errors
   - ✅ Click "Sign Up" - create test account
   - ✅ Sign in with test account
   - ✅ Upload a PDF file
   - ✅ Try "Merge PDFs" or "Rotate PDF"
   - ✅ Click "Go Premium" - should redirect to Stripe

3. **Check for Errors**
   - Open browser console (press F12)
   - Look at "Console" tab
   - Should have NO red errors

**If you see errors:**
- "Supabase configuration error" → Check you updated .env with NEW key
- "Missing environment variables" → Check REACT_APP_ADMIN_PASSWORD is in .env
- Other errors → Check [SETUP_STATUS.md](SETUP_STATUS.md) troubleshooting section

✅ Local testing complete!

---

## 🚀 Deploy to Railway (10 minutes)

### Step-by-Step:

**If you haven't deployed to Railway yet:**

1. **Push to GitHub First**
   ```bash
   cd c:\Users\TCG\Desktop\pdf-tools-app
   git add .
   git commit -m "Fix security and add missing config"
   git push
   ```

2. **Go to Railway**
   - Visit: https://railway.app
   - Click "New Project"
   - Click "Deploy from GitHub repo"
   - Select your `pdf-tools-app` repository

3. **Add Environment Variables**
   - Click on your project
   - Click "Variables" tab
   - Click "+ New Variable"

   Add these 4 variables:
   ```
   REACT_APP_SUPABASE_URL = https://abgbzdsjavuhbnyrqdms.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = your_NEW_anon_key_here
   REACT_APP_STRIPE_PRICE_ID = price_1ShCLOI2SzREdqkKUTdnDtNc
   REACT_APP_ADMIN_PASSWORD = MySecurePassword123!
   ```

4. **Wait for Deployment**
   - Railway will automatically build and deploy
   - Watch the "Logs" for progress
   - Wait for "Success" message

5. **Get Your Live URL**
   - Go to "Settings" tab
   - Under "Domains", click "Generate Domain"
   - Copy your URL: `https://your-app.up.railway.app`

**If you already have Railway deployed:**

1. **Update Environment Variables**
   - Go to Railway project
   - Click "Variables" tab
   - Update `REACT_APP_SUPABASE_ANON_KEY` with NEW key
   - Add `REACT_APP_ADMIN_PASSWORD` if missing

2. **Redeploy**
   - Railway will auto-redeploy after you save variables
   - Or manually redeploy: Click "Deployments" → "Redeploy"

✅ Deployed!

---

## 🔔 Set Up Stripe Webhook (3 minutes)

### Step-by-Step:

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/webhooks

2. **Add Endpoint**
   - Click "+ Add endpoint" button

   **Endpoint URL:**
   ```
   https://abgbzdsjavuhbnyrqdms.supabase.co/functions/v1/stripe-webhook
   ```

3. **Select Events**
   - Click "Select events" button
   - Find and check these:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.deleted`
     - ✅ `customer.subscription.updated`
   - Click "Add events"

4. **Save**
   - Click "Add endpoint"
   - Done! (The webhook secret is already set in Supabase)

✅ Stripe webhook configured!

---

## ✅ Final Test (5 minutes)

### Test Your Live Site

Visit your Railway URL: `https://your-app.up.railway.app`

**Test checklist:**
- [ ] App loads without errors
- [ ] Can create new account
- [ ] Can sign in
- [ ] Can upload PDF
- [ ] PDF tools work (test any tool)
- [ ] Premium checkout redirects to Stripe
- [ ] Use Stripe test card: `4242 4242 4242 4242`
- [ ] After payment, redirects back to your app
- [ ] User is now premium (check in profile)
- [ ] Admin panel works (`your-url/#/admin`)

**Check browser console:**
- Press F12
- Look at "Console" tab
- Should have NO red errors

✅ Everything working!

---

## 🎉 You're Live!

**Your app is now fully deployed and working!**

### What You Have:
- ✅ Secure Supabase backend
- ✅ Working payment system (Stripe)
- ✅ PDF tools functioning
- ✅ User authentication
- ✅ Premium subscription management
- ✅ Admin panel
- ✅ Serverless architecture (scales automatically)

### Your URLs:
- **Live Site:** `https://your-app.up.railway.app`
- **Supabase Dashboard:** https://app.supabase.com/project/abgbzdsjavuhbnyrqdms
- **Stripe Dashboard:** https://dashboard.stripe.com

### Keep These Safe:
- Your new Supabase anon key
- Your admin password
- Your Stripe secret key (already in Supabase)

---

## 🔄 Need to Make Changes?

**Update environment variables:**
1. Update in `.env` (for local)
2. Update in Railway Variables (for production)
3. Redeploy Railway

**Update code:**
1. Make changes locally
2. Test with `npm start`
3. Commit and push to GitHub
4. Railway auto-deploys

**Check logs:**
- **Railway:** Project → Deployments → Click deployment → Logs
- **Supabase:** Dashboard → Logs
- **Stripe:** Dashboard → Developers → Webhooks → Click endpoint → Events

---

## 📞 Still Stuck?

Check these in order:

1. **Railway Logs**
   - Shows deployment errors
   - Shows if environment variables are missing

2. **Browser Console** (F12 → Console)
   - Shows frontend JavaScript errors
   - Shows API call errors

3. **Supabase Logs**
   - Shows Edge Function errors
   - Shows database errors

4. **Stripe Dashboard**
   - Check if webhooks are being received
   - Check payment status

**Common fixes:**
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Verify all environment variables are set in Railway
- Check that Supabase keys match between .env and Railway
- Make sure users table was created

---

**Total Time:** 25 minutes
**Difficulty:** Easy - just copy/paste and click buttons!

**Good luck! 🚀**
