-- Register 6 CSTPS NIVUS 750 Flow Sensors in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Insert/Update CSTPS devices (NIVUS_750_001 through NIVUS_750_006)
INSERT INTO devices (device_id, device_name, device_type, location, description, status, metadata)
VALUES
  (
    'NIVUS_750_001',
    'Nivus750_Line1',
    'nivus_flow_transmitter',
    'Pipe_1',
    'NIVUS 750 Flow Transmitter - Line 1',
    'active',
    '{"pipe_number": 1, "sensor_model": "NIVUS NivuFlow 750"}'::jsonb
  ),
  (
    'NIVUS_750_002',
    'Nivus750_Line2',
    'nivus_flow_transmitter',
    'Pipe_2',
    'NIVUS 750 Flow Transmitter - Line 2',
    'active',
    '{"pipe_number": 2, "sensor_model": "NIVUS NivuFlow 750"}'::jsonb
  ),
  (
    'NIVUS_750_003',
    'Nivus750_Line3',
    'nivus_flow_transmitter',
    'Pipe_3',
    'NIVUS 750 Flow Transmitter - Line 3',
    'active',
    '{"pipe_number": 3, "sensor_model": "NIVUS NivuFlow 750"}'::jsonb
  ),
  (
    'NIVUS_750_004',
    'Nivus750_Line4',
    'nivus_flow_transmitter',
    'Pipe_4',
    'NIVUS 750 Flow Transmitter - Line 4',
    'active',
    '{"pipe_number": 4, "sensor_model": "NIVUS NivuFlow 750"}'::jsonb
  ),
  (
    'NIVUS_750_005',
    'Nivus750_Line5',
    'nivus_flow_transmitter',
    'Pipe_5',
    'NIVUS 750 Flow Transmitter - Line 5',
    'active',
    '{"pipe_number": 5, "sensor_model": "NIVUS NivuFlow 750"}'::jsonb
  ),
  (
    'NIVUS_750_006',
    'Nivus750_Line6',
    'nivus_flow_transmitter',
    'Pipe_6',
    'NIVUS 750 Flow Transmitter - Line 6',
    'active',
    '{"pipe_number": 6, "sensor_model": "NIVUS NivuFlow 750"}'::jsonb
  )
ON CONFLICT (device_id) DO UPDATE SET
  device_name = EXCLUDED.device_name,
  location = EXCLUDED.location,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Insert default alert rules for CSTPS devices
INSERT INTO alert_rules (device_id, rule_name, rule_type, threshold_value, severity, is_enabled)
VALUES
  -- NIVUS_750_001 - Main Intake (expected: 120-140 m3/h)
  ('NIVUS_750_001', 'High Flow Alert', 'high_flow', 150.0, 'warning', true),
  ('NIVUS_750_001', 'Low Flow Alert', 'low_flow', 100.0, 'warning', true),
  ('NIVUS_750_001', 'Zero Flow Alert', 'zero_flow', NULL, 'critical', true),

  -- NIVUS_750_002 - Secondary Intake (expected: 90-110 m3/h)
  ('NIVUS_750_002', 'High Flow Alert', 'high_flow', 120.0, 'warning', true),
  ('NIVUS_750_002', 'Low Flow Alert', 'low_flow', 80.0, 'warning', true),
  ('NIVUS_750_002', 'Zero Flow Alert', 'zero_flow', NULL, 'critical', true),

  -- NIVUS_750_003 - Cooling Water (expected: 70-85 m3/h)
  ('NIVUS_750_003', 'High Flow Alert', 'high_flow', 95.0, 'warning', true),
  ('NIVUS_750_003', 'Low Flow Alert', 'low_flow', 60.0, 'warning', true),
  ('NIVUS_750_003', 'Zero Flow Alert', 'zero_flow', NULL, 'critical', true),

  -- NIVUS_750_004 - Auxiliary Feed (expected: 40-55 m3/h)
  ('NIVUS_750_004', 'High Flow Alert', 'high_flow', 65.0, 'warning', true),
  ('NIVUS_750_004', 'Low Flow Alert', 'low_flow', 30.0, 'warning', true),
  ('NIVUS_750_004', 'Zero Flow Alert', 'zero_flow', NULL, 'critical', true),

  -- NIVUS_750_005 - Emergency Supply (expected: 10-20 m3/h)
  ('NIVUS_750_005', 'High Flow Alert', 'high_flow', 30.0, 'warning', true),
  ('NIVUS_750_005', 'Low Flow Alert', 'low_flow', 5.0, 'info', true),
  ('NIVUS_750_005', 'Zero Flow Alert', 'zero_flow', NULL, 'info', true),

  -- NIVUS_750_006 - Overflow Return (expected: 0-5 m3/h, normally low)
  ('NIVUS_750_006', 'High Flow Alert', 'high_flow', 10.0, 'warning', true),
  ('NIVUS_750_006', 'Battery Low Alert', 'battery_low', 20.0, 'warning', true)
ON CONFLICT DO NOTHING;

-- Verify the inserts
SELECT device_id, device_name, location, status FROM devices WHERE device_id LIKE 'NIVUS_750_%' ORDER BY device_id;
