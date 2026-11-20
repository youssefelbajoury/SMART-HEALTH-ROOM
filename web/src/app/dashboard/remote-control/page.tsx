"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useSensorStore } from "@/store/sensor-store"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useAuthStore } from "@/store/authStore"
import { useToastStore } from "@/store/toastStore"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { DoorAnimation } from "@/components/dashboard/DoorAnimation"
import {
  Lightbulb,
  Volume2,
  Palette,
  Siren,
  Info,
  Cpu,
  Wifi,
  WifiOff,
  DoorClosed,
} from "lucide-react"

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "")
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

const rgbPresets = [
  { label: "Normal", hex: "#22c55e" },
  { label: "Warning", hex: "#f59e0b" },
  { label: "Emergency", hex: "#ef4444" },
  { label: "Rest", hex: "#3b82f6" },
  { label: "Soft", hex: "#a855f7" },
  { label: "Neutral", hex: "#f8fafc" },
]

const cardClass = "dash-glass p-6 hover:-translate-y-0.5 transition-transform duration-300"

export default function RemoteControlPage() {
  const { data, socketConnected, toggleLamp, toggleDoor, toggleBuzzer, setRgb } = useSensorStore()
  const triggerTest = useEmergencyStore((state) => state.triggerTest)
  const deviceId = useAuthStore((state) => state.user?.deviceId)
  const addToast = useToastStore((state) => state.addToast)

  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  const lampOn = data.lamp ?? false
  const doorOpen = data.servo === "ouvert"
  const buzzerOn = data.buzzer ?? false
  const rgb = data.rgb ?? { r: 0, g: 255, b: 0 }
  const rgbHex = rgbToHex(rgb.r, rgb.g, rgb.b)

  const run = async (key: string, action: () => Promise<void>, label: string) => {
    setBusy(key)
    try {
      await action()
    } catch (err) {
      addToast({
        type: "error",
        title: label,
        message: err instanceof Error ? err.message : "Command failed",
      })
    } finally {
      setBusy(null)
    }
  }

  if (!deviceId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">Remote Control</h1>
          <p className="text-slate-400 day:text-slate-500 mt-1">Control the actuators of your connected room</p>
        </div>
        <EmptyState
          icon={Cpu}
          title="No device linked to your account"
          description="An administrator must first link an ESP32 to your account to enable remote control."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">Remote Control</h1>
        <p className="text-slate-400 day:text-slate-500 mt-1">Control the actuators of your connected room</p>
      </motion.div>

      {/* Honesty banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 day:border-sky-200 day:bg-sky-50">
        <Info className="w-5 h-5 text-sky-400 day:text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-sky-200/80 day:text-sky-700">
          These commands send a real signal to the server and are broadcast live over WebSocket.
          Physical actuation (lamp, servo, buzzer, LED) requires the ESP32 firmware to listen for these
          events — a hardware update to be added separately.
        </p>
      </div>

      {/* Device status */}
      <div className="dash-glass p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 day:bg-slate-100 flex items-center justify-center text-slate-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white day:text-slate-900">{deviceId}</p>
              <p className="text-xs text-slate-500">Device linked to your account</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
            socketConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {socketConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {socketConnected ? "Online" : "Offline"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lamp */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${lampOn ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-800 text-slate-500 day:bg-slate-100 day:text-slate-400"}`}>
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-white day:text-slate-900">Lamp</p>
                <p className="text-xs text-slate-500">{lampOn ? "On" : "Off"}</p>
              </div>
            </div>
            <Switch checked={lampOn} disabled={busy === "lamp"} activeColor="#eab308" onChange={() => run("lamp", toggleLamp, "Lamp")} />
          </div>
        </motion.div>

        {/* Door */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${doorOpen ? "bg-sky-500/20 text-sky-400" : "bg-slate-800 text-slate-500 day:bg-slate-100 day:text-slate-400"}`}>
                <DoorClosed className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-white day:text-slate-900">Door</p>
                <p className="text-xs text-slate-500">{doorOpen ? "Open" : "Closed"}</p>
              </div>
            </div>
            <Switch checked={doorOpen} disabled={busy === "door"} activeColor="#0ea5e9" onChange={() => run("door", toggleDoor, "Door")} />
          </div>
          <div className="flex justify-center pt-2 border-t border-slate-800/60 day:border-slate-100">
            <DoorAnimation open={doorOpen} />
          </div>
        </motion.div>

        {/* Buzzer */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${buzzerOn ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-500 day:bg-slate-100 day:text-slate-400"}`}>
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-white day:text-slate-900">Buzzer</p>
                <p className="text-xs text-slate-500">{buzzerOn ? "Active" : "Inactive"}</p>
              </div>
            </div>
            <Switch checked={buzzerOn} disabled={busy === "buzzer"} activeColor="#ef4444" onChange={() => run("buzzer", toggleBuzzer, "Buzzer")} />
          </div>
        </motion.div>

        {/* RGB */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: `${rgbHex}33`, color: rgbHex }}
              >
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-white day:text-slate-900">RGB LED</p>
                <p className="text-xs text-slate-500 font-mono">rgb({rgb.r}, {rgb.g}, {rgb.b})</p>
              </div>
            </div>
            <label className="relative w-10 h-10 rounded-lg border border-slate-700 day:border-slate-200 cursor-pointer overflow-hidden shadow-inner">
              <span className="absolute inset-0" style={{ backgroundColor: rgbHex }} />
              <input
                type="color"
                value={rgbHex}
                disabled={busy === "rgb"}
                onChange={(e) => run("rgb", () => setRgb(hexToRgb(e.target.value)), "RGB LED")}
                aria-label="RGB LED color picker"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {rgbPresets.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                title={preset.label}
                disabled={busy === "rgb"}
                onClick={() => run("rgb", () => setRgb(hexToRgb(preset.hex)), "RGB LED")}
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${
                  rgbHex.toLowerCase() === preset.hex ? "border-white day:border-slate-900 shadow-lg" : "border-transparent"
                }`}
                style={{ backgroundColor: preset.hex }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Emergency test trigger */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-red-500/20 bg-red-500/5 day:border-red-200 day:bg-red-50 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-11 h-11 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center"
              animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Siren className="w-5 h-5" />
            </motion.div>
            <div>
              <p className="font-medium text-white day:text-slate-900">Activate Emergency Mode (test)</p>
              <p className="text-xs text-slate-500 max-w-md">
                Sends synthetic critical readings to the real evaluation pipeline — triggers an actual emergency for demonstration.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEmergencyDialogOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-medium transition-all hover:-translate-y-0.5 active:scale-95 shadow-md shadow-red-950/30"
          >
            Trigger
          </button>
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={emergencyDialogOpen}
        onClose={() => setEmergencyDialogOpen(false)}
        onConfirm={() => run("emergency", triggerTest, "Emergency")}
        title="Trigger a test emergency?"
        description="This will create a real incident in the history, activate the emergency banner, and send an email if configured."
        icon={Siren}
        confirmLabel="Trigger"
        variant="danger"
      />
    </div>
  )
}
