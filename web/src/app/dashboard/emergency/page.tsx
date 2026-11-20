"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Siren, ShieldCheck, Clock, Gauge, Volume2, Mail } from "lucide-react"
import { useEmergencyStore } from "@/store/emergencyStore"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function EmergencyHistoryPage() {
  const { active, history, isLoading, fetchHistory, fetchActive, resolve } = useEmergencyStore()
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => {
    fetchActive()
    fetchHistory()
  }, [fetchActive, fetchHistory])

  const handleResolve = async (id: string) => {
    setResolvingId(id)
    try {
      await resolve(id)
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white day:text-slate-900">Emergency History</h1>
        <p className="text-slate-400 day:text-slate-500 mt-1">
          {active ? "An emergency is currently active" : "No emergency in progress"}
        </p>
      </div>

      {isLoading && history.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No emergencies recorded" description="Incident history will appear here as soon as an emergency is detected." />
      ) : (
        <div className="relative space-y-4 pl-2">
          <div className="absolute left-5.5 top-2 bottom-2 w-px bg-slate-800 day:bg-slate-200" />
          {history.map((emergency, index) => (
            <motion.div
              key={emergency.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-10"
            >
              <div
                className={`absolute left-0 top-4 w-11 h-11 rounded-xl flex items-center justify-center border-4 border-slate-950 day:border-white ${
                  emergency.status === "active" ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-500 day:bg-slate-100 day:text-slate-400"
                }`}
              >
                <Siren className="w-5 h-5" />
              </div>

              <div
                className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
                  emergency.status === "active"
                    ? "border-red-500/40 bg-red-500/5 ring-1 ring-red-500/20 day:border-red-200 day:bg-red-50/80"
                    : "dash-glass rounded-xl"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white day:text-slate-900">{emergency.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {emergency.createdAt.toLocaleString("en-US")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        Buzzer {emergency.buzzerActive ? "active" : "inactive"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email {emergency.emailSent ? "sent" : "not sent"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {emergency.triggeredSensors.map((s, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 text-xs text-slate-300 day:bg-slate-100 day:text-slate-600"
                        >
                          <Gauge className="w-3 h-3 text-red-400" />
                          {s.sensor}: {s.value} (threshold {s.threshold})
                        </span>
                      ))}
                    </div>
                  </div>

                  {emergency.status === "active" ? (
                    <button
                      onClick={() => handleResolve(emergency.id)}
                      disabled={resolvingId === emergency.id}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {resolvingId === emergency.id ? "Resolving..." : "Resolve"}
                    </button>
                  ) : (
                    <span className="flex-shrink-0 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 day:text-emerald-600 text-xs font-medium">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
