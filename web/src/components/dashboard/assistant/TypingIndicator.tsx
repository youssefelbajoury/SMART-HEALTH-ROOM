"use client"

import { motion } from "framer-motion"
import { Bot } from "lucide-react"
import { fadeUp } from "@/lib/motion"
import { Skeleton } from "@/components/ui/skeleton"

export function TypingIndicator() {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-end gap-2.5">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-800 text-indigo-300 day:bg-slate-100 day:text-indigo-600">
        <Bot className="w-4 h-4" />
      </div>
      <div className="dash-glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
      </div>
    </motion.div>
  )
}
