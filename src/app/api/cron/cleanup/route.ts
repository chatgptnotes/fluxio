// Data Retention Cleanup Cron API Endpoint
// Triggered by Vercel Cron daily at 01:00 UTC
// Deletes flow_data records older than 1 year (365 days)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CRON_SECRET = process.env.CRON_SECRET
const RETENTION_DAYS = 365

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('Unauthorized cleanup request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting data retention cleanup...')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('Supabase not configured, skipping cleanup')
      return NextResponse.json({
        success: true,
        message: 'Supabase not configured, cleanup skipped',
        deleted_count: 0,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

    console.log(`Deleting records older than: ${cutoffDate.toISOString()}`)

    // Delete old flow_data records
    const { error, count } = await supabase
      .from('flow_data')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Cleanup error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const deletedCount = count || 0
    console.log(`Cleanup completed. Deleted ${deletedCount} records.`)

    // Log to audit_logs if records were deleted
    if (deletedCount > 0) {
      await supabase.from('audit_logs').insert({
        action: 'data_retention_cleanup',
        resource_type: 'flow_data',
        details: {
          deleted_rows: deletedCount,
          retention_days: RETENTION_DAYS,
          cutoff_date: cutoffDate.toISOString(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      retention_days: RETENTION_DAYS,
      cutoff_date: cutoffDate.toISOString(),
      message: deletedCount > 0
        ? `Successfully deleted ${deletedCount} records older than ${RETENTION_DAYS} days`
        : 'No records to delete',
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Support POST for manual triggering
export async function POST(request: Request) {
  return GET(request)
}
