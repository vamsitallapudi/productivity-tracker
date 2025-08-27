"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Copy, CheckCircle } from 'lucide-react'

export function DatabaseSetupModal() {
  const [copied, setCopied] = useState(false)

  const setupSQL = `-- Create users table
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
ON CONFLICT DO NOTHING;`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(setupSQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle>Database Setup Required</CardTitle>
          </div>
          <CardDescription>
            Your Supabase database needs to be set up before the app can work properly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Follow these steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Supabase Dashboard</a></li>
              <li>Navigate to <strong>SQL Editor</strong> (left sidebar)</li>
              <li>Copy the SQL below and paste it in the editor</li>
              <li>Click <strong>"Run"</strong> to execute the SQL</li>
              <li>Refresh this page</li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">SQL Setup Script:</label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
              <code>{setupSQL}</code>
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> This is a one-time setup. After running the SQL, your app will work automatically!
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
