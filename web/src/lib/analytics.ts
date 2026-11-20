import type { SensorData, SensorHistoryPoint } from "@/store/sensor-store"
import type { Alert } from "@/store/alertStore"
import type { Emergency } from "@/store/emergencyStore"
import type { SystemLog } from "@/store/logStore"
import type { WeatherReading, AirQualityReading } from "@/lib/weather"
import { calculateHealthScore } from "./healthScore"
import { calculateRoomQuality } from "./roomQuality"
import { computeOccupancyStats } from "./occupancy"

export interface AnalyticsSummary {
  warningsCount: number
  emergenciesCount: number
  doorOpenings: number
  rfidAccepted: number
  rfidDenied: number
  bedOccupancyPercent: number
  avgHealthScore: number
  avgRoomQuality: number
  sensorUptimePercent: number
  esp32UptimePercent: number
}

// calculateHealthScore/calculateRoomQuality expect the live SensorData shape
// (motion/sleepScore/Date timestamp); history points don't carry those
// fields but the two functions never read them, so a placeholder adapter is
// safe and avoids duplicating either engine's logic for historical data.
function toEngineInput(point: SensorHistoryPoint): SensorData {
  return {
    temperature: point.temperature,
    humidity: point.humidity,
    airQuality: point.airQuality,
    pressure: point.pressure,
    motion: false,
    soundLevel: point.soundLevel,
    sleepScore: null,
    timestamp: new Date(point.timestamp),
    light: point.light,
    gas: point.gas,
  }
}

// The Arduino Mega only transmits telemetry while someone is inside the room
// (by design — see handleInsideMonitoring in the firmware), so long silent
// gaps are normal, not downtime. Rather than fake a wall-clock uptime
// percentage this can't honestly support, this measures reporting
// *reliability* during active sessions: consecutive readings within
// SESSION_GAP_MS are one continuous session; gaps larger than that (room
// empty) are excluded from both numerator and denominator entirely.
const SESSION_GAP_MS = 5 * 60 * 1000
const EXPECTED_INTERVAL_MS = 2 * 1000 // matches Arduino's SENSOR_SEND_INTERVAL_MS
const ON_TIME_TOLERANCE = EXPECTED_INTERVAL_MS * 3

function computeReportingReliability(history: SensorHistoryPoint[]): number {
  if (history.length < 2) return history.length === 1 ? 100 : 0
  const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  let onTime = 0
  let inSession = 0
  for (let i = 1; i < sorted.length; i++) {
    const gap = new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime()
    if (gap > SESSION_GAP_MS) continue
    inSession++
    if (gap <= ON_TIME_TOLERANCE) onTime++
  }

  if (inSession === 0) return 100
  return Math.round((onTime / inSession) * 100)
}

export function computeAnalytics(params: {
  history: SensorHistoryPoint[]
  alerts: Alert[]
  emergencies: Emergency[]
  logs: SystemLog[]
  weather: WeatherReading | null
  outdoorAqi: AirQualityReading | null
}): AnalyticsSummary {
  const { history, alerts, emergencies, logs, weather, outdoorAqi } = params

  const warningsCount = alerts.filter((a) => a.type === "warning").length
  const emergenciesCount = emergencies.length
  const doorOpenings = logs.filter((l) => l.source === "actuator" && l.message === "Door Open").length
  const rfidAccepted = logs.filter((l) => l.source === "rfid" && l.message.startsWith("RFID Accepted")).length
  const rfidDenied = logs.filter((l) => l.source === "rfid" && l.message.startsWith("RFID Denied")).length

  const occupancy = computeOccupancyStats(history)

  const scored = history.map((point) => {
    const input = toEngineInput(point)
    return {
      health: calculateHealthScore(input).score,
      // Predictive-warning/emergency context can't be reconstructed per
      // historical point, so this approximates using current weather/AQI
      // with no active warning or emergency — comfort/air-quality/energy
      // trends are still real, "safety" defaults optimistic.
      room: calculateRoomQuality(input, weather, outdoorAqi, null, false).overall,
    }
  })

  const avgHealthScore = scored.length ? Math.round(scored.reduce((s, v) => s + v.health, 0) / scored.length) : 0
  const avgRoomQuality = scored.length ? Math.round(scored.reduce((s, v) => s + v.room, 0) / scored.length) : 0

  const reliability = computeReportingReliability(history)

  return {
    warningsCount,
    emergenciesCount,
    doorOpenings,
    rfidAccepted,
    rfidDenied,
    bedOccupancyPercent: occupancy.occupancyPct,
    avgHealthScore,
    avgRoomQuality,
    sensorUptimePercent: reliability,
    // Same underlying liveness signal the backend's /status endpoint uses
    // for both devices (they share one uplink) — see status.controller.ts.
    esp32UptimePercent: reliability,
  }
}
