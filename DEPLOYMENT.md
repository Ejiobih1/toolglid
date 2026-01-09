# PDF Tools App - Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Supabase Account** - [Sign up at supabase.com](https://supabase.com)
2. **Stripe Account** - [Sign up at stripe.com](https://stripe.com)
3. **ConvertAPI Account** - [Sign up at convertapi.com](https://www.convertapi.com)
4. **Deployment Platform** - Railway, Vercel, Netlify, or similar

---

## 🔐 CRITICAL: Security Checklist

**BEFORE DEPLOYING:**

- [ ] Rotate Supabase keys (old ones were exposed in git history)
- [ ] Set all environment variables in deployment platform
- [ ] Remove `.env` file from git (it should only be local)
- [ ] Verify `.env` is in `.gitignore`
- [ ] Never commit credentials to git again

---

## 🔑 Required Environment Variables

### Frontend (React App)

Set these in your deployment platform (Railway, Vercel, Netlify, etc.):

```bash
# Supabase Configuration (REQUIRED)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe Configuration (REQUIRED for payments)
REACT_APP_STRIPE_PRICE_ID=price_xxxxxxxxxxxxx

# Admin Configuration (REQUIRED)
REACT_APP_ADMIN_PASSWORD=your_secure_admin_password_here
```

### Supabase Edge Functions

Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
# For PDF to Word conversion
CONVERTAPI_SECRET=your_convertapi_secret_key

# These are auto-injected by Supabase, no need to set manually:
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
```

### Local Development Scripts

For running `create-premium-user.js` locally:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

---

## 📦 Step-by-Step Deployment

### 1. Set Up Supabase

1. **Create a new Supabase project**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Note down your project URL and anon key

2. **Rotate your Supabase keys** (CRITICAL - old keys were exposed)
   - Go to Settings → API
   - Click "Reset API keys"
   - Update your environment variables with new keys

3. **Set up database tables**
   - Go to SQL Editor
   - Run the schema from `supabase/migrations/` (if exists)
   - Create `users` table with columns: `id`, `email`, `is_premium`, `premium_since`, `created_at`, `updated_at`

4. **Deploy Edge Functions**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref your-project-ref

   # Deploy Edge Functions
   supabase functions deploy pdf-to-word
   supabase functions deploy create-checkout
   ```

5. **Set Edge Function secrets**
   ```bash
   # Set ConvertAPI secret for PDF to Word conversion
   supabase secrets set CONVERTAPI_SECRET=your_convertapi_secret
   ```

6. **Configure Row Level Security (RLS)**
   - Enable RLS on `users` table
   - Add policies to allow users to read their own data
   - Allow service role to update premium status

### 2. Set Up Stripe

1. **Create a Stripe account** at [stripe.com](https://stripe.com)

2. **Create a product and price**
   - Go to Products → Add Product
   - Name: "PDF Tools Premium"
   - Price: $4.99/month (or your price)
   - Copy the Price ID (starts with `price_`)

3. **Set up webhooks** (for premium status updates)
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.deleted`

4. **Get your API keys**
   - Go to Developers → API Keys
   - Copy your Publishable key (for frontend)
   - Copy your Secret key (for Edge Functions)

5. **Set Stripe secrets in Supabase**
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxx
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 3. Set Up ConvertAPI

1. **Sign up at** [convertapi.com](https://www.convertapi.com)

2. **Get your API secret**
   - Go to Dashboard
   - Copy your Secret key

3. **Set in Supabase Edge Functions**
   ```bash
   supabase secrets set CONVERTAPI_SECRET=your_secret_here
   ```

### 4. Deploy Frontend

#### Option A: Deploy to Railway

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the app locally to test**
   ```bash
   npm run build
   ```

3. **Push to GitHub** (make sure `.env` is NOT committed!)

4. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select your repository

5. **Set environment variables in Railway**
   - Go to your project → Variables
   - Add all `REACT_APP_*` variables listed above

6. **Deploy**
   - Railway will automatically build and deploy
   - The `railway.json` config is already set up

#### Option B: Deploy to Vercel

1. **Push to GitHub**

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - New Project → Import from GitHub

3. **Configure build settings**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Set environment variables**
   - Add all `REACT_APP_*` variables

5. **Deploy**

#### Option C: Deploy to Netlify

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=build
   ```

3. **Set environment variables**
   - Go to Site settings → Environment variables
   - Add all `REACT_APP_*` variables

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] App loads without errors
- [ ] Sign up/Login works
- [ ] All PDF tools work (test each one)
- [ ] Stripe checkout redirects properly
- [ ] Premium features are locked for free users
- [ ] PDF to Word conversion works
- [ ] File size validation works (try uploading 100MB file)
- [ ] Admin panel requires password
- [ ] No console errors in browser

---

## 🔧 Troubleshooting

### "Supabase configuration error: Missing environment variables"
- Make sure `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are set
- Rebuild and redeploy after setting variables

### "Payment system is not configured"
- Set `REACT_APP_STRIPE_PRICE_ID` environment variable
- Make sure it starts with `price_`

### "PDF to Word conversion fails"
- Check Supabase Edge Functions logs
- Verify `CONVERTAPI_SECRET` is set in Edge Functions secrets
- Check ConvertAPI account has credits

### Stripe checkout doesn't work
- Verify `create-checkout` Edge Function is deployed
- Check Edge Function logs for errors
- Verify `STRIPE_SECRET_KEY` is set in Edge Functions secrets

### Admin panel won't accept password
- Set `REACT_APP_ADMIN_PASSWORD` environment variable
- Rebuild and redeploy

---

## 🚀 Quick Start (Local Development)

1. **Clone the repo**
   ```bash
   git clone your-repo-url
   cd pdf-tools-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** (DO NOT commit this!)
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your values**
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   REACT_APP_STRIPE_PRICE_ID=price_xxxxx
   REACT_APP_ADMIN_PASSWORD=your_password
   ```

5. **Start dev server**
   ```bash
   npm start
   ```

---

## 📝 Creating a Premium Test User

Use the included script to create a test premium user:

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your_service_role_key"

# Run script
node create-premium-user.js
```

This creates:
- Email: testpremium@pdftools.com
- Password: Password123!
- Premium: Yes ✨

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - Use environment variables only
   - Add `.env` to `.gitignore`

2. **Rotate compromised keys**
   - If keys are exposed, rotate immediately in Supabase dashboard

3. **Use strong passwords**
   - Admin password should be 16+ characters
   - Use a password manager

4. **Enable RLS in Supabase**
   - Protect user data with Row Level Security policies

5. **Monitor logs**
   - Check Supabase logs regularly
   - Set up error monitoring (Sentry, LogRocket, etc.)

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase Edge Function logs
3. Check browser console for errors
4. Verify all environment variables are set correctly

---

## 📄 License

This project is proprietary. All rights reserved.
