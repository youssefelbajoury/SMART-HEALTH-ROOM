"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSensorStore, type StatusLevel } from "@/store/sensor-store"
import { DoorAnimation } from "@/components/dashboard/DoorAnimation"
import { formatTemperature, formatPercent, formatPpm, formatLux } from "@/lib/format"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { useSettingsStore } from "@/store/settingsStore"
import {
  Thermometer,
  Droplets,
  Wind,
  BedDouble,
  DoorClosed,
  DoorOpen,
  Sun,
  Lightbulb,
  Palette,
  Volume1,
  X,
  Wifi,
  LucideIcon,
} from "lucide-react"

interface RoomNode {
  id: string
  label: string
  icon: LucideIcon
  top: string
  left: string
  status: StatusLevel
  value: string
  description: string
}

const statusDot: Record<StatusLevel, string> = {
  fine: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-500",
}

const statusRing: Record<StatusLevel, string> = {
  fine: "ring-emerald-500/40 border-emerald-500/40 text-emerald-300",
  warning: "ring-amber-500/40 border-amber-500/40 text-amber-300",
  danger: "ring-red-500/50 border-red-500/50 text-red-300",
}

const statusGlow: Record<StatusLevel, string> = {
  fine: "rgba(52,211,153,0.35)",
  warning: "rgba(251,191,36,0.45)",
  danger: "rgba(239,68,68,0.55)",
}

export default function RoomMapPage() {
  const { data, getTemperatureStatus, getHumidityStatus, getGasStatus, getSoundStatus, getLightStatus } = useSensorStore()
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit)
  const [selected, setSelected] = useState<RoomNode | null>(null)
  useEscapeKey(() => setSelected(null), !!selected)

  const doorOpen = data.servo === "ouvert"
  const rgb = data.rgb ?? { r: 0, g: 255, b: 0 }

  const nodes: RoomNode[] = [
    {
      id: "temperature",
      label: "Temperature",
      icon: Thermometer,
      top: "16%",
      left: "50%",
      status: getTemperatureStatus(data.temperature).level,
      value: formatTemperature(data.temperature, temperatureUnit),
      description: "DHT11 sensor — ambient room temperature.",
    },
    {
      id: "humidity",
      label: "Humidity",
      icon: Droplets,
      top: "16%",
      left: "62%",
      status: getHumidityStatus(data.humidity).level,
      value: formatPercent(data.humidity),
      description: "DHT11 sensor — air humidity level.",
    },
    {
      id: "gas",
      label: "Air Quality (Gas)",
      icon: Wind,
      top: "16%",
      left: "38%",
      status: getGasStatus(data.airQuality).level,
      value: formatPpm(data.airQuality),
      description: "MQ4 sensor — gas detection and air quality.",
    },
    {
      id: "sound",
      label: "Sound Level",
      icon: Volume1,
      top: "50%",
      left: "12%",
      status: getSoundStatus(data.soundLevel).level,
      value: data.soundLevel === 1 ? "Detected" : "Silent",
      description: "SY-M213 sensor — noise detection in the room.",
    },
    {
      id: "ldr",
      label: "Light Level (LDR)",
      icon: Sun,
      top: "20%",
      left: "88%",
      status: getLightStatus(data.light ?? 500).level,
      value: formatLux(data.light ?? 500),
      description: "Photoresistor — ambient light level, drives Day/Night mode.",
    },
    {
      id: "pressure",
      label: "Pressure Sensor (bed)",
      icon: BedDouble,
      top: "68%",
      left: "78%",
      status: "fine",
      value: (data.pressure ?? 0) > 500 ? "Occupied" : "Free",
      description: "FSR sensor — detects presence on the bed for sleep tracking.",
    },
    {
      id: "servo",
      label: doorOpen ? "Door (open)" : "Door (closed)",
      icon: doorOpen ? DoorOpen : DoorClosed,
      top: "50%",
      left: "6%",
      status: "fine",
      value: doorOpen ? "Open" : "Closed",
      description: "Servo motor controlling room access after RFID authentication.",
    },
    {
      id: "rgb",
      label: "RGB LED",
      icon: Palette,
      top: "38%",
      left: "6%",
      status: "fine",
      value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      description: "Visual system status indicator (green = normal, red = emergency).",
    },
    {
      id: "buzzer",
      label: "Buzzer",
      icon: Lightbulb,
      top: "62%",
      left: "6%",
      status: data.buzzer ? "warning" : "fine",
      value: data.buzzer ? "Active" : "Inactive",
      description: "Sound alert triggered automatically in case of emergency.",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">Room Map</h1>
        <p className="text-slate-400 day:text-slate-500 mt-1">Live position and status of every sensor — click for details</p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-400 day:text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Normal</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Warning</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Emergency</span>
      </div>

      <div
        className="relative w-full aspect-16/10 rounded-3xl border-2 border-slate-800 bg-slate-900/75 backdrop-blur-md day:border-slate-200 day:bg-slate-50/90 overflow-hidden shadow-2xl shadow-black/40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "8% 10%",
        }}
      >
        {/* Ambient vignette for a premium, cinematic feel */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,6,23,0.55)_100%)] day:bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(148,163,184,0.15)_100%)]" />

        {/* Bed */}
        <div className="absolute top-[58%] left-[68%] w-[26%] h-[30%] rounded-2xl border-2 border-slate-700 bg-slate-800/50 day:border-slate-300 day:bg-slate-200/60 flex items-center justify-center shadow-inner">
          <BedDouble className="w-8 h-8 text-slate-600 day:text-slate-400" />
        </div>

        {/* Night stand */}
        <div className="absolute top-[58%] left-[92%] -translate-x-1/2 w-[8%] h-[10%] rounded-lg border border-slate-700 bg-slate-800/50 day:border-slate-300 day:bg-slate-200/60" />

        {/* Desk */}
        <div className="absolute top-[8%] left-[6%] w-[16%] h-[14%] rounded-xl border border-slate-700 bg-slate-800/40 day:border-slate-300 day:bg-slate-200/50" />

        {/* Wardrobe */}
        <div className="absolute top-[78%] left-[8%] w-[14%] h-[16%] rounded-xl border border-slate-700 bg-slate-800/40 day:border-slate-300 day:bg-slate-200/50 flex items-center justify-center">
          <div className="w-px h-[70%] bg-slate-700 day:bg-slate-300" />
        </div>

        {/* Window on the back wall */}
        <div className="absolute top-0 left-[42%] w-[18%] h-1.5 rounded-b-full bg-gradient-to-b from-sky-400/40 to-transparent day:from-sky-400/60" />

        {/* Door opening on the wall */}
        <div className="absolute top-[42%] left-0 w-1 h-[16%] bg-slate-950 day:bg-slate-200" />

        {nodes.map((node) => {
          const Icon = node.icon
          const glow = statusGlow[node.status]
          return (
            <motion.button
              key={node.id}
              onClick={() => setSelected(node)}
              style={{ top: node.top, left: node.left }}
              aria-label={`${node.label}: ${node.status === "fine" ? "normal" : node.status}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              whileHover={{ scale: 1.14 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Persistent glow/pulse — always on, more pronounced for warning/danger */}
              <motion.span
                className={`absolute inset-0 rounded-full ${statusDot[node.status]}`}
                animate={{
                  scale: node.status === "fine" ? [1, 1.5, 1] : [1, 1.9, 1],
                  opacity: node.status === "fine" ? [0.25, 0, 0.25] : [0.5, 0, 0.5],
                }}
                transition={{ duration: node.status === "fine" ? 2.6 : 1.6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Live connection indicator */}
              <span className="absolute -top-1.5 -left-1.5 flex items-center justify-center">
                <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 day:ring-white" />
              </span>

              <div
                className={`relative w-12 h-12 rounded-2xl border bg-slate-900 day:bg-white flex items-center justify-center ring-2 transition-shadow duration-300 group-hover:shadow-lg ${statusRing[node.status]}`}
                style={{ boxShadow: `0 0 0 1px transparent, 0 0 18px ${glow}` }}
              >
                <Icon className="w-5 h-5" />
                <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${statusDot[node.status]} ring-2 ring-slate-950 day:ring-white`} />
              </div>

              <span className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950/80 day:bg-white/90 text-[11px] font-medium text-slate-300 day:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                {node.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={selected.label}
              className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-sm p-6 day:bg-white day:border-slate-100 day:shadow-xl"
            >
              <button onClick={() => setSelected(null)} aria-label="Close" className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 day:hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
              <div className={`w-12 h-12 rounded-xl border ring-2 flex items-center justify-center mb-4 ${statusRing[selected.status]}`}>
                <selected.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white day:text-slate-900 mb-1">{selected.label}</h3>
              <p className="text-sm text-slate-400 day:text-slate-500 mb-4">{selected.description}</p>
              {selected.id === "servo" && (
                <div className="flex justify-center mb-4">
                  <DoorAnimation open={doorOpen} size="sm" />
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-800 day:bg-slate-50 day:border-slate-200">
                <span className="text-xs text-slate-500">Current Value</span>
                <span className="font-mono font-semibold text-white day:text-slate-900">{selected.value}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
