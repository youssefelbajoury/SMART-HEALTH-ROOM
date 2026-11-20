import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { AnalyticsSummary } from "./analytics"
import { addHeader, addFootersToAllPages, sectionTitle, BRAND, INK, MARGIN } from "./healthReport"

/** Triggers a same-tab download of a Chart.js PNG snapshot (native `toBase64Image`, no new dependency). */
export function downloadChartPng(pngDataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = pngDataUrl
  link.download = filename
  link.click()
}

export interface AnalyticsChartExport {
  title: string
  unit: string
  pngDataUrl: string | null
}

export interface AnalyticsPdfParams {
  rangeLabel: string
  summary: AnalyticsSummary
  charts: AnalyticsChartExport[]
  user: { name: string; email: string }
}

// A smaller sibling to healthReport.ts's full report generator — reuses the
// same header/footer/section styling (imported above) instead of redefining
// a second "brand" for a second PDF, but stays intentionally focused on the
// Analytics page's own range-scoped stats and chart snapshots.
export function exportAnalyticsPdf(params: AnalyticsPdfParams): void {
  const { rangeLabel, summary, charts, user } = params

  const doc = new jsPDF({ unit: "mm", format: "a4" })
  addHeader(doc, `Analytics Report — ${rangeLabel}`)

  let y = 32
  y = sectionTitle(doc, "Summary", y)
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Warnings", String(summary.warningsCount)],
      ["Emergencies", String(summary.emergenciesCount)],
      ["Door Openings", String(summary.doorOpenings)],
      ["RFID Accepted", String(summary.rfidAccepted)],
      ["RFID Denied", String(summary.rfidDenied)],
      ["Bed Occupancy", `${summary.bedOccupancyPercent}%`],
      ["Avg Health Score", `${summary.avgHealthScore} / 100`],
      ["Avg Room Quality", `${summary.avgRoomQuality} / 100`],
      ["Sensor Reliability", `${summary.sensorUptimePercent}%`],
      ["ESP32 Reliability", `${summary.esp32UptimePercent}%`],
    ],
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b] },
    styles: { fontSize: 9 },
    margin: { left: MARGIN, right: MARGIN },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  for (const chart of charts) {
    if (!chart.pngDataUrl) continue
    if (y > 220) {
      doc.addPage()
      addHeader(doc, `Analytics Report — ${rangeLabel}`)
      y = 32
    }
    y = sectionTitle(doc, `${chart.title} (${chart.unit})`, y)
    doc.addImage(chart.pngDataUrl, "PNG", MARGIN, y, 180, 70)
    y += 80
  }

  doc.setFontSize(8)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(`Generated for ${user.name} (${user.email})`, MARGIN, 285)

  addFootersToAllPages(doc)

  const fileSafeName = user.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()
  doc.save(`smart-health-room-analytics-${fileSafeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
