"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Siren, ChevronRight, ShieldCheck, Volume2 } from "lucide-react"
import { useEmergencyStore } from "@/store/emergencyStore"
import { EmergencyDialog } from "./EmergencyDialog"

export function EmergencyBanner() {
  const active = useEmergencyStore((state) => state.active)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -24, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -24, height: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-6 overflow-hidden"
          >
            <div className="relative rounded-2xl border border-red-500/30 day:border-red-200 bg-gradient-to-r from-red-950/80 via-red-900/50 to-slate-900 day:from-red-50 day:via-red-100/70 day:to-white backdrop-blur-md p-5 shadow-lg shadow-red-950/40 day:shadow-red-100">
              <motion.div
                className="absolute inset-0 rounded-2xl border border-red-500/40 day:border-red-300/60 pointer-events-none"
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <motion.div
                    className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Siren className="w-6 h-6" />
                  </motion.div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-wide uppercase">
                        Emergency Active
                      </span>
                      {active.buzzerActive && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 text-[10px] font-medium">
                          <Volume2 className="w-3 h-3" /> Buzzer Active
                        </span>
                      )}
                    </div>
                    <p className="text-white day:text-red-950 font-semibold truncate">{active.message}</p>
                    <p className="text-red-300/70 day:text-red-500 text-xs mt-0.5">
                      Triggered at {active.createdAt.toLocaleTimeString("en-US")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors border border-white/10 day:bg-red-900/5 day:hover:bg-red-900/10 day:text-red-900 day:border-red-900/10"
                  >
                    Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-medium transition-colors shadow-md shadow-red-950/40"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EmergencyDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
