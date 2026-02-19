// Email Report Logs API
// GET email report logs for superadmin

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'

// GET /api/admin/email-logs - Get email report logs
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only superadmin can view email logs
    if (!user.isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can view email logs' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    // Fetch email report logs (without join - PostgREST schema cache issue)
    const { data: logs, error } = await supabase
      .from('email_report_logs')
      .select('id, company_id, report_date, recipients, status, error_message, file_path, sent_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching email logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email logs' },
        { status: 500 }
      )
    }

    // Fetch companies separately
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')

    const companyMap = new Map<string, string>()
    if (companies) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const c of companies as any[]) {
        companyMap.set(c.id, c.name)
      }
    }

    // Transform to include company name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      company_id: log.company_id,
      company_name: companyMap.get(log.company_id) || 'Unknown',
      report_date: log.report_date,
      recipients: log.recipients || [],
      status: log.status,
      error_message: log.error_message,
      file_path: log.file_path,
      sent_at: log.sent_at,
      created_at: log.created_at,
    }))

    return NextResponse.json({ logs: transformedLogs })
  } catch (error) {
    console.error('Error in GET /api/admin/email-logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
