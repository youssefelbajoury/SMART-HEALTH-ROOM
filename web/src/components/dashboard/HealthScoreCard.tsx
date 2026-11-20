"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { HeartPulse } from "lucide-react"
import { useSensorStore } from "@/store/sensor-store"
import { calculateHealthScore, type HealthStatus } from "@/lib/healthScore"

const STATUS_STYLE: Record<HealthStatus, { label: string; ring: string; text: string; bg: string }> = {
  excellent: { label: "Excellent", ring: "#34d399", text: "text-emerald-400 day:text-emerald-600", bg: "bg-emerald-500/10" },
  warning: { label: "Warning", ring: "#fb923c", text: "text-orange-400 day:text-orange-600", bg: "bg-orange-500/10" },
  critical: { label: "Critical", ring: "#f87171", text: "text-red-400 day:text-red-600", bg: "bg-red-500/10" },
}

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function HealthScoreCard() {
  const data = useSensorStore((state) => state.data)
  const reduceMotion = useReducedMotion()
  const result = useMemo(() => calculateHealthScore(data), [data])
  const style = STATUS_STYLE[result.status]
  const offset = CIRCUMFERENCE - (result.score / 100) * CIRCUMFERENCE

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: [0, -6, 0] }}
      transition={{ opacity: { duration: 0.4 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
      className="dash-glass p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bg} ${style.text}`}>
          <HeartPulse className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200 day:text-slate-800">Smart Health Score</h3>
          <p className="text-xs text-slate-500">Last updated {result.lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800 day:text-slate-100" />
            <motion.circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={style.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white day:text-slate-900">{result.score}</span>
            <span className="text-[10px] text-slate-500">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>{style.label}</span>
          <div className="mt-3 space-y-1.5">
            {result.breakdown.slice(0, 4).map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 day:text-slate-500 truncate">{item.label}</span>
                <span
                  className={
                    item.level === "fine"
                      ? "text-emerald-400 day:text-emerald-600"
                      : item.level === "warning"
                        ? "text-orange-400 day:text-orange-600"
                        : "text-red-400 day:text-red-600"
                  }
                >
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
