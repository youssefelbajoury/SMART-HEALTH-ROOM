// Frontend mirror of backend/src/config/thresholds.ts — keep values in sync.
// Single source of truth for the health score, predictive warnings, and
// recommendation engine so they never disagree with each other.

export interface SensorThreshold {
  label: string
  warning: number
  danger: number
  unit: string
}

export const THRESHOLDS: Record<"temperature" | "humidity" | "gas" | "soundLevel", SensorThreshold> = {
  temperature: { label: "Temperature", warning: 30, danger: 35, unit: "°C" },
  humidity: { label: "Humidity", warning: 70, danger: 85, unit: "%" },
  gas: { label: "Air Quality (Gas)", warning: 400, danger: 600, unit: "ppm" },
  soundLevel: { label: "Sound Level", warning: 40, danger: 50, unit: "dB" },
}

export type ThresholdLevel = "fine" | "warning" | "danger"

export function levelFor(key: keyof typeof THRESHOLDS, value: number): ThresholdLevel {
  const threshold = THRESHOLDS[key]
  if (!threshold) return "fine"
  if (value >= threshold.danger) return "danger"
  if (value >= threshold.warning) return "warning"
  return "fine"
}

export const OCCUPANCY_PRESSURE_THRESHOLD = 500
export const COMFORT_TEMP_RANGE: [number, number] = [20, 26]
