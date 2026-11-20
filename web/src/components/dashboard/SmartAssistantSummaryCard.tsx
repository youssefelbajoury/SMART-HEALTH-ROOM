"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, HeartPulse, Gauge, Users } from "lucide-react"
import { useWeatherStore } from "@/store/weatherStore"
import { useSmartAssistant } from "@/hooks/useSmartAssistant"

export function SmartAssistantSummaryCard() {
  const { context, recommendations, summarySentences } = useSmartAssistant()
  const fetchWeather = useWeatherStore((state) => state.fetchWeather)
  const startAutoRefresh = useWeatherStore((state) => state.startAutoRefresh)

  useEffect(() => {
    fetchWeather()
    startAutoRefresh()
  }, [fetchWeather, startAutoRefresh])

  const hasCritical = recommendations.some((r) => r.severity === "critical")
  const [greeting, ...rest] = summarySentences

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: [0, -6, 0] }}
      transition={{ opacity: { duration: 0.4 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
      className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 shadow-lg backdrop-blur-md ${
        hasCritical
          ? "border-red-500/30 bg-red-500/10 shadow-red-950/10 day:border-red-200 day:bg-red-50/80"
          : "border-sky-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-sky-950/40 shadow-sky-950/20 day:border-sky-100 day:from-white/90 day:via-white/85 day:to-sky-50/80"
      }`}
    >
      <div className="relative flex items-start gap-4 sm:gap-6">
        <div
          className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${
            hasCritical ? "bg-red-500/20 text-red-400" : "bg-sky-500/15 text-sky-400 day:text-sky-600"
          }`}
        >
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 day:text-slate-500 mb-1.5">Smart Health Assistant</h2>
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-white day:text-slate-900">{greeting}</p>
          <p className="mt-2 text-sm sm:text-base text-slate-300 day:text-slate-600 leading-relaxed max-w-2xl">{rest.join(" ")}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300 day:bg-slate-100 day:text-slate-600">
              <HeartPulse className="w-3.5 h-3.5" /> Health {context.healthScore.score}/100
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300 day:bg-slate-100 day:text-slate-600">
              <Gauge className="w-3.5 h-3.5" /> Room Quality {context.roomQuality.overall}%
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300 day:bg-slate-100 day:text-slate-600">
              <Users className="w-3.5 h-3.5" /> {context.presence ? "Patient Present" : "Room Unoccupied"}
            </span>
          </div>
        </div>

        {/* Decorative centerpiece glow — fills the wide-screen whitespace and
            reinforces this card as the dashboard's visual anchor. */}
        <motion.div
          aria-hidden="true"
          className="hidden lg:flex shrink-0 w-24 h-24 rounded-full items-center justify-center"
          style={{
            background: hasCritical
              ? "radial-gradient(circle, rgba(248,113,113,0.25), transparent 70%)"
              : "radial-gradient(circle, rgba(56,189,248,0.25), transparent 70%)",
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <HeartPulse className={`w-10 h-10 ${hasCritical ? "text-red-400/70" : "text-sky-400/70 day:text-sky-500/60"}`} />
        </motion.div>
      </div>
    </motion.div>
  )
}
