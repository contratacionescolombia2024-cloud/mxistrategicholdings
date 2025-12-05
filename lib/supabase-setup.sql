
-- This SQL script should be run in your Supabase SQL Editor
-- It creates all necessary tables, functions, and triggers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  id_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  mxi_balance NUMERIC(20, 8) DEFAULT 0,
  usdt_contributed NUMERIC(20, 2) DEFAULT 0,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  active_referrals INTEGER DEFAULT 0,
  can_withdraw BOOLEAN DEFAULT FALSE,
  last_withdrawal_date TIMESTAMP,
  joined_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usdt_amount NUMERIC(20, 2) NOT NULL,
  mxi_amount NUMERIC(20, 8) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('initial', 'increase', 'reinvestment')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  amount NUMERIC(20, 2) NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(20, 8) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USDT', 'MXI')),
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_members INTEGER DEFAULT 56527,
  total_usdt_contributed NUMERIC(20, 2) DEFAULT 0,
  total_mxi_distributed NUMERIC(20, 8) DEFAULT 0,
  pool_close_date TIMESTAMP DEFAULT '2025-01-15 12:00:00 UTC',
  mxi_launch_date TIMESTAMP DEFAULT '2025-01-15 12:00:00 UTC',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial metrics row
INSERT INTO metrics (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'MXI' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to process referral commissions
CREATE OR REPLACE FUNCTION process_referral_commissions(
  p_user_id UUID,
  p_contribution_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
  v_level INTEGER;
  v_percentage NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  -- Get the user's referrer
  SELECT referred_by INTO v_referrer_id FROM users WHERE id = p_user_id;
  
  IF v_referrer_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Process 3 levels of commissions
  FOR v_level IN 1..3 LOOP
    IF v_referrer_id IS NULL THEN
      EXIT;
    END IF;
    
    -- Calculate commission percentage
    v_percentage := CASE v_level
      WHEN 1 THEN 3.0
      WHEN 2 THEN 2.0
      WHEN 3 THEN 1.0
    END;
    
    v_commission_amount := p_contribution_amount * (v_percentage / 100);
    
    -- Insert commission record
    INSERT INTO commissions (user_id, from_user_id, level, amount, percentage, status)
    VALUES (v_referrer_id, p_user_id, v_level, v_commission_amount, v_percentage, 'pending');
    
    -- Get next level referrer
    SELECT referred_by INTO v_referrer_id FROM users WHERE id = v_referrer_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check withdrawal eligibility
CREATE OR REPLACE FUNCTION check_withdrawal_eligibility(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_active_referrals INTEGER;
  v_days_since_join INTEGER;
  v_can_withdraw BOOLEAN;
BEGIN
  SELECT 
    active_referrals,
    EXTRACT(DAY FROM NOW() - joined_date)::INTEGER,
    can_withdraw
  INTO v_active_referrals, v_days_since_join, v_can_withdraw
  FROM users
  WHERE id = p_user_id;
  
  -- User can withdraw if they have 5+ active referrals and 10+ days have passed
  IF v_active_referrals >= 5 AND v_days_since_join >= 10 THEN
    UPDATE users SET can_withdraw = TRUE WHERE id = p_user_id;
    RETURN TRUE;
  END IF;
  
  RETURN v_can_withdraw;
END;
$$ LANGUAGE plpgsql;

-- Function to update commission status to available
CREATE OR REPLACE FUNCTION update_commission_status()
RETURNS VOID AS $$
BEGIN
  UPDATE commissions c
  SET status = 'available'
  FROM users u
  WHERE c.user_id = u.id
    AND c.status = 'pending'
    AND u.can_withdraw = TRUE
    AND EXTRACT(DAY FROM NOW() - c.created_at) >= 10;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics when contribution is made
CREATE OR REPLACE FUNCTION update_metrics_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE metrics
    SET 
      total_usdt_contributed = total_usdt_contributed + NEW.usdt_amount,
      total_mxi_distributed = total_mxi_distributed + NEW.mxi_amount,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_metrics_on_contribution
  AFTER INSERT OR UPDATE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_metrics_on_contribution();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read their own contributions
CREATE POLICY "Users can read own contributions" ON contributions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own contributions
CREATE POLICY "Users can insert own contributions" ON contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own commissions
CREATE POLICY "Users can read own commissions" ON commissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own withdrawals
CREATE POLICY "Users can read own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own withdrawals
CREATE POLICY "Users can insert own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own referrals
CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Everyone can read metrics
CREATE POLICY "Everyone can read metrics" ON metrics
  FOR SELECT USING (true);
