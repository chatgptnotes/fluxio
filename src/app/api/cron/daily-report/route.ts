// Daily Report Cron API Endpoint
// Triggered by Vercel Cron at midnight (00:00 UTC)
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateReportData, getDateRangePreset } from '@/lib/reports/report-data'
import { generatePDFBuffer } from '@/lib/reports/pdf-generator'
import { uploadReportPDF, getReportFilePath } from '@/lib/reports/storage'
import { distributeCompanyReports } from '@/lib/reports/email-distribution'

// Vercel cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max for report generation

export async function GET(request: Request) {
  try {
    // Verify cron authorization (Vercel sends this header)
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log('Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting daily report generation...')

    // Generate report for yesterday
    const dateRange = getDateRangePreset('yesterday')
    const reportData = generateReportData('daily', dateRange)

    // Generate PDF buffer
    const pdfBuffer = generatePDFBuffer(reportData)
    console.log(`PDF generated: ${pdfBuffer.length} bytes`)

    // Get file path for storage
    const filePath = getReportFilePath('daily', dateRange.startDate)
    console.log(`File path: ${filePath}`)

    // Upload to Supabase Storage
    const uploadResult = await uploadReportPDF(Buffer.from(pdfBuffer), filePath)

    if (!uploadResult.success) {
      console.error('Upload failed:', uploadResult.error)
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      )
    }

    // Save metadata to database
    let reportId: string | null = null

    try {
      const supabase = createAdminClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('reports')
        .insert({
          report_type: 'daily',
          report_date: dateRange.startDate.toISOString().split('T')[0],
          file_path: filePath,
          file_size: pdfBuffer.length,
          summary: {
            totalFlowVolume: reportData.summary.totalFlowVolume,
            avgFlowRate: reportData.summary.avgFlowRate,
            activeDevices: reportData.summary.activeDevices,
            totalDevices: reportData.summary.totalDevices,
            alertsTriggered: reportData.summary.alertsTriggered,
          },
        })
        .select('id')
        .single()

      if (error) {
        console.error('Database insert error:', error)
      } else {
        reportId = data.id
        console.log(`Report saved to database: ${reportId}`)
      }
    } catch (dbError) {
      console.error('Supabase not configured, skipping database insert:', dbError)
    }

    console.log('Daily report generation completed successfully')

    // Distribute reports to companies with email reports enabled
    console.log('Starting email distribution to enabled companies...')
    const emailDistribution = await distributeCompanyReports(dateRange)
    console.log(`Email distribution complete: ${emailDistribution.emailsSent} sent, ${emailDistribution.emailsFailed} failed`)

    return NextResponse.json({
      success: true,
      report_id: reportId,
      file_path: filePath,
      file_size: pdfBuffer.length,
      report_date: dateRange.startDate.toISOString().split('T')[0],
      summary: {
        totalFlowVolume: reportData.summary.totalFlowVolume,
        activeDevices: reportData.summary.activeDevices,
        alertsTriggered: reportData.summary.alertsTriggered,
      },
      emailDistribution: {
        totalCompanies: emailDistribution.totalCompanies,
        emailsSent: emailDistribution.emailsSent,
        emailsFailed: emailDistribution.emailsFailed,
        companiesSkipped: emailDistribution.companiesSkipped,
      },
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: Request) {
  return GET(request)
}
