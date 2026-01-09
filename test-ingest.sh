#!/bin/bash

# FluxIO API Test Script
# This script simulates data from a Teltonika gateway

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/ingest}"
API_KEY="${API_KEY:-test_key_change_in_production}"

echo "================================"
echo "FluxIO API Test Script"
echo "================================"
echo "API URL: $API_URL"
echo "API Key: ${API_KEY:0:10}..."
echo "================================"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check (GET)"
echo "---"
curl -s -X GET "$API_URL" | jq '.'
echo ""
echo ""

# Test 2: Single Device Data
echo "Test 2: Sending single device data"
echo "---"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "device_id": "NIVUS_01",
    "flow_rate": 12.5,
    "totalizer": 4500.25,
    "temperature": 22.3,
    "pressure": 1.2,
    "battery_level": 95,
    "signal_strength": -65
  }' | jq '.'
echo ""
echo ""

# Test 3: Multiple Devices (Batch)
echo "Test 3: Sending batch data (multiple devices)"
echo "---"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '[
    {
      "device_id": "NIVUS_01",
      "flow_rate": 13.2,
      "totalizer": 4501.30
    },
    {
      "device_id": "NIVUS_02",
      "flow_rate": 8.7,
      "totalizer": 3200.50
    },
    {
      "device_id": "NIVUS_03",
      "flow_rate": 15.1,
      "totalizer": 5100.75
    }
  ]' | jq '.'
echo ""
echo ""

# Test 4: Invalid API Key
echo "Test 4: Testing authentication (invalid API key)"
echo "---"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong_key" \
  -d '{
    "device_id": "NIVUS_01",
    "flow_rate": 10.0
  }' | jq '.'
echo ""
echo ""

# Test 5: Invalid Data Format
echo "Test 5: Testing validation (missing required field)"
echo "---"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "flow_rate": 10.0
  }' | jq '.'
echo ""
echo ""

# Test 6: Continuous Data Simulation (10 readings)
echo "Test 6: Simulating continuous data stream (10 readings)"
echo "---"
for i in {1..10}; do
  FLOW_RATE=$(echo "10 + $i * 0.5" | bc)
  TOTALIZER=$(echo "4500 + $i" | bc)

  echo "Reading $i: Flow=$FLOW_RATE m³/h"

  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{
      \"device_id\": \"NIVUS_01\",
      \"flow_rate\": $FLOW_RATE,
      \"totalizer\": $TOTALIZER,
      \"temperature\": $(echo "20 + $i * 0.2" | bc)
    }" > /dev/null

  sleep 2
done

echo ""
echo "Done! Check your dashboard at http://localhost:3000"
echo ""
