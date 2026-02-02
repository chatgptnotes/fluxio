// Daily Report Email Template
// HTML template for email summary section

export interface ReportSummaryData {
  totalFlowVolume: number
  avgFlowRate: number
  activeDevices: number
  totalDevices: number
  alertsTriggered: number
}

// Generate HTML summary section for daily report email
export function generateDailyReportSummaryHtml(summary: ReportSummaryData): string {
  const alertColor = summary.alertsTriggered > 0 ? '#f59e0b' : '#22c55e'

  return `
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 16px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
        Report Summary
      </h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #64748b; font-size: 14px;">Total Flow Volume</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
            <strong style="color: #0ea5e9; font-size: 16px;">${summary.totalFlowVolume.toLocaleString()} m3</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #64748b; font-size: 14px;">Average Flow Rate</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
            <strong style="color: #0ea5e9; font-size: 16px;">${summary.avgFlowRate.toFixed(1)} m3/h</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #64748b; font-size: 14px;">Active Devices</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
            <strong style="color: #22c55e; font-size: 16px;">${summary.activeDevices} / ${summary.totalDevices}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #64748b; font-size: 14px;">Alerts Triggered</span>
          </td>
          <td style="padding: 8px 0; text-align: right;">
            <strong style="color: ${alertColor}; font-size: 16px;">${summary.alertsTriggered}</strong>
          </td>
        </tr>
      </table>
    </div>

    <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #0ea5e9;">
      <p style="margin: 0; font-size: 14px; color: #0369a1;">
        <strong>Note:</strong> The detailed PDF report is attached to this email. Open it for complete flow data, charts, and device health information.
      </p>
    </div>
  `
}

// Generate plain text summary for email
export function generateDailyReportSummaryText(summary: ReportSummaryData): string {
  return `
REPORT SUMMARY
--------------
Total Flow Volume: ${summary.totalFlowVolume.toLocaleString()} m3
Average Flow Rate: ${summary.avgFlowRate.toFixed(1)} m3/h
Active Devices: ${summary.activeDevices} / ${summary.totalDevices}
Alerts Triggered: ${summary.alertsTriggered}

The detailed PDF report is attached to this email.
  `.trim()
}
