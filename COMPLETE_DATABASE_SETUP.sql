-- ============================================
-- COMPLETE TOOLGLID DATABASE SETUP
-- ============================================
-- Run this ENTIRE file in one go!
-- Copy and paste ALL of this into Supabase SQL Editor
-- ============================================

-- First, drop existing tables if you want to start fresh
-- (Comment these out if you want to keep existing data)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- 1. CREATE USERS TABLE
-- ============================================

CREATE TABLE public.users (
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

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can do everything on users" ON public.users
  FOR ALL
  USING (true);

-- Create updated_at trigger function (only once)
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

-- Create indexes for users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_paystack_customer ON public.users(paystack_customer_code);
CREATE INDEX idx_users_paystack_subscription ON public.users(paystack_subscription_code);

-- ============================================
-- 2. CREATE PAYMENTS TABLE
-- ============================================

CREATE TABLE public.payments (
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

-- RLS Policies for payments table
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert payments" ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for payments
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_paystack_reference ON public.payments(paystack_reference);

-- Add comment
COMMENT ON TABLE public.payments IS 'Stores Paystack payment records for premium subscriptions';

-- ============================================
-- 3. CREATE VIDEOS TABLE
-- ============================================

CREATE TABLE public.videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL,
  access_hours INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos table
CREATE POLICY "Anyone can view videos" ON public.videos
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert videos" ON public.videos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update videos" ON public.videos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete videos" ON public.videos
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger for videos
CREATE OR REPLACE FUNCTION public.handle_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_videos_updated_at();

-- Insert sample videos
INSERT INTO public.videos (id, title, duration, access_hours) VALUES
  ('dQw4w9WgXcQ', 'Getting Started with ToolGlid', 5, 24),
  ('9bZkp7q19f0', 'Advanced PDF Features', 8, 48),
  ('jNQXAC9IVRw', 'Tips and Tricks', 3, 12)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all tables were created
SELECT 'Database setup complete!' AS status;
SELECT 'Users table created' AS check_1 FROM public.users LIMIT 0;
SELECT 'Payments table created' AS check_2 FROM public.payments LIMIT 0;
SELECT 'Videos table created with ' || COUNT(*)::TEXT || ' sample videos' AS check_3 FROM public.videos;
