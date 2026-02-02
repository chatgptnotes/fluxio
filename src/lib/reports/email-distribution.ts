// Email Distribution Service
// Handles sending daily reports to companies with email reports enabled

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { CompanySettings } from '@/types/database'
import { sendDailyReportEmail } from '@/lib/email/resend'
import { generateDailyReportSummaryHtml } from '@/lib/email/templates/daily-report'
import { generateReportData, ReportDateRange, formatDate } from './report-data'
import { generatePDFBuffer } from './pdf-generator'

interface Company {
  id: string
  name: string
  code: string
  settings: CompanySettings
}

interface CompanyUser {
  id: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

interface DistributionResult {
  companyId: string
  companyName: string
  success: boolean
  recipientCount: number
  error?: string
}

export interface EmailDistributionSummary {
  totalCompanies: number
  companiesProcessed: number
  companiesSkipped: number
  emailsSent: number
  emailsFailed: number
  results: DistributionResult[]
}

// Get companies with daily reports enabled
async function getEnabledCompanies(supabase: AnySupabaseClient): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, code, settings')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching companies:', error)
    return []
  }

  // Filter companies with daily reports enabled
  return (data || []).filter((company: Company) => {
    const settings = company.settings || {}
    return settings.dailyReportEnabled === true
  })
}

// Get recipients for a company based on settings
async function getCompanyRecipients(
  supabase: AnySupabaseClient,
  companyId: string,
  recipientType: 'operators' | 'admins' | 'all'
): Promise<CompanyUser[]> {
  let query = supabase
    .from('users')
    .select('id, email, role')
    .eq('company_id', companyId)
    .eq('is_active', true)

  // Filter by role based on recipient type
  if (recipientType === 'operators') {
    query = query.eq('role', 'operator')
  } else if (recipientType === 'admins') {
    query = query.eq('role', 'admin')
  }
  // 'all' includes both operators and admins

  const { data, error } = await query

  if (error) {
    console.error(`Error fetching recipients for company ${companyId}:`, error)
    return []
  }

  // Filter users with valid email addresses
  return (data || []).filter((user: CompanyUser) => {
    return user.email && user.email.includes('@') && user.email.trim().length > 0
  })
}

// Log email report result to database
async function logEmailReport(
  supabase: AnySupabaseClient,
  companyId: string,
  reportDate: string,
  recipients: string[],
  status: 'pending' | 'sent' | 'failed',
  errorMessage?: string,
  filePath?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_report_logs')
      .upsert({
        company_id: companyId,
        report_date: reportDate,
        recipients,
        status,
        error_message: errorMessage || null,
        file_path: filePath || null,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      }, {
        onConflict: 'company_id,report_date',
      })

    if (error) {
      console.error('Error logging email report:', error)
    }
  } catch (err) {
    console.error('Exception logging email report:', err)
  }
}

// Distribute daily reports to all enabled companies
export async function distributeCompanyReports(
  dateRange: ReportDateRange
): Promise<EmailDistributionSummary> {
  const summary: EmailDistributionSummary = {
    totalCompanies: 0,
    companiesProcessed: 0,
    companiesSkipped: 0,
    emailsSent: 0,
    emailsFailed: 0,
    results: [],
  }

  // Check Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase not configured, skipping email distribution')
    return summary
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get companies with daily reports enabled
  const enabledCompanies = await getEnabledCompanies(supabase)
  summary.totalCompanies = enabledCompanies.length

  console.log(`Found ${enabledCompanies.length} companies with daily reports enabled`)

  const reportDateStr = dateRange.startDate.toISOString().split('T')[0]
  const reportDateFormatted = formatDate(dateRange.startDate)

  for (const company of enabledCompanies) {
    const result: DistributionResult = {
      companyId: company.id,
      companyName: company.name,
      success: false,
      recipientCount: 0,
    }

    try {
      // Get recipients based on company settings
      const recipientType = company.settings?.reportRecipients || 'operators'
      const recipients = await getCompanyRecipients(supabase, company.id, recipientType)

      // Skip if no operator-level email addresses exist
      // Per user requirement: email should only be sent if operator-level emails exist
      const operatorRecipients = recipients.filter(r => r.role === 'operator')
      if (operatorRecipients.length === 0) {
        console.log(`Skipping ${company.name}: No operator email addresses found`)
        result.error = 'No operator email addresses available'
        summary.companiesSkipped++
        summary.results.push(result)

        await logEmailReport(
          supabase,
          company.id,
          reportDateStr,
          [],
          'failed',
          'No operator email addresses available'
        )
        continue
      }

      // Use the appropriate recipients based on settings
      const emailRecipients = recipients.map(r => r.email)
      result.recipientCount = emailRecipients.length

      if (emailRecipients.length === 0) {
        console.log(`Skipping ${company.name}: No valid email recipients`)
        result.error = 'No valid email recipients'
        summary.companiesSkipped++
        summary.results.push(result)

        await logEmailReport(
          supabase,
          company.id,
          reportDateStr,
          [],
          'failed',
          'No valid email recipients'
        )
        continue
      }

      console.log(`Processing ${company.name}: ${emailRecipients.length} recipients`)

      // Generate report data for this company (using global data for now)
      // In a future enhancement, this could be company-specific
      const reportData = generateReportData('daily', dateRange)

      // Generate PDF buffer
      const pdfBuffer = generatePDFBuffer(reportData)

      // Generate email summary HTML
      const summaryHtml = generateDailyReportSummaryHtml({
        totalFlowVolume: reportData.summary.totalFlowVolume,
        avgFlowRate: reportData.summary.avgFlowRate,
        activeDevices: reportData.summary.activeDevices,
        totalDevices: reportData.summary.totalDevices,
        alertsTriggered: reportData.summary.alertsTriggered,
      })

      // Send email
      const emailResult = await sendDailyReportEmail(
        emailRecipients,
        company.name,
        reportDateFormatted,
        summaryHtml,
        pdfBuffer
      )

      if (emailResult.success) {
        result.success = true
        summary.emailsSent++
        summary.companiesProcessed++

        await logEmailReport(
          supabase,
          company.id,
          reportDateStr,
          emailRecipients,
          'sent'
        )

        console.log(`Successfully sent report to ${company.name}`)
      } else {
        result.error = emailResult.error
        summary.emailsFailed++
        summary.companiesSkipped++

        await logEmailReport(
          supabase,
          company.id,
          reportDateStr,
          emailRecipients,
          'failed',
          emailResult.error
        )

        console.error(`Failed to send report to ${company.name}:`, emailResult.error)
      }
    } catch (err) {
      result.error = err instanceof Error ? err.message : 'Unknown error'
      summary.emailsFailed++
      summary.companiesSkipped++

      await logEmailReport(
        supabase,
        company.id,
        reportDateStr,
        [],
        'failed',
        result.error
      )

      console.error(`Error processing ${company.name}:`, err)
    }

    summary.results.push(result)
  }

  console.log(`Email distribution complete: ${summary.emailsSent} sent, ${summary.emailsFailed} failed, ${summary.companiesSkipped} skipped`)

  return summary
}
