import type { SensorData } from "@/store/sensor-store"
import type { WeatherReading, AirQualityReading } from "@/lib/weather"
import { levelFor, COMFORT_TEMP_RANGE, type ThresholdLevel } from "./thresholds"
import { distanceFromComfort } from "./weather"
import type { PredictiveWarning } from "./predictiveWarning"

export type RoomQualityKey = "comfort" | "airQuality" | "safety" | "energyEfficiency"

export interface RoomQualityIndex {
  overall: number
  comfort: number
  airQuality: number
  safety: number
  energyEfficiency: number
  explanations: Record<RoomQualityKey, string>
}

const LEVEL_SCORE: Record<ThresholdLevel, number> = { fine: 100, warning: 55, danger: 15 }
const WEIGHTS: Record<RoomQualityKey, number> = { comfort: 0.3, airQuality: 0.3, safety: 0.3, energyEfficiency: 0.1 }

function comfortScore(data: SensorData): { score: number; explanation: string } {
  const humidityLevel = levelFor("humidity", data.humidity)
  const tempDistance = distanceFromComfort(data.temperature, COMFORT_TEMP_RANGE)
  const tempScore = tempDistance <= 0 ? 100 : tempDistance <= 3 ? 65 : 25
  const score = Math.round(tempScore * 0.6 + LEVEL_SCORE[humidityLevel] * 0.4)

  const explanation =
    tempDistance <= 0 && humidityLevel === "fine"
      ? "Temperature and humidity are both within the comfortable range."
      : tempDistance > 0
        ? `Temperature is ${tempDistance.toFixed(1)}°C outside the comfortable ${COMFORT_TEMP_RANGE[0]}-${COMFORT_TEMP_RANGE[1]}°C range.`
        : "Humidity is outside the comfortable range."

  return { score, explanation }
}

function airQualityScore(data: SensorData, outdoorAqi: AirQualityReading | null): { score: number; explanation: string } {
  const gasValue = data.gas ?? data.airQuality ?? 0
  const gasLevel = levelFor("gas", gasValue)
  let score = LEVEL_SCORE[gasLevel]
  let explanation = `Indoor gas concentration is ${gasValue}ppm (${gasLevel === "fine" ? "healthy" : gasLevel}).`

  if (outdoorAqi) {
    const outdoorIsCleaner = outdoorAqi.usAqi < 50
    if (gasLevel !== "fine" && outdoorIsCleaner) {
      score = Math.max(15, score - 15)
      explanation += " Outdoor air quality is currently better — ventilation is recommended."
    } else if (gasLevel === "fine" && !outdoorIsCleaner) {
      explanation += " Indoor air is currently cleaner than outside."
    }
  }

  return { score: Math.round(score), explanation }
}

function safetyScore(data: SensorData, predictiveWarning: PredictiveWarning | null, emergencyActive: boolean): { score: number; explanation: string } {
  const gasValue = data.gas ?? data.airQuality ?? 0
  const gasLevel = levelFor("gas", gasValue)
  const soundLevel = levelFor("soundLevel", data.soundLevel)

  if (emergencyActive) return { score: 10, explanation: "An active emergency is in progress." }
  if (gasLevel === "danger") return { score: 15, explanation: "Gas concentration has reached a dangerous level." }
  if (predictiveWarning) return { score: 45, explanation: `${predictiveWarning.label} is trending toward an unsafe level.` }
  if (gasLevel === "warning" || soundLevel === "warning") return { score: 65, explanation: "One or more sensors are outside the normal range." }
  return { score: 100, explanation: "No safety risks detected." }
}

function energyEfficiencyScore(data: SensorData, weather: WeatherReading | null): { score: number; explanation: string } {
  const lightValue = data.light ?? 500
  const isDaytime = data.lightStatus !== "nuit"
  const lampOn = data.lamp ?? false
  const lampWasted = lampOn && isDaytime && lightValue >= 500

  let score = 100
  const reasons: string[] = []

  if (lampWasted) {
    score -= 30
    reasons.push("the lamp is on despite adequate daylight")
  }

  if (weather) {
    const delta = Math.abs(data.temperature - weather.temperature)
    if (delta > 10) {
      score -= 20
      reasons.push("a large indoor/outdoor temperature gap increases heating or cooling load")
    }
  }

  score = Math.max(15, score)
  const explanation = reasons.length === 0 ? "Lighting and climate usage are efficient right now." : `Efficiency is reduced because ${reasons.join(" and ")}.`

  return { score, explanation }
}

export function calculateRoomQuality(
  data: SensorData,
  weather: WeatherReading | null,
  outdoorAqi: AirQualityReading | null,
  predictiveWarning: PredictiveWarning | null,
  emergencyActive: boolean
): RoomQualityIndex {
  const comfort = comfortScore(data)
  const airQuality = airQualityScore(data, outdoorAqi)
  const safety = safetyScore(data, predictiveWarning, emergencyActive)
  const energyEfficiency = energyEfficiencyScore(data, weather)

  const overall = Math.round(
    comfort.score * WEIGHTS.comfort +
      airQuality.score * WEIGHTS.airQuality +
      safety.score * WEIGHTS.safety +
      energyEfficiency.score * WEIGHTS.energyEfficiency
  )

  return {
    overall,
    comfort: comfort.score,
    airQuality: airQuality.score,
    safety: safety.score,
    energyEfficiency: energyEfficiency.score,
    explanations: {
      comfort: comfort.explanation,
      airQuality: airQuality.explanation,
      safety: safety.explanation,
      energyEfficiency: energyEfficiency.explanation,
    },
  }
}
