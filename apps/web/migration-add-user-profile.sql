-- Migration: Add user profile fields to existing users table
-- Run this script in your Supabase SQL editor if you have an existing database

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"session_reminders": true, "weekly_summaries": true, "achievement_notifications": true}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update display_name for existing users (set to their existing name)
UPDATE users 
SET display_name = name 
WHERE display_name IS NULL;

-- Create trigger for updated_at if it doesn't exist
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;