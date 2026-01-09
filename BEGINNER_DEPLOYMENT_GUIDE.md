# 🚀 Beginner's Guide to Deploying Your PDF Tools App

This guide will walk you through deploying your PDF tools app step-by-step, even if you've never deployed a website before!

**Time needed:** About 1-2 hours
**Cost:** Free for Supabase and Railway, Stripe is free to set up (only pay when customers subscribe)

---

## 📚 What You'll Need

Before starting, create free accounts at:
1. ✅ **Supabase** (database & backend) - [supabase.com](https://supabase.com)
2. ✅ **Railway** (hosting) - [railway.app](https://railway.app)
3. ✅ **Stripe** (payments) - [stripe.com](https://stripe.com)
4. ✅ **ConvertAPI** (PDF to Word) - [convertapi.com](https://convertapi.com)
5. ✅ **GitHub** (code storage) - [github.com](https://github.com)

---

## 🎯 PART 1: Set Up Supabase (Your Database)

### Step 1.1: Create a New Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"** (green button)
3. Fill in the form:
   - **Name:** `pdf-tools` (or anything you like)
   - **Database Password:** Create a strong password (save it somewhere safe!)
   - **Region:** Choose closest to you (e.g., "US West" if you're in USA)
4. Click **"Create new project"**
5. **⏰ Wait 2-3 minutes** while Supabase sets up your database

### Step 1.2: Get Your Supabase Keys (IMPORTANT!)

Once your project is ready:

1. Click **"Settings"** in the left sidebar (gear icon)
2. Click **"API"** in the settings menu
3. You'll see two important things:

**Copy these and save them in a text file (you'll need them later):**

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGc... (long string of letters/numbers)
```

### Step 1.3: Reset Your API Keys (CRITICAL SECURITY STEP!)

**Why?** Your old keys were accidentally exposed in code, so we need new ones.

1. Still in Settings → API
2. Scroll down to **"Project API keys"**
3. Click **"Reset API keys"** button
4. Type `RESET` when asked to confirm
5. **Copy the NEW keys** (they'll be different now)
6. Replace the old keys in your text file with these new ones

### Step 1.4: Create the Users Table

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button
3. Paste this code:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_since TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Policy: Service role can do everything (for server-side operations)
CREATE POLICY "Service role can do everything"
  ON public.users
  FOR ALL
  USING (auth.role() = 'service_role');
```

4. Click **"Run"** (or press F5)
5. You should see "Success. No rows returned" - that's perfect!

---

## 🎯 PART 2: Set Up Stripe (Your Payment System)

### Step 2.1: Create a Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Click **"Start now"** (top right)
3. Fill in your email and create an account
4. **Skip** the onboarding questions for now (click "I'll do this later")

### Step 2.2: Create a Product for Premium Subscription

1. In Stripe Dashboard, click **"Products"** in the left menu
2. Click **"+ Add product"** (top right)
3. Fill in:
   - **Name:** `PDF Tools Premium`
   - **Description:** `Unlimited access to all PDF tools`
   - **Pricing model:** Select **"Standard pricing"**
   - **Price:** Enter `4.99` (or your price)
   - **Billing period:** Select **"Monthly"**
   - **Currency:** Select your currency (e.g., USD)
4. Click **"Save product"**

### Step 2.3: Get Your Price ID

1. After saving, you'll see your product
2. In the **Pricing** section, you'll see something like:
   ```
   Monthly: $4.99/month
   price_1AbC2DeF3GhI4JkL5MnO
   ```
3. **Copy that `price_xxxxx` ID** - save it in your text file!

### Step 2.4: Get Your Stripe API Keys

1. Click **"Developers"** in the top right
2. Click **"API keys"** in the left menu
3. You'll see:
   - **Publishable key:** `pk_test_xxxxx`
   - **Secret key:** (click "Reveal test key") `sk_test_xxxxx`
4. **Copy the Secret key** - save it in your text file
5. ⚠️ **Keep secret key private!** Never share it or commit it to GitHub

---

## 🎯 PART 3: Set Up ConvertAPI (For PDF to Word)

### Step 3.1: Create ConvertAPI Account

1. Go to [convertapi.com](https://www.convertapi.com)
2. Click **"Sign Up Free"** (top right)
3. Create account with email
4. Verify your email

### Step 3.2: Get Your API Secret

1. After logging in, you'll see your dashboard
2. Look for **"Secret:"** near the top
3. It will say something like: `Secret: abc123xyz`
4. **Copy that secret** - save it in your text file!

**Free Plan:** You get 250 free conversions per day - perfect for testing!

---

## 🎯 PART 4: Set Up Supabase Edge Functions

Edge Functions are like mini-servers that run specific tasks. You need two:
1. One for PDF to Word conversion
2. One for Stripe checkout

### Step 4.1: Install Supabase CLI

**On Windows:**
1. Download from: [github.com/supabase/cli/releases](https://github.com/supabase/cli/releases)
2. Look for `supabase_windows_amd64.zip`
3. Extract the ZIP file
4. Move `supabase.exe` to a folder like `C:\supabase\`
5. Add to PATH or use full path when running commands

**Or use NPM (if you have Node.js):**
```bash
npm install -g supabase
```

### Step 4.2: Login to Supabase CLI

Open Command Prompt or PowerShell and run:

```bash
supabase login
```

This will open your browser - click "Authorize" to allow access.

### Step 4.3: Link to Your Project

1. In your project folder, run:
```bash
cd c:\Users\TCG\Desktop\pdf-tools-app
supabase link
```

2. When asked:
   - **Project ref:** Go to Supabase Dashboard → Settings → General → Copy "Reference ID"
   - **Database password:** Enter the password you created in Step 1.1

### Step 4.4: Create Edge Functions Folder

Create these folders and files:

**Folder structure:**
```
pdf-tools-app/
  supabase/
    functions/
      pdf-to-word/
        index.ts
      create-checkout/
        index.ts
```

**Create `supabase/functions/pdf-to-word/index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileUrl } = await req.json()

    // Call ConvertAPI to convert PDF to Word
    const convertApiSecret = Deno.env.get('CONVERTAPI_SECRET')

    const response = await fetch(
      `https://v2.convertapi.com/convert/pdf/to/docx?Secret=${convertApiSecret}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Parameters: [
            {
              Name: 'File',
              FileValue: {
                Url: fileUrl
              }
            }
          ]
        })
      }
    )

    const data = await response.json()

    return new Response(
      JSON.stringify({ url: data.Files[0].Url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

**Create `supabase/functions/create-checkout/index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const { priceId, successUrl, cancelUrl } = await req.json()

    // Get user from auth token
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### Step 4.5: Deploy Edge Functions

Run these commands:

```bash
# Deploy PDF to Word function
supabase functions deploy pdf-to-word

# Deploy Stripe checkout function
supabase functions deploy create-checkout
```

### Step 4.6: Set Edge Function Secrets

These are environment variables that your Edge Functions need:

```bash
# Set ConvertAPI secret
supabase secrets set CONVERTAPI_SECRET=your_convertapi_secret_here

# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

Replace `your_convertapi_secret_here` and `sk_test_xxxxx` with the actual values from your text file!

---

## 🎯 PART 5: Set Up Local Environment

### Step 5.1: Create Your .env File

1. Open your project folder: `c:\Users\TCG\Desktop\pdf-tools-app`
2. You'll see a file called `.env.example`
3. **Copy it** and rename the copy to `.env` (just `.env`, no `.example`)
4. Open `.env` in a text editor (Notepad works!)
5. Replace the placeholder values with your real values:

```bash
# Replace these with YOUR actual values from your text file!
REACT_APP_SUPABASE_URL=https://yourproject.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_STRIPE_PRICE_ID=price_1AbC2DeF3GhI4JkL5MnO
REACT_APP_ADMIN_PASSWORD=MySecurePassword123!
```

6. **Save the file**
7. ⚠️ **NEVER commit `.env` to GitHub!** (it's already in `.gitignore`)

### Step 5.2: Test Locally

Open Command Prompt in your project folder and run:

```bash
npm start
```

Your app should open at `http://localhost:3000`

**Test these things:**
- ✅ Sign up with a test email
- ✅ Sign in
- ✅ Upload a PDF and try a tool (like Merge or Rotate)
- ✅ Try the Premium Checkout button (it should redirect to Stripe)

If everything works, you're ready to deploy! 🎉

---

## 🎯 PART 6: Deploy to Railway

### Step 6.1: Push Code to GitHub

**Why?** Railway deploys from GitHub.

1. Create a new repository on [github.com](https://github.com)
   - Click the **"+"** icon → "New repository"
   - Name: `pdf-tools-app`
   - Make it **Private** (recommended)
   - Click "Create repository"

2. In your project folder, run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for deployment"

# Connect to GitHub (replace with YOUR repo URL)
git remote add origin https://github.com/yourusername/pdf-tools-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**⚠️ IMPORTANT:** Make sure `.env` is NOT pushed! Check your `.gitignore` file includes `.env`

### Step 6.2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. If first time: Click "Configure GitHub App" and allow access to your repositories
5. Select your `pdf-tools-app` repository
6. Railway will start deploying automatically

### Step 6.3: Add Environment Variables to Railway

**This is CRITICAL!** Without these, your app won't work.

1. In Railway, click on your project
2. Click the **"Variables"** tab
3. Click **"+ New Variable"**
4. Add each of these (one by one):

```
REACT_APP_SUPABASE_URL = https://yourproject.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_STRIPE_PRICE_ID = price_1AbC2DeF3GhI4JkL5MnO
REACT_APP_ADMIN_PASSWORD = MySecurePassword123!
```

**Use your actual values from your text file!**

5. After adding all variables, Railway will automatically redeploy

### Step 6.4: Get Your Live URL

1. Wait for deployment to finish (watch the "Deploy" logs)
2. When it says "Success", click on your service
3. Click **"Settings"** tab
4. Under "Domains", click **"Generate Domain"**
5. You'll get a URL like: `your-app-production.up.railway.app`

**🎉 That's your live website!**

---

## 🎯 PART 7: Final Testing

### Test Your Live Site

Visit your Railway URL and test:

1. ✅ **Sign Up**: Create a new account
2. ✅ **PDF Tools**: Upload a PDF and try each tool
3. ✅ **File Size Limit**: Try uploading a file over 50MB (should show error)
4. ✅ **Premium Checkout**: Click "Go Premium" → Should redirect to Stripe
5. ✅ **Admin Panel**: Visit `your-url.com/#/admin` → Enter your admin password

### Common Issues & Fixes

**"Supabase configuration error"**
- ✅ Check you added `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in Railway variables
- ✅ Make sure there are no extra spaces
- ✅ Redeploy after adding variables

**"Payment system is not configured"**
- ✅ Check you added `REACT_APP_STRIPE_PRICE_ID` in Railway variables
- ✅ Make sure it starts with `price_`

**PDF tools not working**
- ✅ Check file size (max 50MB)
- ✅ Try with a different PDF file
- ✅ Check browser console for errors (F12 → Console tab)

**Stripe checkout doesn't work**
- ✅ Make sure Edge Function is deployed: `supabase functions list`
- ✅ Check Edge Function has STRIPE_SECRET_KEY: `supabase secrets list`
- ✅ Check Supabase logs for errors

---

## 🎯 PART 8: Set Up Stripe Webhooks (For Premium Status)

This makes sure users become premium after they pay.

### Step 8.1: Create Stripe Webhook Endpoint

1. Go to Stripe Dashboard
2. Click **"Developers"** → **"Webhooks"**
3. Click **"Add endpoint"**
4. For **"Endpoint URL"**, enter:
   ```
   https://yourproject.supabase.co/functions/v1/stripe-webhook
   ```
   (Replace `yourproject` with your actual Supabase project reference)

5. Click **"Select events"**
6. Find and check these events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
7. Click **"Add events"**
8. Click **"Add endpoint"**

### Step 8.2: Get Webhook Secret

1. After creating the endpoint, click on it
2. Click **"Reveal"** under "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add it to Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Step 8.3: Create Webhook Edge Function

Create `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  })

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret!)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata.user_id

        // Update user to premium
        await supabaseAdmin
          .from('users')
          .update({
            is_premium: true,
            premium_since: new Date().toISOString(),
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        // Remove premium status
        await supabaseAdmin
          .from('users')
          .update({
            is_premium: false,
            stripe_subscription_id: null,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }
})
```

Deploy it:
```bash
supabase functions deploy stripe-webhook
```

---

## ✅ SUCCESS CHECKLIST

Your app is fully deployed when all these work:

- [ ] Can visit your Railway URL
- [ ] Can sign up / sign in
- [ ] All PDF tools work (test at least 3)
- [ ] File size limit works (rejects 100MB files)
- [ ] Premium checkout redirects to Stripe
- [ ] Admin panel requires password
- [ ] No errors in browser console (F12 → Console)
- [ ] Stripe webhooks are set up
- [ ] Test subscription (use Stripe test card: 4242 4242 4242 4242)

---

## 🆘 Need Help?

### Where to Check for Errors

1. **Browser Console** (F12 → Console tab)
   - Shows frontend JavaScript errors

2. **Railway Logs** (Railway Dashboard → Deployments → Click latest deployment)
   - Shows deployment and runtime errors

3. **Supabase Logs** (Supabase Dashboard → Logs)
   - Shows Edge Function errors
   - Shows database errors

### Common Beginner Mistakes

1. ❌ Forgot to add environment variables in Railway
2. ❌ Used old Supabase keys instead of new ones
3. ❌ Accidentally committed `.env` to GitHub
4. ❌ Typo in Price ID (should start with `price_`)
5. ❌ Didn't deploy Edge Functions
6. ❌ Didn't set Edge Function secrets

---

## 🎉 You're Done!

Congratulations! You've deployed a full-stack web application with:
- ✅ User authentication
- ✅ Database (Supabase)
- ✅ Payment system (Stripe)
- ✅ File processing
- ✅ Serverless functions

**Share your live URL:**
`https://your-app-production.up.railway.app`

---

## 📝 What to Remember

1. **Keep your `.env` file safe** - Never commit it to GitHub
2. **Your text file with all credentials** - Keep it somewhere safe
3. **Stripe is in Test Mode** - Real credit cards won't work until you activate your Stripe account
4. **Free plan limits:**
   - Railway: 500 hours/month free
   - Supabase: 500MB database, 2GB bandwidth
   - ConvertAPI: 250 conversions/day

---

## 🚀 Next Steps

1. **Activate Stripe** (go from test mode to live mode)
2. **Add a custom domain** (in Railway settings)
3. **Set up email notifications** (for new subscriptions)
4. **Add analytics** (Google Analytics, etc.)
5. **Create a backup strategy** (export Supabase data regularly)

**Good luck with your app! 🎊**
