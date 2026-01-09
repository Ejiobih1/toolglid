# ✅ ToolGlid Setup Checklist - Complete This To Finish!

## Current Status: 70% Complete ✨

Your Paystack keys are already configured! Now just 3 more steps.

---

## ✅ COMPLETED (Already Done!)

- ✅ Paystack account created
- ✅ Paystack API keys added to .env
- ✅ Paystack plan created (PLN_9g8g4po6ci66pzr)
- ✅ Code updated for Paystack integration
- ✅ Admin panel upgraded to use Supabase database

---

## 🔴 TO DO (3 Steps Remaining)

### Step 1: Create Database Tables (2 minutes)

**Create Users Table:**

1. Go to: https://supabase.com/dashboard/project/abgbzdsjavuhbnyrqdms/sql
2. Click "New query"
3. Copy and paste this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_since TIMESTAMP WITH TIME ZONE,
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Anyone can view their own user data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do everything
CREATE POLICY "Service role can do everything" ON public.users
  FOR ALL
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_users_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_paystack_customer ON public.users(paystack_customer_code);
CREATE INDEX IF NOT EXISTS idx_users_paystack_subscription ON public.users(paystack_subscription_code);

SELECT 'Users table created successfully!' AS status;
```

4. Click "Run" (or press F5)
5. You should see: "Users table created successfully!"

**Create Payments Table:**

1. Still in SQL Editor, click "New query"
2. Copy and paste this SQL:

```sql
-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_reference TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert payments
CREATE POLICY "Service role can insert payments" ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_paystack_reference ON public.payments(paystack_reference);

SELECT 'Payments table created successfully!' AS status;
```

3. Click "Run"
4. You should see: "Payments table created successfully!"

**Create Videos Table:**

1. Click "New query" again
2. Copy and paste this SQL:

```sql
-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL,
  access_hours INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view videos
CREATE POLICY "Anyone can view videos"
  ON public.videos
  FOR SELECT
  USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert videos"
  ON public.videos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update videos"
  ON public.videos
  FOR UPDATE
  TO authenticated
  USING (true);

-- Only authenticated users can delete
CREATE POLICY "Authenticated users can delete videos"
  ON public.videos
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample videos
INSERT INTO public.videos (id, title, duration, access_hours) VALUES
  ('dQw4w9WgXcQ', 'Getting Started with ToolGlid', 5, 24),
  ('9bZkp7q19f0', 'Advanced PDF Features', 8, 48),
  ('jNQXAC9IVRw', 'Tips and Tricks', 3, 12)
ON CONFLICT (id) DO NOTHING;

SELECT 'Videos table created successfully!' AS status;
```

3. Click "Run"
4. You should see: "Videos table created successfully!"

✅ **Step 1 Complete!** All database tables are now created.

---

### Step 2: Deploy Paystack Edge Functions (5 minutes)

**First, get your Paystack Secret Key:**

1. Go to: https://dashboard.paystack.co/settings/developer
2. Click "Show" next to "Secret Key"
3. Copy it (starts with `sk_test_`)
4. Save it in Notepad temporarily

**Now deploy the functions:**

Open PowerShell in your project folder and run these commands ONE BY ONE:

```bash
# 1. Login to Supabase (you need an access token)
npx supabase login
```

**Get access token:**
- Go to: https://supabase.com/dashboard/account/tokens
- Click "Generate New Token"
- Name it "ToolGlid"
- Copy the token (starts with `sbp_`)
- Paste it when the terminal asks
- Press Enter

```bash
# 2. Link your project
npx supabase link --project-ref abgbzdsjavuhbnyrqdms
```

It will ask for your database password:
- Go to: https://supabase.com/dashboard/project/abgbzdsjavuhbnyrqdms/settings/database
- Find "Database Password"
- If you don't remember it, click "Reset Database Password"
- Copy and paste it
- Press Enter

```bash
# 3. Set Paystack Secret Key
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

Replace `sk_test_YOUR_SECRET_KEY_HERE` with your actual Paystack secret key from step 1.

```bash
# 4. Deploy paystack-verify function
npx supabase functions deploy paystack-verify
```

Wait for it to finish...

```bash
# 5. Deploy paystack-webhook function
npx supabase functions deploy paystack-webhook
```

**Verify deployment:**
- Go to: https://supabase.com/dashboard/project/abgbzdsjavuhbnyrqdms/functions
- You should see both functions listed

✅ **Step 2 Complete!** Edge functions are deployed.

---

### Step 3: Set Up Paystack Webhook (3 minutes)

1. Go to: https://dashboard.paystack.co/settings/developer
2. Scroll to "Webhooks" section
3. Click "Add Webhook URL"
4. Enter this URL:
   ```
   https://abgbzdsjavuhbnyrqdms.supabase.co/functions/v1/paystack-webhook
   ```
5. Select these events:
   - ✅ charge.success
   - ✅ subscription.create
   - ✅ subscription.disable
   - ✅ subscription.not_renew
   - ✅ invoice.payment_failed
6. Click "Save"

✅ **Step 3 Complete!** Webhook is configured.

---

## 🎉 ALL DONE!

Once you complete all 3 steps, you can test:

### Test Your App:

```bash
npm start
```

1. Go to: http://localhost:3000
2. Sign up for an account
3. Click "Subscribe" or "Go Premium"
4. You should see Paystack payment popup
5. Use test card:
   - Card: `5060 6666 6666 6666 003`
   - CVV: `123`
   - Expiry: `12/26`
   - PIN: `1234`
   - OTP: `123456`

If payment succeeds, you're premium! 🎉

---

## 🆘 Need Help?

If you get stuck:
1. Check which step you're on
2. Copy any error messages
3. Ask for help with the specific step number

**You're almost there!** Just 3 steps to go! 🚀
