-- Fix RLS policies and add missing indexes
-- 1. Tighten reports table RLS (was USING (true) - allowed unauthenticated reads)
-- 2. Fix remote_commands RLS (remove overly permissive SELECT policy)
-- 3. Add missing index on alert_rules.device_id

-- Fix reports RLS: require authenticated for reads
DROP POLICY IF EXISTS "Allow read access to reports" ON reports;
CREATE POLICY "Allow read access to reports"
  ON reports FOR SELECT
  USING (auth.role() = 'authenticated');

-- Fix remote_commands RLS: remove the overly permissive "anyone can read" policy
DROP POLICY IF EXISTS "Anyone can read remote_commands" ON remote_commands;
CREATE POLICY "Authenticated users can read remote_commands"
  ON remote_commands FOR SELECT
  USING (auth.role() = 'authenticated');

-- Add missing index on alert_rules.device_id (frequently queried in ingest)
CREATE INDEX IF NOT EXISTS idx_alert_rules_device_id ON alert_rules(device_id);
