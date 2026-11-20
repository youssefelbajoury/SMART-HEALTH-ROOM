"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp } from "lucide-react"
import { useSensorStore } from "@/store/sensor-store"
import { useEmergencyStore } from "@/store/emergencyStore"
import { detectTrendWarning } from "@/lib/predictiveWarning"

export function PredictiveWarningBanner() {
  const history = useSensorStore((state) => state.history)
  const activeEmergency = useEmergencyStore((state) => state.active)
  const warning = useMemo(() => (activeEmergency ? null : detectTrendWarning(history)), [history, activeEmergency])

  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md shadow-sm day:border-amber-300 day:bg-amber-50">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 day:text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300 day:text-amber-700">Predictive Warning</p>
              <p className="text-sm text-amber-400/90 day:text-amber-600">{warning.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
