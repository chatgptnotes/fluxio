-- Migration: Add email report settings to companies and create email_report_logs table
-- Created: 2026-02-02

-- Add settings column to companies table for email report configuration
ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create email report logs table to track sent reports
CREATE TABLE IF NOT EXISTS email_report_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  recipients TEXT[] NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  file_path TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, report_date)
);

-- Create index for efficient querying by company and date
CREATE INDEX IF NOT EXISTS idx_email_report_logs_company_date ON email_report_logs(company_id, report_date DESC);

-- Enable Row Level Security
ALTER TABLE email_report_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access email report logs
CREATE POLICY "Allow all for authenticated" ON email_report_logs
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Add comment for documentation
COMMENT ON COLUMN companies.settings IS 'JSON settings including dailyReportEnabled (boolean) and reportRecipients (operators/admins/all)';
COMMENT ON TABLE email_report_logs IS 'Tracks daily email report distribution to companies';
