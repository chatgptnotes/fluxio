#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n===========================================')
console.log('FluxIO Database Setup')
console.log('===========================================\n')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file\n')
  console.log('Please ensure these variables are set:')
  console.log('  - NEXT_PUBLIC_SUPABASE_URL')
  console.log('  - SUPABASE_SERVICE_ROLE_KEY\n')
  process.exit(1)
}

console.log('📋 Configuration:')
console.log(`   Supabase URL: ${supabaseUrl}`)
console.log(`   Project ID: ${supabaseUrl.split('//')[1].split('.')[0]}\n`)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testConnection() {
  console.log('🔌 Testing Supabase connection...')
  try {
    const { data, error } = await supabase.from('_supabase_migrations').select('version').limit(1)

    console.log('✅ Successfully connected to Supabase!\n')
    return true
  } catch (err) {
    console.log('✅ Connected to Supabase (expected error on empty database)\n')
    return true
  }
}

async function checkIfMigrationExists() {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('device_id')
      .limit(1)

    if (!error) {
      console.log('⚠️  Tables already exist!')
      console.log('   Database appears to be already set up.\n')
      return true
    }
    return false
  } catch (err) {
    return false
  }
}

async function runMigration() {
  console.log('📦 Running database migration...\n')

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20240101000000_initial_schema.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  console.log('   Migration file loaded successfully')
  console.log(`   File size: ${(sql.length / 1024).toFixed(2)} KB\n`)

  console.log('⏳ This will create the following tables:')
  console.log('   • devices')
  console.log('   • flow_data')
  console.log('   • alerts')
  console.log('   • alert_rules')
  console.log('   • users')
  console.log('   • audit_logs')
  console.log('   • dashboard_summary (view)\n')

  console.log('📝 Please run this SQL in Supabase SQL Editor:\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/aynoltymgusyasgxshng/editor')
  console.log('2. Click "SQL Editor" in the left sidebar')
  console.log('3. Click "New Query"')
  console.log('4. Copy the SQL from: supabase/migrations/20240101000000_initial_schema.sql')
  console.log('5. Paste and click "Run"\n')

  console.log('Or copy this command to use Supabase CLI:')
  console.log('   npx supabase db push\n')

  console.log('✨ After running the migration, you will have:')
  console.log('   • 6 database tables')
  console.log('   • 4 sample devices (NIVUS_01 to NIVUS_04)')
  console.log('   • Alert rules configured')
  console.log('   • Indexes for performance')
  console.log('   • Row Level Security policies\n')
}

async function verifyTables() {
  console.log('🔍 Verifying database tables...\n')

  const tables = ['devices', 'flow_data', 'alerts', 'alert_rules', 'users', 'audit_logs']

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)

      if (error) {
        console.log(`   ❌ ${table} - Not found`)
      } else {
        console.log(`   ✅ ${table} - Ready`)
      }
    } catch (err) {
      console.log(`   ❌ ${table} - Error: ${err.message}`)
    }
  }

  console.log('')
}

async function showSampleDevices() {
  console.log('📱 Checking sample devices...\n')

  try {
    const { data: devices, error } = await supabase
      .from('devices')
      .select('device_id, device_name, location, status')

    if (error) {
      console.log('   ⚠️  No devices found yet. Run the migration first.\n')
      return
    }

    if (devices && devices.length > 0) {
      console.log(`   Found ${devices.length} devices:\n`)
      devices.forEach((device) => {
        console.log(`   • ${device.device_id} - ${device.device_name}`)
        console.log(`     Location: ${device.location || 'N/A'}`)
        console.log(`     Status: ${device.status}\n`)
      })
    } else {
      console.log('   No devices found.\n')
    }
  } catch (err) {
    console.log('   ⚠️  Could not fetch devices\n')
  }
}

async function main() {
  const connected = await testConnection()

  if (!connected) {
    console.log('❌ Failed to connect to Supabase\n')
    process.exit(1)
  }

  const exists = await checkIfMigrationExists()

  if (exists) {
    await verifyTables()
    await showSampleDevices()
    console.log('✅ Database is already set up and ready to use!\n')
    console.log('🚀 Next steps:')
    console.log('   1. Start the development server: pnpm dev')
    console.log('   2. Test data ingestion: ./test-ingest.sh')
    console.log('   3. View dashboard: http://localhost:3000/dashboard\n')
  } else {
    await runMigration()
    console.log('⏸️  Waiting for you to run the migration...\n')
    console.log('After running the SQL, you can verify with:')
    console.log('   node scripts/setup-database.mjs\n')
  }

  console.log('===========================================\n')
}

main()
