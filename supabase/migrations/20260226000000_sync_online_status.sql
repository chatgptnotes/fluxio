-- Update dashboard_summary view to use a 60-minute window for online status
-- This syncs the Superadmin dashboard with the CSTPS pipeline view logic
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  COUNT(DISTINCT d.device_id) AS total_devices,
  COUNT(DISTINCT d.device_id) FILTER (WHERE d.status = 'active') AS active_devices,
  COUNT(DISTINCT d.device_id) FILTER (WHERE d.last_seen > NOW() - INTERVAL '60 minutes') AS online_devices,
  COUNT(*) FILTER (WHERE a.is_resolved = FALSE) AS active_alerts,
  COUNT(*) FILTER (WHERE a.severity = 'critical' AND a.is_resolved = FALSE) AS critical_alerts,
  COALESCE(SUM(fd.flow_rate) FILTER (WHERE fd.created_at > NOW() - INTERVAL '1 hour'), 0) * 3600 AS total_flow_volume
FROM devices d
LEFT JOIN alerts a ON d.device_id = a.device_id
LEFT JOIN (
  SELECT DISTINCT ON (device_id) device_id, flow_rate, created_at
  FROM flow_data
  ORDER BY device_id, created_at DESC
) fd ON d.device_id = fd.device_id;

COMMENT ON VIEW dashboard_summary IS 'Summarized fleet-wide statistics for the Superadmin dashboard with a 60-minute online window.';
