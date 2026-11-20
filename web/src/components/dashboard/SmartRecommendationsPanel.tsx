"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, CheckCircle2, ChevronDown } from "lucide-react"
import { useSmartAssistant } from "@/hooks/useSmartAssistant"
import { useRecommendationHistoryStore } from "@/store/recommendationHistoryStore"
import { useToastStore } from "@/store/toastStore"
import { EmptyState } from "@/components/ui/empty-state"
import type { AssistantSeverity } from "@/lib/smartAssistant"

const SEVERITY_TOAST: Record<AssistantSeverity, "info" | "warning" | "error"> = {
  info: "info",
  warning: "warning",
  critical: "error",
}

const SEVERITY_BADGE: Record<AssistantSeverity, string> = {
  info: "bg-sky-500/15 text-sky-400 day:text-sky-600",
  warning: "bg-orange-500/15 text-orange-400 day:text-orange-600",
  critical: "bg-red-500/15 text-red-400 day:text-red-600",
}

const SEVERITY_DOT: Record<AssistantSeverity, string> = {
  info: "bg-sky-400",
  warning: "bg-orange-400",
  critical: "bg-red-400",
}

export function SmartRecommendationsPanel() {
  const { recommendations } = useSmartAssistant()
  const record = useRecommendationHistoryStore((state) => state.record)
  const addToast = useToastStore((state) => state.addToast)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Recommendation Synchronization (item 5): the Smart Assistant engine
  // (lib/smartAssistant.ts) is the only source of truth — this effect just
  // mirrors whatever it produces into the persisted history and surfaces a
  // toast for genuinely new recommendations (deduped by id, so re-renders
  // with the same recommendations never re-toast).
  useEffect(() => {
    if (recommendations.length === 0) return
    const knownIds = new Set(useRecommendationHistoryStore.getState().entries.map((e) => e.id))
    record(recommendations)
    for (const rec of recommendations) {
      if (knownIds.has(rec.id)) continue
      addToast({ type: SEVERITY_TOAST[rec.severity], title: "Recommendation Updated", message: rec.message })
    }
  }, [recommendations, record, addToast])

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-glass p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 day:text-emerald-600 flex items-center justify-center">
          <Brain className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 day:text-slate-800">Smart Daily Recommendations</h3>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Everything looks good right now" />
      ) : (
        <ul className="space-y-2">
          {recommendations.map((rec) => {
            const isOpen = expanded.has(rec.id)
            return (
              <li key={rec.id} className="rounded-xl bg-slate-800/40 day:bg-slate-50 overflow-hidden">
                <button onClick={() => toggle(rec.id)} className="w-full flex items-start gap-2.5 text-left px-3 py-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[rec.severity]}`} />
                  <span className="flex-1 text-sm text-slate-300 day:text-slate-600">{rec.message}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${SEVERITY_BADGE[rec.severity]}`}>{rec.severity}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 pl-7">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Why?</p>
                        <ul className="space-y-1 mb-2">
                          {rec.reasons.map((reason, i) => (
                            <li key={i} className="text-xs text-slate-400 day:text-slate-500 flex gap-1.5">
                              <span>•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] text-slate-500">
                          Rule Confidence: <span className="font-semibold text-slate-300 day:text-slate-700">{rec.confidence}%</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      )}
    </motion.div>
  )
}
