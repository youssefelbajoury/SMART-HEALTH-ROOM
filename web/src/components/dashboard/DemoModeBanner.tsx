"use client"

import { AnimatePresence, motion } from "framer-motion"
import { FlaskConical, Pause, Play, RotateCcw, X } from "lucide-react"
import { useDemoStore, DEMO_STAGE_ORDER } from "@/store/demoStore"

const STAGE_LABEL: Record<string, string> = {
  welcome: "Welcome",
  normal: "Normal Room",
  "sensor-updates": "Sensor Updates",
  warning: "Warning",
  emergency: "Emergency",
  notifications: "Notifications",
  recommendation: "AI Recommendation",
  analytics: "Analytics",
  "health-report": "Health Report",
  recovery: "Recovery",
  finished: "Finished",
}

export function DemoModeBanner() {
  const enabled = useDemoStore((state) => state.enabled)
  const sequenceActive = useDemoStore((state) => state.sequenceActive)
  const isPaused = useDemoStore((state) => state.isPaused)
  const stage = useDemoStore((state) => state.stage)
  const stageIndex = useDemoStore((state) => state.stageIndex)
  const pauseSequence = useDemoStore((state) => state.pauseSequence)
  const resumeSequence = useDemoStore((state) => state.resumeSequence)
  const restartSequence = useDemoStore((state) => state.restartSequence)
  const stopSequence = useDemoStore((state) => state.stopSequence)

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          {sequenceActive ? (
            <div className="flex flex-wrap items-center justify-center gap-3 py-2 px-4 text-xs font-medium text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400">
              <span className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" />
                Guided Demo — {STAGE_LABEL[stage] ?? stage}
              </span>
              <span className="flex items-center gap-1">
                {DEMO_STAGE_ORDER.map((s, i) => (
                  <span key={s} className={`h-1.5 rounded-full transition-all ${i === stageIndex ? "w-4 bg-amber-950" : "w-1.5 bg-amber-950/30"}`} />
                ))}
              </span>
              <span className="flex items-center gap-1">
                {isPaused ? (
                  <button onClick={resumeSequence} aria-label="Resume" className="p-1 rounded hover:bg-amber-950/10 transition-colors">
                    <Play className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={pauseSequence} aria-label="Pause" className="p-1 rounded hover:bg-amber-950/10 transition-colors">
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={restartSequence} aria-label="Restart" className="p-1 rounded hover:bg-amber-950/10 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={stopSequence} aria-label="Stop guided demo" className="p-1 rounded hover:bg-amber-950/10 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400">
              <FlaskConical className="w-3.5 h-3.5" />
              Demo Mode Enabled — all data shown is simulated, not from live hardware
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
