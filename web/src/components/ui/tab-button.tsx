"use client"

import { motion } from "framer-motion"
import { type LucideIcon } from "lucide-react"

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  label: string
  layoutId: string
}

export function TabButton({ active, onClick, icon: Icon, label, layoutId }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? "text-white day:text-slate-900" : "text-slate-400 hover:text-slate-200 day:text-slate-500 day:hover:text-slate-800"
      }`}
    >
      {active && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-xl bg-slate-800 day:bg-slate-100"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className="w-4 h-4 relative" />
      <span className="relative">{label}</span>
    </button>
  )
}
