import type { SensorHistoryPoint } from "@/store/sensor-store"
import { THRESHOLDS } from "./thresholds"

type TrendMetric = "temperature" | "humidity" | "gas" | "soundLevel"

export interface PredictiveWarning {
  metric: TrendMetric
  label: string
  message: string
}

const WINDOW = 5
const PROXIMITY_RATIO = 0.85 // fire once within 15% of the warning threshold

const METRICS: Array<{ key: TrendMetric; label: string; verb: string }> = [
  { key: "temperature", label: "Temperature", verb: "increasing" },
  { key: "humidity", label: "Humidity", verb: "increasing" },
  { key: "gas", label: "Air quality (gas)", verb: "deteriorating" },
  { key: "soundLevel", label: "Sound level", verb: "increasing" },
]

function isTrendingUp(values: number[]): boolean {
  if (values.length < 3) return false
  let increases = 0
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) increases++
    else if (values[i] < values[i - 1]) return false // any drop resets the trend
  }
  return increases >= values.length - 2 // allow at most one flat step
}

// Scans the most recent readings for a consistent upward run that is
// approaching (but hasn't yet reached) the real emergency threshold.
export function detectTrendWarning(history: SensorHistoryPoint[]): PredictiveWarning | null {
  if (history.length < 3) return null

  for (const metric of METRICS) {
    const values = history.slice(-WINDOW).map((point) => point[metric.key])
    const latest = values[values.length - 1]
    const threshold = THRESHOLDS[metric.key]

    if (latest >= threshold.danger) continue // already a real emergency, not a prediction
    if (latest < threshold.warning * PROXIMITY_RATIO) continue
    if (!isTrendingUp(values)) continue

    return {
      metric: metric.key,
      label: metric.label,
      message: `${metric.label} is ${metric.verb} rapidly. Potential emergency detected.`,
    }
  }

  return null
}
