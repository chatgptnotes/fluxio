-- Data Retention Policy: Auto-delete flow_data older than 1 year
-- This function is called by the cleanup cron job daily

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_flow_data(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than retention period
  DELETE FROM flow_data
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  -- Get count of deleted rows
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup (optional - for audit purposes)
  INSERT INTO audit_logs (action, resource_type, details)
  VALUES (
    'data_retention_cleanup',
    'flow_data',
    jsonb_build_object(
      'deleted_rows', deleted_count,
      'retention_days', retention_days,
      'cutoff_date', (NOW() - (retention_days || ' days')::INTERVAL)::TEXT
    )
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_flow_data(INTEGER) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_old_flow_data IS
  'Deletes flow_data records older than specified retention period (default 365 days). Called daily by cron job.';
