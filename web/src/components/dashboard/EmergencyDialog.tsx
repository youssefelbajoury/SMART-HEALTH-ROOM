"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Siren, Mail, Volume2, Gauge } from "lucide-react"
import { useEmergencyStore } from "@/store/emergencyStore"
import { useEscapeKey } from "@/hooks/useEscapeKey"

interface EmergencyDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function EmergencyDialog({ isOpen, onClose }: EmergencyDialogProps) {
  const active = useEmergencyStore((state) => state.active)
  const resolve = useEmergencyStore((state) => state.resolve)
  const [resolving, setResolving] = useState(false)
  useEscapeKey(onClose, isOpen)

  if (!active) return null

  const handleResolve = async () => {
    setResolving(true)
    try {
      await resolve(active.id)
      onClose()
    } finally {
      setResolving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="emergency-dialog-title"
            className="bg-slate-900 rounded-2xl border border-red-500/20 shadow-xl shadow-red-950/30 w-full max-w-md overflow-hidden day:bg-white day:border-red-200 day:shadow-red-100"
          >
            <div className="p-6 border-b border-slate-800 day:border-red-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                  <Siren className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="emergency-dialog-title" className="font-bold text-white day:text-slate-900">Emergency Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {active.createdAt.toLocaleString("en-US")}
                  </p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" autoFocus className="text-slate-500 hover:text-slate-300 day:hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300 day:text-slate-700">{active.message}</p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Triggered Sensors</p>
                {active.triggeredSensors.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-800 day:bg-slate-50 day:border-slate-200"
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-300 day:text-slate-700">
                      <Gauge className="w-3.5 h-3.5 text-red-400" />
                      {s.sensor}
                    </span>
                    <span className="text-sm font-mono text-red-300">
                      {s.value} <span className="text-slate-500">/ threshold {s.threshold}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Volume2 className={`w-3.5 h-3.5 ${active.buzzerActive ? "text-red-400" : "text-slate-600"}`} />
                  Buzzer {active.buzzerActive ? "active" : "inactive"}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className={`w-3.5 h-3.5 ${active.emailSent ? "text-emerald-400" : "text-slate-600"}`} />
                  Email {active.emailSent ? "sent" : "not sent"}
                </span>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={onClose}
                disabled={resolving}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 day:bg-slate-100 day:text-slate-600 day:hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Close
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-400 transition-colors shadow-md shadow-red-950/40 disabled:opacity-50"
              >
                {resolving ? "Resolving..." : "Mark as Resolved"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
