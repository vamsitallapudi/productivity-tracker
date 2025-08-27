import { supabase } from './supabase'
import { runMigrations } from './migrations'

export async function initDatabase() {
  try {
    console.log('🔄 Initializing database...')
    
    // Try to run migrations first
    const migrationSuccess = await runMigrations()
    
    if (migrationSuccess) {
      console.log('✅ Database initialized successfully')
      return true
    }
    
    // If migrations failed, check if tables exist anyway
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1)
    
    if (tasksError) {
      console.error('❌ Database tables not found!')
      console.error('Please run the SQL schema in your Supabase dashboard:')
      console.error('1. Go to Supabase Dashboard → SQL Editor')
      console.error('2. Copy the contents of apps/web/supabase-schema.sql')
      console.error('3. Paste and run the SQL')
      console.error('4. Refresh this page')
      return false
    }
    
    console.log('✅ Database tables exist')
    return true
    
  } catch (error) {
    console.error('Error checking database:', error)
    return false
  }
}

export function getDatabaseSetupInstructions() {
  return `
🚨 Database Setup Required

Your Supabase database tables don't exist yet. Please follow these steps:

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
INSERT INTO users (email, name) VALUES 
  ('alex@example.com', 'Alex Evans');

INSERT INTO sessions (user_id, task, duration_minutes, efficiency_percentage) VALUES 
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Project Planning', 50, 92),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Code Review', 25, 88),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Design Work', 50, 95),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Email Processing', 25, 78),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Research', 50, 85);

4. Click "Run" to execute the SQL
5. Refresh this page

After running the SQL, custom task saving will work automatically!
  `
}
