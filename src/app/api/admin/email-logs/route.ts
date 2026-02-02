// Email Report Logs API
// GET email report logs for superadmin

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth/session'

// Create admin client with service role key
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

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

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Fetch email report logs with company names
    const { data: logs, error } = await supabase
      .from('email_report_logs')
      .select(`
        id,
        company_id,
        report_date,
        recipients,
        status,
        error_message,
        file_path,
        sent_at,
        created_at,
        companies (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching email logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email logs' },
        { status: 500 }
      )
    }

    // Transform to include company name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      company_id: log.company_id,
      company_name: log.companies?.name || 'Unknown',
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
