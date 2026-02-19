// Reports History API
// GET: Fetch list of generated reports with download URLs
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getReportDownloadUrl } from '@/lib/reports/storage'

export const runtime = 'nodejs'

interface ReportRecord {
  id: string
  report_type: string
  report_date: string
  file_path: string
  file_size: number | null
  generated_at: string
  summary: {
    totalFlowVolume?: number
    avgFlowRate?: number
    activeDevices?: number
    totalDevices?: number
    alertsTriggered?: number
  } | null
  created_at: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') // 'daily' | 'monthly' | null (all)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 1, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    const supabase = createAdminClient()

    // Build query
    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .order('report_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (reportType) {
      query = query.eq('report_type', reportType)
    }

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Generate download URLs for each report
    const reportsWithUrls = await Promise.all(
      (reports || []).map(async (report: ReportRecord) => {
        const urlResult = await getReportDownloadUrl(report.file_path, 3600) // 1 hour expiry

        return {
          id: report.id,
          report_type: report.report_type,
          report_date: report.report_date,
          file_path: report.file_path,
          file_size: report.file_size,
          download_url: urlResult.success ? urlResult.url : null,
          generated_at: report.generated_at,
          summary: report.summary,
          created_at: report.created_at,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: reportsWithUrls,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Reports history API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
