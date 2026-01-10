-- Create reports table for storing generated report metadata
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL DEFAULT 'daily',
  report_date DATE NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON reports(generated_at DESC);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (can be restricted further)
CREATE POLICY "Allow read access to reports" ON reports
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for service role" ON reports
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for reports (run this in Supabase dashboard if not using migrations)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);
