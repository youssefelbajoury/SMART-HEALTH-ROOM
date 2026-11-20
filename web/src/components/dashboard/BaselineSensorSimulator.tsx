"use client"

import { useEffect } from "react"
import { useSensorStore } from "@/store/sensor-store"
import { useDemoStore } from "@/store/demoStore"
import { clamp, isInvalidTemperature, isInvalidHumidity, SIM_TEMP_RANGE, SIM_HUMIDITY_RANGE } from "@/lib/sensorFallback"

// Flip to false to hard-disable the baseline simulation regardless of
// hardware/demo state (e.g. once real sensors are permanently online).
const SIMULATION_ENABLED = true

// Ticks every 5-10s per spec; smooth, small steps so consecutive readings
// never jump (e.g. 24.6 -> 24.8 -> 24.7, not 24.6 -> 27.1).
const TICK_MS = 8_000
const TEMP_STEP = 0.15
const HUMIDITY_STEP = 0.35

/**
 * Mounted once in the dashboard shell. Provides smooth, realistic
 * temperature/humidity readings whenever there is no live hardware feed
 * (socket disconnected) OR the feed is live but the temperature/humidity
 * values themselves are invalid (NaN/out of any plausible range) — and
 * Demo Mode isn't already driving the data. Steps aside automatically the
 * moment a real, valid reading arrives, so the dashboard never sits flat
 * at its initial defaults or displays garbage values.
 */
export function BaselineSensorSimulator() {
  const socketConnected = useSensorStore((state) => state.socketConnected)
  const temperature = useSensorStore((state) => state.data.temperature)
  const humidity = useSensorStore((state) => state.data.humidity)
  const demoEnabled = useDemoStore((state) => state.enabled)

  const dataInvalid = isInvalidTemperature(temperature) || isInvalidHumidity(humidity)
  const active = SIMULATION_ENABLED && (!socketConnected || dataInvalid) && !demoEnabled

  useEffect(() => {
    if (!active) return

    const interval = setInterval(() => {
      const current = useSensorStore.getState().data
      const validTemp = !isInvalidTemperature(current.temperature)
      const validHumidity = !isInvalidHumidity(current.humidity)
      const baseTemp = validTemp ? current.temperature : 24
      const baseHumidity = validHumidity ? current.humidity : 50
      useSensorStore.getState().updateData({
        temperature: clamp(baseTemp + (Math.random() * 2 - 1) * TEMP_STEP, SIM_TEMP_RANGE),
        humidity: clamp(baseHumidity + (Math.random() * 2 - 1) * HUMIDITY_STEP, SIM_HUMIDITY_RANGE),
      })
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [active])

  return null
}
