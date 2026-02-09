-- TBR 246 Gateway - Device Setup Script
-- Run this in Supabase SQL Editor to set up your Nivus 750 device

-- ============================================
-- STEP 1: Register the Nivus 750 Device
-- ============================================

-- Replace 'NIVUS_750_01' with your actual device ID
-- Replace location and description with your values

INSERT INTO devices (device_id, device_name, device_type, location, description, status)
VALUES (
  'NIVUS_750_01',
  'Nivus 750 Flow Meter #1',
  'nivus_flow_transmitter',
  'Main Building - Inlet',
  'Primary inlet flow measurement via TBR 246 gateway',
  'active'
)
ON CONFLICT (device_id) DO UPDATE SET
  device_name = EXCLUDED.device_name,
  location = EXCLUDED.location,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================
-- STEP 2: Create Default Alert Rules
-- ============================================

-- High Flow Alert
INSERT INTO alert_rules (device_id, rule_name, rule_type, threshold_value, severity, is_enabled)
VALUES ('NIVUS_750_01', 'High Flow Alert', 'high_flow', 100.0, 'warning', true)
ON CONFLICT DO NOTHING;

-- Zero Flow Alert (detects when flow should be present but is zero)
INSERT INTO alert_rules (device_id, rule_name, rule_type, threshold_value, severity, is_enabled)
VALUES ('NIVUS_750_01', 'Zero Flow Alert', 'zero_flow', 0.0, 'warning', true)
ON CONFLICT DO NOTHING;

-- Device Offline Alert (triggered when no data for 15+ minutes)
INSERT INTO alert_rules (device_id, rule_name, rule_type, threshold_value, duration_minutes, severity, is_enabled)
VALUES ('NIVUS_750_01', 'Device Offline', 'device_offline', NULL, 15, 'critical', true)
ON CONFLICT DO NOTHING;

-- Battery Low Alert
INSERT INTO alert_rules (device_id, rule_name, rule_type, threshold_value, severity, is_enabled)
VALUES ('NIVUS_750_01', 'Battery Low', 'battery_low', 20.0, 'warning', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3: Insert Test Data (Optional)
-- ============================================

-- Uncomment to insert test data for verification
/*
INSERT INTO flow_data (device_id, flow_rate, totalizer, temperature, signal_strength, metadata)
VALUES (
  'NIVUS_750_01',
  25.5,
  10500.75,
  22.3,
  -65,
  '{"gateway_imei": "TEST_IMEI", "source": "manual_test"}'::jsonb
);
*/

-- ============================================
-- STEP 4: Verify Setup
-- ============================================

-- Check device was registered
SELECT device_id, device_name, location, status, created_at
FROM devices
WHERE device_id = 'NIVUS_750_01';

-- Check alert rules
SELECT rule_name, rule_type, threshold_value, severity, is_enabled
FROM alert_rules
WHERE device_id = 'NIVUS_750_01';

-- Check recent flow data (will be empty until gateway starts sending)
SELECT device_id, flow_rate, totalizer, temperature, created_at
FROM flow_data
WHERE device_id = 'NIVUS_750_01'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- MULTIPLE DEVICES (copy and modify as needed)
-- ============================================

/*
-- Device 2
INSERT INTO devices (device_id, device_name, device_type, location, status)
VALUES ('NIVUS_750_02', 'Nivus 750 Flow Meter #2', 'nivus_flow_transmitter', 'Building B', 'active')
ON CONFLICT (device_id) DO NOTHING;

-- Device 3
INSERT INTO devices (device_id, device_name, device_type, location, status)
VALUES ('NIVUS_750_03', 'Nivus 750 Flow Meter #3', 'nivus_flow_transmitter', 'Building C', 'active')
ON CONFLICT (device_id) DO NOTHING;
*/
