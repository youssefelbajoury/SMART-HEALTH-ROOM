"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useSensorStore } from "@/store/sensor-store"
import { useWeatherStore } from "@/store/weatherStore"
import { useSettingsStore } from "@/store/settingsStore"
import { distanceFromComfort, type WeatherCategory } from "@/lib/weather"
import { COMFORT_TEMP_RANGE } from "@/lib/thresholds"
import { formatTemperature } from "@/lib/format"

const CATEGORY_ICON: Record<WeatherCategory, typeof Sun> = {
  clear: Sun,
  cloudy: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
}

export function WeatherWidget() {
  const roomTemperature = useSensorStore((state) => state.data.temperature)
  const weather = useWeatherStore((state) => state.weather)
  const loading = useWeatherStore((state) => state.loading)
  const fetchWeather = useWeatherStore((state) => state.fetchWeather)
  const startAutoRefresh = useWeatherStore((state) => state.startAutoRefresh)
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit)

  useEffect(() => {
    fetchWeather()
    startAutoRefresh()
  }, [fetchWeather, startAutoRefresh])

  const Icon = weather ? CATEGORY_ICON[weather.category] : Sun
  const roomIsBetter = weather
    ? distanceFromComfort(roomTemperature, COMFORT_TEMP_RANGE) < distanceFromComfort(weather.temperature, COMFORT_TEMP_RANGE)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: [0, -6, 0] }}
      transition={{ opacity: { duration: 0.4 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.3 } }}
      className="dash-glass p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 day:text-sky-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200 day:text-slate-800">Weather Comparison</h3>
          <p className="text-xs text-slate-500">{weather?.label ?? (loading ? "Locating…" : "Unavailable")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-3 ${roomIsBetter === false ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : "bg-slate-800/50 day:bg-slate-50"}`}>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Outside
          </p>
          <p className="text-xl font-bold text-white day:text-slate-900">{weather ? formatTemperature(weather.temperature, temperatureUnit) : "—"}</p>
          {weather && <p className="text-xs text-slate-500 mt-0.5">{weather.humidity}% humidity</p>}
        </div>
        <div className={`rounded-xl p-3 ${roomIsBetter === true ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : "bg-slate-800/50 day:bg-slate-50"}`}>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" /> Inside
          </p>
          <p className="text-xl font-bold text-white day:text-slate-900">{formatTemperature(roomTemperature, temperatureUnit)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Room sensor</p>
        </div>
      </div>

      {weather && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          {roomIsBetter ? "Room conditions are more comfortable than outside." : "Outside conditions are currently more comfortable."}
        </p>
      )}
    </motion.div>
  )
}
