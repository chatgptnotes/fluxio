/**
 * Initialize user management tables in Supabase
 * This script creates the necessary tables for user authentication
 *
 * Run with: npx tsx scripts/init-user-tables.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

const supabaseUrl = 'https://dzmiisuxwruoeklbkyzc.supabase.co';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initTables() {
  console.log('Initializing user management tables...\n');

  // Since we can't run raw SQL via the REST API, we'll need to use a different approach
  // The Supabase client doesn't support table creation
  // We need to provide SQL to be run manually in the Supabase dashboard

  console.log('==========================================');
  console.log('IMPORTANT: Manual Setup Required');
  console.log('==========================================');
  console.log('\nThe users table needs to be created in Supabase.');
  console.log('\nPlease follow these steps:\n');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project: dzmiisuxwruoeklbkyzc');
  console.log('3. Go to SQL Editor (left sidebar)');
  console.log('4. Create a new query');
  console.log('5. Copy and paste the SQL below:');
  console.log('\n------ SQL START ------\n');

  const sql = `
-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
  is_superadmin BOOLEAN DEFAULT FALSE,
  company_id UUID,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_pipeline_access table
CREATE TABLE IF NOT EXISTS user_pipeline_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL,
  permissions JSONB DEFAULT '{"view": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pipeline_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- Insert superadmin user (password: Lightyear@123)
-- bcrypt hash with 12 rounds
INSERT INTO users (
  username,
  email,
  full_name,
  password_hash,
  role,
  is_superadmin,
  permissions,
  is_active
) VALUES (
  'buzzlightyear_42',
  'superadmin@flownexus.com',
  'Super Administrator',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.K5mPjRXrBh4GSe',
  'admin',
  TRUE,
  '{"all": true, "canCreateUsers": true, "canManagePermissions": true, "canAccessAllPipelines": true}'::jsonb,
  TRUE
) ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  is_superadmin = EXCLUDED.is_superadmin,
  permissions = EXCLUDED.permissions;

-- Insert default company
INSERT INTO companies (name, code, description) VALUES
  ('FlowNexus', 'FLOWNEXUS', 'Default FlowNexus company')
ON CONFLICT (code) DO NOTHING;
`;

  console.log(sql);
  console.log('\n------ SQL END ------\n');
  console.log('6. Click "Run" to execute the SQL');
  console.log('7. Return here and press Enter to verify');
  console.log('\n==========================================');

  // Wait for user input
  process.stdout.write('\nPress Enter after running the SQL in Supabase dashboard...');
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // Verify the setup
  console.log('\n\nVerifying setup...');

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'buzzlightyear_42')
    .single();

  if (error) {
    console.log('\nError: Users table not found or superadmin not created.');
    console.log('Please make sure you ran the SQL in Supabase dashboard.');
    console.log('Error details:', error.message);
  } else {
    console.log('\nSuccess! Superadmin user created:');
    console.log('  Username:', user.username);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Is Superadmin:', user.is_superadmin);
    console.log('\nYou can now log in at: http://localhost:3005/login');
    console.log('  Username: buzzlightyear_42');
    console.log('  Password: Lightyear@123');
  }

  process.exit(0);
}

initTables().catch(console.error);
