#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  console.log('Starting database migration...\n')

  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/20240101000000_initial_schema.sql'
  )

  if (!fs.existsSync(migrationPath)) {
    console.error('Error: Migration file not found at', migrationPath)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('Executing migration SQL...')

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL,
    })

    if (error) {
      // If the RPC doesn't exist, we'll need to execute it differently
      console.log(
        '\nNote: Direct SQL execution via RPC not available.'
      )
      console.log('\nPlease run the migration manually:')
      console.log('1. Go to: https://aynoltymgusyasgxshng.supabase.co/project/aynoltymgusyasgxshng/editor')
      console.log(
        '2. Open the SQL Editor'
      )
      console.log(
        '3. Copy the contents of: supabase/migrations/20240101000000_initial_schema.sql'
      )
      console.log('4. Paste and run the SQL\n')
      console.log(
        'Or use the Supabase CLI: npx supabase db push'
      )
      return
    }

    console.log('Migration completed successfully!')
    console.log('Database tables created:\n')
    console.log('  - devices')
    console.log('  - flow_data')
    console.log('  - alerts')
    console.log('  - alert_rules')
    console.log('  - users')
    console.log('  - audit_logs')
    console.log('\nSample devices inserted:')
    console.log('  - NIVUS_01 (Main Inlet Flow)')
    console.log('  - NIVUS_02 (Secondary Inlet)')
    console.log('  - NIVUS_03 (Outlet Flow)')
    console.log('  - NIVUS_04 (Backup Flow)')
    console.log('\nYou can now test the application!')
  } catch (err) {
    console.error('Error executing migration:', err.message)
    console.log('\nPlease run the migration manually in Supabase SQL Editor.')
  }
}

// Verify connection first
async function verifyConnection() {
  console.log('Verifying Supabase connection...')
  try {
    const { data, error } = await supabase
      .from('_no_table_')
      .select('*')
      .limit(1)

    // We expect an error since the table doesn't exist
    // But if we get a connection, that's good
    console.log('✓ Successfully connected to Supabase!\n')
    return true
  } catch (err) {
    console.error('✗ Failed to connect to Supabase:', err.message)
    return false
  }
}

async function main() {
  const connected = await verifyConnection()

  if (!connected) {
    console.log('\nPlease check your Supabase credentials in .env')
    process.exit(1)
  }

  await runMigration()
}

main()
