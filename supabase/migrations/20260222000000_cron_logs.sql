-- Cron execution logs for watchdog monitoring
CREATE TABLE IF NOT EXISTS cron_logs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_logs (job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_status ON cron_logs (job_name, status);

-- Enable RLS (matching audit_logs pattern)
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (cron jobs use service role key)
CREATE POLICY "Service role full access on cron_logs"
  ON cron_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert SYSTEM pseudo-device for system-level alerts
INSERT INTO devices (device_id, device_name, device_type, status, metadata)
VALUES (
  'SYSTEM',
  'System Monitor',
  'system',
  'active',
  '{"description": "Pseudo-device for system-level alerts (cron failures, watchdog)"}'::jsonb
)
ON CONFLICT (device_id) DO NOTHING;
