// Data Retention Cleanup Cron API Endpoint
// Triggered by Vercel Cron daily at 01:00 UTC
// Deletes flow_data records older than 1 year (365 days)

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logCronExecution } from '@/lib/cron/log-execution'

const CRON_SECRET = process.env.CRON_SECRET
const RETENTION_DAYS = 365

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const startedAt = new Date()

  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('Unauthorized cleanup request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting data retention cleanup...')

    const supabase = createAdminClient()

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
      await logCronExecution('cleanup', startedAt, {
        success: false,
        error: error.message,
        details: { cutoff_date: cutoffDate.toISOString(), retention_days: RETENTION_DAYS },
      })
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const deletedCount = count || 0
    console.log(`Cleanup completed. Deleted ${deletedCount} records.`)

    // Log to audit_logs if records were deleted
    if (deletedCount > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('audit_logs').insert({
        action: 'data_retention_cleanup',
        resource_type: 'flow_data',
        details: {
          deleted_rows: deletedCount,
          retention_days: RETENTION_DAYS,
          cutoff_date: cutoffDate.toISOString(),
        },
      })
    }

    await logCronExecution('cleanup', startedAt, {
      success: true,
      details: {
        deleted_count: deletedCount,
        retention_days: RETENTION_DAYS,
        cutoff_date: cutoffDate.toISOString(),
      },
    })

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
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    await logCronExecution('cleanup', startedAt, {
      success: false,
      error: errMsg,
    })
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}

// Support POST for manual triggering
export async function POST(request: Request) {
  return GET(request)
}
