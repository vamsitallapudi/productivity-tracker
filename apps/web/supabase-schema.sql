-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  email_preferences JSONB DEFAULT '{"session_reminders": true, "weekly_summaries": true, "achievement_notifications": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table for predefined tasks
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  efficiency_percentage INTEGER NOT NULL CHECK (efficiency_percentage >= 0 AND efficiency_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined tasks
INSERT INTO tasks (name, category) VALUES 
  ('Project Planning', 'Planning'),
  ('Code Review', 'Development'),
  ('Design Work', 'Design'),
  ('Email Processing', 'Communication'),
  ('Research', 'Learning'),
  ('Bug Fixing', 'Development'),
  ('Documentation', 'Writing'),
  ('Team Meeting', 'Communication'),
  ('Data Analysis', 'Analysis'),
  ('Testing', 'Quality Assurance'),
  ('Architecture Design', 'Planning'),
  ('Content Creation', 'Creative'),
  ('System Maintenance', 'Operations'),
  ('User Research', 'Research'),
  ('Performance Optimization', 'Development');

-- Insert sample data
INSERT INTO users (email, name, display_name, email_preferences) VALUES 
  ('alex@example.com', 'Alex Evans', 'Alex Evans', '{"session_reminders": true, "weekly_summaries": true, "achievement_notifications": true}');

INSERT INTO sessions (user_id, task, duration_minutes, efficiency_percentage) VALUES 
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Project Planning', 50, 92),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Code Review', 25, 88),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Design Work', 50, 95),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Email Processing', 25, 78),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Research', 50, 85);

-- Create user_streaks table for tracking streak data
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

-- Create streak_achievements table for tracking unlocked achievements
CREATE TABLE streak_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_activities table for tracking daily session data
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

-- Add triggers for streak tables
CREATE TRIGGER update_user_streaks_updated_at 
  BEFORE UPDATE ON user_streaks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_activities_updated_at 
  BEFORE UPDATE ON daily_activities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_streak_type ON user_streaks(streak_type);
CREATE INDEX idx_streak_achievements_user_id ON streak_achievements(user_id);
CREATE INDEX idx_streak_achievements_type ON streak_achievements(achievement_type);
CREATE INDEX idx_daily_activities_user_id ON daily_activities(user_id);
CREATE INDEX idx_daily_activities_date ON daily_activities(activity_date);
CREATE INDEX idx_daily_activities_user_date ON daily_activities(user_id, activity_date);

-- Insert sample streak data for demonstration
INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date) VALUES 
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'daily', 5, 12, CURRENT_DATE, CURRENT_DATE - INTERVAL '4 days');

-- Insert sample daily activities
INSERT INTO daily_activities (user_id, activity_date, session_count, total_minutes, streak_eligible) VALUES 
  ((SELECT id FROM users WHERE email = 'alex@example.com'), CURRENT_DATE - INTERVAL '4 days', 2, 75, true),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), CURRENT_DATE - INTERVAL '3 days', 1, 50, true),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), CURRENT_DATE - INTERVAL '2 days', 3, 125, true),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), CURRENT_DATE - INTERVAL '1 day', 1, 25, true),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), CURRENT_DATE, 2, 100, true);

-- Insert sample achievements
INSERT INTO streak_achievements (user_id, achievement_type, achievement_name, metadata) VALUES 
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'milestone', 'First Streak', '{"days": 1, "description": "Completed your first day streak!"}'::jsonb),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'milestone', 'Week Warrior', '{"days": 7, "description": "Maintained a 7-day streak!"}'::jsonb);
