-- Migration to support multiple streak types with icons and management
-- PREREQUISITE: Run the base supabase-schema.sql first to create the user_streaks table
-- This migration enhances the existing streak system with multiple types

-- Check if user_streaks table exists, if not, create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
        -- Create user_streaks table if it doesn't exist (from base schema)
        CREATE TABLE user_streaks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          streak_type TEXT NOT NULL DEFAULT 'daily',
          current_streak INTEGER NOT NULL DEFAULT 0,
          longest_streak INTEGER NOT NULL DEFAULT 0,
          last_activity_date DATE,
          streak_start_date DATE,
          freeze_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, streak_type)
        );
        
        CREATE TRIGGER update_user_streaks_updated_at 
          BEFORE UPDATE ON user_streaks 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
          
        CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
        CREATE INDEX idx_user_streaks_streak_type ON user_streaks(streak_type);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_activities') THEN
        -- Create daily_activities table if it doesn't exist
        CREATE TABLE daily_activities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          activity_date DATE NOT NULL,
          session_count INTEGER NOT NULL DEFAULT 0,
          total_minutes INTEGER NOT NULL DEFAULT 0,
          streak_eligible BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, activity_date)
        );
        
        CREATE TRIGGER update_daily_activities_updated_at 
          BEFORE UPDATE ON daily_activities 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
          
        CREATE INDEX idx_daily_activities_user_id ON daily_activities(user_id);
        CREATE INDEX idx_daily_activities_date ON daily_activities(activity_date);
        CREATE INDEX idx_daily_activities_user_date ON daily_activities(user_id, activity_date);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'streak_achievements') THEN
        -- Create streak_achievements table if it doesn't exist
        CREATE TABLE streak_achievements (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          achievement_type TEXT NOT NULL,
          achievement_name TEXT NOT NULL,
          unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_streak_achievements_user_id ON streak_achievements(user_id);
        CREATE INDEX idx_streak_achievements_type ON streak_achievements(achievement_type);
    END IF;
END $$;

-- Create streak_types table for predefined streak types
CREATE TABLE streak_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  default_icon TEXT NOT NULL,
  default_color TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to user_streaks table for customization
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS streak_type_id UUID REFERENCES streak_types(id);
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Drop the old unique constraint and add new one for (user_id, name)
ALTER TABLE user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_id_streak_type_key;
ALTER TABLE user_streaks ADD CONSTRAINT user_streaks_user_id_name_unique UNIQUE (user_id, name);

-- Update daily_activities to track specific streaks instead of user-wide
ALTER TABLE daily_activities ADD COLUMN IF NOT EXISTS streak_id UUID REFERENCES user_streaks(id) ON DELETE CASCADE;
ALTER TABLE daily_activities DROP CONSTRAINT IF EXISTS daily_activities_user_id_activity_date_key;
ALTER TABLE daily_activities ADD CONSTRAINT daily_activities_streak_id_date_unique UNIQUE (streak_id, activity_date);

-- Update streak_achievements to track streak-specific achievements
ALTER TABLE streak_achievements ADD COLUMN IF NOT EXISTS streak_id UUID REFERENCES user_streaks(id) ON DELETE CASCADE;

-- Insert predefined streak types
INSERT INTO streak_types (name, default_icon, default_color, category, description) VALUES
  ('Exercise', 'Dumbbell', 'red', 'Health & Fitness', 'Track your daily exercise and workout consistency'),
  ('EBER', 'BookOpen', 'blue', 'Learning', 'Consistent learning and knowledge building'),
  ('Tracked Streak', 'Target', 'purple', 'General', 'Generic goal tracking with customizable metrics'),
  ('Interview Prep', 'Users', 'green', 'Career', 'Prepare for interviews and practice coding questions'),
  ('DSA Streak', 'Code', 'orange', 'Programming', 'Data Structures and Algorithms practice'),
  ('Cooking Streak', 'ChefHat', 'yellow', 'Lifestyle', 'Daily cooking and meal preparation habits'),
  ('Sthitha Pragna Streak', 'Brain', 'indigo', 'Mindfulness', 'Mental equilibrium and mindfulness practice');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_name ON user_streaks(name);
CREATE INDEX IF NOT EXISTS idx_user_streaks_display_order ON user_streaks(display_order);
CREATE INDEX IF NOT EXISTS idx_user_streaks_active ON user_streaks(is_active);
CREATE INDEX IF NOT EXISTS idx_streak_types_category ON streak_types(category);
CREATE INDEX IF NOT EXISTS idx_daily_activities_streak_id ON daily_activities(streak_id);
CREATE INDEX IF NOT EXISTS idx_streak_achievements_streak_id ON streak_achievements(streak_id);

-- Migrate existing data and create default streaks for users
DO $$
DECLARE
    learning_type_id UUID;
    exercise_type_id UUID;
    dsa_type_id UUID;
    cooking_type_id UUID;
    user_record RECORD;
    user_streak RECORD;
BEGIN
    -- Get streak type IDs
    SELECT id INTO learning_type_id FROM streak_types WHERE name = 'EBER' LIMIT 1;
    SELECT id INTO exercise_type_id FROM streak_types WHERE name = 'Exercise' LIMIT 1;
    SELECT id INTO dsa_type_id FROM streak_types WHERE name = 'DSA Streak' LIMIT 1;
    SELECT id INTO cooking_type_id FROM streak_types WHERE name = 'Cooking Streak' LIMIT 1;
    
    -- Update existing user_streaks with default values
    FOR user_streak IN SELECT id, user_id FROM user_streaks WHERE name IS NULL
    LOOP
        UPDATE user_streaks SET
            name = 'Learning Streak',
            streak_type_id = learning_type_id,
            icon = 'BookOpen',
            color = 'blue',
            category = 'Learning',
            description = 'Your daily learning and focus sessions',
            is_active = true,
            display_order = 0
        WHERE id = user_streak.id;
    END LOOP;
    
    -- Create default streaks for all existing users who don't have them yet
    FOR user_record IN SELECT id FROM users
    LOOP
        -- Check if user already has streaks
        IF NOT EXISTS (SELECT 1 FROM user_streaks WHERE user_id = user_record.id) THEN
            -- Insert 4 default streaks for new users
            INSERT INTO user_streaks (user_id, name, streak_type_id, streak_type, icon, color, category, description, is_active, display_order, current_streak, longest_streak, freeze_count) VALUES
                (user_record.id, 'Learning Streak', learning_type_id, 'daily', 'BookOpen', 'blue', 'Learning', 'Daily learning and knowledge building', true, 0, 0, 0, 0),
                (user_record.id, 'Exercise', exercise_type_id, 'daily', 'Dumbbell', 'red', 'Health & Fitness', 'Track your daily exercise and workout consistency', true, 1, 0, 0, 0),
                (user_record.id, 'DSA Practice', dsa_type_id, 'daily', 'Code', 'orange', 'Programming', 'Data Structures and Algorithms practice', true, 2, 0, 0, 0),
                (user_record.id, 'Cooking', cooking_type_id, 'daily', 'ChefHat', 'yellow', 'Lifestyle', 'Daily cooking and meal preparation habits', true, 3, 0, 0, 0);
        END IF;
    END LOOP;
    
    -- Update existing daily_activities to link to user streaks
    UPDATE daily_activities SET
        streak_id = (
            SELECT us.id 
            FROM user_streaks us 
            WHERE us.user_id = daily_activities.user_id 
            AND us.name = 'Learning Streak'
            LIMIT 1
        )
    WHERE streak_id IS NULL;
    
    -- Update existing achievements to link to user streaks
    UPDATE streak_achievements SET
        streak_id = (
            SELECT us.id 
            FROM user_streaks us 
            WHERE us.user_id = streak_achievements.user_id 
            AND us.name = 'Learning Streak'
            LIMIT 1
        )
    WHERE streak_id IS NULL;
END $$;

-- Make name and streak_type_id NOT NULL after migration
ALTER TABLE user_streaks ALTER COLUMN name SET NOT NULL;
ALTER TABLE user_streaks ALTER COLUMN streak_type_id SET NOT NULL;

-- Add check constraints
ALTER TABLE user_streaks ADD CONSTRAINT check_display_order_positive CHECK (display_order >= 0);
ALTER TABLE streak_types ADD CONSTRAINT check_color_format CHECK (default_color ~ '^[a-z]+$');
ALTER TABLE user_streaks ADD CONSTRAINT check_color_format CHECK (color ~ '^[a-z]+$');

-- Create function to handle streak ordering
CREATE OR REPLACE FUNCTION update_streak_display_order()
RETURNS TRIGGER AS $$
BEGIN
    -- If no display_order specified, set it to max + 1 for this user
    IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
        SELECT COALESCE(MAX(display_order), 0) + 1 
        INTO NEW.display_order 
        FROM user_streaks 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic ordering
CREATE TRIGGER trigger_update_streak_display_order
    BEFORE INSERT OR UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_streak_display_order();

-- Grant permissions (adjust based on your RLS policies)
GRANT ALL ON streak_types TO authenticated;
GRANT ALL ON user_streaks TO authenticated;
GRANT ALL ON daily_activities TO authenticated;
GRANT ALL ON streak_achievements TO authenticated;