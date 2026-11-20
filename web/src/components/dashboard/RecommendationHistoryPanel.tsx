"use client"

import { motion } from "framer-motion"
import { History, Inbox } from "lucide-react"
import { useRecommendationHistoryStore } from "@/store/recommendationHistoryStore"
import { EmptyState } from "@/components/ui/empty-state"

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-sky-400",
  warning: "bg-orange-400",
  critical: "bg-red-400",
}

export function RecommendationHistoryPanel() {
  const entries = useRecommendationHistoryStore((state) => state.entries)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-glass p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 day:text-slate-500 flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 day:text-slate-800">Recommendation History</h3>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={Inbox} title="No recommendations recorded yet" />
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-2.5 text-sm px-1">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[entry.severity] ?? "bg-slate-500"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-slate-300 day:text-slate-600 truncate">{entry.message}</p>
                <p className="text-[11px] text-slate-500 capitalize">
                  {entry.category} · {new Date(entry.timestamp).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
