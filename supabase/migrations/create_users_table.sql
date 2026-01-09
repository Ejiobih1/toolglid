-- ============================================
-- Create Users Table for Premium Management
-- ============================================
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/abgbzdsjavuhbnyrqdms/sql

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;

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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_users_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_paystack_customer ON public.users(paystack_customer_code);
CREATE INDEX IF NOT EXISTS idx_users_paystack_subscription ON public.users(paystack_subscription_code);

-- Verification
SELECT 'Users table created successfully!' AS status;
SELECT COUNT(*) AS total_users FROM public.users;
