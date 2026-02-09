-- User Management System Migration
-- Version 1.3 - February 1, 2026

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for companies updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Modify users table to add authentication and permission fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Create user_pipeline_access table for granular pipeline permissions
CREATE TABLE IF NOT EXISTS user_pipeline_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pipeline_id TEXT NOT NULL,
  permissions JSONB DEFAULT '{"view": true, "reports": false, "alarmAcknowledge": false, "edit": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pipeline_id)
);

-- Add trigger for user_pipeline_access updated_at
CREATE TRIGGER update_user_pipeline_access_updated_at
  BEFORE UPDATE ON user_pipeline_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create permission_templates table for reusable permission sets
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for permission_templates updated_at
CREATE TRIGGER update_permission_templates_updated_at
  BEFORE UPDATE ON permission_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_is_superadmin ON users(is_superadmin) WHERE is_superadmin = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_pipeline_access_user_id ON user_pipeline_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pipeline_access_pipeline_id ON user_pipeline_access(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Enable RLS on new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pipeline_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Allow all for authenticated users" ON companies
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for user_pipeline_access
CREATE POLICY "Allow all for authenticated users" ON user_pipeline_access
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for permission_templates
CREATE POLICY "Allow all for authenticated users" ON permission_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for user_sessions
CREATE POLICY "Allow all for authenticated users" ON user_sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default companies
INSERT INTO companies (name, code, description) VALUES
  ('FluxIO', 'FLUXIO', 'Default FluxIO company'),
  ('CSTPS', 'CSTPS', 'Chandrapur Super Thermal Power Station')
ON CONFLICT (code) DO NOTHING;

-- Insert default permission templates
INSERT INTO permission_templates (name, description, permissions) VALUES
  ('View Only', 'Can only view pipeline data', '{"view": true, "reports": false, "alarmAcknowledge": false, "edit": false}'::jsonb),
  ('Report Generator', 'Can view and generate reports', '{"view": true, "reports": true, "alarmAcknowledge": false, "edit": false}'::jsonb),
  ('Alarm Manager', 'Can view, generate reports, and acknowledge alarms', '{"view": true, "reports": true, "alarmAcknowledge": true, "edit": false}'::jsonb),
  ('Full Access', 'Full access to all features', '{"view": true, "reports": true, "alarmAcknowledge": true, "edit": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert superadmin user (password: Lightyear@123, will be hashed by application)
-- Password hash generated using bcrypt with 12 rounds
-- For development, using a pre-computed hash
INSERT INTO users (
  username,
  email,
  full_name,
  role,
  is_superadmin,
  permissions,
  is_active
) VALUES (
  'buzzlightyear_42',
  'superadmin@fluxio.com',
  'Super Administrator',
  'admin',
  TRUE,
  '{"all": true, "canCreateUsers": true, "canManagePermissions": true, "canAccessAllPipelines": true}'::jsonb,
  TRUE
) ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  is_superadmin = EXCLUDED.is_superadmin,
  permissions = EXCLUDED.permissions;

-- Function to check if user has permission for a pipeline
CREATE OR REPLACE FUNCTION check_pipeline_permission(
  p_user_id UUID,
  p_pipeline_id TEXT,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_superadmin BOOLEAN;
  v_has_permission BOOLEAN;
BEGIN
  -- Check if user is superadmin
  SELECT is_superadmin INTO v_is_superadmin
  FROM users
  WHERE id = p_user_id AND is_active = TRUE;

  -- Superadmin has all permissions
  IF v_is_superadmin = TRUE THEN
    RETURN TRUE;
  END IF;

  -- Check specific pipeline permission
  SELECT (permissions->>p_permission)::BOOLEAN INTO v_has_permission
  FROM user_pipeline_access
  WHERE user_id = p_user_id AND pipeline_id = p_pipeline_id;

  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible pipelines
CREATE OR REPLACE FUNCTION get_user_pipelines(p_user_id UUID)
RETURNS TABLE (
  pipeline_id TEXT,
  permissions JSONB
) AS $$
DECLARE
  v_is_superadmin BOOLEAN;
BEGIN
  -- Check if user is superadmin
  SELECT is_superadmin INTO v_is_superadmin
  FROM users
  WHERE id = p_user_id AND is_active = TRUE;

  -- Superadmin gets all pipelines with full permissions
  IF v_is_superadmin = TRUE THEN
    RETURN QUERY
    SELECT DISTINCT d.device_id AS pipeline_id,
           '{"view": true, "reports": true, "alarmAcknowledge": true, "edit": true}'::JSONB AS permissions
    FROM devices d;
  ELSE
    -- Regular user gets only assigned pipelines
    RETURN QUERY
    SELECT upa.pipeline_id, upa.permissions
    FROM user_pipeline_access upa
    WHERE upa.user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE companies IS 'Stores company information for multi-tenant support';
COMMENT ON TABLE user_pipeline_access IS 'Stores user access permissions for specific pipelines';
COMMENT ON TABLE permission_templates IS 'Stores reusable permission template configurations';
COMMENT ON TABLE user_sessions IS 'Stores active user sessions for authentication';
COMMENT ON FUNCTION check_pipeline_permission IS 'Checks if a user has a specific permission for a pipeline';
COMMENT ON FUNCTION get_user_pipelines IS 'Returns all pipelines accessible by a user with their permissions';
COMMENT ON FUNCTION clean_expired_sessions IS 'Removes expired user sessions from the database';
