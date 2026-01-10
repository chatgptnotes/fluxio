import { NextRequest, NextResponse } from 'next/server'
import { generateReportData, getDateRangePreset } from '@/lib/reports/report-data'
import { generatePDFReport } from '@/lib/reports/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      report_type = 'daily',
      device_id = 'all',
      start_date,
      end_date,
      preset,
    } = body

    // Determine date range
    let dateRange
    if (preset) {
      dateRange = getDateRangePreset(preset)
    } else if (start_date && end_date) {
      dateRange = {
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        label: 'Custom Range',
      }
    } else {
      // Default to today
      dateRange = getDateRangePreset('today')
    }

    // Validate date range
    if (isNaN(dateRange.startDate.getTime()) || isNaN(dateRange.endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date range provided' },
        { status: 400 }
      )
    }

    if (dateRange.startDate > dateRange.endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Generate report data
    const reportData = generateReportData(
      report_type as 'daily' | 'monthly' | 'custom',
      dateRange,
      device_id
    )

    // Generate PDF
    const pdfDataUrl = generatePDFReport(reportData)

    // Generate report ID
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    return NextResponse.json({
      success: true,
      data: {
        report_id: reportId,
        download_url: pdfDataUrl,
        generated_at: reportData.generatedAt.toISOString(),
        report_type: report_type,
        date_range: {
          start: dateRange.startDate.toISOString(),
          end: dateRange.endDate.toISOString(),
          label: dateRange.label,
        },
        summary: reportData.summary,
      },
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to list available presets
export async function GET() {
  const presets = [
    { id: 'today', label: 'Today', description: 'Current day data' },
    { id: 'yesterday', label: 'Yesterday', description: 'Previous day data' },
    { id: 'thisWeek', label: 'This Week', description: 'Week to date' },
    { id: 'lastWeek', label: 'Last Week', description: 'Previous 7 days' },
    { id: 'thisMonth', label: 'This Month', description: 'Month to date' },
    { id: 'lastMonth', label: 'Last Month', description: 'Previous month' },
  ]

  return NextResponse.json({
    success: true,
    data: {
      presets,
      report_types: [
        { id: 'daily', label: 'Daily Report', description: 'Daily flow summary' },
        { id: 'monthly', label: 'Monthly Report', description: 'Monthly trends and analysis' },
        { id: 'custom', label: 'Custom Report', description: 'Custom date range' },
      ],
    },
  })
}
