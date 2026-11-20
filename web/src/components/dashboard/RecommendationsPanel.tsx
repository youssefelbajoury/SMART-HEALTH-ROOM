"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { ClipboardList, CheckCircle2 } from "lucide-react"
import { useSensorStore } from "@/store/sensor-store"
import { generateInsights, type InsightSeverity } from "@/lib/recommendations"
import { EmptyState } from "@/components/ui/empty-state"

const SEVERITY_DOT: Record<InsightSeverity, string> = {
  info: "bg-sky-400",
  warning: "bg-orange-400",
  critical: "bg-red-400",
}

export function RecommendationsPanel() {
  const data = useSensorStore((state) => state.data)
  const history = useSensorStore((state) => state.history)
  const insights = useMemo(() => generateInsights(data, history).filter((i) => i.type === "recommendation"), [data, history])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-glass p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 day:text-sky-600 flex items-center justify-center">
          <ClipboardList className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 day:text-slate-800">Recommendations</h3>
      </div>

      {insights.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="All conditions are normal" />
      ) : (
        <ul className="space-y-2.5">
          {insights.map((insight) => (
            <li key={insight.id} className="flex items-start gap-2.5 text-sm">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[insight.severity]}`} />
              <span className="text-slate-300 day:text-slate-600">{insight.message}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
