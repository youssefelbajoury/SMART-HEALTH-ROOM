"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Gauge, Thermometer, Wind, ShieldCheck, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useSmartAssistant } from "@/hooks/useSmartAssistant"
import type { RoomQualityKey } from "@/lib/roomQuality"

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const SUB_INDEX: Array<{ key: RoomQualityKey; label: string; icon: LucideIcon }> = [
  { key: "comfort", label: "Comfort", icon: Thermometer },
  { key: "airQuality", label: "Air Quality", icon: Wind },
  { key: "safety", label: "Safety", icon: ShieldCheck },
  { key: "energyEfficiency", label: "Energy Efficiency", icon: Zap },
]

function bandColor(score: number): { bar: string; text: string } {
  if (score >= 80) return { bar: "bg-emerald-400", text: "text-emerald-400 day:text-emerald-600" }
  if (score >= 50) return { bar: "bg-orange-400", text: "text-orange-400 day:text-orange-600" }
  return { bar: "bg-red-400", text: "text-red-400 day:text-red-600" }
}

export function RoomQualityIndexCard() {
  const { context } = useSmartAssistant()
  const reduceMotion = useReducedMotion()
  const { roomQuality } = context
  const overallColor = bandColor(roomQuality.overall)
  const offset = CIRCUMFERENCE - (roomQuality.overall / 100) * CIRCUMFERENCE

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: [0, -6, 0] }}
      transition={{ opacity: { duration: 0.4 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 } }}
      className="dash-glass p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 day:text-violet-600 flex items-center justify-center">
          <Gauge className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 day:text-slate-800">Room Quality Index</h3>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 100 100" className="w-16 h-16 -rotate-90">
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800 day:text-slate-100" />
            <motion.circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: "easeOut" }}
              className={overallColor.text}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white day:text-slate-900">{roomQuality.overall}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">Overall score combining comfort, air quality, safety and energy efficiency.</p>
      </div>

      <div className="space-y-3">
        {SUB_INDEX.map(({ key, label, icon: Icon }) => {
          const score = roomQuality[key]
          const color = bandColor(score)
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-slate-400 day:text-slate-500">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </span>
                <span className={`font-semibold ${color.text}`}>{score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 day:bg-slate-100 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${color.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{roomQuality.explanations[key]}</p>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
