-- ContractEar Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- =============================================================
-- 1. Create profiles table
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'none',
  analyses_used INTEGER NOT NULL DEFAULT 0,
  analyses_limit INTEGER NOT NULL DEFAULT 0,
  billing_cycle_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  paddle_subscription_id TEXT,
  paddle_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Service role can do everything (API routes use service role)
-- No additional policy needed — service role bypasses RLS

-- =============================================================
-- 2. Create analyses table
-- =============================================================
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT '',
  audio_path TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'upload',
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  transcript TEXT,
  result JSONB,
  processing_error TEXT,
  paddle_transaction_id TEXT,
  tier TEXT NOT NULL DEFAULT 'single',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on analyses
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Users can read their own analyses
CREATE POLICY "Users can read own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================
-- 3. Create audio-uploads storage bucket
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-uploads', 'audio-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 4. Create indexes for performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_profiles_paddle_customer_id ON profiles(paddle_customer_id);
