# Supabase + Stripe Integration Setup Guide

Complete step-by-step guide to set up Stripe payments with Supabase Edge Functions.

---

## Prerequisites

- ✅ Supabase account and project created
- ✅ Supabase CLI installed (v2.67.1+)
- ✅ Stripe account created
- ✅ Node.js and npm installed

---

## Part 1: Stripe Setup

### 1. Get Your Stripe Keys

**Development (Test Mode):**
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your keys:
   - **Publishable key**: `pk_test_...` (safe for frontend)
   - **Secret key**: `sk_test_...` (keep private!)

**Production (Live Mode):**
1. Complete Stripe account activation (business verification, bank account)
2. Go to: https://dashboard.stripe.com/apikeys
3. Copy your live keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

### 2. Create a Subscription Product

1. Go to: https://dashboard.stripe.com/products
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: "PDF Tools Premium"
   - **Description**: "Unlimited access to all PDF tools"
   - **Pricing**:
     - Recurring: Monthly
     - Price: $4.99 USD
4. Click **Save product**
5. **IMPORTANT**: Copy the **Price ID** (looks like `price_1ABC...`)
   - You'll need this for the frontend

### 3. Set Up Webhook Endpoint (After deployment)

We'll come back to this after deploying the Edge Functions.

---

## Part 2: Supabase Setup

### 1. Link Your Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

**How to find your project ref:**
- Go to: https://app.supabase.com/project/_/settings/general
- Copy the **Reference ID**

### 2. Run Database Migration

This updates your database to work with Supabase Auth and Stripe.

1. Go to your Supabase Dashboard:
   - https://app.supabase.com/project/your-project/sql

2. Open the SQL Editor

3. Copy and paste the contents of:
   - `server/database/migration_supabase_auth.sql`

4. Click **Run**

5. Verify success:
   ```sql
   SELECT * FROM users;
   ```

### 3. Set Environment Secrets

Supabase Edge Functions use environment secrets for sensitive data.

```bash
# Set Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here

# Set Stripe Webhook Secret (we'll get this later)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Set Supabase URL
supabase secrets set SUPABASE_URL=https://your-project.supabase.co

# Set Supabase Service Role Key (from dashboard)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Set Supabase Anon Key (from dashboard)
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
```

**Where to find Supabase keys:**
- Go to: https://app.supabase.com/project/_/settings/api
- Copy:
  - **Project URL**: `https://xxxxx.supabase.co`
  - **anon public**: Your anon key
  - **service_role**: Your service role key (keep secret!)

### 4. Deploy Edge Functions

```bash
# Deploy both functions
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout
```

After deployment, you'll get URLs like:
```
https://your-project.supabase.co/functions/v1/stripe-webhook
https://your-project.supabase.co/functions/v1/create-checkout
```

### 5. Set Up Stripe Webhook

Now that your Edge Function is deployed:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. Enter:
   - **Endpoint URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - **Events to send**: Select these events:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
4. Click **Add endpoint**
5. Copy the **Signing secret** (looks like `whsec_...`)
6. Update your Supabase secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

---

## Part 3: Frontend Configuration

### 1. Update Environment Variables

Create or update `.env` in the root directory:

```env
# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe (Frontend)
REACT_APP_STRIPE_PRICE_ID=price_1ABC...  # From Step 2 of Stripe Setup
```

### 2. Update Frontend URL in Supabase

Update the allowed origins in your Supabase config:

1. Go to: https://app.supabase.com/project/_/auth/url-configuration
2. Add your URLs:
   - **Site URL**: `https://your-frontend-domain.com` (production)
   - **Redirect URLs**: Add:
     - `http://localhost:3000` (development)
     - `https://your-frontend-domain.com` (production)
     - `https://your-frontend-domain.com/success` (after payment)

---

## Part 4: Testing

### 1. Local Testing

```bash
# Start frontend
npm start

# Your app should now be running on http://localhost:3000
```

### 2. Test Payment Flow

1. Sign up for an account on your app
2. Click "Subscribe Now"
3. Use Stripe test card:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., 12/25)
   - **CVC**: Any 3 digits (e.g., 123)
   - **ZIP**: Any 5 digits (e.g., 12345)
4. Complete payment
5. Verify:
   - User should be redirected
   - Check database: `SELECT * FROM users WHERE is_premium = true;`
   - User should have premium access

### 3. Test Webhook

To test webhooks locally, use Stripe CLI:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Listen to webhooks
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
```

### 4. Check Logs

View Edge Function logs in Supabase:

```bash
# View real-time logs
supabase functions logs stripe-webhook --tail

# Or in dashboard:
# https://app.supabase.com/project/_/functions/stripe-webhook/logs
```

---

## Part 5: Production Deployment

### 1. Switch to Live Stripe Keys

1. Update Supabase secrets with **live** keys:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_your_real_key
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   ```

2. Update frontend `.env` with live Price ID

3. Create new webhook endpoint in Stripe with LIVE MODE selected

### 2. Update Frontend Environment

Update your production environment variables (Vercel, Netlify, etc.):

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_STRIPE_PRICE_ID=price_live_your_real_price_id
```

### 3. Test Production

1. Create a real account
2. Use a real card (you can immediately cancel to avoid charges)
3. Verify premium activation
4. Check Stripe Dashboard for payment

---

## Troubleshooting

### Issue: "No authorization header" error

**Solution**: Make sure user is signed in before clicking Subscribe

### Issue: "Unauthorized" error

**Solution**: Check that Supabase URL and keys are correct in `.env`

### Issue: Webhook not firing

**Solutions**:
1. Check webhook endpoint URL is correct in Stripe Dashboard
2. Verify webhook secret is set correctly: `supabase secrets list`
3. Check Edge Function logs: `supabase functions logs stripe-webhook`
4. Make sure you selected the right events in Stripe Dashboard

### Issue: Payment succeeded but user not premium

**Solutions**:
1. Check Edge Function logs for errors
2. Verify database migration ran successfully
3. Check that email in Stripe matches email in Supabase Auth
4. Manually check: `SELECT * FROM users WHERE email = 'user@example.com';`

### Issue: "Invalid Signature" error in webhook

**Solution**: Webhook secret is wrong. Get the correct one from Stripe Dashboard and update:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_correct_secret
```

---

## Costs

### Development (Free Tier)
- Supabase: Free
- Stripe: Free (test mode)
- Edge Functions: 500k invocations/month free
- **Total: $0/month**

### Production
- Supabase: $0-25/month (Free tier usually sufficient)
- Edge Functions: Free up to 500k invocations
- Stripe fees: 2.9% + $0.30 per transaction
  - Example: $4.99 subscription = $4.82 to you (~$0.17 fee)
- **Total: $0-25/month + 2.9% transaction fees**

---

## Security Checklist

- ✅ Never commit `.env` files
- ✅ Use test keys in development
- ✅ Use live keys only in production
- ✅ Enable Row Level Security (RLS) on database tables
- ✅ Verify webhook signatures (already handled in Edge Function)
- ✅ Use HTTPS only in production
- ✅ Keep service role key secret (never expose to frontend)

---

## Next Steps

1. ✅ Complete Stripe account verification
2. ✅ Connect your bank account
3. ✅ Set payout schedule (daily recommended)
4. ✅ Test the complete flow in test mode
5. ✅ Deploy to production with live keys
6. ✅ Monitor Stripe Dashboard for payments
7. ✅ Monitor Supabase logs for errors

---

## Helpful Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Supabase Dashboard](https://app.supabase.com)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

## Support

If you run into issues:
1. Check the Troubleshooting section above
2. View Edge Function logs: `supabase functions logs stripe-webhook`
3. Check Stripe webhook logs in Stripe Dashboard
4. Verify all environment variables are set correctly

**Your integration is now complete!** 🎉
