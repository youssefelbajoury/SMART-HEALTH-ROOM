"use client"

import { useEffect, useRef } from "react"
import { useDemoStore } from "@/store/demoStore"
import { useSensorStore } from "@/store/sensor-store"
import { useAlertStore } from "@/store/alertStore"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useToastStore } from "@/store/toastStore"

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

/**
 * Mounted once in the dashboard shell. Renders nothing — while Demo Mode is
 * enabled it periodically writes synthetic readings into the same stores the
 * real WebSocket feed writes into, so every dashboard page updates exactly as
 * it would with real hardware attached, with no backend/device dependency.
 */
export function DemoSimulator() {
  const enabled = useDemoStore((state) => state.enabled)
  const announced = useRef(false)

  useEffect(() => {
    if (!enabled) {
      announced.current = false
      return
    }

    if (!announced.current) {
      announced.current = true
      useToastStore.getState().addToast({
        type: "warning",
        title: "Demo Mode Enabled",
        message: "All sensor data, alerts and emergencies shown below are simulated.",
      })
    }

    let tick = 0
    const interval = setInterval(() => {
      // The guided sequence (DemoSequencer) drives the same stores
      // deterministically — don't let this random-noise tick fight it.
      if (useDemoStore.getState().sequenceActive) return

      tick += 1
      const sensorStore = useSensorStore.getState()
      const current = sensorStore.data

      const temperature = clamp((current.temperature ?? 22) + rand(-0.4, 0.4), 18, 33)
      const humidity = clamp((current.humidity ?? 45) + rand(-1.5, 1.5), 30, 70)
      const airQuality = clamp((current.airQuality ?? 300) + rand(-15, 15), 200, 500)
      const soundLevel = Math.random() > 0.85 ? 1 : 0
      const light = clamp((current.light ?? 500) + rand(-25, 25), 100, 900)
      const pressure = Math.random() > 0.75 ? rand(520, 700) : rand(0, 100)

      sensorStore.updateData({
        temperature,
        humidity,
        airQuality,
        soundLevel,
        light,
        pressure,
        lightStatus: light >= 500 ? "jour" : "nuit",
        motion: Math.random() > 0.6,
        lamp: current.lamp ?? false,
        servo: current.servo ?? "fermé",
        rgb: current.rgb ?? { r: 0, g: 255, b: 0 },
        buzzer: false,
      })

      // Occasional simulated alert
      if (tick % 6 === 0 && Math.random() > 0.6) {
        useAlertStore.getState().addAlert({
          id: `demo-alert-${Date.now()}`,
          type: temperature > 28 ? "warning" : "info",
          message: `Demo: Temperature reading ${temperature.toFixed(1)}°C`,
          sensor: "DHT11",
          value: Number(temperature.toFixed(1)),
          timestamp: new Date(),
          read: false,
        })
      }

      // Rare simulated emergency, auto-resolved after a few seconds.
      // Demo-only simplification: this resolves whatever emergency is active,
      // which is safe as long as Demo Mode isn't run alongside a real live device.
      if (tick % 15 === 0 && Math.random() > 0.7) {
        useEmergencyStore.getState().activate({
          id: `demo-emergency-${Date.now()}`,
          level: "danger",
          status: "active",
          message: "Demo: Critical temperature and air quality levels detected",
          triggeredSensors: [
            { sensor: "DHT11", value: Math.round(temperature), threshold: 30 },
            { sensor: "MQ4", value: Math.round(airQuality), threshold: 400 },
          ],
          buzzerActive: true,
          emailSent: true,
          createdAt: new Date(),
        })
        setTimeout(() => {
          if (useDemoStore.getState().enabled) {
            useEmergencyStore.getState().resolveActive()
          }
        }, 8000)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [enabled])

  return null
}
