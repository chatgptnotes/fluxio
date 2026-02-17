-- Remote Commands table for polling-based remote shell via TRB246 gateway
-- Commands are submitted from the dashboard, stored here, polled by the TRB246 agent,
-- executed locally, and results posted back.

CREATE TABLE remote_commands (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id     text NOT NULL,
  command       text NOT NULL,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','running','completed','failed','timeout','cancelled')),
  exit_code     integer,
  output        text,
  error_message text,
  submitted_by  text,
  timeout_secs  integer NOT NULL DEFAULT 30,
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  metadata      jsonb DEFAULT '{}'::jsonb
);

-- Fast lookup for pending commands per device (used by TRB246 polling agent)
CREATE INDEX idx_remote_cmd_pending ON remote_commands (device_id, status) WHERE status = 'pending';

-- History queries ordered by time (used by dashboard)
CREATE INDEX idx_remote_cmd_history ON remote_commands (device_id, created_at DESC);

-- Row Level Security
ALTER TABLE remote_commands ENABLE ROW LEVEL SECURITY;

-- Allow reads for all authenticated users (dashboard display)
CREATE POLICY "Anyone can read remote_commands" ON remote_commands FOR SELECT USING (true);

-- Service role can do everything (API routes use admin client)
CREATE POLICY "Service role manages remote_commands" ON remote_commands FOR ALL USING (auth.role() = 'service_role');
