import { supabase } from './supabase'

export async function runMigrations() {
  try {
    console.log('🔄 Checking database setup...')
    
    // Check if tables exist by trying to query them
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1)
    
    if (tasksError) {
      console.log('📦 Database tables not found')
      console.log('📋 Please set up your database:')
      console.log(getSetupInstructions())
      return false
    }
    
    // Also check if we have some data
    const { data: taskCount, error: countError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('⚠️ Tables exist but may be empty')
      return true // Tables exist, that's good enough
    }
    
    console.log(`✅ Database is ready! Found ${taskCount?.length || 0} tasks`)
    return true
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
    return false
  }
}

function getSetupInstructions() {
  return `
🚨 Database Setup Required

Your Supabase database needs to be set up. Please follow these steps:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor (left sidebar)
3. Copy and paste this SQL:

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
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

-- Create trigger for updated_at
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

-- Insert sample user
INSERT INTO users (email, name) VALUES ('alex@example.com', 'Alex Evans')
ON CONFLICT (email) DO NOTHING;

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
  ('Performance Optimization', 'Development')
ON CONFLICT (name) DO NOTHING;

-- Insert sample sessions
INSERT INTO sessions (user_id, task, duration_minutes, efficiency_percentage) 
SELECT 
  u.id,
  'Project Planning',
  50,
  92
FROM users u 
WHERE u.email = 'alex@example.com'
LIMIT 1
ON CONFLICT DO NOTHING;

4. Click "Run" to execute the SQL
5. Refresh this page

After this one-time setup, everything will work automatically!
  `
}
