import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { SensorData, SensorHistoryPoint } from "@/store/sensor-store"
import type { HealthScoreResult } from "./healthScore"
import type { RoomQualityIndex } from "./roomQuality"
import type { PredictiveWarning } from "./predictiveWarning"
import type { AssistantRecommendation } from "./smartAssistant"
import type { Emergency } from "@/store/emergencyStore"
import type { WeatherReading, AirQualityReading } from "./weather"
import { formatTemperature } from "./format"

export interface HealthReportParams {
  user: { name: string; email: string }
  deviceId?: string
  data: SensorData
  healthScore: HealthScoreResult
  roomQuality: RoomQualityIndex
  predictiveWarning: PredictiveWarning | null
  recommendations: AssistantRecommendation[]
  weather: WeatherReading | null
  outdoorAqi: AirQualityReading | null
  emergencyHistory: Emergency[]
  sensorHistory: SensorHistoryPoint[] // last 15 days
  temperatureUnit: "C" | "F"
}

// Exported so other PDF generators (e.g. lib/chartExport.ts's analytics
// export) can reuse the exact same header/footer/section styling instead of
// redefining a second "brand" for a second report.
export const BRAND = { r: 79, g: 70, b: 229 } // indigo-600, matches the dashboard's accent color
export const INK = { r: 30, g: 41, b: 59 } // slate-800
export const MUTED = { r: 100, g: 116, b: 139 } // slate-500
export const MARGIN = 14
export const PAGE_W = 210 // A4 portrait, mm
export const PAGE_H = 297

function dailyAverages(history: SensorHistoryPoint[], key: "temperature" | "gas", days: number) {
  const now = new Date()
  const buckets = new Map<string, number[]>()
  for (const point of history) {
    const d = new Date(point.timestamp)
    const dayKey = d.toISOString().slice(0, 10)
    const arr = buckets.get(dayKey) ?? []
    arr.push(point[key])
    buckets.set(dayKey, arr)
  }

  const series: { label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayKey = d.toISOString().slice(0, 10)
    const values = buckets.get(dayKey)
    const avg = values && values.length ? values.reduce((s, v) => s + v, 0) / values.length : null
    series.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: avg ?? 0 })
  }
  return series
}

// A small, dependency-free line chart drawn with jsPDF's own vector
// primitives — keeps the whole report a pure, deterministic function of its
// input data rather than depending on scraping an already-rendered Chart.js
// canvas from the DOM.
function drawLineChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  series: { label: string; value: number }[],
  color: { r: number; g: number; b: number },
  unit: string
) {
  const values = series.map((s) => s.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.2)
  doc.rect(x, y, width, height)

  const stepX = width / Math.max(series.length - 1, 1)
  const points = series.map((s, i) => ({
    x: x + i * stepX,
    y: y + height - ((s.value - min) / range) * height,
  }))

  doc.setDrawColor(color.r, color.g, color.b)
  doc.setLineWidth(0.6)
  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y)
  }

  doc.setFillColor(color.r, color.g, color.b)
  for (const p of points) {
    doc.circle(p.x, p.y, 0.6, "F")
  }

  doc.setFontSize(7)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`${Math.round(max)}${unit}`, x + width + 2, y + 3)
  doc.text(`${Math.round(min)}${unit}`, x + width + 2, y + height)

  const labelStep = Math.max(Math.ceil(series.length / 6), 1)
  series.forEach((s, i) => {
    if (i % labelStep !== 0 && i !== series.length - 1) return
    doc.text(s.label, x + i * stepX, y + height + 4, { align: "center" })
  })
}

export function addHeader(doc: jsPDF, title: string) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 0, PAGE_W, 22, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("SMART HEALTH ROOM", MARGIN, 12)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(title, MARGIN, 18)
  doc.setFontSize(8)
  doc.text(new Date().toLocaleString("en-US"), PAGE_W - MARGIN, 12, { align: "right" })
  doc.text("Confidential Health Report", PAGE_W - MARGIN, 18, { align: "right" })
}

export function addFootersToAllPages(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14)
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.setFont("helvetica", "normal")
    doc.text("Smart Health Room — Generated automatically. Not a substitute for professional medical advice.", MARGIN, PAGE_H - 9)
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 9, { align: "right" })
  }
}

export function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(text, MARGIN, y)
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 1.5, MARGIN + 30, y + 1.5)
  return y + 8
}

export function generateHealthReportPdf(params: HealthReportParams): void {
  const { user, deviceId, data, healthScore, roomQuality, predictiveWarning, recommendations, weather, outdoorAqi, emergencyHistory, sensorHistory, temperatureUnit } = params

  const doc = new jsPDF({ unit: "mm", format: "a4" })
  addHeader(doc, "Health & Environment Report")

  let y = 32
  y = sectionTitle(doc, "Patient / User Information", y)
  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 9, textColor: [INK.r, INK.g, INK.b] },
    body: [
      ["Name", user.name],
      ["Email", user.email],
      ["Device ID", deviceId || "—"],
      ["Report Generated", new Date().toLocaleString("en-US")],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
    margin: { left: MARGIN, right: MARGIN },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  y = sectionTitle(doc, "Smart Health Score & Room Quality Index", y)
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Score", "Status"]],
    body: [
      ["Smart Health Score", `${healthScore.score} / 100`, healthScore.status],
      ["Room Quality Index (Overall)", `${roomQuality.overall} / 100`, ""],
      ["  Comfort", `${roomQuality.comfort} / 100`, ""],
      ["  Air Quality", `${roomQuality.airQuality} / 100`, ""],
      ["  Safety", `${roomQuality.safety} / 100`, ""],
      ["  Energy Efficiency", `${roomQuality.energyEfficiency} / 100`, ""],
    ],
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b] },
    styles: { fontSize: 9 },
    margin: { left: MARGIN, right: MARGIN },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  y = sectionTitle(doc, "Indoor Sensors (Current Reading)", y)
  const gasValue = data.gas ?? data.airQuality ?? 0
  autoTable(doc, {
    startY: y,
    head: [["Sensor", "Value"]],
    body: [
      ["Temperature", formatTemperature(data.temperature, temperatureUnit)],
      ["Humidity", `${Math.round(data.humidity)}%`],
      ["Gas / Air Quality", `${Math.round(gasValue)} ppm`],
      ["Light Level", `${Math.round(data.light ?? 500)} lux`],
      ["Pressure (Bed Sensor)", data.pressure > 500 ? "Occupied" : "Free"],
      ["Sound", data.soundLevel === 1 ? "Detected" : "Silent"],
    ],
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b] },
    styles: { fontSize: 9 },
    margin: { left: MARGIN, right: MARGIN },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  y = sectionTitle(doc, "Outdoor Weather", y)
  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 9 },
    body: weather
      ? [
          ["Condition", weather.label],
          ["Outdoor Temperature", formatTemperature(weather.temperature, temperatureUnit)],
          ["Outdoor Humidity", `${Math.round(weather.humidity)}%`],
          ["Outdoor Air Quality (US AQI)", outdoorAqi ? String(Math.round(outdoorAqi.usAqi)) : "—"],
        ]
      : [["Outdoor weather", "Unavailable"]],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    margin: { left: MARGIN, right: MARGIN },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  if (y > 230) {
    doc.addPage()
    addHeader(doc, "Health & Environment Report")
    y = 32
  }

  y = sectionTitle(doc, "Predictive Warnings", y)
  doc.setFontSize(9)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.setFont("helvetica", "normal")
  doc.text(predictiveWarning ? predictiveWarning.message : "No predictive warnings detected.", MARGIN, y)
  y += 10

  y = sectionTitle(doc, "Recommendations", y)
  if (recommendations.length === 0) {
    doc.setFontSize(9)
    doc.text("No active recommendations — conditions are within comfortable ranges.", MARGIN, y)
    y += 8
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Category", "Severity", "Recommendation"]],
      body: recommendations.map((r) => [r.category, r.severity, r.message]),
      headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b] },
      styles: { fontSize: 8.5 },
      margin: { left: MARGIN, right: MARGIN },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  if (y > 230) {
    doc.addPage()
    addHeader(doc, "Health & Environment Report")
    y = 32
  }

  y = sectionTitle(doc, "Emergency History", y)
  if (emergencyHistory.length === 0) {
    doc.setFontSize(9)
    doc.text("No emergencies recorded.", MARGIN, y)
    y += 8
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Date", "Level", "Message", "Status"]],
      body: emergencyHistory
        .slice(0, 15)
        .map((e) => [new Date(e.createdAt).toLocaleString("en-US"), e.level, e.message, e.status]),
      headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b] },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  doc.addPage()
  addHeader(doc, "Health & Environment Report")
  y = 32
  y = sectionTitle(doc, "Sensor History Trend (Last 15 Days)", y)

  const tempSeries = dailyAverages(sensorHistory, "temperature", 15)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Average Daily Temperature", MARGIN, y)
  drawLineChart(doc, MARGIN, y + 4, 150, 35, tempSeries, { r: 249, g: 115, b: 22 }, "°C")
  y += 50

  const gasSeries = dailyAverages(sensorHistory, "gas", 15)
  doc.setFont("helvetica", "bold")
  doc.text("Average Daily Gas / Air Quality", MARGIN, y)
  drawLineChart(doc, MARGIN, y + 4, 150, 35, gasSeries, { r: 168, g: 85, b: 247 }, "ppm")

  addFootersToAllPages(doc)

  const fileSafeName = user.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()
  doc.save(`smart-health-room-report-${fileSafeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
