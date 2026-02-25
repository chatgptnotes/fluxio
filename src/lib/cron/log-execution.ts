// Reusable cron execution logger
// Logs every cron run to cron_logs table and raises alerts on failure

import { createAdminClient } from '@/lib/supabase/admin'

interface CronResult {
  success: boolean
  details?: Record<string, unknown>
  error?: string
}

/**
 * Log a cron job execution to the cron_logs table.
 * On failure, also inserts a critical alert with device_id = 'SYSTEM'.
 * Wrapped in try/catch so it never crashes the cron response.
 */
export async function logCronExecution(
  jobName: string,
  startedAt: Date,
  result: CronResult
): Promise<void> {
  try {
    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()

    const supabase = createAdminClient()

    // Insert cron log entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('cron_logs').insert({
      job_name: jobName,
      status: result.success ? 'success' : 'failure',
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: durationMs,
      details: result.details || {},
      error_message: result.error || null,
    })

    // On failure, raise a critical system alert
    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('alerts').insert({
        device_id: 'SYSTEM',
        alert_type: 'custom',
        severity: 'critical',
        message: `Cron job "${jobName}" failed: ${result.error || 'Unknown error'}`,
        metadata: {
          job_name: jobName,
          started_at: startedAt.toISOString(),
          duration_ms: durationMs,
          details: result.details || {},
        },
      })
    }
  } catch (logError) {
    // Never let logging crash the cron job
    console.error(`[cron-log] Failed to log execution for "${jobName}":`, logError)
  }
}
