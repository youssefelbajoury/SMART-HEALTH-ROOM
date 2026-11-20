import type { WeatherCategory } from "./weather"

export type SkyPeriod = "goldenHourMorning" | "day" | "goldenHourEvening" | "blueHour" | "night"
export type Season = "spring" | "summer" | "autumn" | "winter"

const GOLDEN_HOUR_MS = 40 * 60 * 1000
const BLUE_HOUR_MS = 25 * 60 * 1000
const RAINBOW_WINDOW_MS = 45 * 60 * 1000

// Northern-hemisphere buckets — consistent with the project's default
// deployment region (Tunisia coords used as the weatherStore fallback).
export function getSeason(date: Date): Season {
  const month = date.getMonth()
  if (month >= 2 && month <= 4) return "spring"
  if (month >= 5 && month <= 7) return "summer"
  if (month >= 8 && month <= 10) return "autumn"
  return "winter"
}

// The LDR-derived `isDay` stays the ground truth (matches every other
// day:/night surface in the app); sunrise/sunset only add golden/blue-hour
// nuance within whichever mode isDay already selected.
export function getSkyPeriod(now: Date, sunrise: Date | null, sunset: Date | null, isDay: boolean): SkyPeriod {
  const t = now.getTime()

  if (isDay) {
    if (sunrise && t >= sunrise.getTime() && t < sunrise.getTime() + GOLDEN_HOUR_MS) return "goldenHourMorning"
    if (sunset && t >= sunset.getTime() - GOLDEN_HOUR_MS && t < sunset.getTime()) return "goldenHourEvening"
    return "day"
  }

  if (sunset && t >= sunset.getTime() && t < sunset.getTime() + BLUE_HOUR_MS) return "blueHour"
  if (sunrise && t >= sunrise.getTime() - BLUE_HOUR_MS && t < sunrise.getTime()) return "blueHour"
  return "night"
}

export interface SceneColors {
  stops: string[]
  glow: string
}

const BASE_GRADIENTS: Record<SkyPeriod, string[]> = {
  goldenHourMorning: ["#fde68a", "#fca5a5", "#93c5fd"],
  day: ["#7dd3fc", "#38bdf8", "#0ea5e9"],
  goldenHourEvening: ["#fdba74", "#f472b6", "#818cf8"],
  blueHour: ["#312e81", "#1e3a8a", "#0f172a"],
  night: ["#0f172a", "#020617", "#000000"],
}

const GLOW_BY_PERIOD: Record<SkyPeriod, string> = {
  goldenHourMorning: "rgba(253, 224, 71, 0.25)",
  day: "rgba(56, 189, 248, 0.2)",
  goldenHourEvening: "rgba(244, 114, 182, 0.2)",
  blueHour: "rgba(99, 102, 241, 0.18)",
  night: "rgba(99, 102, 241, 0.1)",
}

const SEASON_TINT: Record<Season, string | null> = {
  summer: "#fb923c",
  winter: "#38bdf8",
  spring: null,
  autumn: null,
}

const OVERCAST_CATEGORIES = new Set<WeatherCategory>(["cloudy", "fog", "rain", "storm", "snow"])

function mix(hex1: string, hex2: string, weight: number): string {
  const c1 = parseInt(hex1.slice(1), 16)
  const c2 = parseInt(hex2.slice(1), 16)
  const r = Math.round(((c1 >> 16) & 255) * (1 - weight) + ((c2 >> 16) & 255) * weight)
  const g = Math.round(((c1 >> 8) & 255) * (1 - weight) + ((c2 >> 8) & 255) * weight)
  const b = Math.round((c1 & 255) * (1 - weight) + (c2 & 255) * weight)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export function getSceneColors(period: SkyPeriod, category: WeatherCategory, season: Season): SceneColors {
  let stops = BASE_GRADIENTS[period]
  let glow = GLOW_BY_PERIOD[period]

  if (OVERCAST_CATEGORIES.has(category)) {
    const veil = category === "storm" ? "#1e293b" : category === "fog" ? "#94a3b8" : "#64748b"
    const weight = category === "storm" ? 0.65 : category === "fog" ? 0.55 : 0.4
    stops = stops.map((stop) => mix(stop, veil, weight))
    glow = "rgba(148, 163, 184, 0.12)"
  }

  const tint = SEASON_TINT[season]
  if (tint) {
    stops = stops.map((stop, i) => mix(stop, tint, i === 0 ? 0.12 : 0.06))
  }

  return { stops, glow }
}

export function shouldShowRainbow(category: WeatherCategory, minutesSinceLastRain: number | null): boolean {
  if (category !== "clear") return false
  if (minutesSinceLastRain === null) return false
  return minutesSinceLastRain * 60 * 1000 <= RAINBOW_WINDOW_MS
}
