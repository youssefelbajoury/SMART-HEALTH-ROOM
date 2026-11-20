import { useEffect, useMemo, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { useDayNightTheme } from "./useDayNightTheme"
import { useWeatherStore } from "@/store/weatherStore"
import {
  getSeason,
  getSkyPeriod,
  getSceneColors,
  shouldShowRainbow,
  type SkyPeriod,
  type Season,
  type SceneColors,
} from "@/lib/backgroundScene"
import type { WeatherCategory } from "@/lib/weather"

const TICK_MS = 60 * 1000

export interface BackgroundScene {
  isDay: boolean
  period: SkyPeriod
  season: Season
  category: WeatherCategory
  colors: SceneColors
  showRainbow: boolean
  uvIndex: number
  reducedMotion: boolean
}

export function useBackgroundScene(): BackgroundScene {
  const { isDay } = useDayNightTheme()
  const weather = useWeatherStore((state) => state.weather)
  const reducedMotion = useReducedMotion() ?? false

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const category: WeatherCategory = weather?.category ?? "clear"

  // Derived-on-change state (React's documented alternative to an effect for
  // "adjust state when a prop changes"): update synchronously during render
  // instead of accessing a ref or setState-in-effect.
  const [prevCategory, setPrevCategory] = useState(category)
  const [lastRainAt, setLastRainAt] = useState<number | null>(null)
  if (category !== prevCategory) {
    setPrevCategory(category)
    if (category === "rain" || category === "storm") setLastRainAt(now.getTime())
  }

  const minutesSinceLastRain = lastRainAt === null ? null : (now.getTime() - lastRainAt) / 60000

  return useMemo(() => {
    const sunrise = weather?.sunrise ? new Date(weather.sunrise) : null
    const sunset = weather?.sunset ? new Date(weather.sunset) : null
    const period = getSkyPeriod(now, sunrise, sunset, isDay)
    const season = getSeason(now)

    return {
      isDay,
      period,
      season,
      category,
      colors: getSceneColors(period, category, season),
      showRainbow: shouldShowRainbow(category, minutesSinceLastRain),
      uvIndex: weather?.uvIndex ?? 0,
      reducedMotion,
    }
  }, [isDay, now, weather, category, minutesSinceLastRain, reducedMotion])
}
