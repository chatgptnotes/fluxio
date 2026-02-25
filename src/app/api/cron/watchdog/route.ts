// Cron Watchdog Health-Check Endpoint
// Runs every 6 hours via Vercel cron to verify all cron jobs are executing on schedule

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logCronExecution } from '@/lib/cron/log-execution'

const CRON_SECRET = process.env.CRON_SECRET

// Expected cron jobs and their max allowed gap (in hours)
const MONITORED_JOBS = [
  { name: 'daily-report', maxGapHours: 25 },
  { name: 'cleanup', maxGapHours: 25 },
]

export const runtime = 'nodejs'
export const maxDuration = 30

type HealthStatus = 'healthy' | 'warning' | 'critical'

interface JobHealth {
  job_name: string
  status: HealthStatus
  last_run: string | null
  last_status: string | null
  hours_since_last_run: number | null
  message: string
}

export async function GET(request: Request) {
  const startedAt = new Date()

  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date()
    const jobHealthResults: JobHealth[] = []
    let overallStatus: HealthStatus = 'healthy'

    for (const job of MONITORED_JOBS) {
      // Get the most recent execution for this job
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('cron_logs')
        .select('*')
        .eq('job_name', job.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // No executions found at all
        const health: JobHealth = {
          job_name: job.name,
          status: 'critical',
          last_run: null,
          last_status: null,
          hours_since_last_run: null,
          message: `No execution records found for "${job.name}". Job may have never run.`,
        }
        jobHealthResults.push(health)
        overallStatus = 'critical'

        // Raise alert (with dedup check)
        await raiseSystemAlert(supabase, job.name, health.message)
        continue
      }

      const lastRun = new Date(data.created_at)
      const hoursSince = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60)
      const roundedHours = Math.round(hoursSince * 10) / 10

      let status: HealthStatus = 'healthy'
      let message = `Last run ${roundedHours}h ago, status: ${data.status}`

      if (hoursSince > job.maxGapHours) {
        // Missed schedule
        status = 'critical'
        message = `Missed schedule: last run was ${roundedHours}h ago (max ${job.maxGapHours}h)`
        if (overallStatus !== 'critical') overallStatus = 'critical'

        await raiseSystemAlert(supabase, job.name, message)
      } else if (data.status === 'failure') {
        // Last run failed
        status = 'warning'
        message = `Last run failed: ${data.error_message || 'Unknown error'}`
        if (overallStatus === 'healthy') overallStatus = 'warning'
      }

      jobHealthResults.push({
        job_name: job.name,
        status,
        last_run: data.created_at,
        last_status: data.status,
        hours_since_last_run: roundedHours,
        message,
      })
    }

    await logCronExecution('watchdog', startedAt, {
      success: true,
      details: {
        overall_status: overallStatus,
        jobs: jobHealthResults,
      },
    })

    return NextResponse.json({
      success: true,
      overall_status: overallStatus,
      checked_at: now.toISOString(),
      jobs: jobHealthResults,
    })
  } catch (error) {
    console.error('Watchdog error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    await logCronExecution('watchdog', startedAt, {
      success: false,
      error: errMsg,
    })
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: Request) {
  return GET(request)
}

/**
 * Raise a system alert for a cron job issue.
 * Deduplicates: skips if an unresolved alert for the same job exists within the last 24 hours.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function raiseSystemAlert(supabase: any, jobName: string, message: string) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Check for existing unresolved alert in the last 24h
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('device_id', 'SYSTEM')
      .eq('alert_type', 'custom')
      .eq('is_resolved', false)
      .gte('created_at', twentyFourHoursAgo)
      .ilike('message', `%"${jobName}"%`)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[watchdog] Dedup: skipping alert for "${jobName}" (existing unresolved alert)`)
      return
    }

    await supabase.from('alerts').insert({
      device_id: 'SYSTEM',
      alert_type: 'custom',
      severity: 'critical',
      message: `Watchdog: ${message}`,
      metadata: { job_name: jobName, source: 'watchdog' },
    })

    console.log(`[watchdog] Alert raised for "${jobName}"`)
  } catch (err) {
    console.error(`[watchdog] Failed to raise alert for "${jobName}":`, err)
  }
}
