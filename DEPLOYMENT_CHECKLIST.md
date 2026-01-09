# 📋 Deployment Checklist - Quick Reference

Print this and check off each step as you complete it!

---

## ☑️ BEFORE YOU START

- [ ] Create account at [supabase.com](https://supabase.com)
- [ ] Create account at [railway.app](https://railway.app)
- [ ] Create account at [stripe.com](https://stripe.com)
- [ ] Create account at [convertapi.com](https://convertapi.com)
- [ ] Create account at [github.com](https://github.com)
- [ ] Create a text file to save all your credentials

---

## ☑️ PART 1: SUPABASE SETUP

- [ ] Create new Supabase project
- [ ] Wait for project to be ready (2-3 minutes)
- [ ] Go to Settings → API
- [ ] **CRITICAL:** Click "Reset API keys" and confirm
- [ ] Copy NEW Project URL → Save to text file
- [ ] Copy NEW anon public key → Save to text file
- [ ] Go to SQL Editor → New Query
- [ ] Paste and run the users table creation script
- [ ] Verify "Success. No rows returned"

**Credentials saved:**
```
Supabase URL: ________________
Supabase Anon Key: ________________
```

---

## ☑️ PART 2: STRIPE SETUP

- [ ] Sign up for Stripe account
- [ ] Skip onboarding (click "I'll do this later")
- [ ] Click "Products" → "+ Add product"
- [ ] Fill in product details (name, price $4.99/month)
- [ ] Click "Save product"
- [ ] Copy Price ID (starts with `price_`) → Save to text file
- [ ] Click "Developers" → "API keys"
- [ ] Copy Secret key (`sk_test_xxxxx`) → Save to text file

**Credentials saved:**
```
Stripe Price ID: ________________
Stripe Secret Key: ________________
```

---

## ☑️ PART 3: CONVERTAPI SETUP

- [ ] Sign up for ConvertAPI account
- [ ] Verify your email
- [ ] Copy your Secret from dashboard → Save to text file

**Credentials saved:**
```
ConvertAPI Secret: ________________
```

---

## ☑️ PART 4: SUPABASE EDGE FUNCTIONS

- [ ] Install Supabase CLI (`npm install -g supabase`)
- [ ] Run `supabase login` in terminal
- [ ] Authorize in browser
- [ ] Run `supabase link` in project folder
- [ ] Enter project ref and database password
- [ ] Create `supabase/functions/pdf-to-word/index.ts`
- [ ] Create `supabase/functions/create-checkout/index.ts`
- [ ] Create `supabase/functions/stripe-webhook/index.ts`
- [ ] Run `supabase functions deploy pdf-to-word`
- [ ] Run `supabase functions deploy create-checkout`
- [ ] Run `supabase functions deploy stripe-webhook`
- [ ] Set ConvertAPI secret: `supabase secrets set CONVERTAPI_SECRET=xxx`
- [ ] Set Stripe secret: `supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx`

---

## ☑️ PART 5: LOCAL SETUP

- [ ] Copy `.env.example` to `.env`
- [ ] Open `.env` in text editor
- [ ] Fill in `REACT_APP_SUPABASE_URL`
- [ ] Fill in `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Fill in `REACT_APP_STRIPE_PRICE_ID`
- [ ] Fill in `REACT_APP_ADMIN_PASSWORD` (create strong password)
- [ ] Save `.env` file
- [ ] Run `npm install` (if you haven't already)
- [ ] Run `npm start`
- [ ] Test app at http://localhost:3000
- [ ] Test sign up
- [ ] Test PDF tool (any tool)
- [ ] Test premium checkout button

---

## ☑️ PART 6: GITHUB

- [ ] Create new repository on GitHub (make it Private)
- [ ] Run `git init` in project folder
- [ ] Run `git add .`
- [ ] Run `git commit -m "Initial commit"`
- [ ] Run `git remote add origin https://github.com/yourusername/pdf-tools-app.git`
- [ ] Run `git branch -M main`
- [ ] Run `git push -u origin main`
- [ ] **VERIFY:** Check `.env` is NOT in GitHub (should be ignored)

---

## ☑️ PART 7: RAILWAY DEPLOYMENT

- [ ] Go to railway.app
- [ ] Click "Start a New Project"
- [ ] Click "Deploy from GitHub repo"
- [ ] Select your `pdf-tools-app` repository
- [ ] Wait for initial deploy
- [ ] Click "Variables" tab
- [ ] Add variable: `REACT_APP_SUPABASE_URL`
- [ ] Add variable: `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Add variable: `REACT_APP_STRIPE_PRICE_ID`
- [ ] Add variable: `REACT_APP_ADMIN_PASSWORD`
- [ ] Wait for automatic redeploy
- [ ] Go to Settings → Domains
- [ ] Click "Generate Domain"
- [ ] Copy your live URL → Save to text file

**Live URL:**
```
https://________________.up.railway.app
```

---

## ☑️ PART 8: STRIPE WEBHOOKS

- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Enter URL: `https://yourproject.supabase.co/functions/v1/stripe-webhook`
- [ ] Click "Select events"
- [ ] Check: `checkout.session.completed`
- [ ] Check: `customer.subscription.deleted`
- [ ] Check: `customer.subscription.updated`
- [ ] Click "Add events" → "Add endpoint"
- [ ] Click "Reveal" under Signing secret
- [ ] Copy webhook secret (`whsec_xxx`)
- [ ] Run `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx`

---

## ☑️ FINAL TESTING

**Visit your live Railway URL and test:**

- [ ] App loads without errors
- [ ] Can sign up with new email
- [ ] Can sign in
- [ ] Upload PDF - test Merge tool
- [ ] Upload PDF - test Rotate tool
- [ ] Upload PDF - test Crop tool
- [ ] Try uploading 100MB file (should reject)
- [ ] Click "Go Premium" → Should redirect to Stripe
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Complete checkout → Should redirect back
- [ ] Visit `your-url/#/admin` → Enter admin password
- [ ] Open browser console (F12) → Check for errors

---

## ☑️ POST-LAUNCH

- [ ] Test subscription with Stripe test card
- [ ] Verify user becomes premium after payment
- [ ] Set up email notifications (optional)
- [ ] Add custom domain (optional)
- [ ] Set up monitoring/analytics (optional)
- [ ] Create backup strategy for database
- [ ] Document your admin password somewhere safe
- [ ] Keep text file with all credentials in safe place

---

## 🆘 IF SOMETHING DOESN'T WORK

**Check these common issues:**

- [ ] All environment variables are set in Railway?
- [ ] Edge Functions are deployed? (`supabase functions list`)
- [ ] Edge Function secrets are set? (`supabase secrets list`)
- [ ] Used NEW Supabase keys (after reset)?
- [ ] Price ID starts with `price_`?
- [ ] `.env` file exists locally?
- [ ] No errors in Railway logs?
- [ ] No errors in Supabase logs?
- [ ] No errors in browser console (F12)?

---

## 📞 TROUBLESHOOTING CHECKLIST

**"Supabase configuration error"**
- [ ] Check Railway has `REACT_APP_SUPABASE_URL`
- [ ] Check Railway has `REACT_APP_SUPABASE_ANON_KEY`
- [ ] No extra spaces in environment variables
- [ ] Redeploy Railway after adding variables

**"Payment system is not configured"**
- [ ] Check Railway has `REACT_APP_STRIPE_PRICE_ID`
- [ ] Price ID starts with `price_`
- [ ] Redeploy Railway after adding variable

**Stripe checkout fails**
- [ ] Edge Function deployed? (`supabase functions list`)
- [ ] Check `create-checkout` function exists
- [ ] Check Supabase secrets have `STRIPE_SECRET_KEY`
- [ ] Check Supabase logs for errors

**PDF tools don't work**
- [ ] File under 50MB?
- [ ] Try different PDF file
- [ ] Check browser console (F12) for errors

---

## ✅ SUCCESS!

When all boxes are checked, you have:

✨ A live, working web application!
✨ User authentication
✨ Payment processing
✨ PDF tools
✨ Admin panel

**Your live URL:** https://________________.up.railway.app

---

**🎉 Congratulations on deploying your first full-stack application!**

**Date deployed:** _______________
**Total time taken:** _______________
