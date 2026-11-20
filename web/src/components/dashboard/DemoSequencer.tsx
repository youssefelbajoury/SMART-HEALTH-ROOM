"use client"

import { useEffect, useRef } from "react"
import { useDemoStore, type DemoStage } from "@/store/demoStore"
import { useSensorStore, type SensorData } from "@/store/sensor-store"
import { useAlertStore } from "@/store/alertStore"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useToastStore } from "@/store/toastStore"

const STAGE_DURATION_MS = 5000

type DemoReading = Omit<SensorData, "timestamp" | "alert" | "sleepScore">

const NORMAL_READING: DemoReading = {
  temperature: 22,
  humidity: 45,
  airQuality: 280,
  gas: 280,
  soundLevel: 0,
  light: 650,
  pressure: 0,
  lightStatus: "jour",
  motion: false,
  lamp: false,
  servo: "fermé",
  rgb: { r: 0, g: 255, b: 0 },
  buzzer: false,
}

const WARNING_READING: DemoReading = { ...NORMAL_READING, temperature: 31, humidity: 72, airQuality: 430, gas: 430, pressure: 520 }
const DANGER_READING: DemoReading = { ...NORMAL_READING, temperature: 36, humidity: 82, airQuality: 620, gas: 620, pressure: 520, rgb: { r: 255, g: 0, b: 0 } }

// Deterministic, scripted version of DemoSimulator's random noise — calls the
// exact same store actions (sensorStore.updateData, alertStore.addAlert,
// emergencyStore.activate/resolveActive, toastStore.addToast) in a fixed
// order instead of Math.random()-gated, so every guided demo run tells the
// same story: welcome -> normal -> live updates -> warning -> emergency ->
// notifications -> recommendation -> analytics -> health report -> recovery -> finish.
function runStage(stage: DemoStage) {
  const sensorStore = useSensorStore.getState()
  const addToast = useToastStore.getState().addToast

  switch (stage) {
    case "welcome":
      addToast({ type: "info", title: "Demo Started", message: "Walking through a full Smart Health Room scenario." })
      sensorStore.updateData(NORMAL_READING)
      break
    case "normal":
      sensorStore.updateData(NORMAL_READING)
      addToast({ type: "success", title: "Normal Conditions", message: "The room is currently comfortable and safe." })
      break
    case "sensor-updates":
      sensorStore.updateData({ ...NORMAL_READING, temperature: 23.4, humidity: 47 })
      addToast({ type: "info", title: "Live Sensor Update", message: "Sensor readings refresh continuously in real time." })
      break
    case "warning":
      sensorStore.updateData(WARNING_READING)
      useAlertStore.getState().addAlert({
        id: `demo-alert-${Date.now()}`,
        type: "warning",
        message: "Demo: Temperature and humidity trending high",
        sensor: "DHT11",
        value: WARNING_READING.temperature,
        timestamp: new Date(),
        read: false,
      })
      break
    case "emergency":
      sensorStore.updateData(DANGER_READING)
      useEmergencyStore.getState().activate({
        id: `demo-emergency-${Date.now()}`,
        level: "danger",
        status: "active",
        message: "Demo: Critical temperature and air quality levels detected",
        triggeredSensors: [
          { sensor: "DHT11", value: DANGER_READING.temperature, threshold: 30 },
          { sensor: "MQ4", value: DANGER_READING.airQuality, threshold: 400 },
        ],
        buzzerActive: true,
        emailSent: true,
        createdAt: new Date(),
      })
      break
    case "notifications":
      addToast({ type: "error", title: "Emergency Notification", message: "This is how a critical alert appears in the Notification Center." })
      break
    case "recommendation":
      addToast({ type: "info", title: "Smart Recommendation", message: "The AI Assistant now recommends ventilating the room." })
      break
    case "analytics":
      addToast({ type: "info", title: "Analytics", message: "This event is now reflected in your Analytics trends." })
      break
    case "health-report":
      addToast({ type: "info", title: "Health Report", message: "A full PDF report can be exported anytime from Analytics." })
      break
    case "recovery":
      useEmergencyStore.getState().resolveActive()
      sensorStore.updateData(NORMAL_READING)
      addToast({ type: "success", title: "Recovered", message: "Conditions have returned to normal." })
      break
    case "finished":
      addToast({ type: "success", title: "Demo Complete", message: "You've seen the full Smart Health Room experience." })
      break
  }
}

/**
 * Mounted once in the dashboard shell, alongside DemoSimulator. Renders
 * nothing — drives a fixed-order walkthrough while a guided sequence is
 * active. Pausing clears the pending stage-advance timer; resuming restarts
 * the current stage's full duration rather than a precise remaining time,
 * which is an acceptable simplification for a demo feature.
 */
export function DemoSequencer() {
  const sequenceActive = useDemoStore((state) => state.sequenceActive)
  const isPaused = useDemoStore((state) => state.isPaused)
  const stage = useDemoStore((state) => state.stage)
  const advanceStage = useDemoStore((state) => state.advanceStage)
  const ranStageRef = useRef<DemoStage | null>(null)

  useEffect(() => {
    if (!sequenceActive) {
      ranStageRef.current = null
    }
  }, [sequenceActive])

  useEffect(() => {
    if (!sequenceActive || isPaused) return

    if (ranStageRef.current !== stage) {
      ranStageRef.current = stage
      runStage(stage)
    }

    if (stage === "finished") return
    const timer = setTimeout(() => advanceStage(), STAGE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [sequenceActive, isPaused, stage, advanceStage])

  return null
}
