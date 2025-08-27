-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
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

-- Insert sample data
INSERT INTO users (email, name) VALUES 
  ('alex@example.com', 'Alex Evans');

INSERT INTO sessions (user_id, task, duration_minutes, efficiency_percentage) VALUES 
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Project Planning', 50, 92),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Code Review', 25, 88),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Design Work', 50, 95),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Email Processing', 25, 78),
  ((SELECT id FROM users WHERE email = 'alex@example.com'), 'Research', 50, 85);
