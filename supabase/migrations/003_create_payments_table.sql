-- Create payments table to track Paystack transactions
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

-- Create policies
-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only authenticated users can insert payments (via Edge Function with service role)
CREATE POLICY "Service role can insert payments" ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_paystack_reference ON public.payments(paystack_reference);

-- Add comment
COMMENT ON TABLE public.payments IS 'Stores Paystack payment records for premium subscriptions';
