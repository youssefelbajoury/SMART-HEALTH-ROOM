"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Lightbulb, CheckCircle2 } from "lucide-react"
import { useSensorStore } from "@/store/sensor-store"
import { generateInsights, type InsightSeverity } from "@/lib/recommendations"
import { EmptyState } from "@/components/ui/empty-state"

const SEVERITY_BADGE: Record<InsightSeverity, string> = {
  info: "bg-sky-500/15 text-sky-400 day:text-sky-600",
  warning: "bg-orange-500/15 text-orange-400 day:text-orange-600",
  critical: "bg-red-500/15 text-red-400 day:text-red-600",
}

export function SmartSuggestionsPanel() {
  const data = useSensorStore((state) => state.data)
  const history = useSensorStore((state) => state.history)
  const insights = useMemo(() => generateInsights(data, history).filter((i) => i.type === "suggestion"), [data, history])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="dash-glass p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 day:text-violet-600 flex items-center justify-center">
          <Lightbulb className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 day:text-slate-800">Smart Suggestions</h3>
      </div>

      {insights.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No action needed right now" />
      ) : (
        <ul className="space-y-2">
          {insights.map((insight) => (
            <li key={insight.id} className={`px-3 py-2 rounded-xl text-sm font-medium ${SEVERITY_BADGE[insight.severity]}`}>
              {insight.message}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
