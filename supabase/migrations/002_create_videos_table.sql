-- ============================================
-- Create Videos Table in Supabase
-- ============================================
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/abgbzdsjavuhbnyrqdms/sql

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

-- Policy: Anyone can view videos (public read access)
CREATE POLICY "Anyone can view videos"
  ON public.videos
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert (admin functionality)
CREATE POLICY "Authenticated users can insert videos"
  ON public.videos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can update (admin functionality)
CREATE POLICY "Authenticated users can update videos"
  ON public.videos
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can delete (admin functionality)
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

-- ============================================
-- Seed Initial Videos Data
-- ============================================

INSERT INTO public.videos (id, title, duration, access_hours) VALUES
  ('dQw4w9WgXcQ', 'Getting Started with PDF Tools', 180, 24),
  ('9bZkp7q19f0', 'Advanced PDF Manipulation Techniques', 240, 48),
  ('jNQXAC9IVRw', 'PDF Security Best Practices', 300, 72),
  ('kJQP7kiw5Fk', 'Mastering PDF Compression', 210, 24)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verification
-- ============================================

SELECT 'Videos table created successfully!' AS status;
SELECT id, title, duration, access_hours FROM public.videos;
