# 🚀 Complete Deployment Guide for Beginners

## What We're Doing
We're deploying your PDF Tools app to the internet:
- **Backend (server)** → Railway (handles database, user accounts, payments)
- **Frontend (website)** → Vercel (what users see and interact with)

**Total Time:** 30-40 minutes
**Cost:** FREE for both platforms

---

## 📋 What You Need Before Starting

1. ✅ GitHub account (you already have this)
2. ✅ Code pushed to GitHub: `https://github.com/Ejiobih1/pdf-tools-app-new` ✓
3. ✅ Supabase account with database (you have this)
4. ⏳ Railway account (we'll create this)
5. ⏳ Vercel account (we'll create this)

---

# PART 1: Deploy Backend to Railway (15-20 minutes)

## Step 1: Create Railway Account

1. Go to **https://railway.app**
2. Click **"Login"** in top right
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub account
5. You'll see the Railway dashboard

---

## Step 2: Create New Project

1. Click the **"New Project"** button (big purple button)
2. Select **"Deploy from GitHub repo"**
3. You'll see a list of your repositories
4. Find and click **"pdf-tools-app-new"**
5. Railway will start analyzing your repository (this takes 10-20 seconds)

---

## Step 3: Configure Backend Settings

After Railway detects your code:

1. Click on the **service card** that appears (shows "pdf-tools-app-new")
2. Click the **"Settings"** tab at the top
3. Scroll down to find **"Root Directory"**
4. Click on it and type: `/server`
5. Press Enter to save
6. Scroll to **"Start Command"** - it should show `npm start` (this is correct)

**Why?** We tell Railway to only deploy the backend folder (`/server`), not the whole project.

---

## Step 4: Add Environment Variables

Still in Railway:

1. Click the **"Variables"** tab at the top
2. Click **"+ New Variable"** button
3. Add these variables ONE BY ONE:

### Variable 1: PORT
```
PORT
3001
```
Click "Add"

### Variable 2: NODE_ENV
```
NODE_ENV
production
```
Click "Add"

### Variable 3: DATABASE_URL

**To get your Supabase connection string:**
1. Open new tab → Go to **https://supabase.com**
2. Sign in and open your project
3. Click **"Project Settings"** (gear icon on left sidebar)
4. Click **"Database"** in the left menu
5. Scroll to **"Connection Pooling"** section
6. Copy the **"Connection string"** (URI format)
   - It looks like: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
7. **IMPORTANT:** Replace `[YOUR-PASSWORD]` with your actual Supabase database password
8. Go back to Railway and add:
```
DATABASE_URL
postgresql://postgres.xxxxx:YOUR_ACTUAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```
Click "Add"

### Variable 4: JWT_SECRET

**Generate a secure random string:**

Option A - Use online generator:
1. Go to: https://www.random.org/strings/
2. Generate 1 string, 64 characters, alphanumeric
3. Copy the generated string

Option B - Use command (if you have Node.js):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to Railway:
```
JWT_SECRET
paste_your_generated_string_here
```
Click "Add"

### Variable 5: FRONTEND_URL

For now, use localhost (we'll update this later):
```
FRONTEND_URL
http://localhost:3000
```
Click "Add"

**Note:** We'll update this after deploying the frontend

---

## Step 5: Get Your Backend URL

1. Still in Railway, click the **"Settings"** tab
2. Scroll down to **"Networking"** or **"Domains"** section
3. Click **"Generate Domain"**
4. Railway will create a URL like: `https://pdf-tools-app-new-production.up.railway.app`
5. **COPY THIS URL** - you'll need it for the frontend!

📝 **Write it down:**
```
My Backend URL: _______________________________________
```

---

## Step 6: Wait for Deployment

1. Click **"Deployments"** tab
2. You'll see the deployment in progress (building...)
3. Wait 2-3 minutes until it shows **"SUCCESS"** with a green checkmark ✓
4. If it shows errors, let me know and we'll fix them together

---

# PART 2: Deploy Frontend to Vercel (10-15 minutes)

## Step 1: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign Up"** (top right)
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. You'll see the Vercel dashboard

---

## Step 2: Import Your Project

1. Click **"Add New..."** button (top right)
2. Select **"Project"**
3. You'll see your GitHub repositories
4. Find **"pdf-tools-app-new"**
5. Click **"Import"** next to it

---

## Step 3: Configure Build Settings

On the "Configure Project" screen:

1. **Project Name:** Leave as `pdf-tools-app-new` (or change if you want)
2. **Framework Preset:** Should auto-detect as "Create React App" ✓
3. **Root Directory:** Leave as `./` (the root - this is correct)
4. **Build Command:** Should show `npm run build` ✓
5. **Output Directory:** Should show `build` ✓

**Don't deploy yet!** We need to add environment variables first.

---

## Step 4: Add Environment Variables

Still on the same configuration screen:

1. Click **"Environment Variables"** section to expand it
2. Add this variable:

### Variable: REACT_APP_API_URL

**Use the Railway backend URL you copied earlier:**

```
Name: REACT_APP_API_URL
Value: https://your-railway-app.up.railway.app
```

**Example:**
```
REACT_APP_API_URL
https://pdf-tools-app-new-production.up.railway.app
```

⚠️ **Important:** Use YOUR actual Railway URL from Step 5 of Part 1!

3. Click **"Add"**

---

## Step 5: Deploy

1. Click the big **"Deploy"** button
2. Vercel will start building your app (takes 2-4 minutes)
3. You'll see a progress screen with logs scrolling
4. Wait for the **"Congratulations!"** screen with confetti 🎉

---

## Step 6: Get Your Frontend URL

1. After successful deployment, Vercel shows your live URL
2. It looks like: `https://pdf-tools-app-new.vercel.app`
3. Click **"Visit"** to see your live app!

📝 **Write it down:**
```
My Frontend URL: _______________________________________
```

---

# PART 3: Connect Frontend & Backend (5 minutes)

## Update Railway Environment Variable

Now we need to tell the backend where the frontend is:

1. Go back to **Railway** (https://railway.app)
2. Open your project
3. Click on the service
4. Go to **"Variables"** tab
5. Find the **`FRONTEND_URL`** variable
6. Click on it and click **"Edit"**
7. Change from `http://localhost:3000` to your Vercel URL:
   ```
   https://pdf-tools-app-new.vercel.app
   ```
8. Click "Update"
9. Railway will automatically redeploy with the new variable (takes 1-2 minutes)

---

# PART 4: Test Your Deployed App (5 minutes)

## Test Checklist

1. **Visit your frontend URL:** `https://pdf-tools-app-new.vercel.app`
2. ✓ Does the page load?
3. ✓ Can you see the PDF tools?
4. ✓ Click "Sign Up" - does the modal appear?
5. ✓ Try creating an account
6. ✓ Try logging in
7. ✓ Click "Get Free Access" - does it ask you to subscribe?
8. ✓ Click the subscribe button - does it open your YouTube channel?

---

# 🎉 Deployment Complete!

## Your Live URLs

**Frontend (Website):**
`https://pdf-tools-app-new.vercel.app`

**Backend (API):**
`https://your-railway-url.up.railway.app`

---

## What to Do Next

### Share Your App
Share your frontend URL with anyone: `https://pdf-tools-app-new.vercel.app`

### Monitor Your Apps

**Railway Dashboard:**
- View backend logs: Railway → Your Project → Logs tab
- Monitor usage: Railway → Your Project → Metrics tab

**Vercel Dashboard:**
- View deployments: Vercel → Your Project → Deployments
- Monitor traffic: Vercel → Your Project → Analytics

### Update Your App

When you make code changes:

1. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push
   ```

2. **Vercel:** Automatically redeploys when you push to GitHub ✓
3. **Railway:** Automatically redeploys when you push to GitHub ✓

**No manual work needed!** Both platforms auto-deploy on every push.

---

## Free Tier Limits

### Railway Free Tier
- ✓ $5 free credits per month
- ✓ 500 hours of runtime per month
- ✓ Good for starting out!

### Vercel Free Tier
- ✓ Unlimited deployments
- ✓ 100 GB bandwidth per month
- ✓ Perfect for personal projects!

---

## Troubleshooting

### "Application Error" on Railway
1. Go to Railway → Logs tab
2. Check for error messages
3. Usually means missing environment variable or database connection issue

### "Page Not Found" on Vercel
1. Check build logs: Vercel → Deployments → Click latest → View logs
2. Make sure build succeeded
3. Check REACT_APP_API_URL is set correctly

### Can't sign up/login
1. Check Railway logs for backend errors
2. Verify DATABASE_URL is correct in Railway
3. Make sure Railway deployment is "Active" (green)

### YouTube subscribe button not working
1. Make sure the URL in `src/components/VideoRequirements.js` is correct:
   `https://www.youtube.com/@militarytechnology001`

---

## Need Help?

If something doesn't work:

1. **Check Railway Logs:** Railway → Your Project → Logs
2. **Check Vercel Logs:** Vercel → Your Project → Deployments → Latest → View Function Logs
3. **Check Browser Console:** Press F12 on your live site → Console tab → Look for errors

---

## Summary of What You Did

✅ Pushed code to GitHub
✅ Deployed backend to Railway
✅ Configured Railway environment variables
✅ Generated Railway domain
✅ Deployed frontend to Vercel
✅ Configured Vercel environment variables
✅ Connected frontend to backend
✅ Tested the live app

**Your app is now LIVE and accessible to anyone on the internet!** 🚀

---

## Important Notes

- **Stripe is disabled** - Premium button shows "Coming Soon"
- **Backend is needed** for user accounts, database, and future Stripe integration
- **Free to run** on both platforms with their free tiers
- **Auto-deploys** whenever you push to GitHub

When you're ready to add Stripe payments later, we'll add those environment variables to Railway.
