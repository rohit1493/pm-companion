-- Migration: add avatar column to user_profiles
-- Run in Supabase SQL editor or via CLI before deploying UI changes.
-- Default 'sensei' backfills all existing rows cleanly.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS avatar text NOT NULL DEFAULT 'sensei'
  CHECK (avatar IN ('sensei','shadow','kata','guardian','monk','chronicler'));
