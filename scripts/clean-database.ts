// FluxIO Database Cleanup Script
// Run with: pnpm tsx scripts/clean-database.ts

import { createClient } from '@supabase/supabase-js'

// Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzmiisuxwruoeklbkyzc.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('Run with: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/clean-database.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanDatabase() {
  console.log('\n=== FluxIO Database Cleanup ===\n')

  // Step 1: Delete all alerts
  console.log('1. Deleting all alerts...')
  const { error: alertsError, count: alertsCount } = await supabase
    .from('alerts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('*', { count: 'exact', head: true })

  if (alertsError) {
    console.log(`   Error: ${alertsError.message}`)
  } else {
    console.log('   Alerts cleared successfully')
  }

  // Step 2: Delete all flow_data
  console.log('2. Deleting all flow_data...')
  const { error: flowError } = await supabase
    .from('flow_data')
    .delete()
    .gt('id', 0)

  if (flowError) {
    console.log(`   Error: ${flowError.message}`)
  } else {
    console.log('   Flow_data cleared successfully')
  }

  // Step 3: Reset device last_seen
  console.log('3. Resetting device last_seen timestamps...')
  const { error: deviceError } = await supabase
    .from('devices')
    .update({ last_seen: null })
    .like('device_id', 'NIVUS%')

  if (deviceError) {
    console.log(`   Error: ${deviceError.message}`)
  } else {
    console.log('   Device timestamps reset successfully')
  }

  // Verify counts
  console.log('\n=== Verification ===\n')

  const { count: finalAlerts } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
  console.log(`   Alerts count: ${finalAlerts ?? 0}`)

  const { count: finalFlow } = await supabase
    .from('flow_data')
    .select('*', { count: 'exact', head: true })
  console.log(`   Flow_data count: ${finalFlow ?? 0}`)

  console.log('\n=== Database ready for fresh deployment! ===\n')
}

cleanDatabase().catch(console.error)
