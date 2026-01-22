// PDF Report Generator using jsPDF
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ReportData, formatDate, formatDateTime } from './report-data'
import { LOGO_BASE64, LogoKey } from './logo-data'

// Extend jsPDF type for autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number }
}

// SCADA-style colors
const COLORS = {
  primary: [14, 165, 233] as [number, number, number], // sky-500
  secondary: [30, 41, 59] as [number, number, number], // slate-800
  success: [34, 197, 94] as [number, number, number], // green-500
  warning: [234, 179, 8] as [number, number, number], // yellow-500
  danger: [239, 68, 68] as [number, number, number], // red-500
  text: [15, 23, 42] as [number, number, number], // slate-900
  textMuted: [100, 116, 139] as [number, number, number], // slate-500
  background: [248, 250, 252] as [number, number, number], // slate-50
  tableBorder: [226, 232, 240] as [number, number, number], // slate-200
  tableHeader: [241, 245, 249] as [number, number, number], // slate-100
  mahagenco: [0, 102, 153] as [number, number, number], // MAHAGENCO blue
  sterling: [255, 153, 0] as [number, number, number], // Sterling orange
}

// Helper function to draw company logo with actual image
function drawCompanyLogo(
  doc: jsPDF,
  logoKey: LogoKey,
  x: number,
  y: number,
  width: number = 25,
  height: number = 12
): void {
  try {
    const logoBase64 = LOGO_BASE64[logoKey]
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', x, y, width, height)
    }
  } catch (error) {
    // Fallback to text badge if image fails
    const colors: Record<LogoKey, [number, number, number]> = {
      mahagenco: [0, 102, 153],
      sterling: [255, 153, 0]
    }
    doc.setFillColor(...colors[logoKey])
    doc.roundedRect(x, y, width, height, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text(logoKey.toUpperCase(), x + width / 2, y + height / 2 + 2, { align: 'center' })
  }
}

export function generatePDFReport(reportData: ReportData): string {
  const doc = new jsPDF() as jsPDFWithAutoTable
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = margin

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number): void => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      yPos = margin
    }
  }

  // ===================
  // HEADER SECTION
  // ===================

  // White strip at top for logos
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, 18, 'F')

  // Header background (below logo strip)
  doc.setFillColor(...COLORS.secondary)
  doc.rect(0, 18, pageWidth, 32, 'F')

  // Company Logos Row (on white background) - MAHAGENCO left, Sterling right
  drawCompanyLogo(doc, 'mahagenco', margin, 3, 28, 13)
  drawCompanyLogo(doc, 'sterling', pageWidth - margin - 40, 3, 40, 13)

  // Logo/Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('FluxIO SCADA', margin, 33)

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Flow Monitoring System Report', margin, 41)

  // Report type badge
  const reportTypeLabel = reportData.reportType.charAt(0).toUpperCase() + reportData.reportType.slice(1) + ' Report'
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(pageWidth - margin - 50, 23, 50, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(reportTypeLabel, pageWidth - margin - 25, 29.5, { align: 'center' })

  // Date range info
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(
    `Period: ${formatDate(reportData.dateRange.startDate)} - ${formatDate(reportData.dateRange.endDate)}`,
    pageWidth - margin,
    38,
    { align: 'right' }
  )
  doc.text(
    `Generated: ${formatDateTime(reportData.generatedAt)}`,
    pageWidth - margin,
    45,
    { align: 'right' }
  )

  yPos = 58

  // ===================
  // EXECUTIVE SUMMARY
  // ===================

  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', margin, yPos)
  yPos += 8

  // Summary cards row
  const cardWidth = (pageWidth - margin * 2 - 15) / 4
  const cards = [
    { label: 'Total Flow Volume', value: `${reportData.summary.totalFlowVolume.toLocaleString()} m³`, color: COLORS.primary },
    { label: 'Avg Flow Rate', value: `${reportData.summary.avgFlowRate.toFixed(1)} m³/h`, color: COLORS.primary },
    { label: 'Active Devices', value: `${reportData.summary.activeDevices}/${reportData.summary.totalDevices}`, color: COLORS.success },
    { label: 'Alerts Triggered', value: `${reportData.summary.alertsTriggered}`, color: reportData.summary.alertsTriggered > 0 ? COLORS.warning : COLORS.success },
  ]

  cards.forEach((card, index) => {
    const x = margin + (cardWidth + 5) * index

    // Card background
    doc.setFillColor(...COLORS.background)
    doc.setDrawColor(...COLORS.tableBorder)
    doc.roundedRect(x, yPos, cardWidth, 22, 2, 2, 'FD')

    // Accent line
    doc.setFillColor(...card.color)
    doc.rect(x, yPos, 3, 22, 'F')

    // Label
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 6, yPos + 7)

    // Value
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 6, yPos + 16)
  })

  yPos += 32

  // ===================
  // FLOW DATA TABLE
  // ===================

  checkPageBreak(60)

  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Flow Data Summary', margin, yPos)
  yPos += 8

  const tableData = reportData.pipeStatistics.map((pipe) => [
    pipe.pipeId.replace('pipe-', 'Pipe '),
    pipe.deviceName,
    pipe.location,
    `${pipe.minFlowRate}`,
    `${pipe.maxFlowRate}`,
    `${pipe.avgFlowRate}`,
    `${pipe.totalVolume.toLocaleString()}`,
    `${pipe.operatingHours}h`,
    pipe.status.toUpperCase(),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device', 'Location', 'Min Flow', 'Max Flow', 'Avg Flow', 'Total Vol', 'Op. Hours', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: COLORS.text,
      lineColor: COLORS.tableBorder,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: COLORS.background,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 15, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 17, halign: 'center' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 8) {
        const status = data.cell.raw as string
        if (status === 'ONLINE') {
          data.cell.styles.textColor = COLORS.success
        } else if (status === 'WARNING') {
          data.cell.styles.textColor = COLORS.warning
        } else if (status === 'OFFLINE') {
          data.cell.styles.textColor = COLORS.danger
        }
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  yPos = doc.lastAutoTable?.finalY || yPos + 50
  yPos += 10

  // ===================
  // HOURLY FLOW CHART (Simple bar representation)
  // ===================

  checkPageBreak(60)

  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Hourly Flow Distribution', margin, yPos)
  yPos += 8

  // Chart area
  const chartWidth = pageWidth - margin * 2
  const chartHeight = 35
  const barWidth = chartWidth / 24 - 1
  const maxFlow = Math.max(...reportData.hourlyData.map((d) => d.totalFlow), 1)

  // Chart background
  doc.setFillColor(...COLORS.background)
  doc.setDrawColor(...COLORS.tableBorder)
  doc.roundedRect(margin, yPos, chartWidth, chartHeight + 15, 2, 2, 'FD')

  // Draw bars
  reportData.hourlyData.forEach((data, index) => {
    const barHeight = (data.totalFlow / maxFlow) * chartHeight
    const x = margin + 5 + index * (barWidth + 1)
    const y = yPos + chartHeight - barHeight + 2

    // Bar gradient effect
    doc.setFillColor(...COLORS.primary)
    doc.rect(x, y, barWidth, barHeight, 'F')

    // Hour label (every 3 hours)
    if (index % 3 === 0) {
      doc.setTextColor(...COLORS.textMuted)
      doc.setFontSize(6)
      doc.text(`${data.hour}:00`, x + barWidth / 2, yPos + chartHeight + 10, { align: 'center' })
    }
  })

  // Y-axis labels
  doc.setTextColor(...COLORS.textMuted)
  doc.setFontSize(6)
  doc.text(`${maxFlow.toFixed(0)} m³`, margin + 2, yPos + 6)
  doc.text('0', margin + 2, yPos + chartHeight)

  yPos += chartHeight + 20

  // ===================
  // ALERTS SECTION
  // ===================

  checkPageBreak(50)

  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Alerts Summary', margin, yPos)
  yPos += 8

  if (reportData.alerts.length === 0) {
    doc.setTextColor(...COLORS.success)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('No alerts triggered during this period.', margin, yPos)
    yPos += 10
  } else {
    const alertData = reportData.alerts.slice(0, 10).map((alert) => [
      alert.type.toUpperCase(),
      alert.description,
      formatDateTime(alert.timestamp),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Severity', 'Description', 'Timestamp']],
      body: alertData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: COLORS.text,
        lineColor: COLORS.tableBorder,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 },
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 0) {
          const severity = data.cell.raw as string
          if (severity === 'CRITICAL') {
            data.cell.styles.textColor = COLORS.danger
          } else if (severity === 'WARNING') {
            data.cell.styles.textColor = COLORS.warning
          } else {
            data.cell.styles.textColor = COLORS.primary
          }
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

    yPos = doc.lastAutoTable?.finalY || yPos + 30
  }

  yPos += 10

  // ===================
  // DEVICE HEALTH SECTION
  // ===================

  checkPageBreak(50)

  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Device Health', margin, yPos)
  yPos += 8

  const healthData = reportData.deviceHealth.map((device) => [
    device.pipeId.replace('pipe-', 'Pipe '),
    device.deviceName,
    `${device.batteryLevel}%`,
    `${device.signalStrength} dBm`,
    device.status.toUpperCase(),
    formatDateTime(device.lastCommunication),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device Name', 'Battery', 'Signal', 'Status', 'Last Communication']],
    body: healthData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: COLORS.text,
      lineColor: COLORS.tableBorder,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.background,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 45 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 'auto' },
    },
    didParseCell: function (data) {
      if (data.section === 'body') {
        // Battery column
        if (data.column.index === 2) {
          const battery = parseInt(data.cell.raw as string)
          if (battery < 30) {
            data.cell.styles.textColor = COLORS.danger
          } else if (battery < 60) {
            data.cell.styles.textColor = COLORS.warning
          } else {
            data.cell.styles.textColor = COLORS.success
          }
          data.cell.styles.fontStyle = 'bold'
        }
        // Signal column
        if (data.column.index === 3) {
          const signal = parseInt(data.cell.raw as string)
          if (signal < -80) {
            data.cell.styles.textColor = COLORS.danger
          } else if (signal < -65) {
            data.cell.styles.textColor = COLORS.warning
          } else {
            data.cell.styles.textColor = COLORS.success
          }
        }
        // Status column
        if (data.column.index === 4) {
          const status = data.cell.raw as string
          if (status === 'ONLINE') {
            data.cell.styles.textColor = COLORS.success
          } else if (status === 'WARNING') {
            data.cell.styles.textColor = COLORS.warning
          } else if (status === 'OFFLINE') {
            data.cell.styles.textColor = COLORS.danger
          }
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // ===================
  // FOOTER
  // ===================

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer line
    doc.setDrawColor(...COLORS.tableBorder)
    doc.line(margin, doc.internal.pageSize.getHeight() - 18, pageWidth - margin, doc.internal.pageSize.getHeight() - 18)

    // Footer text - Company names
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(6)
    doc.text(
      'MAHAGENCO | Sterling Electricals & Technologies',
      margin,
      doc.internal.pageSize.getHeight() - 13
    )

    // Footer text - Version and timestamp
    doc.setFontSize(7)
    doc.text(
      `Generated by FluxIO SCADA | Version 3.0 | ${formatDateTime(new Date())}`,
      margin,
      doc.internal.pageSize.getHeight() - 8
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    )
  }

  // Return as base64 data URL
  return doc.output('dataurlstring')
}

// Generate PDF as ArrayBuffer for server-side storage
export function generatePDFBuffer(reportData: ReportData): Uint8Array {
  const doc = new jsPDF() as jsPDFWithAutoTable
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = margin

  const checkPageBreak = (requiredSpace: number): void => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      yPos = margin
    }
  }

  // White strip at top for logos
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, 18, 'F')

  // Header background (below logo strip)
  doc.setFillColor(...COLORS.secondary)
  doc.rect(0, 18, pageWidth, 32, 'F')

  // Company Logos (on white background) - MAHAGENCO left, Sterling right
  drawCompanyLogo(doc, 'mahagenco', margin, 3, 28, 13)
  drawCompanyLogo(doc, 'sterling', pageWidth - margin - 40, 3, 40, 13)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('FluxIO SCADA', margin, 33)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Flow Monitoring System Report', margin, 41)

  const reportTypeLabel = reportData.reportType.charAt(0).toUpperCase() + reportData.reportType.slice(1) + ' Report'
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(pageWidth - margin - 50, 23, 50, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(reportTypeLabel, pageWidth - margin - 25, 29.5, { align: 'center' })

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(
    `Period: ${formatDate(reportData.dateRange.startDate)} - ${formatDate(reportData.dateRange.endDate)}`,
    pageWidth - margin, 38, { align: 'right' }
  )
  doc.text(`Generated: ${formatDateTime(reportData.generatedAt)}`, pageWidth - margin, 45, { align: 'right' })

  yPos = 58

  // Summary
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', margin, yPos)
  yPos += 8

  const cardWidth = (pageWidth - margin * 2 - 15) / 4
  const cards = [
    { label: 'Total Flow Volume', value: `${reportData.summary.totalFlowVolume.toLocaleString()} m³`, color: COLORS.primary },
    { label: 'Avg Flow Rate', value: `${reportData.summary.avgFlowRate.toFixed(1)} m³/h`, color: COLORS.primary },
    { label: 'Active Devices', value: `${reportData.summary.activeDevices}/${reportData.summary.totalDevices}`, color: COLORS.success },
    { label: 'Alerts Triggered', value: `${reportData.summary.alertsTriggered}`, color: reportData.summary.alertsTriggered > 0 ? COLORS.warning : COLORS.success },
  ]

  cards.forEach((card, index) => {
    const x = margin + (cardWidth + 5) * index
    doc.setFillColor(...COLORS.background)
    doc.setDrawColor(...COLORS.tableBorder)
    doc.roundedRect(x, yPos, cardWidth, 22, 2, 2, 'FD')
    doc.setFillColor(...card.color)
    doc.rect(x, yPos, 3, 22, 'F')
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 6, yPos + 7)
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 6, yPos + 16)
  })

  yPos += 32

  // Flow Data Table
  checkPageBreak(60)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Flow Data Summary', margin, yPos)
  yPos += 8

  const tableData = reportData.pipeStatistics.map((pipe) => [
    pipe.pipeId.replace('pipe-', 'Pipe '),
    pipe.deviceName,
    pipe.location,
    `${pipe.minFlowRate}`,
    `${pipe.maxFlowRate}`,
    `${pipe.avgFlowRate}`,
    `${pipe.totalVolume.toLocaleString()}`,
    `${pipe.operatingHours}h`,
    pipe.status.toUpperCase(),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device', 'Location', 'Min Flow', 'Max Flow', 'Avg Flow', 'Total Vol', 'Op. Hours', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.tableBorder, lineWidth: 0.1 },
    headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: COLORS.background },
    columnStyles: {
      0: { cellWidth: 15 }, 1: { cellWidth: 35 }, 2: { cellWidth: 30 },
      3: { cellWidth: 15, halign: 'right' }, 4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 15, halign: 'right' }, 6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' }, 8: { cellWidth: 17, halign: 'center' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 8) {
        const status = data.cell.raw as string
        if (status === 'ONLINE') data.cell.styles.textColor = COLORS.success
        else if (status === 'WARNING') data.cell.styles.textColor = COLORS.warning
        else if (status === 'OFFLINE') data.cell.styles.textColor = COLORS.danger
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  yPos = doc.lastAutoTable?.finalY || yPos + 50
  yPos += 10

  // Hourly Chart
  checkPageBreak(60)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Hourly Flow Distribution', margin, yPos)
  yPos += 8

  const chartWidth = pageWidth - margin * 2
  const chartHeight = 35
  const barWidth = chartWidth / 24 - 1
  const maxFlow = Math.max(...reportData.hourlyData.map((d) => d.totalFlow), 1)

  doc.setFillColor(...COLORS.background)
  doc.setDrawColor(...COLORS.tableBorder)
  doc.roundedRect(margin, yPos, chartWidth, chartHeight + 15, 2, 2, 'FD')

  reportData.hourlyData.forEach((data, index) => {
    const barHeight = (data.totalFlow / maxFlow) * chartHeight
    const x = margin + 5 + index * (barWidth + 1)
    const y = yPos + chartHeight - barHeight + 2
    doc.setFillColor(...COLORS.primary)
    doc.rect(x, y, barWidth, barHeight, 'F')
    if (index % 3 === 0) {
      doc.setTextColor(...COLORS.textMuted)
      doc.setFontSize(6)
      doc.text(`${data.hour}:00`, x + barWidth / 2, yPos + chartHeight + 10, { align: 'center' })
    }
  })

  doc.setTextColor(...COLORS.textMuted)
  doc.setFontSize(6)
  doc.text(`${maxFlow.toFixed(0)} m³`, margin + 2, yPos + 6)
  doc.text('0', margin + 2, yPos + chartHeight)

  yPos += chartHeight + 20

  // Alerts
  checkPageBreak(50)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Alerts Summary', margin, yPos)
  yPos += 8

  if (reportData.alerts.length === 0) {
    doc.setTextColor(...COLORS.success)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('No alerts triggered during this period.', margin, yPos)
    yPos += 10
  } else {
    const alertData = reportData.alerts.slice(0, 10).map((alert) => [
      alert.type.toUpperCase(), alert.description, formatDateTime(alert.timestamp),
    ])
    autoTable(doc, {
      startY: yPos,
      head: [['Severity', 'Description', 'Timestamp']],
      body: alertData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.text, lineColor: COLORS.tableBorder, lineWidth: 0.1 },
      headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.background },
      columnStyles: { 0: { cellWidth: 25, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 40 } },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 0) {
          const severity = data.cell.raw as string
          if (severity === 'CRITICAL') data.cell.styles.textColor = COLORS.danger
          else if (severity === 'WARNING') data.cell.styles.textColor = COLORS.warning
          else data.cell.styles.textColor = COLORS.primary
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    yPos = doc.lastAutoTable?.finalY || yPos + 30
  }

  yPos += 10

  // Device Health
  checkPageBreak(50)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Device Health', margin, yPos)
  yPos += 8

  const healthData = reportData.deviceHealth.map((device) => [
    device.pipeId.replace('pipe-', 'Pipe '),
    device.deviceName,
    `${device.batteryLevel}%`,
    `${device.signalStrength} dBm`,
    device.status.toUpperCase(),
    formatDateTime(device.lastCommunication),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device Name', 'Battery', 'Signal', 'Status', 'Last Communication']],
    body: healthData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.text, lineColor: COLORS.tableBorder, lineWidth: 0.1 },
    headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.background },
    columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 45 }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 22, halign: 'center' }, 4: { cellWidth: 20, halign: 'center' }, 5: { cellWidth: 'auto' } },
    didParseCell: function (data) {
      if (data.section === 'body') {
        if (data.column.index === 2) {
          const battery = parseInt(data.cell.raw as string)
          if (battery < 30) data.cell.styles.textColor = COLORS.danger
          else if (battery < 60) data.cell.styles.textColor = COLORS.warning
          else data.cell.styles.textColor = COLORS.success
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.column.index === 3) {
          const signal = parseInt(data.cell.raw as string)
          if (signal < -80) data.cell.styles.textColor = COLORS.danger
          else if (signal < -65) data.cell.styles.textColor = COLORS.warning
          else data.cell.styles.textColor = COLORS.success
        }
        if (data.column.index === 4) {
          const status = data.cell.raw as string
          if (status === 'ONLINE') data.cell.styles.textColor = COLORS.success
          else if (status === 'WARNING') data.cell.styles.textColor = COLORS.warning
          else if (status === 'OFFLINE') data.cell.styles.textColor = COLORS.danger
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(...COLORS.tableBorder)
    doc.line(margin, doc.internal.pageSize.getHeight() - 18, pageWidth - margin, doc.internal.pageSize.getHeight() - 18)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(6)
    doc.text('MAHAGENCO | Sterling Electricals & Technologies', margin, doc.internal.pageSize.getHeight() - 13)
    doc.setFontSize(7)
    doc.text(`Generated by FluxIO SCADA | Version 3.0 | ${formatDateTime(new Date())}`, margin, doc.internal.pageSize.getHeight() - 8)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }

  // Return as ArrayBuffer for server-side storage
  const arrayBuffer = doc.output('arraybuffer')
  return new Uint8Array(arrayBuffer)
}

// Generate and download PDF
export function downloadPDFReport(reportData: ReportData): void {
  const doc = new jsPDF() as jsPDFWithAutoTable
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = margin

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number): void => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      yPos = margin
    }
  }

  // Build the PDF (same content as generatePDFReport)
  // White strip at top for logos
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, 18, 'F')

  // Header background (below logo strip)
  doc.setFillColor(...COLORS.secondary)
  doc.rect(0, 18, pageWidth, 32, 'F')

  // Company Logos (on white background) - MAHAGENCO left, Sterling right
  drawCompanyLogo(doc, 'mahagenco', margin, 3, 28, 13)
  drawCompanyLogo(doc, 'sterling', pageWidth - margin - 40, 3, 40, 13)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('FluxIO SCADA', margin, 33)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Flow Monitoring System Report', margin, 41)

  const reportTypeLabel = reportData.reportType.charAt(0).toUpperCase() + reportData.reportType.slice(1) + ' Report'
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(pageWidth - margin - 50, 23, 50, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text(reportTypeLabel, pageWidth - margin - 25, 29.5, { align: 'center' })

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(
    `Period: ${formatDate(reportData.dateRange.startDate)} - ${formatDate(reportData.dateRange.endDate)}`,
    pageWidth - margin,
    38,
    { align: 'right' }
  )
  doc.text(
    `Generated: ${formatDateTime(reportData.generatedAt)}`,
    pageWidth - margin,
    45,
    { align: 'right' }
  )

  yPos = 58

  // Summary
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Executive Summary', margin, yPos)
  yPos += 8

  const cardWidth = (pageWidth - margin * 2 - 15) / 4
  const cards = [
    { label: 'Total Flow Volume', value: `${reportData.summary.totalFlowVolume.toLocaleString()} m³`, color: COLORS.primary },
    { label: 'Avg Flow Rate', value: `${reportData.summary.avgFlowRate.toFixed(1)} m³/h`, color: COLORS.primary },
    { label: 'Active Devices', value: `${reportData.summary.activeDevices}/${reportData.summary.totalDevices}`, color: COLORS.success },
    { label: 'Alerts Triggered', value: `${reportData.summary.alertsTriggered}`, color: reportData.summary.alertsTriggered > 0 ? COLORS.warning : COLORS.success },
  ]

  cards.forEach((card, index) => {
    const x = margin + (cardWidth + 5) * index
    doc.setFillColor(...COLORS.background)
    doc.setDrawColor(...COLORS.tableBorder)
    doc.roundedRect(x, yPos, cardWidth, 22, 2, 2, 'FD')
    doc.setFillColor(...card.color)
    doc.rect(x, yPos, 3, 22, 'F')
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 6, yPos + 7)
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 6, yPos + 16)
  })

  yPos += 32

  // Flow Data Table
  checkPageBreak(60)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Flow Data Summary', margin, yPos)
  yPos += 8

  const tableData = reportData.pipeStatistics.map((pipe) => [
    pipe.pipeId.replace('pipe-', 'Pipe '),
    pipe.deviceName,
    pipe.location,
    `${pipe.minFlowRate}`,
    `${pipe.maxFlowRate}`,
    `${pipe.avgFlowRate}`,
    `${pipe.totalVolume.toLocaleString()}`,
    `${pipe.operatingHours}h`,
    pipe.status.toUpperCase(),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device', 'Location', 'Min Flow', 'Max Flow', 'Avg Flow', 'Total Vol', 'Op. Hours', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.tableBorder, lineWidth: 0.1 },
    headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: COLORS.background },
    columnStyles: {
      0: { cellWidth: 15 }, 1: { cellWidth: 35 }, 2: { cellWidth: 30 },
      3: { cellWidth: 15, halign: 'right' }, 4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 15, halign: 'right' }, 6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' }, 8: { cellWidth: 17, halign: 'center' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 8) {
        const status = data.cell.raw as string
        if (status === 'ONLINE') data.cell.styles.textColor = COLORS.success
        else if (status === 'WARNING') data.cell.styles.textColor = COLORS.warning
        else if (status === 'OFFLINE') data.cell.styles.textColor = COLORS.danger
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  yPos = doc.lastAutoTable?.finalY || yPos + 50
  yPos += 10

  // Hourly Chart
  checkPageBreak(60)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Hourly Flow Distribution', margin, yPos)
  yPos += 8

  const chartWidth = pageWidth - margin * 2
  const chartHeight = 35
  const barWidth = chartWidth / 24 - 1
  const maxFlow = Math.max(...reportData.hourlyData.map((d) => d.totalFlow), 1)

  doc.setFillColor(...COLORS.background)
  doc.setDrawColor(...COLORS.tableBorder)
  doc.roundedRect(margin, yPos, chartWidth, chartHeight + 15, 2, 2, 'FD')

  reportData.hourlyData.forEach((data, index) => {
    const barHeight = (data.totalFlow / maxFlow) * chartHeight
    const x = margin + 5 + index * (barWidth + 1)
    const y = yPos + chartHeight - barHeight + 2
    doc.setFillColor(...COLORS.primary)
    doc.rect(x, y, barWidth, barHeight, 'F')
    if (index % 3 === 0) {
      doc.setTextColor(...COLORS.textMuted)
      doc.setFontSize(6)
      doc.text(`${data.hour}:00`, x + barWidth / 2, yPos + chartHeight + 10, { align: 'center' })
    }
  })

  doc.setTextColor(...COLORS.textMuted)
  doc.setFontSize(6)
  doc.text(`${maxFlow.toFixed(0)} m³`, margin + 2, yPos + 6)
  doc.text('0', margin + 2, yPos + chartHeight)

  yPos += chartHeight + 20

  // Alerts
  checkPageBreak(50)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Alerts Summary', margin, yPos)
  yPos += 8

  if (reportData.alerts.length === 0) {
    doc.setTextColor(...COLORS.success)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('No alerts triggered during this period.', margin, yPos)
    yPos += 10
  } else {
    const alertData = reportData.alerts.slice(0, 10).map((alert) => [
      alert.type.toUpperCase(), alert.description, formatDateTime(alert.timestamp),
    ])
    autoTable(doc, {
      startY: yPos,
      head: [['Severity', 'Description', 'Timestamp']],
      body: alertData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.text, lineColor: COLORS.tableBorder, lineWidth: 0.1 },
      headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.background },
      columnStyles: { 0: { cellWidth: 25, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 40 } },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 0) {
          const severity = data.cell.raw as string
          if (severity === 'CRITICAL') data.cell.styles.textColor = COLORS.danger
          else if (severity === 'WARNING') data.cell.styles.textColor = COLORS.warning
          else data.cell.styles.textColor = COLORS.primary
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    yPos = doc.lastAutoTable?.finalY || yPos + 30
  }

  yPos += 10

  // Device Health
  checkPageBreak(50)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Device Health', margin, yPos)
  yPos += 8

  const healthData = reportData.deviceHealth.map((device) => [
    device.pipeId.replace('pipe-', 'Pipe '),
    device.deviceName,
    `${device.batteryLevel}%`,
    `${device.signalStrength} dBm`,
    device.status.toUpperCase(),
    formatDateTime(device.lastCommunication),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device Name', 'Battery', 'Signal', 'Status', 'Last Communication']],
    body: healthData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.text, lineColor: COLORS.tableBorder, lineWidth: 0.1 },
    headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.background },
    columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 45 }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 22, halign: 'center' }, 4: { cellWidth: 20, halign: 'center' }, 5: { cellWidth: 'auto' } },
    didParseCell: function (data) {
      if (data.section === 'body') {
        if (data.column.index === 2) {
          const battery = parseInt(data.cell.raw as string)
          if (battery < 30) data.cell.styles.textColor = COLORS.danger
          else if (battery < 60) data.cell.styles.textColor = COLORS.warning
          else data.cell.styles.textColor = COLORS.success
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.column.index === 3) {
          const signal = parseInt(data.cell.raw as string)
          if (signal < -80) data.cell.styles.textColor = COLORS.danger
          else if (signal < -65) data.cell.styles.textColor = COLORS.warning
          else data.cell.styles.textColor = COLORS.success
        }
        if (data.column.index === 4) {
          const status = data.cell.raw as string
          if (status === 'ONLINE') data.cell.styles.textColor = COLORS.success
          else if (status === 'WARNING') data.cell.styles.textColor = COLORS.warning
          else if (status === 'OFFLINE') data.cell.styles.textColor = COLORS.danger
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // Footer on all pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(...COLORS.tableBorder)
    doc.line(margin, doc.internal.pageSize.getHeight() - 18, pageWidth - margin, doc.internal.pageSize.getHeight() - 18)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(6)
    doc.text('MAHAGENCO | Sterling Electricals & Technologies', margin, doc.internal.pageSize.getHeight() - 13)
    doc.setFontSize(7)
    doc.text(`Generated by FluxIO SCADA | Version 3.0 | ${formatDateTime(new Date())}`, margin, doc.internal.pageSize.getHeight() - 8)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }

  // Generate filename
  const dateStr = formatDate(reportData.dateRange.startDate).replace(/[\s,]/g, '-')
  const filename = `FluxIO-${reportData.reportType}-Report-${dateStr}.pdf`

  // Save/download
  doc.save(filename)
}
