import type { SensorData } from "@/store/sensor-store"
import { THRESHOLDS, levelFor, OCCUPANCY_PRESSURE_THRESHOLD, type ThresholdLevel } from "./thresholds"

export type HealthStatus = "excellent" | "warning" | "critical"

export interface HealthScoreBreakdownItem {
  key: string
  label: string
  score: number
  level: ThresholdLevel
}

export interface HealthScoreResult {
  score: number
  status: HealthStatus
  breakdown: HealthScoreBreakdownItem[]
  lastUpdated: Date
}

const LEVEL_SCORE: Record<ThresholdLevel, number> = { fine: 100, warning: 55, danger: 15 }

// Mirrors sensor-store.ts's getLightStatus bands (200 / 500) — kept as plain
// numbers here since this file must stay a framework-free pure function.
function lightLevel(value: number): ThresholdLevel {
  if (value < 200) return "danger"
  if (value < 500) return "warning"
  return "fine"
}

const WEIGHTS = {
  temperature: 0.2,
  humidity: 0.15,
  gas: 0.2,
  soundLevel: 0.15,
  light: 0.15,
  presence: 0.15,
}

export function calculateHealthScore(data: SensorData): HealthScoreResult {
  const gasValue = data.gas ?? data.airQuality ?? 0
  const lightValue = data.light ?? 500
  const presenceDetected = (data.pressure ?? 0) > OCCUPANCY_PRESSURE_THRESHOLD

  const temperatureLevel = levelFor("temperature", data.temperature)
  const humidityLevel = levelFor("humidity", data.humidity)
  const gasLevel = levelFor("gas", gasValue)
  const soundLevel = levelFor("soundLevel", data.soundLevel)
  const lightLvl = lightLevel(lightValue)

  const breakdown: HealthScoreBreakdownItem[] = [
    { key: "temperature", label: THRESHOLDS.temperature.label, score: LEVEL_SCORE[temperatureLevel], level: temperatureLevel },
    { key: "humidity", label: THRESHOLDS.humidity.label, score: LEVEL_SCORE[humidityLevel], level: humidityLevel },
    { key: "gas", label: THRESHOLDS.gas.label, score: LEVEL_SCORE[gasLevel], level: gasLevel },
    { key: "soundLevel", label: THRESHOLDS.soundLevel.label, score: LEVEL_SCORE[soundLevel], level: soundLevel },
    { key: "light", label: "Lighting", score: LEVEL_SCORE[lightLvl], level: lightLvl },
    { key: "presence", label: presenceDetected ? "Patient Monitored" : "Room Unoccupied", score: 100, level: "fine" },
  ]

  const score = Math.round(
    WEIGHTS.temperature * LEVEL_SCORE[temperatureLevel] +
      WEIGHTS.humidity * LEVEL_SCORE[humidityLevel] +
      WEIGHTS.gas * LEVEL_SCORE[gasLevel] +
      WEIGHTS.soundLevel * LEVEL_SCORE[soundLevel] +
      WEIGHTS.light * LEVEL_SCORE[lightLvl] +
      WEIGHTS.presence * 100
  )

  const status: HealthStatus = score >= 80 ? "excellent" : score >= 50 ? "warning" : "critical"

  return { score, status, breakdown, lastUpdated: new Date(data.timestamp) }
}
