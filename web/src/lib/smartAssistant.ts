import type { SensorData, SensorHistoryPoint } from "@/store/sensor-store"
import type { WeatherReading, AirQualityReading } from "@/lib/weather"
import type { HealthScoreResult } from "./healthScore"
import type { RoomQualityIndex } from "./roomQuality"
import type { PredictiveWarning } from "./predictiveWarning"
import { generateInsights } from "./recommendations"
import { THRESHOLDS, COMFORT_TEMP_RANGE } from "./thresholds"
import { distanceFromComfort } from "./weather"

export type AssistantCategory = "environment" | "outdoor" | "sunExposure" | "hydration" | "sleep" | "weekend"
export type AssistantSeverity = "info" | "warning" | "critical"

export interface AssistantRecommendation {
  id: string
  category: AssistantCategory
  severity: AssistantSeverity
  message: string
  reasons: string[]
  confidence: number
}

export interface AssistantContext {
  data: SensorData
  history: SensorHistoryPoint[]
  healthScore: HealthScoreResult
  roomQuality: RoomQualityIndex
  predictiveWarning: PredictiveWarning | null
  weather: WeatherReading | null
  outdoorAqi: AirQualityReading | null
  presence: boolean
  now: Date
}

const SEVERITY_ORDER: Record<AssistantSeverity, number> = { critical: 0, warning: 1, info: 2 }
const NIGHT_START_HOUR = 22
const NIGHT_END_HOUR = 6
const HOT_OUTDOOR_TEMP = 30

function confidenceFor(severity: AssistantSeverity, reasonCount: number): number {
  const base = severity === "critical" ? 90 : severity === "warning" ? 78 : 65
  const bonus = Math.min(Math.max(reasonCount - 1, 0), 3) * 4
  return Math.min(98, base + bonus)
}

function make(
  id: string,
  category: AssistantCategory,
  severity: AssistantSeverity,
  message: string,
  reasons: string[]
): AssistantRecommendation {
  return { id, category, severity, message, reasons, confidence: confidenceFor(severity, reasons.length) }
}

export function getGreeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 18) return "Good Afternoon"
  return "Good Evening"
}

function insightReason(id: string, data: SensorData): string {
  const gasValue = data.gas ?? data.airQuality ?? 0
  if (id.startsWith("gas-")) return `Gas concentration is ${gasValue}ppm (warning threshold is ${THRESHOLDS.gas.warning}ppm).`
  if (id.startsWith("temp-")) return `Indoor temperature is ${data.temperature.toFixed(1)}°C (warning threshold is ${THRESHOLDS.temperature.warning}°C).`
  if (id.startsWith("humidity-")) return `Indoor humidity is ${data.humidity.toFixed(0)}% (warning threshold is ${THRESHOLDS.humidity.warning}%).`
  if (id.startsWith("light-")) return `Light level is ${data.light ?? 500}, below the recommended daytime level of 500.`
  if (id === "sound-check") return `Sound level exceeded the ${THRESHOLDS.soundLevel.warning}dB threshold.`
  if (id === "prolonged-bed-time") return "Patient has remained continuously in bed for over 2 hours."
  return "Derived from current sensor readings."
}

function environmentRecommendations(ctx: AssistantContext): AssistantRecommendation[] {
  return generateInsights(ctx.data, ctx.history).map((insight) =>
    make(`environment-${insight.id}`, "environment", insight.severity, insight.message, [insightReason(insight.id, ctx.data)])
  )
}

function outdoorRecommendations(ctx: AssistantContext): AssistantRecommendation[] {
  const { weather, outdoorAqi, data } = ctx
  if (!weather) return []
  const items: AssistantRecommendation[] = []
  const indoorDistance = distanceFromComfort(data.temperature, COMFORT_TEMP_RANGE)
  const outdoorDistance = distanceFromComfort(weather.temperature, COMFORT_TEMP_RANGE)
  const isDaytime = data.lightStatus !== "nuit"
  const gasValue = data.gas ?? data.airQuality ?? 0

  if (weather.category === "storm" || weather.category === "rain") {
    items.push(
      make(
        "outdoor-heavy-rain",
        "outdoor",
        weather.category === "storm" ? "warning" : "info",
        weather.category === "storm" ? "Thunderstorm expected today — avoid outdoor activity." : "Heavy rain expected today.",
        [`Outdoor forecast is "${weather.label}".`]
      )
    )
    items.push(
      make("outdoor-close-windows", "outdoor", "info", "Keep windows closed due to outdoor conditions.", [`Outdoor forecast is "${weather.label}".`])
    )
  } else if (outdoorDistance === 0 && isDaytime) {
    items.push(
      make("outdoor-walk", "outdoor", "info", "Great weather for outdoor walking.", [
        `Outdoor temperature is ${Math.round(weather.temperature)}°C, within the comfortable range.`,
      ])
    )
    if (outdoorAqi && outdoorAqi.usAqi < 50 && gasValue <= THRESHOLDS.gas.warning) {
      items.push(
        make("outdoor-ventilate", "outdoor", "info", "Excellent day for natural ventilation — consider opening a window.", [
          `Outdoor air quality index is ${outdoorAqi.usAqi} (good).`,
          `Indoor gas concentration is ${gasValue}ppm (healthy).`,
        ])
      )
    }
  }

  if (outdoorAqi && outdoorAqi.usAqi < 50 && gasValue > THRESHOLDS.gas.warning) {
    items.push(
      make("outdoor-air-better", "outdoor", "warning", "Outdoor air quality is better than indoor air quality right now.", [
        `Outdoor air quality index is ${outdoorAqi.usAqi} (good).`,
        `Indoor gas concentration is ${gasValue}ppm, above the ${THRESHOLDS.gas.warning}ppm threshold.`,
      ])
    )
  }

  if (indoorDistance < outdoorDistance && outdoorDistance > 0) {
    items.push(
      make("outdoor-indoor-healthier", "outdoor", "info", "Indoor temperature is healthier than outside today.", [
        `Indoor temperature is ${Math.round(data.temperature)}°C vs outdoor ${Math.round(weather.temperature)}°C.`,
        `Comfortable range is ${COMFORT_TEMP_RANGE[0]}-${COMFORT_TEMP_RANGE[1]}°C.`,
      ])
    )
  }

  return items
}

function sunExposureRecommendations(ctx: AssistantContext): AssistantRecommendation[] {
  const { weather, now } = ctx
  if (!weather || !weather.sunrise || !weather.sunset) return []
  const sunrise = new Date(weather.sunrise)
  const sunset = new Date(weather.sunset)
  if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime())) return []

  const isDaylight = now >= sunrise && now <= sunset
  if (!isDaylight) return []

  const items: AssistantRecommendation[] = []
  const morningWindowEnd = new Date(sunrise.getTime() + 3 * 60 * 60 * 1000)

  if (weather.uvIndex >= 6) {
    items.push(
      make("sun-uv-high", "sunExposure", "warning", "UV level is high. Avoid prolonged outdoor exposure during peak hours.", [
        `Current UV index is ${weather.uvIndex}.`,
      ])
    )
  } else if (now <= morningWindowEnd) {
    items.push(
      make(
        "sun-morning",
        "sunExposure",
        "info",
        "Morning sunlight is recommended — 15-20 minutes may support Vitamin D production.",
        [`Current UV index is ${weather.uvIndex} (low-moderate).`, "It is within 3 hours of sunrise."]
      )
    )
  }

  return items
}

function hydrationRecommendations(ctx: AssistantContext): AssistantRecommendation[] {
  const { data, weather, presence } = ctx
  if (!presence) return []
  const items: AssistantRecommendation[] = [
    make("hydration-base", "hydration", "info", "Stay hydrated.", ["Patient presence is currently detected in the room."]),
  ]

  const indoorHot = data.temperature > COMFORT_TEMP_RANGE[1]
  const outdoorHot = weather ? weather.temperature > HOT_OUTDOOR_TEMP : false

  if (indoorHot || outdoorHot) {
    const reasons: string[] = []
    if (indoorHot) reasons.push(`Indoor temperature is ${Math.round(data.temperature)}°C, above the comfortable range.`)
    if (outdoorHot && weather) reasons.push(`Outdoor temperature is ${Math.round(weather.temperature)}°C.`)
    items.push(make("hydration-hot", "hydration", "warning", "Hot weather detected. Increase water intake today.", reasons))
  }

  return items
}

function sleepRecommendations(ctx: AssistantContext): AssistantRecommendation[] {
  const { data, now } = ctx
  const hour = now.getHours()
  const isNight = hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR
  if (!isNight) return []

  const items: AssistantRecommendation[] = [
    make("sleep-screen", "sleep", "info", "Reduce screen exposure before sleep.", [`It is currently ${hour}:00, within the night window.`]),
  ]

  const lightValue = data.light ?? 500
  if (lightValue < 200) {
    items.push(make("sleep-light-good", "sleep", "info", "Lighting conditions are suitable for rest.", [`Light level is ${lightValue}, low enough for sleep.`]))
  }

  if (data.soundLevel > THRESHOLDS.soundLevel.warning) {
    items.push(
      make("sleep-noise", "sleep", "warning", "Noise level may affect sleep quality.", [
        `Sound level exceeded the ${THRESHOLDS.soundLevel.warning}dB threshold during night hours.`,
      ])
    )
  }

  if (data.sleepScore !== null && data.sleepScore < 50) {
    items.push(make("sleep-score-low", "sleep", "warning", "Recent sleep quality has been below average.", [`Sleep score is ${data.sleepScore}/100.`]))
  }

  return items
}

function weekendRecommendations(ctx: AssistantContext): AssistantRecommendation[] {
  const { now, weather } = ctx
  const day = now.getDay()
  const isWeekend = day === 0 || day === 6
  if (!isWeekend) return []

  const items: AssistantRecommendation[] = [
    make("weekend-activity", "weekend", "info", "Today is a good day for light physical activity.", ["It is the weekend."]),
  ]

  if (weather && (weather.category === "clear" || weather.category === "cloudy")) {
    const outdoorDistance = distanceFromComfort(weather.temperature, COMFORT_TEMP_RANGE)
    if (outdoorDistance === 0) {
      items.push(
        make("weekend-outdoors", "weekend", "info", "Spend time outdoors if weather conditions are favorable.", [
          `Weather is "${weather.label}" with a comfortable outdoor temperature.`,
        ])
      )
    }
  }

  return items
}

export function generateSmartRecommendations(ctx: AssistantContext): AssistantRecommendation[] {
  const items = [
    ...environmentRecommendations(ctx),
    ...outdoorRecommendations(ctx),
    ...sunExposureRecommendations(ctx),
    ...hydrationRecommendations(ctx),
    ...sleepRecommendations(ctx),
    ...weekendRecommendations(ctx),
  ]
  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

function qualityLabel(score: number): string {
  if (score >= 80) return "excellent"
  if (score >= 60) return "good"
  if (score >= 40) return "fair"
  return "poor"
}

export function buildAssistantSummarySentences(ctx: AssistantContext, recommendations: AssistantRecommendation[], userName: string): string[] {
  const sentences: string[] = []

  sentences.push(`${getGreeting(ctx.now)}, ${userName}.`)
  sentences.push(`Your room quality is currently ${qualityLabel(ctx.roomQuality.overall)} (${ctx.roomQuality.overall}%).`)

  const critical = recommendations.find((r) => r.severity === "critical")
  if (critical) {
    sentences.push(critical.message)
  } else {
    const outdoorComparison = recommendations.find((r) => r.category === "outdoor")
    sentences.push(outdoorComparison ? outdoorComparison.message : "Indoor conditions are being monitored continuously.")
  }

  const nextAction = recommendations.find((r) => r.severity !== "critical" && r.message !== sentences[2])
  if (nextAction) {
    sentences.push(nextAction.message)
  } else if (!critical) {
    sentences.push("No action is needed right now — conditions look good.")
  }

  return sentences.slice(0, 4)
}

export function buildAssistantSummary(ctx: AssistantContext, recommendations: AssistantRecommendation[], userName: string): string {
  return buildAssistantSummarySentences(ctx, recommendations, userName).join(" ")
}
