"use client"

import { motion, useReducedMotion } from "framer-motion"
import { DoorOpen, DoorClosed } from "lucide-react"

interface DoorAnimationProps {
  open: boolean
  size?: "sm" | "md"
  showLabel?: boolean
}

const sizes = {
  sm: { frame: 64, height: 84 },
  md: { frame: 92, height: 122 },
}

export function DoorAnimation({ open, size = "md", showLabel = true }: DoorAnimationProps) {
  const reduceMotion = useReducedMotion()
  const { frame, height } = sizes[size]

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-xl bg-slate-950/40 day:bg-slate-100 border border-slate-800 day:border-slate-200 flex items-center justify-center"
        style={{ width: frame + 28, height: height + 20, perspective: 480 }}
      >
        {/* Door frame */}
        <div
          className="relative rounded-sm border-2 border-slate-700 day:border-slate-300 bg-slate-900/70 day:bg-slate-200/50 overflow-visible"
          style={{ width: frame, height, transformStyle: "preserve-3d" }}
        >
          {/* Door leaf, hinged on the left edge */}
          <motion.div
            className="absolute inset-0 origin-left rounded-[2px] bg-gradient-to-br from-slate-500 to-slate-700 day:from-slate-300 day:to-slate-400 border border-slate-400/30 day:border-slate-400/50 shadow-xl"
            style={{ transformStyle: "preserve-3d" }}
            animate={reduceMotion ? undefined : { rotateY: open ? -62 : 0 }}
            initial={false}
            transition={{ type: "spring", stiffness: 85, damping: 15 }}
          >
            {/* Handle */}
            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-300/90 shadow-[0_0_6px_rgba(252,211,77,0.6)]" />
            {/* Panel lines for depth */}
            <span className="absolute inset-2 border border-white/5 day:border-black/5 rounded-[2px]" />
          </motion.div>
        </div>
      </div>

      {showLabel && (
        <span
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            open ? "text-sky-400 day:text-sky-600" : "text-slate-500 day:text-slate-400"
          }`}
        >
          {open ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
          {open ? "Open" : "Closed"}
        </span>
      )}
    </div>
  )
}
