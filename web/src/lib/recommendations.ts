import type { SensorData, SensorHistoryPoint } from "@/store/sensor-store"
import { THRESHOLDS, levelFor, OCCUPANCY_PRESSURE_THRESHOLD } from "./thresholds"

export type InsightType = "recommendation" | "suggestion"
export type InsightSeverity = "info" | "warning" | "critical"

export interface Insight {
  id: string
  type: InsightType
  severity: InsightSeverity
  message: string
}

const PROLONGED_BED_TIME_MS = 2 * 60 * 60 * 1000 // 2 hours

// Scans backwards from the latest reading and sums how long pressure has
// stayed continuously above the occupancy threshold, stopping at the first
// gap so a brief dip doesn't inflate the duration.
function continuousOccupiedDurationMs(history: SensorHistoryPoint[]): number {
  if (history.length === 0) return 0
  const last = history[history.length - 1]
  if (last.pressure <= OCCUPANCY_PRESSURE_THRESHOLD) return 0

  let durationMs = 0
  for (let i = history.length - 1; i > 0; i--) {
    if (history[i].pressure <= OCCUPANCY_PRESSURE_THRESHOLD) break
    durationMs += new Date(history[i].timestamp).getTime() - new Date(history[i - 1].timestamp).getTime()
  }
  return durationMs
}

export function generateInsights(data: SensorData, history: SensorHistoryPoint[] = []): Insight[] {
  const insights: Insight[] = []
  const gasValue = data.gas ?? data.airQuality ?? 0
  const gasLevel = levelFor("gas", gasValue)
  const temperatureLevel = levelFor("temperature", data.temperature)
  const humidityLevel = levelFor("humidity", data.humidity)
  const lightValue = data.light ?? 500
  const isDaytime = data.lightStatus !== "nuit"

  if (gasLevel !== "fine") {
    insights.push({
      id: "gas-quality",
      type: "recommendation",
      severity: gasLevel === "danger" ? "critical" : "warning",
      message: "Air quality is deteriorating.",
    })
    insights.push({ id: "gas-ventilate", type: "suggestion", severity: gasLevel === "danger" ? "critical" : "warning", message: "Open the window and activate ventilation." })
    insights.push({ id: "gas-monitor", type: "suggestion", severity: "info", message: "Monitor gas concentration closely." })
  }

  if (temperatureLevel !== "fine") {
    insights.push({
      id: "temp-range",
      type: "recommendation",
      severity: temperatureLevel === "danger" ? "critical" : "warning",
      message: `Room temperature is above the recommended range (${THRESHOLDS.temperature.warning}${THRESHOLDS.temperature.unit}).`,
    })
    insights.push({ id: "temp-reduce", type: "suggestion", severity: temperatureLevel === "danger" ? "critical" : "warning", message: "Reduce room temperature." })
  }

  if (humidityLevel !== "fine") {
    insights.push({
      id: "humidity-range",
      type: "recommendation",
      severity: humidityLevel === "danger" ? "critical" : "warning",
      message: "Humidity exceeds the recommended range.",
    })
    insights.push({ id: "humidity-reduce", type: "suggestion", severity: humidityLevel === "danger" ? "critical" : "warning", message: "Reduce humidity in the room." })
  }

  if (isDaytime && lightValue < 500) {
    insights.push({ id: "light-low", type: "recommendation", severity: "info", message: "Room lighting should be increased." })
    insights.push({ id: "light-suggest", type: "suggestion", severity: "info", message: "Increase room lighting." })
  }

  if (data.soundLevel > THRESHOLDS.soundLevel.warning) {
    insights.push({ id: "sound-check", type: "suggestion", severity: "warning", message: "Check the patient's condition." })
  }

  if (continuousOccupiedDurationMs(history) >= PROLONGED_BED_TIME_MS) {
    insights.push({
      id: "prolonged-bed-time",
      type: "recommendation",
      severity: "info",
      message: "Patient has remained in bed for a prolonged period.",
    })
  }

  return insights
}
