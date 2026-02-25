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

// Distinct colors for each pipeline bar
const PIPE_COLORS: [number, number, number][] = [
  [14, 165, 233],   // Pipe 1 - Sky blue
  [34, 197, 94],    // Pipe 2 - Green
  [245, 158, 11],   // Pipe 3 - Amber
  [239, 68, 68],    // Pipe 4 - Red
  [139, 92, 246],   // Pipe 5 - Violet
  [236, 72, 153],   // Pipe 6 - Pink
]

/**
 * Draw a per-pipeline flow distribution bar chart with 24 hourly dividing lines.
 * Each line shows cumulative total (left) and IST time (right).
 * Zero-flow hours cause lines to overlap at the base.
 */
function drawPipelineFlowChart(
  doc: jsPDF,
  reportData: ReportData,
  margin: number,
  pageWidth: number,
  startY: number
): number {
  let yPos = startY

  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Pipeline Flow Distribution (Hourly Breakdown, IST)', margin, yPos)
  yPos += 8

  const chartWidth = pageWidth - margin * 2
  const chartHeight = 90
  const pipes = reportData.pipeStatistics
  const maxVolume = Math.max(...pipes.map(p => p.totalVolume), 1)

  // Chart background
  doc.setFillColor(...COLORS.background)
  doc.setDrawColor(...COLORS.tableBorder)
  doc.roundedRect(margin, yPos, chartWidth, chartHeight + 18, 2, 2, 'FD')

  // Bar dimensions
  const barAreaWidth = chartWidth - 10
  const barGap = 6
  const barWidth = (barAreaWidth - barGap * (pipes.length + 1)) / pipes.length
  const barStartX = margin + 5
  const usableBarHeight = chartHeight - 8
  const barBottom = yPos + chartHeight - 2

  // Light grid lines for volume scale
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.05)
  for (let i = 0; i <= 4; i++) {
    const gy = yPos + 2 + usableBarHeight * (i / 4) + 2
    doc.line(barStartX, gy, margin + chartWidth - 5, gy)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(4.5)
    doc.setFont('helvetica', 'normal')
    const scaleVal = maxVolume * (4 - i) / 4
    doc.text(`${scaleVal.toFixed(0)}`, margin + 2, gy + 1)
  }

  // Build per-pipe hourly lookup
  const pipeHourlyMap = new Map<string, number[]>()
  if (reportData.pipeHourlyData) {
    reportData.pipeHourlyData.forEach(phd => {
      pipeHourlyMap.set(phd.pipeId, phd.hourlyVolumes)
    })
  }

  // Draw bars with 24 hourly segments
  pipes.forEach((pipe, index) => {
    const totalBarHeight = (pipe.totalVolume / maxVolume) * usableBarHeight
    const x = barStartX + barGap + index * (barWidth + barGap)
    const color = PIPE_COLORS[index % PIPE_COLORS.length]
    const hourlyVolumes = pipeHourlyMap.get(pipe.pipeId)

    if (totalBarHeight > 0.5 && hourlyVolumes && pipe.totalVolume > 0) {
      // Draw 24 hourly stacked segments from bottom (hour 0 IST) to top (hour 23 IST)
      let currentY = barBottom
      let cumulative = 0
      let lastLabelY = barBottom + 10 // track last label position to avoid overlap

      for (let hour = 0; hour < 24; hour++) {
        const hourVol = hourlyVolumes[hour] || 0
        const segmentHeight = (hourVol / pipe.totalVolume) * totalBarHeight

        // Alternate shade for adjacent hours
        const shade = hour % 2 === 0 ? 0 : 20
        doc.setFillColor(
          Math.min(255, color[0] + shade),
          Math.min(255, color[1] + shade),
          Math.min(255, color[2] + shade)
        )

        if (segmentHeight > 0.05) {
          doc.rect(x, currentY - segmentHeight, barWidth, segmentHeight, 'F')
        }

        cumulative += hourVol
        currentY -= segmentHeight

        // Draw white dividing line at this hour boundary
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(0.15)
        doc.line(x, currentY, x + barWidth, currentY)

        // Show labels (cumulative left, time right) where space allows (>3mm gap)
        const gap = lastLabelY - currentY
        if (gap >= 3.2 && hour < 23) {
          // Left side: cumulative total received (white text inside bar)
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(3.5)
          doc.setFont('helvetica', 'bold')
          const cumLabel = cumulative >= 1000
            ? `${(cumulative / 1000).toFixed(1)}k`
            : cumulative >= 100
              ? cumulative.toFixed(0)
              : cumulative.toFixed(1)
          doc.text(cumLabel, x + 1, currentY + 2.2)

          // Right side: IST time (hours are already IST from data generation)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(3.2)
          const displayHour = (hour + 1) % 24
          const timeLabel = `${displayHour.toString().padStart(2, '0')}:00`
          doc.text(timeLabel, x + barWidth - 1, currentY + 2.2, { align: 'right' })

          lastLabelY = currentY
        }
      }
    } else if (totalBarHeight > 0.5) {
      // No hourly data, solid bar
      doc.setFillColor(...color)
      doc.roundedRect(x, barBottom - totalBarHeight, barWidth, totalBarHeight, 1, 1, 'F')
    } else {
      // Zero flow: draw all 24 lines overlapping at the base
      for (let h = 0; h < 24; h++) {
        doc.setDrawColor(...color)
        doc.setLineWidth(0.1)
        doc.line(x, barBottom, x + barWidth, barBottom)
      }
    }

    // Total value label on top of bar
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    const volLabel = pipe.totalVolume >= 1000
      ? `${(pipe.totalVolume / 1000).toFixed(1)}k`
      : pipe.totalVolume.toFixed(1)
    const barTop = barBottom - totalBarHeight
    doc.text(volLabel, x + barWidth / 2, Math.max(barTop - 2, yPos + 3), { align: 'center' })

    // Pipe label below bar
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`FT-0${index + 1}`, x + barWidth / 2, yPos + chartHeight + 6, { align: 'center' })
  })

  // Pipe color legend row
  const legendY = yPos + chartHeight + 10
  const legendItemWidth = chartWidth / pipes.length
  pipes.forEach((pipe, index) => {
    const lx = margin + 5 + index * legendItemWidth
    const c = PIPE_COLORS[index % PIPE_COLORS.length]

    doc.setFillColor(...c)
    doc.roundedRect(lx, legendY, 6, 4, 1, 1, 'F')

    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.text(`Pipe ${index + 1} (${pipe.totalVolume.toFixed(1)} m\u00B3)`, lx + 8, legendY + 3.2)
  })

  return yPos + chartHeight + 18
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
  doc.text('FlowNexus SCADA', margin, 33)

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
  const cardWidth = (pageWidth - margin * 2 - 10) / 3
  const cards = [
    { label: 'Total Flow Volume', value: `${reportData.summary.totalFlowVolume.toLocaleString()} m³`, color: COLORS.primary },
    { label: 'Avg Flow Rate', value: `${reportData.summary.avgFlowRate.toFixed(1)} m³/h`, color: COLORS.primary },
    { label: 'Active Devices', value: `${reportData.summary.activeDevices}/${reportData.summary.totalDevices}`, color: COLORS.success },
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
    `${pipe.minFlowRate}`,
    `${pipe.maxFlowRate}`,
    `${pipe.avgFlowRate}`,
    `${pipe.totalVolume.toLocaleString()}`,
    `${pipe.operatingHours}h`,
    pipe.status.toUpperCase(),
  ])

  // Calculate cumulative total volume
  const cumulativeTotalVolume = reportData.pipeStatistics.reduce((sum, pipe) => sum + pipe.totalVolume, 0)

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device', 'Min Flow (m³/h)', 'Max Flow (m³/h)', 'Avg Flow (m³/h)', 'Total Vol (m³)', 'Op. Hours', 'Status']],
    body: tableData,
    foot: [['', '', '', '', 'TOTAL:', cumulativeTotalVolume.toLocaleString(), '', '']],
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
    footStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: COLORS.background,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 45 },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 7) {
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
  // PIPELINE FLOW DISTRIBUTION CHART
  // ===================

  checkPageBreak(115)
  yPos = drawPipelineFlowChart(doc, reportData, margin, pageWidth, yPos)
  yPos += 10

  // ===================
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
      `Generated by FlowNexus SCADA | Version 3.0 | ${formatDateTime(new Date())}`,
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
  doc.text('FlowNexus SCADA', margin, 33)
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

  const cardWidth = (pageWidth - margin * 2 - 10) / 3
  const cards = [
    { label: 'Total Flow Volume', value: `${reportData.summary.totalFlowVolume.toLocaleString()} m³`, color: COLORS.primary },
    { label: 'Avg Flow Rate', value: `${reportData.summary.avgFlowRate.toFixed(1)} m³/h`, color: COLORS.primary },
    { label: 'Active Devices', value: `${reportData.summary.activeDevices}/${reportData.summary.totalDevices}`, color: COLORS.success },
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

  const tableDataCompact = reportData.pipeStatistics.map((pipe) => [
    pipe.pipeId.replace('pipe-', 'Pipe '),
    pipe.deviceName,
    `${pipe.minFlowRate}`,
    `${pipe.maxFlowRate}`,
    `${pipe.avgFlowRate}`,
    `${pipe.totalVolume.toLocaleString()}`,
    `${pipe.operatingHours}h`,
    pipe.status.toUpperCase(),
  ])

  // Calculate cumulative total volume
  const cumulativeTotalVolumeCompact = reportData.pipeStatistics.reduce((sum, pipe) => sum + pipe.totalVolume, 0)

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device', 'Min Flow (m³/h)', 'Max Flow (m³/h)', 'Avg Flow (m³/h)', 'Total Vol (m³)', 'Op. Hours', 'Status']],
    body: tableDataCompact,
    foot: [['', '', '', '', 'TOTAL:', cumulativeTotalVolumeCompact.toLocaleString(), '', '']],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.tableBorder, lineWidth: 0.1 },
    headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: COLORS.background },
    columnStyles: {
      0: { cellWidth: 18 }, 1: { cellWidth: 45 },
      2: { cellWidth: 22, halign: 'right' }, 3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' }, 5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' }, 7: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 7) {
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

  // Pipeline Flow Distribution Chart
  checkPageBreak(115)
  yPos = drawPipelineFlowChart(doc, reportData, margin, pageWidth, yPos)
  yPos += 10

  // Device Health
  checkPageBreak(50)
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Device Health', margin, yPos)
  yPos += 8

  const healthDataBuf = reportData.deviceHealth.map((device) => [
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
    body: healthDataBuf,
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
  const pageCountBuf = doc.getNumberOfPages()
  for (let i = 1; i <= pageCountBuf; i++) {
    doc.setPage(i)
    doc.setDrawColor(...COLORS.tableBorder)
    doc.line(margin, doc.internal.pageSize.getHeight() - 18, pageWidth - margin, doc.internal.pageSize.getHeight() - 18)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(6)
    doc.text('MAHAGENCO | Sterling Electricals & Technologies', margin, doc.internal.pageSize.getHeight() - 13)
    doc.setFontSize(7)
    doc.text(`Generated by FlowNexus SCADA | Version 3.0 | ${formatDateTime(new Date())}`, margin, doc.internal.pageSize.getHeight() - 8)
    doc.text(`Page ${i} of ${pageCountBuf}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
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
  doc.text('FlowNexus SCADA', margin, 33)
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

  const cardWidth = (pageWidth - margin * 2 - 10) / 3
  const cards = [
    { label: 'Total Flow Volume', value: `${reportData.summary.totalFlowVolume.toLocaleString()} m³`, color: COLORS.primary },
    { label: 'Avg Flow Rate', value: `${reportData.summary.avgFlowRate.toFixed(1)} m³/h`, color: COLORS.primary },
    { label: 'Active Devices', value: `${reportData.summary.activeDevices}/${reportData.summary.totalDevices}`, color: COLORS.success },
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

  const tableDataCompact = reportData.pipeStatistics.map((pipe) => [
    pipe.pipeId.replace('pipe-', 'Pipe '),
    pipe.deviceName,
    `${pipe.minFlowRate}`,
    `${pipe.maxFlowRate}`,
    `${pipe.avgFlowRate}`,
    `${pipe.totalVolume.toLocaleString()}`,
    `${pipe.operatingHours}h`,
    pipe.status.toUpperCase(),
  ])

  // Calculate cumulative total volume
  const cumulativeTotalVolumeCompact = reportData.pipeStatistics.reduce((sum, pipe) => sum + pipe.totalVolume, 0)

  autoTable(doc, {
    startY: yPos,
    head: [['Pipe', 'Device', 'Min Flow (m³/h)', 'Max Flow (m³/h)', 'Avg Flow (m³/h)', 'Total Vol (m³)', 'Op. Hours', 'Status']],
    body: tableDataCompact,
    foot: [['', '', '', '', 'TOTAL:', cumulativeTotalVolumeCompact.toLocaleString(), '', '']],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.tableBorder, lineWidth: 0.1 },
    headStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: COLORS.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: COLORS.background },
    columnStyles: {
      0: { cellWidth: 18 }, 1: { cellWidth: 45 },
      2: { cellWidth: 22, halign: 'right' }, 3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' }, 5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' }, 7: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 7) {
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

  // Pipeline Flow Distribution Chart
  checkPageBreak(115)
  yPos = drawPipelineFlowChart(doc, reportData, margin, pageWidth, yPos)
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
    doc.text(`Generated by FlowNexus SCADA | Version 3.0 | ${formatDateTime(new Date())}`, margin, doc.internal.pageSize.getHeight() - 8)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }

  // Generate filename
  const dateStr = formatDate(reportData.dateRange.startDate).replace(/[\s,]/g, '-')
  const filename = `FlowNexus-${reportData.reportType}-Report-${dateStr}.pdf`

  // Save/download
  doc.save(filename)
}
