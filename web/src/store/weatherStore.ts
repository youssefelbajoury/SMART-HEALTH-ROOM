import { create } from "zustand"
import { fetchOutdoorWeather, fetchOutdoorAirQuality, type WeatherReading, type AirQualityReading } from "@/lib/weather"

// Tunisia (project's default deployment region) — used only if the browser
// declines geolocation permission.
const DEFAULT_COORDS = { lat: 36.8065, lon: 10.1815 }
const REFRESH_MS = 20 * 60 * 1000
const MIN_REFETCH_INTERVAL_MS = 60 * 1000

interface WeatherState {
  weather: WeatherReading | null
  airQuality: AirQualityReading | null
  loading: boolean
  lastFetchedAt: number | null
  autoRefreshStarted: boolean
  fetchWeather: () => Promise<void>
  startAutoRefresh: () => void
}

function resolveCoords(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
        () => resolve(DEFAULT_COORDS),
        { timeout: 5000 }
      )
    } else {
      resolve(DEFAULT_COORDS)
    }
  })
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  weather: null,
  airQuality: null,
  loading: false,
  lastFetchedAt: null,
  autoRefreshStarted: false,

  fetchWeather: async () => {
    const { loading, lastFetchedAt } = get()
    if (loading) return
    if (lastFetchedAt && Date.now() - lastFetchedAt < MIN_REFETCH_INTERVAL_MS) return

    set({ loading: true })
    const { lat, lon } = await resolveCoords()
    const [weather, airQuality] = await Promise.all([fetchOutdoorWeather(lat, lon), fetchOutdoorAirQuality(lat, lon)])
    set({ weather, airQuality, loading: false, lastFetchedAt: Date.now() })
  },

  startAutoRefresh: () => {
    if (get().autoRefreshStarted) return
    set({ autoRefreshStarted: true })
    setInterval(() => get().fetchWeather(), REFRESH_MS)
  },
}))
