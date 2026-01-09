# 🇳🇬 Paystack Integration Setup Guide

**Complete guide to set up Paystack payments for your PDF Tools app**

---

## ✅ What's Been Done

I've successfully migrated your app from Stripe to Paystack:

1. ✅ **Updated [PremiumCheckout.js](src/components/PremiumCheckout.js)** - Now uses Paystack Inline JS
2. ✅ **Created Paystack Edge Functions**:
   - `paystack-verify` - Verifies payments and upgrades users
   - `paystack-webhook` - Handles subscription events
3. ✅ **Updated Database Migrations**:
   - `users` table now stores Paystack customer/subscription codes
   - `payments` table now tracks Paystack transactions
4. ✅ **Updated [.env](.env)** - Added Paystack configuration

---

## 📋 What You Need to Do

Follow these steps to complete the Paystack integration:

---

## Step 1: Create Paystack Account (5 minutes)

### 1.1 Sign Up for Paystack

1. Go to: https://paystack.com
2. Click **"Get Started"** or **"Sign Up"**
3. Fill in your details:
   - Email address
   - Password
   - Business name
   - Phone number (Nigerian number required)
4. Verify your email address
5. Complete your business profile

### 1.2 Activate Your Account

1. Log in to: https://dashboard.paystack.co
2. Complete KYC (Know Your Customer) verification:
   - Upload business registration documents (if applicable)
   - Or submit personal ID for personal accounts
3. Wait for account activation (usually 24-48 hours)

**Note:** You can use **Test Mode** immediately without waiting for activation!

---

## Step 2: Get Your API Keys (2 minutes)

### 2.1 Access API Keys

1. Log in to Paystack Dashboard: https://dashboard.paystack.co
2. Click **Settings** → **API Keys & Webhooks**
3. You'll see two sets of keys:
   - **Test Keys** (for testing)
   - **Live Keys** (for production - only visible after account activation)

### 2.2 Copy Your Test Public Key

1. Under **Test Keys**, find **Public Key**
2. It looks like: `pk_test_xxxxxxxxxxxxxxxxxxxx`
3. Copy this key
4. Open your `.env` file
5. Replace this line:
   ```bash
   REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
   ```

   With:
   ```bash
   REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
   ```
   (Use your actual key)

### 2.3 Copy Your Test Secret Key

1. Under **Test Keys**, find **Secret Key**
2. Click **"Show"** to reveal it
3. It looks like: `sk_test_xxxxxxxxxxxxxxxxxxxx`
4. **IMPORTANT:** Save this for Step 4 (Supabase Edge Function secrets)

---

## Step 3: Create Subscription Plan (5 minutes)

### 3.1 Navigate to Plans

1. In Paystack Dashboard, go to **Payments** → **Plans**
2. Click **"Create Plan"**

### 3.2 Set Up Plan Details

Fill in the plan details:

- **Plan Name:** Premium Monthly Subscription
- **Plan Description:** Access to all premium PDF tools
- **Amount:** 799 (in cents - this equals $7.99)
- **Interval:** Monthly
- **Currency:** USD (US Dollar)
- **Send Invoices:** Yes (recommended)
- **Invoice Limit:** Unlimited

### 3.3 Save and Copy Plan Code

1. Click **"Save Plan"**
2. You'll see your new plan with a **Plan Code** like: `PLN_xxxxxxxxxxxx`
3. Copy this Plan Code
4. Open your `.env` file
5. Replace this line:
   ```bash
   REACT_APP_PAYSTACK_PLAN_CODE=PLN_your_plan_code_here
   ```

   With:
   ```bash
   REACT_APP_PAYSTACK_PLAN_CODE=PLN_xxxxxxxxxxxx
   ```
   (Use your actual plan code)

---

## Step 4: Deploy Edge Functions to Supabase (10 minutes)

### 4.1 Install Supabase CLI (if not already installed)

Open your terminal:

```bash
npm install -g supabase
```

### 4.2 Link to Your Supabase Project

```bash
cd "c:\Users\TCG\Desktop\pdf-tools-app"
supabase link --project-ref abgbzdsjavuhbnyrqdms
```

When prompted, enter your Supabase database password.

### 4.3 Set Edge Function Secrets

You need to set your Paystack Secret Key in Supabase:

```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
```

Replace `sk_test_your_secret_key_here` with the secret key from Step 2.3.

**Also verify these secrets are set:**

```bash
# Check existing secrets
supabase secrets list

# If missing, set them:
supabase secrets set SUPABASE_URL=https://abgbzdsjavuhbnyrqdms.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

To get your service role key:
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (NOT the anon key)

### 4.4 Deploy the Edge Functions

Deploy both Paystack Edge Functions:

```bash
# Deploy verification function
supabase functions deploy paystack-verify

# Deploy webhook function
supabase functions deploy paystack-webhook
```

### 4.5 Verify Deployment

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/abgbzdsjavuhbnyrqdms
2. Click **Edge Functions** in the sidebar
3. You should see:
   - ✅ `paystack-verify` (Active)
   - ✅ `paystack-webhook` (Active)

---

## Step 5: Create Database Tables (2 minutes)

### 5.1 Run Users Table Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Open: `c:\Users\TCG\Desktop\pdf-tools-app\supabase\migrations\create_users_table.sql`
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press F5)
7. Verify success: You should see "Users table created successfully!" and "total_users: 0"

### 5.2 Run Payments Table Migration

1. In SQL Editor, click **"New query"**
2. Open: `c:\Users\TCG\Desktop\pdf-tools-app\supabase\migrations\003_create_payments_table.sql`
3. Copy ALL the SQL code
4. Paste into Supabase SQL Editor
5. Click **"Run"**
6. Verify: Table should be created without errors

---

## Step 6: Set Up Paystack Webhooks (5 minutes)

### 6.1 Get Your Webhook URL

Your webhook URL is:
```
https://abgbzdsjavuhbnyrqdms.supabase.co/functions/v1/paystack-webhook
```

### 6.2 Configure Webhook in Paystack

1. Go to Paystack Dashboard: https://dashboard.paystack.co
2. Click **Settings** → **API Keys & Webhooks**
3. Scroll to **Webhooks** section
4. Click **"Add Webhook URL"**
5. Enter the webhook URL above
6. Click **"Add Webhook"**

### 6.3 Select Events

Select these events to receive notifications:

- ✅ `charge.success` - Payment successful
- ✅ `subscription.create` - New subscription
- ✅ `subscription.disable` - Subscription cancelled
- ✅ `subscription.not_renew` - Subscription won't renew
- ✅ `invoice.payment_failed` - Payment failed

### 6.4 Save Webhook

1. Click **"Save"**
2. Your webhook is now active!

**Note:** The webhook signature verification is automatically handled by the Edge Function.

---

## Step 7: Test Locally (5 minutes)

### 7.1 Start Your App

```bash
cd "c:\Users\TCG\Desktop\pdf-tools-app"
npm start
```

Wait for the app to open in your browser (http://localhost:3000)

### 7.2 Test Sign Up & Login

1. Click **"Sign Up"**
2. Create a test account
3. Verify you can log in

### 7.3 Test Premium Checkout

1. Click **"Go Premium"** or **"Subscribe"**
2. You should see:
   - Green button: "Subscribe Now - $7.99/month"
   - Text: "Secure payment powered by Paystack"
   - Text: "Accepts cards, bank transfer, USSD & mobile money"
3. Click the button
4. Paystack payment popup should appear

### 7.4 Make Test Payment

Use Paystack test cards:

**Successful payment:**
- Card Number: `5060 6666 6666 6666 003`
- CVV: `123`
- Expiry: Any future date (e.g., `12/25`)
- PIN: `1234` (when prompted)
- OTP: `123456` (when prompted)

**Other test cards:** https://paystack.com/docs/payments/test-payments

### 7.5 Verify Premium Activation

After successful payment:
1. You should see: "🎉 Welcome to Premium! Your subscription is now active."
2. You should be redirected back to the app
3. Check your user profile - should show as Premium

### 7.6 Check Database

1. Go to Supabase Dashboard → **Table Editor**
2. Click **users** table
3. Find your test user
4. Verify:
   - `is_premium` = `true`
   - `paystack_customer_code` is filled
   - `subscription_status` = `active`

---

## Step 8: Update Railway Environment Variables (3 minutes)

When you're ready to deploy, update Railway:

### 8.1 Add Paystack Variables to Railway

1. Go to Railway: https://railway.app
2. Open your project
3. Click **"Variables"** tab
4. **Remove old Stripe variables:**
   - Delete `REACT_APP_STRIPE_PRICE_ID` (if it exists)

5. **Add new Paystack variables:**
   - Click **"+ New Variable"**
   - Add these four variables:

   ```
   REACT_APP_PAYSTACK_PUBLIC_KEY = pk_test_your_public_key
   REACT_APP_PAYSTACK_PLAN_CODE = PLN_your_plan_code
   REACT_APP_PAYSTACK_AMOUNT = 799
   REACT_APP_PAYSTACK_CURRENCY = USD
   ```

6. Click **"Save"**
7. Railway will automatically redeploy

---

## Step 9: Test Production (5 minutes)

### 9.1 Wait for Deployment

1. In Railway, go to **"Deployments"**
2. Wait for **"Success"** status
3. Copy your Railway URL: `https://your-app.up.railway.app`

### 9.2 Test Live App

1. Visit your Railway URL
2. Sign up with a new test account
3. Try the premium checkout
4. Use Paystack test card again
5. Verify premium activation works

---

## 🎉 You're Done!

Your Paystack integration is now complete!

### What You Have Now:

✅ **Paystack Payments** - Accepting NGN payments from Nigeria
✅ **Subscription Plans** - Monthly recurring billing
✅ **Multiple Payment Methods** - Cards, bank transfer, USSD, mobile money
✅ **Automatic Premium Activation** - Users upgraded instantly after payment
✅ **Webhook Integration** - Handles subscription events automatically
✅ **Secure Verification** - All payments verified server-side

---

## 🔄 Going Live (When Ready)

When your Paystack account is activated:

### 1. Get Live API Keys

1. Paystack Dashboard → Settings → API Keys
2. Copy **Live Public Key** (starts with `pk_live_`)
3. Copy **Live Secret Key** (starts with `sk_live_`)

### 2. Create Live Plan

1. In Paystack Dashboard, switch to **Live Mode** (toggle at top)
2. Create the same plan as before
3. Copy the **Live Plan Code**

### 3. Update Environment Variables

Update `.env` (local) and Railway (production):

```bash
# Replace test keys with live keys
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
REACT_APP_PAYSTACK_PLAN_CODE=PLN_xxxxxxxxxxxx
```

### 4. Update Supabase Secret

```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxx
```

### 5. Redeploy

```bash
# Redeploy Edge Functions (optional, they'll use the updated secret)
git add .
git commit -m "Switch to Paystack live mode"
git push
```

Railway will auto-deploy with live keys.

---

## 🆘 Troubleshooting

### Payment Not Working

**Check browser console (F12 → Console):**
- "PAYSTACK_PUBLIC_KEY not set" → Update .env file
- "Payment system is still loading" → Refresh the page
- "Failed to load payment system" → Check internet connection

**Check Supabase Edge Function Logs:**
1. Supabase Dashboard → Edge Functions
2. Click `paystack-verify` → Logs
3. Look for errors

### Webhook Not Receiving Events

1. Check webhook URL is correct in Paystack
2. Check Edge Function `paystack-webhook` is deployed
3. Test webhook: Paystack Dashboard → Webhooks → Click webhook → Send test event

### User Not Upgraded After Payment

**Check these in order:**

1. **Supabase Logs:**
   - Dashboard → Edge Functions → `paystack-verify` → Logs
   - Look for "Payment verified successfully"

2. **Database:**
   - Table Editor → `users` table
   - Check if user's `is_premium` is `true`

3. **Paystack Dashboard:**
   - Transactions → Find the transaction
   - Verify status is "Success"

### Common Errors

| Error | Solution |
|-------|----------|
| "Invalid API key" | Check you copied the full key from Paystack |
| "Plan not found" | Verify Plan Code is correct in .env |
| "Amount mismatch" | Amount in .env should be in cents (799 = $7.99) |
| "Signature verification failed" | Check `PAYSTACK_SECRET_KEY` is set in Supabase secrets |

---

## 📞 Need Help?

**Paystack Support:**
- Email: support@paystack.com
- Docs: https://paystack.com/docs
- Test Cards: https://paystack.com/docs/payments/test-payments

**Check Your Logs:**
- **Browser Console:** F12 → Console
- **Supabase Logs:** Dashboard → Logs
- **Edge Function Logs:** Dashboard → Edge Functions → [Function] → Logs
- **Paystack Logs:** Dashboard → Transactions

---

## 📝 Summary of Changes

### Files Modified:
1. [.env](.env) - Added Paystack configuration
2. [src/components/PremiumCheckout.js](src/components/PremiumCheckout.js) - Rewrote for Paystack
3. [supabase/migrations/create_users_table.sql](supabase/migrations/create_users_table.sql) - Updated for Paystack
4. [supabase/migrations/003_create_payments_table.sql](supabase/migrations/003_create_payments_table.sql) - Updated for Paystack

### Files Created:
1. [supabase/functions/paystack-verify/index.ts](supabase/functions/paystack-verify/index.ts) - Payment verification
2. [supabase/functions/paystack-webhook/index.ts](supabase/functions/paystack-webhook/index.ts) - Webhook handler

### Stripe Files to Remove (Optional):
- `supabase/functions/create-checkout/` - No longer needed
- `supabase/functions/stripe-webhook/` - No longer needed

You can delete these later after confirming Paystack works.

---

**Good luck with your Paystack integration! 🚀🇳🇬**
