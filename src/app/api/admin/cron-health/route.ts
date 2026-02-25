// Admin Cron Health API
// GET cron execution logs and per-job health summaries for superadmin

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can view cron health' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10) || 7, 1), 30)

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Fetch all cron logs in the time window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: logs, error } = await (supabase as any)
      .from('cron_logs')
      .select('*')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Error fetching cron_logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cron logs' },
        { status: 500 }
      )
    }

    const allLogs = (logs || []) as CronLogRow[]

    // Build per-job summaries
    const jobMap = new Map<string, CronLogRow[]>()
    for (const log of allLogs) {
      if (!jobMap.has(log.job_name)) {
        jobMap.set(log.job_name, [])
      }
      jobMap.get(log.job_name)!.push(log)
    }

    const now = new Date()
    const jobSummaries: JobSummary[] = []

    for (const [jobName, jobLogs] of jobMap) {
      const successCount = jobLogs.filter((l) => l.status === 'success').length
      const failureCount = jobLogs.filter((l) => l.status === 'failure').length
      const totalCount = jobLogs.length
      const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 1000) / 10 : 0

      const avgDuration =
        totalCount > 0
          ? Math.round(jobLogs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalCount)
          : 0

      const lastLog = jobLogs[0] // Already sorted desc
      const lastRunAt = lastLog ? lastLog.created_at : null
      const hoursSinceLastRun = lastRunAt
        ? Math.round(((now.getTime() - new Date(lastRunAt).getTime()) / (1000 * 60 * 60)) * 10) / 10
        : null

      let health: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (!lastRunAt || (hoursSinceLastRun !== null && hoursSinceLastRun > 25)) {
        health = 'critical'
      } else if (lastLog && lastLog.status === 'failure') {
        health = 'warning'
      }

      jobSummaries.push({
        job_name: jobName,
        health,
        last_run: lastRunAt,
        last_status: lastLog ? lastLog.status : null,
        hours_since_last_run: hoursSinceLastRun,
        success_count: successCount,
        failure_count: failureCount,
        total_count: totalCount,
        success_rate: successRate,
        avg_duration_ms: avgDuration,
      })
    }

    // Overall stats
    const totalExecutions = allLogs.length
    const totalSuccess = allLogs.filter((l) => l.status === 'success').length
    const overallSuccessRate =
      totalExecutions > 0 ? Math.round((totalSuccess / totalExecutions) * 1000) / 10 : 0
    const overallAvgDuration =
      totalExecutions > 0
        ? Math.round(allLogs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / totalExecutions)
        : 0

    const overallHealth = jobSummaries.some((j) => j.health === 'critical')
      ? 'critical'
      : jobSummaries.some((j) => j.health === 'warning')
        ? 'warning'
        : 'healthy'

    return NextResponse.json({
      summary: {
        overall_health: overallHealth,
        total_executions: totalExecutions,
        success_rate: overallSuccessRate,
        avg_duration_ms: overallAvgDuration,
      },
      jobs: jobSummaries,
      logs: allLogs,
      days,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/cron-health:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface CronLogRow {
  id: number
  job_name: string
  status: 'success' | 'failure'
  started_at: string
  finished_at: string
  duration_ms: number
  details: Record<string, unknown>
  error_message: string | null
  created_at: string
}

interface JobSummary {
  job_name: string
  health: 'healthy' | 'warning' | 'critical'
  last_run: string | null
  last_status: string | null
  hours_since_last_run: number | null
  success_count: number
  failure_count: number
  total_count: number
  success_rate: number
  avg_duration_ms: number
}
