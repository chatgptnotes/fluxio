-- Create Companies Table for FlowNexus
-- Run this in Supabase SQL Editor to fix the company dropdown issue

-- Create companies table if not exists
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create update trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for companies updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add company_id column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
  END IF;
END $$;

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and create new one
DROP POLICY IF EXISTS "Allow all for authenticated users" ON companies;
DROP POLICY IF EXISTS "Allow all for anon users" ON companies;
DROP POLICY IF EXISTS "Allow read for everyone" ON companies;

-- Create permissive policies for companies table
CREATE POLICY "Allow read for everyone" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON companies
  FOR ALL USING (auth.role() = 'authenticated');

-- Also allow anon users to read (for our custom auth)
CREATE POLICY "Allow anon read" ON companies
  FOR SELECT TO anon USING (true);

-- Insert default companies
INSERT INTO companies (name, code, description) VALUES
  ('FlowNexus', 'FLOWNEXUS', 'Default FlowNexus company'),
  ('CSTPS', 'CSTPS', 'Chandrapur Super Thermal Power Station')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Verify the data
SELECT id, name, code, description, is_active, created_at FROM companies;
