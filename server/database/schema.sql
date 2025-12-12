-- PDF Tools Database Schema
-- PostgreSQL Database

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_since TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive', -- active, inactive, canceled, past_due
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table (migrated from localStorage)
CREATE TABLE videos (
  id VARCHAR(20) PRIMARY KEY, -- YouTube video ID
  title VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  access_hours INTEGER NOT NULL,
  created_by VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table (for tracking transactions)
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL, -- succeeded, pending, failed, refunded
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_premium ON users(is_premium);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin videos (same as current localStorage defaults)
INSERT INTO videos (id, title, duration, access_hours) VALUES
  ('-6FYfcXFxn4', 'Your Channel Video', 5, 1),
  ('ScMzIvxBSi4', 'Sample Video (1 min)', 1, 3),
  ('aqz-KE-bpKQ', 'Test Video (2 min)', 2, 12),
  ('jNQXAC9IVRw', 'Me at the zoo (Classic)', 1, 24)
ON CONFLICT (id) DO NOTHING;

-- Create admin user (optional - for future admin panel)
-- Password: admin123 (you should change this!)
-- This is a hashed version - actual implementation will hash it properly
INSERT INTO users (email, password_hash, is_premium) VALUES
  ('admin@pdftools.com', '$2b$10$placeholder_hash_will_be_replaced', TRUE)
ON CONFLICT (email) DO NOTHING;
